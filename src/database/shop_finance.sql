-- ============================================================
-- PostgreSQL schema — shop_finance (HandmadeFinance)
-- Income and expense management web app for a handmade shop
-- PostgreSQL 15+
--
-- Aligned with the current interface:
-- Users: phone number, avatar, timezone, active status.
-- Income: amount = pre-tax amount; post-tax amount; sales channel; record status;
--         order code, EU region, quantity, unit price, Item/Discount/Subtotal/Shipping/Tax.
-- Expenses: payee, domestic/international scope, payment method, tax rate, post-tax amount, status.
-- Amounts are stored in USD. The UI converts to EUR for display (no separate datasets).
-- No SKU inventory management or separate multi-line product orders.
--
-- Diagram: docs/DATABASE.md · DBML: src/database/shop_finance.dbml
-- NOTE: This file is intended to initialize a new database.
-- If the development database already uses an older schema, reset the schema/dev DB
-- or write a dedicated migration instead of applying this file on top of it.
-- ============================================================

BEGIN;

CREATE SCHEMA IF NOT EXISTS shop_finance;
SET search_path TO shop_finance, public;

-- ============================================================
-- 1. ENUMS
-- ============================================================
CREATE TYPE user_role AS ENUM ('ADMIN', 'SHOP_OWNER', 'EMPLOYEE', 'VIEWER');
CREATE TYPE data_source AS ENUM ('MANUAL', 'EXCEL_IMPORT');
CREATE TYPE import_type AS ENUM ('INCOME', 'EXPENSE');
CREATE TYPE import_status AS ENUM ('PENDING', 'PROCESSING', 'COMPLETED', 'FAILED');
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE', 'LOGIN', 'EXPORT', 'IMPORT');
CREATE TYPE sale_region AS ENUM ('IN_EU', 'OUTSIDE_EU');
CREATE TYPE origin_scope AS ENUM ('DOMESTIC', 'INTERNATIONAL');
CREATE TYPE sales_channel AS ENUM (
    'ETSY_STORE',
    'WEBSITE_DIRECT',
    'INSTAGRAM_SHOP',
    'LOCAL_MARKET',
    'B2B_WHOLESALE'
);
CREATE TYPE payment_method AS ENUM ('CREDIT_CARD', 'BANK_TRANSFER', 'CASH', 'PAYPAL');
CREATE TYPE record_status AS ENUM ('DRAFT', 'PENDING', 'COMPLETED');

-- ============================================================
-- 2. USERS
-- ============================================================
CREATE TABLE app_users (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    username        VARCHAR(100) NOT NULL,
    email           VARCHAR(255),
    password_hash   TEXT NOT NULL,
    full_name       VARCHAR(255) NOT NULL,
    phone           VARCHAR(30),
    avatar_url      TEXT,
    timezone        VARCHAR(64) NOT NULL DEFAULT 'Asia/Ho_Chi_Minh',
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

-- ============================================================
-- 3. IMPORT BATCHES
-- Tracks each Excel import execution.
-- ============================================================
CREATE TABLE import_batches (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    import_type         import_type NOT NULL,
    original_file_name  VARCHAR(500) NOT NULL,
    stored_file_path    TEXT,
    status              import_status NOT NULL DEFAULT 'PENDING',
    total_rows          INTEGER NOT NULL DEFAULT 0 CHECK (total_rows >= 0),
    success_rows        INTEGER NOT NULL DEFAULT 0 CHECK (success_rows >= 0),
    failed_rows         INTEGER NOT NULL DEFAULT 0 CHECK (failed_rows >= 0),
    error_details       JSONB,
    imported_by         BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    completed_at        TIMESTAMPTZ,
    CONSTRAINT ck_import_row_counts
        CHECK (success_rows + failed_rows <= total_rows)
);

-- ============================================================
-- 4. INCOME CATEGORIES
-- ============================================================
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

-- ============================================================
-- 5. INCOMES
-- Each record represents one incoming amount.
-- amount = pre-tax amount shown in the list/form.
-- Item − Discount = Subtotal; Subtotal + Shipping + Tax = amount.
-- ============================================================
CREATE TABLE incomes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    income_date         DATE NOT NULL,
    description         TEXT NOT NULL,
    income_category_id  BIGINT NOT NULL REFERENCES income_categories(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'USD'
                        CHECK (currency_code = 'USD'),
    reference_code      VARCHAR(150),
    order_code          VARCHAR(150),
    sale_region         sale_region,
    sales_channel       sales_channel,
    record_status       record_status NOT NULL DEFAULT 'COMPLETED',
    product_qty         INTEGER CHECK (product_qty IS NULL OR product_qty > 0),
    unit_price          NUMERIC(18,2) CHECK (unit_price IS NULL OR unit_price >= 0),
    item_total          NUMERIC(18,2) CHECK (item_total IS NULL OR item_total >= 0),
    discount_amount     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (discount_amount >= 0),
    discount_code       VARCHAR(80),
    subtotal            NUMERIC(18,2) CHECK (subtotal IS NULL OR subtotal >= 0),
    shipping_amount     NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (shipping_amount >= 0),
    tax_amount          NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (tax_amount >= 0),
    tax_percent         NUMERIC(6,2) NOT NULL DEFAULT 0
                        CHECK (tax_percent >= 0 AND tax_percent <= 100),
    amount_after_tax    NUMERIC(18,2) NOT NULL DEFAULT 0 CHECK (amount_after_tax >= 0),

    source              data_source NOT NULL DEFAULT 'MANUAL',
    import_batch_id     BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,
    note                TEXT,

    created_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    deleted_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,

    CONSTRAINT ck_income_import_source CHECK (
        (source = 'EXCEL_IMPORT' AND import_batch_id IS NOT NULL)
        OR (source = 'MANUAL' AND import_batch_id IS NULL)
    )
);

CREATE INDEX idx_incomes_date_active
    ON incomes(income_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_category_date_active
    ON incomes(income_category_id, income_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_currency_active
    ON incomes(currency_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_reference_active
    ON incomes(reference_code)
    WHERE reference_code IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_incomes_order_code_active
    ON incomes(order_code)
    WHERE order_code IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_incomes_sale_region_active
    ON incomes(sale_region)
    WHERE sale_region IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_incomes_sales_channel_active
    ON incomes(sales_channel)
    WHERE sales_channel IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_incomes_record_status_active
    ON incomes(record_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_incomes_import_batch
    ON incomes(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- ============================================================
-- 6. EXPENSE CATEGORIES
-- ============================================================
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

-- ============================================================
-- 7. EXPENSES
-- Each record represents one outgoing amount. amount = pre-tax amount.
-- ============================================================
CREATE TABLE expenses (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expense_date        DATE NOT NULL,
    description         TEXT NOT NULL,
    expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL DEFAULT 'USD'
                        CHECK (currency_code = 'USD'),
    payee               VARCHAR(255),
    origin_scope        origin_scope NOT NULL DEFAULT 'DOMESTIC',
    payment_method      payment_method,
    record_status       record_status NOT NULL DEFAULT 'COMPLETED',
    tax_percent         NUMERIC(6,2) NOT NULL DEFAULT 0
                        CHECK (tax_percent >= 0 AND tax_percent <= 100),
    amount_after_tax    NUMERIC(18,2) NOT NULL CHECK (amount_after_tax > 0),

    source              data_source NOT NULL DEFAULT 'MANUAL',
    import_batch_id     BIGINT REFERENCES import_batches(id) ON DELETE SET NULL,
    note                TEXT,

    created_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    updated_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    created_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    updated_at          TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    deleted_at          TIMESTAMPTZ,
    deleted_by          BIGINT REFERENCES app_users(id) ON DELETE SET NULL,

    CONSTRAINT ck_expense_import_source CHECK (
        (source = 'EXCEL_IMPORT' AND import_batch_id IS NOT NULL)
        OR (source = 'MANUAL' AND import_batch_id IS NULL)
    )
);

CREATE INDEX idx_expenses_date_active
    ON expenses(expense_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_category_date_active
    ON expenses(expense_category_id, expense_date)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_currency_active
    ON expenses(currency_code)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_payee_active
    ON expenses(LOWER(payee))
    WHERE payee IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_expenses_origin_scope_active
    ON expenses(origin_scope)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_payment_method_active
    ON expenses(payment_method)
    WHERE payment_method IS NOT NULL AND deleted_at IS NULL;

CREATE INDEX idx_expenses_record_status_active
    ON expenses(record_status)
    WHERE deleted_at IS NULL;

CREATE INDEX idx_expenses_import_batch
    ON expenses(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- ============================================================
-- 8. ATTACHMENTS
-- PostgreSQL stores only metadata/paths, not binary files.
-- Exactly one of income_id / expense_id must have a value.
-- ============================================================
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

CREATE INDEX idx_attachments_income
    ON attachments(income_id)
    WHERE income_id IS NOT NULL;

CREATE INDEX idx_attachments_expense
    ON attachments(expense_id)
    WHERE expense_id IS NOT NULL;

-- ============================================================
-- 9. AUDIT LOGS
-- ============================================================
CREATE TABLE audit_logs (
    id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    table_name      VARCHAR(100),
    record_id       BIGINT,
    action          audit_action NOT NULL,
    module          VARCHAR(100),
    detail          TEXT,
    actor_user_id   BIGINT REFERENCES app_users(id) ON DELETE SET NULL,
    old_data        JSONB,
    new_data        JSONB,
    changed_at      TIMESTAMPTZ NOT NULL DEFAULT NOW(),
    request_id      UUID,
    ip_address      INET
);

CREATE INDEX idx_audit_logs_record
    ON audit_logs(table_name, record_id, changed_at DESC);

CREATE INDEX idx_audit_logs_actor
    ON audit_logs(actor_user_id, changed_at DESC);

CREATE INDEX idx_audit_logs_changed_at
    ON audit_logs(changed_at DESC);

-- ============================================================
-- 10. FUNCTIONS
-- ============================================================
CREATE OR REPLACE FUNCTION set_updated_at()
RETURNS TRIGGER
LANGUAGE plpgsql
AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;

-- The backend can SET LOCAL app.current_user_id = '123' within a transaction
-- so the audit trigger can identify the acting user.
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

-- ============================================================
-- 11. UPDATED_AT TRIGGERS
-- ============================================================
CREATE TRIGGER trg_app_users_updated_at
BEFORE UPDATE ON app_users
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_income_categories_updated_at
BEFORE UPDATE ON income_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_incomes_updated_at
BEFORE UPDATE ON incomes
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expense_categories_updated_at
BEFORE UPDATE ON expense_categories
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE TRIGGER trg_expenses_updated_at
BEFORE UPDATE ON expenses
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- ============================================================
-- 12. AUDIT TRIGGERS
-- ============================================================
CREATE TRIGGER audit_app_users
AFTER INSERT OR UPDATE OR DELETE ON app_users
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_import_batches
AFTER INSERT OR UPDATE OR DELETE ON import_batches
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_income_categories
AFTER INSERT OR UPDATE OR DELETE ON income_categories
FOR EACH ROW EXECUTE FUNCTION audit_row_changes();

CREATE TRIGGER audit_incomes
AFTER INSERT OR UPDATE OR DELETE ON incomes
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

-- ============================================================
-- 13. REPORTING VIEWS
-- Dashboard/Reports read directly from persisted data (USD amounts).
-- EUR conversion happens only in the UI. The currency_code column remains 'USD'.
-- ============================================================
CREATE OR REPLACE VIEW vw_income_active AS
SELECT
    i.id,
    i.income_date,
    i.description,
    i.income_category_id,
    c.name AS income_category_name,
    i.amount,
    i.currency_code,
    i.reference_code,
    i.order_code,
    i.sale_region,
    i.sales_channel,
    i.record_status,
    i.product_qty,
    i.unit_price,
    i.item_total,
    i.discount_amount,
    i.discount_code,
    i.subtotal,
    i.shipping_amount,
    i.tax_amount,
    i.tax_percent,
    i.amount_after_tax,
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
    e.description,
    e.expense_category_id,
    c.name AS expense_category_name,
    e.amount,
    e.currency_code,
    e.payee,
    e.origin_scope,
    e.payment_method,
    e.record_status,
    e.tax_percent,
    e.amount_after_tax,
    e.source,
    e.note,
    e.created_at,
    e.updated_at
FROM expenses e
JOIN expense_categories c ON c.id = e.expense_category_id
WHERE e.deleted_at IS NULL;

CREATE OR REPLACE VIEW vw_cashflow_daily AS
WITH income_daily AS (
    SELECT
        income_date AS report_date,
        currency_code,
        SUM(amount) AS total_income
    FROM incomes
    WHERE deleted_at IS NULL
    GROUP BY income_date, currency_code
),
expense_daily AS (
    SELECT
        expense_date AS report_date,
        currency_code,
        SUM(amount) AS total_expense
    FROM expenses
    WHERE deleted_at IS NULL
    GROUP BY expense_date, currency_code
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

CREATE OR REPLACE VIEW vw_cashflow_monthly AS
WITH income_monthly AS (
    SELECT
        DATE_TRUNC('month', income_date)::DATE AS month_start,
        currency_code,
        SUM(amount) AS total_income
    FROM incomes
    WHERE deleted_at IS NULL
    GROUP BY 1, 2
),
expense_monthly AS (
    SELECT
        DATE_TRUNC('month', expense_date)::DATE AS month_start,
        currency_code,
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
    i.currency_code,
    COUNT(*) AS transaction_count,
    SUM(i.amount)::NUMERIC(18,2) AS total_income
FROM incomes i
JOIN income_categories c ON c.id = i.income_category_id
WHERE i.deleted_at IS NULL
GROUP BY i.income_category_id, c.name, i.currency_code;

CREATE OR REPLACE VIEW vw_expense_by_category AS
SELECT
    e.expense_category_id,
    c.name AS expense_category_name,
    e.currency_code,
    COUNT(*) AS transaction_count,
    SUM(e.amount)::NUMERIC(18,2) AS total_expense
FROM expenses e
JOIN expense_categories c ON c.id = e.expense_category_id
WHERE e.deleted_at IS NULL
GROUP BY e.expense_category_id, c.name, e.currency_code;

-- ============================================================
-- 14. BASIC SEED DATA
-- ============================================================
INSERT INTO income_categories (name, description)
SELECT 'Sales', 'Income from product sales'
WHERE NOT EXISTS (
    SELECT 1 FROM income_categories
    WHERE LOWER(name) = LOWER('Sales') AND deleted_at IS NULL
);

INSERT INTO income_categories (name, description)
SELECT 'Other Income', 'Income other than product sales'
WHERE NOT EXISTS (
    SELECT 1 FROM income_categories
    WHERE LOWER(name) = LOWER('Other Income') AND deleted_at IS NULL
);

INSERT INTO expense_categories (name, description)
SELECT v.name, v.description
FROM (VALUES
    ('Raw Materials', 'Cost of materials used to make products'),
    ('Packaging', 'Cost of boxes, bags, labels, and packaging'),
    ('Shipping', 'Delivery and transportation costs'),
    ('Advertising', 'Advertising and marketing costs'),
    ('Service Fees', 'Platform, payment, or related service fees'),
    ('Employee Salaries', 'Salary expenses (amount only, not a payroll module)'),
    ('Electricity / Water / Internet', 'Shop utility expenses'),
    ('Premises Rent', 'Shop/stall rental expenses'),
    ('Tools / Equipment', 'Tools and equipment used for production'),
    ('Other Expenses', 'Expenses not covered by another category')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM expense_categories e
    WHERE LOWER(e.name) = LOWER(v.name)
      AND e.deleted_at IS NULL
);

-- Demo accounts. Development password for every account: ChangeMe123!
INSERT INTO app_users (username, email, password_hash, full_name, phone, avatar_url, role, is_active)
SELECT v.username, v.email, 'Ksm3rlVsPVFYushv5dfq7g==.JunPWMEb5UCidp5qJBSBo9dnUKMjinK1m5ZZzCJDZcs=', v.full_name, v.phone, v.avatar_url, v.role::user_role, v.is_active
FROM (VALUES
    ('admin', 'admin@demo.local', 'Admin', '090 123 4567', 'https://i.pravatar.cc/64?img=33', 'ADMIN', TRUE),
    ('owner', 'owner@demo.local', 'Shop Owner', '090 222 3333', 'https://i.pravatar.cc/64?img=12', 'SHOP_OWNER', TRUE),
    ('staff', 'staff@demo.local', 'Employee', '090 333 4444', 'https://i.pravatar.cc/64?img=11', 'EMPLOYEE', TRUE),
    ('viewer', 'viewer@demo.local', 'Viewer', '090 555 6666', 'https://i.pravatar.cc/64?img=5', 'VIEWER', TRUE)
) AS v(username, email, full_name, phone, avatar_url, role, is_active)
WHERE NOT EXISTS (
    SELECT 1 FROM app_users u
    WHERE LOWER(u.email) = LOWER(v.email) AND u.deleted_at IS NULL
);

-- Representative development transactions for dashboard and report testing.
INSERT INTO incomes (
    income_date, description, income_category_id, amount, reference_code,
    order_code, sale_region, sales_channel, product_qty, unit_price,
    item_total, discount_amount, subtotal, shipping_amount, tax_amount,
    tax_percent, amount_after_tax, created_by
)
SELECT
    v.income_date, v.description, c.id, v.amount, v.reference_code,
    v.order_code, v.sale_region::sale_region, v.sales_channel::sales_channel,
    v.product_qty, v.unit_price, v.item_total, v.discount_amount,
    v.subtotal, v.shipping_amount, v.tax_amount, v.tax_percent,
    v.amount_after_tax, u.id
FROM (VALUES
    (CURRENT_DATE - 20, 'Etsy flower bouquet order', 125.00, 'PAY-10001', 'HF-2026-001', 'IN_EU', 'ETSY_STORE', 2, 60.00, 120.00, 5.00, 115.00, 10.00, 0.00, 0.00, 125.00),
    (CURRENT_DATE - 12, 'Direct website macrame order', 89.00, 'PAY-10002', 'HF-2026-002', 'OUTSIDE_EU', 'WEBSITE_DIRECT', 1, 80.00, 80.00, 0.00, 80.00, 9.00, 0.00, 0.00, 89.00),
    (CURRENT_DATE - 5, 'Local market weekend sales', 210.00, 'PAY-10003', 'HF-2026-003', 'IN_EU', 'LOCAL_MARKET', 7, 30.00, 210.00, 0.00, 210.00, 0.00, 0.00, 0.00, 210.00)
) AS v(
    income_date, description, amount, reference_code, order_code, sale_region,
    sales_channel, product_qty, unit_price, item_total, discount_amount,
    subtotal, shipping_amount, tax_amount, tax_percent, amount_after_tax
)
JOIN income_categories c ON c.name = 'Sales'
JOIN app_users u ON u.email = 'owner@demo.local'
WHERE NOT EXISTS (
    SELECT 1 FROM incomes i WHERE i.reference_code = v.reference_code
);

INSERT INTO expenses (
    expense_date, description, expense_category_id, amount, payee,
    origin_scope, payment_method, tax_percent, amount_after_tax, note, created_by
)
SELECT
    v.expense_date, v.description, c.id, v.amount, v.payee,
    v.origin_scope::origin_scope, v.payment_method::payment_method,
    v.tax_percent, v.amount_after_tax, v.note, u.id
FROM (VALUES
    (CURRENT_DATE - 18, 'Cotton yarn and fabric', 'Raw Materials', 48.00, 'Craft Supply Co.', 'DOMESTIC', 'BANK_TRANSFER', 10.00, 52.80, 'Materials for September orders'),
    (CURRENT_DATE - 10, 'Shipping boxes and labels', 'Packaging', 24.00, 'PackRight', 'DOMESTIC', 'CREDIT_CARD', 10.00, 26.40, 'Packaging restock'),
    (CURRENT_DATE - 3, 'Social media campaign', 'Advertising', 35.00, 'Meta Ads', 'INTERNATIONAL', 'CREDIT_CARD', 0.00, 35.00, 'Seven-day campaign')
) AS v(
    expense_date, description, category_name, amount, payee, origin_scope,
    payment_method, tax_percent, amount_after_tax, note
)
JOIN expense_categories c ON c.name = v.category_name
JOIN app_users u ON u.email = 'owner@demo.local'
WHERE NOT EXISTS (
    SELECT 1
    FROM expenses e
    WHERE e.description = v.description AND e.expense_date = v.expense_date
);

COMMIT;
