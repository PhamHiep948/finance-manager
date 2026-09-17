# Scope V1

> Design status: TARGET V1
>
> Implementation status: CURRENT PROTOTYPE ONLY

Product name in the interface: **HandmadeFinance**.

## Problem

A handmade shop needs a simple place to:

- record money in;
- record money out;
- know total revenue, total expenses, and net profit;
- view data over time;
- view data by income / expense category.

This is not an ERP, not a full accounting system, and does not manage inventory / SKUs.

Income records: product name, order code, sales region (inside EU / outside EU), quantity, unit price, order fees (Item, Discount, Subtotal, Shipping, Tax), **pre-tax** and **post-tax** amounts, sales channel (Etsy / website / Instagram / local market / wholesale), and record status (draft / pending / completed).

Expense records: description, payee, domestic / international scope, payment method, tax rate, pre-tax / post-tax amounts, and record status.

Users: full name, email, phone number, avatar, role, active / disabled status.

## Target V1 goals

The target V1 supports:

- Login through the REST API with backend authentication and authorization. The current two-column login remains the prototype UI.
- Dashboard (KPIs, income-expense chart, revenue by category, recent transactions).
- Income management (full-column table, add/edit modal, detail modal).
- Expense management (same model).
- Reports & analytics (one USD dataset; convert to EUR for display).
- Excel data import with validation, preview, and persisted batch results.
- Attachment upload and persisted metadata.
- Persisted activity log.
- User management (Admin).
- Profile: account, password change, and permission matrix.
- Backend-enforced roles and permissions.
- PostgreSQL persistence aligned with the approved API contract.

## Non-goals

V1 does **not** include:

- Inventory management, CRM, or multi-line SKU orders.
- Detailed payroll, social insurance, or double-entry accounting.
- E-invoices, payment gateways, or Etsy API integration.
- AI or chatbot features.
- Refresh tokens, external identity providers, and multi-factor authentication.
- Direct integrations with third-party accounting, payment, or marketplace APIs.

## Current prototype

| Component | Reality |
|---|---|
| Frontend | **MOCK DATA** (`src/frontend/src/lib/data.js`). No API `fetch`, no SQL. |
| Database | **Schema designed** (`src/database/shop_finance.sql`, `.dbml`). Not connected to the app. |
| Auth | **Mock authentication** (sessionStorage / localStorage). |
| Excel Import | **UI + mock flow**. File contents are not read. |
| Attachments | Select a local file and store **name / type / size**. No upload. |

Backend is not implemented yet.

## Target V1 architecture

```text
React frontend
    → REST/HTTPS/JSON
ASP.NET Core three-tier backend
    → PostgreSQL
    → file storage for imports and attachments
```

The current mock frontend is intentional and remains available for UI development and demonstration. It is not the target authentication, authorization, persistence, import, or attachment architecture.
