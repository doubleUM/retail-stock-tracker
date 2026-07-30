-- Create a secure function to handle creating a store and adding the owner in one step
-- This fixes the RLS "chicken and egg" problem where you can't read the store you just created 
-- because you haven't been added to store_users yet.
create or replace function create_store(p_name text)
returns uuid
language plpgsql
security definer
as $$
declare
  v_store_id uuid;
begin
  -- 1. Insert the new store and get its ID
  insert into public.stores (name) 
  values (p_name) 
  returning id into v_store_id;
  
  -- 2. Add the user who created it as the owner
  insert into public.store_users (store_id, user_id, role) 
  values (v_store_id, auth.uid(), 'owner');

  -- 3. Return the new store ID
  return v_store_id;
end;
$$;
