# Scope V1

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

## Goals

V1 supports:

- Mock login (two-column HandmadeFinance layout).
- Dashboard (KPIs, income-expense chart, revenue by category, recent transactions).
- Income management (full-column table, add/edit modal, detail modal).
- Expense management (same model).
- Reports & analytics (one USD dataset; convert to EUR for display).
- Excel data import (mock).
- Attachments (mock metadata in detail modal).
- Activity log (mock).
- User management (Admin).
- Profile: account, mock password change, permission matrix.
- Mock roles / permissions.
- PostgreSQL **data model / schema design** aligned with the UI.

## Non-goals

V1 does **not** include:

- Inventory management, CRM, or multi-line SKU orders.
- Detailed payroll, social insurance, or double-entry accounting.
- E-invoices, payment gateways, or Etsy API integration.
- AI or chatbot features.
- Refresh tokens, external identity providers, and multi-factor authentication.
- Direct integrations with third-party accounting, payment, or marketplace APIs.

## Current reality

| Component | Reality |
|---|---|
| Frontend | **MOCK DATA** (`app/src/lib/data.js`). No API `fetch`, no SQL. |
| Database | **Schema designed** (`database/shop_finance.sql`, `.dbml`). Not connected to the app. |
| Auth | **Mock authentication** (sessionStorage / localStorage). |
| Excel Import | **UI + mock flow**. File contents are not read. |
| Attachments | Select a local file and store **name / type / size**. No upload. |

Backend is not implemented yet.
