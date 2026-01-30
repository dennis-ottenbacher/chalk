-- Add company info columns to settings table
ALTER TABLE settings
ADD COLUMN IF NOT EXISTS company_name text,
ADD COLUMN IF NOT EXISTS company_address text,
ADD COLUMN IF NOT EXISTS company_zip text,
ADD COLUMN IF NOT EXISTS company_city text,
ADD COLUMN IF NOT EXISTS company_country text DEFAULT 'DE',
ADD COLUMN IF NOT EXISTS company_tax_id text, -- Steuernummer
ADD COLUMN IF NOT EXISTS company_vat_id text;
-- USt-IdNr