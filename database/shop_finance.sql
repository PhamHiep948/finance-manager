-- ============================================================
-- PostgreSQL schema — shop_finance (BẢN THU/CHI CƠ BẢN)
-- Web quản lý thu - chi shop handmade
-- PostgreSQL 15+
--
-- Mục tiêu: quản lý tiền vào / tiền ra ở mức cơ bản.
-- Không quản lý chi tiết sản phẩm, discount, shipping, tax...
--
-- Sơ đồ: docs/DATABASE.md · DBML: database/shop_finance.dbml
-- LƯU Ý: File này dùng để khởi tạo database mới.
-- Nếu database development đã chạy schema cũ, nên reset schema/dev DB
-- hoặc viết migration riêng thay vì chạy chồng trực tiếp.
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
CREATE TYPE audit_action AS ENUM ('INSERT', 'UPDATE', 'DELETE');

-- ============================================================
-- 2. USERS
-- ============================================================
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

-- ============================================================
-- 3. IMPORT BATCHES
-- Theo dõi từng lần import Excel.
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
-- Mỗi bản ghi là một khoản tiền vào.
-- Ví dụ đơn hàng có Order total = 22.10 USD thì amount = 22.10.
-- Không lưu item_total / discount / subtotal / shipping / tax.
-- ============================================================
CREATE TABLE incomes (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    income_date         DATE NOT NULL,
    description         TEXT NOT NULL,
    income_category_id  BIGINT NOT NULL REFERENCES income_categories(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL
                        CHECK (currency_code ~ '^[A-Z]{3}$'),
    reference_code      VARCHAR(150),

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
-- Mỗi bản ghi là một khoản tiền ra.
-- ============================================================
CREATE TABLE expenses (
    id                  BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
    expense_date        DATE NOT NULL,
    description         TEXT NOT NULL,
    expense_category_id BIGINT NOT NULL REFERENCES expense_categories(id),
    amount              NUMERIC(18,2) NOT NULL CHECK (amount > 0),
    currency_code       VARCHAR(3) NOT NULL
                        CHECK (currency_code ~ '^[A-Z]{3}$'),
    payee               VARCHAR(255),

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

CREATE INDEX idx_expenses_import_batch
    ON expenses(import_batch_id)
    WHERE import_batch_id IS NOT NULL;

-- ============================================================
-- 8. ATTACHMENTS
-- PostgreSQL chỉ lưu metadata/đường dẫn, không lưu file binary.
-- Chính xác một trong income_id / expense_id phải có giá trị.
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

-- Backend có thể SET LOCAL app.current_user_id = '123' trong transaction
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
-- Dashboard/Báo cáo đọc trực tiếp từ dữ liệu thật.
-- Không cộng các loại tiền tệ khác nhau vào cùng một tổng.
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
SELECT 'Bán hàng', 'Thu từ bán sản phẩm'
WHERE NOT EXISTS (
    SELECT 1 FROM income_categories
    WHERE LOWER(name) = LOWER('Bán hàng') AND deleted_at IS NULL
);

INSERT INTO income_categories (name, description)
SELECT 'Thu khác', 'Các khoản thu khác ngoài bán hàng'
WHERE NOT EXISTS (
    SELECT 1 FROM income_categories
    WHERE LOWER(name) = LOWER('Thu khác') AND deleted_at IS NULL
);

INSERT INTO expense_categories (name, description)
SELECT v.name, v.description
FROM (VALUES
    ('Nguyên vật liệu', 'Chi mua nguyên vật liệu làm sản phẩm'),
    ('Vận chuyển', 'Chi phí giao nhận và vận chuyển'),
    ('Quảng cáo', 'Chi phí quảng cáo và marketing'),
    ('Phí dịch vụ', 'Phí nền tảng, thanh toán hoặc dịch vụ liên quan'),
    ('Chi khác', 'Các khoản chi chưa thuộc nhóm khác')
) AS v(name, description)
WHERE NOT EXISTS (
    SELECT 1
    FROM expense_categories e
    WHERE LOWER(e.name) = LOWER(v.name)
      AND e.deleted_at IS NULL
);

COMMIT;
