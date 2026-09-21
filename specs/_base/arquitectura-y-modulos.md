# Spec base: Arquitectura y patrón de módulo

> Spec **transversal / de referencia**. Documenta lo **estable** de la app (monolito Next.js App Router): nomenclatura, árbol de archivos y cómo se arma un módulo. No es una feature.
> Estado: `vigente`

## Propósito

Definir **dónde va cada cosa** y **cómo se estructura un módulo** para que toda feature siga el mismo patrón y sea predecible. Es la base que las specs de feature dan por sentada.

## Stack (estable)

- **Next.js 16 (App Router)** + **React 19** + TypeScript.
- **Supabase** como base de datos, auth y capa de datos → [[acceso-y-datos]], [[acceso-y-roles]].
- **Tailwind** + template VRISTO para la UI → [[ui-y-feedback]].
- **Redux Toolkit** para estado global de UI (ya presente en `store/`) → [[estado]].
- Alias de imports: **`@/*`** apunta a la raíz del repo (ver `tsconfig.json`). No hay carpeta `src/`.

## Decisiones / Convenciones estables

### Server vs Client Components

- **Server Component por defecto** (páginas, listados, detalles): hacen el fetching con las queries de `lib/` → [[acceso-y-datos]].
- **Client Component** (`'use client'`) solo cuando hay interactividad: formularios, filtros con estado, tablas con orden/paginación en cliente, uso de Redux/hooks.
- Las **mutaciones** van por **Server Actions**, nunca por fetch a mano desde el cliente → [[acceso-y-datos]].

### Nomenclatura de archivos

| Tipo | Convención | Ejemplo |
| --- | --- | --- |
| Página (route) | `page.tsx` (carpeta = ruta) | `app/(dashboard)/inmuebles/page.tsx` |
| Componente React | `PascalCase.tsx` | `InmuebleTable.tsx`, `InmuebleForm.tsx` |
| Server Actions | `actions.ts` | `lib/inmueble/actions.ts` |
| Queries (lecturas) | `queries.ts` | `lib/inmueble/queries.ts` |
| Tipos / DTOs | `types.ts` | `lib/inmueble/types.ts` |
| Enum / constante | `camelCase.ts` | `lib/enums/estadoOportunidad.ts` |
| Cliente Supabase | ver [[acceso-y-datos]] | `lib/supabase/server.ts` |

- Idioma: **dominio en español** (entidades, rutas, archivos de dominio). Términos técnicos en inglés donde ya es costumbre (`page`, `layout`, `actions`).
- DTOs con sufijo de dirección cuando aplica: `XxxInput` (escritura) / `XxxRow` o `Xxx` (lectura) → [[modelado-y-tipos]].

### Árbol de un módulo

Cada módulo del dominio se reparte en tres lugares: **ruta** (`app/`), **UI** (`views/`) y **datos/tipos** (`lib/`).

```
app/(dashboard)/{recurso}/
├── page.tsx                 # listado (Server Component): fetch vía queries + render de la view
├── [id]/page.tsx            # detalle (Server Component)
├── nuevo/page.tsx           # alta (o modal desde el listado)
└── [id]/editar/page.tsx     # edición

views/{Entidad}/
├── {Entidad}List.tsx        # tabla + filtros (Client Component)
├── {Entidad}Form.tsx        # form de alta/edición (Client Component) → [[formularios-y-validacion]]
├── {Entidad}Detalle.tsx     # vista de detalle
└── {Entidad}TableSkeleton.tsx  # loading → [[ui-y-feedback]]

lib/{entidad}/
├── queries.ts               # lecturas (usadas por los Server Components)
├── actions.ts               # Server Actions (mutaciones) → [[acceso-y-datos]]
└── types.ts                 # tipos y DTOs del módulo → [[modelado-y-tipos]]
```

### Dónde va lo compartido

```
app/
├── (auth)/          # login, recuperar contraseña (sin sidebar)
├── (dashboard)/     # app autenticada (layout con sidebar/header)
components/
├── Layouts/         # DefaultLayout, Sidebar, Header, Footer (del template)
└── {compartidos}/   # UI reutilizable entre módulos → [[ui-y-feedback]]
lib/
├── supabase/        # clientes server/client/proxy → [[acceso-y-datos]]
├── enums/           # enums de dominio con config visual → [[modelado-y-tipos]]
├── auth/            # helpers de rol/sesión → [[acceso-y-roles]]
└── {entidad}/       # queries/actions/types por módulo
store/               # Redux Toolkit (estado global de UI) → [[estado]]
types/
└── database.ts      # tipos generados de Supabase → [[modelado-y-tipos]]
```

### Patrón container vs presentacional

- **Container = `page.tsx` (Server Component)**: hace el fetching vía `queries.ts` y pasa datos por props a la view. Sin estado de cliente.
- **Presentacional = `views/{Entidad}/*` (Client)**: reciben datos y callbacks; los callbacks invocan Server Actions. No hacen fetching de red por su cuenta salvo revalidación.

### Navegación listado ↔ detalle

- Se navega por **ruta** (`/{recurso}/[id]`), no por estado en memoria. El detalle es un Server Component que recibe `params.id` y hace su propia query.
- Alta/edición pueden ser ruta propia (`/nuevo`, `/[id]/editar`) o modal según la feature → [[ui-y-feedback]].

## Reglas (hacer / no hacer)

- **Hacer:** ubicar cada archivo según las tablas; Server Component por defecto y `'use client'` solo si hace falta; fetching vía `lib/{entidad}/queries.ts`; mutaciones vía Server Actions; reutilizar `components/` antes de crear UI nueva.
- **No hacer:** llamar a Supabase o `fetch` directo desde un componente de UI (va en `queries`/`actions`); meter lógica de negocio en presentacionales; crear módulos que no sigan `app` + `views` + `lib`; duplicar tipos (van en [[modelado-y-tipos]]).

## Cuándo aplica

- Al crear un módulo nuevo o agregar pantallas a uno existente.
- Para decidir en qué carpeta poner un archivo.

## Ver también

- [[acceso-y-datos]], [[acceso-y-roles]], [[modelado-y-tipos]], [[estado]], [[formularios-y-validacion]], [[ui-y-feedback]].
- Dominio y reglas transversales: [[00-general]].
