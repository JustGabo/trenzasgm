# Conectar Supabase para las reservas de citas

Sigue estos pasos para que el formulario de "Reservar cita" funcione con Supabase.

---

## 1. Crear proyecto en Supabase (si aún no tienes uno)

1. Entra en [supabase.com](https://supabase.com) e inicia sesión.
2. **New project** → elige nombre, contraseña de base de datos y región.
3. Espera a que el proyecto esté listo.

---

## 2. Crear la tabla y las políticas en Supabase

1. En el **Dashboard** de tu proyecto, ve a **SQL Editor** (menú izquierdo).
2. Pulsa **New query**.
3. Copia y pega **todo** el contenido del archivo `supabase-schema.sql` (en la raíz del proyecto).
4. Pulsa **Run** (o Ctrl+Enter).
5. Deberías ver algo como "Success. No rows returned".

Con esto tendrás:
- Tabla `appointments` con estas columnas y tipos:

| Columna       | Tipo         | Obligatorio | Descripción |
|---------------|--------------|-------------|-------------|
| `id`          | **uuid**     | auto        | PK, se genera solo |
| `email`       | **text**     | sí          | Correo del cliente |
| `client_name` | **text**     | no          | Nombre del cliente |
| `date`        | **date**     | sí          | Fecha de la cita (YYYY-MM-DD) |
| `time_slot`   | **text**     | sí          | Hora, ej. `"09:00"`, `"14:30"` |
| `service_id`  | **text**     | no          | ID del servicio (opcional) |
| `created_at`  | **timestamptz** | auto      | Se rellena al insertar |

- Políticas para que cualquiera pueda **leer** (ver horarios ocupados) e **insertar** (reservar). Nadie puede borrar ni editar desde la web.

---

## 3. Configurar variables de entorno en tu proyecto

1. En Supabase Dashboard, ve a **Project Settings** (icono de engranaje) → **API**.
2. Ahí verás:
   - **Project URL** (ej: `https://xxxx.supabase.co`)
   - **Project API keys** → **anon public** (una clave larga que empieza por `eyJ...`).
3. En la raíz de tu proyecto (trenzasgm), crea el archivo **`.env.local`** (si no existe).
4. Añade estas dos líneas sustituyendo por tus valores:

```env
NEXT_PUBLIC_SUPABASE_URL=https://TU-PROJECT-REF.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
```

5. Guarda el archivo. **No subas `.env.local` a Git** (ya debería estar en `.gitignore`).

---

## 4. Reiniciar el servidor de desarrollo

Para que Next.js cargue las nuevas variables:

```bash
# Detén el servidor (Ctrl+C) y vuelve a arrancar
npm run dev
```

---

## 5. Probar que todo funciona

1. Abre la web en local (por ejemplo `http://localhost:3000`).
2. Baja hasta la sección **Reservar cita**.
3. Elige una **fecha** en el calendario.
4. Elige una **hora** (deberían cargarse; si no hay citas, todas estarán libres).
5. Rellena **correo** (y nombre si quieres) y pulsa **Reservar cita**.
6. Deberías ver el mensaje de éxito y la fecha/hora/correo quedan guardados en Supabase.

Para comprobar los datos en Supabase:

- Dashboard → **Table Editor** → tabla **appointments**. Ahí verás cada reserva.

---

## Resumen rápido

| Paso | Dónde | Qué hacer |
|------|--------|-----------|
| 1 | Supabase Dashboard | Crear proyecto (si hace falta). |
| 2 | SQL Editor | Ejecutar `supabase-schema.sql`. |
| 3 | Supabase → Settings → API | Copiar URL y anon key. |
| 4 | Proyecto → `.env.local` | Poner `NEXT_PUBLIC_SUPABASE_URL` y `NEXT_PUBLIC_SUPABASE_ANON_KEY`. |
| 5 | Terminal | `npm run dev` de nuevo y probar reservar una cita. |

Si algo falla (por ejemplo error al reservar o al cargar horarios), revisa que las variables estén bien en `.env.local` y que el SQL se haya ejecutado sin errores.
