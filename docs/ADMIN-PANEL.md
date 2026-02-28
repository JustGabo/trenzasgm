# Panel de administración

Panel para gestionar citas y bloquear disponibilidad. Ruta: **`/admin`**.

## 1. Ejecutar el SQL de bloqueos

En Supabase → **SQL Editor**, ejecuta el contenido de **`supabase-admin-schema.sql`** (tabla `availability_blocks` y políticas RLS).

Para poder usar **Finalizar** y **Cancelar** en las citas, ejecuta también **`supabase-appointments-status.sql`** (añade columna `status` y políticas de actualización/borrado para el admin).

## 2. Crear el usuario admin

La autenticación usa **Supabase Auth** (email + contraseña).

1. En Supabase Dashboard → **Authentication** → **Users**.
2. **Add user** → **Create new user**.
3. Indica **Email** y **Password** (guárdalos para entrar en `/admin`).
4. Opcional: confirma el email desde **Authentication** → **Users** → los tres puntos del usuario → **Send email confirmation**, o desactiva "Confirm email" en **Authentication** → **Providers** → **Email** si quieres entrar sin confirmar.

## 3. Entrar al panel

1. Ve a **`https://tudominio.com/admin`** (o `http://localhost:3000/admin` en local).
2. Serás redirigido a **`/admin/login`** si no hay sesión.
3. Inicia sesión con el email y contraseña del usuario creado en el paso 2.
4. Tras el login verás el **Overview** del dashboard.

## 4. Estructura del panel

- **Overview** (`/admin`): resumen con tarjetas (citas del mes, hoy, esta semana) y tabla de últimas citas con botones **Finalizar** y **Cancelar** por cita.
- **Citas** (`/admin/citas`): tabla de citas con filtro por mes (fecha, hora, cliente, correo) y botones **Finalizar** / **Cancelar**.
- **Disponibilidad** (`/admin/disponibilidad`):
  - **Día completo:** elige fecha y marca "Bloquear día completo". Esa fecha no será elegible en el calendario público.
  - **Horas concretas:** elige fecha, desmarca "Bloquear día completo" y pulsa las horas a bloquear (ej. 12:00, 12:30, 13:00…). Esas horas no se ofrecerán en el formulario de reservas.
  - Los bloqueos se listan debajo; puedes **quitar** cualquiera (por fecha: se eliminan todos los bloques de ese día).

## 5. Comportamiento en la web pública

- En **Reservar cita**, las horas que ya tienen cita o están bloqueadas aparecen deshabilitadas.
- Los días bloqueados **completos** no se pueden elegir en el calendario.

## 6. Cerrar sesión

En el sidebar del panel, **Cerrar sesión**. Volverás a `/admin/login`.
