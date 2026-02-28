-- ============================================================
-- BLOQUEOS DE DISPONIBILIDAD (admin)
-- Ejecuta en SQL Editor después del schema de appointments.
-- ============================================================
-- Tipos: availability_blocks
--   id         uuid    PK
--   date       date    NOT NULL  (día bloqueado)
--   time_slot  text    nullable  (NULL = día completo; "09:00" = solo esa hora)
--   created_at timestamptz default now()

create table if not exists public.availability_blocks (
  id uuid primary key default gen_random_uuid(),
  date date not null,
  time_slot text,
  created_at timestamptz default now()
);

create index if not exists availability_blocks_date_idx on public.availability_blocks (date);

alter table public.availability_blocks enable row level security;

-- Público puede leer (para que el formulario de reservas oculte bloques)
create policy "Leer bloques"
  on public.availability_blocks for select
  using (true);

-- Solo usuarios autenticados (admin) pueden crear/borrar bloques
create policy "Admin insertar bloques"
  on public.availability_blocks for insert
  to authenticated
  with check (true);

create policy "Admin borrar bloques"
  on public.availability_blocks for delete
  to authenticated
  using (true);
