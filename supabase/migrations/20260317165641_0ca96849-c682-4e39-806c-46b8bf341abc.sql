
create table public.anamnesis_results (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null,
  specialty text not null,
  difficulty text not null default 'intermediário',
  categories_covered jsonb not null default '{}',
  final_score integer default 0,
  grade text default 'F',
  ideal_anamnesis text,
  conversation_history jsonb default '[]',
  time_total_minutes integer default 0,
  xp_earned integer default 0,
  created_at timestamptz not null default now()
);

alter table public.anamnesis_results enable row level security;

create policy "Users can CRUD own anamnesis"
  on public.anamnesis_results
  for all to authenticated
  using (user_id = auth.uid())
  with check (user_id = auth.uid());

create policy "Admins can read all anamnesis"
  on public.anamnesis_results
  for select to authenticated
  using (has_role(auth.uid(), 'admin'));
