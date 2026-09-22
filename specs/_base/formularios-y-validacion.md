# Spec base: Formularios y validación

> Spec **transversal / de referencia**. Documenta cómo se arman los **formularios** (alta/edición) y cómo se **valida** la entrada en cliente y servidor. No es una feature.
> Estado: `vigente`

## Propósito

Fijar un patrón único de formularios para ABM: mismo manejo de estado, misma validación, mismo feedback. Que crear un form nuevo sea previsible.

## Decisiones / Convenciones estables

### Librerías (recomendadas)

- **react-hook-form** para el estado del formulario (Client Component).
- **zod** para el **esquema de validación**, compartido entre cliente y servidor.

> Aún no están instaladas en el repo. Al implementar la primera feature con form, agregarlas (`react-hook-form`, `zod`, `@hookform/resolvers`). Si el equipo prefiere validación manual, mantener igual el **doble chequeo** (cliente + server) y el patrón de feedback.

### Esquema único cliente + servidor

El esquema zod de cada entidad vive junto a sus tipos (`lib/{entidad}/types.ts` o `schema.ts`) y se usa en **los dos lados**:

- **Cliente**: `zodResolver(schema)` en react-hook-form → validación inmediata y mensajes por campo.
- **Servidor**: la Server Action hace `schema.safeParse(input)` **antes** de tocar la base → la validación de cliente nunca es la única barrera → [[acceso-y-datos]].

```ts
export const inmuebleSchema = z.object({
  direccion: z.string().min(1, 'La dirección es obligatoria'),
  tipoOperacion: z.enum(['VENTA', 'ALQUILER']),
  precio: z.number().positive('El precio debe ser mayor a 0'),
  ambientes: z.number().int().min(1),
});
export type InmuebleInput = z.infer<typeof inmuebleSchema>;
```

### Form multimodal (alta / edición / detalle)

- Un componente `views/{Entidad}/{Entidad}Form.tsx` cubre **alta** y **edición**: sin `id` = alta; con `id` = edición (recibe valores por props del Server Component).
- El **detalle** de solo lectura puede ser el mismo form deshabilitado o un `{Entidad}Detalle.tsx` aparte → [[ui-y-feedback]].
- El submit invoca la **Server Action** y actúa según el `ActionResult`: éxito → toast + navegación/cierre; error → alerta con `mensaje` → [[ui-y-feedback]].

### Reglas de validación de dominio

- Campos obligatorios según [[00-general]] (ej. toda oportunidad requiere responsable, contacto y etapa).
- Validaciones dependientes del estado (ej. **perdida** exige motivo de pérdida y fecha de cierre) se validan en el esquema/acción, no solo con la UI.
- Formatos comunes (email, teléfono, CUIT si aplicara) centralizados como validadores reutilizables.

## Reglas (hacer / no hacer)

- **Hacer:** un esquema zod por entidad, usado en cliente y servidor; react-hook-form para el estado del form; validar reglas de dominio en el esquema/acción; feedback a partir del `ActionResult`.
- **No hacer:** validar solo en el cliente; duplicar el esquema; mandar a la base datos sin `safeParse`; dispersar reglas de dominio en la UI.

## Cuándo aplica

- Al crear cualquier form de alta/edición.
- Al validar datos que entran por una Server Action.

## Ver también

- [[acceso-y-datos]] — la Server Action que recibe y re-valida el input.
- [[ui-y-feedback]] — mensajes por campo, toasts y alertas.
- [[modelado-y-tipos]] — tipos/DTOs y enums que el esquema referencia.
