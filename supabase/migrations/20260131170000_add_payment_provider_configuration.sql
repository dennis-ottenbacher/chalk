-- Payment Provider Configuration for Mollie Integration
-- Migration: add_payment_provider_configuration

-- Create payment provider enum
CREATE TYPE "public"."payment_provider" AS ENUM ('standalone', 'mollie');

-- Payment Configuration Table (per organization)
CREATE TABLE "public"."payment_configurations" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID REFERENCES "public"."organizations"("id") ON DELETE CASCADE NOT NULL UNIQUE,
    -- Provider Selection
    "card_provider" "public"."payment_provider" DEFAULT 'standalone' NOT NULL,
    -- Mollie Settings
    "mollie_api_key" TEXT,
    "mollie_test_mode" BOOLEAN DEFAULT true NOT NULL,
    "mollie_enabled" BOOLEAN DEFAULT false NOT NULL,
    -- Timestamps
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,
    "updated_at" TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- Mollie Payment Tracking Table
CREATE TABLE "public"."mollie_payments" (
    "id" UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    "organization_id" UUID REFERENCES "public"."organizations"("id") ON DELETE CASCADE NOT NULL,
    "mollie_id" TEXT NOT NULL,
    "transaction_id" UUID REFERENCES "public"."transactions"("id") ON DELETE SET NULL,
    "amount" DECIMAL(10,2) NOT NULL,
    "currency" TEXT DEFAULT 'EUR' NOT NULL,
    "status" TEXT NOT NULL,  -- open, pending, paid, failed, canceled, expired
    "method" TEXT,           -- creditcard, applepay, directdebit, etc.
    "description" TEXT,
    "redirect_url" TEXT,
    "webhook_url" TEXT,
    "checkout_url" TEXT,
    "paid_at" TIMESTAMPTZ,
    "metadata" JSONB,
    "created_at" TIMESTAMPTZ DEFAULT now() NOT NULL,

-- Ensure mollie_id is unique per organization
CONSTRAINT "mollie_payments_mollie_id_org_unique" UNIQUE ("organization_id", "mollie_id")
);

-- Add mollie_payment_id to transactions
ALTER TABLE "public"."transactions" ADD COLUMN IF NOT EXISTS "mollie_payment_id" TEXT;

-- RLS Policies for payment_configurations
ALTER TABLE "public"."payment_configurations" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization payment config"
    ON "public"."payment_configurations"
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" WHERE id = auth.uid()
        )
    );

CREATE POLICY "Admins can manage payment config"
    ON "public"."payment_configurations"
    FOR ALL
    USING (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    )
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" 
            WHERE id = auth.uid() AND role IN ('admin', 'manager')
        )
    );

-- RLS Policies for mollie_payments
ALTER TABLE "public"."mollie_payments" ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their organization mollie payments"
    ON "public"."mollie_payments"
    FOR SELECT
    USING (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" WHERE id = auth.uid()
        )
    );

CREATE POLICY "Staff can insert mollie payments"
    ON "public"."mollie_payments"
    FOR INSERT
    WITH CHECK (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" WHERE id = auth.uid()
        )
    );

CREATE POLICY "System can update mollie payments"
    ON "public"."mollie_payments"
    FOR UPDATE
    USING (
        organization_id IN (
            SELECT organization_id FROM "public"."profiles" WHERE id = auth.uid()
        )
    );

-- Indexes for performance
CREATE INDEX "mollie_payments_organization_id_idx" ON "public"."mollie_payments" ("organization_id");

CREATE INDEX "mollie_payments_status_idx" ON "public"."mollie_payments" ("status");

CREATE INDEX "mollie_payments_transaction_id_idx" ON "public"."mollie_payments" ("transaction_id");

-- Trigger for updated_at
CREATE TRIGGER "update_payment_configurations_updated_at"
    BEFORE UPDATE ON "public"."payment_configurations"
    FOR EACH ROW
    EXECUTE FUNCTION "public"."update_updated_at_column"();