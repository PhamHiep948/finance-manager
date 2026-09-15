# Sơ đồ tuần tự — Auth, Income và Expense

> **Phạm vi:** Bước 6 · **Trạng thái:** Thiết kế, chưa có API chạy thật  
> Các endpoint `/api/v1/...` là provisional contract (hợp đồng tạm thời) cho tới khi bước 4 OpenAPI 3.0 được duyệt.

Sơ đồ tuần tự (sequence diagram) mô tả thứ tự gọi giữa React, tầng Presentation, tầng Application và tầng Data. Mọi nhánh phân quyền đều được kiểm tra ở backend; việc frontend ẩn nút chỉ là UX.

## 1. Đăng nhập — `POST /api/v1/auth/login`

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Web as ReactAuthService
    participant Api as AuthController
    participant Service as AuthService
    participant Users as IUserRepository
    participant Hash as IPasswordHasher
    participant Token as ITokenIssuer
    participant Audit as IAuditLogRepository
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Nhập email và mật khẩu
    Web->>Api: POST /api/v1/auth/login
    Api->>Service: LoginAsync(email, password)
    Service->>Users: FindActiveByEmailAsync(email)
    Users->>Db: SELECT app_users WHERE active AND not deleted
    Db-->>Users: User hoặc null
    Users-->>Service: AppUser hoặc null

    alt Tài khoản không tồn tại hoặc không hoạt động
        Service-->>Api: InvalidCredentials
        Api-->>Web: 401 Unauthorized
        Web-->>User: Thông tin đăng nhập không đúng
    else Tài khoản tồn tại
        Service->>Hash: Verify(password, passwordHash)
        alt Mật khẩu sai
            Hash-->>Service: false
            Service-->>Api: InvalidCredentials
            Api-->>Web: 401 Unauthorized
        else Mật khẩu đúng
            Hash-->>Service: true
            Service->>Token: Issue(user)
            Token-->>Service: AccessToken + ExpiresAt
            Service->>Uow: ExecuteAsync(user.id)
            Uow->>Db: BEGIN
            Uow->>Db: SET LOCAL app.current_user_id
            Service->>Users: UpdateLastLoginAsync(userId, now)
            Users->>Db: UPDATE last_login_at
            Service->>Audit: AddAsync(loginAudit)
            Audit->>Db: INSERT audit_logs action LOGIN
            Uow->>Db: COMMIT
            Service-->>Api: AuthResult
            Api-->>Web: 200 LoginResponse
            Web-->>User: Điều hướng Dashboard
        end
    end
```

API dùng cùng thông báo `401` cho email không tồn tại và mật khẩu sai để hạn chế account enumeration (dò tài khoản).

## 2. Tạo khoản thu — `POST /api/v1/incomes`

```mermaid
sequenceDiagram
    actor User as AdminOwnerEmployee
    participant Web as IncomeServiceJS
    participant Api as IncomesController
    participant Policy as IncomePolicy
    participant Validator as IncomeValidator
    participant Service as IncomeService
    participant IncomeRepo as IIncomeRepository
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Gửi form khoản thu
    Web->>Api: POST /api/v1/incomes + Bearer token

    alt Token thiếu hoặc không hợp lệ
        Api-->>Web: 401 Unauthorized
    else Actor đã xác thực
        Api->>Service: CreateAsync(draft, actor)
        Service->>Policy: EnsureCanCreate(actor)
        alt Viewer không có quyền tạo
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Có quyền tạo
            Service->>Validator: Validate(draft)
            alt Dữ liệu không hợp lệ
                Validator-->>Service: Field errors
                Service-->>Api: ValidationFailure
                Api-->>Web: 400 ProblemDetails + field errors
            else Dữ liệu hợp lệ
                Service->>Uow: ExecuteAsync(actor.userId)
                Uow->>Db: BEGIN
                Uow->>Db: SET LOCAL app.current_user_id
                Service->>IncomeRepo: AddAsync(income)
                IncomeRepo->>Db: INSERT incomes
                Db->>Db: AFTER INSERT trigger writes audit_logs
                Uow->>Db: COMMIT
                Service-->>Api: Income
                Api-->>Web: 201 Created + IncomeResponse
                Web-->>User: Hiện bản ghi mới
            end
        end
    end
```

Nếu insert khoản thu hoặc audit trigger thất bại, `IUnitOfWork` rollback (hoàn tác) toàn bộ transaction. Service không chèn audit DML lần thứ hai.

## 3. Nhân viên sửa khoản thu — `PUT /api/v1/incomes/{id}`

```mermaid
sequenceDiagram
    actor Employee as Nhân viên
    participant Web as IncomeServiceJS
    participant Api as IncomesController
    participant Service as IncomeService
    participant Repo as IIncomeRepository
    participant Policy as IncomePolicy
    participant Validator as IncomeValidator
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    Employee->>Web: Gửi form chỉnh sửa
    Web->>Api: PUT /api/v1/incomes/{id}
    Api->>Service: UpdateAsync(id, draft, actor)
    Service->>Repo: FindActiveAsync(id)
    Repo->>Db: SELECT WHERE id AND deleted_at IS NULL

    alt Không tìm thấy hoặc đã xóa
        Repo-->>Service: null
        Service-->>Api: NotFound
        Api-->>Web: 404 Not Found
    else Tìm thấy bản ghi
        Repo-->>Service: Income
        Service->>Policy: EnsureCanUpdate(actor, income)
        alt created_by khác actor.userId
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Nhân viên sở hữu bản ghi
            Service->>Validator: Validate(draft)
            alt Dữ liệu không hợp lệ
                Validator-->>Service: Field errors
                Service-->>Api: ValidationFailure
                Api-->>Web: 400 ProblemDetails + field errors
            else Dữ liệu hợp lệ
                Service->>Uow: ExecuteAsync(actor.userId)
                Uow->>Db: BEGIN
                Uow->>Db: SET LOCAL app.current_user_id
                Service->>Repo: UpdateAsync(income)
                Repo->>Db: UPDATE incomes
                Db->>Db: AFTER UPDATE trigger writes audit_logs
                Uow->>Db: COMMIT
                Service-->>Api: Income
                Api-->>Web: 200 IncomeResponse
            end
        end
    end
```

Admin và Shop Owner không bị giới hạn `created_by`; Employee chỉ sửa bản ghi của chính mình.

## 4. Tạo khoản chi — `POST /api/v1/expenses`

```mermaid
sequenceDiagram
    actor User as AdminOwnerEmployee
    participant Web as ExpenseServiceJS
    participant Api as ExpensesController
    participant Service as ExpenseService
    participant Policy as ExpensePolicy
    participant Validator as ExpenseValidator
    participant Repo as IExpenseRepository
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Gửi form khoản chi
    Web->>Api: POST /api/v1/expenses
    Api->>Service: CreateAsync(draft, actor)
    Service->>Policy: EnsureCanCreate(actor)

    alt Không đủ quyền
        Policy-->>Service: Forbidden
        Service-->>Api: Forbidden
        Api-->>Web: 403 Forbidden
    else Có quyền
        Service->>Validator: Validate(draft)
        Validator->>Validator: Kiểm tra amount, tax, scope, payee
        alt Dữ liệu không hợp lệ
            Validator-->>Service: Field errors
            Service-->>Api: ValidationFailure
            Api-->>Web: 400 ProblemDetails + field errors
        else Dữ liệu hợp lệ
            Service->>Uow: ExecuteAsync(actor.userId)
            Uow->>Db: BEGIN
            Uow->>Db: SET LOCAL app.current_user_id
            Service->>Repo: AddAsync(expense)
            Repo->>Db: INSERT expenses
            Db->>Db: AFTER INSERT trigger writes audit_logs
            Uow->>Db: COMMIT
            Service-->>Api: Expense
            Api-->>Web: 201 Created + ExpenseResponse
        end
    end
```

`ExpenseValidator` đối chiếu `AmountAfterTax` với quy tắc đã thống nhất trong requirements/OpenAPI; client không phải nguồn quyết định cuối cùng.

## 5. Xóa mềm khoản chi — `DELETE /api/v1/expenses/{id}`

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Web as ExpenseServiceJS
    participant Api as ExpensesController
    participant Service as ExpenseService
    participant Repo as IExpenseRepository
    participant Policy as ExpensePolicy
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Xác nhận xóa
    Web->>Api: DELETE /api/v1/expenses/{id}
    Api->>Service: SoftDeleteAsync(id, actor)
    Service->>Repo: FindActiveAsync(id)
    Repo->>Db: SELECT active expense

    alt Không tìm thấy hoặc đã xóa
        Repo-->>Service: null
        Service-->>Api: NotFound
        Api-->>Web: 404 Not Found
    else Tìm thấy
        Repo-->>Service: Expense
        Service->>Policy: EnsureCanDelete(actor, expense)
        alt Employee hoặc Viewer
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Admin hoặc Shop Owner
            Service->>Uow: ExecuteAsync(actor.userId)
            Uow->>Db: BEGIN
            Uow->>Db: SET LOCAL app.current_user_id
            Service->>Repo: UpdateAsync(expense with deleted fields)
            Repo->>Db: UPDATE deleted_at, deleted_by
            Db->>Db: AFTER UPDATE trigger writes audit_logs
            Uow->>Db: COMMIT
            Service-->>Api: Completed
            Api-->>Web: 204 No Content
            Web-->>User: Xóa dòng khỏi danh sách active
        end
    end
```

Endpoint dùng HTTP `DELETE`, nhưng persistence thực hiện soft delete; dữ liệu không bị xóa vật lý.

## 6. Quy ước lỗi chung

| HTTP | Thuật ngữ | Khi dùng |
|---|---|---|
| `400` | Bad Request | Request/field không hợp lệ |
| `401` | Unauthorized | Chưa xác thực hoặc token không hợp lệ |
| `403` | Forbidden | Đã xác thực nhưng thiếu quyền |
| `404` | Not Found | Bản ghi không tồn tại hoặc đã soft delete |
| `409` | Conflict | Vi phạm unique/business conflict nếu có |
| `500` | Internal Server Error | Lỗi không dự kiến; rollback và trả request/error id |

Error body dự kiến dùng RFC 7807 Problem Details; cấu trúc chính xác sẽ do OpenAPI bước 4 quyết định.

**Liên quan:** [Class diagrams](01-class-diagrams.md) · [Runtime View tổng quát](../arc42/06-runtime-view.md) · [Cấu trúc thư mục](../../07-folder-structure.md)
