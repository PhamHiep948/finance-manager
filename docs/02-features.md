# Feature Catalog

> Design status: TARGET V1 with CURRENT PROTOTYPE status recorded separately

The status column describes the current prototype. Target V1 behavior is defined by the use cases, acceptance criteria, OpenAPI contract, and architecture documents.

UI product: **HandmadeFinance**.

| ID | Name | V1 | Status |
|---|---|---|---|
| F01 | Authentication | Yes | Implemented Mock |
| F02 | Dashboard | Yes | Implemented Mock |
| F03 | Income Management | Yes | Implemented Mock |
| F04 | Expense Management | Yes | Implemented Mock |
| F05 | Reports | Yes | Implemented Mock |
| F06 | Excel Import | Yes | Partial (UI/mock; file is not parsed) |
| F07 | Attachments | Yes | Implemented Mock |
| F08 | Audit Log | Yes | Implemented Mock |
| F09 | User Management | Yes | Implemented Mock |
| F10 | Profile | Yes | Implemented Mock |

## F01 Authentication

**Current prototype:** mock login with browser storage and no JWT/OAuth. Two-column screen: HandmadeFinance introduction + form.

**Target V1:** REST login returns a 30-minute Bearer JWT; the backend enforces authentication and authorization. Logout clears client token/private state; V1 has no refresh token or server-side revocation.

- F01.1 Login (email, password, remember device)
- F01.2 Logout
- F01.3 Mock session (`sessionStorage`; Remember me → `localStorage`)
- F01.4 Route guard
- F01.5 Role guard
- F01.6 Forgot password / sign up: instructional toast only (no real workflow)

## F02 Dashboard

Total revenue, total expenses, net profit, and transaction count. Income-expense chart over time (date-range filter). Revenue by income category. Recent transactions. Display currency can switch between USD / EUR over the same dataset.

## F03 Income Management

Full-column list (columns can be shown/hidden), monthly KPIs, filters, pagination, and soft delete.

Add / edit using a **modal**. View details using a **modal** (sales channel, status, attachments, fee breakdown).

Fields: date, product name, income category, pre-tax amount (stored in USD), tax rate, post-tax amount, reference code, order code, sales destination, sales channel, record status, quantity, unit price, Item total, Discount, Subtotal, Shipping, Tax, input source (manual / Excel), notes, attachments.

Mock sample: Etsy order `4154185113` (Lily Flower, 5 items, Germany / inside EU, 22.10 USD before tax).

## F04 Expense Management

Same as F03. Adds payee, source scope (domestic / international), payment method, tax rate, and post-tax amount (default = amount × (1 + tax rate)).

## F05 Reports

Overview, by day, by month, by income category, by expense category. Switch USD/EUR for display. **Export report** (mock print). Do not call this “invoice export”.

## F06 Excel Import

Import income or expense data from `.xlsx` / `.xls`.

- **Current prototype:** mock preview, history, success, and error; file contents are not parsed.
- **Target V1:** validated preview and synchronous atomic import, limited to 10 MB/5,000 rows, returning a final summary before the request completes.

## F07 Attachment

- **Current prototype:** `<input type="file">` stores illustrative metadata only; there is no server upload.
- **Target V1:** authorized upload backed by file storage with metadata persisted through the API.

## F08 Audit

Mock: create, update, soft delete, import, login (shown in the audit-log table). Columns: user, action, module, details, time.

## F09 User Management

Admin only. KPIs for total users / administrators / active / disabled. List, add, edit (name, email, password, role, status), enable/disable.

## F10 Profile

**Account** tab (full name, phone number, avatar, read-only email/title), **Security** (mock password change), **Roles & Permissions** (permission matrix; users cannot change their own role).
