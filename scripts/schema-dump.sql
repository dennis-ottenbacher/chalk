


SET statement_timeout = 0;
SET lock_timeout = 0;
SET idle_in_transaction_session_timeout = 0;
SET client_encoding = 'UTF8';
SET standard_conforming_strings = on;
SELECT pg_catalog.set_config('search_path', '', false);
SET check_function_bodies = false;
SET xmloption = content;
SET client_min_messages = warning;
SET row_security = off;


CREATE EXTENSION IF NOT EXISTS "pg_net" WITH SCHEMA "extensions";






COMMENT ON SCHEMA "public" IS 'standard public schema';



CREATE EXTENSION IF NOT EXISTS "pg_graphql" WITH SCHEMA "graphql";






CREATE EXTENSION IF NOT EXISTS "pg_stat_statements" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "pgcrypto" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "supabase_vault" WITH SCHEMA "vault";






CREATE EXTENSION IF NOT EXISTS "uuid-ossp" WITH SCHEMA "extensions";






CREATE EXTENSION IF NOT EXISTS "vector" WITH SCHEMA "extensions";






CREATE TYPE "public"."checkin_status" AS ENUM (
    'valid',
    'invalid',
    'pending'
);


ALTER TYPE "public"."checkin_status" OWNER TO "postgres";


CREATE TYPE "public"."checklist_item_type" AS ENUM (
    'checkbox',
    'rating',
    'text',
    'multiselect'
);


ALTER TYPE "public"."checklist_item_type" OWNER TO "postgres";


CREATE TYPE "public"."payment_method" AS ENUM (
    'cash',
    'card',
    'voucher'
);


ALTER TYPE "public"."payment_method" OWNER TO "postgres";


CREATE TYPE "public"."product_type" AS ENUM (
    'goods',
    'entry',
    'rental',
    'voucher',
    'plan'
);


ALTER TYPE "public"."product_type" OWNER TO "postgres";


CREATE TYPE "public"."shift_status" AS ENUM (
    'draft',
    'published',
    'cancelled'
);


ALTER TYPE "public"."shift_status" OWNER TO "postgres";


CREATE TYPE "public"."transaction_status" AS ENUM (
    'completed',
    'cancelled',
    'refunded'
);


ALTER TYPE "public"."transaction_status" OWNER TO "postgres";


CREATE TYPE "public"."user_role" AS ENUM (
    'admin',
    'staff',
    'member',
    'athlete',
    'manager'
);


ALTER TYPE "public"."user_role" OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."decrement_reply_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF OLD.thread_parent_id IS NOT NULL THEN
        UPDATE chat_messages 
        SET reply_count = GREATEST(0, reply_count - 1)
        WHERE id = OLD.thread_parent_id;
    END IF;
    RETURN OLD;
END;
$$;


ALTER FUNCTION "public"."decrement_reply_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."is_chat_eligible"() RETURNS boolean
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT EXISTS (
        SELECT 1 FROM profiles 
        WHERE id = auth.uid() 
        AND role IN ('staff', 'manager', 'admin')
    )
$$;


ALTER FUNCTION "public"."is_chat_eligible"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "org_id" "uuid") RETURNS TABLE("id" "uuid", "document_id" "uuid", "content" "text", "similarity" double precision)
    LANGUAGE "plpgsql"
    AS $$
BEGIN
  RETURN QUERY
  SELECT
    document_chunks.id,
    document_chunks.document_id,
    document_chunks.content,
    1 - (document_chunks.embedding <=> query_embedding) AS similarity
  FROM document_chunks
  WHERE 1 - (document_chunks.embedding <=> query_embedding) > match_threshold
  AND document_chunks.organization_id = org_id
  ORDER BY document_chunks.embedding <=> query_embedding
  LIMIT match_count;
END;
$$;


ALTER FUNCTION "public"."match_documents"("query_embedding" "extensions"."vector", "match_threshold" double precision, "match_count" integer, "org_id" "uuid") OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_landing_pages_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = now();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_landing_pages_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_reply_count"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    IF NEW.thread_parent_id IS NOT NULL THEN
        UPDATE chat_messages 
        SET reply_count = reply_count + 1
        WHERE id = NEW.thread_parent_id;
    END IF;
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_reply_count"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_tse_configurations_updated_at"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_tse_configurations_updated_at"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."update_updated_at_column"() RETURNS "trigger"
    LANGUAGE "plpgsql"
    AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$;


ALTER FUNCTION "public"."update_updated_at_column"() OWNER TO "postgres";


CREATE OR REPLACE FUNCTION "public"."user_organization_id"() RETURNS "uuid"
    LANGUAGE "sql" SECURITY DEFINER
    AS $$
    SELECT organization_id FROM profiles WHERE id = auth.uid()
$$;


ALTER FUNCTION "public"."user_organization_id"() OWNER TO "postgres";

SET default_tablespace = '';

SET default_table_access_method = "heap";


CREATE TABLE IF NOT EXISTS "public"."chalk_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "chalk_chat_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."chalk_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_channel_members" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "joined_at" timestamp with time zone DEFAULT "now"(),
    "last_read_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_channel_members" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_channels" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_private" boolean DEFAULT false,
    "created_by" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_channels" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_message_attachments" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "file_url" "text" NOT NULL,
    "file_type" "text" NOT NULL,
    "file_name" "text" NOT NULL,
    "file_size" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_message_attachments" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_message_reactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "message_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "emoji" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_message_reactions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "channel_id" "uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "thread_parent_id" "uuid",
    "content" "text" NOT NULL,
    "reply_count" integer DEFAULT 0,
    "is_edited" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checkins" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "user_id" "uuid",
    "timestamp" timestamp with time zone DEFAULT "now"(),
    "status" "public"."checkin_status" NOT NULL,
    "processed_by" "uuid",
    "location_id" "text"
);


ALTER TABLE "public"."checkins" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_items" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "template_id" "uuid" NOT NULL,
    "item_type" "public"."checklist_item_type" NOT NULL,
    "label" "text" NOT NULL,
    "description" "text",
    "options" "jsonb",
    "sort_order" integer DEFAULT 0,
    "required" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checklist_items" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_responses" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shift_checklist_id" "uuid" NOT NULL,
    "item_id" "uuid" NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "response_value" "jsonb" NOT NULL,
    "completed_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checklist_responses" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."checklist_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."checklist_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."conversation_states" (
    "staff_id" "uuid" NOT NULL,
    "state" "text" DEFAULT 'IDLE'::"text" NOT NULL,
    "data" "jsonb" DEFAULT '{}'::"jsonb",
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."conversation_states" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."document_chunks" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "document_id" "uuid",
    "content" "text" NOT NULL,
    "embedding" "extensions"."vector"(1536),
    "chunk_index" integer,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."document_chunks" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."documents" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "title" "text" NOT NULL,
    "content" "text",
    "metadata" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."documents" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."landing_pages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "slug" "text" NOT NULL,
    "title" "text" NOT NULL,
    "html_content" "text" NOT NULL,
    "is_published" boolean DEFAULT false,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "created_by" "uuid"
);


ALTER TABLE "public"."landing_pages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."organizations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "slug" "text" NOT NULL,
    "name" "text" NOT NULL,
    "custom_domain" "text",
    "settings" "jsonb" DEFAULT '{}'::"jsonb",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."organizations" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."products" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "name" "text" NOT NULL,
    "description" "text",
    "price" numeric(10,2) NOT NULL,
    "tax_rate" numeric(5,2) DEFAULT 19.00,
    "type" "public"."product_type" NOT NULL,
    "duration_months" integer,
    "credits_amount" integer,
    "recurring_interval" "text",
    "active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."products" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."profiles" (
    "id" "uuid" NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "first_name" "text",
    "last_name" "text",
    "role" "public"."user_role" DEFAULT 'member'::"public"."user_role",
    "member_id" "text",
    "avatar_url" "text",
    "waiver_signed" boolean DEFAULT false,
    "address" "text",
    "city" "text",
    "zip_code" "text",
    "birth_date" "date",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."profiles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."role_permissions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "role" "public"."user_role" NOT NULL,
    "permission_key" "text" NOT NULL,
    "access_level" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "role_permissions_access_level_check" CHECK (("access_level" = ANY (ARRAY['true'::"text", 'false'::"text", 'own'::"text"])))
);


ALTER TABLE "public"."role_permissions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_carts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "name" "text" NOT NULL,
    "items" "jsonb" NOT NULL,
    "staff_id" "uuid",
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."saved_carts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."saved_weekly_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "name" "text" NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."saved_weekly_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."settings" (
    "id" integer DEFAULT 1 NOT NULL,
    "pos_direct_checkout" boolean DEFAULT false NOT NULL,
    "created_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "updated_at" timestamp with time zone DEFAULT "timezone"('utc'::"text", "now"()) NOT NULL,
    "company_name" "text",
    "company_address" "text",
    "company_zip" "text",
    "company_city" "text",
    "company_country" "text" DEFAULT 'DE'::"text",
    "company_tax_id" "text",
    "company_vat_id" "text",
    "organization_id" "uuid" NOT NULL,
    "voucher_validity_years" integer DEFAULT 3 NOT NULL,
    "voucher_validity_mode" "text" DEFAULT 'year_end'::"text" NOT NULL,
    CONSTRAINT "settings_voucher_validity_mode_check" CHECK (("voucher_validity_mode" = ANY (ARRAY['exact_date'::"text", 'year_end'::"text"])))
);


ALTER TABLE "public"."settings" OWNER TO "postgres";


COMMENT ON COLUMN "public"."settings"."voucher_validity_years" IS 'Number of years a voucher is valid';



COMMENT ON COLUMN "public"."settings"."voucher_validity_mode" IS 'How to calculate voucher expiry: exact_date (X years from purchase) or year_end (until end of Xth year)';



CREATE TABLE IF NOT EXISTS "public"."shift_checklists" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "shift_id" "uuid" NOT NULL,
    "template_id" "uuid" NOT NULL,
    "assigned_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shift_checklists" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shift_templates" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "day_of_week" integer NOT NULL,
    "start_time" time without time zone NOT NULL,
    "end_time" time without time zone NOT NULL,
    "role" "text" NOT NULL,
    "template_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "shift_templates_day_of_week_check" CHECK ((("day_of_week" >= 0) AND ("day_of_week" <= 6)))
);


ALTER TABLE "public"."shift_templates" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."shifts" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "staff_id" "uuid",
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "role" "text" NOT NULL,
    "notes" "text",
    "status" "public"."shift_status" DEFAULT 'draft'::"public"."shift_status" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."shifts" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_chat_messages" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "sender_role" "text" NOT NULL,
    "content" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    CONSTRAINT "staff_chat_messages_sender_role_check" CHECK (("sender_role" = ANY (ARRAY['user'::"text", 'assistant'::"text"])))
);


ALTER TABLE "public"."staff_chat_messages" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_events" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "staff_id" "uuid" NOT NULL,
    "event_description" "text" NOT NULL,
    "start_time" timestamp with time zone NOT NULL,
    "end_time" timestamp with time zone NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "organization_id" "uuid" NOT NULL
);


ALTER TABLE "public"."staff_events" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."staff_roles" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "user_id" "uuid" NOT NULL,
    "role" "text" NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."staff_roles" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."subscriptions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "user_id" "uuid" NOT NULL,
    "product_id" "uuid",
    "start_date" timestamp with time zone DEFAULT "now"() NOT NULL,
    "end_date" timestamp with time zone,
    "remaining_entries" integer,
    "is_active" boolean DEFAULT true,
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"()
);


ALTER TABLE "public"."subscriptions" OWNER TO "postgres";


CREATE TABLE IF NOT EXISTS "public"."transactions" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "created_at" timestamp with time zone DEFAULT "now"() NOT NULL,
    "total_amount" numeric(10,2) NOT NULL,
    "payment_method" "public"."payment_method" NOT NULL,
    "status" "public"."transaction_status" DEFAULT 'completed'::"public"."transaction_status" NOT NULL,
    "items" "jsonb" NOT NULL,
    "staff_id" "uuid",
    "organization_id" "uuid" DEFAULT '00000000-0000-0000-0000-000000000001'::"uuid" NOT NULL,
    "member_id" "uuid",
    "tse_data" "jsonb"
);


ALTER TABLE "public"."transactions" OWNER TO "postgres";


COMMENT ON COLUMN "public"."transactions"."tse_data" IS 'TSE signature data from fiskaly including transaction_number, signature, and certificate';



CREATE TABLE IF NOT EXISTS "public"."tse_configurations" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "organization_id" "uuid" NOT NULL,
    "api_key" "text" NOT NULL,
    "api_secret" "text" NOT NULL,
    "tss_id" "text" NOT NULL,
    "client_id" "text" NOT NULL,
    "is_active" boolean DEFAULT true,
    "environment" "text" DEFAULT 'production'::"text",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "updated_at" timestamp with time zone DEFAULT "now"(),
    "admin_pin" "text",
    CONSTRAINT "tse_configurations_environment_check" CHECK (("environment" = ANY (ARRAY['sandbox'::"text", 'production'::"text"])))
);


ALTER TABLE "public"."tse_configurations" OWNER TO "postgres";


COMMENT ON COLUMN "public"."tse_configurations"."admin_pin" IS 'Admin PIN for TSS initialization. Required for transitioning TSS from UNINITIALIZED to INITIALIZED state.';



CREATE TABLE IF NOT EXISTS "public"."vouchers" (
    "id" "uuid" DEFAULT "gen_random_uuid"() NOT NULL,
    "code" "text" NOT NULL,
    "initial_amount" numeric NOT NULL,
    "remaining_amount" numeric NOT NULL,
    "status" "text" DEFAULT 'active'::"text" NOT NULL,
    "transaction_id" "uuid",
    "created_at" timestamp with time zone DEFAULT "now"(),
    "expires_at" timestamp with time zone,
    "organization_id" "uuid" NOT NULL,
    CONSTRAINT "vouchers_remaining_amount_check" CHECK (("remaining_amount" >= (0)::numeric)),
    CONSTRAINT "vouchers_status_check" CHECK (("status" = ANY (ARRAY['active'::"text", 'redeemed'::"text", 'expired'::"text"])))
);


ALTER TABLE "public"."vouchers" OWNER TO "postgres";


ALTER TABLE ONLY "public"."chalk_chat_messages"
    ADD CONSTRAINT "chalk_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_channel_members"
    ADD CONSTRAINT "chat_channel_members_channel_id_user_id_key" UNIQUE ("channel_id", "user_id");



ALTER TABLE ONLY "public"."chat_channel_members"
    ADD CONSTRAINT "chat_channel_members_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_organization_id_name_key" UNIQUE ("organization_id", "name");



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_message_attachments"
    ADD CONSTRAINT "chat_message_attachments_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_message_reactions"
    ADD CONSTRAINT "chat_message_reactions_message_id_user_id_emoji_key" UNIQUE ("message_id", "user_id", "emoji");



ALTER TABLE ONLY "public"."chat_message_reactions"
    ADD CONSTRAINT "chat_message_reactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_responses"
    ADD CONSTRAINT "checklist_responses_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."checklist_responses"
    ADD CONSTRAINT "checklist_responses_shift_checklist_id_item_id_key" UNIQUE ("shift_checklist_id", "item_id");



ALTER TABLE ONLY "public"."checklist_templates"
    ADD CONSTRAINT "checklist_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."conversation_states"
    ADD CONSTRAINT "conversation_states_pkey" PRIMARY KEY ("staff_id");



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_organization_id_slug_key" UNIQUE ("organization_id", "slug");



ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_custom_domain_key" UNIQUE ("custom_domain");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."organizations"
    ADD CONSTRAINT "organizations_slug_key" UNIQUE ("slug");



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_member_id_key" UNIQUE ("member_id");



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_role_permission_key_key" UNIQUE ("role", "permission_key");



ALTER TABLE ONLY "public"."saved_carts"
    ADD CONSTRAINT "saved_carts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."saved_weekly_templates"
    ADD CONSTRAINT "saved_weekly_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_checklists"
    ADD CONSTRAINT "shift_checklists_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shift_checklists"
    ADD CONSTRAINT "shift_checklists_shift_id_template_id_key" UNIQUE ("shift_id", "template_id");



ALTER TABLE ONLY "public"."shift_templates"
    ADD CONSTRAINT "shift_templates_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_chat_messages"
    ADD CONSTRAINT "staff_chat_messages_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_events"
    ADD CONSTRAINT "staff_events_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_roles"
    ADD CONSTRAINT "staff_roles_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."staff_roles"
    ADD CONSTRAINT "staff_roles_user_id_role_key" UNIQUE ("user_id", "role");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."tse_configurations"
    ADD CONSTRAINT "tse_configurations_organization_id_key" UNIQUE ("organization_id");



ALTER TABLE ONLY "public"."tse_configurations"
    ADD CONSTRAINT "tse_configurations_pkey" PRIMARY KEY ("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_code_key" UNIQUE ("code");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_pkey" PRIMARY KEY ("id");



CREATE INDEX "document_chunks_embedding_idx" ON "public"."document_chunks" USING "ivfflat" ("embedding" "extensions"."vector_cosine_ops") WITH ("lists"='100');



CREATE INDEX "idx_chalk_chat_messages_organization_id" ON "public"."chalk_chat_messages" USING "btree" ("organization_id");



CREATE INDEX "idx_chat_channel_members_channel_id" ON "public"."chat_channel_members" USING "btree" ("channel_id");



CREATE INDEX "idx_chat_channel_members_user_id" ON "public"."chat_channel_members" USING "btree" ("user_id");



CREATE INDEX "idx_chat_channels_organization_id" ON "public"."chat_channels" USING "btree" ("organization_id");



CREATE INDEX "idx_chat_message_attachments_message_id" ON "public"."chat_message_attachments" USING "btree" ("message_id");



CREATE INDEX "idx_chat_message_reactions_message_id" ON "public"."chat_message_reactions" USING "btree" ("message_id");



CREATE INDEX "idx_chat_messages_channel_id" ON "public"."chat_messages" USING "btree" ("channel_id");



CREATE INDEX "idx_chat_messages_created_at" ON "public"."chat_messages" USING "btree" ("created_at" DESC);



CREATE INDEX "idx_chat_messages_thread_parent_id" ON "public"."chat_messages" USING "btree" ("thread_parent_id");



CREATE INDEX "idx_checkins_organization_id" ON "public"."checkins" USING "btree" ("organization_id");



CREATE INDEX "idx_checklist_items_template_id" ON "public"."checklist_items" USING "btree" ("template_id");



CREATE INDEX "idx_checklist_responses_shift_checklist_id" ON "public"."checklist_responses" USING "btree" ("shift_checklist_id");



CREATE INDEX "idx_checklist_responses_staff_id" ON "public"."checklist_responses" USING "btree" ("staff_id");



CREATE INDEX "idx_checklist_templates_organization_id" ON "public"."checklist_templates" USING "btree" ("organization_id");



CREATE INDEX "idx_document_chunks_organization_id" ON "public"."document_chunks" USING "btree" ("organization_id");



CREATE INDEX "idx_documents_organization_id" ON "public"."documents" USING "btree" ("organization_id");



CREATE INDEX "idx_landing_pages_org_slug" ON "public"."landing_pages" USING "btree" ("organization_id", "slug");



CREATE INDEX "idx_landing_pages_published" ON "public"."landing_pages" USING "btree" ("is_published") WHERE ("is_published" = true);



CREATE INDEX "idx_products_organization_id" ON "public"."products" USING "btree" ("organization_id");



CREATE INDEX "idx_profiles_organization_id" ON "public"."profiles" USING "btree" ("organization_id");



CREATE INDEX "idx_saved_carts_organization_id" ON "public"."saved_carts" USING "btree" ("organization_id");



CREATE INDEX "idx_settings_organization_id" ON "public"."settings" USING "btree" ("organization_id");



CREATE INDEX "idx_shift_checklists_shift_id" ON "public"."shift_checklists" USING "btree" ("shift_id");



CREATE INDEX "idx_shift_checklists_template_id" ON "public"."shift_checklists" USING "btree" ("template_id");



CREATE INDEX "idx_shift_templates_organization_id" ON "public"."shift_templates" USING "btree" ("organization_id");



CREATE INDEX "idx_shifts_organization_id" ON "public"."shifts" USING "btree" ("organization_id");



CREATE INDEX "idx_staff_events_organization_id" ON "public"."staff_events" USING "btree" ("organization_id");



CREATE INDEX "idx_subscriptions_organization_id" ON "public"."subscriptions" USING "btree" ("organization_id");



CREATE INDEX "idx_transactions_member_id" ON "public"."transactions" USING "btree" ("member_id");



CREATE INDEX "idx_transactions_organization_id" ON "public"."transactions" USING "btree" ("organization_id");



CREATE INDEX "idx_tse_configurations_org" ON "public"."tse_configurations" USING "btree" ("organization_id");



CREATE INDEX "staff_roles_user_id_idx" ON "public"."staff_roles" USING "btree" ("user_id");



CREATE OR REPLACE TRIGGER "trigger_decrement_reply_count" BEFORE DELETE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."decrement_reply_count"();



CREATE OR REPLACE TRIGGER "trigger_landing_pages_updated_at" BEFORE UPDATE ON "public"."landing_pages" FOR EACH ROW EXECUTE FUNCTION "public"."update_landing_pages_updated_at"();



CREATE OR REPLACE TRIGGER "trigger_update_reply_count" AFTER INSERT ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_reply_count"();



CREATE OR REPLACE TRIGGER "tse_configurations_updated_at" BEFORE UPDATE ON "public"."tse_configurations" FOR EACH ROW EXECUTE FUNCTION "public"."update_tse_configurations_updated_at"();



CREATE OR REPLACE TRIGGER "update_chat_channels_updated_at" BEFORE UPDATE ON "public"."chat_channels" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_chat_messages_updated_at" BEFORE UPDATE ON "public"."chat_messages" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_checklist_templates_updated_at" BEFORE UPDATE ON "public"."checklist_templates" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



CREATE OR REPLACE TRIGGER "update_organizations_updated_at" BEFORE UPDATE ON "public"."organizations" FOR EACH ROW EXECUTE FUNCTION "public"."update_updated_at_column"();



ALTER TABLE ONLY "public"."chalk_chat_messages"
    ADD CONSTRAINT "chalk_chat_messages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chalk_chat_messages"
    ADD CONSTRAINT "chalk_chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_channel_members"
    ADD CONSTRAINT "chat_channel_members_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_channel_members"
    ADD CONSTRAINT "chat_channel_members_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."chat_channels"
    ADD CONSTRAINT "chat_channels_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_message_attachments"
    ADD CONSTRAINT "chat_message_attachments_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_message_reactions"
    ADD CONSTRAINT "chat_message_reactions_message_id_fkey" FOREIGN KEY ("message_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_message_reactions"
    ADD CONSTRAINT "chat_message_reactions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_channel_id_fkey" FOREIGN KEY ("channel_id") REFERENCES "public"."chat_channels"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_thread_parent_id_fkey" FOREIGN KEY ("thread_parent_id") REFERENCES "public"."chat_messages"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."chat_messages"
    ADD CONSTRAINT "chat_messages_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_processed_by_fkey" FOREIGN KEY ("processed_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."checkins"
    ADD CONSTRAINT "checkins_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."checklist_items"
    ADD CONSTRAINT "checklist_items_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_responses"
    ADD CONSTRAINT "checklist_responses_item_id_fkey" FOREIGN KEY ("item_id") REFERENCES "public"."checklist_items"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_responses"
    ADD CONSTRAINT "checklist_responses_shift_checklist_id_fkey" FOREIGN KEY ("shift_checklist_id") REFERENCES "public"."shift_checklists"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_responses"
    ADD CONSTRAINT "checklist_responses_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."checklist_templates"
    ADD CONSTRAINT "checklist_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."conversation_states"
    ADD CONSTRAINT "conversation_states_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_document_id_fkey" FOREIGN KEY ("document_id") REFERENCES "public"."documents"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."document_chunks"
    ADD CONSTRAINT "document_chunks_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."documents"
    ADD CONSTRAINT "documents_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_created_by_fkey" FOREIGN KEY ("created_by") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."landing_pages"
    ADD CONSTRAINT "landing_pages_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."products"
    ADD CONSTRAINT "products_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_id_fkey" FOREIGN KEY ("id") REFERENCES "auth"."users"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."profiles"
    ADD CONSTRAINT "profiles_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."role_permissions"
    ADD CONSTRAINT "role_permissions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_carts"
    ADD CONSTRAINT "saved_carts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."saved_carts"
    ADD CONSTRAINT "saved_carts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."saved_weekly_templates"
    ADD CONSTRAINT "saved_weekly_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."settings"
    ADD CONSTRAINT "settings_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_checklists"
    ADD CONSTRAINT "shift_checklists_shift_id_fkey" FOREIGN KEY ("shift_id") REFERENCES "public"."shifts"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_checklists"
    ADD CONSTRAINT "shift_checklists_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."checklist_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_templates"
    ADD CONSTRAINT "shift_templates_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shift_templates"
    ADD CONSTRAINT "shift_templates_template_id_fkey" FOREIGN KEY ("template_id") REFERENCES "public"."saved_weekly_templates"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."shifts"
    ADD CONSTRAINT "shifts_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_chat_messages"
    ADD CONSTRAINT "staff_chat_messages_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_events"
    ADD CONSTRAINT "staff_events_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_events"
    ADD CONSTRAINT "staff_events_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."staff_roles"
    ADD CONSTRAINT "staff_roles_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_product_id_fkey" FOREIGN KEY ("product_id") REFERENCES "public"."products"("id");



ALTER TABLE ONLY "public"."subscriptions"
    ADD CONSTRAINT "subscriptions_user_id_fkey" FOREIGN KEY ("user_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_member_id_fkey" FOREIGN KEY ("member_id") REFERENCES "public"."profiles"("id") ON DELETE SET NULL;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."transactions"
    ADD CONSTRAINT "transactions_staff_id_fkey" FOREIGN KEY ("staff_id") REFERENCES "public"."profiles"("id");



ALTER TABLE ONLY "public"."tse_configurations"
    ADD CONSTRAINT "tse_configurations_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id") ON DELETE CASCADE;



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_organization_id_fkey" FOREIGN KEY ("organization_id") REFERENCES "public"."organizations"("id");



ALTER TABLE ONLY "public"."vouchers"
    ADD CONSTRAINT "vouchers_transaction_id_fkey" FOREIGN KEY ("transaction_id") REFERENCES "public"."transactions"("id");



CREATE POLICY "Admin/Manager can view checklist responses" ON "public"."checklist_responses" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM ("public"."shift_checklists"
     JOIN "public"."shifts" ON (("shifts"."id" = "shift_checklists"."shift_id")))
  WHERE (("shift_checklists"."id" = "checklist_responses"."shift_checklist_id") AND ("shifts"."organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))))));



CREATE POLICY "Admins and Managers can manage TSE config" ON "public"."tse_configurations" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "tse_configurations"."organization_id") AND (("profiles"."role" = 'admin'::"public"."user_role") OR ("profiles"."role" = 'manager'::"public"."user_role"))))));



CREATE POLICY "Admins and Managers can manage saved templates" ON "public"."saved_weekly_templates" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Admins and Managers can manage staff roles" ON "public"."staff_roles" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Admins and Managers can view staff events" ON "public"."staff_events" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage landing pages" ON "public"."landing_pages" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "landing_pages"."organization_id") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "landing_pages"."organization_id") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Admins can manage permissions" ON "public"."role_permissions" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins can view permissions" ON "public"."role_permissions" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Admins/Managers can insert their organization settings" ON "public"."settings" FOR INSERT WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Admins/Managers can update their organization settings" ON "public"."settings" FOR UPDATE USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Admins/Managers can view all staff events" ON "public"."staff_events" FOR SELECT USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Attachments deletable by author or admin" ON "public"."chat_message_attachments" FOR DELETE TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."chat_messages" "m"
  WHERE (("m"."id" = "chat_message_attachments"."message_id") AND ("m"."user_id" = "auth"."uid"())))) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Attachments insertable by message author" ON "public"."chat_message_attachments" FOR INSERT TO "authenticated" WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."chat_messages" "m"
  WHERE (("m"."id" = "chat_message_attachments"."message_id") AND ("m"."user_id" = "auth"."uid"())))));



CREATE POLICY "Attachments viewable by organization staff" ON "public"."chat_message_attachments" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."chat_messages" "m"
     JOIN "public"."chat_channels" "c" ON (("c"."id" = "m"."channel_id")))
  WHERE (("m"."id" = "chat_message_attachments"."message_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"()));



CREATE POLICY "Channel members manageable by organization staff" ON "public"."chat_channel_members" TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."chat_channels" "c"
  WHERE (("c"."id" = "chat_channel_members"."channel_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"()));



CREATE POLICY "Channel members viewable by organization staff" ON "public"."chat_channel_members" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."chat_channels" "c"
  WHERE (("c"."id" = "chat_channel_members"."channel_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"()));



CREATE POLICY "Channels deletable by admin/manager" ON "public"."chat_channels" FOR DELETE TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Channels insertable by organization staff" ON "public"."chat_channels" FOR INSERT TO "authenticated" WITH CHECK ((("organization_id" = "public"."user_organization_id"()) AND "public"."is_chat_eligible"()));



CREATE POLICY "Channels updatable by creator or admin" ON "public"."chat_channels" FOR UPDATE TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (("created_by" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))))));



CREATE POLICY "Channels viewable by organization staff" ON "public"."chat_channels" FOR SELECT TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND "public"."is_chat_eligible"()));



CREATE POLICY "Checkins insertable by staff" ON "public"."checkins" FOR INSERT TO "authenticated" WITH CHECK ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Checkins viewable within organization" ON "public"."checkins" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."user_organization_id"()));



CREATE POLICY "Checklist items manageable by admin/manager" ON "public"."checklist_items" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."checklist_templates"
  WHERE (("checklist_templates"."id" = "checklist_items"."template_id") AND ("checklist_templates"."organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))))));



CREATE POLICY "Checklist items viewable via template" ON "public"."checklist_items" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."checklist_templates"
  WHERE (("checklist_templates"."id" = "checklist_items"."template_id") AND ("checklist_templates"."organization_id" = "public"."user_organization_id"())))));



CREATE POLICY "Checklist templates manageable by admin/manager" ON "public"."checklist_templates" TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Checklist templates viewable within organization" ON "public"."checklist_templates" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."user_organization_id"()));



CREATE POLICY "Chunks are deletable by organization admins" ON "public"."document_chunks" FOR DELETE USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Chunks are insertable by organization admins" ON "public"."document_chunks" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Chunks are updatable by organization admins" ON "public"."document_chunks" FOR UPDATE USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Chunks are viewable by organization staff and admins" ON "public"."document_chunks" FOR SELECT USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['staff'::"public"."user_role", 'manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Documents are deletable by organization admins" ON "public"."documents" FOR DELETE USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Documents are insertable by organization admins" ON "public"."documents" FOR INSERT WITH CHECK (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Documents are updatable by organization admins" ON "public"."documents" FOR UPDATE USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Documents are viewable by organization staff and admins" ON "public"."documents" FOR SELECT USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['staff'::"public"."user_role", 'manager'::"public"."user_role", 'admin'::"public"."user_role"]))))));



CREATE POLICY "Enable delete for staff and admins" ON "public"."saved_carts" FOR DELETE TO "authenticated" USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Enable insert for staff and admins" ON "public"."saved_carts" FOR INSERT TO "authenticated" WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Enable insert for staff and admins" ON "public"."transactions" FOR INSERT TO "authenticated" WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Enable read access for authenticated users" ON "public"."settings" FOR SELECT USING (("auth"."role"() = 'authenticated'::"text"));



CREATE POLICY "Enable read access for staff and admins" ON "public"."saved_carts" FOR SELECT TO "authenticated" USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Enable read access for staff and admins" ON "public"."transactions" FOR SELECT TO "authenticated" USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Enable update for admins" ON "public"."settings" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role"))))) WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Enable update for admins and managers" ON "public"."transactions" FOR UPDATE TO "authenticated" USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Messages deletable by author or admin" ON "public"."chat_messages" FOR DELETE TO "authenticated" USING ((("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Messages insertable by organization staff" ON "public"."chat_messages" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM "public"."chat_channels" "c"
  WHERE (("c"."id" = "chat_messages"."channel_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"() AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Messages updatable by author" ON "public"."chat_messages" FOR UPDATE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Messages viewable by channel organization staff" ON "public"."chat_messages" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM "public"."chat_channels" "c"
  WHERE (("c"."id" = "chat_messages"."channel_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"()));



CREATE POLICY "Organizations manageable by admins" ON "public"."organizations" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = 'admin'::"public"."user_role")))));



CREATE POLICY "Organizations viewable by authenticated users" ON "public"."organizations" FOR SELECT TO "authenticated" USING (true);



CREATE POLICY "Products manageable by admin/manager" ON "public"."products" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "profiles"."organization_id") AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Products viewable within organization" ON "public"."products" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."user_organization_id"()));



CREATE POLICY "Profiles editable by owner or staff" ON "public"."profiles" FOR UPDATE TO "authenticated" USING ((("id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles" "p"
  WHERE (("p"."id" = "auth"."uid"()) AND ("p"."organization_id" = "p"."organization_id") AND ("p"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Profiles viewable within organization" ON "public"."profiles" FOR SELECT TO "authenticated" USING (("organization_id" = "public"."user_organization_id"()));



CREATE POLICY "Public can view published landing pages" ON "public"."landing_pages" FOR SELECT USING (("is_published" = true));



CREATE POLICY "Reactions deletable by owner" ON "public"."chat_message_reactions" FOR DELETE TO "authenticated" USING (("user_id" = "auth"."uid"()));



CREATE POLICY "Reactions insertable by organization staff" ON "public"."chat_message_reactions" FOR INSERT TO "authenticated" WITH CHECK (((EXISTS ( SELECT 1
   FROM ("public"."chat_messages" "m"
     JOIN "public"."chat_channels" "c" ON (("c"."id" = "m"."channel_id")))
  WHERE (("m"."id" = "chat_message_reactions"."message_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"() AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Reactions viewable by organization staff" ON "public"."chat_message_reactions" FOR SELECT TO "authenticated" USING (((EXISTS ( SELECT 1
   FROM ("public"."chat_messages" "m"
     JOIN "public"."chat_channels" "c" ON (("c"."id" = "m"."channel_id")))
  WHERE (("m"."id" = "chat_message_reactions"."message_id") AND ("c"."organization_id" = "public"."user_organization_id"())))) AND "public"."is_chat_eligible"()));



CREATE POLICY "Shift checklists manageable by admin/manager" ON "public"."shift_checklists" TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shifts"
  WHERE (("shifts"."id" = "shift_checklists"."shift_id") AND ("shifts"."organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))))));



CREATE POLICY "Shift checklists viewable by relevant users" ON "public"."shift_checklists" FOR SELECT TO "authenticated" USING ((EXISTS ( SELECT 1
   FROM "public"."shifts"
  WHERE (("shifts"."id" = "shift_checklists"."shift_id") AND ("shifts"."organization_id" = "public"."user_organization_id"()) AND (("shifts"."staff_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
           FROM "public"."profiles"
          WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"]))))))))));



CREATE POLICY "Shift templates manageable by admin/manager" ON "public"."shift_templates" TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Shift templates viewable within organization" ON "public"."shift_templates" FOR SELECT TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Shifts manageable by admin/manager" ON "public"."shifts" TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Shifts viewable within organization" ON "public"."shifts" FOR SELECT TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Staff can insert their own events" ON "public"."staff_events" FOR INSERT WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND ("staff_id" = "auth"."uid"())));



CREATE POLICY "Staff can manage their own chat messages" ON "public"."staff_chat_messages" USING (("auth"."uid"() = "staff_id"));



CREATE POLICY "Staff can manage their own checklist responses" ON "public"."checklist_responses" TO "authenticated" USING (("staff_id" = "auth"."uid"()));



CREATE POLICY "Staff can manage their own events" ON "public"."staff_events" USING (("auth"."uid"() = "staff_id"));



CREATE POLICY "Staff can view organization landing pages" ON "public"."landing_pages" FOR SELECT USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "landing_pages"."organization_id")))));



CREATE POLICY "Staff can view their own events" ON "public"."staff_events" FOR SELECT USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND ("staff_id" = "auth"."uid"())));



CREATE POLICY "Staff manage own state" ON "public"."conversation_states" USING (("auth"."uid"() = "staff_id"));



CREATE POLICY "Staff/Admins can insert vouchers" ON "public"."vouchers" FOR INSERT WITH CHECK ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "vouchers"."organization_id") AND ("profiles"."role" = ANY (ARRAY['staff'::"public"."user_role", 'admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Staff/Admins can update vouchers" ON "public"."vouchers" FOR UPDATE USING ((EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."organization_id" = "vouchers"."organization_id") AND ("profiles"."role" = ANY (ARRAY['staff'::"public"."user_role", 'admin'::"public"."user_role", 'manager'::"public"."user_role"]))))));



CREATE POLICY "Subscriptions manageable by staff" ON "public"."subscriptions" TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"])))))));



CREATE POLICY "Subscriptions viewable within organization" ON "public"."subscriptions" FOR SELECT TO "authenticated" USING ((("organization_id" = "public"."user_organization_id"()) AND (("user_id" = "auth"."uid"()) OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role", 'staff'::"public"."user_role"]))))))));



CREATE POLICY "Users can insert their own chat messages" ON "public"."chalk_chat_messages" FOR INSERT WITH CHECK ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can manage their own chalk chat messages" ON "public"."chalk_chat_messages" USING (("auth"."uid"() = "user_id"));



CREATE POLICY "Users can view staff roles" ON "public"."staff_roles" FOR SELECT USING ((("auth"."uid"() = "user_id") OR (EXISTS ( SELECT 1
   FROM "public"."profiles"
  WHERE (("profiles"."id" = "auth"."uid"()) AND ("profiles"."role" = ANY (ARRAY['admin'::"public"."user_role", 'manager'::"public"."user_role"])))))));



CREATE POLICY "Users can view their organization settings" ON "public"."settings" FOR SELECT USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their organization's TSE config" ON "public"."tse_configurations" FOR SELECT USING (("organization_id" IN ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



CREATE POLICY "Users can view their own chat messages" ON "public"."chalk_chat_messages" FOR SELECT USING ((("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))) AND ("user_id" = "auth"."uid"())));



CREATE POLICY "Users can view vouchers of their organization" ON "public"."vouchers" FOR SELECT USING (("organization_id" = ( SELECT "profiles"."organization_id"
   FROM "public"."profiles"
  WHERE ("profiles"."id" = "auth"."uid"()))));



ALTER TABLE "public"."chalk_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_channel_members" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_channels" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_message_attachments" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_message_reactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checkins" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_items" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_responses" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."checklist_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."conversation_states" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."document_chunks" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."documents" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."landing_pages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."organizations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."products" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."profiles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."role_permissions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_carts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."saved_weekly_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."settings" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shift_checklists" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shift_templates" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."shifts" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_chat_messages" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_events" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."staff_roles" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."subscriptions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."transactions" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."tse_configurations" ENABLE ROW LEVEL SECURITY;


ALTER TABLE "public"."vouchers" ENABLE ROW LEVEL SECURITY;




ALTER PUBLICATION "supabase_realtime" OWNER TO "postgres";


ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_channels";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_message_reactions";



ALTER PUBLICATION "supabase_realtime" ADD TABLE ONLY "public"."chat_messages";






GRANT USAGE ON SCHEMA "public" TO "postgres";
GRANT USAGE ON SCHEMA "public" TO "anon";
GRANT USAGE ON SCHEMA "public" TO "authenticated";
GRANT USAGE ON SCHEMA "public" TO "service_role";





















































































































































































































































































































































































































































































































GRANT ALL ON FUNCTION "public"."decrement_reply_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."decrement_reply_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."decrement_reply_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."is_chat_eligible"() TO "anon";
GRANT ALL ON FUNCTION "public"."is_chat_eligible"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."is_chat_eligible"() TO "service_role";






GRANT ALL ON FUNCTION "public"."update_landing_pages_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_landing_pages_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_landing_pages_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_reply_count"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_reply_count"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_reply_count"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_tse_configurations_updated_at"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_tse_configurations_updated_at"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_tse_configurations_updated_at"() TO "service_role";



GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "anon";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."update_updated_at_column"() TO "service_role";



GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "anon";
GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "authenticated";
GRANT ALL ON FUNCTION "public"."user_organization_id"() TO "service_role";






























GRANT ALL ON TABLE "public"."chalk_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chalk_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chalk_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."chat_channel_members" TO "anon";
GRANT ALL ON TABLE "public"."chat_channel_members" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_channel_members" TO "service_role";



GRANT ALL ON TABLE "public"."chat_channels" TO "anon";
GRANT ALL ON TABLE "public"."chat_channels" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_channels" TO "service_role";



GRANT ALL ON TABLE "public"."chat_message_attachments" TO "anon";
GRANT ALL ON TABLE "public"."chat_message_attachments" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_message_attachments" TO "service_role";



GRANT ALL ON TABLE "public"."chat_message_reactions" TO "anon";
GRANT ALL ON TABLE "public"."chat_message_reactions" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_message_reactions" TO "service_role";



GRANT ALL ON TABLE "public"."chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."checkins" TO "anon";
GRANT ALL ON TABLE "public"."checkins" TO "authenticated";
GRANT ALL ON TABLE "public"."checkins" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_items" TO "anon";
GRANT ALL ON TABLE "public"."checklist_items" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_items" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_responses" TO "anon";
GRANT ALL ON TABLE "public"."checklist_responses" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_responses" TO "service_role";



GRANT ALL ON TABLE "public"."checklist_templates" TO "anon";
GRANT ALL ON TABLE "public"."checklist_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."checklist_templates" TO "service_role";



GRANT ALL ON TABLE "public"."conversation_states" TO "anon";
GRANT ALL ON TABLE "public"."conversation_states" TO "authenticated";
GRANT ALL ON TABLE "public"."conversation_states" TO "service_role";



GRANT ALL ON TABLE "public"."document_chunks" TO "anon";
GRANT ALL ON TABLE "public"."document_chunks" TO "authenticated";
GRANT ALL ON TABLE "public"."document_chunks" TO "service_role";



GRANT ALL ON TABLE "public"."documents" TO "anon";
GRANT ALL ON TABLE "public"."documents" TO "authenticated";
GRANT ALL ON TABLE "public"."documents" TO "service_role";



GRANT ALL ON TABLE "public"."landing_pages" TO "anon";
GRANT ALL ON TABLE "public"."landing_pages" TO "authenticated";
GRANT ALL ON TABLE "public"."landing_pages" TO "service_role";



GRANT ALL ON TABLE "public"."organizations" TO "anon";
GRANT ALL ON TABLE "public"."organizations" TO "authenticated";
GRANT ALL ON TABLE "public"."organizations" TO "service_role";



GRANT ALL ON TABLE "public"."products" TO "anon";
GRANT ALL ON TABLE "public"."products" TO "authenticated";
GRANT ALL ON TABLE "public"."products" TO "service_role";



GRANT ALL ON TABLE "public"."profiles" TO "anon";
GRANT ALL ON TABLE "public"."profiles" TO "authenticated";
GRANT ALL ON TABLE "public"."profiles" TO "service_role";



GRANT ALL ON TABLE "public"."role_permissions" TO "anon";
GRANT ALL ON TABLE "public"."role_permissions" TO "authenticated";
GRANT ALL ON TABLE "public"."role_permissions" TO "service_role";



GRANT ALL ON TABLE "public"."saved_carts" TO "anon";
GRANT ALL ON TABLE "public"."saved_carts" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_carts" TO "service_role";



GRANT ALL ON TABLE "public"."saved_weekly_templates" TO "anon";
GRANT ALL ON TABLE "public"."saved_weekly_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."saved_weekly_templates" TO "service_role";



GRANT ALL ON TABLE "public"."settings" TO "anon";
GRANT ALL ON TABLE "public"."settings" TO "authenticated";
GRANT ALL ON TABLE "public"."settings" TO "service_role";



GRANT ALL ON TABLE "public"."shift_checklists" TO "anon";
GRANT ALL ON TABLE "public"."shift_checklists" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_checklists" TO "service_role";



GRANT ALL ON TABLE "public"."shift_templates" TO "anon";
GRANT ALL ON TABLE "public"."shift_templates" TO "authenticated";
GRANT ALL ON TABLE "public"."shift_templates" TO "service_role";



GRANT ALL ON TABLE "public"."shifts" TO "anon";
GRANT ALL ON TABLE "public"."shifts" TO "authenticated";
GRANT ALL ON TABLE "public"."shifts" TO "service_role";



GRANT ALL ON TABLE "public"."staff_chat_messages" TO "anon";
GRANT ALL ON TABLE "public"."staff_chat_messages" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_chat_messages" TO "service_role";



GRANT ALL ON TABLE "public"."staff_events" TO "anon";
GRANT ALL ON TABLE "public"."staff_events" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_events" TO "service_role";



GRANT ALL ON TABLE "public"."staff_roles" TO "anon";
GRANT ALL ON TABLE "public"."staff_roles" TO "authenticated";
GRANT ALL ON TABLE "public"."staff_roles" TO "service_role";



GRANT ALL ON TABLE "public"."subscriptions" TO "anon";
GRANT ALL ON TABLE "public"."subscriptions" TO "authenticated";
GRANT ALL ON TABLE "public"."subscriptions" TO "service_role";



GRANT ALL ON TABLE "public"."transactions" TO "anon";
GRANT ALL ON TABLE "public"."transactions" TO "authenticated";
GRANT ALL ON TABLE "public"."transactions" TO "service_role";



GRANT ALL ON TABLE "public"."tse_configurations" TO "anon";
GRANT ALL ON TABLE "public"."tse_configurations" TO "authenticated";
GRANT ALL ON TABLE "public"."tse_configurations" TO "service_role";



GRANT ALL ON TABLE "public"."vouchers" TO "anon";
GRANT ALL ON TABLE "public"."vouchers" TO "authenticated";
GRANT ALL ON TABLE "public"."vouchers" TO "service_role";









ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON SEQUENCES TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON FUNCTIONS TO "service_role";






ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "postgres";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "anon";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "authenticated";
ALTER DEFAULT PRIVILEGES FOR ROLE "postgres" IN SCHEMA "public" GRANT ALL ON TABLES TO "service_role";































