-- Ejecutar en SQL Editor de Supabase. Nunca guardar service_role en el frontend.
create extension if not exists pgcrypto;
create table public.clients (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 name text not null check (length(trim(name)) > 0), created_at timestamptz not null default now(),
 unique (id,user_id)
);
create unique index clients_user_name_unique on public.clients(user_id,lower(name));
create table public.settlements (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 process_month date not null, status text not null default 'draft' check(status in ('draft','confirmed')),
 confirmed_at timestamptz, created_at timestamptz not null default now(), unique(id,user_id)
);
create table public.expenses (
 id uuid primary key default gen_random_uuid(), user_id uuid not null references auth.users(id) on delete cascade,
 expense_date date not null, amount numeric(10,2) not null check(amount>=0),
 category text not null check(category in ('Taxi / VTC','Transporte público','Gasolina / recarga','Peajes','Parking','Desayuno','Comida','Cena','Hotel','Otros')),
 city text, merchant text, client_id uuid not null, image_path text,
 status text not null default 'pending' check(status in ('pending','processed')),
 archived_at timestamptz, created_at timestamptz not null default now(), updated_at timestamptz not null default now(),
 unique(id,user_id), foreign key(client_id,user_id) references public.clients(id,user_id)
);
create table public.settlement_items (
 settlement_id uuid not null, expense_id uuid not null unique, user_id uuid not null,
 primary key(settlement_id,expense_id),
 foreign key(settlement_id,user_id) references public.settlements(id,user_id),
 foreign key(expense_id,user_id) references public.expenses(id,user_id)
);
create index expenses_user_status_date on public.expenses(user_id,status,expense_date desc);
create index expenses_user_client on public.expenses(user_id,client_id);
create or replace function public.set_expense_updated_at() returns trigger language plpgsql as $$begin new.updated_at=now(); return new; end$$;
create trigger expenses_updated before update on public.expenses for each row execute function public.set_expense_updated_at();
-- RLS: usuarios únicamente ven/modifican sus filas.
alter table public.clients enable row level security;
alter table public.expenses enable row level security;
alter table public.settlements enable row level security;
alter table public.settlement_items enable row level security;
create policy clients_owner on public.clients for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy expenses_owner on public.expenses for all to authenticated using(user_id=auth.uid()) with check(user_id=auth.uid());
create policy settlements_owner on public.settlements for select to authenticated using(user_id=auth.uid());
create policy settlement_items_owner on public.settlement_items for select to authenticated using(user_id=auth.uid());
-- Liquidaciones: no permitir confirmaciones inconsistentes desde el navegador.
-- Se implementarán mediante función transaccional en la fase 3.
insert into storage.buckets(id,name,public,file_size_limit,allowed_mime_types)
values ('receipts','receipts',false,10485760,array['image/jpeg','image/png','image/webp'])
on conflict(id) do nothing;
create policy receipt_read on storage.objects for select to authenticated using(bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
create policy receipt_insert on storage.objects for insert to authenticated with check(bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
create policy receipt_delete on storage.objects for delete to authenticated using(bucket_id='receipts' and (storage.foldername(name))[1]=auth.uid()::text);
