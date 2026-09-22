# Spec base: Criterios de aceptación

> Spec **transversal / de referencia**. Documenta **cómo se escriben** los criterios de aceptación de una feature para que sean verificables. No es una feature.
> Estado: `vigente`

## Propósito

Que cada feature diga, en términos comprobables, qué significa "está listo". Sin ambigüedad y mapeable a pruebas → [[testing]].

## Decisiones / Convenciones estables

### Formato Dado / Cuando / Entonces

Cada criterio es una condición observable:

- [ ] **CA1:** Dado \<estado inicial\>, cuando \<acción del usuario\>, entonces \<resultado esperable y persistido\>.

Ejemplos (dominio UrbanKey):

- [ ] **CA1:** Dado un vendedor logueado, cuando crea una oportunidad con contacto, responsable y etapa inicial, entonces queda guardada con estado `ABIERTA` y aparece en el embudo de su funnel.
- [ ] **CA2:** Dado una oportunidad `ABIERTA`, cuando el usuario la mueve a una etapa de otro funnel, entonces el sistema **rechaza** el cambio (la etapa debe ser del mismo funnel) → [[00-general]].
- [ ] **CA3:** Dado una oportunidad que se marca como **perdida** sin motivo de pérdida, cuando se confirma, entonces el sistema **exige** motivo y fecha de cierre antes de guardar.
- [ ] **CA4:** Dado un cambio de etapa exitoso, cuando se guarda, entonces se crea un registro en `historial_etapas` con etapa anterior, nueva, usuario y fecha.

### Qué hace bueno a un criterio

- **Verificable**: se puede ejecutar y decir sí/no. Evitar "debe ser intuitivo".
- **Atómico**: un criterio, una condición.
- **Incluye la persistencia**: si el dato debe quedar guardado o revalidado, decirlo (regla clave de la consigna).
- **Cubre el rol**: si depende del rol, nombrarlo → [[acceso-y-roles]].
- **Cubre el camino de error**: no solo el happy path (permiso denegado, validación fallida, regla de dominio violada).

### Relación con las reglas transversales

Los criterios **no** re-derivan las reglas de [[00-general]]; las **aplican**. Si una regla transversal es relevante para la feature, el criterio la verifica en el contexto concreto.

## Reglas (hacer / no hacer)

- **Hacer:** Dado/Cuando/Entonces, atómicos y verificables; incluir persistencia, rol y caminos de error; mapear cada CA a un test sugerido ([[testing]]).
- **No hacer:** criterios vagos o de implementación ("usa tal componente"); mezclar varias condiciones en uno; omitir el error path.

## Cuándo aplica

- Al cerrar la sección "Criterios de aceptación" de cualquier feature.

## Ver también

- [[testing]] — cada criterio se mapea a un caso de prueba.
- [[00-general]] — reglas de dominio que los criterios aplican.
