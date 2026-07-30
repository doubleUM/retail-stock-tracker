-- 1. Add the invite_code column to stores (must be unique)
alter table public.stores add column if not exists invite_code text unique;

-- 2. Create a secure Database Function to join a store by code
create or replace function join_store_with_code(p_invite_code text)
returns uuid
language plpgsql
security definer -- This allows the function to bypass RLS to check the code
as $$
declare
  v_store_id uuid;
begin
  -- Find the store by the invite code
  select id into v_store_id from public.stores where invite_code = p_invite_code;
  
  if v_store_id is null then
    raise exception 'Invalid invite code';
  end if;

  -- Insert the user into store_users as a cashier
  -- (Will throw an error if they are already in the store due to the unique constraint)
  insert into public.store_users (store_id, user_id, role)
  values (v_store_id, auth.uid(), 'cashier');

  return v_store_id;
end;
$$;
