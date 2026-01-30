-- Create shifts table
create table if not exists public.shifts (
    id uuid not null default gen_random_uuid (),
    staff_id uuid not null references public.profiles (id) on delete cascade,
    start_time timestamp
    with
        time zone not null,
        end_time timestamp
    with
        time zone not null,
        role text not null, -- e.g. "Theke", "Trainer"
        notes text,
        created_at timestamp
    with
        time zone default now(),
        constraint shifts_pkey primary key (id)
);

-- Enable RLS
alter table public.shifts enable row level security;

-- Policies

-- Staff can view their own shifts
drop policy if exists "Staff can view their own shifts" on public.shifts;

create policy "Staff can view their own shifts" on public.shifts for
select using (auth.uid () = staff_id);

-- Admins and Managers can view all shifts
drop policy if exists "Admins and Managers can view all shifts" on public.shifts;

create policy "Admins and Managers can view all shifts" on public.shifts for
select using (
        exists (
            select 1
            from public.profiles
            where
                id = auth.uid ()
                and role in ('admin', 'manager')
        )
    );

-- Admins and Managers can manage shifts
drop policy if exists "Admins and Managers can manage shifts" on public.shifts;

create policy "Admins and Managers can manage shifts" on public.shifts for all using (
    exists (
        select 1
        from public.profiles
        where
            id = auth.uid ()
            and role in ('admin', 'manager')
    )
);