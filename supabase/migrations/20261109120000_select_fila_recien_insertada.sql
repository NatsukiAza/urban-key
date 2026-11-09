-- insert ... returning también evalúa la policy de SELECT sobre la fila nueva.
-- ve_contacto(id) y ve_inmueble(id) la buscan en la tabla y, dentro del mismo
-- statement, todavía no la ven: un vendedor no podía crear contactos ni inmuebles.
-- Se chequean primero columnas de la propia fila, que no dependen de buscarla.

drop policy if exists contactos_select on public.contactos;
create policy contactos_select on public.contactos
    for select to authenticated
    using (
        public.es_usuario_activo()
        and (responsable_id = (select auth.uid()) or public.ve_contacto(id))
    );

drop policy if exists inmuebles_select on public.inmuebles;
create policy inmuebles_select on public.inmuebles
    for select to authenticated
    using (
        public.es_usuario_activo()
        and (public.ve_contacto(contacto_id) or public.ve_inmueble(id))
    );
