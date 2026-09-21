# 00 · General — UrbanKey

> **Índice y contrato de dominio** del proyecto. Todo lo transversal (roles, entidades, reglas de negocio, glosario) vive acá o en las specs base. Las specs de feature **no re-explican** esto: lo referencian.
> Estado: `vigente`

## Qué es UrbanKey

CRM **especializado para inmobiliarias** de venta y alquiler de casas y departamentos **residenciales** en GBA Oeste. Centraliza propietarios, interesados, inmuebles y oportunidades comerciales, y conserva el historial de cada negociación.

La especialización es real (no solo cosmética): cambia el modelo de datos, el vocabulario y el proceso comercial respecto de un CRM genérico.

## Decisiones de especialización

Cambios deliberados respecto del CRM genérico de la consigna, para reflejar el negocio real:

- **Se elimina la entidad "Empresa".** UrbanKey es un CRM residencial B2C: el cliente es siempre una **persona** (propietario/interesado). Se reemplaza la entidad "Empresa" del modelo genérico por el **rol dual del Contacto** (propietario e/o interesado), reflejando el proceso real de una inmobiliaria de venta/alquiler a particulares. Los casos aislados de una empresa (p. ej. una firma que alquila para un empleado) se modelan como Contacto con una observación; una empresa como garante es un **garante**, no el cliente de la oportunidad.
- **Inmueble** es entidad propia (no un "producto/servicio" genérico) por ser el eje del negocio.
- **Cuatro funnels** en vez de un embudo único, por los dos lados del mercado (captación vs. demanda) y las dos operaciones (venta vs. alquiler). Ver más abajo.

## Specs base (lo transversal)

Set **único fullstack** (monolito Next.js + Supabase). Una feature declara de cuáles hereda:

- Arquitectura y estructura de módulo → [[_base/arquitectura-y-modulos]]
- Acceso a datos (Supabase, Server Actions, RSC) → [[_base/acceso-y-datos]]
- Acceso y roles (Auth + RLS) → [[_base/acceso-y-roles]]
- Modelado y tipos → [[_base/modelado-y-tipos]]
- Estado → [[_base/estado]]
- Formularios y validación → [[_base/formularios-y-validacion]]
- UI y feedback → [[_base/ui-y-feedback]]
- Catálogo de componentes del template → [[_base/catalogo-template]]
- Criterios de aceptación → [[_base/criterios-de-aceptacion]]
- Testing → [[_base/testing]]

## Roles del sistema

Definidos como enum en la app (ver [[_base/acceso-y-roles]] para el mecanismo).

| Rol | Clave | Qué hace (resumen) |
| --- | --- | --- |
| Administrador | `ADMINISTRADOR` | Gestiona usuarios y su rol; configura embudos/etapas, tipos de actividad, orígenes y motivos de pérdida; ve todo; asigna/reasigna contactos y oportunidades. |
| Vendedor | `VENDEDOR` | Registra propietarios/interesados e inmuebles; ve lo que le está asignado; crea y actualiza oportunidades; cambia etapas; registra actividades; marca ganada/perdida. |
| Responsable comercial | `RESPONSABLE_COMERCIAL` | Ve la información de todo el equipo; supervisa oportunidades abiertas y embudos; consulta historial; asigna/reasigna oportunidades; revisa ganadas/perdidas. |

## Entidades del dominio

> Decisión de especialización: UrbanKey es **residencial** → el cliente es una **persona**, no una empresa. **No existe entidad "Empresa".** La persona se modela como **Contacto** que cumple uno o ambos roles: **propietario** (ofrece un inmueble) e **interesado** (busca comprar/alquilar). Ver [[_base/modelado-y-tipos]].

| Entidad | Representa |
| --- | --- |
| **Usuario** | Persona que ingresa al sistema y opera según su rol. Autenticado por Supabase Auth. |
| **Contacto** | Persona con relación comercial. Puede ser propietario y/o interesado. |
| **Inmueble** | Propiedad residencial (casa/departamento) en venta o alquiler. Pertenece a un contacto propietario. |
| **Oportunidad** | Negociación concreta. Liga contacto + (inmueble) + responsable + funnel + etapa actual + estado. |
| **Producto/Servicio** | Tipo de operación que ofrece la inmobiliaria (venta, alquiler, tasación). Precargable. |
| **Actividad** | Interacción comercial **ya ocurrida** (llamada, visita, mensaje, etc.). No es una tarea futura. |
| **Etapa** | Paso del proceso comercial dentro de un funnel. |
| **Historial de etapa** | Registro independiente de cada cambio de etapa de una oportunidad. |
| **Motivo de pérdida** | Razón por la que una oportunidad no se concretó. |
| **Origen** | Medio por el que llegó un contacto/oportunidad. |

### Los cuatro funnels

Cada oportunidad pertenece a **un** funnel, y cada funnel tiene su propia secuencia de etapas:

| Funnel | Actor | Ejemplo de etapas |
| --- | --- | --- |
| **Captación Venta** | Propietario que quiere vender | Consulta → Tasación → Publicación → Negociación → Reserva → Operación concretada / perdida |
| **Captación Alquiler** | Propietario que quiere alquilar | Consulta → Relevamiento → Publicación → Negociación → Reserva → Contrato firmado / perdida |
| **Interesados Compra** | Interesado que quiere comprar | Consulta recibida → Necesidad relevada → Propiedades seleccionadas → Visita realizada → Negociación → Reserva → Operación concretada / perdida |
| **Interesados Alquiler** | Interesado que quiere alquilar | Consulta recibida → Necesidad relevada → Propiedades seleccionadas → Visita realizada → Negociación → Contrato firmado / perdida |

> Las etapas son **ejemplos configurables** (Administrador). El detalle de etapas por funnel se fija en la feature de embudo/oportunidades.

### Estados de una oportunidad

`ABIERTA` · `GANADA` · `PERDIDA`. La etapa actual debe ser **compatible** con el estado y el funnel.

## Reglas de dominio transversales

Toda feature las cumple; no se re-justifican en cada spec.

1. Toda oportunidad tiene un **responsable**.
2. Toda oportunidad se asocia, como mínimo, a un **contacto** (y a un **inmueble** cuando el funnel lo requiere).
3. Toda oportunidad tiene **una** etapa actual, compatible con su **estado** y su **funnel**.
4. Una oportunidad **abierta** solo puede estar en una etapa abierta (no ganada/perdida).
5. Una oportunidad **ganada** registra **fecha real de cierre** (y valor final, si aplica).
6. Una oportunidad **perdida** registra **fecha real de cierre** + **motivo de pérdida**.
7. Cada **cambio de etapa** se conserva como **registro independiente** en el historial (no se pisa la etapa anterior).
8. Cada **actividad** registra **usuario** y **fecha/hora**, y se relaciona con contacto, inmueble u oportunidad.
9. **Baja lógica**: los registros con historial comercial **no se eliminan físicamente**; se cambia su **estado**.
10. Una oportunidad **cerrada** (ganada/perdida) **no se modifica sin autorización**; si se modifica, queda registrado quién y cuándo.
11. Los **permisos se validan en el servidor** (RLS + Server Actions), no solo en el front → [[_base/acceso-y-roles]].
12. Las **contraseñas** se manejan con mecanismo seguro (Supabase Auth); la app nunca las almacena en claro.
13. Los **cambios importantes** permiten identificar al usuario que los realizó (auditoría).

## Glosario

- **Funnel / embudo**: secuencia ordenada de etapas de un proceso comercial.
- **Captación**: proceso para incorporar un inmueble a la cartera (lado propietario).
- **Interesado**: persona que busca comprar o alquilar (lado demanda).
- **Baja lógica / soft delete**: marcar como inactivo en vez de borrar.

## Ver también

- Plantilla de feature: [[_template/spec]].
- Todas las specs base listadas arriba.
