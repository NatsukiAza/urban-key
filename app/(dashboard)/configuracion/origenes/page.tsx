import { connection } from 'next/server';
import CatalogoConfig from '@/views/Configuracion/CatalogoConfig';
import { getOrigenesConfig } from '@/lib/configuracion/queries';
import { cambiarActivoOrigen, crearOrigen, renombrarOrigen } from '@/lib/configuracion/actions';

export default async function Page() {
    await connection();
    const { items, error } = await getOrigenesConfig();
    return (
        <CatalogoConfig
            items={items}
            hayError={error}
            crear={crearOrigen}
            renombrar={renombrarOrigen}
            cambiarActivo={cambiarActivoOrigen}
            textos={{
                titulo: 'Orígenes',
                descripcion: 'Por dónde llegó la consulta. Se eligen al crear una oportunidad.',
                singular: 'origen',
                plural: 'orígenes',
                botonNuevo: 'Nuevo origen',
                etiquetaAlta: 'Nombre del nuevo origen',
                placeholder: 'Ej.: Instagram',
                duplicado: 'Ya existe un origen con ese nombre. Elegí otro.',
                errorCarga: 'No pudimos cargar los orígenes',
                vacioTitulo: 'Todavía no hay orígenes',
                vacioDescripcion: 'Sin orígenes activos, las oportunidades nuevas se cargan sin origen.',
                desactivarMenu: 'Deja de ofrecerse al crear una oportunidad.',
                desactivarModal: 'Deja de ofrecerse al crear una oportunidad. Se conserva en las que ya lo usaron.',
                inactivosAyuda: 'No se ofrecen al crear una oportunidad, pero se conservan en las que ya los usaron.',
            }}
        />
    );
}
