import 'server-only';
import { seed, type DB } from './seed';

// Store mock fijado en globalThis para que queries y Server Actions compartan la MISMA
// instancia entre requests y sobrevivan al HMR dentro de una sesión de `next dev`.
// Un `const` de módulo suelto se duplicaría por bundle y el cambio de etapa no persistiría.
// Al migrar a Supabase, se elimina lib/mock/* y se reescriben queries.ts/actions.ts.

const g = globalThis as unknown as { __urbanKeyDB?: DB };

export const db: DB = (g.__urbanKeyDB ??= seed());
