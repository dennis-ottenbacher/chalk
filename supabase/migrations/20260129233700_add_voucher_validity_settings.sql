-- Add voucher validity settings to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS voucher_validity_years INTEGER NOT NULL DEFAULT 3,
ADD COLUMN IF NOT EXISTS voucher_validity_mode TEXT NOT NULL DEFAULT 'year_end' CHECK (
    voucher_validity_mode IN ('exact_date', 'year_end')
);

COMMENT ON COLUMN settings.voucher_validity_years IS 'Number of years a voucher is valid';

COMMENT ON COLUMN settings.voucher_validity_mode IS 'How to calculate voucher expiry: exact_date (X years from purchase) or year_end (until end of Xth year)';