-- Una operación concretada retira el inmueble de la cartera disponible.
-- Se ejecuta en la misma transacción que el cierre, incluso cuando el vendedor
-- puede trabajar la oportunidad pero no editar el contacto propietario.
create or replace function public.operar_inmueble_al_ganar()
returns trigger
language plpgsql
security definer
set search_path = public
as $func$
begin
    if old.estado = 'ABIERTA' and new.estado = 'GANADA'
       and new.activo and new.inmueble_id is not null then
        update public.inmuebles
        set estado = 'OPERADO', actualizado_por = coalesce(auth.uid(), new.actualizado_por)
        where id = new.inmueble_id and activo and estado <> 'OPERADO';
    end if;
    return new;
end;
$func$;

create trigger oportunidades_operar_inmueble
    after update of estado on public.oportunidades
    for each row execute function public.operar_inmueble_al_ganar();
