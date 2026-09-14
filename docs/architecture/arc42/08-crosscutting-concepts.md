# 8. Cross-cutting Concepts

Do not prescribe a library (JSON Web Token, Gin, GORM, Zap, S3) unless the repository has already decided it — those items remain **To Be Determined**.

## 8.1 Authentication

Users log in with email/password; account must have `is_active`. Session/token **mechanism To Be Determined**. Logout invalidates the client credential and the server-side credential (once a session store exists — To Be Determined). Audit action: `LOGIN`. Never return `password_hash`.

## 8.2 Authorization

React: hide button / menu / disable. **Security:** Identity & Access protects every write API and sensitive read APIs (reports, audit, users).

Own-record rule: EMPLOYEE can update only when `created_by` matches. Delete: EMPLOYEE always receives 403.

## 8.3 Validation

Backend validates required fields, `amount > 0`, `tax_percent` between 0–100, category existence, and import file extension/size (**threshold To Be Determined**). Frontend validation improves user experience but does not replace backend validation.

## 8.4 Error Handling

| Situation | Handling |
| --------- | -------- |
| Unauthenticated | 401 |
| Forbidden | 403 |
| Validation | 400 + safe message |
| Not found / already soft-deleted | 404 |
| Import error | Batch `FAILED`, `error_details` JSONB |

Detailed JSON error envelope: **To Be Determined**.

## 8.5 Logging vs Audit

Operational logs (request_id, technical errors): **To Be Determined** (logger not selected). Business audit: table `audit_logs` (actor, action, module, detail, table_name, record_id, timestamps). Columns `ip_address`, `request_id` already exist in the schema.

Never log: password, hash, session secret, token.

## 8.6 Database Transactions

Creating income + attachment and confirming import (multiple rows + batch) run in **one transaction** through Persistence. Audit triggers run in the same transaction for INSERT/UPDATE/DELETE on tables that have triggers.

## 8.7 Soft Delete

`deleted_at` (+ `deleted_by` on incomes/expenses). Active rows satisfy `deleted_at IS NULL`. User/category tables also have `deleted_at` in the schema.

## 8.8 Currency

Canonical **USD**. `CHECK (currency_code = 'USD')`. EUR = Presentation Conversion. Do not maintain two lists. Exchange-rate source: **To Be Determined**.

## 8.9 Time / Timezone

Postgres Docker uses `Asia/Ho_Chi_Minh`. `app_users.timezone` defaults to the same value. Timestamp columns use `timestamptz`. React display rule: **To Be Determined** (prefer user timezone).

## 8.10 Security

HTTPS in production. Frontend does not issue SQL. Password hashes are stored in `password_hash` — algorithm **To Be Determined**. Cross-Origin Resource Sharing / cookie flags: **To Be Determined**.

## 8.11 File Handling

`attachments.storage_path` + metadata. `import_batches.stored_file_path` is optional in the schema. Binary data is not stored in PostgreSQL. Where the backend stores files: **Architecture Decision Pending**.

## 8.12 Data Integrity

Category FKs, CHECK between import source and batch, exactly one attachment owner, unique email/username when `deleted_at IS NULL`, report views over active records.
