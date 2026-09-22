# Spec base: Estado

> Spec **transversal / de referencia**. Documenta **dónde vive cada tipo de estado** en la app: servidor, global de UI o local. No es una feature.
> Estado: `vigente`

## Propósito

Evitar que el estado se disperse. Fijar qué va en el servidor, qué en Redux y qué en el componente, para que nadie duplique datos ni sincronice a mano lo que Next ya resuelve.

## Decisiones / Convenciones estables

### Tres tipos de estado

| Tipo | Dónde vive | Ejemplos |
| --- | --- | --- |
| **Server state** (datos del dominio) | Base + Server Components + Server Actions. Se refresca con `revalidatePath`/`revalidateTag`. | Listado de inmuebles, detalle de oportunidad, historial. |
| **Global de UI** | **Redux Toolkit** (`store/`, ya presente) | Tema, sidebar, idioma, `pageTitle`, preferencias de UI del template VRISTO. |
| **Local del componente** | `useState`/`useReducer` en el Client Component | Estado de un form, apertura de un modal, filtros de una tabla antes de aplicarlos. |

### El dato del dominio NO se guarda en Redux

- Los datos que vienen de la base viven en el **servidor** y se pasan por props desde el Server Component. Tras una mutación, la **revalidación** de Next actualiza la vista → [[acceso-y-datos]].
- **No** se cargan listados/detalles en Redux ni se "cachean" en el cliente. Redux es para estado de **UI**, no para reemplazar la base.

### Redux existente (template)

- `store/index.tsx` y `store/themeConfigSlice.tsx` ya manejan tema/layout. Reutilizar ese slice; agregar slices nuevos solo para estado **global de UI**, no de dominio.
- El título de página se setea con el mecanismo del template (`pageTitle`), desde el Server Component o la view según corresponda.

### Filtros y búsqueda

- Los filtros de un listado pueden ser **estado local** (aplicar en cliente sobre datos ya traídos) o **search params de la URL** (`?estado=ABIERTA&funnel=...`) cuando conviene que sean compartibles/persistentes y que el Server Component filtre en la query. Preferir **search params** para filtros que definen qué datos se traen → [[acceso-y-datos]].

## Reglas (hacer / no hacer)

- **Hacer:** datos del dominio en el servidor (RSC + revalidación); Redux solo para UI global; estado local para lo efímero del componente; filtros que cambian la query, en la URL.
- **No hacer:** meter listados/detalles del dominio en Redux; sincronizar a mano el cliente con la base; crear un slice por entidad de dominio; duplicar en el cliente lo que el servidor ya tiene.

## Cuándo aplica

- Al decidir dónde poner un estado nuevo.
- Al conectar filtros/búsqueda de un listado.

## Ver también

- [[acceso-y-datos]] — server state, queries y revalidación.
- [[arquitectura-y-modulos]] — Server vs Client Components; ubicación de `store/`.
- [[ui-y-feedback]] — estado de UI (tema, sidebar) del template.
