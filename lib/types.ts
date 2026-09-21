export type ActionResult<T = void> = { ok: true; mensaje?: string; data?: T } | { ok: false; error: true; mensaje: string };
