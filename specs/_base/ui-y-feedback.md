# Spec base: UI y feedback

> Spec **transversal / de referencia**. Documenta la **capa visual**: template VRISTO, componentes reutilizables, estados de carga, alertas y chips de estado. No es una feature.
> Estado: `vigente`

## Propósito

Fijar cómo se ve y cómo comunica la app: qué componentes usar, cómo mostrar carga, cómo dar feedback de éxito/error y cómo pintar estados del dominio. Que la UI se sienta de un solo sistema.

## Decisiones / Convenciones estables

### Base visual

- **Tailwind** + template **VRISTO** (ya en el repo): layouts en `components/Layouts/` (`DefaultLayout`, `Sidebar`, `Header`, `Footer`).
- El inventario de bloques reutilizables del template (gráficos, tablas, kanban, forms) está en [[catalogo-template]]: **se busca ahí antes de escribir UI nueva**.
- Componentes de datos: **mantine-datatable** (ya presente) para tablas con orden/paginación/selección; **@headlessui/react** y **@tippyjs/react** para dropdowns/tooltips.
- Soporte de **tema claro/oscuro** e **i18n** (`react-i18next`, `lib/i18n.ts`) ya montados; toda UI nueva los respeta.

### Estados de carga = skeletons

- Cada listado tiene su **skeleton** (`views/{Entidad}/{Entidad}TableSkeleton.tsx`), mostrado vía `loading.tsx` del segmento o `<Suspense>`. **No** spinner global → [[acceso-y-datos]].

### Feedback de acciones

- **Toast/alerta** con **sweetalert2** (ya presente) a partir del `ActionResult` de la Server Action:
  - `ok: true` → toast de éxito con `mensaje`.
  - `ok: false` → alerta de error con `mensaje`.
- **Confirmaciones** (bajas, cierres, reasignaciones) con diálogo de sweetalert2 antes de ejecutar la acción destructiva o importante.
- Errores por campo del formulario se muestran inline junto al input → [[formularios-y-validacion]].

### Chips / badges de estado (config visual del enum)

Los estados del dominio se pintan con la `config` de su enum → [[modelado-y-tipos]]. Un componente `Badge`/`Chip` recibe el valor y usa `config[valor]` para label + color + clase.

```tsx
<EstadoBadge estado={oportunidad.estado} />   // usa estadoOportunidad.config
```

Aplica a: estado de oportunidad, estado de contacto, tipo de operación, tipo de funnel, tipo de actividad, rol de usuario.

### Gating de acciones por rol

- Botones/menús que dependen del rol se envuelven en un helper que recibe el rol actual (de `getUsuarioActual`) y los roles permitidos → **UX**, no seguridad ([[acceso-y-roles]]).

### Vistas del embudo

- El **tablero por etapas** (kanban) usa `react-sortablejs` (ya presente) para mover oportunidades entre columnas; el drop dispara la Server Action de cambio de etapa.
- Convive con la **vista de lista** y el **detalle** de oportunidad → feature de embudo.

## Reglas (hacer / no hacer)

- **Hacer:** reutilizar layouts y componentes del template antes de crear UI nueva; skeleton por listado; feedback vía sweetalert2 desde el `ActionResult`; confirmar acciones importantes; pintar estados con la `config` del enum; respetar tema e i18n.
- **No hacer:** spinner global de carga; inventar sistemas de alerta paralelos; hardcodear colores/labels de estado (van en el enum); mostrar acciones que el rol no puede usar.

## Cuándo aplica

- Al construir cualquier pantalla, tabla, form o acción con feedback.

## Ver también

- [[acceso-y-datos]] — `ActionResult` que alimenta el feedback; skeletons.
- [[formularios-y-validacion]] — errores por campo.
- [[modelado-y-tipos]] — enums con `config` visual.
- [[acceso-y-roles]] — gating de acciones por rol.
- [[catalogo-template]] — de dónde copiar gráficos, tablas y tableros.
