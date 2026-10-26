'use client';
import { useEffect, useState } from 'react';
import { cargarPanelActividades, darDeBajaActividad, registrarActividad } from '@/lib/actividad/actions';
import type { ActividadDetalle, PanelActividadesData, VinculoActividad } from '@/lib/actividad/types';
import { modalDarDeBaja, modalRegistrarActividad } from '@/lib/ui/modales';
import { showToast, toastExito } from '@/lib/ui/toast';

export function useActividades(vinculo: VinculoActividad, subtitulo: string) {
    const [datos, setDatos] = useState<PanelActividadesData | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [ocupado, setOcupado] = useState(false);

    const aplicar = (res: Awaited<ReturnType<typeof cargarPanelActividades>>) => {
        if (res.ok && res.data) {
            setDatos(res.data);
            setError(null);
        } else setError(res.ok ? 'No pudimos cargar las actividades' : res.mensaje);
    };

    const cargar = async () => aplicar(await cargarPanelActividades(vinculo));

    useEffect(() => {
        let vigente = true;
        cargarPanelActividades({ tipo: vinculo.tipo, id: vinculo.id }).then((res) => {
            if (vigente) aplicar(res);
        });
        return () => {
            vigente = false;
        };
    }, [vinculo.tipo, vinculo.id]);

    const registrar = async () => {
        if (!datos) return;
        if (datos.tipos.length === 0) {
            showToast('No hay tipos de actividad activos. Pedile a un administrador que cargue alguno.', 'error');
            return;
        }
        const nueva = await modalRegistrarActividad({ subtitulo, tipos: datos.tipos });
        if (!nueva) return;
        setOcupado(true);
        const res = await registrarActividad({ vinculo, ...nueva });
        setOcupado(false);
        if (!res.ok) {
            showToast(res.mensaje, 'error');
            return;
        }
        toastExito(res.mensaje ?? 'Actividad registrada');
        await cargar();
    };

    const darDeBaja = async (actividad: ActividadDetalle) => {
        const ok = await modalDarDeBaja(actividad.titulo, 'Deja de aparecer en el historial. Queda registrado quién la dio de baja y cuándo, y no se puede deshacer.');
        if (!ok) return;
        setOcupado(true);
        const res = await darDeBajaActividad(actividad.id);
        setOcupado(false);
        if (!res.ok) {
            showToast(res.mensaje, 'error');
            return;
        }
        toastExito(res.mensaje ?? 'Actividad dada de baja');
        await cargar();
    };

    return { datos, error, ocupado, cargar, registrar, darDeBaja };
}
