create table public.settings (
    id int primary key default 1 check (id = 1),
    pos_direct_checkout boolean not null default false,
    created_at timestamp with time zone default timezone('utc'::text, now()) not null,
    updated_at timestamp with time zone default timezone('utc'::text, now()) not null
);

alter table public.settings enable row level security;

create policy "Enable read access for authenticated users" on public.settings for
select using (
        auth.role () = 'authenticated'
    );

create policy "Enable update for admins" on public.settings for
update using (
    exists (
        select 1
        from profiles
        where
            profiles.id = auth.uid ()
            and profiles.role = 'admin'
    )
)
with
    check (
        exists (
            select 1
            from profiles
            where
                profiles.id = auth.uid ()
                and profiles.role = 'admin'
        )
    );

insert into
    public.settings (id, pos_direct_checkout)
values (1, false);