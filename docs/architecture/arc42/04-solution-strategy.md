# 4. Solution Strategy

This section explains **WHY**. Module details are in [Section 5](05-building-block-view.md). Architecture Decision Records: [Section 9](09-architecture-decisions.md).

## 4.1 Separate UI / API / data

```text
React.js  →  REST/HTTPS/JSON  →  Go Backend  →  PostgreSQL
```

**Why:** Separate presentation from currency rules, permissions, and correctness. The Frontend does not connect to the database, reducing schema exposure and preventing permission bypass.

Supports: Security, Maintainability, Data Correctness.

## 4.2 Modular Monolith (Go)

One Go process with multiple logical Components (HTTP API, Identity, Income, Expense, Import, Reporting, Audit, Persistence).

**Why:** V1 serves one shop and one data model; microservices would add network and operational complexity without a repository requirement.

Supports: Maintainability, simplicity. ADR-003.

## 4.3 REST / HTTPS / JSON

**Why:** React calls synchronous APIs for use cases (income/expense CRUD, import, reports). V1 has no realtime/event-bus requirement.

## 4.4 PostgreSQL + schema `shop_finance`

**Why:** Relationships for income/expense, category, user, batch, audit, and aggregate views are already designed. Constraints include `currency_code = 'USD'`, soft delete, and import-source CHECKs.

Supports: Data Correctness, Auditability.

## 4.5 Role-based access control + backend authorization

Four fixed roles. React hides menus/buttons. Go **Identity & Access** rejects unauthorized requests (for example, VIEWER `POST` income → 403).

**Why:** User experience is not security. ADR-008.

## 4.6 Soft Delete

Income/Expense: `deleted_at` / `deleted_by`. Active queries exclude records where `deleted_at IS NOT NULL` (equivalently, active rows satisfy `deleted_at IS NULL`).

**Why:** Preserve financial traceability; the audit still records DELETE as a logical action. ADR-007.

## 4.7 Canonical USD

Store one set of monetary values. EUR = conversion at read/display time.

**Why:** Avoid two ledgers. SQL CHECK blocks other currencies. ADR-006.

## 4.8 Audit trail

Database triggers plus application writes for LOGIN/EXPORT/IMPORT. Never log passwords, hashes, or tokens.

**Why:** QG-3 Auditability; Shop Owner/Admin can read the audit log.

## 4.9 Excel Import as a production workflow

Batch `import_batches` + status + row counts + `source = EXCEL_IMPORT`. Validate → preview → confirm → transaction creates records → audit → COMPLETED/FAILED.

**Why:** Feature F06 is a system capability, not a decorative screen.

## 4.10 Attachments

Table `attachments`: `original_name`, `storage_path`, MIME type, size; exactly one owner: income or expense.

**Why:** The schema is designed not to store binary files in the database. Filesystem/object-store technology: **To Be Determined**.
