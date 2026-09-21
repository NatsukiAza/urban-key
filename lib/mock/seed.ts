import { uid } from './ids';
import type { Usuario, Contacto, Inmueble, Funnel, Etapa, Origen, MotivoPerdida } from '../dominio';
import type { Oportunidad, HistorialEtapa } from '../oportunidad/types';
import type { TipoFunnel } from '../enums/tipoFunnel';
import type { EstadoOportunidad } from '../enums/estadoOportunidad';

export interface DB {
    usuarios: Usuario[];
    contactos: Contacto[];
    inmuebles: Inmueble[];
    funnels: Funnel[];
    etapas: Etapa[];
    origenes: Origen[];
    motivosPerdida: MotivoPerdida[];
    oportunidades: Oportunidad[];
    historialEtapas: HistorialEtapa[];
}

const ahora = () => new Date().toISOString();

// Define las etapas de un funnel a partir de una lista ordenada.
// Cada string es "ABIERTA"; los terminales se pasan aparte.
function construirEtapas(funnelId: string, abiertas: string[], ganada: string, perdida: string): Etapa[] {
    const etapas: Etapa[] = abiertas.map((nombre, i) => ({
        id: uid(),
        funnelId,
        nombre,
        orden: i + 1,
        esFinal: false,
        resultado: 'ABIERTA' as EstadoOportunidad,
    }));
    etapas.push({ id: uid(), funnelId, nombre: ganada, orden: abiertas.length + 1, esFinal: true, resultado: 'GANADA' });
    etapas.push({ id: uid(), funnelId, nombre: perdida, orden: abiertas.length + 2, esFinal: true, resultado: 'PERDIDA' });
    return etapas;
}

export function seed(): DB {
    // Usuarios (uno por rol) — pueblan el select de responsable.
    const uAna: Usuario = { id: uid(), nombre: 'Ana', apellido: 'Giménez', email: 'ana@urbankey.com', rol: 'ADMINISTRADOR' };
    const uBruno: Usuario = { id: uid(), nombre: 'Bruno', apellido: 'López', email: 'bruno@urbankey.com', rol: 'VENDEDOR' };
    const uCarla: Usuario = { id: uid(), nombre: 'Carla', apellido: 'Ferro', email: 'carla@urbankey.com', rol: 'RESPONSABLE_COMERCIAL' };
    const usuarios = [uAna, uBruno, uCarla];

    // Contactos (propietarios e interesados).
    const cRuiz: Contacto = { id: uid(), nombre: 'Marta', apellido: 'Ruiz', email: 'marta.ruiz@mail.com', telefono: '11-5555-1001', estado: 'CLIENTE', esPropietario: true, esInteresado: false, activo: true };
    const cSosa: Contacto = { id: uid(), nombre: 'Jorge', apellido: 'Sosa', email: 'jorge.sosa@mail.com', telefono: '11-5555-1002', estado: 'POTENCIAL', esPropietario: true, esInteresado: false, activo: true };
    const cDiaz: Contacto = { id: uid(), nombre: 'Lucía', apellido: 'Díaz', email: 'lucia.diaz@mail.com', telefono: '11-5555-1003', estado: 'POTENCIAL', esPropietario: false, esInteresado: true, activo: true };
    const cMoli: Contacto = { id: uid(), nombre: 'Pablo', apellido: 'Molina', email: 'pablo.molina@mail.com', telefono: '11-5555-1004', estado: 'POTENCIAL', esPropietario: false, esInteresado: true, activo: true };
    const cVega: Contacto = { id: uid(), nombre: 'Sofía', apellido: 'Vega', email: 'sofia.vega@mail.com', telefono: '11-5555-1005', estado: 'CLIENTE', esPropietario: true, esInteresado: true, activo: true };
    const cAcu: Contacto = { id: uid(), nombre: 'Diego', apellido: 'Acuña', email: 'diego.acuna@mail.com', telefono: '11-5555-1006', estado: 'POTENCIAL', esPropietario: false, esInteresado: true, activo: true };
    const contactos = [cRuiz, cSosa, cDiaz, cMoli, cVega, cAcu];

    // Inmuebles (de propietarios).
    const iMoron: Inmueble = { id: uid(), contactoId: cRuiz.id, tipoOperacion: 'VENTA', direccion: 'Av. Rivadavia 18500, Morón', ambientes: 3, m2: 78, precio: 145000, activo: true };
    const iRamos: Inmueble = { id: uid(), contactoId: cSosa.id, tipoOperacion: 'ALQUILER', direccion: 'Bolívar 240, Ramos Mejía', ambientes: 2, m2: 55, precio: 420000, activo: true };
    const iCasti: Inmueble = { id: uid(), contactoId: cVega.id, tipoOperacion: 'VENTA', direccion: 'Güemes 1120, Castelar', ambientes: 4, m2: 120, precio: 210000, activo: true };
    const iHaedo: Inmueble = { id: uid(), contactoId: cVega.id, tipoOperacion: 'ALQUILER', direccion: 'Marconi 875, Haedo', ambientes: 1, m2: 38, precio: 310000, activo: true };
    const inmuebles = [iMoron, iRamos, iCasti, iHaedo];

    // Funnels + etapas.
    const funnelsDef: { tipo: TipoFunnel; nombre: string; abiertas: string[]; ganada: string; perdida: string }[] = [
        { tipo: 'CAPTACION_VENTA', nombre: 'Captación Venta', abiertas: ['Consulta', 'Tasación', 'Publicación', 'Negociación', 'Reserva'], ganada: 'Operación concretada', perdida: 'Perdida' },
        { tipo: 'CAPTACION_ALQUILER', nombre: 'Captación Alquiler', abiertas: ['Consulta', 'Relevamiento', 'Publicación', 'Negociación', 'Reserva'], ganada: 'Contrato firmado', perdida: 'Perdida' },
        { tipo: 'INTERESADOS_COMPRA', nombre: 'Interesados Compra', abiertas: ['Consulta recibida', 'Necesidad relevada', 'Propiedades seleccionadas', 'Visita realizada', 'Negociación', 'Reserva'], ganada: 'Operación concretada', perdida: 'Perdida' },
        { tipo: 'INTERESADOS_ALQUILER', nombre: 'Interesados Alquiler', abiertas: ['Consulta recibida', 'Necesidad relevada', 'Propiedades seleccionadas', 'Visita realizada', 'Negociación'], ganada: 'Contrato firmado', perdida: 'Perdida' },
    ];

    const funnels: Funnel[] = [];
    const etapas: Etapa[] = [];
    for (const def of funnelsDef) {
        const f: Funnel = { id: uid(), tipo: def.tipo, nombre: def.nombre };
        funnels.push(f);
        etapas.push(...construirEtapas(f.id, def.abiertas, def.ganada, def.perdida));
    }

    const etapasDe = (tipo: TipoFunnel) => {
        const f = funnels.find((x) => x.tipo === tipo)!;
        return { funnel: f, etapas: etapas.filter((e) => e.funnelId === f.id).sort((a, b) => a.orden - b.orden) };
    };

    // Orígenes y motivos de pérdida (configurables por admin → tablas, no enums).
    const origenes: Origen[] = ['Portal web', 'Referido', 'Cartel en la propiedad', 'Redes sociales', 'Llamada directa'].map((nombre) => ({ id: uid(), nombre }));
    const motivosPerdida: MotivoPerdida[] = ['Precio', 'Eligió la competencia', 'Desistió de la operación', 'Sin respuesta', 'Financiación'].map((nombre) => ({ id: uid(), nombre }));

    // Oportunidades repartidas por funnel/etapa.
    const cv = etapasDe('CAPTACION_VENTA');
    const ca = etapasDe('CAPTACION_ALQUILER');
    const ic = etapasDe('INTERESADOS_COMPRA');
    const ia = etapasDe('INTERESADOS_ALQUILER');

    const oportunidades: Oportunidad[] = [];
    const historialEtapas: HistorialEtapa[] = [];

    const nuevaOp = (data: Partial<Oportunidad> & { titulo: string; contactoId: string; responsableId: string; funnelId: string; etapaId: string; estado: EstadoOportunidad }): Oportunidad => {
        const op: Oportunidad = {
            id: uid(),
            inmuebleId: null,
            valorEstimado: null,
            origenId: origenes[0].id,
            observaciones: null,
            motivoPerdidaId: null,
            fechaCierreReal: null,
            activo: true,
            creadoEn: ahora(),
            actualizadoEn: ahora(),
            creadoPor: uBruno.id,
            actualizadoPor: uBruno.id,
            ...data,
        };
        oportunidades.push(op);
        return op;
    };

    nuevaOp({ titulo: 'Venta 3 amb. Morón', contactoId: cRuiz.id, inmuebleId: iMoron.id, responsableId: uBruno.id, funnelId: cv.funnel.id, etapaId: cv.etapas[1].id, estado: 'ABIERTA', valorEstimado: 145000, observaciones: 'Propietaria quiere tasar antes de publicar.' });
    nuevaOp({ titulo: 'Alquiler 2 amb. Ramos Mejía', contactoId: cSosa.id, inmuebleId: iRamos.id, responsableId: uBruno.id, funnelId: ca.funnel.id, etapaId: ca.etapas[2].id, estado: 'ABIERTA', valorEstimado: 420000 });
    nuevaOp({ titulo: 'Busca comprar en Castelar', contactoId: cDiaz.id, inmuebleId: iCasti.id, responsableId: uCarla.id, funnelId: ic.funnel.id, etapaId: ic.etapas[3].id, estado: 'ABIERTA', valorEstimado: 210000, observaciones: 'Visitó una propiedad, espera segunda opción.' });
    nuevaOp({ titulo: 'Busca alquilar en Haedo', contactoId: cMoli.id, inmuebleId: iHaedo.id, responsableId: uBruno.id, funnelId: ia.funnel.id, etapaId: ia.etapas[1].id, estado: 'ABIERTA', valorEstimado: 310000 });

    const ganadaEtapa = cv.etapas.find((e) => e.resultado === 'GANADA')!;
    nuevaOp({ titulo: 'Venta casa Castelar', contactoId: cVega.id, inmuebleId: iCasti.id, responsableId: uCarla.id, funnelId: cv.funnel.id, etapaId: ganadaEtapa.id, estado: 'GANADA', valorEstimado: 205000, fechaCierreReal: ahora() });

    const perdidaEtapa = ic.etapas.find((e) => e.resultado === 'PERDIDA')!;
    nuevaOp({ titulo: 'Interesado desistió', contactoId: cAcu.id, responsableId: uBruno.id, funnelId: ic.funnel.id, etapaId: perdidaEtapa.id, estado: 'PERDIDA', motivoPerdidaId: motivosPerdida[2].id, fechaCierreReal: ahora() });

    // Un par de registros de historial para que el detalle no arranque vacío.
    const op1 = oportunidades[0];
    historialEtapas.push({ id: uid(), oportunidadId: op1.id, etapaAnteriorId: cv.etapas[0].id, etapaNuevaId: op1.etapaId, usuarioId: uBruno.id, creadoEn: ahora(), observacion: 'Avanza a tasación.' });
    const opGanada = oportunidades[4];
    historialEtapas.push({ id: uid(), oportunidadId: opGanada.id, etapaAnteriorId: cv.etapas[4].id, etapaNuevaId: opGanada.etapaId, usuarioId: uCarla.id, creadoEn: ahora(), observacion: 'Operación cerrada.' });

    return { usuarios, contactos, inmuebles, funnels, etapas, origenes, motivosPerdida, oportunidades, historialEtapas };
}
