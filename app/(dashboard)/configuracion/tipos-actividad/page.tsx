import { connection } from 'next/server';
import CatalogoConfig from '@/views/Configuracion/CatalogoConfig';
import { getTiposActividadConfig } from '@/lib/configuracion/queries';
import { cambiarActivoTipoActividad, crearTipoActividad, renombrarTipoActividad } from '@/lib/configuracion/actions';

export default async function Page() {
    await connection();
    const { items, error } = await getTiposActividadConfig();
    return (
        <CatalogoConfig
            items={items}
            hayError={error}
            crear={crearTipoActividad}
            renombrar={renombrarTipoActividad}
            cambiarActivo={cambiarActivoTipoActividad}
            textos={{
                titulo: 'Tipos de actividad',
                descripcion: 'Se eligen al registrar una actividad ya realizada (visita, llamada, tasación).',
                singular: 'tipo',
                plural: 'tipos',
                botonNuevo: 'Nuevo tipo',
                etiquetaAlta: 'Nombre del nuevo tipo de actividad',
                placeholder: 'Ej.: Firma de contrato',
                duplicado: 'Ya existe un tipo con ese nombre. Elegí otro.',
                errorCarga: 'No pudimos cargar los tipos de actividad',
                vacioTitulo: 'Todavía no hay tipos de actividad',
                vacioDescripcion: 'Sin tipos activos no se pueden registrar actividades.',
                desactivarMenu: 'Deja de ofrecerse al registrar una actividad.',
                desactivarModal: 'Deja de ofrecerse al registrar una actividad. Las actividades ya cargadas conservan su tipo.',
                inactivosAyuda: 'No se ofrecen al registrar una actividad, pero se conservan en las que ya los usaron.',
                sistemaAyuda: 'Lo usan las observaciones del contacto. Se puede renombrar, pero no desactivar.',
            }}
        />
    );
}
