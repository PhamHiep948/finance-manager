# Data Diagram

PostgreSQL schema `shop_finance` for **HandmadeFinance**.

The interface uses **mock data** aligned with this model (tables, income/expense categories, currency, soft delete, sales channel, payment method, record status). The interface **does not connect** to PostgreSQL.

Design files: [shop_finance.dbml](../database/shop_finance.dbml) · [shop_finance.sql](../database/shop_finance.sql) · [05-data-model.md](05-data-model.md)

## Relationships (tables)

`app_users` is on the left. The three Income / Expense / Shared groups are arranged on the right. Within Income and Expense: category → record. `attachments` is in Shared (an attachment belongs to either an income record or an expense record).

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 70, "padding": 12}}}%%
flowchart LR
  U[app_users]

  subgraph groups [" "]
    direction TB

    subgraph income [Income]
      direction LR
      IC[income_categories] --> IN[incomes]
    end

    subgraph expense [Expense]
      direction LR
      EC[expense_categories] --> EX[expenses]
    end

    subgraph shared [Shared]
      direction LR
      IB[import_batches]
      AL[audit_logs]
      AT[attachments]
    end
  end

  U --> income
  U --> expense
  U --> shared
```

## Enums

| Enum | Values | UI |
|---|---|---|
| `user_role` | ADMIN, SHOP_OWNER, EMPLOYEE, VIEWER | Administrator, Shop Owner, Employee, Viewer |
| `data_source` | MANUAL, EXCEL_IMPORT | Manual / Excel |
| `import_type` | INCOME, EXPENSE | Income / expense |
| `import_status` | PENDING, PROCESSING, COMPLETED, FAILED | Import-batch status |
| `audit_action` | INSERT, UPDATE, DELETE, LOGIN, EXPORT, IMPORT | Audit log |
| `sale_region` | IN_EU, OUTSIDE_EU | Inside EU / Outside EU |
| `origin_scope` | DOMESTIC, INTERNATIONAL | Domestic / International |
| `sales_channel` | ETSY_STORE, WEBSITE_DIRECT, INSTAGRAM_SHOP, LOCAL_MARKET, B2B_WHOLESALE | Sales channel in income detail modal |
| `payment_method` | CREDIT_CARD, BANK_TRANSFER, CASH, PAYPAL | Payment method in expense detail modal |
| `record_status` | DRAFT, PENDING, COMPLETED | Draft / Pending / Completed |

## Views (report aggregates)

Views are **not stored tables**. They read active income/expense records and aggregate by day / month / category. In V1, `currency_code` is always `USD`; EUR conversion happens in the UI.

```mermaid
flowchart LR
  I[incomes]
  E[expenses]
  I --> V1[vw_income_active]
  E --> V2[vw_expense_active]
  I --> V3[vw_cashflow_daily]
  E --> V3
  I --> V4[vw_cashflow_monthly]
  E --> V4
  I --> V5[vw_income_by_category]
  E --> V6[vw_expense_by_category]
```

## Detailed ER diagram (main columns)

```mermaid
erDiagram
  app_users {
    bigint id PK
    varchar email
    varchar full_name
    varchar phone
    text avatar_url
    user_role role
    boolean is_active
    timestamptz deleted_at
  }

  income_categories {
    bigint id PK
    varchar name
    bigint created_by FK
  }

  incomes {
    bigint id PK
    date income_date
    bigint income_category_id FK
    numeric amount
    varchar currency_code
    varchar order_code
    sale_region sale_region
    sales_channel sales_channel
    record_status record_status
    integer product_qty
    numeric tax_percent
    numeric amount_after_tax
    data_source source
    bigint import_batch_id FK
    bigint created_by FK
    timestamptz deleted_at
  }

  expense_categories {
    bigint id PK
    varchar name
    bigint created_by FK
  }

  expenses {
    bigint id PK
    date expense_date
    bigint expense_category_id FK
    numeric amount
    varchar currency_code
    varchar payee
    origin_scope origin_scope
    payment_method payment_method
    record_status record_status
    numeric tax_percent
    numeric amount_after_tax
    data_source source
    bigint import_batch_id FK
    bigint created_by FK
    timestamptz deleted_at
  }

  import_batches {
    bigint id PK
    import_type import_type
    varchar original_file_name
    import_status status
    bigint imported_by FK
  }

  attachments {
    bigint id PK
    bigint income_id FK
    bigint expense_id FK
    varchar original_name
    bigint uploaded_by FK
  }

  audit_logs {
    bigint id PK
    bigint actor_user_id FK
    audit_action action
    varchar module
    text detail
    varchar table_name
  }

  app_users ||--o{ income_categories : created_by
  app_users ||--o{ expense_categories : created_by
  app_users ||--o{ incomes : created_by
  app_users ||--o{ expenses : created_by
  app_users ||--o{ import_batches : imported_by
  app_users ||--o{ attachments : uploaded_by
  app_users ||--o{ audit_logs : actor

  income_categories ||--o{ incomes : category
  expense_categories ||--o{ expenses : category
  import_batches ||--o{ incomes : batch
  import_batches ||--o{ expenses : batch
  incomes ||--o| attachments : file
  expenses ||--o| attachments : file
```
