# C4 Level 4 — Code — Hai tính năng chính

> **Trạng thái:** thiết kế code-level mục tiêu cho .NET Backend; repository hiện chưa có mã C#/.NET.

Level 4 zoom từ component **Income & Expense** ở [C3](03-component.md). Hai sơ đồ chỉ định trách nhiệm và hướng phụ thuộc mong muốn, không khóa framework HTTP hoặc thư viện SQL.

## L4.1 Quản lý khoản thu

```mermaid
flowchart TB
    subgraph income["Income Management [Component]"]
        direction TB
        handler["IncomesController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["IncomeService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["IncomePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["IncomeValidator<br/><i>[C# class]</i><br/>Validates dates, amounts, tax,<br/>categories, and status"]
        model["Income<br/><i>[Domain entity]</i><br/>Income data and business rules"]
        repository["IIncomeRepository<br/><i>[C# interface]</i><br/>AddAsync, UpdateAsync,<br/>FindActiveAsync, ListAsync"]
        postgres["IncomeRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i><br/>DML audit is produced by PostgreSQL triggers"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    postgres --> db
    db -.->|"trigger records INSERT/UPDATE/DELETE"| audit

    style handler fill:#1168bd,color:#fff
    style service fill:#0b4f9e,color:#fff
    style policy fill:#1168bd,color:#fff
    style validator fill:#1168bd,color:#fff
    style model fill:#1168bd,color:#fff
    style repository fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
```

Luồng chính: `IncomesController → IncomeService → Policy/Validator/Domain → IIncomeRepository`. Persistence Unit of Work đặt actor context bằng `SET LOCAL app.current_user_id`; PostgreSQL trigger tạo audit entry trong cùng transaction, không để Service chèn thêm một bản audit DML trùng lặp.

## L4.2 Quản lý khoản chi

```mermaid
flowchart TB
    subgraph expense["Expense Management [Component]"]
        direction TB
        handler["ExpensesController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["ExpenseService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["ExpensePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["ExpenseValidator<br/><i>[C# class]</i><br/>Validates dates, payees, amounts,<br/>tax, scope, and status"]
        model["Expense<br/><i>[Domain entity]</i><br/>Expense data and business rules"]
        repository["IExpenseRepository<br/><i>[C# interface]</i><br/>AddAsync, UpdateAsync,<br/>FindActiveAsync, ListAsync"]
        postgres["ExpenseRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i><br/>DML audit is produced by PostgreSQL triggers"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    postgres --> db
    db -.->|"trigger records INSERT/UPDATE/DELETE"| audit

    style handler fill:#1168bd,color:#fff
    style service fill:#0b4f9e,color:#fff
    style policy fill:#1168bd,color:#fff
    style validator fill:#1168bd,color:#fff
    style model fill:#1168bd,color:#fff
    style repository fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
```

Khoản chi dùng cùng pattern với khoản thu nhưng có rule riêng cho người nhận, phạm vi nội địa/quốc tế, phương thức thanh toán và số tiền sau thuế.

## Quy tắc chung cho hai feature

1. Controller không chứa SQL hoặc business rule.
2. Service phụ thuộc repository interface, không phụ thuộc trực tiếp PostgreSQL driver.
3. Policy luôn được thực thi ở backend; việc frontend ẩn nút chỉ phục vụ UX.
4. Validator được tái sử dụng cho form nhập tay và Excel Import.
5. Soft delete cập nhật `deleted_at`, `deleted_by`; không xóa vật lý giao dịch.
6. Domain dùng USD làm đơn vị lưu trữ; EUR chỉ là phép quy đổi hiển thị.

**Trước:** [C3 — Component](03-component.md) · **Chi tiết UML:** [Class và sequence cho Auth/Income/Expense](../uml/README.md) · **Cấu trúc thư mục:** [Frontend và backend ba tầng](../../07-folder-structure.md) · **Liên quan:** [Use cases](../../03-use-cases.md).
