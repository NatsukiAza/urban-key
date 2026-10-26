# Spec: Actividades e historial comercial

> El QUÉ y el POR QUÉ. Sin detalles de implementación (eso va en el código / PR).
> Estado: `borrador`

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

Dominio, roles y reglas transversales: [[00-general]].

Abajo va **solo lo propio del módulo**.

## Problema / Motivación

La tabla `actividades` existe desde la entrega 1, pero no hay forma de cargar una visita, una llamada o una tasación desde la app. El único uso son las **observaciones** del contacto, que se guardan como actividad de tipo `MENSAJE` y se mezclan con mensajes reales.

Además, la base permite **borrar y editar** actividades (políticas `actividades_update` y `actividades_delete`), lo que rompe la regla 9 de [[00-general]]: el historial comercial no se borra. Y los tipos de actividad son un enum fijo, cuando [[00-general]] → "Roles del sistema" dice que el Administrador los configura.

Sin este módulo no se puede cumplir el paso "registra visita realizada" de la demo mínima de la entrega 2, ni responder *"¿qué pasó con esta negociación, cuándo y quién lo hizo?"*.

## Objetivo

Que un usuario pueda **registrar actividades ya ocurridas** vinculadas a un contacto, un inmueble o una oportunidad, y que cualquiera con acceso pueda **reconstruir la historia comercial** de esos registros: qué pasó, cuándo, quién lo registró y a qué pertenece.

## Fuera de alcance

- **Tareas futuras, agenda, recordatorios y alertas** (fuera del incremento según el roadmap de la entrega 2).
- **Integración con WhatsApp, email o telefonía**: la actividad se carga a mano.
- **Adjuntos** en la actividad (necesita Supabase Storage).
- **Editar** una actividad ya registrada: se corrige dando de baja la incorrecta y registrando una nueva (ver RF6).
- La **pantalla** del historial unificado se define en esta spec (RF9–RF10), pero su diseño visual se resuelve con Ximena (P5), que ya armó el "Historial de etapas" en el detalle de la oportunidad.

## Actores y roles

- **Vendedor:** registra actividades sobre cualquier contacto o inmueble (la cartera es compartida) y sobre las oportunidades que tiene asignadas. Ve las actividades de la cartera y de sus oportunidades, pero **no** las de oportunidades ajenas. Da de baja solo las actividades que registró él.
- **Responsable comercial:** lo mismo que el vendedor, pero ve las actividades de todas las oportunidades. Es quien consulta el historial en la demo.
- **Administrador:** ve todo, da de baja cualquier actividad y configura los **tipos de actividad** y los **orígenes** en Configuración.

## Requisitos funcionales

### Actividades

- **RF1:** El sistema debe permitir **registrar una actividad** con tipo, título, fecha y hora en que ocurrió, y descripción opcional.
- **RF2:** Toda actividad debe vincularse con **al menos uno** de: contacto, inmueble u oportunidad (regla 8 de [[00-general]]).
- **RF3:** Si la actividad se vincula con una **oportunidad**, el sistema completa solo el contacto (y el inmueble, si la oportunidad lo tiene) de esa oportunidad. Si se indican otro contacto u otro inmueble, el sistema los rechaza por inconsistentes.
- **RF4:** El **usuario** que registra la actividad lo pone el servidor (la sesión), nunca el formulario. La **fecha** no puede ser futura: una actividad es algo que ya pasó.
- **RF5:** Solo se pueden usar **tipos de actividad activos**. Las actividades ya registradas con un tipo que después se desactivó conservan su tipo.
- **RF6:** Una actividad **no se edita ni se borra**. Solo se puede dar de **baja lógica** (`activo = false`), y queda registrado quién y cuándo la dio de baja. La baja no se revierte.
- **RF7:** Una actividad vinculada a una oportunidad solo la puede registrar quien puede ver esa oportunidad (el responsable, o responsable comercial / administrador).

### Catálogos (tipos de actividad y orígenes)

- **RF8:** El Administrador debe poder **dar de alta, renombrar y desactivar** tipos de actividad y orígenes. Los desactivados no aparecen en los formularios nuevos, pero se siguen mostrando en los registros que ya los usan. Nada se borra.
- **RF8b:** El tipo **Observación** es de sistema: lo usa la sección de observaciones del contacto, no aparece en el formulario de actividad y no se puede desactivar.

### Historial comercial

- **RF9:** El detalle de una **oportunidad** debe mostrar en una sola línea de tiempo sus actividades, sus cambios de etapa y su cierre, ordenados por fecha, con el usuario que los registró.
- **RF10:** El detalle de un **contacto** y el de un **inmueble** deben mostrar sus actividades, incluidas las registradas sobre sus oportunidades, con un link a la oportunidad de origen.
- **RF11:** Las actividades dadas de baja no se muestran por defecto, pero el Administrador y el Responsable comercial pueden verlas, marcadas como dadas de baja.

## Datos y modelo

> Migración aditiva `20261025120000_actividades_entrega2.sql`. Las tablas `actividades` y `origenes` ya existen (`20260921172723_esquema_inicial.sql`).

### Tabla nueva `tipos_actividad`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `id` | uuid | PK |
| `nombre` | text | Único. |
| `clave` | text | Única, opcional. Solo la tienen los tipos de sistema (`OBSERVACION`). No se desactivan. |
| `activo` | boolean | Baja lógica. |
| `creado_en` / `actualizado_en` | timestamptz | |

Se precarga con: Llamada, Visita, Mensaje, Email, Reunión, Tasación y Observación (sistema).

### Cambios en `actividades`

| Columna | Tipo | Notas |
| --- | --- | --- |
| `tipo_id` | uuid not null | FK a `tipos_actividad`. **Reemplaza** a la columna `tipo` (enum `tipo_actividad`, que se elimina). Las filas existentes se migran por nombre; las observaciones del contacto (`MENSAJE` con título "Observación") pasan al tipo Observación. |
| `activo` | boolean | Baja lógica (RF6). |
| `dado_de_baja_por` / `dado_de_baja_en` | uuid / timestamptz | Auditoría de la baja (regla 13). |
| índice `actividades (inmueble_id)` | — | Faltaba para el historial del inmueble. |

Reglas en la base (triggers):

- Al insertar: la fecha no puede ser futura (con 5 minutos de tolerancia por diferencias de reloj), el tipo tiene que estar activo, y se completan o validan contacto e inmueble desde la oportunidad (RF3).
- Al actualizar: solo se permite pasar `activo` de `true` a `false`. El resto de las columnas quedan fijas.

### Cambios en `origenes`

- Se agrega `actualizado_en`, igual que el resto de las tablas configurables.

### Políticas RLS

| Tabla | Select | Insert | Update | Delete |
| --- | --- | --- | --- | --- |
| `actividades` | Usuario activo, y si tiene oportunidad, que la pueda ver | El propio usuario, activo, y si tiene oportunidad, que la pueda ver | Autor o admin (solo para la baja, la limita el trigger) | **Nadie** |
| `tipos_actividad` | Usuario activo | Admin | Admin | Admin (la app no lo usa: desactiva) |

## Acceso a datos (queries y Server Actions)

| Operación | Tipo | Firma | Rol |
| --- | --- | --- | --- |
| Actividades de un registro | query (RSC) | `getActividades(filtro: FiltroActividades): Promise<ActividadDetalle[]>` | Todos (RLS filtra) |
| Historial de una oportunidad | query (RSC) | `getHistorialOportunidad(id): Promise<EventoHistorial[]>` | Todos (RLS filtra) |
| Registrar actividad | Server Action | `registrarActividad(input): Promise<ActionResult<{ id: string }>>` | Todos |
| Dar de baja actividad | Server Action | `darDeBajaActividad(id): Promise<ActionResult>` | Autor o admin |
| Tipos de actividad | query (RSC) | `getTiposActividad({ incluirInactivos? }): Promise<TipoActividad[]>` | Todos |
| ABM de tipos y orígenes | Server Actions | `crearTipoActividad`, `actualizarTipoActividad`, `crearOrigen`, `actualizarOrigen` | Admin |

## Pantallas

- **Modal "Registrar actividad"**, que se abre desde el detalle de oportunidad, de contacto y de inmueble, con el vínculo precargado.
- **Sección "Actividades" / historial** en `oportunidades/[id]`, `contactos/[id]` e `inmuebles/[id]`.
- `app/(dashboard)/configuracion/tipos-actividad/page.tsx` y `app/(dashboard)/configuracion/origenes/page.tsx`, con el mismo patrón que `motivos-perdida`.

No hay mockup de actividades: se diseña siguiendo `docs/diseno.md`, a partir de `03-detalle.html` y `16-ver-inmueble.html`.

## Criterios de aceptación

- [ ] **CA1:** Dado un vendedor en el detalle de su oportunidad, cuando registra una visita con fecha de ayer, entonces la actividad aparece en el historial de la oportunidad, del contacto y del inmueble, con su nombre y la fecha cargada.
- [ ] **CA2:** Dado el formulario de actividad, cuando la fecha es futura, entonces el sistema no la guarda y muestra el error, también si la llamada llega directo a la base.
- [ ] **CA3:** Dado un vendedor, cuando intenta registrar o ver una actividad de una oportunidad que no tiene asignada, entonces la base lo rechaza o no la devuelve.
- [ ] **CA4:** Dada una actividad registrada, cuando cualquier usuario intenta editarla o borrarla (desde la app o directo contra Supabase), entonces la base lo rechaza. Solo se permite la baja lógica, por el autor o un admin.
- [ ] **CA5:** Dada una actividad dada de baja, entonces no aparece en el historial por defecto, y el responsable comercial la ve marcada con quién y cuándo la dio de baja.
- [ ] **CA6:** Dado el admin en Configuración, cuando desactiva el tipo "Tasación", entonces deja de aparecer en el formulario y las tasaciones ya cargadas siguen mostrando su tipo.
- [ ] **CA7:** Dado un usuario que no es admin, cuando intenta crear o modificar un tipo de actividad u origen, entonces la base lo rechaza.
- [ ] **CA8:** Dado el responsable comercial en una oportunidad cerrada, cuando abre el detalle, entonces ve en una sola línea de tiempo las actividades, los cambios de etapa y el cierre, cada uno con su fecha y usuario.
- [ ] **CA9:** Dadas las observaciones existentes de un contacto, después de la migración siguen apareciendo igual en su detalle.

## Tests sugeridos

- Dominio: el esquema zod rechaza fecha futura, actividad sin vínculo y tipo vacío.
- Base (SQL contra una base de prueba): fecha futura, tipo inactivo, update de cualquier columna que no sea `activo`, delete, vendedor con oportunidad ajena, contacto inconsistente con la oportunidad.
- E2E: el recorrido de la demo mínima (registrar visita → mover etapa → cerrar → responsable consulta historial).

## Preguntas abiertas

- ¿"Tipos" del roadmap se refiere a **tipos de actividad**? Esta spec asume que sí, porque [[00-general]] lista "tipos de actividad, orígenes" entre lo que configura el Administrador. Los tipos de inmueble quedan como enum fijo (casa, departamento, PH).
- ¿Se pueden registrar actividades sobre una **oportunidad cerrada** (postventa, firma de contrato)? Esta spec lo permite: la regla 10 protege los datos de la oportunidad, no impide sumarle actividades.
- ¿El **contacto** también debería tener origen (`contactos.origen_id`)? [[00-general]] dice que el origen es "por el que llegó un contacto/oportunidad", pero hoy solo lo tiene la oportunidad. Tocaría el formulario de contacto (P3).
- ¿Hace falta historial de cambios de **estado del inmueble** (disponible → reservado → operado)? Queda para el paso de historial comercial, si alcanza el tiempo.
