# Consignas UrbanKey

Resumen operativo de los PDF en `public/assets/docs`. Si este archivo y un PDF discrepan, gana el PDF.

## Identidad

- Materia: Gestión Aplicada al Desarrollo de Software II
- Universidad Nacional de La Matanza — Ingeniería en Informática
- Producto: **UrbanKey**
- Problema: pymes que gestionan clientes en planillas, mails, WhatsApp y notas; información dispersa, sin historial, dependencia del vendedor, negociaciones opacas, oportunidades abandonadas

## Tipo de CRM

Elegir **antes** del diseño:

- **Genérico:** configurable (etapas, tipos de actividad, orígenes, motivos de pérdida, productos/servicios, estados).
- **Especializado:** industria concreta con modelo y proceso propios (no solo nombres/colores). Ejemplos de la consigna: seguros, inmobiliarias, educación, salud, turismo, concesionarias, servicios profesionales.

UrbanKey es el nombre del sistema. La especialización, si existe, tiene que verse en entidades, etapas y reglas.

## Usuarios mínimos

**Administrador:** crea/modifica usuarios; asigna roles; configura etapas, tipos de actividad, motivos de pérdida y orígenes; ve todo; asigna y reasigna contactos y oportunidades.

**Vendedor:** registra empresas y contactos; consulta clientes asignados; crea, actualiza y cambia de etapa oportunidades; registra actividades; consulta historial; marca ganadas o perdidas.

**Responsable comercial:** ve al equipo; supervisa abiertas; ve el embudo; consulta historial; asigna/reasigna; revisa ganadas y perdidas.

## Objetivos funcionales

1. Centralizar empresas, contactos, oportunidades y actividades en una sola base.
2. Organizar negociaciones con oportunidades y etapas definidas.
3. Conservar historial cronológico de actividades y cambios.

## Entidades

| Entidad | Qué es | Notas |
|---|---|---|
| Usuario | Persona que entra al sistema según rol | Identidad, autenticación, estado, permisos |
| Empresa | Organización con relación comercial real o potencial | Varios contactos; varias oportunidades |
| Contacto | Persona con relación comercial | Puede tener empresa o ser cliente individual |
| Producto o servicio | Lo que se ofrece | Puede aparecer en varias oportunidades |
| Oportunidad | Posibilidad concreta de venta/contratación | Cliente, producto, responsable, estado de la negociación |
| Etapa comercial | Paso del proceso de venta | Orden definido por el grupo |
| Historial de etapas | Cada cambio de etapa | Registro independiente: origen, destino, cuándo, quién |
| Actividad | Interacción que **ya ocurrió** | Llamada, reunión, mensaje, propuesta, demo, nota |
| Motivo de pérdida | Por qué no se concretó | Precio, presupuesto, competidor, etc. |
| Origen comercial | De dónde llegó | Web, redes, publicidad, recomendación, evento, etc. |

## Reglas de negocio

- Toda oportunidad tiene responsable.
- Toda oportunidad está asociada al menos a una empresa o un contacto.
- Toda oportunidad tiene etapa actual.
- Abierta → etapa abierta. Ganada → fecha de cierre y valor final si hay montos. Perdida → fecha de cierre y motivo.
- Cada cambio de etapa se conserva en el historial.
- Cada actividad registra usuario y fecha.
- La actividad se relaciona con empresa, contacto u oportunidad.
- No eliminar físicamente registros con historial comercial.
- El vendedor solo ve lo que su rol permite.
- Permisos validados en backend, no solo frontend.
- Contraseñas con mecanismo seguro.
- Oportunidad cerrada no se modifica sin autorización.
- Los cambios importantes identifican al usuario que los hizo.

## Casos de uso mínimos

- Iniciar sesión
- Crear y modificar usuario
- Crear y modificar empresa; consultar detalle
- Crear y modificar contacto; consultar detalle
- Crear oportunidad; asignarla a un vendedor; modificarla; cambiarla de etapa
- Registrar actividad; consultar historial comercial
- Marcar oportunidad ganada; marcarla perdida
- Consultar embudo comercial
- Buscar y filtrar empresas, contactos y oportunidades
- Usar la funcionalidad de IA (opcional)

## Pantallas mínimas

- Inicio de sesión
- Pantalla principal
- Gestión de usuarios
- Listado / alta-edición / detalle de empresa
- Listado / alta-edición / detalle de contacto
- Listado de productos o servicios
- Listado / alta-edición / detalle de oportunidad
- Tablero de oportunidades por etapa
- Registro de actividad
- Historial comercial
- Configuración de etapas, tipos de actividad, orígenes y motivos de pérdida
- UI de IA (opcional)

## Módulo 1 — Empresas y contactos

Empresa, datos mínimos: razón social o nombre comercial; CUIT si corresponde; industria o actividad; email; teléfono; dirección; sitio web si corresponde; estado; responsable comercial; origen; observaciones.

Contacto, datos mínimos: nombre; apellido; documento si corresponde; cargo; email; teléfono; empresa relacionada si corresponde; responsable comercial; estado; origen; observaciones.

Relaciones: empresa con varios contactos; contacto sin empresa si es cliente individual; empresa o contacto con varias oportunidades.

Estados mínimos: Potencial, Cliente, Inactivo, No contactar.

Baja lógica: al dejar de usarse, cambiar estado; no borrar, para conservar oportunidades y actividades.

Contacto ≠ oportunidad.

## Módulo 2 — Oportunidades

Datos mínimos: título; empresa o contacto; responsable; producto o servicio; valor estimado si corresponde; etapa actual; probabilidad de cierre (opcional del grupo); fecha estimada de cierre; fecha real de cierre; origen; estado; observaciones; motivo de pérdida si corresponde.

Estados: Abierta, Ganada, Perdida.

Vistas: lista, detalle, tablero agrupado por etapa. Filtros por responsable, etapa, estado y origen. Cambio de etapa desde detalle o tablero.

Reglas de etapa:

- Una sola etapa actual
- Etapa compatible con el estado
- Abierta no puede estar en etapa ganada/perdida
- Ganada: fecha real de cierre
- Perdida: fecha real de cierre + motivo
- Cada cambio va al historial
- Cerrada no vuelve a abierta sin autorización
- Si se modifica una cerrada, el cambio queda registrado

Embudo genérico de ejemplo: Nuevo contacto → Contactado → Necesidad relevada → Propuesta enviada → Negociación → Ganada / Perdida.

Embudo inmobiliaria de ejemplo: Consulta recibida → Necesidad relevada → Propiedades seleccionadas → Visita realizada → Negociación → Reserva → Operación concretada / Operación perdida.

## Módulo 3 — Actividades e historial

No gestionar acciones futuras, agendas, tareas ni recordatorios.

Tipos mínimos: llamada, correo, mensaje, reunión presencial, reunión virtual, demostración, envío de propuesta, nota interna, otro configurable.

Datos mínimos: tipo; fecha y hora; usuario que la registró; empresa o contacto; oportunidad si corresponde; descripción; resultado.

Mostrar cronológicamente en detalle de contacto, empresa y oportunidad.

Historial de etapas: oportunidad, etapa anterior, nueva etapa, fecha y hora, usuario, observación si corresponde. Debe responder: etapa inicial, recorrido, cuándo cambió, quién, cuándo y cómo cerró.

## Entregas

### Primera — 24/9

Objetivo: versión funcional para registrar clientes y gestionar oportunidades básicas.

Sí:

- Login funcional y al menos un usuario (roles completos no obligatorios)
- CRUD empresas y contactos, listados, detalles, relación contacto–empresa (datos indispensables alcanzan)
- Productos/servicios pueden ir precargados
- CRUD oportunidades: empresa o contacto, responsable, producto/servicio, listado y detalle
- Embudo por etapa, cambio de etapa persistido (etapas pueden ir precargadas)

Demo: login → empresa y contacto → oportunidad → verla en el embudo → cambiar etapa → que persista.

No para esta entrega: roles/permisos completos, actividades e historial, historial de etapas, configuraciones, cierre completo, IA.

### Final — 12/11

CRM completo según consigna general, incluida adaptación real al tipo elegido. IA opcional y solo después de lo principal. No se exige documentación extra ni arquitectura impuesta; se evalúa funcionamiento integral y cumplimiento.

## IA (extra opcional)

Solo después de completar y probar lo principal.

Debe: resolver una necesidad real del CRM; usar datos del sistema; integrarse a un flujo existente; ser útil para un usuario; justificar por qué necesita IA; dejar que el usuario revise el resultado.
