-- ============================================
-- CHECKLISTS FEATURE MIGRATION
-- Created: 2026-01-30
-- ============================================

-- ============================================
-- ENUM FOR ITEM TYPES
-- ============================================
CREATE TYPE checklist_item_type AS ENUM ('checkbox', 'rating', 'text', 'multiselect');

-- ============================================
-- CHECKLIST TEMPLATES TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_templates (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    organization_id UUID NOT NULL DEFAULT '00000000-0000-0000-0000-000000000001' REFERENCES organizations (id) ON DELETE CASCADE,
    name TEXT NOT NULL,
    description TEXT,
    is_active BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklist_templates ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_checklist_templates_organization_id ON checklist_templates (organization_id);

-- ============================================
-- CHECKLIST ITEMS TABLE
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_items (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    template_id UUID NOT NULL REFERENCES checklist_templates (id) ON DELETE CASCADE,
    item_type checklist_item_type NOT NULL,
    label TEXT NOT NULL,
    description TEXT,
    options JSONB, -- For multiselect: {"options": ["Ja", "Nein"]}
    sort_order INTEGER DEFAULT 0,
    required BOOLEAN DEFAULT true,
    created_at TIMESTAMPTZ DEFAULT NOW()
);

ALTER TABLE checklist_items ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_checklist_items_template_id ON checklist_items (template_id);

-- ============================================
-- SHIFT CHECKLISTS TABLE (Links shifts to templates)
-- ============================================
CREATE TABLE IF NOT EXISTS shift_checklists (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    shift_id UUID NOT NULL REFERENCES shifts (id) ON DELETE CASCADE,
    template_id UUID NOT NULL REFERENCES checklist_templates (id) ON DELETE CASCADE,
    assigned_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shift_id, template_id)
);

ALTER TABLE shift_checklists ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_shift_checklists_shift_id ON shift_checklists (shift_id);

CREATE INDEX idx_shift_checklists_template_id ON shift_checklists (template_id);

-- ============================================
-- CHECKLIST RESPONSES TABLE (Staff answers)
-- ============================================
CREATE TABLE IF NOT EXISTS checklist_responses (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid (),
    shift_checklist_id UUID NOT NULL REFERENCES shift_checklists (id) ON DELETE CASCADE,
    item_id UUID NOT NULL REFERENCES checklist_items (id) ON DELETE CASCADE,
    staff_id UUID NOT NULL REFERENCES profiles (id) ON DELETE CASCADE,
    response_value JSONB NOT NULL,
    completed_at TIMESTAMPTZ DEFAULT NOW(),
    UNIQUE (shift_checklist_id, item_id)
);

ALTER TABLE checklist_responses ENABLE ROW LEVEL SECURITY;

CREATE INDEX idx_checklist_responses_shift_checklist_id ON checklist_responses (shift_checklist_id);

CREATE INDEX idx_checklist_responses_staff_id ON checklist_responses (staff_id);

-- ============================================
-- TRIGGERS
-- ============================================
CREATE TRIGGER update_checklist_templates_updated_at
    BEFORE UPDATE ON checklist_templates
    FOR EACH ROW
    EXECUTE FUNCTION update_updated_at_column();

-- ============================================
-- RLS POLICIES
-- ============================================

-- Checklist Templates: Viewable within organization
CREATE POLICY "Checklist templates viewable within organization" ON checklist_templates FOR
SELECT TO authenticated USING (
        organization_id = public.user_organization_id ()
    );

-- Checklist Templates: Manageable by admin/manager
CREATE POLICY "Checklist templates manageable by admin/manager" ON checklist_templates FOR ALL TO authenticated USING (
    organization_id = public.user_organization_id ()
    AND EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('admin', 'manager')
    )
);

-- Checklist Items: Viewable if template is viewable
CREATE POLICY "Checklist items viewable via template" ON checklist_items FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM checklist_templates
            WHERE
                checklist_templates.id = checklist_items.template_id
                AND checklist_templates.organization_id = public.user_organization_id ()
        )
    );

-- Checklist Items: Manageable by admin/manager
CREATE POLICY "Checklist items manageable by admin/manager" ON checklist_items FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM checklist_templates
        WHERE
            checklist_templates.id = checklist_items.template_id
            AND checklist_templates.organization_id = public.user_organization_id ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    profiles.id = auth.uid ()
                    AND profiles.role IN ('admin', 'manager')
            )
    )
);

-- Shift Checklists: Viewable by staff for their shifts or admin/manager
CREATE POLICY "Shift checklists viewable by relevant users" ON shift_checklists FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM shifts
            WHERE
                shifts.id = shift_checklists.shift_id
                AND shifts.organization_id = public.user_organization_id ()
                AND (
                    shifts.staff_id = auth.uid ()
                    OR EXISTS (
                        SELECT 1
                        FROM profiles
                        WHERE
                            profiles.id = auth.uid ()
                            AND profiles.role IN ('admin', 'manager')
                    )
                )
        )
    );

-- Shift Checklists: Manageable by admin/manager
CREATE POLICY "Shift checklists manageable by admin/manager" ON shift_checklists FOR ALL TO authenticated USING (
    EXISTS (
        SELECT 1
        FROM shifts
        WHERE
            shifts.id = shift_checklists.shift_id
            AND shifts.organization_id = public.user_organization_id ()
            AND EXISTS (
                SELECT 1
                FROM profiles
                WHERE
                    profiles.id = auth.uid ()
                    AND profiles.role IN ('admin', 'manager')
            )
    )
);

-- Checklist Responses: Staff can manage their own responses
CREATE POLICY "Staff can manage their own checklist responses" ON checklist_responses FOR ALL TO authenticated USING (staff_id = auth.uid ());

-- Checklist Responses: Admin/Manager can view all responses in their org
CREATE POLICY "Admin/Manager can view checklist responses" ON checklist_responses FOR
SELECT TO authenticated USING (
        EXISTS (
            SELECT 1
            FROM shift_checklists
                JOIN shifts ON shifts.id = shift_checklists.shift_id
            WHERE
                shift_checklists.id = checklist_responses.shift_checklist_id
                AND shifts.organization_id = public.user_organization_id ()
                AND EXISTS (
                    SELECT 1
                    FROM profiles
                    WHERE
                        profiles.id = auth.uid ()
                        AND profiles.role IN ('admin', 'manager')
                )
        )
    );