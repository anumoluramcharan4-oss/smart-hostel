-- Smart Hostel production schema for the Supabase SQL editor.
-- This file intentionally contains no demo residents, rooms, credentials, prices, or defaults.
-- Run it once in a new Supabase project, then create real records through the admin/API.

create extension if not exists pgcrypto;

create table if not exists public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  full_name text not null, email text unique, phone text, role text not null check (role in ('student','warden','admin')),
  avatar_url text, room_number text, block_name text, bed_number text, roll_no text unique,
  course text, year integer, guardian_name text, guardian_phone text,
  fee_status text check (fee_status in ('paid','pending','partial')),
  fee_amount_due numeric not null default 0, attendance_percent numeric,
  created_at timestamptz not null default now()
);

create table if not exists public.blocks (
  id uuid primary key default gen_random_uuid(), name text not null unique, code text unique,
  floors_count integer not null check (floors_count > 0), rooms_count integer not null default 0,
  capacity integer not null default 0, occupied integer not null default 0, warden_name text,
  created_at timestamptz not null default now()
);
create table if not exists public.rooms (
  id uuid primary key default gen_random_uuid(), number text not null, block_id uuid references public.blocks(id) on delete cascade,
  floor integer not null check (floor > 0), type text not null, capacity integer not null check (capacity > 0),
  occupied integer not null default 0 check (occupied >= 0 and occupied <= capacity),
  status text not null default 'available' check (status in ('available','occupied','maintenance')),
  amenities jsonb not null default '[]'::jsonb, occupants jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), unique (block_id, number)
);
create table if not exists public.allocations (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  room_id uuid not null references public.rooms(id) on delete cascade, bed_number text not null, is_active boolean not null default true,
  allocated_at timestamptz not null default now(), deallocated_at timestamptz, created_at timestamptz not null default now()
);
create unique index if not exists allocations_one_active_student on public.allocations(student_id) where is_active;
create unique index if not exists allocations_one_active_bed on public.allocations(room_id, bed_number) where is_active;
create table if not exists public.allocation_history (
  id uuid primary key default gen_random_uuid(), student_id uuid references public.profiles(id) on delete cascade,
  student_name text not null, student_roll text, room_number text not null, bed_number text not null,
  action text not null check (action in ('allocate','deallocate','transfer')), performed_by uuid references public.profiles(id) on delete set null,
  reason text, created_at timestamptz not null default now()
);

create table if not exists public.staff (
  id uuid primary key default gen_random_uuid(), name text not null, phone text not null unique, trade text not null,
  status text not null default 'active', created_at timestamptz not null default now()
);
create table if not exists public.complaints (
  id uuid primary key default gen_random_uuid(), title text not null, description text not null, category text not null,
  priority text not null default 'medium', status text not null default 'pending', student_id uuid references public.profiles(id) on delete set null,
  assigned_to uuid references public.staff(id) on delete set null, resolution_notes text, timeline jsonb not null default '[]'::jsonb,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.fees (
  id uuid primary key default gen_random_uuid(), student_id uuid not null references public.profiles(id) on delete cascade,
  term text not null, total_amount numeric not null, paid_amount numeric not null default 0, pending_amount numeric not null,
  status text not null, due_date date, created_at timestamptz not null default now()
);
create table if not exists public.payments (
  id uuid primary key default gen_random_uuid(), fee_id uuid not null references public.fees(id) on delete cascade,
  student_id uuid not null references public.profiles(id) on delete cascade, amount numeric not null check (amount > 0),
  payment_method text not null, transaction_ref text not null unique, paid_at timestamptz not null default now()
);
create table if not exists public.notices (
  id uuid primary key default gen_random_uuid(), title text not null, content text not null, category text not null,
  priority text not null default 'normal', author_id uuid references public.profiles(id) on delete set null,
  target_audience text not null default 'all', created_at timestamptz not null default now(), expires_at timestamptz
);

create table if not exists public.laundry_rates (
  id uuid primary key default gen_random_uuid(), item_category text not null, service_type text not null,
  rate_per_piece numeric not null check (rate_per_piece >= 0), is_active boolean not null default true,
  created_at timestamptz not null default now(), unique(item_category, service_type)
);
create table if not exists public.laundry_slots (
  id uuid primary key default gen_random_uuid(), slot_date date not null, time_window text not null,
  max_capacity integer not null check (max_capacity > 0), booked_count integer not null default 0 check (booked_count >= 0),
  is_open boolean not null default true, unique(slot_date, time_window)
);
create table if not exists public.laundry_orders (
  id uuid primary key default gen_random_uuid(), order_ref text not null unique, student_id uuid not null references public.profiles(id),
  service_type text not null, slot_id uuid references public.laundry_slots(id), pickup_date date not null, pickup_time_slot text not null,
  special_instructions text, submitted_item_count integer not null default 0, confirmed_item_count integer,
  count_mismatch_noted boolean not null default false, estimated_amount numeric not null default 0, final_amount numeric not null default 0,
  billing_status text not null default 'PENDING', fee_transaction_id uuid references public.payments(id), status text not null,
  status_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.laundry_order_items (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.laundry_orders(id) on delete cascade,
  item_category text not null, quantity_submitted integer not null check(quantity_submitted > 0), quantity_confirmed integer,
  unit_rate numeric not null, total_price numeric not null
);
create table if not exists public.laundry_status_events (
  id uuid primary key default gen_random_uuid(), order_id uuid not null references public.laundry_orders(id) on delete cascade,
  status text not null, actor_id uuid references public.profiles(id) on delete set null, actor_role text not null,
  timestamp timestamptz not null default now(), notes text
);

create table if not exists public.inspection_templates (
  id uuid primary key default gen_random_uuid(), title text not null, description text, is_active boolean not null default true,
  created_at timestamptz not null default now()
);
create table if not exists public.inspection_template_items (
  id uuid primary key default gen_random_uuid(), template_id uuid not null references public.inspection_templates(id) on delete cascade,
  criterion_name text not null, category text not null, weight integer not null check(weight > 0), severity text not null
);
create table if not exists public.inspections (
  id uuid primary key default gen_random_uuid(), inspection_ref text not null unique, template_id uuid not null references public.inspection_templates(id),
  building text, block_id uuid references public.blocks(id), floor integer, room_id uuid references public.rooms(id), inspector_id uuid references public.profiles(id),
  scheduled_date date not null, completed_at timestamptz, cleanliness_score numeric, overall_result text not null default 'PENDING',
  status text not null default 'SCHEDULED', general_notes text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.inspection_results (
  id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id) on delete cascade,
  criterion_name text not null, category text not null, result text not null, notes text, flagged_issue boolean not null default false
);
create table if not exists public.corrective_actions (
  id uuid primary key default gen_random_uuid(), inspection_id uuid not null references public.inspections(id) on delete cascade,
  criterion_name text not null, action_type text not null, assignee_id uuid references public.staff(id), priority text not null,
  linked_maintenance_ticket_id text, status text not null default 'OPEN', resolution_notes text, created_at timestamptz not null default now(), resolved_at timestamptz
);

create table if not exists public.visitors (
  id uuid primary key default gen_random_uuid(), name text not null, phone text not null, email text, id_proof_type text, id_proof_number text,
  category text not null, host_student_id uuid not null references public.profiles(id), purpose text not null,
  expected_arrival timestamptz not null, expected_departure timestamptz not null, status text not null default 'PENDING_APPROVAL', notes text,
  reviewed_by uuid references public.profiles(id), reviewed_at timestamptz, rejection_reason text, created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.visitor_passes (
  id uuid primary key default gen_random_uuid(), visitor_id uuid not null references public.visitors(id) on delete cascade,
  pass_code text not null unique, valid_from timestamptz not null, valid_until timestamptz not null, is_revoked boolean not null default false, created_at timestamptz not null default now()
);
create table if not exists public.visitor_events (
  id uuid primary key default gen_random_uuid(), visitor_id uuid not null references public.visitors(id) on delete cascade,
  event_type text not null, actor_id uuid references public.profiles(id), actor_role text not null, timestamp timestamptz not null default now(), details text
);
create table if not exists public.parcels (
  id uuid primary key default gen_random_uuid(), parcel_ref text not null unique, recipient_student_id uuid not null references public.profiles(id),
  courier text not null, tracking_number text, storage_location text not null, locker_number text, received_by uuid references public.profiles(id),
  status text not null default 'AWAITING_COLLECTION', notes text, collected_at timestamptz, handed_over_by uuid references public.profiles(id),
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.parcel_pickup_codes (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.parcels(id) on delete cascade,
  code text not null, valid_until timestamptz not null, used boolean not null default false, attempts integer not null default 0, created_at timestamptz not null default now()
);
create table if not exists public.parcel_events (
  id uuid primary key default gen_random_uuid(), parcel_id uuid not null references public.parcels(id) on delete cascade,
  event_type text not null, actor_id uuid references public.profiles(id), actor_role text not null, timestamp timestamptz not null default now(), details text
);
create table if not exists public.assets (
  id uuid primary key default gen_random_uuid(), asset_tag text not null unique, name text not null, category text not null, description text, serial_number text,
  block_id uuid references public.blocks(id), floor integer, room_id uuid references public.rooms(id), bed_number text,
  purchase_date date, purchase_cost numeric not null default 0, warranty_expiry date, condition text not null default 'GOOD', status text not null default 'IN_USE', notes text,
  created_at timestamptz not null default now(), updated_at timestamptz not null default now()
);
create table if not exists public.asset_movements (
  id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.assets(id) on delete cascade, from_location text not null, to_location text not null,
  actor_id uuid references public.profiles(id), reason text, timestamp timestamptz not null default now()
);
create table if not exists public.asset_damage_reports (
  id uuid primary key default gen_random_uuid(), asset_id uuid not null references public.assets(id) on delete cascade,
  reported_by uuid references public.profiles(id), description text not null, priority text not null, maintenance_ticket_id text, repair_cost numeric not null default 0,
  resolution_status text not null default 'REPORTED', created_at timestamptz not null default now()
);
create table if not exists public.consumable_items (
  id uuid primary key default gen_random_uuid(), item_code text not null unique, name text not null, category text not null, unit text not null,
  current_stock integer not null default 0, min_threshold integer not null, supplier_name text, created_at timestamptz not null default now()
);
create table if not exists public.inventory_transactions (
  id uuid primary key default gen_random_uuid(), item_id uuid not null references public.consumable_items(id) on delete cascade,
  transaction_type text not null, quantity integer not null, actor_id uuid references public.profiles(id), reference text, timestamp timestamptz not null default now()
);

-- Users may only read/update their own profile. Service-role FastAPI bypasses RLS.
alter table public.profiles enable row level security;
create policy "profiles: read own" on public.profiles for select using (auth.uid() = id);
create policy "profiles: update own" on public.profiles for update using (auth.uid() = id) with check (auth.uid() = id);

-- Create a profile for every Supabase Auth user. Set role/full_name in Auth user metadata
-- from a trusted admin flow; never accept role selection from the browser.
create or replace function public.handle_new_user() returns trigger
language plpgsql security definer set search_path = public as $$
begin
  insert into public.profiles (id, full_name, email, role)
  values (
    new.id,
    coalesce(new.raw_user_meta_data ->> 'full_name', split_part(new.email, '@', 1)),
    new.email,
    coalesce(new.raw_app_meta_data ->> 'role', 'student')
  );
  return new;
end;
$$;
create trigger on_auth_user_created after insert on auth.users for each row execute procedure public.handle_new_user();

-- Keep updated timestamps correct without client-side clock values.
create or replace function public.set_updated_at() returns trigger language plpgsql as $$ begin new.updated_at = now(); return new; end; $$;
create trigger complaints_updated_at before update on public.complaints for each row execute function public.set_updated_at();
create trigger laundry_orders_updated_at before update on public.laundry_orders for each row execute function public.set_updated_at();
create trigger inspections_updated_at before update on public.inspections for each row execute function public.set_updated_at();
create trigger visitors_updated_at before update on public.visitors for each row execute function public.set_updated_at();
create trigger parcels_updated_at before update on public.parcels for each row execute function public.set_updated_at();
create trigger assets_updated_at before update on public.assets for each row execute function public.set_updated_at();
