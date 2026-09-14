# Sơ đồ dữ liệu

Schema PostgreSQL `shop_finance` cho **HandmadeFinance**.

Giao diện dùng **dữ liệu giả** bám đúng mô hình này (bảng, loại thu/chi, tiền tệ, xóa mềm, kênh bán, phương thức thanh toán, trạng thái hồ sơ). Giao diện **không kết nối** PostgreSQL.

File thiết kế: [shop_finance.dbml](../database/shop_finance.dbml) · [shop_finance.sql](../database/shop_finance.sql) · [05-data-model.md](05-data-model.md)

## Quan hệ (bảng)

`app_users` nằm bên trái. Ba nhóm Thu / Chi / Chung tách cột bên phải. Trong Thu và Chi: loại → khoản. `attachments` nằm ở Chung (chứng từ của khoản thu hoặc khoản chi).

```mermaid
%%{init: {"flowchart": {"nodeSpacing": 30, "rankSpacing": 70, "padding": 12}}}%%
flowchart LR
  U[app_users]

  subgraph groups [" "]
    direction TB

    subgraph thu [Thu]
      direction LR
      IC[income_categories] --> IN[incomes]
    end

    subgraph chi [Chi]
      direction LR
      EC[expense_categories] --> EX[expenses]
    end

    subgraph chung [Chung]
      direction LR
      IB[import_batches]
      AL[audit_logs]
      AT[attachments]
    end
  end

  U --> thu
  U --> chi
  U --> chung
```

## Enum

| Enum | Giá trị | UI |
|---|---|---|
| `user_role` | ADMIN, SHOP_OWNER, EMPLOYEE, VIEWER | Quản trị viên, Chủ shop, Nhân viên, Người xem |
| `data_source` | MANUAL, EXCEL_IMPORT | Nhập tay / Excel |
| `import_type` | INCOME, EXPENSE | Khoản thu / khoản chi |
| `import_status` | PENDING, PROCESSING, COMPLETED, FAILED | Trạng thái đợt import |
| `audit_action` | INSERT, UPDATE, DELETE, LOGIN, EXPORT, IMPORT | Nhật ký |
| `sale_region` | IN_EU, OUTSIDE_EU | Trong EU / Ngoài EU |
| `origin_scope` | DOMESTIC, INTERNATIONAL | Nội địa / Quốc tế |
| `sales_channel` | ETSY_STORE, WEBSITE_DIRECT, INSTAGRAM_SHOP, LOCAL_MARKET, B2B_WHOLESALE | Kênh bán trên modal chi tiết thu |
| `payment_method` | CREDIT_CARD, BANK_TRANSFER, CASH, PAYPAL | Phương thức trên modal chi tiết chi |
| `record_status` | DRAFT, PENDING, COMPLETED | Bản nháp / Chờ xử lý / Hoàn thành |

## View (tổng hợp báo cáo)

View **không phải bảng lưu**. Dùng để đọc thu/chi còn hiệu lực và cộng theo ngày / tháng / loại. `currency_code` V1 luôn `USD`; đổi EUR trên UI.

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

## ER chi tiết (cột chính)

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
