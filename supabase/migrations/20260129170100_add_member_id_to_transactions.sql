-- Add member_id to transactions table

ALTER TABLE transactions
ADD COLUMN IF NOT EXISTS member_id UUID REFERENCES profiles (id) ON DELETE SET NULL;

CREATE INDEX IF NOT EXISTS idx_transactions_member_id ON transactions (member_id);