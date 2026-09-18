# Spec base: Acceso a datos

> Spec **transversal / de referencia**. Documenta cómo la app **lee y escribe datos** contra Supabase: clientes, Server Actions, lecturas en Server Components, patrón de retorno, errores y carga. La **estructura** de los datos vive en [[modelado-y-tipos]]. No es una feature.
> Estado: `vigente`

## Propósito

Fijar la **capa de comunicación con Supabase**: toda lectura pasa por una **query** y toda escritura por una **Server Action**. Los componentes de UI nunca hablan con la red directamente. Así cada módulo consume los datos igual y la autorización queda del lado del servidor.

## Decisiones / Convenciones estables

### Clientes de Supabase (`@supabase/ssr`)

Un archivo por contexto de ejecución. **No** se crean clientes ad-hoc en los módulos.

| Cliente | Archivo | Uso |
| --- | --- | --- |
| Server | `lib/supabase/server.ts` | Server Components, Server Actions, Route Handlers. Lee/escribe cookies de sesión. **Se crea por request** (no cachear a nivel módulo). |
| Browser | `lib/supabase/client.ts` | Client Components que necesiten Supabase directo (evitar; preferir Server Actions). |
| Middleware | `lib/supabase/middleware.ts` + `middleware.ts` (raíz) | Refresca la sesión en cada request → [[acceso-y-roles]]. |

Las variables de entorno (`NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`) viven en `.env.local` y nunca se commitean. La `service_role` key **no** se usa en la app cliente/servidor de request; solo en scripts/seeds fuera del flujo de usuario.

### Lecturas — queries en Server Components

Las lecturas viven en `lib/{entidad}/queries.ts` y las consume el `page.tsx` (Server Component).

- Devuelven los **datos tipados** ([[modelado-y-tipos]]) o un **fallback seguro** (`[]`, `null`) ante error, logeando. La UI nunca recibe una excepción cruda de un listado.
- La **autorización** la aplica **RLS** en la base: la query trae solo lo que el usuario puede ver → [[acceso-y-roles]]. No se filtra por rol "a mano" como única barrera.

```ts
// lib/inmueble/queries.ts
import { createClient } from '@/lib/supabase/server';

export async function getInmuebles(): Promise<Inmueble[]> {
  const supabase = await createClient();
  const { data, error } = await supabase
    .from('inmuebles')
    .select('*')
    .order('creado_en', { ascending: false });
  if (error) {
    console.error('Error fetching inmuebles', error);
    return []; // fallback
  }
  return data;
}
```

### Escrituras — Server Actions

Las mutaciones viven en `lib/{entidad}/actions.ts`, con `'use server'`. Una **función por operación**, tipada.

- **Validan la entrada** en el servidor ([[formularios-y-validacion]]) antes de tocar la base.
- **Chequean el rol** cuando la operación lo requiere, además de RLS → [[acceso-y-roles]].
- Devuelven **`{ ok, mensaje?, error?, data? }`** para que la UI muestre feedback ([[ui-y-feedback]]). No lanzan la excepción cruda a la UI.
- Tras una mutación, **revalidan** la vista afectada (`revalidatePath`/`revalidateTag`) para que el listado se refresque.

```ts
// lib/inmueble/actions.ts
'use server';
import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function crearInmueble(input: InmuebleInput): Promise<ActionResult> {
  const parsed = inmuebleSchema.safeParse(input);        // validación server → [[formularios-y-validacion]]
  if (!parsed.success) return { ok: false, error: true, mensaje: 'Datos inválidos' };

  const supabase = await createClient();
  const { error } = await supabase.from('inmuebles').insert(parsed.data);
  if (error) return { ok: false, error: true, mensaje: error.message };

  revalidatePath('/inmuebles');
  return { ok: true, mensaje: 'Inmueble creado correctamente' };
}
```

Tipo de retorno común (definido una vez en `lib/types.ts`):

```ts
export type ActionResult<T = void> =
  | { ok: true; mensaje?: string; data?: T }
  | { ok: false; error: true; mensaje: string };
```

### Baja lógica

Los registros con historial comercial **no se borran** (`delete`); se cambia su `estado`/`activo` → regla transversal en [[00-general]]. Solo se permite `delete` físico en entidades sin historial y cuando la feature lo justifique.

### Estado de carga = skeletons

La carga se resuelve con **skeletons por componente** (ej. `InmuebleTableSkeleton`) vía `loading.tsx` o `<Suspense>`, **no** con spinner global → [[ui-y-feedback]].

### Route Handlers (excepción)

Solo para casos que no encajan en Server Actions/RSC: webhooks, endpoints para la funcionalidad de IA, integraciones. Viven en `app/api/*`. El flujo normal de ABM **no** usa Route Handlers.

## Reglas (hacer / no hacer)

- **Hacer:** lecturas en `queries.ts` (consumidas por Server Components); escrituras en Server Actions que devuelven `ActionResult`; validar y chequear rol en el servidor; revalidar tras mutar; apoyarse en RLS como frontera real; baja lógica donde haya historial.
- **No hacer:** `fetch`/cliente Supabase directo desde un Client Component para ABM; crear clientes Supabase sueltos; tragarse errores sin logear; devolver excepciones crudas a la UI; usar la `service_role` key en el flujo de request; `delete` físico de registros con historial.

## Cuándo aplica

- Al agregar cualquier operación de datos a un módulo (listar, crear, editar, dar de baja).
- Al conectar una pantalla con la base.

## Ver también

- [[modelado-y-tipos]] — estructura de los tipos/DTOs que se leen y escriben.
- [[acceso-y-roles]] — RLS, sesión y chequeo de rol.
- [[formularios-y-validacion]] — validación de la entrada (cliente + server).
- [[ui-y-feedback]] — skeletons y alertas a partir de `ActionResult`.
- [[arquitectura-y-modulos]] — dónde viven queries, actions y clientes.
