BEGIN;

SET search_path TO shop_finance, public;

-- Additional income samples. reference_code makes this script safe to run repeatedly.
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
    (CURRENT_DATE - 85, 'Wholesale ceramic ornament order', 'Sales', 320.00, 'PAY-10004', 'HF-2026-004', 'IN_EU', 'B2B_WHOLESALE', 20, 16.00, 320.00, 0.00, 320.00, 0.00, 0.00, 0.00, 320.00),
    (CURRENT_DATE - 70, 'Instagram custom bracelet order', 'Sales', 72.00, 'PAY-10005', 'HF-2026-005', 'OUTSIDE_EU', 'INSTAGRAM_SHOP', 3, 24.00, 72.00, 0.00, 72.00, 0.00, 0.00, 0.00, 72.00),
    (CURRENT_DATE - 55, 'Workshop participation fee', 'Other Income', 150.00, 'PAY-10006', 'HF-2026-006', 'IN_EU', 'WEBSITE_DIRECT', 5, 30.00, 150.00, 0.00, 150.00, 0.00, 0.00, 0.00, 150.00),
    (CURRENT_DATE - 43, 'Etsy knitted tote bag order', 'Sales', 96.00, 'PAY-10007', 'HF-2026-007', 'IN_EU', 'ETSY_STORE', 2, 48.00, 96.00, 0.00, 96.00, 0.00, 0.00, 0.00, 96.00),
    (CURRENT_DATE - 31, 'Local craft fair sales', 'Sales', 275.00, 'PAY-10008', 'HF-2026-008', 'IN_EU', 'LOCAL_MARKET', 11, 25.00, 275.00, 0.00, 275.00, 0.00, 0.00, 0.00, 275.00),
    (CURRENT_DATE - 24, 'Website candle gift set', 'Sales', 118.00, 'PAY-10009', 'HF-2026-009', 'OUTSIDE_EU', 'WEBSITE_DIRECT', 2, 55.00, 110.00, 0.00, 110.00, 8.00, 0.00, 0.00, 118.00),
    (CURRENT_DATE - 15, 'Packaging design consultation', 'Other Income', 180.00, 'PAY-10010', 'HF-2026-010', 'IN_EU', 'B2B_WHOLESALE', 1, 180.00, 180.00, 0.00, 180.00, 0.00, 0.00, 0.00, 180.00),
    (CURRENT_DATE - 8, 'Instagram resin earrings order', 'Sales', 64.00, 'PAY-10011', 'HF-2026-011', 'IN_EU', 'INSTAGRAM_SHOP', 4, 16.00, 64.00, 0.00, 64.00, 0.00, 0.00, 0.00, 64.00),
    (CURRENT_DATE - 1, 'Etsy embroidered pouch order', 'Sales', 84.00, 'PAY-10012', 'HF-2026-012', 'OUTSIDE_EU', 'ETSY_STORE', 2, 38.00, 76.00, 0.00, 76.00, 8.00, 0.00, 0.00, 84.00)
) AS v(
    income_date, description, category_name, amount, reference_code, order_code,
    sale_region, sales_channel, product_qty, unit_price, item_total,
    discount_amount, subtotal, shipping_amount, tax_amount, tax_percent,
    amount_after_tax
)
JOIN income_categories c ON c.name = v.category_name
JOIN app_users u ON u.email = 'owner@demo.local'
WHERE NOT EXISTS (
    SELECT 1 FROM incomes i WHERE i.reference_code = v.reference_code
);

-- Additional expense samples across the available categories.
INSERT INTO expenses (
    expense_date, description, expense_category_id, amount, payee,
    origin_scope, payment_method, tax_percent, amount_after_tax, note, created_by
)
SELECT
    v.expense_date, v.description, c.id, v.amount, v.payee,
    v.origin_scope::origin_scope, v.payment_method::payment_method,
    v.tax_percent, v.amount_after_tax, v.note, u.id
FROM (VALUES
    (CURRENT_DATE - 82, 'International order shipping', 'Shipping', 42.00, 'DHL', 'INTERNATIONAL', 'CREDIT_CARD', 0.00, 42.00, 'Shipping for wholesale order'),
    (CURRENT_DATE - 67, 'Marketplace transaction fees', 'Service Fees', 18.50, 'Etsy', 'INTERNATIONAL', 'CREDIT_CARD', 0.00, 18.50, 'Monthly platform fees'),
    (CURRENT_DATE - 52, 'Part-time workshop assistant', 'Employee Salaries', 120.00, 'Workshop Assistant', 'DOMESTIC', 'BANK_TRANSFER', 0.00, 120.00, 'Workshop support'),
    (CURRENT_DATE - 40, 'Monthly utilities', 'Electricity / Water / Internet', 55.00, 'Utility Provider', 'DOMESTIC', 'BANK_TRANSFER', 10.00, 60.50, 'Shop utilities'),
    (CURRENT_DATE - 29, 'Studio rent', 'Premises Rent', 250.00, 'Studio Landlord', 'DOMESTIC', 'BANK_TRANSFER', 0.00, 250.00, 'Monthly studio rent'),
    (CURRENT_DATE - 22, 'Precision cutting tools', 'Tools / Equipment', 76.00, 'Tool House', 'DOMESTIC', 'CREDIT_CARD', 10.00, 83.60, 'New cutting tools'),
    (CURRENT_DATE - 14, 'Courier delivery charges', 'Shipping', 31.00, 'Local Courier', 'DOMESTIC', 'CASH', 0.00, 31.00, 'Local order deliveries'),
    (CURRENT_DATE - 7, 'Online store subscription', 'Service Fees', 29.00, 'Website Platform', 'INTERNATIONAL', 'PAYPAL', 0.00, 29.00, 'Monthly subscription'),
    (CURRENT_DATE - 1, 'Cleaning and miscellaneous supplies', 'Other Expenses', 22.00, 'Local Store', 'DOMESTIC', 'CASH', 10.00, 24.20, 'General shop supplies')
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
