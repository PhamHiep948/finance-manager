# C4 Level 4 — Code — Two Core Features

> **Status:** target code-level design for the .NET Backend; the repository currently has no C#/.NET source code.

Level 4 zooms into the **Income & Expense** component from [C3](03-component.md). The diagrams define intended responsibilities and dependency directions without selecting an HTTP framework style or SQL library.

## L4.1 Income Management

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

Primary flow: `IncomesController → IncomeService → Policy/Validator/Domain → IIncomeRepository`. The Persistence Unit of Work sets the actor context with `SET LOCAL app.current_user_id`; PostgreSQL triggers create audit entries in the same transaction, and the Service does not insert duplicate DML audit records.

## L4.2 Expense Management

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

Expenses use the same pattern as income, with additional rules for payee, domestic/international scope, payment method, and post-tax amount.

## Shared Rules for Both Features

1. Controllers contain neither SQL nor business rules.
2. Services depend on repository interfaces, not directly on the PostgreSQL driver.
3. Policies are always enforced by the backend; frontend control visibility serves UX only.
4. Validators are reused for manual forms and Excel Import.
5. Soft deletion updates `deleted_at` and `deleted_by`; transactions are not physically deleted.
6. The domain stores USD; EUR is a display-only conversion.

**Previous:** [C3 — Component](03-component.md) · **Detailed UML:** [Auth/Income/Expense class and sequence diagrams](../uml/README.md) · **Folder structure:** [Frontend and three-tier backend](../../07-folder-structure.md) · **Related:** [Use cases](../../03-use-cases.md).
