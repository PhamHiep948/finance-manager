# C4 Level 4 — Code — Hai tính năng chính

> **Trạng thái:** thiết kế code-level mục tiêu cho .NET Backend; repository hiện chưa có mã C#/.NET.

Level 4 zoom từ component **Income & Expense** ở [C3](03-component.md). Hai sơ đồ chỉ định trách nhiệm và hướng phụ thuộc mong muốn, không khóa framework HTTP hoặc thư viện SQL.

## L4.1 Quản lý khoản thu

```mermaid
flowchart TB
    subgraph income["Income Management [Component]"]
        direction TB
        handler["IncomeController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["IncomeService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["IncomePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["IncomeValidator<br/><i>[C# class]</i><br/>Validates dates, amounts, tax,<br/>categories, and status"]
        model["Income<br/><i>[Domain entity]</i><br/>Income data and business rules"]
        repository["IIncomeRepository<br/><i>[C# interface]</i><br/>SaveAsync, FindAsync, ListAsync, SoftDeleteAsync"]
        postgres["PostgresIncomeRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    service -.->|"writes create/update/delete events"| audit
    postgres --> db

    style handler fill:#1168bd,color:#fff
    style service fill:#0b4f9e,color:#fff
    style policy fill:#1168bd,color:#fff
    style validator fill:#1168bd,color:#fff
    style model fill:#1168bd,color:#fff
    style repository fill:#1168bd,color:#fff
    style postgres fill:#1168bd,color:#fff
```

Luồng chính: `IncomeController → IncomeService → Policy/Validator/Domain → IIncomeRepository`. Mọi thay đổi thành công phải tạo audit entry trong cùng transaction nghiệp vụ khi triển khai.

## L4.2 Quản lý khoản chi

```mermaid
flowchart TB
    subgraph expense["Expense Management [Component]"]
        direction TB
        handler["ExpenseController<br/><i>[ASP.NET Core Controller]</i><br/>Receives requests and maps DTOs<br/>and HTTP responses"]
        service["ExpenseService<br/><i>[C# class]</i><br/>Coordinates create, update,<br/>soft delete, and queries"]
        policy["ExpensePolicy<br/><i>[C# class]</i><br/>Checks roles and employee<br/>record-ownership permissions"]
        validator["ExpenseValidator<br/><i>[C# class]</i><br/>Validates dates, payees, amounts,<br/>tax, scope, and status"]
        model["Expense<br/><i>[Domain entity]</i><br/>Expense data and business rules"]
        repository["IExpenseRepository<br/><i>[C# interface]</i><br/>SaveAsync, FindAsync, ListAsync, SoftDeleteAsync"]
        postgres["PostgresExpenseRepository<br/><i>[C# class]</i><br/>Implements the repository with SQL"]

        handler --> service
        service --> policy
        service --> validator
        service --> model
        service --> repository
        postgres -.->|"implements"| repository
    end

    api["HTTP API<br/><i>[Component]</i>"]
    identity["Identity & Access<br/><i>[Component]</i>"]
    audit["Audit Log<br/><i>[Component]</i>"]
    db[("PostgreSQL<br/><i>[Container: Database]</i>")]

    api --> handler
    policy --> identity
    service -.->|"writes create/update/delete events"| audit
    postgres --> db

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

**Trước:** [C3 — Component](03-component.md) · **Liên quan:** [Use cases](../../03-use-cases.md).
