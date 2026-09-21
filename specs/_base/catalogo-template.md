# Spec base: Catálogo de componentes del template

> Spec **transversal / de referencia**. Inventario de lo que ya trae el template **VRISTO** en el repo: gráficos, tablas, tableros, formularios y pantallas. No es una feature.
> Estado: `vigente`

## Propósito

El template llegó con muchas pantallas de demo que **no son del dominio de UrbanKey**. Se sacaron del sidebar (que hoy solo lista **Oportunidades**) pero **no se borraron**: quedan como **banco de componentes**.

Este catálogo existe para que, cuando se pida "un gráfico", "una tabla", "un tablero" o "un form", **se consuma de acá** en vez de escribir UI nueva desde cero. Es la aplicación concreta de la regla de [[ui-y-feedback]]: *reutilizar componentes del template antes de crear UI nueva*.

## Cómo se usa este catálogo

1. Buscar en las tablas de abajo el bloque que más se parezca a lo pedido.
2. **Copiar el bloque** (markup + opciones) al módulo de dominio que corresponda, siguiendo el árbol de [[arquitectura-y-modulos]] (`views/{Entidad}/...`).
3. Reemplazar los **datos hardcodeados** de la demo por datos reales que llegan **por props** desde el `page.tsx` (Server Component) → [[acceso-y-datos]].
4. Traducir labels al dominio (español) y pintar estados con la `config` del enum → [[modelado-y-tipos]].

## Reglas (hacer / no hacer)

- **Hacer:** copiar el bloque a `views/{Entidad}/`; recibir datos por props; usar el `type`/`height` del original como punto de partida; mantener las clases de tema (`dark:`) tal como vienen.
- **No hacer:** importar una view de demo (`views/Index.tsx`, `views/Analytics.tsx`, …) dentro de un módulo de dominio; **editar** las views de demo para adaptarlas (son referencia, se copia desde ellas); **volver a agregar** las pantallas de demo al sidebar; dejar los datos mock de la demo en pantalla.

## Gráficos (ApexCharts)

Motor: `react-apexcharts` + `apexcharts`, siempre cargado con `dynamic(..., { ssr: false })` (son client-only). Patrón: un objeto `{ series, options }` y `<ReactApexChart series={...} options={...} type="..." height={...} />`.

| Qué necesito | De dónde se copia | Tipo | Notas |
| --- | --- | --- | --- |
| Serie temporal con área (evolución mensual) | `views/Index.tsx` → `revenueChart` | `area` | 2 series, gradiente, `height 325`. Base para "oportunidades por mes". |
| Distribución / proporciones | `views/Index.tsx` → `salesByCategory` | `donut` | 3 segmentos + leyenda. Base para "oportunidades por funnel / por estado". |
| Comparación por categoría | `views/Index.tsx` → `dailySales` | `bar` | Apilado, horizontal, `height 160`. |
| Total con área de fondo | `views/Index.tsx` → `totalOrders` | `area` | KPI grande + mini serie, `height 290`. |
| Sparkline en tarjeta de KPI | `views/Analytics.tsx` → `totalVisit`, `paidVisit` | `line` | `height 58`, sin ejes. Para tarjetas de métrica. |
| Barras agrupadas con leyenda | `views/Analytics.tsx` → `uniqueVisitorSeries` | `bar` | 2 series por mes, `height 360`. Base para "ganadas vs perdidas". |
| Área al pie de una tarjeta | `views/Analytics.tsx` → `followers`, `referral`, `engagement` | `area` | `height 160`, absolute bottom. |
| Mini tendencia en fila de tabla | `views/Finance.tsx` → `bitcoin`, `ethereum`, … | `line` | `height 45`. Seis variantes de color. |
| Tendencia con signo (sube/baja) | `views/Crypto.tsx` → `profiteChartOption` / `lossChartOption` | `line` | Mismo chart, opciones según el signo. |
| Serie grande con eje de fechas | `views/Crypto.tsx` → `selectedBitCoinChart` | `line` | Eje `datetime`, tooltip de moneda, `height 411`. |

> Los colores de las demos son los del template. Al copiar, alinear con la paleta del proyecto y con la `config` del enum cuando el gráfico corta por un estado del dominio.

## Tablas, listados y bloques de dashboard

| Qué necesito | De dónde se copia | Notas |
| --- | --- | --- |
| Tabla con orden / paginación / selección | `views/Apps/Invoice/List.tsx` | Usa **mantine-datatable**. Referencia principal para listados → [[ui-y-feedback]]. |
| Tabla simple (sin datatable) | `views/Index.tsx` → "Recent Orders", "Top Selling Product" | HTML + clases del template. |
| Lista de actividad / timeline | `views/Index.tsx` → "Recent Activities"; `views/Analytics.tsx` → "Activity Log" | Base para el **historial de actividades** de una oportunidad. |
| Tarjetas de KPI (Income / Profit / Expenses) | `views/Index.tsx` → "Summary" | Ícono + label + valor + variación. |
| Barras de progreso por categoría | `views/Analytics.tsx` → "Visitors by Browser" | Label + porcentaje + barra. |
| Lista de transacciones | `views/Index.tsx` → "Transactions" | Fila con avatar, texto y monto. |
| Grilla de contactos (cards) | `views/Apps/Contacts.tsx` | Alterna vista **grid** y **lista**, con modal de alta/edición. |

## Tableros, calendario y flujos

| Qué necesito | De dónde se copia | Notas |
| --- | --- | --- |
| Kanban (columnas + drag & drop) | `views/Apps/Scrumboard.tsx` | `react-sortablejs`. Es el origen del tablero de etapas → `views/Oportunidades/OportunidadBoard.tsx`. |
| Calendario de eventos | `views/Apps/Calendar.tsx` | FullCalendar (`dayGrid`/`timeGrid`/`interaction`) + modal de evento. |
| Lista de tareas con filtros | `views/Apps/Todolist.tsx` | Sidebar de filtros + lista + modal. |
| Notas en tarjetas | `views/Apps/Notes.tsx` | Cards con menú de acciones. |
| Bandeja de mensajes | `views/Apps/Mailbox.tsx` | Listado + panel de lectura. |
| Chat / conversación | `views/Apps/Chat.tsx` | Lista de contactos + hilo de mensajes. |

## Formularios y documentos

| Qué necesito | De dónde se copia | Notas |
| --- | --- | --- |
| Form de alta/edición con secciones e ítems dinámicos | `views/Apps/Invoice/Add.tsx`, `Edit.tsx` | Filas que se agregan/quitan, totales calculados. |
| Documento imprimible / vista previa | `views/Apps/Invoice/Preview.tsx` | Layout de impresión. Base para una ficha de inmueble u oportunidad. |
| Form de perfil / datos personales | `views/Users/Profile.tsx` | Campos + avatar. |
| Form de configuración con tabs | `views/Users/AccountSetting.tsx` | Tabs y secciones de settings. |
| Pantallas de auth (login, registro, recupero, lock) | `views/Authentication/*` | Dos estilos: `*Boxed` y `*Cover`. Son **maquetas**: la auth real va por Supabase → [[acceso-y-roles]]. |

## UI compartida (no es demo: se usa tal cual)

| Componente | Archivo | Para qué |
| --- | --- | --- |
| Layout de la app | `components/Layouts/DefaultLayout.tsx` | Sidebar + header + footer. |
| Sidebar | `components/Layouts/Sidebar.tsx` | **Solo módulos propios.** Hoy: Oportunidades. |
| Header | `components/Layouts/Header.tsx` | Búsqueda, tema, idioma, notificaciones, menú de usuario. Contiene además el **menú horizontal** del template (visible solo en layout `horizontal`), que todavía lista las pantallas de demo. |
| Layout sin chrome | `components/Layouts/BlankLayout.tsx` | Para pantallas de auth. |
| Dropdown | `components/Dropdown.tsx` | Menú desplegable (Popper). |
| Panel de theming | `components/Layouts/Setting.tsx` | Tema, dirección RTL/LTR, tipo de layout. |
| Error / 404 | `components/Error.tsx`, `app/not-found.tsx` | Estados de error. |

## Rutas de demo que siguen vivas (fuera del sidebar)

Se acceden solo por URL directa. Si alguna deja de servir como referencia, se borra en un PR aparte.

`/` (dashboard Sales) · `/analytics` · `/finance` · `/crypto` · `/apps/chat` · `/apps/mailbox` · `/apps/todolist` · `/apps/notes` · `/apps/scrumboard` · `/apps/contacts` · `/apps/invoice/{list,preview,add,edit}` · `/apps/calendar` · `/users/{profile,user-account-settings}` · `/auth/*`

> **Pendiente:** `/` sigue renderizando el dashboard de demo (`views/Index.tsx`) y el logo del sidebar apunta ahí. Cuando exista el dashboard de UrbanKey, reemplaza a esa home.

## Cuándo aplica

- Cuando se pide un gráfico, tabla, tablero, calendario, form o pantalla nueva: **primero se busca acá**.
- Antes de agregar una dependencia de UI: es probable que ya esté en el template.

## Ver también

- [[ui-y-feedback]] — reglas de la capa visual (skeletons, feedback, badges).
- [[arquitectura-y-modulos]] — dónde ubicar el componente copiado.
- [[acceso-y-datos]] — de dónde salen los datos que reemplazan al mock.
- Dominio: [[00-general]].
