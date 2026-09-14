# Data model (PostgreSQL schema design)

Mục tiêu: mô hình thu/chi khớp giao diện **HandmadeFinance**, schema `shop_finance`.

Giao diện mock **bám đúng schema này** (bảng, loại, tiền tệ, xóa mềm, kênh bán, phương thức TT, trạng thái hồ sơ, SĐT/avatar). Dữ liệu trên UI là **mock trong JavaScript**, không mở kết nối PostgreSQL từ trình duyệt.

Source of truth kèm: [shop_finance.dbml](../database/shop_finance.dbml), [shop_finance.sql](../database/shop_finance.sql), [DATABASE.md](DATABASE.md).

## Bảng

| Bảng | Việc |
|---|---|
| `app_users` | User, `user_role`, `phone`, `avatar_url`, `timezone`, `is_active`, `last_login_at`, soft delete |
| `income_categories` | Loại thu (Bán hàng, Thu khác) |
| `incomes` | Một dòng = một khoản tiền vào. `amount` = số tiền trước thuế. `amount_after_tax` từ % thuế. Mã đơn, khu vực EU, kênh bán, trạng thái, SL, phí đơn. |
| `expense_categories` | Loại chi |
| `expenses` | Một dòng = một khoản tiền ra. `payee`, `origin_scope`, `payment_method`, `record_status`, `tax_percent`, `amount_after_tax`. |
| `attachments` | Metadata chứng từ; đúng một `income_id` hoặc `expense_id` |
| `import_batches` | Lần import Excel |
| `audit_logs` | INSERT/UPDATE/DELETE (trigger) + LOGIN/EXPORT/IMPORT (app); `module`, `detail` |

Không có bảng dashboard / reports / statistics — KPI đọc từ khoản thu/chi còn hiệu lực.

## Soft delete

`deleted_at` (+ `deleted_by` trên incomes/expenses). List active: `deleted_at IS NULL`.

## Currency

`currency_code` V1 chỉ `USD`. EUR là đổi tiền trên UI (tỷ giá mock), không tách list/báo cáo. View cashflow vẫn group `currency_code` vì cột còn trên bảng.

## Views (thiết kế báo cáo)

`vw_income_active`, `vw_expense_active`, `vw_cashflow_daily`, `vw_cashflow_monthly`, `vw_income_by_category`, `vw_expense_by_category`.

## Seed loại

Thu: Bán hàng, Thu khác.

Chi: Nguyên vật liệu, Bao bì / đóng gói, Vận chuyển, Quảng cáo, Phí dịch vụ, Lương nhân viên, Điện / nước / Internet, Thuê mặt bằng, Công cụ / thiết bị, Chi khác.

Seed user demo: `admin@demo.local`, `owner@demo.local`, `staff@demo.local`, `viewer@demo.local`.

## Mapping mock JS

| JS | SQL |
|---|---|
| `name` / `email` / `phone` / `avatar` | `full_name` / `email` / `phone` / `avatar_url` |
| `status` active/disabled | `is_active` |
| `lastActive` | `last_login_at` (hiển thị) |
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

Frontend đọc **mock JS** (`frontend/js/data.js`), mapping cột như trên — không query view SQL lúc chạy.
