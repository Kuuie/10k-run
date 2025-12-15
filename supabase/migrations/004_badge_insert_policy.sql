-- Add INSERT policy for user_badges so users can earn badges
do $$
begin
  if not exists (select 1 from pg_policies where policyname = 'Users can earn badges' and tablename = 'user_badges') then
    create policy "Users can earn badges" on public.user_badges
      for insert with check (auth.uid() = user_id);
  end if;
end $$;
