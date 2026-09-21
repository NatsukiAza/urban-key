# Spec: Inmuebles

> El QUÉ y el POR QUÉ. Sin detalles de implementación (eso va en el código / PR).
> Estado: `implementada`

## Hereda de (specs base)

> Esta spec **hereda** lo transversal de estas bases; **NO se re-explica acá**. Quien implemente: **leé solo estas bases, no todas.**

- Arquitectura y estructura de módulo → [[_base/arquitectura-y-modulos]]
- Acceso a datos (Supabase, Server Actions, RSC) → [[_base/acceso-y-datos]]
- Acceso y roles (Auth + RLS) → [[_base/acceso-y-roles]]
- Modelado y tipos → [[_base/modelado-y-tipos]]
- Estado → [[_base/estado]]
- Formularios y validación → [[_base/formularios-y-validacion]]
- UI y feedback → [[_base/ui-y-feedback]]
- Criterios de aceptación → [[_base/criterios-de-aceptacion]]
- Testing → [[_base/testing]]

Dominio, roles y reglas transversales: [[00-general]].

Abajo va **solo lo propio del módulo**.

## Problema / Motivación

El inmueble es el eje del negocio de UrbanKey ([[00-general]] → "Decisiones de especialización"): es lo que se capta, lo que se muestra y lo que se opera. Hoy la tabla `inmuebles` existe en la base y las oportunidades ya la referencian, pero **no hay ninguna pantalla para cargarla ni consultarla**: la cartera solo se puede sembrar por script.

Sin este módulo, el vendedor no puede registrar la propiedad que acaba de captar, y el responsable comercial no puede responder la pregunta más básica del día a día: *"¿qué tenemos disponible en Castelar, 3 ambientes, hasta USD 150.000, y qué negociaciones hay sobre esa propiedad?"*.

## Objetivo

Que un usuario pueda **dar de alta, listar, filtrar, ver en detalle, editar y dar de baja** inmuebles residenciales con los datos propios del rubro, y que desde el detalle de cada inmueble se vean **las oportunidades asociadas** a esa propiedad.

## Fuera de alcance

- **Fotos / galería de imágenes** y adjuntos (necesita Supabase Storage; feature aparte).
- **Publicación en portales** (ZonaProp, Argenprop) y ficha pública.
- **Tasación** asistida o estimación automática de precio.
- **Relación N:M oportunidad ↔ inmueble** ("propiedades seleccionadas" para un interesado). Se mantiene la FK simple `oportunidades.inmueble_id` → ver "Preguntas abiertas".
- **Actividades** sobre el inmueble (visitas, tasaciones): son del módulo de actividades, que sí podrá referenciar `inmueble_id`.
- **Alta de contactos propietarios** desde este módulo: el propietario se elige de los contactos ya existentes (módulo de contactos).

## Actores y roles

La cartera es **compartida**: todo usuario activo ve y edita inmuebles ([[_base/acceso-y-roles]] → pregunta abierta resuelta en la migración de RLS). No hay filtro por pertenencia porque el inmueble no tiene responsable asignado.

- **Vendedor:** registra la propiedad que captó, la edita, cambia su estado comercial, consulta la cartera completa y ve las oportunidades de cada inmueble. Puede dar de baja (lógica) un inmueble sin oportunidades abiertas.
- **Responsable comercial:** lo mismo que el vendedor. Su uso típico es consulta y supervisión de la cartera.
- **Administrador:** lo mismo, más el borrado físico (habilitado por RLS pero **no expuesto en la UI**: la app siempre hace baja lógica).

## Requisitos funcionales

- **RF1:** El sistema debe permitir **registrar un inmueble** con su propietario, ubicación, tipo de operación, tipo de propiedad y datos edilicios.
- **RF2:** El propietario de un inmueble debe ser un **contacto marcado como propietario** (`es_propietario`). El sistema rechaza el alta/edición si no lo es.
- **RF3:** El sistema debe **listar** los inmuebles activos con sus datos clave y permitir **buscar** por texto libre (dirección, localidad, propietario).
- **RF4:** El sistema debe permitir **filtrar** la cartera por tipo de operación, tipo de inmueble, estado comercial y localidad. Los filtros que definen qué datos se traen viajan en la **URL** ([[_base/estado]]).
- **RF5:** El sistema debe mostrar el **detalle** de un inmueble con todos sus datos, su propietario y **las oportunidades asociadas** (título, contacto, responsable, funnel, etapa y estado), con link a cada una.
- **RF6:** El sistema debe permitir **editar** un inmueble, incluido su **estado comercial** (`DISPONIBLE` / `RESERVADO` / `OPERADO` / `RETIRADO`).
- **RF7:** El sistema debe permitir dar de **baja lógica** un inmueble (`activo = false`), **rechazándola** si el inmueble tiene oportunidades **abiertas** — regla 9 de [[00-general]]: no se borra lo que tiene historial comercial, y no se retira de la cartera algo que se está negociando.
- **RF8:** Los datos numéricos deben ser **coherentes**: dormitorios ≤ ambientes; superficie, precio, expensas y antigüedad no negativos.
- **RF9:** Toda alta/edición debe registrar **quién** la hizo (`creado_por` / `actualizado_por`) — regla 13 de [[00-general]].

## Datos y modelo

> La tabla `inmuebles` **ya existe** (`20260921172723_esquema_inicial.sql`). Esta feature la **amplía** con los campos del nicho en una migración aditiva y crea los enums de código que faltaban.

### Columnas nuevas (migración `..._inmuebles_campos_nicho.sql`)

| Tabla / columna | Tipo | Notas |
| --- | --- | --- |
| `inmuebles.localidad` | `text` | Partido/localidad del GBA Oeste. Filtrable. |
| `inmuebles.dormitorios` | `integer` | CHECK `> 0` si no es nulo. |
| `inmuebles.banos` | `integer` | Sin ñ por convención de columnas. CHECK `>= 0` si no es nulo. |
| `inmuebles.cochera` | `boolean not null default false` | |
| `inmuebles.antiguedad` | `integer` | Años. CHECK `>= 0` si no es nulo. |
| `inmuebles.descripcion` | `text` | Texto libre de la ficha. |
| CHECK `inmuebles_dormitorios_coherentes` | — | `dormitorios <= ambientes` cuando ambos están cargados. |
| Índices | — | `inmuebles (localidad)`, `inmuebles (estado)`, `inmuebles (tipo_operacion)` para los filtros del listado. |

### Columnas preexistentes que usa la feature

`contacto_id` (propietario, FK a `contactos`), `sucursal_id`, `nombre`, `direccion`, `tipo_operacion`, `tipo_inmueble`, `estado`, `ambientes`, `m2`, `precio`, `moneda`, `expensas`, `activo`, auditoría (`creado_por`, `actualizado_por`, `creado_en`, `actualizado_en`).

### Enums de código

El esquema inicial dejó anotado que `tipo_inmueble`, `estado_inmueble` y `moneda` existen en la base pero **no tenían archivo en `lib/enums/`**. Los crea esta feature, con el patrón de tres partes (tipo + `options` + `config`) de [[_base/modelado-y-tipos]]:

| Enum | Valores |
| --- | --- |
| `tipoInmueble` | `CASA` · `DEPARTAMENTO` · `PH` |
| `estadoInmueble` | `DISPONIBLE` · `RESERVADO` · `OPERADO` · `RETIRADO` |
| `moneda` | `ARS` · `USD` |

### Relación con oportunidades

`oportunidades.inmueble_id` → `inmuebles.id` (`on delete restrict`, nullable). Es **1 inmueble → N oportunidades**: la misma propiedad puede pasar por captación y después por la operación con un interesado. La feature la consume **en modo lectura** desde el detalle del inmueble; no modifica el módulo de oportunidades.

### Políticas RLS

Sin cambios: las políticas `inmuebles_select/insert/update` (cualquier usuario activo) y `inmuebles_delete` (solo administrador) ya están en `20260921172725_rls.sql`. Las columnas nuevas quedan cubiertas por las políticas existentes, que son a nivel de fila.

## Acceso a datos (queries y Server Actions)

| Operación | Tipo | Firma | Rol |
| --- | --- | --- | --- |
| Listar inmuebles (enriquecido) | query (RSC) | `getInmueblesList(filtro?): Promise<InmuebleRow[]>` | todos |
| Traer inmueble para editar | query (RSC) | `getInmueble(id): Promise<Inmueble \| null>` | todos |
| Detalle con propietario y oportunidades | query (RSC) | `getInmuebleDetalle(id): Promise<InmuebleDetalle \| null>` | todos |
| Opciones del formulario | query (RSC) | `getInmuebleFormOptions(): Promise<InmuebleFormOptions>` | todos |
| Localidades cargadas (para el filtro) | query (RSC) | `getLocalidades(): Promise<string[]>` | todos |
| Crear inmueble | Server Action | `crearInmueble(input): Promise<ActionResult<{ id }>>` | todos |
| Editar inmueble | Server Action | `actualizarInmueble(id, input): Promise<ActionResult>` | todos |
| Baja lógica | Server Action | `darDeBajaInmueble(id): Promise<ActionResult>` | todos |

Las tres acciones resuelven el usuario con `getUsuarioActual()` y escriben la auditoría. La validación de forma va en `inmuebleSchema` (zod, compartido cliente/servidor); las reglas que dependen de otras filas (propietario válido, oportunidades abiertas) se validan en `actions.ts`, que es donde hay acceso a la base.

## Pantallas

- `app/(dashboard)/inmuebles/page.tsx` — listado con búsqueda y filtros por URL.
- `app/(dashboard)/inmuebles/loading.tsx` — skeleton del listado.
- `app/(dashboard)/inmuebles/nuevo/page.tsx` — alta.
- `app/(dashboard)/inmuebles/[id]/page.tsx` — detalle + oportunidades asociadas.
- `app/(dashboard)/inmuebles/[id]/editar/page.tsx` — edición.

Vistas en `views/Inmuebles/`: `InmueblesList`, `InmuebleForm`, `InmuebleDetalle`, `InmueblesTableSkeleton`. Entrada nueva en el sidebar, arriba de Oportunidades (la cartera es el insumo del embudo).

## Criterios de aceptación

- [x] **CA1:** Dado un vendedor logueado, cuando crea un inmueble con propietario, dirección y tipo de operación, entonces queda guardado con `estado = DISPONIBLE`, `activo = true`, `creado_por` = su usuario, y aparece en el listado.
- [x] **CA2:** Dado un contacto que **no** está marcado como propietario, cuando se intenta asignarlo como dueño de un inmueble, entonces la acción **falla** con un mensaje explícito y no se guarda nada.
- [x] **CA3:** Dado un inmueble con 2 ambientes, cuando se cargan 3 dormitorios, entonces el sistema **rechaza** el guardado (validación en el esquema y CHECK en la base).
- [x] **CA4:** Dado un listado con inmuebles de varias localidades, cuando el usuario filtra por `tipoOperacion=VENTA` y una localidad, entonces la URL refleja los filtros y el listado trae **solo** los inmuebles que cumplen ambos.
- [x] **CA5:** Dado un inmueble con oportunidades asociadas, cuando se abre su detalle, entonces se listan esas oportunidades con contacto, responsable, funnel, etapa y estado, y cada una linkea a `/oportunidades/[id]`.
- [x] **CA6:** Dado un inmueble con al menos una oportunidad **ABIERTA**, cuando el usuario intenta darlo de baja, entonces el sistema **rechaza** la baja indicando cuántas oportunidades abiertas lo bloquean, y el inmueble sigue `activo`.
- [x] **CA7:** Dado un inmueble **sin** oportunidades abiertas, cuando el usuario confirma la baja, entonces queda `activo = false`, desaparece del listado y **no** se borra físicamente (regla 9 de [[00-general]]).
- [x] **CA8:** Dado un inmueble existente, cuando se edita su estado a `RESERVADO`, entonces el cambio persiste, se actualiza `actualizado_por`/`actualizado_en` y el chip de estado del listado y el detalle lo reflejan.
- [x] **CA9:** Dado un usuario sin sesión activa, cuando invoca cualquiera de las Server Actions del módulo, entonces recibe un error y no se escribe en la base (RLS + chequeo en la acción).
- [x] **CA10:** Dado un `id` que no existe o no es un UUID, cuando se navega a `/inmuebles/[id]`, entonces se muestra el 404 de la app (`notFound()`), no una excepción.

## Requisitos no funcionales

- El listado filtra **en la base** (no en memoria) para los filtros que viajan por URL; la búsqueda de texto libre es en cliente sobre lo ya traído, igual que en oportunidades.
- Los índices nuevos (`localidad`, `estado`, `tipo_operacion`) sostienen los filtros sin scan completo.
- La autorización real la aplica **RLS**; el chequeo de sesión en las acciones es defensa en profundidad ([[_base/acceso-y-roles]]).

## Tests sugeridos

- **Dominio (función pura):** `inmuebleSchema` — dormitorios > ambientes falla; precio/expensas/m2 negativos fallan; dirección vacía falla; campos opcionales vacíos se normalizan a `null`.
- **Server Action:** `crearInmueble` con un contacto no propietario → `{ ok: false }`; sin sesión → `{ ok: false }`; happy path → `{ ok: true, data: { id } }` y fila con auditoría.
- **Server Action:** `darDeBajaInmueble` sobre un inmueble con una oportunidad `ABIERTA` → `{ ok: false }` y la fila sigue `activo`; sin oportunidades abiertas → `{ ok: true }` y `activo = false`.
- **E2E:** login → alta de inmueble → verlo en el listado → filtrarlo por localidad → abrir el detalle → crear una oportunidad sobre él → volver al detalle y ver la oportunidad listada.

## Preguntas abiertas

- **¿Hace falta una relación N:M oportunidad ↔ inmueble?** Los funnels de Interesados tienen la etapa "Propiedades seleccionadas" (plural), lo que sugiere que a un interesado se le muestran varias propiedades. Hoy el modelo tiene una sola FK. Si el equipo lo confirma, se agrega una tabla puente `oportunidad_inmuebles` ("inmuebles de interés") **conviviendo** con `inmueble_id` (el inmueble finalmente operado). Decidido para esta entrega: **queda como está**, porque toca el módulo de oportunidades.
- **¿El inmueble debería tener responsable/captador?** Hoy la cartera es compartida y el inmueble no tiene dueño interno. Si se quisiera medir captación por vendedor, haría falta `captador_id` y una política RLS distinta.
- **¿`sucursal_id` se carga desde la UI?** La columna existe (viene del diagrama de clases) pero no hay módulo de sucursales todavía; por ahora el formulario no la expone y queda en `null`.

## Ver también

- [[00-general]] — entidades, reglas transversales y funnels.
- Módulo de oportunidades (`lib/oportunidad/`, `views/Oportunidades/`) — patrón de referencia que sigue este módulo.
