-- ============================================================
-- ESTADO DE CITAS (pending | completed | cancelled)
-- Ejecuta en SQL Editor. Añade columna status y políticas para que el admin pueda actualizar/borrar.
-- ============================================================

-- Columna status (por defecto 'pending'). Valores: pending | completed | cancelled
alter table public.appointments
  add column if not exists status text not null default 'pending';

-- Solo usuarios autenticados (admin) pueden actualizar y borrar citas
create policy "Admin actualizar citas"
  on public.appointments for update
  to authenticated
  using (true)
  with check (true);

create policy "Admin borrar citas"
  on public.appointments for delete
  to authenticated
  using (true);
