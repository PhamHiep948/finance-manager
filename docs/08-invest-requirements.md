# INVEST Requirements — HandmadeFinance V1

Each requirement is small enough to implement and test independently. Cross-cutting authentication, authorization, validation, auditing, and error handling are acceptance constraints, not hidden features.

## INVEST checklist

| Principle | Application in this backlog |
|---|---|
| Independent | Each story produces a demonstrable outcome and identifies only unavoidable prerequisites. |
| Negotiable | UI layout and implementation details may change while the stated outcome and permissions remain fixed. |
| Valuable | Every story names the user benefit. |
| Estimable | Inputs, outputs, roles, and exceptional outcomes are explicit. |
| Small | Each story targets one capability and can be split into API, application, persistence, and UI tasks. |
| Testable | Every story links to observable acceptance criteria in `06-acceptance-criteria.md`. |

## Product backlog

| ID | User story | Value | Dependencies | Acceptance criteria |
|---|---|---|---|---|
| US01 | As an active user, I want to log in so that I can securely access my permitted workspace. | Protected access | Seeded user account | AC-UC01 |
| US02 | As an authenticated user, I want to log out so that my current credential can no longer access protected functions. | Session safety | US01 | AC-UC02 |
| US03 | As any role, I want a filtered dashboard so that I can understand income, expense, net result, and recent activity. | Fast overview | US01, transaction data | AC-UC03 |
| US04 | As any role, I want to search and inspect active income so that I can review sales records without seeing deleted data. | Revenue visibility | US01 | AC-UC04 |
| US05 | As an Administrator, Shop Owner, or Employee, I want to add income so that sales are recorded consistently. | Complete revenue data | US01, income categories | AC-UC05 |
| US06 | As an authorized editor, I want to update income so that errors can be corrected; Employees may update only their own records. | Accurate revenue data | US04 | AC-UC06 |
| US07 | As an Administrator or Shop Owner, I want to soft-delete income so that incorrect records leave active views while remaining auditable. | Recoverable governance | US04 | AC-UC07 |
| US08 | As any role, I want to search and inspect active expenses so that I can review costs without seeing deleted data. | Cost visibility | US01 | AC-UC08 |
| US09 | As an Administrator, Shop Owner, or Employee, I want to add an expense so that shop costs are recorded consistently. | Complete cost data | US01, expense categories | AC-UC09 |
| US10 | As an authorized editor, I want to update expenses so that errors can be corrected; Employees may update only their own records. | Accurate cost data | US08 | AC-UC10 |
| US11 | As an Administrator or Shop Owner, I want to soft-delete expenses so that incorrect records leave active views while remaining auditable. | Recoverable governance | US08 | AC-UC11 |
| US12 | As an Administrator, Shop Owner, or Employee, I want to preview and import an Excel file atomically so that bulk data is accepted only when every row is valid. | Safe bulk entry | US01, categories | AC-UC12 |
| US13 | As an Administrator, Shop Owner, or Viewer, I want filtered reports so that I can analyze results by time and category. | Financial insight | US03 | AC-UC13 |
| US14 | As an Administrator, Shop Owner, or Viewer, I want to export the current report so that I can share the selected view. | Portable reporting | US13 | AC-UC14 |
| US15 | As an Administrator or Shop Owner, I want to inspect audit events so that important actions are traceable. | Accountability | US01 | AC-UC15 |
| US16 | As an Administrator, I want to create, edit, enable, and disable users so that access remains controlled. | Access administration | US01 | AC-UC16 |
| US17 | As an authenticated user, I want to maintain my profile and password without changing my role so that my account stays current and secure. | Self-service | US01 | AC-UC17 |

## Cross-cutting acceptance constraints

- Only `ADMIN`, `SHOP_OWNER`, `EMPLOYEE`, and `VIEWER` exist.
- The API, not the React client, enforces RBAC and Employee record ownership.
- Money is persisted in USD; EUR is a presentation-only conversion.
- Active transaction queries exclude rows with `deleted_at`.
- API errors use the `ProblemDetails` contracts in `api/openapi.yaml`.
- Import is all-or-nothing: any invalid row prevents transaction insertion for that batch.
- File type and size are validated server-side before parsing or storage.

**Related:** [Use cases](03-use-cases.md) · [Acceptance criteria](06-acceptance-criteria.md) · [OpenAPI](api/openapi.yaml)
