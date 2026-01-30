-- Add columns to products
ALTER TABLE products
ADD COLUMN IF NOT EXISTS duration_months INTEGER;
-- null means infinite or N/A
ALTER TABLE products ADD COLUMN IF NOT EXISTS credits_amount INTEGER;
-- for 11er karte (renamed from entries_amount for clarity with credits)
ALTER TABLE products
ADD COLUMN IF NOT EXISTS recurring_interval TEXT;
-- 'month', 'year', etc.

-- Migrate data from tariffs to products
INSERT INTO
    products (
        name,
        description,
        price,
        type,
        duration_months,
        active
    )
SELECT
    name,
    'Migrated from Tariffs',
    price_monthly,
    'plan',
    duration_months,
    active
FROM tariffs;

-- Update subscriptions table
ALTER TABLE subscriptions
ADD COLUMN IF NOT EXISTS product_id UUID REFERENCES products (id);

-- Link subscriptions to products
-- We attempt to link based on the migration we just did.
UPDATE subscriptions
SET
    product_id = p.id
FROM products p, tariffs t
WHERE
    subscriptions.tariff_id = t.id
    AND p.name = t.name
    AND p.type = 'plan'
    AND p.description = 'Migrated from Tariffs';

-- Drop foreign key to tariffs
ALTER TABLE subscriptions
DROP CONSTRAINT IF EXISTS subscriptions_tariff_id_fkey;

ALTER TABLE subscriptions DROP COLUMN IF EXISTS tariff_id;

-- Drop tariffs table
DROP TABLE IF EXISTS tariffs;
