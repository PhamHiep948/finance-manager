# Sequence Diagrams — Authentication, Income, and Expense

> **Scope:** Step 6 · **Status:** Design only; no working API  
> The `/api/v1/...` endpoints are a provisional contract until the Step 4 OpenAPI 3.0 specification is approved.

The sequence diagrams describe calls between React, Presentation, Application, and Data. Every authorization path is checked by the backend; hiding frontend controls is UX only.

## 1. Login — `POST /api/v1/auth/login`

```mermaid
sequenceDiagram
    actor User as User
    participant Web as ReactAuthService
    participant Api as AuthController
    participant Service as AuthService
    participant Users as IUserRepository
    participant Hash as IPasswordHasher
    participant Token as ITokenIssuer
    participant Audit as IAuditLogRepository
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Enter email and password
    Web->>Api: POST /api/v1/auth/login
    Api->>Service: LoginAsync(email, password)
    Service->>Users: FindActiveByEmailAsync(email)
    Users->>Db: SELECT app_users WHERE active AND not deleted
    Db-->>Users: User or null
    Users-->>Service: AppUser or null

    alt Account missing or inactive
        Service-->>Api: InvalidCredentials
        Api-->>Web: 401 Unauthorized
        Web-->>User: Invalid credentials
    else Account exists
        Service->>Hash: Verify(password, passwordHash)
        alt Incorrect password
            Hash-->>Service: false
            Service-->>Api: InvalidCredentials
            Api-->>Web: 401 Unauthorized
        else Correct password
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
            Web-->>User: Navigate to Dashboard
        end
    end
```

The API returns the same `401` response for an unknown email and an incorrect password to reduce account-enumeration risk.

## 2. Create Income — `POST /api/v1/incomes`

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

    User->>Web: Submit income form
    Web->>Api: POST /api/v1/incomes + Bearer token

    alt Missing or invalid token
        Api-->>Web: 401 Unauthorized
    else Authenticated actor
        Api->>Service: CreateAsync(draft, actor)
        Service->>Policy: EnsureCanCreate(actor)
        alt Viewer cannot create
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Authorized to create
            Service->>Validator: Validate(draft)
            alt Invalid data
                Validator-->>Service: Field errors
                Service-->>Api: ValidationFailure
                Api-->>Web: 400 ProblemDetails + field errors
            else Valid data
                Service->>Uow: ExecuteAsync(actor.userId)
                Uow->>Db: BEGIN
                Uow->>Db: SET LOCAL app.current_user_id
                Service->>IncomeRepo: AddAsync(income)
                IncomeRepo->>Db: INSERT incomes
                Db->>Db: AFTER INSERT trigger writes audit_logs
                Uow->>Db: COMMIT
                Service-->>Api: Income
                Api-->>Web: 201 Created + IncomeResponse
                Web-->>User: Display new record
            end
        end
    end
```

If the income insert or audit trigger fails, `IUnitOfWork` rolls back the entire transaction. The Service does not insert a second DML audit record.

## 3. Employee Updates Income — `PUT /api/v1/incomes/{id}`

```mermaid
sequenceDiagram
    actor Employee as Employee
    participant Web as IncomeServiceJS
    participant Api as IncomesController
    participant Service as IncomeService
    participant Repo as IIncomeRepository
    participant Policy as IncomePolicy
    participant Validator as IncomeValidator
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    Employee->>Web: Submit edit form
    Web->>Api: PUT /api/v1/incomes/{id}
    Api->>Service: UpdateAsync(id, draft, actor)
    Service->>Repo: FindActiveAsync(id)
    Repo->>Db: SELECT WHERE id AND deleted_at IS NULL

    alt Missing or already deleted
        Repo-->>Service: null
        Service-->>Api: NotFound
        Api-->>Web: 404 Not Found
    else Record found
        Repo-->>Service: Income
        Service->>Policy: EnsureCanUpdate(actor, income)
        alt created_by differs from actor.userId
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Employee owns the record
            Service->>Validator: Validate(draft)
            alt Invalid data
                Validator-->>Service: Field errors
                Service-->>Api: ValidationFailure
                Api-->>Web: 400 ProblemDetails + field errors
            else Valid data
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

Administrators and Shop Owners are not restricted by `created_by`; Employees may update only their own records.

## 4. Create Expense — `POST /api/v1/expenses`

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

    User->>Web: Submit expense form
    Web->>Api: POST /api/v1/expenses
    Api->>Service: CreateAsync(draft, actor)
    Service->>Policy: EnsureCanCreate(actor)

    alt Insufficient permission
        Policy-->>Service: Forbidden
        Service-->>Api: Forbidden
        Api-->>Web: 403 Forbidden
    else Authorized
        Service->>Validator: Validate(draft)
        Validator->>Validator: Check amount, tax, scope, and payee
        alt Invalid data
            Validator-->>Service: Field errors
            Service-->>Api: ValidationFailure
            Api-->>Web: 400 ProblemDetails + field errors
        else Valid data
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

`ExpenseValidator` checks `AmountAfterTax` against the rule agreed in requirements/OpenAPI; the client is not the authoritative source.

## 5. Soft-Delete Expense — `DELETE /api/v1/expenses/{id}`

```mermaid
sequenceDiagram
    actor User as User
    participant Web as ExpenseServiceJS
    participant Api as ExpensesController
    participant Service as ExpenseService
    participant Repo as IExpenseRepository
    participant Policy as ExpensePolicy
    participant Uow as IUnitOfWork
    participant Db as PostgreSQL

    User->>Web: Confirm deletion
    Web->>Api: DELETE /api/v1/expenses/{id}
    Api->>Service: SoftDeleteAsync(id, actor)
    Service->>Repo: FindActiveAsync(id)
    Repo->>Db: SELECT active expense

    alt Missing or already deleted
        Repo-->>Service: null
        Service-->>Api: NotFound
        Api-->>Web: 404 Not Found
    else Record found
        Repo-->>Service: Expense
        Service->>Policy: EnsureCanDelete(actor, expense)
        alt Employee or Viewer
            Policy-->>Service: Forbidden
            Service-->>Api: Forbidden
            Api-->>Web: 403 Forbidden
        else Administrator or Shop Owner
            Service->>Uow: ExecuteAsync(actor.userId)
            Uow->>Db: BEGIN
            Uow->>Db: SET LOCAL app.current_user_id
            Service->>Repo: UpdateAsync(expense with deleted fields)
            Repo->>Db: UPDATE deleted_at, deleted_by
            Db->>Db: AFTER UPDATE trigger writes audit_logs
            Uow->>Db: COMMIT
            Service-->>Api: Completed
            Api-->>Web: 204 No Content
            Web-->>User: Remove row from active list
        end
    end
```

The endpoint uses HTTP `DELETE`, but persistence performs a soft deletion; data is not physically deleted.

## 6. Common Error Conventions

| HTTP | Term | Usage |
|---|---|---|
| `400` | Bad Request | Invalid request or field |
| `401` | Unauthorized | Unauthenticated or invalid token |
| `403` | Forbidden | Authenticated but not authorized |
| `404` | Not Found | Record missing or soft-deleted |
| `409` | Conflict | Unique or business conflict, when applicable |
| `500` | Internal Server Error | Unexpected failure; roll back and return a request/error ID |

Error bodies are expected to use RFC 7807 Problem Details; Step 4 OpenAPI will define the exact structure.

**Related:** [Class diagrams](01-class-diagrams.md) · [General Runtime View](../arc42/06-runtime-view.md) · [Folder structure](../../07-folder-structure.md)
