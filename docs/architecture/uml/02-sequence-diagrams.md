# Sequence Diagrams — Authentication, Income, and Expense

> **Scope:** Step 6 · **Status:** Executable baseline implemented  
> Các endpoint `/api/v1/...` tuân theo [OpenAPI 3.0.4](../../api/openapi.yaml).

Các sơ đồ dùng cùng một mẫu trình bày: **Actor → Page → Form → Controller → Application Service → Repository → PostgreSQL**. Request dùng mũi tên liền, response dùng mũi tên nét đứt; `alt` mô tả các kết quả loại trừ nhau và `opt` mô tả xử lý tùy chọn.

## 1. Đăng nhập — `POST /api/v1/auth/login`

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Page as Trang đăng nhập
    participant Form as Login Form
    participant API as AuthController
    participant Service as AuthenticationService
    participant Repo as IUserRepository
    participant Password as PasswordService
    participant Token as TokenService
    participant DB as PostgreSQL

    User->>Page: Mở trang đăng nhập
    activate Page
    Page->>Form: Hiển thị form đăng nhập
    activate Form
    User->>Form: Nhập email và mật khẩu
    User->>Form: Nhấn Đăng nhập

    alt Email hoặc mật khẩu để trống
        Form-->>User: Hiển thị lỗi bắt buộc nhập
    else Dữ liệu đầu vào hợp lệ
        Form->>API: POST /api/v1/auth/login
        activate API
        API->>Service: LoginAsync(email, password)
        activate Service
        Service->>Repo: FindByEmailAsync(email)
        activate Repo
        Repo->>DB: SELECT app_users theo email
        activate DB
        DB-->>Repo: UserAccount hoặc null
        deactivate DB
        Repo-->>Service: UserAccount hoặc null
        deactivate Repo

        alt Không tồn tại hoặc tài khoản bị khóa
            Service-->>API: INVALID_CREDENTIALS
            API-->>Form: 401 Unauthorized
            Form-->>User: Email hoặc mật khẩu không chính xác
        else Tài khoản hoạt động
            Service->>Password: Verify(passwordHash, password)
            activate Password
            Password-->>Service: Kết quả xác minh
            deactivate Password
            alt Mật khẩu không đúng
                Service-->>API: INVALID_CREDENTIALS
                API-->>Form: 401 Unauthorized
                Form-->>User: Email hoặc mật khẩu không chính xác
            else Mật khẩu đúng
                Service->>Token: Issue(user, expiresAt)
                activate Token
                Token-->>Service: Bearer token
                deactivate Token
                Service->>Repo: Update lastLoginAt
                activate Repo
                Repo->>DB: UPDATE app_users
                activate DB
                DB-->>Repo: Cập nhật thành công
                deactivate DB
                Repo-->>Service: Hoàn thành
                deactivate Repo
                Service-->>API: LoginResult
                API-->>Form: 200 Token + hồ sơ người dùng
                Form->>Page: Lưu token và session
                Page-->>User: Chuyển đến Dashboard
            end
        end
        deactivate Service
        deactivate API
    end
    deactivate Form
    deactivate Page
```

API cố ý trả cùng một lỗi `401` cho email không tồn tại, tài khoản bị khóa và mật khẩu sai để tránh dò tìm tài khoản.

## 2. Thêm khoản thu — `POST /api/v1/incomes`

```mermaid
sequenceDiagram
    actor User as Admin / Chủ shop / Nhân viên
    participant Page as Trang khoản thu
    participant Form as Income Form
    participant API as IncomesController
    participant Service as LedgerService
    participant Repo as ILedgerRepository
    participant DB as PostgreSQL

    User->>Page: Chọn Thêm khoản thu
    activate Page
    Page->>Form: Mở form khoản thu
    activate Form
    User->>Form: Nhập thông tin khoản thu
    User->>Form: Nhấn Lưu

    opt Trường bắt buộc thiếu hoặc sai định dạng
        Form-->>User: Hiển thị lỗi tại trường nhập
    end

    Form->>API: POST /api/v1/incomes + Bearer token
    activate API
    alt Token thiếu hoặc không hợp lệ
        API-->>Form: 401 Unauthorized
    else Đã xác thực
        API->>Service: CreateAsync(INCOME, request, actor)
        activate Service
        alt Viewer không có quyền tạo
            Service-->>API: Forbidden
            API-->>Form: 403 Forbidden
            Form-->>User: Hiển thị thông báo không có quyền
        else Có quyền tạo
            Service->>Service: Kiểm tra mô tả, số tiền, thuế và tiền sau thuế
            alt Dữ liệu nghiệp vụ không hợp lệ
                Service-->>API: Validation error
                API-->>Form: 400 Problem Details
                Form-->>User: Hiển thị lỗi dữ liệu
            else Dữ liệu hợp lệ
                Service->>Repo: AddAsync(income)
                activate Repo
                Repo->>DB: INSERT incomes
                activate DB
                DB->>DB: Trigger ghi audit_logs
                DB-->>Repo: ID khoản thu mới
                deactivate DB
                Repo-->>Service: LedgerEntry
                deactivate Repo
                Service-->>API: Khoản thu đã tạo
                API-->>Form: 201 Created
                Form->>Page: Đóng form và tải lại danh sách
                Page-->>User: Hiển thị khoản thu mới
            end
        end
        deactivate Service
    end
    deactivate API
    deactivate Form
    deactivate Page
```

## 3. Nhân viên sửa khoản thu — `PUT /api/v1/incomes/{id}`

```mermaid
sequenceDiagram
    actor Employee as Nhân viên
    participant Page as Trang khoản thu
    participant Form as Income Edit Form
    participant API as IncomesController
    participant Service as LedgerService
    participant Repo as ILedgerRepository
    participant DB as PostgreSQL

    Employee->>Page: Chọn sửa khoản thu
    activate Page
    Page->>Form: Mở form với dữ liệu hiện tại
    activate Form
    Employee->>Form: Thay đổi thông tin và nhấn Lưu
    Form->>API: PUT /api/v1/incomes/{id}
    activate API
    API->>Service: UpdateAsync(INCOME, id, request, actor)
    activate Service
    Service->>Repo: GetAsync(INCOME, id)
    activate Repo
    Repo->>DB: SELECT khoản thu đang hoạt động
    activate DB
    DB-->>Repo: Bản ghi hoặc null
    deactivate DB
    Repo-->>Service: LedgerEntry hoặc null
    deactivate Repo

    alt Không tồn tại hoặc đã bị xóa mềm
        Service-->>API: NotFound
        API-->>Form: 404 Not Found
        Form-->>Employee: Thông báo không tìm thấy khoản thu
    else Tìm thấy khoản thu
        alt createdBy khác ID nhân viên
            Service-->>API: Forbidden
            API-->>Form: 403 Forbidden
            Form-->>Employee: Không được sửa dữ liệu của người khác
        else Nhân viên sở hữu bản ghi
            Service->>Service: Validate dữ liệu cập nhật
            alt Dữ liệu không hợp lệ
                Service-->>API: Validation error
                API-->>Form: 400 Problem Details
            else Dữ liệu hợp lệ
                Service->>Repo: UpdateAsync(income)
                activate Repo
                Repo->>DB: UPDATE incomes
                activate DB
                DB->>DB: Trigger ghi audit_logs
                DB-->>Repo: Cập nhật thành công
                deactivate DB
                Repo-->>Service: Hoàn thành
                deactivate Repo
                Service-->>API: Khoản thu đã cập nhật
                API-->>Form: 200 OK
                Form->>Page: Đóng form và tải lại dữ liệu
                Page-->>Employee: Hiển thị kết quả cập nhật
            end
        end
    end
    deactivate Service
    deactivate API
    deactivate Form
    deactivate Page
```

Admin và Chủ shop có thể sửa mọi bản ghi; Nhân viên chỉ được sửa bản ghi do mình tạo.

## 4. Thêm khoản chi — `POST /api/v1/expenses`

```mermaid
sequenceDiagram
    actor User as Admin / Chủ shop / Nhân viên
    participant Page as Trang khoản chi
    participant Form as Expense Form
    participant API as ExpensesController
    participant Service as LedgerService
    participant Repo as ILedgerRepository
    participant DB as PostgreSQL

    User->>Page: Chọn Thêm khoản chi
    activate Page
    Page->>Form: Mở form khoản chi
    activate Form
    User->>Form: Nhập thông tin và nhấn Lưu
    Form->>API: POST /api/v1/expenses + Bearer token
    activate API

    alt Token thiếu hoặc không hợp lệ
        API-->>Form: 401 Unauthorized
    else Đã xác thực
        API->>Service: CreateAsync(EXPENSE, request, actor)
        activate Service
        alt Viewer không có quyền tạo
            Service-->>API: Forbidden
            API-->>Form: 403 Forbidden
        else Có quyền tạo
            Service->>Service: Kiểm tra số tiền, thuế và tiền sau thuế
            alt Dữ liệu không hợp lệ
                Service-->>API: Validation error
                API-->>Form: 400 Problem Details
                Form-->>User: Hiển thị lỗi dữ liệu
            else Dữ liệu hợp lệ
                Service->>Repo: AddAsync(expense)
                activate Repo
                Repo->>DB: INSERT expenses
                activate DB
                DB->>DB: Trigger ghi audit_logs
                DB-->>Repo: ID khoản chi mới
                deactivate DB
                Repo-->>Service: LedgerEntry
                deactivate Repo
                Service-->>API: Khoản chi đã tạo
                API-->>Form: 201 Created
                Form->>Page: Đóng form và tải lại danh sách
                Page-->>User: Hiển thị khoản chi mới
            end
        end
        deactivate Service
    end
    deactivate API
    deactivate Form
    deactivate Page
```

## 5. Xóa mềm khoản chi — `DELETE /api/v1/expenses/{id}`

```mermaid
sequenceDiagram
    actor User as Người dùng
    participant Page as Trang khoản chi
    participant Dialog as Hộp thoại xác nhận
    participant API as ExpensesController
    participant Service as LedgerService
    participant Repo as ILedgerRepository
    participant DB as PostgreSQL

    User->>Page: Chọn Xóa khoản chi
    activate Page
    Page->>Dialog: Hiển thị xác nhận xóa
    activate Dialog

    alt Người dùng chọn Hủy
        Dialog-->>Page: Đóng hộp thoại
    else Người dùng xác nhận
        Dialog->>API: DELETE /api/v1/expenses/{id}
        activate API
        API->>Service: DeleteAsync(EXPENSE, id, actor)
        activate Service
        alt Nhân viên hoặc Viewer
            Service-->>API: Forbidden
            API-->>Dialog: 403 Forbidden
            Dialog-->>User: Không có quyền xóa
        else Admin hoặc Chủ shop
            Service->>Repo: GetAsync(EXPENSE, id)
            activate Repo
            Repo->>DB: SELECT khoản chi đang hoạt động
            activate DB
            DB-->>Repo: Bản ghi hoặc null
            deactivate DB
            Repo-->>Service: LedgerEntry hoặc null
            deactivate Repo
            alt Không tồn tại hoặc đã xóa
                Service-->>API: NotFound
                API-->>Dialog: 404 Not Found
            else Tìm thấy bản ghi
                Service->>Repo: Update deletedAt và deletedBy
                activate Repo
                Repo->>DB: UPDATE expenses
                activate DB
                DB->>DB: Trigger ghi audit_logs
                DB-->>Repo: Cập nhật thành công
                deactivate DB
                Repo-->>Service: Hoàn thành
                deactivate Repo
                Service-->>API: Hoàn thành
                API-->>Dialog: 204 No Content
                Dialog->>Page: Đóng và tải lại danh sách
                Page-->>User: Bản ghi biến mất khỏi danh sách hoạt động
            end
        end
        deactivate Service
        deactivate API
    end
    deactivate Dialog
    deactivate Page
```

Endpoint dùng HTTP `DELETE`, nhưng database chỉ cập nhật `deleted_at` và `deleted_by`; bản ghi không bị xóa vật lý.

## 6. Quy ước lỗi chung

| HTTP | Ý nghĩa | Trường hợp sử dụng |
|---|---|---|
| `400` | Bad Request | Request hoặc dữ liệu nghiệp vụ không hợp lệ |
| `401` | Unauthorized | Thiếu token, token sai hoặc hết hạn |
| `403` | Forbidden | Đã đăng nhập nhưng không có quyền |
| `404` | Not Found | Không tồn tại hoặc đã bị xóa mềm |
| `409` | Conflict | Trùng dữ liệu hoặc xung đột nghiệp vụ |
| `500` | Internal Server Error | Lỗi ngoài dự kiến, trả kèm trace ID |

Response lỗi sử dụng cấu trúc RFC 7807 trong [OpenAPI contract](../../api/openapi.yaml).

**Related:** [Class diagrams](01-class-diagrams.md) · [General Runtime View](../arc42/06-runtime-view.md) · [Folder structure](../../07-folder-structure.md)
