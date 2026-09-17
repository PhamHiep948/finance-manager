# Data model (PostgreSQL schema design)

> Design status: TARGET V1
>
> Runtime status: SCHEMA DESIGN ONLY; NOT CONNECTED

Goal: an income/expense model aligned with the **HandmadeFinance** interface, using schema `shop_finance`.

The mock UI is **aligned with this schema** (tables, categories, currency, soft delete, sales channel, payment method, record status, phone/avatar). UI data is **mock JavaScript data**; the browser does not open a PostgreSQL connection.

Related sources of truth: [shop_finance.dbml](../src/database/shop_finance.dbml), [shop_finance.sql](../src/database/shop_finance.sql), [DATABASE.md](DATABASE.md).

## Tables

| Table | Purpose |
|---|---|
| `app_users` | User, `user_role`, `phone`, `avatar_url`, `timezone`, `is_active`, `last_login_at`, soft delete |
| `income_categories` | Income categories (Sales, Other Income) |
| `incomes` | One row = one incoming amount. `amount` = pre-tax amount. `amount_after_tax` is derived from tax rate. Order code, EU region, sales channel, status, quantity, order fees. |
| `expense_categories` | Expense categories |
| `expenses` | One row = one outgoing amount. `payee`, `origin_scope`, `payment_method`, `record_status`, `tax_percent`, `amount_after_tax`. |
| `attachments` | Attachment metadata; each attachment belongs to exactly one income or expense, and each transaction may have many attachments |
| `import_batches` | Excel import run |
| `audit_logs` | INSERT/UPDATE/DELETE (trigger) + LOGIN/EXPORT/IMPORT (app); `module`, `detail` |

There are no dashboard / reports / statistics tables — KPIs are calculated from active income/expense records.

## Soft delete

`deleted_at` (+ `deleted_by` on incomes/expenses). Active list: `deleted_at IS NULL`.

Soft deletion is implemented as an SQL `UPDATE`. Whether the audit catalog exposes that transition as `UPDATE` or the business-level action `DELETE` is **TBD** and must be decided before database implementation.

## Audit payload security

Sensitive fields must not be stored in audit JSON payloads or application logs. This includes passwords, `password_hash`, JWTs, refresh tokens, signing keys, and other secrets.

**Current design risk:** the generic `to_jsonb(NEW)` / `to_jsonb(OLD)` trigger can capture `app_users.password_hash`.

**TODO before database implementation:** exclude or redact sensitive columns in `app_users` audit payloads and add a database-level verification test. No migration is executed by this documentation task.

## Transaction boundaries

| Area | Confirmed boundary | Status |
|---|---|---|
| Income | Persist mutation and its trigger-generated audit record in one transaction | Confirmed |
| Expense | Persist mutation and its trigger-generated audit record in one transaction | Confirmed |
| User management | Account mutation and administrative audit behavior | Detailed boundary TBD |
| Excel import | Invalid rows insert zero income/expense records; a valid batch commits all imported records | Confirmed all-or-nothing; HTTP execution model TBD |
| Attachment | Metadata/file compensation and retry behavior | Final transaction/compensation design TBD |

## Currency

In V1, `currency_code` is only `USD`. EUR is a display conversion in the UI (mock exchange rate), not a separate list/report dataset. The cashflow view still groups by `currency_code` because the column remains in the tables.

## Views (reporting design)

`vw_income_active`, `vw_expense_active`, `vw_cashflow_daily`, `vw_cashflow_monthly`, `vw_income_by_category`, `vw_expense_by_category`.

## Seed categories

Income: Sales, Other Income.

Expenses: Raw Materials, Packaging, Shipping, Advertising, Service Fees, Employee Salaries, Electricity / Water / Internet, Premises Rent, Tools / Equipment, Other Expenses.

Demo user seeds: `admin@demo.local`, `owner@demo.local`, `staff@demo.local`, `viewer@demo.local`.

## Mock JS mapping

| JS | SQL |
|---|---|
| `name` / `email` / `phone` / `avatar` | `full_name` / `email` / `phone` / `avatar_url` |
| `status` active/disabled | `is_active` |
| `lastActive` | `last_login_at` (display) |
| `categoryId` | `income_category_id` / `expense_category_id` |
| `currency` | `currency_code` |
| `recipient` | `payee` |
| `orderCode` / `saleRegion` / `productQty` / `unitPrice` / `taxPercent` | `order_code` / `sale_region` / `product_qty` / `unit_price` / `tax_percent` |
| `salesChannel` | `sales_channel` |
| `paymentMethod` | `payment_method` |
| `recordStatus` | `record_status` |
| `itemTotal` / `discountAmount` / `discountCode` / `subtotal` / `shippingAmount` / `taxAmount` | `item_total` / `discount_amount` / `discount_code` / `subtotal` / `shipping_amount` / `tax_amount` |
| `originScope` / `amountAfterTax` | `origin_scope` / `amount_after_tax` |
| `attachment` `{name,type,size}` | `attachments.original_name`, `mime_type`, `file_size_bytes` |

The frontend reads **mock JS** (`src/frontend/src/lib/data.js`) and maps columns as above — it does not query SQL views at runtime.
