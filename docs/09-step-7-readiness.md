# Step 7 Readiness — API Implementation and Unit Tests

Steps 1–6 define the target behavior and architecture. This document is the implementation handoff; it does not claim that backend source code already exists.

## Sources of truth

Use this precedence when documents appear ambiguous:

1. `api/openapi.yaml` — HTTP paths, security scheme, request/response schemas, and status codes.
2. `03-use-cases.md` and `06-acceptance-criteria.md` — roles, ownership, and observable behavior.
3. `src/database/shop_finance.sql` — persisted types, constraints, relationships, views, and triggers.
4. `07-folder-structure.md` and `architecture/uml/` — code ownership, dependencies, and call order.
5. `architecture/arc42/09-architecture-decisions.md` — implementation technology decisions.

If implementation exposes a conflict between sources, update the design and OpenAPI together before coding around it.

## Implementation increments

| Increment | Scope | Exit condition |
|---|---|---|
| I1 Foundation | Solution/projects, configuration, DI, exception middleware, Problem Details, PostgreSQL context | Application has no Infrastructure reference; API starts and health/configuration failures are explicit |
| I2 Identity | Login/logout, JWT, password hashing, actor context, authorization policies | UC01–02 and role-policy tests pass |
| I3 Ledger reads | Categories, income/expense list and detail, paging/filtering | Active-record and filter tests pass against PostgreSQL |
| I4 Ledger writes | Create/update/soft-delete, ownership, audit actor context | UC05–11 service and trigger integration tests pass |
| I5 Dashboard/reporting | Dashboard, report query, PDF/XLSX exporters | Aggregates reconcile with seeded active transactions |
| I6 Imports/files | Preview, atomic import, history, attachments, local storage | Invalid import inserts zero transactions; cleanup paths pass |
| I7 Administration | Audit list, users, profile/password | Admin/self-service authorization and conflict tests pass |
| I8 Frontend integration | Replace mock services feature-by-feature | UI consumes OpenAPI responses and preserves documented states |

## Required Application unit-test matrix

| Module | Minimum cases |
|---|---|
| Authentication | valid login; unknown email; wrong password; inactive/deleted user; safe response; login audit |
| Dashboard | valid range; invalid range; empty data; deleted rows excluded; totals and recent limit |
| Categories | income/expense separation; active only; stable name order |
| Income | create roles; Viewer forbidden; validation; Employee owns update; non-owner forbidden; admin/owner update; delete roles; missing/deleted |
| Expense | same authorization matrix; origin/payment/tax validation; derived amount consistency |
| Reports | allowed/forbidden roles; filters; category type; active-only totals; exporter selection; export audit |
| Imports | file guards; header/row mapping; category validation; preview has no writes; atomic success; atomic rollback; failed-batch errors |
| Attachments | owner policy; file guards; metadata success; stored-file compensation; delete cleanup |
| Audit | Admin/Owner allowed; others forbidden; filters and paging; no mutation path |
| Users | Admin-only; create hashing; duplicate username/email; update; enable/disable; password never mapped |
| Profile | self lookup; allowed-field mapping; role/status ignored or rejected; wrong current password; successful rehash |

## Integration tests

- OpenAPI authorization expectations are tested per operation with unauthenticated, forbidden, and allowed actors.
- PostgreSQL tests verify enum mappings, check/foreign-key constraints, active-only views, soft deletion, audit triggers, and `SET LOCAL app.current_user_id`.
- File tests use an isolated temporary storage root and verify path traversal cannot escape it.
- Import tests use representative `.xls` and `.xlsx` fixtures and verify a failing row commits zero transaction rows.
- API errors validate media type, status, field errors, and trace ID against OpenAPI.

## Definition of Done for each endpoint

- Controller operation and DTO match OpenAPI without undocumented fields.
- Application service contains validation and authorization; Controller contains no business logic or SQL.
- Repository uses parameterized EF Core/Npgsql access and honors cancellation.
- Successful and failure paths have automated tests.
- Logs contain trace ID but no password, token, hash, raw file contents, or sensitive stack trace.
- The endpoint is exercised from Swagger UI or an equivalent OpenAPI client.

## Step 1–6 completion index

| Step | Completed design artifacts |
|---|---|
| 1 | Scope, feature catalog, UC01–17, INVEST backlog, complete acceptance criteria |
| 2 | Information architecture, screen hierarchy, task flow, UI states, accessibility/responsive rules, role screenshots |
| 3 | C4 System Context, Container, and Component diagrams |
| 4 | PostgreSQL SQL/DBML/ERD and validated OpenAPI 3.0.4 contract |
| 5 | Full React feature structure and three-tier backend/test structure |
| 6 | Core and remaining class diagrams, runtime sequences, and operation traceability |

The remaining work is Step 7 implementation, not additional baseline design.
