-- 1. Enable UUID extension
create extension if not exists "uuid-ossp";

-- 2. Create stores table
create table public.stores (
  id uuid default uuid_generate_v4() primary key,
  name text not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 3. Create store_users table for RBAC
create table public.store_users (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  user_id uuid references auth.users(id) on delete cascade not null,
  role text check (role in ('owner', 'admin', 'cashier')) not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (store_id, user_id)
);

-- 4. Create items table
create table public.items (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  sku text not null,
  name text not null,
  category text not null,
  price numeric not null,
  quantity integer not null default 0,
  reorder_level integer not null default 0,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null,
  unique (store_id, sku)
);

-- 5. Create transactions table
create table public.transactions (
  id uuid default uuid_generate_v4() primary key,
  store_id uuid references public.stores(id) on delete cascade not null,
  subtotal numeric not null,
  tax numeric not null,
  total numeric not null,
  items jsonb not null,
  created_at timestamp with time zone default timezone('utc'::text, now()) not null
);

-- 6. Enable Row Level Security (RLS)
alter table public.stores enable row level security;
alter table public.store_users enable row level security;
alter table public.items enable row level security;
alter table public.transactions enable row level security;

-- 7. RLS Policies

-- Stores: Users can only view their own stores
create policy "Users can view their stores" on public.stores for select using (
  exists (select 1 from public.store_users where store_users.store_id = stores.id and store_users.user_id = auth.uid())
);
-- Stores: Only owners can update the store name
create policy "Owners can update their store" on public.stores for update using (
  exists (select 1 from public.store_users where store_users.store_id = stores.id and store_users.user_id = auth.uid() and store_users.role = 'owner')
);
-- Stores: Any authenticated user can create a store initially
create policy "Authenticated users can create a store" on public.stores for insert with check (auth.uid() is not null);

-- Store_Users: Users can see members of their own store
create policy "Users can view store members" on public.store_users for select using (
  exists (select 1 from public.store_users as my_membership where my_membership.store_id = store_users.store_id and my_membership.user_id = auth.uid())
);
-- Store_Users: Allow a user to add themselves as an owner when creating a store, or allow owners to invite others
create policy "Users can insert their own membership or owners can invite" on public.store_users for insert with check (
  auth.uid() = user_id OR 
  exists (select 1 from public.store_users as my_membership where my_membership.store_id = store_id and my_membership.user_id = auth.uid() and my_membership.role = 'owner')
);
-- Store_Users: Only owners can remove members or update roles
create policy "Owners can manage members" on public.store_users for delete using (
  exists (select 1 from public.store_users as my_membership where my_membership.store_id = store_id and my_membership.user_id = auth.uid() and my_membership.role = 'owner')
);
create policy "Owners can update member roles" on public.store_users for update using (
  exists (select 1 from public.store_users as my_membership where my_membership.store_id = store_id and my_membership.user_id = auth.uid() and my_membership.role = 'owner')
);

-- Items: All store members can view items
create policy "Store members can view items" on public.items for select using (
  exists (select 1 from public.store_users where store_users.store_id = items.store_id and store_users.user_id = auth.uid())
);
-- Items: Only owners and admins can create items
create policy "Owners and admins can insert items" on public.items for insert with check (
  exists (select 1 from public.store_users where store_users.store_id = items.store_id and store_users.user_id = auth.uid() and store_users.role in ('owner', 'admin'))
);
-- Items: All members can update items (so cashiers can deduct quantity during checkout)
create policy "All members can update items" on public.items for update using (
  exists (select 1 from public.store_users where store_users.store_id = items.store_id and store_users.user_id = auth.uid())
);
-- Items: Only owners and admins can delete items
create policy "Owners and admins can delete items" on public.items for delete using (
  exists (select 1 from public.store_users where store_users.store_id = items.store_id and store_users.user_id = auth.uid() and store_users.role in ('owner', 'admin'))
);

-- Transactions: All store members can view transactions
create policy "Store members can view transactions" on public.transactions for select using (
  exists (select 1 from public.store_users where store_users.store_id = transactions.store_id and store_users.user_id = auth.uid())
);
-- Transactions: All store members can create transactions (Cashiers ringing up sales)
create policy "All store members can create transactions" on public.transactions for insert with check (
  exists (select 1 from public.store_users where store_users.store_id = transactions.store_id and store_users.user_id = auth.uid())
);
