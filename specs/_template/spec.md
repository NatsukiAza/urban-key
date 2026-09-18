# Spec: <Nombre de la feature>

> El QUÉ y el POR QUÉ. Sin detalles de implementación (eso va en el código / PR).
> Estado: `borrador` | `aprobada` | `implementada`

## Hereda de (specs base)

> Esta spec **hereda** lo transversal de estas bases; **NO se re-explica acá**. Borrá las líneas que no apliquen a la feature. Quien implemente: **leé solo estas bases, no todas.**

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

Qué problema resuelve esto y para quién (vendedor / responsable comercial / administrador). Por qué importa ahora.

## Objetivo

Una o dos frases: qué debe poder hacer el sistema cuando esto esté listo.

## Fuera de alcance

Qué explícitamente NO entra en esta feature (evita que crezca sola).

## Actores y roles

Quién usa esta feature y qué puede ver/hacer cada rol. (Roles en [[00-general]]; mecanismo de autorización en [[_base/acceso-y-roles]].)

- **<Rol>:** qué hace/ve en esta feature (y qué no).

## Requisitos funcionales

- RF1: El sistema debe...
- RF2: El sistema debe...

## Datos y modelo

> Tablas/columnas propias de la feature, relaciones y políticas RLS. Ver [[_base/modelado-y-tipos]] y [[_base/acceso-y-roles]].

| Tabla / columna | Tipo | Notas (FK, enum, baja lógica, auditoría) |
| --- | --- | --- |
| `<tabla>.id` | uuid | PK |

Políticas RLS: <quién puede select/insert/update/delete>.

## Acceso a datos (queries y Server Actions)

> Lo que expone la feature. Ver [[_base/acceso-y-datos]].

| Operación | Tipo | Firma | Rol |
| --- | --- | --- | --- |
| Listar <recurso> | query (RSC) | `get<Recurso>s(filtro?): Promise<Recurso[]>` | <rol> |
| Crear <recurso> | Server Action | `crear<Recurso>(input): Promise<ActionResult>` | <rol> |

## Pantallas

> Rutas y vistas. Ver [[_base/arquitectura-y-modulos]] y [[_base/ui-y-feedback]].

- `app/(dashboard)/<recurso>/page.tsx` — listado
- `app/(dashboard)/<recurso>/[id]/page.tsx` — detalle
- ...

## Criterios de aceptación

> Formato Dado/Cuando/Entonces, verificables. Incluir persistencia, rol y caminos de error. Ver [[_base/criterios-de-aceptacion]].

- [ ] CA1: Dado ... cuando ... entonces ...
- [ ] CA2: ...

## Requisitos no funcionales

Performance, seguridad, límites, integraciones (IA, si aplica). (Borrar si no aplica.)

## Tests sugeridos

> Casos mapeados a los criterios. Ver [[_base/testing]].

- Dominio (función pura): ...
- Server Action: ...
- E2E: ...

## Preguntas abiertas

- ¿Cómo se comporta ante una **oportunidad cerrada** (ganada/perdida) que se intenta modificar? — ver [[00-general]] → "Reglas de dominio transversales". (Borrá esta línea si el flujo no toca oportunidades.)
- ¿...?
