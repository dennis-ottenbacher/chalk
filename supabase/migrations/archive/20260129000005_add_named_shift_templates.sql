create table if not exists saved_weekly_templates (
    id uuid default gen_random_uuid () primary key,
    name text not null,
    created_at timestamp
    with
        time zone default now()
);

-- Check if column exists before adding (Postgres doesn't support IF NOT EXISTS for ADD COLUMN directly without DO block or ignoring error)
-- Or just let it fail? No.
-- Simplest idempotent ADD COLUMN in migration:
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'shift_templates' AND column_name = 'template_id') THEN
        ALTER TABLE shift_templates ADD COLUMN template_id uuid REFERENCES saved_weekly_templates(id) ON DELETE CASCADE;
    END IF;
END $$;

-- RLS for saved_weekly_templates
alter table saved_weekly_templates enable row level security;

DROP POLICY IF EXISTS "Admins and Managers can manage saved templates" ON saved_weekly_templates;

create policy "Admins and Managers can manage saved templates" on saved_weekly_templates for all using (
    exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and role in ('admin', 'manager')
    )
);