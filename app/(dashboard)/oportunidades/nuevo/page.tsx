import OportunidadForm, { type ValoresIniciales, type PrecargaForm } from '@/views/Oportunidades/OportunidadForm';
import { getFormOptions } from '@/lib/oportunidad/queries';
import { getUsuarioActual } from '@/lib/auth/session';
import { puedeReasignar } from '@/lib/auth/permisos';
import type { FormOptions } from '@/lib/oportunidad/types';
import type { TipoFunnel } from '@/lib/enums/tipoFunnel';

// El propietario del inmueble entra por Captación; cualquier otro contacto, por Interesados.
function deducirTipoFunnel(options: FormOptions, contactoId?: string, inmuebleId?: string): TipoFunnel | null {
    const inmueble = options.inmuebles.find((i) => i.id === inmuebleId);
    if (!inmueble) return null;
    const esPropietario = !contactoId || inmueble.contactoId === contactoId;
    if (inmueble.tipoOperacion === 'VENTA') return esPropietario ? 'CAPTACION_VENTA' : 'INTERESADOS_COMPRA';
    return esPropietario ? 'CAPTACION_ALQUILER' : 'INTERESADOS_ALQUILER';
}

function armarValoresIniciales(options: FormOptions, sp: Record<string, string | undefined>, responsableId?: string): ValoresIniciales {
    const inmueble = options.inmuebles.find((i) => i.id === sp.inmuebleId);
    const contactoId = options.interesados.find((c) => c.id === (sp.contactoId ?? inmueble?.contactoId))?.id;

    const tipo = deducirTipoFunnel(options, contactoId, inmueble?.id);
    const funnelId = options.funnels.find((f) => f.id === sp.funnelId)?.id ?? options.funnels.find((f) => f.tipo === tipo)?.id;
    const primeraEtapa = options.etapas.filter((e) => e.funnelId === funnelId && e.resultado === 'ABIERTA').sort((a, b) => a.orden - b.orden)[0];

    return {
        contactoId,
        inmuebleId: inmueble?.id,
        responsableId: options.usuarios.some((u) => u.id === responsableId) ? responsableId : undefined,
        funnelId,
        etapaId: primeraEtapa?.id,
        valorEstimado: inmueble?.precio ?? undefined,
        moneda: inmueble?.moneda,
    };
}

function armarPrecarga(options: FormOptions, sp: Record<string, string | undefined>, iniciales: ValoresIniciales): PrecargaForm | undefined {
    const contacto = options.interesados.find((c) => c.id === sp.contactoId);
    const inmueble = options.inmuebles.find((i) => i.id === sp.inmuebleId);
    if (contacto) {
        return {
            origen: 'contacto',
            nombre: `${contacto.nombre} ${contacto.apellido}`,
            volverHref: `/contactos/${contacto.id}`,
            contactoFijo: true,
            inmuebleFijo: Boolean(iniciales.inmuebleId),
        };
    }
    if (inmueble) {
        return { origen: 'inmueble', nombre: inmueble.direccion, volverHref: `/inmuebles/${inmueble.id}`, contactoFijo: Boolean(iniciales.contactoId), inmuebleFijo: true };
    }
    return undefined;
}

export default async function Page({ searchParams }: { searchParams: Promise<Record<string, string | undefined>> }) {
    const [sp, options, usuario] = await Promise.all([searchParams, getFormOptions(), getUsuarioActual()]);
    const iniciales = armarValoresIniciales(options, sp, usuario?.id);
    const volverA = sp.contactoId ? `/contactos/${sp.contactoId}` : sp.inmuebleId ? `/inmuebles/${sp.inmuebleId}` : undefined;
    return (
        <OportunidadForm
            options={options}
            iniciales={iniciales}
            volverA={volverA}
            precarga={armarPrecarga(options, sp, iniciales)}
            usuarioActualId={usuario?.id}
            puedeReasignar={puedeReasignar(usuario?.rol)}
        />
    );
}
