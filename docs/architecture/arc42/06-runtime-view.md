# 6. Runtime View

Các sequence dưới đây mô tả kiến trúc đích. Endpoint cụ thể và cơ chế token/session vẫn TBD.

## 6.1 Đăng nhập

```mermaid
sequenceDiagram
    actor U as Người dùng
    participant W as React Web
    participant A as HTTP API
    participant I as Identity & Access
    participant P as Persistence
    participant D as PostgreSQL
    U->>W: Nhập email và mật khẩu
    W->>A: Gửi yêu cầu đăng nhập
    A->>I: Validate credential
    I->>P: Tìm tài khoản đang active
    P->>D: SELECT user
    D-->>P: User + password hash + role
    P-->>I: User
    I-->>A: Session/token hoặc lỗi
    A-->>W: User an toàn + credential
    W-->>U: Dashboard hoặc thông báo lỗi
```

## 6.2 Tạo hoặc sửa khoản thu/chi

```mermaid
sequenceDiagram
    actor U as Admin/Owner/Employee
    participant W as React Web
    participant A as HTTP API
    participant I as Identity & Access
    participant L as Income & Expense
    participant R as Persistence
    participant D as PostgreSQL
    U->>W: Gửi form giao dịch
    W->>A: POST/PUT transaction
    A->>I: Kiểm tra session + permission
    I->>L: Actor context đã xác thực
    L->>L: Validate fields, tax, own-record rule
    L->>R: Begin transaction
    R->>D: INSERT/UPDATE transaction + audit
    D-->>R: Commit
    R-->>L: Record đã lưu
    L-->>A: DTO
    A-->>W: 200/201 hoặc error contract
```

Nhân viên chỉ sửa record có `createdBy` bằng user hiện tại. Admin và Chủ shop mới được soft delete.

## 6.3 Import Excel

```mermaid
sequenceDiagram
    actor U as Admin/Owner/Employee
    participant W as React Web
    participant A as HTTP API
    participant X as Excel Import
    participant L as Income & Expense
    participant R as Persistence
    U->>W: Chọn file và loại dữ liệu
    W->>A: Upload/preview request
    A->>X: Validate type, header, rows
    X-->>W: Preview + lỗi từng dòng
    U->>W: Xác nhận import
    W->>A: Process batch
    A->>X: Import valid rows
    loop mỗi dòng hợp lệ
        X->>L: Tạo income/expense qua domain rule
    end
    X->>R: Lưu batch result + audit
    R-->>W: Số thành công/thất bại
```

## 6.4 Dashboard và báo cáo

```mermaid
sequenceDiagram
    actor U as Người có quyền
    participant W as React Web
    participant A as HTTP API
    participant Q as Dashboard & Reporting
    participant R as Persistence
    participant D as PostgreSQL
    U->>W: Chọn kỳ, loại, nguồn, danh mục
    W->>A: GET report query
    A->>Q: Filter + actor context
    Q->>R: Aggregate query
    R->>D: SELECT/SUM/GROUP BY active records
    D-->>Q: Aggregate rows
    Q-->>W: KPI, series, category breakdown
    W-->>U: Chart/table; quy đổi USD→EUR nếu chọn
```

## 6.5 Lỗi chung

| Tình huống | Kết quả mong đợi |
|---|---|
| Chưa đăng nhập | `401` và điều hướng login |
| Không đủ quyền | `403`; không dựa vào việc nút đã ẩn |
| Dữ liệu sai | `400/422` với lỗi theo field |
| Record không tồn tại/đã xóa | `404` |
| Database lỗi | Transaction rollback; trả error id, không lộ SQL |

Các sequence code-level (mức lớp) cho Auth, Income và Expense được mô tả tại [UML Sequence Diagrams](../uml/02-sequence-diagrams.md). Endpoint trong tài liệu đó là provisional contract cho tới khi OpenAPI 3.0 được hoàn thành.
