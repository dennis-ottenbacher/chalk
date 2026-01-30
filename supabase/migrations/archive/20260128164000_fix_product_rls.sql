-- Allow Staff, Managers, and Admins to manage products

-- INSERT
CREATE POLICY "Staff/Admins/Managers can insert products" ON public.products FOR
INSERT
WITH
    CHECK (
        EXISTS (
            SELECT 1
            FROM profiles
            WHERE
                profiles.id = auth.uid ()
                AND profiles.role IN ('staff', 'admin', 'manager')
        )
    );

-- UPDATE
CREATE POLICY "Staff/Admins/Managers can update products" ON public.products FOR
UPDATE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin', 'manager')
    )
);

-- DELETE
CREATE POLICY "Staff/Admins/Managers can delete products" ON public.products FOR DELETE USING (
    EXISTS (
        SELECT 1
        FROM profiles
        WHERE
            profiles.id = auth.uid ()
            AND profiles.role IN ('staff', 'admin', 'manager')
    )
);