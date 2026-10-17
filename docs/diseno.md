# UrbanKey — Guía de diseño (UI)

> Fuente de verdad para cualquier cambio visual. Si algo de acá choca con lo que ya está en el código, gana esta guía.
> Referencia visual: canvas "UrbanKey — Rediseño Oportunidades" (Kanban claro/oscuro, Detalle, Estados). Los mockups son **referencia**: reescribilos con clases de VRISTO + Tailwind, no copies sus estilos inline.

Stack: Next.js 16 · Tailwind 3 · VRISTO (`panel`, `btn`, `badge`, `form-*`) · mantine-datatable · react-sortablejs · SweetAlert2 · Nunito. Interfaz en español rioplatense (vos, tenés, soltá).

---

## 1. Tokens

### 1.1 Agregar a `tailwind.config.cjs`

Dentro de `theme.extend.colors`, sin tocar los colores existentes de VRISTO:

```js
uk: {
  // superficies
  page: '#F7F5F9',          'page-dark': '#0E1726',
  card: '#FFFFFF',          'card-dark': '#161D31',
  col: '#F0ECF3',           'col-dark': '#131B2D',
  'card-raised-dark': '#1C2439',
  line: '#E7E2EC',          'line-dark': '#2A3350',
  field: '#DCD5E2',         'field-dark': '#2A3350',
  // texto
  ink: '#1B1424',           'ink-dark': '#EEF0F7',
  muted: '#5C5F77',         'muted-dark': '#A3A8C3',
  'link-dark': '#D7B8DE',   // reemplaza a primary como texto en dark
  money: '#7A5A2E',         'money-dark': '#D8AC71',
  // estados (como TEXTO; los de VRISTO quedan para fondos/puntos)
  won: '#047A3F',           'won-dark': '#34D27B',
  lost: '#C42B35',          'lost-dark': '#FF8A92',
  warn: '#8A4B00',          'warn-bg': '#FFF1DC',
  'warn-dark': '#FFD08A',
  // navegación
  sidebar: '#3A1A40',       'sidebar-dark': '#1A0F20',
  'sidebar-text': '#E9DDEC','sidebar-sub': '#CDB8D3',
},
```

### 1.2 Contrastes verificados (WCAG AA, texto normal ≥ 4.5:1)

| Uso | Claro | Oscuro |
|---|---|---|
| Texto principal | `uk-ink` sobre blanco · 17:1 | `uk-ink-dark` sobre `#161D31` · 14:1 |
| Texto secundario | `uk-muted` · 6.25:1 | `uk-muted-dark` · 7.1:1 |
| Links / títulos clickeables | `primary #502558` · 12:1 | `uk-link-dark` · 9.4:1 |
| Montos | `uk-money` · 6.3:1 | `uk-money-dark` · 8.0:1 |
| Ganada (texto) | `uk-won` · 5.4:1 | `uk-won-dark` · 8.5:1 |
| Perdida (texto) | `uk-lost` · 5.6:1 | `uk-lost-dark` · 7.4:1 |
| Texto sobre sidebar | blanco sobre `uk-sidebar` · 15:1 | blanco sobre `uk-sidebar-dark` |
| Botón primario | blanco sobre `primary` · 12:1 | `#2A1A00` sobre `gold` · 8:1 |

### 1.3 Prohibido

- ❌ `text-primary` **sin** `dark:text-uk-link-dark` (en dark da 1.5:1, ilegible).
- ❌ `text-white-dark` / `#888ea8` para texto (3.2:1). Usar `text-uk-muted dark:text-uk-muted-dark`.
- ❌ `text-gold` / `#D8AC71` como texto sobre fondo claro (2.1:1). En claro, montos = `text-uk-money`.
- ❌ `text-gold-dark` / `#7a5a2e` sobre fondo oscuro (2.85:1).
- ❌ `text-success` / `text-danger` de VRISTO como texto (3.0:1 y 3.7:1). Usar `uk-won` / `uk-lost`.
- ❌ `info` (azul) en cualquier estado de oportunidad. No es color de marca.
- ❌ Bordes izquierdos de color en tarjetas como único detalle visual.
- ❌ Botones dorados en modo claro. En oscuro, **solo** el CTA principal es dorado.
- ❌ Inputs/selects sin variante `dark:` (ej. el "10" de paginación blanco en dark).

### 1.4 Regla del color de marca

- **Violeta** = marca e interacción (CTA en claro, links, pestaña activa, ítem activo).
- **Dorado** = dinero y acento (montos, borde de la tarjeta que se arrastra, CTA en dark, indicador del ítem activo en el menú).
- **Verde / rojo** = solo cierre (Ganada / Perdida) y acciones destructivas.

---

## 2. Tipografía (Nunito)

Cargar pesos 400, 600, 700, 800. Números siempre con `tabular-nums` en montos, contadores y fechas en tablas.

| Rol | Clases |
|---|---|
| Título de página (h1) | `text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark` |
| Subtítulo de página | `text-sm text-uk-muted dark:text-uk-muted-dark` |
| Título de panel (h2) | `text-lg font-extrabold` |
| Título de sub-panel | `text-base font-extrabold` |
| Cuerpo | `text-sm` |
| Label / dt | `text-xs font-bold text-uk-muted dark:text-uk-muted-dark` |
| Caption / meta | `text-xs text-uk-muted dark:text-uk-muted-dark` |
| Overline de sección | `text-[11px] font-extrabold uppercase tracking-wider text-uk-muted` |
| Monto destacado | `text-2xl font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark` |
| Monto en tarjeta/tabla | `text-sm font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark` |

---

## 3. Espaciado, radios, sombras

- Escala: múltiplos de 4. Gaps habituales: 8 (dentro de tarjeta), 12 (entre columnas/filtros), 20 (entre paneles), 24 (padding de panel).
- Padding de página: `px-8 pt-7 pb-8` (mobile: `px-4`).
- Radios: campos y botones `rounded-[10px]`; tarjetas `rounded-[10px]`; paneles y columnas `rounded-xl` (12) / `rounded-[14px]`; modales `rounded-2xl`.
- Sombras: tarjeta `shadow-[0_1px_2px_rgba(30,15,40,.06)]`; tarjeta arrastrada `shadow-[0_6px_18px_rgba(80,37,88,.14)]`; CTA `shadow-[0_4px_12px_rgba(80,37,88,.25)]` (solo claro).
- Zonas táctiles: mínimo **44×44** (botones de ícono, handle de arrastre, ítems del menú).
- Altura de controles: botones y campos `h-10`/`h-[42px]`; filtros `h-[38px]`.

---

## 4. Layout global

### 4.1 Sidebar
- Fondo `bg-uk-sidebar dark:bg-uk-sidebar-dark` en **ambos** modos. La ilustración del skyline va al pie, `opacity-15`, `pointer-events-none`, nunca detrás de los ítems.
- Ítem: `h-11 px-3 rounded-[10px] text-sm font-semibold text-uk-sidebar-text flex items-center gap-3`.
- Ítem activo: `bg-white/10 text-white font-bold` + ícono en `text-gold`. Agregar `aria-current="page"`.
- Subítem: `h-9 pl-[42px] text-[13px] text-uk-sidebar-sub`; activo con punto dorado de 6 px a la izquierda y `text-white font-bold`.
- **Bug a corregir:** el activo se calcula con el pathname actual (`usePathname()`), por prefijo de ruta. Hoy Contactos marca Inmuebles y Motivos de pérdida marca Sucursales.
- "Sucursales" → "Sucursal" para vendedor/responsable (ven solo la suya).

### 4.2 Topbar
- `h-[60px] px-8 bg-white dark:bg-[#121B2E] border-b border-uk-line dark:border-[#232C45]`.
- Izquierda: breadcrumb `Sección / Subsección / Registro` (`text-[13px]`, último en `font-bold text-uk-ink`). En detalle, reemplaza al botón "Volver".
- Derecha: toggle de tema (40×40, `aria-label="Cambiar a modo oscuro|claro"`) y avatar.

### 4.3 Encabezado de página
- Fila con `flex flex-wrap items-end justify-between gap-4`: h1 + subtítulo a la izquierda; acciones a la derecha.
- Un solo CTA primario por pantalla. Texto con verbo + objeto: "Nueva oportunidad", "Nuevo contacto", "Nueva etapa".
- Lista/Tablero: switch segmentado (`Lista | Tablero`) en lugar de dos botones sueltos.

### 4.4 Mobile
- Sidebar colapsa a drawer.
- Filtros: búsqueda visible + botón "Filtros (n)" que abre un panel.
- Tablas: contenedor con `overflow-x-auto`; columna de título fija.
- Kanban: columnas de 85vw con scroll-snap; la zona de cierre pasa a una barra inferior fija mientras se arrastra.

---

## 5. Componentes

### 5.1 Botones (VRISTO)

| Tipo | Uso | Clases |
|---|---|---|
| Primario | 1 por pantalla | `btn btn-primary` (claro violeta; dark override abajo) |
| Secundario | Editar, Cancelar, Limpiar filtros | `btn btn-outline-primary` con `dark:border-uk-field-dark dark:text-uk-ink-dark` |
| Éxito | Marcar ganada | `btn border border-[#9FD9B9] text-uk-won bg-white dark:bg-transparent dark:text-uk-won-dark` |
| Peligro | Marcar perdida, Dar de baja | outline: `border-[#F0B7BB] text-uk-lost`; sólido solo en el botón de confirmación del modal: `bg-uk-lost text-white` |
| Ícono | Editar, menú ⋯ | 40×40, siempre con `aria-label` y `title` |

Override de dark (en el CSS global):
```css
.dark .btn-primary { @apply bg-gold border-gold text-[#2A1A00] shadow-none; }
.dark .btn-outline-primary { @apply border-uk-field-dark text-uk-ink-dark hover:bg-white/5; }
```
Los demás botones outline en dark **no** son dorados.

### 5.2 Badges de estado de oportunidad

| Estado | Claro | Oscuro |
|---|---|---|
| Abierta | `bg-primary-light text-primary` + punto violeta | `bg-white/10 text-uk-link-dark` |
| Ganada | `bg-[#E6F6EE] text-uk-won` | `bg-success/10 text-uk-won-dark` |
| Perdida | `bg-[#FDECEE] text-uk-lost` | `bg-danger/10 text-uk-lost-dark` |

Forma: `inline-flex items-center gap-1.5 h-6 px-2.5 rounded-full text-xs font-extrabold`. Siempre texto + color (nunca solo color).

### 5.2b Chips de categoría
Potencial, Operado, ARS, USD, Vendedor, Departamento, Casa, Venta, Alquiler y similares son **neutros**. El color queda reservado para los estados de 5.2. No usar `badge-outline-dark` de VRISTO (en dark da 1,75:1).
- Clases: `inline-flex items-center gap-1 h-6 px-2 rounded-md text-xs font-bold bg-uk-col text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark`.
- Si lleva ícono (casa, edificio), va en el mismo color.
- Venta y Alquiler se distinguen por el texto y la posición: van siempre primero y en `font-extrabold`.

### 5.3 Pestañas (funnels)
Mismo componente en Kanban y en Configuración de embudos. Los 4 funnels son fijos: **nunca** un `select`.
- Contenedor: `role="tablist"`, `border-b border-uk-line`.
- Pestaña: `h-11 px-3.5 text-sm font-bold border-b-[3px] border-transparent text-uk-muted`.
- Activa: `aria-selected="true" border-primary text-primary font-extrabold` (dark: `border-gold text-white`).
- Contador al lado: píldora `min-w-[22px] h-5 rounded-full text-[11px] font-extrabold` (activa: `bg-primary text-white`; dark activa `bg-gold text-[#2A1A00]`).

### 5.4 Campos
- `form-input` / `form-select` + `h-[38px]` o `h-[42px]`, `rounded-[9px]`, `border-uk-field dark:border-uk-field-dark dark:bg-uk-card-dark dark:text-uk-ink-dark`.
- Label arriba, siempre visible (no usar placeholder como label). "Opcional" en `text-xs text-uk-muted` al lado del label; no poner asteriscos.
- Error: borde `border-uk-lost` + mensaje debajo `text-xs font-bold text-uk-lost` que diga qué hacer ("Elegí un motivo para poder cerrarla.").
- Montos: input con prefijo de moneda (`USD`/`ARS` en `bg-gold-light text-uk-money font-extrabold`).

### 5.5 Formato de datos (helpers compartidos)
- Moneda: `USD 210.000` / `ARS 420.000` (código + espacio + miles con punto, sin decimales). Nunca `$` solo: es ambiguo entre ARS y USD.
- Sin valor: `— Sin valor` en `text-uk-muted`.
- Teléfono: normalizar al mostrar → `11 5555-1006`. Sin dato: `—`.
- Fechas: `dd/mm/aaaa`; relativas en meta ("hace 12 días", "en 44 días").
- Plurales reales: `1 abierta` / `3 abiertas`. Nunca `abierta(s)`.
- Distribución de inmueble: `3 amb.` y agregar `· 1 dorm.` solo si existe. Nunca "sin definir dorm.".

---

## 6. Pantallas

### 6.1 Tablero Kanban `/oportunidades/tablero`
- Encabezado: h1 "Tablero de oportunidades" + subtítulo "Arrastrá una tarjeta para cambiar de etapa. Soltala en **Ganada** o **Perdida** para cerrarla." · switch Lista|Tablero · CTA "Nueva oportunidad".
- Pestañas de funnel (5.3) + a la derecha: búsqueda ("Buscar título o contacto") y select "Responsable: Todos / Solo mías" (solo admin y responsable comercial).
- Área de columnas: `overflow-x-auto`, `role="region" aria-label="Etapas del funnel X" tabindex="0"`.
- **Columna** (`w-[248px] shrink-0 rounded-xl bg-uk-col dark:bg-uk-col-dark dark:border dark:border-[#1E2740]`):
  - Header: nombre `text-sm font-extrabold` + contador en píldora blanca; debajo, suma de valores de la columna (`text-xs text-uk-muted`), o "Sin valor estimado".
  - Vacía: caja `h-[120px] border-[1.5px] border-dashed border-[#CFC4D6] rounded-[10px]` con "Soltá una tarjeta acá".
  - Etapa desactivada con oportunidades: `opacity-60` + etiqueta "Desactivada" en el header; no acepta drops.
- **Tarjeta** (`bg-white dark:bg-uk-card-raised-dark border border-uk-line dark:border-uk-line-dark rounded-[10px] p-3 flex flex-col gap-2`):
  1. Título (link al detalle) `text-sm font-extrabold text-uk-ink` + etiqueta opcional a la derecha:
     - "Vence dd/mm" en `bg-uk-warn-bg text-uk-warn` si la fecha estimada de cierre pasó o faltan ≤ 3 días.
     - "N d en etapa" en `bg-uk-col text-uk-muted`.
  2. Contacto (ícono persona) e inmueble (ícono casa) en `text-xs text-uk-muted`. Sin inmueble: "Sin inmueble asociado" en itálica.
  3. Divisor `border-t border-uk-col`, y fila: monto (5.5) a la izquierda, avatar 26 px del responsable a la derecha (`bg-primary-light text-primary text-[10px] font-extrabold`, `title` con el nombre completo).
  - Arrastrando (`ghostClass`/`chosenClass` de sortablejs): `border-gold shadow-[0_6px_18px_rgba(80,37,88,.14)]`.
- **Zona de cierre fija**: después de las columnas abiertas, `sticky right-0 w-[216px] bg-uk-page dark:bg-uk-page-dark border-l pl-3`, overline "Cerrar" y dos drop targets que ocupan la altura:
  - Ganada: `border-[1.5px] border-dashed border-[#6CC79A] bg-[#EEF9F3]`, título con el nombre de la etapa de cierre ganada (ej. "Operación concretada"), texto "Soltá acá para cerrar como ganada.", pie "N cerradas · Ver" (link a la lista filtrada).
  - Perdida: `border-[#EC8D93] bg-[#FDF1F2]`, "Soltá acá y elegí el motivo.", pie "N perdidas · Ver".
  - Las tarjetas cerradas **no** se muestran como columnas.
- Al soltar en cierre → modal (6.5). Al soltar en otra etapa → mover y mostrar toast con "Deshacer" (7.1).

### 6.2 Lista `/oportunidades`
- Filtros visibles: búsqueda, Funnel, Estado. "Más filtros (n)" abre Responsable, Etapa y Origen. **Etapa se habilita solo con un funnel elegido** y lista solo sus etapas.
- Debajo de los filtros: chips de filtros activos (`Funnel: Captación Venta ✕`) + "Limpiar filtros".
- Columnas: Título · Interesado · Inmueble · Responsable · Funnel / Etapa (dos líneas: etapa en `font-bold`, funnel en `text-xs text-uk-muted`) · Estado · Valor (alineado a la derecha) · Acciones.
- Título: `text-primary dark:text-uk-link-dark font-bold no-underline hover:underline`.
- Orden: mostrar el ícono solo en la columna ordenada y al hacer hover sobre los headers ordenables.
- **Acciones**: ancho fijo (`w-[168px]`):
  - `btn btn-outline-primary btn-sm` "Avanzar →" con `title="Avanzar a Reserva"` (no el nombre completo en el botón).
  - Menú `⋯` (`aria-label="Más acciones"`) con: Ver detalle, Editar, Reasignar, separador, Dar de baja (rojo).
  - Si está cerrada: sin "Avanzar"; solo `⋯`.
- Fila clickeable completa → detalle (`rowClassName` con `cursor-pointer hover:bg-uk-page`), sin que el click en acciones dispare la navegación.
- Paginación: selector de cantidad con estilo de `form-select` en ambos modos.

### 6.3 Detalle `/oportunidades/[id]`
Orden vertical: breadcrumb → hero → dos columnas.
- **Hero** (`panel p-6 rounded-[14px] flex flex-col gap-6`):
  - Fila 1: h1 (`text-[28px] font-extrabold`) + badge de estado; meta debajo: "Funnel · Origen: X · Creada el dd/mm/aaaa por Nombre". A la derecha: botón ícono Editar, "Marcar perdida", "Marcar ganada", CTA "Avanzar a {siguiente etapa} →".
  - Fila 2: **barra de etapas** (`<ol>` en grid de N columnas + bloque "Cierre"). Completadas: `bg-[#EDE3EF] text-primary` con ✓; actual: `bg-primary text-white` + "hace N días", `aria-current="step"`; futuras: borde punteado. Cada etapa es un `button` que abre la confirmación con nota opcional. Texto de ayuda: "Tocá una etapa para mover la oportunidad. Podés dejar una nota que queda en el historial."
  - Fila 3: `<dl>` de 4 columnas separadas por `border-l`: Valor estimado (monto destacado) · Responsable (avatar + nombre + link "Reasignar") · Cierre estimado ("30/11/2026 · en 44 días"; si venció, en `text-uk-lost`) · Interesado (link).
- **Se elimina** el panel "Cambiar etapa" (select + Aplicar) y el botón "Volver".
- Columna principal: **Historial de etapas** como timeline (punto + línea): "Etapa A → **Etapa B**", meta "dd/mm/aaaa · hh:mm · Usuario", nota en caja `bg-uk-page rounded-lg p-3`. Sin nota: "· *sin nota*" en la meta. Último ítem: "Creada en Etapa". Contador "N movimientos".
- Columna lateral (`flex-[1_1_320px]`): panel **Contacto** (avatar 40, nombre link, rol, teléfono `tel:` y email `mailto:`) y panel **Datos** (grilla de 2: Inmueble con línea "Venta · Casa · 120 m²", Funnel, Moneda, Origen, Creada, Observaciones a ancho completo; link "Editar" en el header). Si está cerrada: agregar Fecha real de cierre, Valor final o Motivo.
- Cerrada: ocultar CTA y barra clickeable; mostrar banner arriba del hero: "Cerrada como ganada el dd/mm/aaaa · USD X" (verde) o "Perdida el dd/mm/aaaa · Motivo: X" (rojo).

### 6.4 Formulario (alta / edición)
- Dos columnas en desktop (`grid md:grid-cols-2 gap-x-6 gap-y-5`), una en mobile.
- Agrupar con subtítulos: **Básico** (Título, Funnel, Etapa, Origen) · **Personas** (Contacto, Responsable) · **Inmueble y valor** (Inmueble, Moneda + Valor estimado en un solo campo con prefijo, Fecha estimada de cierre) · **Observaciones** (ancho completo).
- Precargado desde contacto/inmueble: banner arriba "Creando desde el contacto **Pablo Molina**" y campo bloqueado con link "Cambiar".
- Botonera abajo a la derecha: "Cancelar" (secundario) + "Crear oportunidad" / "Guardar cambios" (primario). En mobile, sticky al pie.
- Errores inline por campo (5.4); al enviar con errores, scroll y foco al primero.

### 6.5 Modales de cierre (SweetAlert2)
Usar un `Swal.mixin` común con `customClass` (no reemplazar SweetAlert2):
```js
const ukModal = Swal.mixin({
  customClass: {
    popup: 'rounded-2xl p-6 dark:bg-uk-card-dark dark:text-uk-ink-dark',
    title: 'text-lg font-extrabold text-left',
    htmlContainer: 'text-left',
    actions: 'justify-end gap-2 w-full',
    confirmButton: 'btn', // + color según caso
    cancelButton: 'btn btn-outline-primary',
  },
  buttonsStyling: false,
  reverseButtons: true,   // Cancelar a la izquierda
  showCancelButton: true,
  cancelButtonText: 'Cancelar',
  focusCancel: true,
});
```
- Encabezado: ícono en círculo de 40 px (✓ verde / ✕ rojo) + título + subtítulo "Título · Contacto".
- **Ganada**: título "¡Operación concretada!"; Valor final (prefijo de moneda, **precargado con el estimado**, con la ayuda "Estimado: USD X" debajo) · Fecha de cierre (hoy) · Observación (opcional). Botón "Confirmar cierre" verde (`bg-uk-won text-white`).
- **Perdida**: título "Cerrar como perdida"; Motivo (select obligatorio, solo motivos activos, placeholder "Elegí un motivo") · Fecha · Observación (opcional, placeholder "Ej.: compró con otra inmobiliaria"). Botón "Cerrar como perdida" rojo.
- Validación con `preConfirm` mostrando el error **debajo del campo** (no `Swal.showValidationMessage` genérico arriba).
- Texto al pie: "Si cancelás, la tarjeta vuelve a {etapa}." Y efectivamente revertir el drop.
- **Dar de baja**: "¿Dar de baja **{título}**? Deja de aparecer en el tablero y la lista. El historial se conserva." · Botón "Dar de baja".

**Modales y avisos en modo oscuro**
- Modal: `dark:bg-uk-card-dark dark:border dark:border-uk-line-dark`.
- Campos dentro del modal: `dark:bg-uk-page-dark dark:border-uk-field-dark dark:text-uk-ink-dark`.
- Error en un campo: `dark:border-uk-lost-dark` y el mensaje en `dark:text-uk-lost-dark`.
- Ícono del encabezado: círculo en `bg-danger/15 text-uk-lost-dark` o `bg-success/15 text-uk-won-dark`.
- Botones de confirmar: iguales en los dos modos (`bg-uk-won` / `bg-uk-lost` con texto blanco).
- Botón Cancelar: `dark:bg-transparent dark:border-uk-line-dark dark:text-uk-ink-dark`.
- Prefijo de moneda: `dark:bg-gold/10 dark:text-uk-money-dark`.
- Aviso de éxito: `dark:bg-[#2A3350]`, con "Deshacer" en dorado.
- Aviso de error: `dark:bg-uk-card-dark dark:border-uk-lost-dark/45`.

### 6.6 Configuración de embudos `/configuracion/embudos`
- Pestañas de funnel (5.3), no botones.
- Panel "Etapas abiertas" + ayuda "Arrastrá para cambiar el orden en que aparecen en el tablero.".
- Fila: handle (área 44×44, `aria-label="Reordenar {etapa}"`, también con teclado ↑/↓) · posición · nombre **editable inline** (clic → input, Enter guarda, Esc cancela) · "N abiertas" (`text-xs text-uk-muted`) · menú `⋯` con Renombrar y Desactivar.
- Desactivar → confirmación: "¿Desactivar {etapa}? Ya no va a aparecer en el tablero. Las N oportunidades abiertas en esta etapa se mantienen." (si N > 0, decir qué pasa con ellas según la lógica actual).
- Panel "Etapas de cierre": sin handle ni Desactivar; badge Ganada/Perdida (5.2) + renombrar inline.
- Etapas desactivadas: grupo colapsable "Desactivadas (n)" al final, con "Activar".

### 6.7 Motivos de pérdida `/configuracion/motivos-perdida`
- Mismo patrón de fila que 6.6 (renombrar inline + `⋯`).
- Inactivos en grupo colapsable "Inactivos (n)" con acción "Activar"; no mezclar con los activos usando solo opacidad.
- Subtítulo corto: "Se ofrecen al cerrar una oportunidad como perdida." (lo de los inactivos va como ayuda dentro del grupo).

### 6.8 Otras (mismo sistema)
- **Sucursal** (vendedor): ficha en `panel` en lugar de una tabla de una fila (nombre, dirección, teléfono formateado, estado).
- **Contactos / Inmuebles**: aplicar 1.3, 5.5 y el patrón de acciones de 6.2. Nombres de contacto en `text-uk-ink` (no violeta) con hover; la fila entera es clickeable.

---

## 7. Feedback y estados

### 7.1 Toasts
```js
const ukToast = Swal.mixin({
  toast: true, position: 'bottom-end', timer: 6000, timerProgressBar: true,
  showConfirmButton: false, customClass: { popup: 'rounded-xl' },
});
```
- Éxito (fondo `uk-ink`, texto blanco, ✓ `uk-won-dark`): "“{título}” pasó a **{etapa}**." + botón **Deshacer** (`text-gold font-extrabold`), que revierte el movimiento.
- Error (fondo blanco, borde `#F0B7BB`): título "No pudimos mover la tarjeta" + "Volvió a {etapa}. Revisá tu conexión." + "Reintentar".
- Mover de etapa **no** pide confirmación; se compensa con Deshacer. Cerrar y dar de baja **sí** piden.

### 7.2 Estados por pantalla
| Estado | Patrón |
|---|---|
| Cargando | Skeletons con la forma real (columnas con 2 tarjetas fantasma; filas de tabla), `aria-busy="true"`. Nunca spinner a pantalla completa. |
| Vacío sin datos | Ícono en círculo `bg-primary-light` 56 px + título + 1 línea + CTA. Ej. Kanban: "Todavía no hay oportunidades en este funnel" · "Nueva oportunidad". |
| Vacío por filtros | "Ninguna oportunidad coincide" · "Tenés N filtros activos: …" · "Limpiar filtros". |
| Error de carga | Ícono rojo + "No pudimos cargar las oportunidades" · "Puede ser un problema de conexión. Tus datos no se perdieron." · "Reintentar". `role="alert"`. |

---

## 8. Accesibilidad (checklist por PR)
- [ ] Todo texto ≥ 4.5:1 en claro **y** oscuro (usar los tokens de 1.1).
- [ ] Botones de ícono con `aria-label` + `title`.
- [ ] Estados comunicados con texto, no solo color.
- [ ] `aria-current` en menú, breadcrumb y etapa actual.
- [ ] Foco visible: `focus-visible:ring-2 ring-primary/40 dark:ring-gold/50`.
- [ ] Drag & drop con alternativa: cambiar etapa también desde el detalle (barra de etapas) y desde la lista ("Avanzar").
- [ ] Zonas táctiles ≥ 44×44.
- [ ] Revisado en mobile (375 px).

## 9. Definition of done de cada cambio visual
1. Usa tokens `uk-*` / clases VRISTO; nada de hex sueltos nuevos.
2. Tiene variante `dark:` en cada color de fondo, texto y borde.
3. Copy en rioplatense, verbos concretos, sin "(s)".
4. Estados de carga, vacío y error contemplados.
5. Pasa la checklist de la sección 8.
6. No cambia funcionalidad ni agrega nada fuera de alcance (métricas, gráficos, agenda, recordatorios, chat, IA).
