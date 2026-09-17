# Acceptance Criteria — HandmadeFinance V1

> Design status: TARGET V1
>
> Implementation status: NOT IMPLEMENTED

These criteria describe the target product behavior. Mock UI behavior may satisfy a criterion visually, but Step 7 must enforce authorization and business rules in the API.

## AC-UC01 — Login

- Valid credentials for an active account return a Bearer token, expiry, and safe user profile.
- Invalid credentials and inactive accounts return the same `401` response and disclose no account state.
- Protected endpoints reject missing, invalid, or expired authentication with `401`.

## AC-UC02 — Logout

- Authenticated logout returns `204` and clears the Bearer token and client authentication state; the short-lived access token expires naturally because V1 has no refresh token.
- A logged-out client is redirected to Login when it requests a protected route.

## AC-UC03 — Dashboard

- All roles can request a valid date range and receive income, expense, net result, category breakdown, chart points, and recent active transactions.
- Invalid ranges return `400`; soft-deleted records are excluded.
- Values are returned in USD and may be converted to EUR only for display.

## AC-UC04 — View income

- All roles can list, filter, paginate, and open active income.
- Search, category, status, source, and date filters combine consistently.
- Missing or soft-deleted income returns `404`; Viewer sees no write controls.

## AC-UC05 — Add income

- Administrator, Shop Owner, and Employee can create income; Viewer receives `403`.
- Required fields, category, positive amount, tax, quantity, fees, and derived amount are validated server-side.
- Success returns `201`, sets `source=MANUAL`, records `createdBy`, and produces an audit event.
- An authorized writer can upload validated attachment metadata/files to the created record; Employee ownership is enforced.

## AC-UC06 — Edit income

- Administrator and Shop Owner can update any active income; Employee can update only income they created.
- Non-owner, missing/deleted, and invalid requests return `403`, `404`, and `400` respectively.
- Success returns the updated record and preserves an audit trail.

## AC-UC07 — Soft-delete income

- Only Administrator and Shop Owner can delete income.
- Deletion sets `deletedAt` and `deletedBy`, returns `204`, and never physically removes the row.
- The record leaves active lists and aggregates while its audit history remains.

## AC-UC08 — View expenses

- All roles can list, filter, paginate, and open active expenses.
- Search, category, status, source, and date filters combine consistently.
- Missing or soft-deleted expense returns `404`; Viewer sees no write controls.

## AC-UC09 — Add expense

- Administrator, Shop Owner, and Employee can create expenses; Viewer receives `403`.
- Category, positive amount, payee, origin, payment method, tax, and post-tax amount are validated server-side.
- Success returns `201`, sets `source=MANUAL`, records `createdBy`, and produces an audit event.
- An authorized writer can upload validated attachment metadata/files to the created record; Employee ownership is enforced.

## AC-UC10 — Edit expense

- Administrator and Shop Owner can update any active expense; Employee can update only expenses they created.
- Ownership, existence, and field-validation failures return `403`, `404`, and `400` respectively.
- Success returns the updated record and preserves an audit trail.

## AC-UC11 — Soft-delete expense

- Only Administrator and Shop Owner can soft-delete expenses.
- Deletion sets `deletedAt` and `deletedBy`, returns `204`, and excludes the record from active views and reports.
- The database row and audit history remain available.

## AC-UC12 — Import Excel data

- Administrator, Shop Owner, and Employee can upload `.xlsx` or `.xls`; Viewer receives `403`.
- Preview validates file type, size, headers, row fields, categories, and conflicts without inserting transactions.
- Processing is atomic: any invalid row inserts no transactions and marks the batch `FAILED` with row errors.
- If every row is valid, all rows are inserted with `source=EXCEL_IMPORT`, the batch is `COMPLETED`, and an import audit event is written.

## AC-UC13 — View reports

- Administrator, Shop Owner, and Viewer can report by range, granularity, and optional category; Employee receives `403`.
- Totals reconcile with active transactions for the same filters.
- USD is authoritative; selecting EUR changes display only.

## AC-UC14 — Export reports

- Export uses the same authorized filters and totals as the visible report.
- The response has the documented media type and filename and produces an `EXPORT` audit event.
- The export is a financial report, not an invoice or electronic invoice.

## AC-UC15 — View audit log

- Administrator and Shop Owner can list and filter audit records; Employee and Viewer receive `403`.
- Paginated results include actor, action, module, details, record identity, request identity, and timestamp when available.
- Audit records cannot be changed through the public API.

## AC-UC16 — Manage users

- Only Administrator can list, view, create, update, enable, or disable users.
- Username/email conflicts return `409`; invalid input returns `400`; passwords are never returned.
- Disabling an account prevents subsequent login while retaining historical and audit references.

## AC-UC17 — Personal profile

- Every authenticated role can view and update its own name, phone, and avatar reference.
- A user cannot change their role or active status through profile endpoints.
- Password change requires the correct current password and a policy-compliant new value and never returns password data.

## Definition of Ready for Step 7

A backend work item is ready only when it names its OpenAPI operation, Application service, repository dependencies, RBAC rule, validation/error outcomes, and unit-test cases. The UML traceability matrix provides this mapping.
