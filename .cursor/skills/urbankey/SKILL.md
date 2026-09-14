---
name: urbankey
description: >-
  Guides all UrbanKey CRM work for this university practical assignment (trabajo
  práctico UNLaM). Uses UrbanKey as the product name in every system title.
  Before implementing any user prompt, verifies it against the consignas in
  public/assets/docs so the work stays in scope. Use when coding, designing
  screens, naming titles, adding features, or when the user mentions UrbanKey,
  CRM, consignas, entregas, VRISTO, empresas, contactos, oportunidades, embudo,
  actividades, historial, roles, o trabajo práctico.
---

# UrbanKey

Sistema CRM del trabajo práctico *Gestión Aplicada al Desarrollo de Software II* (UNLaM). No es un producto comercial ni un dashboard genérico.

Antes de implementar **cualquier** pedido, leer esta skill y contrastar el prompt con las consignas. Si el pedido se sale del alcance, no implementarlo.

Detalle de la consigna: [consignas.md](consignas.md). Alcance y módulos de plantilla a ignorar: [alcance.md](alcance.md).

Fuente de verdad (si hay duda, ganan los PDF):

- `public/assets/docs/Consigna_Trabajo_Practico.pdf`
- `public/assets/docs/Definiciones-Generales.pdf`
- `public/assets/docs/Entregas-CRM.pdf`
- `public/assets/docs/Modulos_Principales.pdf`

## Chequeo obligatorio de cada prompt

Copiar y completar mentalmente antes de tocar código:

1. **¿Qué pide el usuario?** Una frase.
2. **¿Está en la consigna?** Mapear a entidad, caso de uso, pantalla o entrega. Si no mapea, está fuera.
3. **¿Es de esta entrega o de una posterior?** No adelantar módulos si la consigna de entrega los excluye, salvo que el usuario lo pida de forma explícita **y** siga dentro del alcance final.
4. **¿Es un extra de plantilla VRISTO?** Crypto, finance, calendar, mailbox, chat, todo, invoices, analytics de marketing, etc. → no ampliarlos. Ver [alcance.md](alcance.md).
5. **¿Cambia el modelo o el proceso comercial, o solo cosmética?** Si el CRM es especializado, no alcanza con renombrar.
6. **Nombre del sistema:** todo título visible del producto usa **UrbanKey**.

Si el prompt está fuera de alcance: decilo, citá la consigna (dentro / fuera), y ofrecé la alternativa que sí corresponde. No implementes “para que quede más completo”.

## Nombre del sistema: UrbanKey

Usar **UrbanKey** (una sola palabra, esa capitalización) en todo título donde vaya el nombre del sistema:

- `document.title` / `setPageTitle`: `{página} | UrbanKey`
- metadata de la app: `title: 'UrbanKey'`
- header, sidebar, login, footer, PWA/manifest
- textos de marca, copyright y “about”

No usar `VRISTO`, `Vristo`, `Urban Key`, `Urban Key CRM` como nombre de producto, ni “Multipurpose Tailwind Dashboard Template”. El producto se llama UrbanKey. “CRM” puede aparecer como descripción (`UrbanKey — CRM de gestión comercial`), no como sustituto del nombre.

## Qué es este trabajo

- CRM para centralizar clientes y seguir oportunidades comerciales.
- Usuarios mínimos: administrador, vendedor, responsable comercial.
- Objetivos: centralizar información, organizar el proceso comercial, conservar historial.
- La especialización (si la hay) debe verse en datos, etapas, reglas y vocabulario. No alcanza con colores o labels.

## Orden obligatorio de desarrollo

No saltear ni invertir, salvo corrección puntual de algo ya implementado:

1. Análisis y tipo de CRM
2. Usuarios, alcance y requerimientos
3. Pantallas y modelo de datos
4. Usuarios, roles y permisos
5. Empresas y contactos
6. Productos o servicios
7. Oportunidades y embudo
8. Actividades e historial
9. Pruebas de lo principal
10. IA (opcional, recién después)
11. Pruebas finales y presentación

Primera entrega (24/9): login, empresas, contactos, oportunidades básicas y embudo con cambio de etapa persistido. Todavía no: roles completos, actividades, historial de etapas, configuraciones, cierre, IA.

Entrega final (12/11): CRM completo según consigna. IA opcional y solo después de lo principal.

## Reglas que no se negocian

- Toda oportunidad tiene responsable, etapa actual, y al menos empresa o contacto.
- Abierta ↔ etapa abierta. Ganada: fecha de cierre (y valor final si hay montos). Perdida: fecha de cierre y motivo.
- Cada cambio de etapa se guarda como registro independiente. No pisar el historial.
- Actividades = hechos ya ocurridos (no agenda, no tareas futuras, no recordatorios).
- Baja lógica: no borrar físicamente registros con historial comercial.
- Permisos en backend, no solo en el UI. Contraseñas con hash seguro.
- Oportunidad cerrada no se modifica sin autorización; el cambio queda auditado.
- Contacto ≠ oportunidad. Separarlos en el modelo.

## Cómo implementar en este repo

El repo arrancó como plantilla VRISTO/Next. Tratarla como cascarón UI, no como alcance del TP.

- Reutilizar layout, auth views y componentes visuales cuando sirvan al CRM.
- No construir features de la plantilla que la consigna marca fuera de alcance.
- Pantallas mínimas y entidades: ver [consignas.md](consignas.md).
- Datos de empresas/contactos/oportunidades: mínimos de [alcance.md](alcance.md) módulo por módulo.

## Respuestas al usuario

- Hablar del producto como **UrbanKey**.
- Si recortás alcance, explicá por qué (consigna / entrega), sin drama ni features alternativas de relleno.
- No propongas facturación, WhatsApp, campañas, notificaciones, export, API pública ni multi-org.
