# Master Traceability Matrix — HandmadeFinance V1

> Design status: TARGET V1  
> Implementation status: NOT IMPLEMENTED  
> Test identifiers: TBD until Step 7 creates executable tests

This matrix connects the six design steps. `TBD` identifies a genuine unresolved decision or an implementation artifact that does not yet exist.

| Requirement | Use Case | Acceptance Criteria | Screen | C4 Component | API operationId | DB | Target FE Module | Target BE Module | UML | Test |
|---|---|---|---|---|---|---|---|---|---|---|
| US01 | UC01 | AC-UC01 | SCR-01 | Identity & Access | `login` | `app_users`, `audit_logs` | `features/auth` | `Authentication` / `IAuthService` | Core Login sequence / S01 | TBD |
| US02 | UC02 | AC-UC02 | Authenticated shell → SCR-01 | Identity & Access | `logout` | None for client-only option; TBD for revocation | `features/auth` | `Authentication` / `IAuthService` | S02 | TBD |
| US03 | UC03 | AC-UC03 | SCR-02 | Dashboard & Reporting | `getDashboard` | active income/expense views | `features/dashboard` | `Dashboard` / `IDashboardService` | S03 read pattern | TBD |
| US04 | UC04 | AC-UC04 | SCR-10, SCR-13 | Income & Expense | `listIncomes`, `getIncome`, `listIncomeCategories` | `incomes`, `income_categories`, `attachments` | `features/incomes`, `features/categories` | `Incomes`, `Categories` | S03 read pattern | TBD |
| US05 | UC05 | AC-UC05 | SCR-11 | Income & Expense, File Storage | `createIncome`, `uploadIncomeAttachment` | `incomes`, `income_categories`, `attachments`, `audit_logs` | `features/incomes` | `Incomes`, `Attachments` | Core Create Income / S08 | TBD |
| US06 | UC06 | AC-UC06 | SCR-12 | Identity & Access, Income & Expense | `updateIncome`, `uploadIncomeAttachment`, `deleteAttachment` | `incomes`, `attachments`, `audit_logs` | `features/incomes` | `Incomes`, `Attachments` | Core Update Income / S08 | TBD |
| US07 | UC07 | AC-UC07 | SCR-10 | Identity & Access, Income & Expense | `softDeleteIncome` | `incomes`, `audit_logs` | `features/incomes` | `Incomes` | Income delete pattern | TBD |
| US08 | UC08 | AC-UC08 | SCR-20, SCR-23 | Income & Expense | `listExpenses`, `getExpense`, `listExpenseCategories` | `expenses`, `expense_categories`, `attachments` | `features/expenses`, `features/categories` | `Expenses`, `Categories` | S03 read pattern | TBD |
| US09 | UC09 | AC-UC09 | SCR-21 | Income & Expense, File Storage | `createExpense`, `uploadExpenseAttachment` | `expenses`, `expense_categories`, `attachments`, `audit_logs` | `features/expenses` | `Expenses`, `Attachments` | Core Create Expense / S08 | TBD |
| US10 | UC10 | AC-UC10 | SCR-22 | Identity & Access, Income & Expense | `updateExpense`, `uploadExpenseAttachment`, `deleteAttachment` | `expenses`, `attachments`, `audit_logs` | `features/expenses` | `Expenses`, `Attachments` | Expense update pattern / S08 | TBD |
| US11 | UC11 | AC-UC11 | SCR-20 | Identity & Access, Income & Expense | `softDeleteExpense` | `expenses`, `audit_logs` | `features/expenses` | `Expenses` | Core Soft-delete Expense | TBD |
| US12 | UC12 | AC-UC12 | SCR-40 | Excel Import, Income & Expense, File Storage | `previewImport`, `createImport`, `listImports`, `getImport` | `import_batches`, income/expense/category tables, `audit_logs` | `features/imports` | `Imports` | S04–S05 | TBD |
| US13 | UC13 | AC-UC13 | SCR-30 | Dashboard & Reporting | `getReport` | reporting views over incomes/expenses | `features/reports` | `Reports` / `IReportService` | S06 | TBD |
| US14 | UC14 | AC-UC14 | SCR-30 | Dashboard & Reporting | `exportReport` | reporting views, `audit_logs` | `features/reports` | `Reports` / exporters | S07 | TBD |
| US15 | UC15 | AC-UC15 | SCR-50 | Audit Log | `listAuditLogs` | `audit_logs` | `features/audit` | `Audit` / `IAuditService` | S03 read pattern | TBD |
| US16 | UC16 | AC-UC16 | SCR-60 | User & Profile, Identity & Access | `listUsers`, `getUser`, `createUser`, `updateUser`, `updateUserStatus` | `app_users`, `audit_logs` | `features/users` | `Users` / `IUserService` | S09 | TBD |
| US17 | UC17 | AC-UC17 | SCR-70 | User & Profile, Identity & Access | `getProfile`, `updateProfile`, `changePassword` | `app_users`, `audit_logs` | `features/profile` | `Profile` / `IProfileService` | S10 | TBD |

## Open decisions surfaced by traceability

- US02: logout token revocation semantics.
- US12: synchronous versus asynchronous import HTTP execution.
- US14: final report/export filter parity.
- US07/US11: audit action used for soft deletion.
- Step 7: executable test IDs and files.
