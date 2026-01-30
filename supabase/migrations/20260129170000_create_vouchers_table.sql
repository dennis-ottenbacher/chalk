create table if not exists vouchers (
    id uuid default gen_random_uuid () primary key,
    code text not null unique,
    initial_amount numeric not null,
    remaining_amount numeric not null check (remaining_amount >= 0),
    status text not null default 'active' check (
        status in (
            'active',
            'redeemed',
            'expired'
        )
    ),
    transaction_id uuid references transactions (id),
    created_at timestamptz default now(),
    expires_at timestamptz,
    organization_id uuid references organizations (id) not null
);

-- Enable RLS
alter table vouchers enable row level security;

-- Policies
create policy "Users can view vouchers of their organization" on vouchers for
select using (
        organization_id = (
            select organization_id
            from profiles
            where
                id = auth.uid ()
        )
    );

create policy "Staff/Admins can insert vouchers" on vouchers for
insert
with
    check (
        exists (
            select 1
            from profiles
            where
                id = auth.uid ()
                and organization_id = vouchers.organization_id
                and role in ('staff', 'admin', 'manager')
        )
    );

create policy "Staff/Admins can update vouchers" on vouchers for
update using (
    exists (
        select 1
        from profiles
        where
            id = auth.uid ()
            and organization_id = vouchers.organization_id
            and role in ('staff', 'admin', 'manager')
    )
);