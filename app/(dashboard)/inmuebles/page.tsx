import InmueblesList from '@/views/Inmuebles/InmueblesList';
import { getInmueblesList, getLocalidades } from '@/lib/inmueble/queries';
import type { FiltroInmuebles } from '@/lib/inmueble/types';
import type { TipoOperacion } from '@/lib/enums/tipoOperacion';
import type { TipoInmueble } from '@/lib/enums/tipoInmueble';
import type { EstadoInmueble } from '@/lib/enums/estadoInmueble';

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const sp = await searchParams;
    const filtro: FiltroInmuebles = {
        tipoOperacion: sp.tipoOperacion as TipoOperacion | undefined,
        tipoInmueble: sp.tipoInmueble as TipoInmueble | undefined,
        estado: sp.estado as EstadoInmueble | undefined,
        localidad: sp.localidad,
    };
    const [rows, localidades] = await Promise.all([getInmueblesList(filtro), getLocalidades()]);
    return <InmueblesList rows={rows} filtro={filtro} localidades={localidades} />;
}
