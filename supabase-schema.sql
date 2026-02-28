-- Ejecuta este SQL en el SQL Editor de tu proyecto Supabase
-- (Dashboard → SQL Editor → New query)
--
-- Tipos de columnas (public.appointments):
--   id          uuid         PK, default gen_random_uuid()
--   email       text         NOT NULL
--   client_name text         nullable
--   date        date         NOT NULL
--   time_slot   text         NOT NULL  (ej. "09:00", "14:30")
--   service_id  text         nullable
--   created_at  timestamptz  default now()

-- Tabla de citas
create table if not exists public.appointments (
  id uuid primary key default gen_random_uuid(),
  email text not null,
  client_name text,
  date date not null,
  time_slot text not null,
  service_id text,
  created_at timestamptz default now()
);

-- Índice para consultar citas por fecha (horarios ocupados)
create index if not exists appointments_date_idx on public.appointments (date);

-- Políticas básicas: cualquiera puede leer (para ver horarios ocupados) e insertar (reservar)
alter table public.appointments enable row level security;

create policy "Permitir leer citas"
  on public.appointments for select
  using (true);

create policy "Permitir insertar citas"
  on public.appointments for insert
  with check (true);

-- Opcional: solo tú (admin) puedes actualizar o borrar. Requiere auth.
-- create policy "Solo admin puede actualizar/borrar"
--   on public.appointments for all
--   using (auth.role() = 'authenticated');
