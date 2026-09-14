# Alcance UrbanKey

## Dentro del alcance

- Inicio de sesión
- Gestión de usuarios
- Roles y permisos
- Gestión de empresas
- Gestión de contactos
- Asignación de responsables comerciales
- Gestión de productos o servicios
- Gestión de oportunidades
- Embudo comercial configurable
- Registro de actividades realizadas
- Historial comercial del cliente
- Historial de cambios de etapa
- Cierre de oportunidades ganadas o perdidas
- Registro de motivos de pérdida
- Búsqueda, filtros y paginación
- IA al final (opcional)

## Fuera del alcance

No implementar, no “dejar para después metido en el menú”, no proponer como mejora:

- Gestión de tareas
- Agenda comercial
- Recordatorios y notificaciones
- Indicadores y estadísticas (dashboards analíticos tipo plantilla)
- Exportación de información
- Integraciones con otros sistemas
- API pública para terceros
- Importación automática de información
- Facturación
- Gestión de pagos
- Contabilidad
- Gestión de stock
- Campañas de marketing
- Envío de correos desde el CRM
- Integración con WhatsApp
- Soporte para múltiples organizaciones

## Plantilla VRISTO: no es el producto

El repo incluye pantallas de la plantilla que **no** son UrbanKey. No las extiendas. No las trates como requerimiento. Si hay que tocar el cascarón, que sea para redirigir, ocultar o reemplazar hacia pantallas del CRM.

Ejemplos de leftover fuera de consigna:

- `crypto`, `finance`, analytics de plantilla
- `apps/calendar` (agenda)
- `apps/todolist`, `apps/notes`, `apps/scrumboard` (tareas)
- `apps/mailbox`, `apps/chat`
- `apps/invoice` (facturación)
- widgets / marketing / ecommerce de demo

Reutilizá layout, auth, tablas y componentes visuales. El alcance funcional lo marcan las consignas, no el menú original.

## Qué cuenta como “salirse de lo normal”

Rechazar o recortar si el prompt pide:

- Features de producto SaaS que la consigna lista como fuera
- IA antes de tener empresas, contactos, oportunidades, embudo, actividades e historial
- Agenda/tareas disfrazadas de “actividades”
- Borrado físico de clientes con historial
- Permisos solo en el frontend
- Unificar contacto y oportunidad en una sola entidad
- Cambiar UrbanKey por VRISTO u otra marca en títulos
- Especialización cosmética (solo labels/colores) si el grupo eligió industria
- Adelantar la entrega final cuando el pedido es claramente de la primera, salvo que el usuario lo pida y siga dentro del alcance

## Mínimos por entrega (atajo)

Primera (24/9): login + empresas + contactos + oportunidades + embudo persistente.

Final (12/11): todo lo de “dentro del alcance”, menos IA si el grupo no la hace.
