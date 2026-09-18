# Spec base: Modelado y tipos

> Spec **transversal / de referencia**. Documenta cómo se **modelan los datos**: tablas de Supabase, tipos TypeScript, DTOs y enums. Cómo se leen/escriben está en [[acceso-y-datos]]. No es una feature.
> Estado: `vigente`

## Propósito

Fijar las convenciones para **tipar el dominio** de punta a punta: esquema en la base, tipos generados, DTOs de entrada/salida y enums de estado. Un molde único para que cada módulo modele igual.

## Decisiones / Convenciones estables

### Base de datos (Supabase / Postgres)

- **Tablas en español, plural, snake_case**: `usuarios`, `contactos`, `inmuebles`, `oportunidades`, `actividades`, `etapas`, `funnels`, `historial_etapas`, `motivos_perdida`, `origenes`.
- **Columnas en snake_case**: `razon_social` no aplica (residencial); sí `nombre`, `apellido`, `fecha_cierre_real`, `valor_estimado`.
- **PK**: `id` (`uuid` por defecto, o `bigint identity` si la feature lo prefiere; consistente por tabla).
- **FK**: `{entidad}_id` (`contacto_id`, `inmueble_id`, `responsable_id`, `funnel_id`, `etapa_id`).
- **Auditoría**: `creado_en timestamptz default now()`, `actualizado_en`, y `creado_por`/`actualizado_por` (FK a `usuarios`) en entidades con cambios importantes → regla transversal [[00-general]].
- **Baja lógica**: columna `estado` (enum) o `activo boolean` en entidades con historial; no se borra físicamente → [[acceso-y-datos]].
- **RLS habilitado** en toda tabla del dominio → [[acceso-y-roles]].

### Tipos generados

- Los tipos de las tablas se **generan desde Supabase** a `types/database.ts` (CLI `supabase gen types typescript`). Son la fuente de verdad de las filas.
- Un módulo deriva sus tipos de fila de ahí:

```ts
// lib/inmueble/types.ts
import type { Database } from '@/types/database';

export type Inmueble = Database['public']['Tables']['inmuebles']['Row'];
export type InmuebleInput = Database['public']['Tables']['inmuebles']['Insert'];
```

### DTOs y sufijos

Para formas que no son la fila cruda (entrada de formularios, vistas compuestas):

| Sufijo | Significado | Ejemplo |
| --- | --- | --- |
| `Input` | lo que **se envía** a una Server Action (escritura) | `OportunidadInput`, `InmuebleInput` |
| `*Row` / sin sufijo | fila de lectura (tipo generado) | `Inmueble`, `Contacto` |
| `*Detalle` | vista de detalle con relaciones resueltas | `OportunidadDetalle` (con contacto, inmueble, etapa) |
| `Filtro*` | parámetros de búsqueda/filtro | `FiltroOportunidades` |

- **Composición sobre aplanado**: `OportunidadDetalle` compone `Contacto` + `Inmueble` + `Etapa` en vez de repetir campos.
- **camelCase en TS** para DTOs propios; las filas generadas quedan en snake_case (como en la base). El mapeo snake↔camel, si se hace, va en la query/action, no en la UI.
- Nada de `any` para datos del dominio.

### Enums de dominio con config visual

Los estados y categorías **siempre** se tipan con su enum, nunca con string suelto. Cada enum vive en `lib/enums/{nombre}.ts` y expone tres cosas (patrón consistente):

- el **tipo/valores** (para tipar);
- **`options`** — `{ label, value }[]` para selects;
- **`config`** — `Record<valor, { label, color, clase }>` para chips/badges → render en [[ui-y-feedback]].

Enums del dominio: `rolUsuario`, `estadoOportunidad` (`ABIERTA`/`GANADA`/`PERDIDA`), `estadoContacto` (`POTENCIAL`/`CLIENTE`/`INACTIVO`/`NO_CONTACTAR`), `tipoFunnel` (los 4), `estadoInmueble`, `tipoActividad`, `tipoOperacion` (`VENTA`/`ALQUILER`).

> Etapas, motivos de pérdida y orígenes son **configurables por el Administrador** → son **tablas**, no enums de código. Solo se hace enum lo que es fijo en el dominio.

### Modelado de referencia (dominio UrbanKey)

Relaciones clave (el detalle fino se fija en cada feature):

- `contactos` — persona; puede ser propietario y/o interesado (flags o rol).
- `inmuebles` — `contacto_id` (propietario), `tipo_operacion`, datos residenciales (ambientes, m², dirección, precio).
- `oportunidades` — `contacto_id`, `inmueble_id?`, `responsable_id`, `funnel_id`, `etapa_id`, `estado`, fechas, `valor_estimado`, `motivo_perdida_id?`.
- `historial_etapas` — `oportunidad_id`, `etapa_anterior_id`, `etapa_nueva_id`, `usuario_id`, `creado_en`, `observacion?`.
- `actividades` — `tipo`, `fecha`, `usuario_id`, y al menos uno de `contacto_id`/`inmueble_id`/`oportunidad_id`.

## Reglas (hacer / no hacer)

- **Hacer:** generar tipos de fila desde Supabase a `types/database.ts`; derivar tipos de módulo de ahí; DTOs `Input`/`Detalle`/`Filtro` para formas no crudas; tipar todo estado/categoría con su **enum** (`lib/enums`); tablas para lo configurable (etapas/motivos/orígenes); auditoría y baja lógica donde haya historial.
- **No hacer:** `any` para dominio; duplicar tipos que ya genera Supabase; enum de código para lo que el admin configura; string suelto para estados; borrado físico de registros con historial.

## Cuándo aplica

- Al crear una tabla o un tipo/DTO/enum nuevo para un módulo.

## Preguntas abiertas

- Propietario/interesado: ¿flags booleanos en `contactos`, o tabla de roles del contacto? Definir en la feature de contactos.
- ¿`id` `uuid` o `bigint`? Elegir uno y usarlo consistente en todo el esquema.

## Ver también

- [[acceso-y-datos]] — cómo se leen/escriben estos tipos.
- [[acceso-y-roles]] — RLS sobre estas tablas; tabla `usuarios`.
- [[ui-y-feedback]] — render de enums con `config` visual.
