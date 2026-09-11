-- ============================================================
-- PostgreSQL database schema
-- Web quản lý thu - chi shop handmade
-- Thiết kế từ sơ đồ XMind người dùng cung cấp
-- PostgreSQL 15+
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS shop_finance;
SET search_path TO shop_finance, public;

-- ------------------------------------------------------------
-- 1. ENUMS
-- ------------------------------------------------------------
CREATE TYPE user_role AS ENUM ('ADMIN', 'SHOP_OWNER', 'EMPLOYEE', 'VIEWER');
CREATE TYPE data_source AS ENUM ('MANUAL', 'EXCEL_IMPORT');
CREATE TYPE import_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE import_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ------------------------------------------------------------
-- 2. USERS
-- Không tạo bảng permission riêng vì phạm vi hiện tại chỉ cần 4 vai trò.
-- ------------------------------------------------------------
CREATE TABLE app_users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    role            user_role NOT NULL DEFAULT 'EMPLOYEE',
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    last_login_at   TIMESTAMPTZ,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ
);

CREATE UNIQUE INDEX uq_app_users_username_active
    ON app_users (LOWER(username))
    WHERE deleted_at IS NULL;

CREATE UNIQUE INDEX uq_app_users_email_active
    ON app_users (LOWER(email))
    WHERE email IS NOT NULL AND deleted_at IS NULL;

-- ------------------------------------------------------------
-- 3. IMPORT BATCHES
-- Theo dõi từng lần import Excel để truy vết và chống nhập trùng.
-- ------------------------------------------------------------
CREATE TABLE import_batches (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    import_type     import_type NOT NULL,
    original_file_name VARCHAR(500) NOT NULL,
    stored_file_path TEXT,
    status          import_status NOT NULL DEFAULT 'PENDING',
    total_rows      INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
    success_rows    INTEGER NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
    failed_rows     INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
    error_details   JSONB,
    imported_by     BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at    TIMESTAMPTZ,
    CONSTRAINT ck_import_row_counts CHECK (success_rows + failed_rows <= total_rows)
);

-- ------------------------------------------------------------
-- 4. INCOME CATEGORIES
-- Sơ đồ có báo cáo "theo loại thu" và "loại thu cao nhất", vì vậy DB
-- cần khóa phân loại thu dù UI không nhất thiết phải có menu riêng.
-- ------------------------------------------------------------
CREATE TABLE income_categories (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    created_by      BIGINT REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_income_categories_name_active
    ON income_categories (LOWER(name))
    WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- 5. INCOME / ORDER HEADER
-- Mỗi khoản thu là một đơn hàng; chi tiết sản phẩm nằm ở income_items.
-- ------------------------------------------------------------
CREATE TABLE incomes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    income_category_id  BIGINT NOT NULL REFERENCES income_categories(id),
    order_date           DATE NOT NULL,
    customer_country     VARCHAR(100),
    product_quantity     INTEGER NOT NULL DEFAULT 0 CHECK (product_quantity >= 0),

    item_total           NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (item_total >= 0),
    discount_amount      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    subtotal             NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (subtotal >= 0),
    shipping_amount      NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount           NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    order_total          NUMERIC(18,2) NOT NULL CHECK (order_total >= 0),
    coupon_code          VARCHAR(100),
    currency_code        VARCHAR(3) NOT NULL CHECK (currency_code ~ '^[A-Za-z]{3}$'),

    source               data_source NOT NULL DEFAULT 'MANUAL',
    import_batch_id      BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,
    note                 TEXT,

    created_by           BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by           BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at           TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at           TIMESTAMPTZ,
    deleted_by           BIGINT REFERENCES app_users(id) ON DELETE SET NULL,

    CONSTRAINT ck_income_import_source CHECK (
        (source = 'EXCEL_IMPORT' AND import_batch_id IS NOT NULL)
        OR source = 'MANUAL'
    )
);

CREATE INDEX idx_incomes_order_date_active
    ON incomes(order_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_category_date_active
    ON incomes(income_category_id, order_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_currency_active
    ON incomes(currency_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_country_active
    ON incomes(customer_country)
    WHERE customer_country IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_incomes_import_batch
    ON incomes(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- ------------------------------------------------------------
-- 6. INCOME ITEMS
-- Một đơn hàng có thể có nhiều sản phẩm / variant.
-- ------------------------------------------------------------
CREATE TABLE income_items (
    id                      BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    income_id               BIGINT NOT NULL REFERENCES incomes(id) ON DELETE CASCADE,
    product_name            VARCHAR(500) NOT NULL,
    external_transaction_id VARCHAR(150),
    variant                 VARCHAR(500),
    quantity                INTEGER NOT NULL CHECK (quantity > 0),
    unit_price              NUMERIC(18,2) NOT NULL CHECK (unit_price >= 0),
    line_total              NUMERIC(18,2) GENERATED ALWAYS AS (quantity * unit_price) STORED,
    created_at              TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at              TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

CREATE INDEX idx_income_items_income_id ON income_items(income_id);
CREATE INDEX idx_income_items_product_name ON income_items(LOWER(product_name));
CREATE INDEX idx_income_items_transaction_id
    ON income_items(external_transaction_id)
    WHERE external_transaction_id IS NOT NULL;

-- ------------------------------------------------------------
-- 7. EXPENSE CATEGORIES
-- ------------------------------------------------------------
CREATE TABLE expense_categories (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    name            VARCHAR(150) NOT NULL,
    description     TEXT,
    is_active       BOOLEAN NOT NULL DEFAULT TRUE,
    created_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at      TIMESTAMPTZ,
    created_by      BIGINT REFERENCES app_users(id) ON DELETE SET NULL
);

CREATE UNIQUE INDEX uq_expense_categories_name_active
    ON expense_categories (LOWER(name))
    WHERE deleted_at IS NULL;

-- ------------------------------------------------------------
-- 8. EXPENSES
-- ------------------------------------------------------------
CREATE TABLE expenses (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expense_date        DATE NOT NULL,
    description         TEXT NOT NULL,
    expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL CHECK (currency_code ~ '^[A-Za-z]{3}$'),
    payee               VARCHAR(255),
    note                TEXT,

    source              data_source NOT NULL DEFAULT 'MANUAL',
    import_batch_id     BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,

    created_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    deleted_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,

    CONSTRAINT ck_expense_import_source CHECK (
        (source = 'EXCEL_IMPORT' AND import_batch_id IS NOT NULL)
        OR source = 'MANUAL'
    )
);

CREATE INDEX idx_expenses_date_active
    ON expenses(expense_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_category_date_active
    ON expenses(expense_category_id, expense_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_amount_active
    ON expenses(amount)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_payee_active
    ON expenses(LOWER(payee))
    WHERE payee IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_expenses_import_batch
    ON expenses(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- ------------------------------------------------------------
-- 9. ATTACHMENTS
-- Dùng 1 bảng chung nhưng vẫn giữ FK thật đến khoản thu/khoản chi.
-- Chính xác một trong income_id / expense_id phải có giá trị.
-- ------------------------------------------------------------
CREATE TABLE attachments (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    income_id       BIGINT REFERENCES incomes(id) ON DELETE CASCADE,
    expense_id      BIGINT REFERENCES expenses(id) ON DELETE CASCADE,
    original_name   VARCHAR(500) NOT NULL,
    storage_path    TEXT NOT NULL,
    mime_type       VARCHAR(150),
    file_size_bytes BIGINT CHECK (file_size_bytes IS NULL OR file_size_bytes >= 0),
    uploaded_by     BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    uploaded_at     TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    CONSTRAINT ck_attachment_single_owner CHECK (
        (income_id IS NOT NULL AND expense_id IS NULL)
        OR (income_id IS NULL AND expense_id IS NOT NULL)
    )
);

CREATE INDEX idx_attachments_income ON attachments(income_id) WHERE income_id IS NOT NULL;
CREATE INDEX idx_attachments_expense ON attachments(expense_id) WHERE expense_id IS NOT NULL;

-- ------------------------------------------------------------
-- 10. AUDIT LOG
-- Lưu lịch sử tạo/sửa/xóa và dữ liệu trước/sau thay đổi.
-- ------------------------------------------------------------
CREATE TABLE audit_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name      VARCHAR(100) NOT NULL,
    record_id       BIGINT,
    action          audit_action NOT NULL,
    actor_user_id   BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    old_data        JSONB,
    new_data        JSONB,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id      UUID,
    ip_address      INET
);

CREATE INDEX idx_audit_logs_record ON audit_logs(table_name, record_id, changed_at DESC);
CREATE INDEX idx_audit_logs_actor ON audit_logs(actor_user_id, changed_at DESC);
CREATE INDEX idx_audit_logs_changed_at ON audit_logs(changed_at DESC);

-- ------------------------------------------------------------
-- 11. COMMON TRIGGERS
-- ------------------------------------------------------------
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_income_categories_updated_at
BEFORE UPDATE ON income_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_incomes_updated_at
BEFORE UPDATE ON incomes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_income_items_updated_at
BEFORE UPDATE ON income_items
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expense_categories_updated_at
BEFORE UPDATE ON expense_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- App có thể SET LOCAL app.current_user_id = '123' trong transaction
-- để trigger audit nhận biết người thao tác.
CREATE OR REPLACE FUNCTION audit_row_changes()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
DECLARE
    v_actor BIGINT;
    v_record_id BIGINT;
BEGIN
    BEGIN
        v_actor := NULLIF(current_setting('app.current_user_id', true), '')::BIGINT;
    EXCEPTION WHEN OTHERS THEN
        v_actor := NULL;
    END;

    IF TG_OP = 'INSERT' THEN
        v_record_id := NULLIF(to_jsonb(NEW)->>'id', '')::BIGINT;
        INSERT INTO audit_logs(table_name, record_id, action, actor_user_id, new_data)
        VALUES (TG_TABLE_NAME, v_record_id, 'INSERT', v_actor, to_jsonb(NEW));
        RETURN NEW;
    ELSIF TG_OP = 'UPDATE' THEN
        v_record_id := NULLIF(to_jsonb(NEW)->>'id', '')::BIGINT;
        INSERT INTO audit_logs(table_name, record_id, action, actor_user_id, old_data, new_data)
        VALUES (TG_TABLE_NAME, v_record_id, 'UPDATE', v_actor, to_jsonb(OLD), to_jsonb(NEW));
        RETURN NEW;
    ELSE
        v_record_id := NULLIF(to_jsonb(OLD)->>'id', '')::BIGINT;
        INSERT INTO audit_logs(table_name, record_id, action, actor_user_id, old_data)
        VALUES (TG_TABLE_NAME, v_record_id, 'DELETE', v_actor, to_jsonb(OLD));
        RETURN OLD;
    END IF;
END;
$$;

CREATE TRIGGER audit_app_users
AFTER INSERT OR UPDATE OR DELETE ON app_users
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_income_categories
AFTER INSERT OR UPDATE OR DELETE ON income_categories
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_incomes
AFTER INSERT OR UPDATE OR DELETE ON incomes
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_income_items
AFTER INSERT OR UPDATE OR DELETE ON income_items
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_expense_categories
AFTER INSERT OR UPDATE OR DELETE ON expense_categories
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_expenses
AFTER INSERT OR UPDATE OR DELETE ON expenses
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_attachments
AFTER INSERT OR UPDATE OR DELETE ON attachments
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

-- ------------------------------------------------------------
-- 12. REPORTING VIEWS
-- Dashboard/Báo cáo đọc từ các view này; không lưu số tổng hợp trùng lặp.
-- ------------------------------------------------------------
CREATE OR REPLACE VIEW vw_income_active AS
SELECT
    i.id,
    i.order_date,
    i.income_category_id,
    c.name AS income_category_name,
    i.customer_country,
    i.product_quantity,
    i.item_total,
    i.discount_amount,
    i.subtotal,
    i.shipping_amount,
    i.tax_amount,
    i.order_total,
    UPPER(i.currency_code) AS currency_code,
    i.coupon_code,
    i.source,
    i.note,
    i.created_at,
    i.updated_at
FROM incomes i
JOIN income_categories c ON c.id = i.income_category_id
WHERE i.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_expense_active AS
SELECT
    e.id,
    e.expense_date,
    e.expense_category_id,
    c.name AS expense_category_name,
    e.description,
    e.amount,
    UPPER(e.currency_code) AS currency_code,
    e.payee,
    e.source,
    e.note,
    e.created_at,
    e.updated_at
FROM expenses e
JOIN expense_categories c ON c.id = e.expense_category_id
WHERE e.deleted_at IS NULL;

-- Tổng thu/chi/chênh lệch theo ngày và từng loại tiền tệ.
CREATE OR REPLACE VIEW vw_cashflow_daily AS
WITH income_daily AS (
    SELECT order_date AS report_date,
           UPPER(currency_code) AS currency_code,
           SUM(order_total) AS total_income
    FROM incomes
    WHERE deleted_at IS NULL
    GROUP BY order_date, UPPER(currency_code)
),
expense_daily AS (
    SELECT expense_date AS report_date,
           UPPER(currency_code) AS currency_code,
           SUM(amount) AS total_expense
    FROM expenses
    WHERE deleted_at IS NULL
    GROUP BY expense_date, UPPER(currency_code)
)
SELECT
    COALESCE(i.report_date, e.report_date) AS report_date,
    COALESCE(i.currency_code, e.currency_code) AS currency_code,
    COALESCE(i.total_income, 0)::NUMERIC(18,2) AS total_income,
    COALESCE(e.total_expense, 0)::NUMERIC(18,2) AS total_expense,
    (COALESCE(i.total_income, 0) - COALESCE(e.total_expense, 0))::NUMERIC(18,2) AS net_amount
FROM income_daily i
FULL OUTER JOIN expense_daily e
    ON i.report_date = e.report_date
   AND i.currency_code = e.currency_code;

-- Tổng hợp theo tháng, phù hợp biểu đồ và so sánh kỳ.
CREATE OR REPLACE VIEW vw_cashflow_monthly AS
WITH income_monthly AS (
    SELECT DATE_TRUNC('month', order_date)::DATE AS month_start,
           UPPER(currency_code) AS currency_code,
           SUM(order_total) AS total_income
    FROM incomes
    WHERE deleted_at IS NULL
    GROUP BY 1, 2
),
expense_monthly AS (
    SELECT DATE_TRUNC('month', expense_date)::DATE AS month_start,
           UPPER(currency_code) AS currency_code,
           SUM(amount) AS total_expense
    FROM expenses
    WHERE deleted_at IS NULL
    GROUP BY 1, 2
)
SELECT
    COALESCE(i.month_start, e.month_start) AS month_start,
    COALESCE(i.currency_code, e.currency_code) AS currency_code,
    COALESCE(i.total_income, 0)::NUMERIC(18,2) AS total_income,
    COALESCE(e.total_expense, 0)::NUMERIC(18,2) AS total_expense,
    (COALESCE(i.total_income, 0) - COALESCE(e.total_expense, 0))::NUMERIC(18,2) AS net_amount
FROM income_monthly i
FULL OUTER JOIN expense_monthly e
    ON i.month_start = e.month_start
   AND i.currency_code = e.currency_code;

CREATE OR REPLACE VIEW vw_income_by_category AS
SELECT
    i.income_category_id,
    c.name AS income_category_name,
    UPPER(i.currency_code) AS currency_code,
    COUNT(*) AS transaction_count,
    SUM(i.order_total)::NUMERIC(18,2) AS total_income
FROM incomes i
JOIN income_categories c ON c.id = i.income_category_id
WHERE i.deleted_at IS NULL
GROUP BY i.income_category_id, c.name, UPPER(i.currency_code);

CREATE OR REPLACE VIEW vw_expense_by_category AS
SELECT
    e.expense_category_id,
    c.name AS expense_category_name,
    UPPER(e.currency_code) AS currency_code,
    COUNT(*) AS transaction_count,
    SUM(e.amount)::NUMERIC(18,2) AS total_expense
FROM expenses e
JOIN expense_categories c ON c.id = e.expense_category_id
WHERE e.deleted_at IS NULL
GROUP BY e.expense_category_id, c.name, UPPER(e.currency_code);

-- ------------------------------------------------------------
-- 13. INITIAL REFERENCE DATA
-- Không giả định quá nhiều loại. Có thể sửa/xóa mềm sau.
-- ------------------------------------------------------------
INSERT INTO income_categories(name, description)
VALUES ('Bán hàng', 'Khoản thu từ đơn hàng bán sản phẩm')
ON CONFLICT DO NOTHING;

INSERT INTO expense_categories(name, description)
VALUES
    ('Nguyên vật liệu', 'Chi phí mua nguyên vật liệu phục vụ sản xuất'),
    ('Vận chuyển', 'Chi phí giao nhận, vận chuyển'),
    ('Quảng cáo', 'Chi phí quảng cáo, marketing'),
    ('Phí dịch vụ', 'Phí nền tảng, thanh toán hoặc dịch vụ liên quan'),
    ('Khác', 'Các khoản chi chưa thuộc nhóm khác')
ON CONFLICT DO NOTHING;

COMMIT;

-- ============================================================
-- GỢI Ý TRUY VẤN
-- ============================================================
-- Dashboard theo khoảng thời gian và tiền tệ:
-- SELECT
--   COALESCE(SUM(order_total),0) AS total_income
-- FROM shop_finance.incomes
-- WHERE deleted_at IS NULL
--   AND order_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-30'
--   AND UPPER(currency_code) = 'USD';
--
-- SELECT
--   COALESCE(SUM(amount),0) AS total_expense
-- FROM shop_finance.expenses
-- WHERE deleted_at IS NULL
--   AND expense_date BETWEEN DATE '2026-09-01' AND DATE '2026-09-30'
--   AND UPPER(currency_code) = 'USD';
--
-- Báo cáo tháng:
-- SELECT * FROM shop_finance.vw_cashflow_monthly ORDER BY month_start DESC;
--
-- Loại chi cao nhất:
-- SELECT * FROM shop_finance.vw_expense_by_category
-- ORDER BY total_expense DESC LIMIT 1;
