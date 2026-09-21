# Spec base: Acceso y roles

> Spec **transversal / de referencia**. Documenta cómo la app sabe **quién es el usuario** y **qué puede ver/hacer**: Supabase Auth para la sesión y **RLS** como frontera de seguridad. No es una feature.
> Estado: `vigente`

## Propósito

Definir el modelo de **roles** y el mecanismo de **autorización**: de dónde sale la sesión y el rol, cómo se protege una ruta, cómo se refuerza en el servidor y cómo se oculta lo que no corresponde en la UI. Toda feature que diga "esto solo lo hace tal rol" se apoya acá.

## Decisiones / Convenciones estables

### Autenticación — Supabase Auth

- La sesión la maneja **Supabase Auth** (email + contraseña). Las contraseñas nunca se almacenan en la app → regla transversal en [[00-general]].
- La sesión se refresca en **`proxy.ts`** (raíz, el ex `middleware.ts` de Next ≤15) usando `lib/supabase/proxy.ts` → [[acceso-y-datos]]. El proxy también redirige a `/auth/cover-login` si no hay sesión en rutas protegidas.
- El login/recuperación viven en el grupo `app/(auth)/`; la app autenticada en `app/(dashboard)/`.

### Roles del sistema

Enum en `lib/enums/rolUsuario.ts` (patrón de enum con config visual → [[modelado-y-tipos]]).

| Rol | Clave |
| --- | --- |
| Administrador | `ADMINISTRADOR` |
| Vendedor | `VENDEDOR` |
| Responsable comercial | `RESPONSABLE_COMERCIAL` |

El rol **no** vive en el JWT por defecto: se guarda en una tabla `usuarios` (o `perfiles`) ligada a `auth.users` por `id`. Se resuelve con un helper de servidor:

```ts
// lib/auth/session.ts
export async function getUsuarioActual(): Promise<{ id: string; rol: Rol } | null> { ... }
```

### Autorización — RLS como frontera real

- La **frontera de seguridad son las políticas RLS** de Supabase sobre cada tabla. El chequeo de rol en el front/Server Action es para **UX y defensa en profundidad**, no reemplaza a RLS → regla transversal en [[00-general]].
- Toda tabla del dominio tiene **RLS habilitado** con políticas por operación (`select`/`insert`/`update`/`delete`) según el rol y la pertenencia (ej. el vendedor solo ve/edita lo asignado a él; responsable y admin ven todo).
- Las políticas leen el rol del usuario desde la tabla `usuarios` (función `SECURITY DEFINER` o join), no desde datos que el cliente pueda falsear.

### Protección de rutas

- **Proxy** (`proxy.ts` en la raíz): exige sesión para todo `(dashboard)`.
- **Por rol**: rutas restringidas a un rol se protegen en el `layout.tsx`/`page.tsx` del segmento (Server Component) resolviendo `getUsuarioActual()` y haciendo `redirect('/no-autorizado')` si el rol no está permitido. No se confía solo en ocultar el link.

```tsx
// app/(dashboard)/usuarios/layout.tsx
const usuario = await getUsuarioActual();
if (usuario?.rol !== 'ADMINISTRADOR') redirect('/no-autorizado');
```

### Gating de UI

Para mostrar/ocultar acciones (ítems de menú, botones) según rol se usa un componente/util de UI que recibe el rol actual y los roles permitidos → render en [[ui-y-feedback]]. Es **UX**, no seguridad.

### Matriz ruta → roles (referencia)

Cada feature declara sus rutas y roles; el estado consolidado se mantiene acá.

| Ruta(s) | Roles |
| --- | --- |
| `/usuarios` y subrutas | Administrador |
| Configuración (etapas, tipos de actividad, orígenes, motivos de pérdida) | Administrador |
| Contactos, inmuebles, oportunidades, embudo, actividades | Vendedor (lo asignado), Responsable comercial y Administrador (todo) |
| `/no-autorizado`, `(auth)/*` | abiertas |

## Reglas (hacer / no hacer)

- **Hacer:** habilitar RLS en toda tabla del dominio con políticas por rol/pertenencia; resolver el rol en el servidor (`getUsuarioActual`); proteger rutas por rol en el segmento; validar el rol también en Server Actions cuando la operación lo requiere; ocultar en UI lo que el rol no puede usar; declarar en la spec de la feature qué rol hace qué.
- **No hacer:** confiar solo en el front para proteger datos; leer el rol de algo que el cliente controle; dejar una tabla del dominio sin RLS; hardcodear el rol con strings sueltos fuera del enum; duplicar la lógica de redirección.

## Cuándo aplica

- Al crear una tabla nueva (definir sus políticas RLS).
- Al agregar una ruta/acción y decidir qué rol la usa.

## Preguntas abiertas

- ¿El vendedor ve contactos/inmuebles **solo asignados a él** o toda la cartera? **Resuelto provisoriamente en la migración de RLS: la cartera es compartida** — todo usuario activo lee y edita contactos e inmuebles, y la restricción por pertenencia se aplica solo a `oportunidades` (que sí tienen responsable). Si el equipo decide restringirla, se cambian las políticas `contactos_*` e `inmuebles_*` y nada más.

## Ver también

- [[acceso-y-datos]] — clientes Supabase, proxy de sesión, chequeo en Server Actions.
- [[modelado-y-tipos]] — enum de rol con config visual; tabla `usuarios`.
- [[ui-y-feedback]] — chip/badge de rol y gating de acciones.
- Roles y reglas transversales: [[00-general]].
