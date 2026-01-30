create table if not exists public.saved_carts (
    id uuid default gen_random_uuid () primary key,
    created_at timestamptz default now() not null,
    name text not null,
    items jsonb not null,
    staff_id uuid references public.profiles (id)
);

alter table public.saved_carts enable row level security;

drop policy if exists "Enable read access for staff and admins" on public.saved_carts;

create policy "Enable read access for staff and admins" on public.saved_carts for
select to authenticated using (
        exists (
            select 1
            from public.profiles
            where
                public.profiles.id = auth.uid ()
                and public.profiles.role in ('admin', 'manager', 'staff')
        )
    );

drop policy if exists "Enable insert for staff and admins" on public.saved_carts;

create policy "Enable insert for staff and admins" on public.saved_carts for
insert
    to authenticated
with
    check (
        exists (
            select 1
            from public.profiles
            where
                public.profiles.id = auth.uid ()
                and public.profiles.role in ('admin', 'manager', 'staff')
        )
    );

drop policy if exists "Enable delete for staff and admins" on public.saved_carts;

create policy "Enable delete for staff and admins" on public.saved_carts for delete to authenticated using (
    exists (
        select 1
        from public.profiles
        where
            public.profiles.id = auth.uid ()
            and public.profiles.role in ('admin', 'manager', 'staff')
    )
);