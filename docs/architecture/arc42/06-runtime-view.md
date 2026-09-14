# 6. Runtime View

Every participant must exist in [Section 5](05-building-block-view.md). React hides buttons, but **every write operation** passes through Identity.

The REST paths below are **logical** (the OpenAPI specification is not finalized yet).

## 6.1 Scenario — Login

Actor: any role. User must have `is_active`. Audit action: `LOGIN`. Never return password/hash.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant P as Persistence
  participant DB as PostgreSQL
  participant Aud as Audit Log

  User->>React: Email + password
  React->>API: POST login (JSON)
  API->>Id: Authenticate
  Id->>P: Load user by email
  P->>DB: SELECT app_users
  alt Invalid credentials or inactive
    Id-->>React: 401
  else Success
    Id->>P: last_login_at
    Id->>Aud: LOGIN
    Aud->>P: INSERT audit_logs
    P->>DB: INSERT
    Id-->>React: Session credential (mechanism To Be Determined)
    React-->>User: Dashboard
  end
```

## 6.2 Scenario — Create Income

Actor: ADMIN, SHOP_OWNER, EMPLOYEE. `source = MANUAL`. `currency_code = USD`.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant Inc as Income Management
  participant Cat as Category Management
  participant P as Persistence
  participant DB as PostgreSQL
  participant Aud as Audit Log
  participant Rep as Dashboard and Reporting

  User->>React: Submit income form
  React->>API: POST /incomes
  API->>Id: Authorize incomeCreate
  alt VIEWER or permission missing
    Id-->>React: 403 Forbidden
  else Allowed
    API->>Inc: Create
    Inc->>Cat: Use income category
    Inc->>P: BEGIN; INSERT incomes
    opt Attachment provided
      Inc->>P: INSERT attachments (metadata + storage_path)
    end
    Inc->>Aud: INSERT
    Inc->>Rep: Record change / invalidate aggregate
    P->>DB: COMMIT
    Inc-->>React: 201 + body
  end
```

Expense create uses Expense Management, `expenseCreate`, with `amount_after_tax` calculated according to the tax rule.

## 6.3 Scenario — Update Income or Expense

ADMIN/SHOP_OWNER: any record. EMPLOYEE: only when `created_by = current user`. VIEWER: 403.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant Dom as Income or Expense
  participant P as Persistence
  participant DB as PostgreSQL
  participant Aud as Audit Log

  User->>React: Save changes
  React->>API: PUT /incomes/{id} or /expenses/{id}
  API->>Id: incomeUpdate / expenseUpdate + own-check
  alt Not allowed to edit
    Id-->>React: 403
  else Allowed
    API->>Dom: Update
    Dom->>P: UPDATE ... WHERE deleted_at IS NULL
    Dom->>Aud: UPDATE
    P->>DB: COMMIT
  end
```

## 6.4 Scenario — Soft Delete

ADMIN and SHOP_OWNER only. EMPLOYEE does not have `*Delete`.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant Dom as Income or Expense
  participant P as Persistence
  participant DB as PostgreSQL
  participant Aud as Audit Log

  User->>React: Confirm deletion
  React->>API: DELETE /incomes/{id}
  API->>Id: incomeDelete
  alt EMPLOYEE / VIEWER
    Id-->>React: 403
  else Allowed
    API->>Dom: Soft delete
    Note over Dom,DB: SET deleted_at, deleted_by<br/>do not physically delete
    Dom->>P: UPDATE
    Dom->>Aud: DELETE (logical)
    P->>DB: COMMIT
  end
```

Subsequent lists use `deleted_at IS NULL`. Audit data remains.

## 6.5 Scenario — Excel Import

Actor: ADMIN, SHOP_OWNER, EMPLOYEE. VIEWER: 403. Files `.xlsx` / `.xls` (the mock information architecture may still mention `.csv`; the architecture follows feature F06 for Excel import).

Parser library: **To Be Determined**.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant Imp as Excel Import
  participant Inc as Income Management
  participant Exp as Expense Management
  participant P as Persistence
  participant DB as PostgreSQL
  participant Aud as Audit Log

  User->>React: Choose income/expense type + file
  React->>API: Upload
  API->>Id: importData
  alt Forbidden
    Id-->>React: 403
  else Allowed
    API->>Imp: Validate file
    Imp->>Imp: Parse workbook
    Imp->>Imp: Validate rows
    Imp-->>React: Preview
    User->>React: Confirm
    React->>API: Confirm import
    Imp->>P: INSERT import_batches PENDING
    Imp->>P: status PROCESSING
    alt Valid row
      Imp->>Inc: Create income EXCEL_IMPORT
      Imp->>Exp: Create expense EXCEL_IMPORT
      Imp->>P: COMMIT batch COMPLETED
      Imp->>Aud: IMPORT
    else Error
      Imp->>P: FAILED + error_details
    end
    Imp-->>React: Result + batch history
  end
```

SQL constraint: `EXCEL_IMPORT` requires `import_batch_id`.

## 6.6 Scenario — Dashboard / Report

Dashboard: all roles. Reports: ADMIN, SHOP_OWNER, VIEWER. EMPLOYEE has `reportRead = false` → 403.

Aggregates use records that are **not** soft-deleted. USD is stored; React (or an API query parameter) converts to EUR for display — EUR is **not** written to the database.

```mermaid
sequenceDiagram
  actor User
  participant React as React.js
  participant API as HTTP API
  participant Id as Identity and Access
  participant Rep as Dashboard and Reporting
  participant P as Persistence
  participant DB as PostgreSQL

  User->>React: Open dashboard or report + USD/EUR + date range
  React->>API: GET reports or dashboard
  API->>Id: dashboard and/or reportRead
  alt EMPLOYEE requests report
    Id-->>React: 403
  else Allowed
    API->>Rep: Query
    Rep->>P: vw_income_active / vw_expense_active / cashflow views
    P->>DB: SELECT
    Rep-->>React: JSON USD
    React-->>User: Display; EUR = conversion
  end
```

Report export uses the same `reportRead` permission and creates audit action `EXPORT`.
