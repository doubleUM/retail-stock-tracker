-- 1. Drop the policies that caused infinite recursion
drop policy if exists "Users can view store members" on public.store_users;
drop policy if exists "Users can insert their own membership or owners can invite" on public.store_users;
drop policy if exists "Owners can manage members" on public.store_users;
drop policy if exists "Owners can update member roles" on public.store_users;

-- 2. Create simplified, non-recursive policies
create policy "Users can view their own memberships" on public.store_users for select using (
  user_id = auth.uid()
);

create policy "Users can insert their own membership" on public.store_users for insert with check (
  auth.uid() = user_id
);
