-- Add 'plan' to product_type enum
ALTER TYPE product_type ADD VALUE IF NOT EXISTS 'plan';
