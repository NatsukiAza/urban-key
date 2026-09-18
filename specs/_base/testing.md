# Spec base: Testing

> Spec **transversal / de referencia**. Documenta **qué se prueba y cómo** en UrbanKey. No es una feature.
> Estado: `vigente`

## Propósito

Definir una estrategia de pruebas realista para el proyecto: priorizar lo que la consigna evalúa (que el flujo funcione y persista, y que las reglas de negocio se cumplan) sin sobre-testear.

## Decisiones / Convenciones estables

### Qué priorizar

La consigna evalúa el **funcionamiento integral** y el cumplimiento de reglas. En ese orden:

1. **Reglas de dominio** ([[00-general]]): validaciones de oportunidad (etapa compatible con estado/funnel, cierre ganada/perdida, historial). Son las más valiosas de testear porque son lógica pura.
2. **Server Actions**: que validen input, respeten el rol y devuelvan el `ActionResult` correcto → [[acceso-y-datos]].
3. **Flujos E2E clave** (la "demostración esperada" de la entrega): login → registrar contacto → crear oportunidad → verla en el embudo → cambiar de etapa → confirmar que persiste.

### Herramientas (recomendadas)

- **Vitest** para unitarias (reglas de dominio, esquemas zod, helpers).
- **Playwright** para E2E de los flujos clave (opcional según tiempo del equipo).
- No están instaladas aún; agregarlas cuando el equipo escriba las primeras pruebas.

### Cómo mapear pruebas

- Cada **criterio de aceptación** de una feature ([[criterios-de-aceptacion]]) se corresponde con al menos un caso de prueba. La sección "Tests sugeridos" de la feature lista ese mapeo.
- Las reglas de dominio se prueban como **funciones puras** siempre que sea posible (extraer la validación del acceso a base para poder testearla sin Supabase).

### RLS

- La autorización real vive en RLS ([[acceso-y-roles]]). Verificar al menos manualmente, por rol, que un vendedor no accede a lo que no le corresponde. Automatizarlo es deseable pero no bloqueante para las entregas.

## Reglas (hacer / no hacer)

- **Hacer:** testear primero reglas de dominio como funciones puras; cubrir el happy path y los errores de las Server Actions; un E2E del flujo de la entrega; mapear CA → test.
- **No hacer:** perseguir cobertura por la cobertura; testear el template VRISTO; acoplar los tests de dominio a Supabase cuando se pueden aislar.

## Cuándo aplica

- Al cerrar una feature: definir sus "Tests sugeridos".
- Antes de una entrega: correr el/los E2E del flujo evaluado.

## Ver también

- [[criterios-de-aceptacion]] — de dónde salen los casos.
- [[00-general]] — reglas de dominio a cubrir.
- [[acceso-y-datos]], [[acceso-y-roles]] — Server Actions y RLS a verificar.
