create table public.award_wheel_commands (
  stage_key text primary key default 'main-stage',
  command text not null check (command in ('start', 'close')),
  requested_at timestamptz not null default now()
);

alter table public.award_wheel_commands enable row level security;

create policy "award wheel commands readable" on public.award_wheel_commands
  for select to anon, authenticated using (true);

create policy "award wheel commands writable" on public.award_wheel_commands
  for insert to anon, authenticated with check (true);

create policy "award wheel commands updatable" on public.award_wheel_commands
  for update to anon, authenticated using (true) with check (true);
