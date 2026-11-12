'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { actualizarSucursal, crearSucursal } from '@/lib/sucursal/actions';
import type { Sucursal } from '@/lib/sucursal/types';
import { Campo, claseInput } from '@/components/ui/FormPartes';

interface Props {
    sucursal?: Sucursal | null;
    onCerrar?: () => void;
}

const texto = (v: string | null | undefined) => v ?? '';

const SucursalForm = ({ sucursal, onCerrar }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!sucursal;

    useEffect(() => {
        if (!onCerrar) dispatch(setPageTitle(esEdicion ? 'Editar sucursal' : 'Nueva sucursal'));
    }, [dispatch, esEdicion, onCerrar]);

    const [params, setParams] = useState({
        nombre: texto(sucursal?.nombre),
        direccion: texto(sucursal?.direccion),
        telefono: texto(sucursal?.telefono),
        activo: sucursal?.activo ?? true,
    });
    const [guardando, setGuardando] = useState(false);

    const change = (e: React.ChangeEvent<HTMLInputElement>) => {
        const { id, value, type, checked } = e.target;
        setParams((p) => ({ ...p, [id]: type === 'checkbox' ? checked : value }));
    };

    const submit = async (e: React.FormEvent) => {
        e.preventDefault();
        setGuardando(true);
        const res = esEdicion ? await actualizarSucursal(sucursal.id, params) : await crearSucursal(params);
        setGuardando(false);
        if (res.ok) {
            showToast(res.mensaje ?? 'Guardado');
            if (onCerrar) onCerrar();
            else router.push(esEdicion ? `/sucursales/${sucursal.id}` : res.data ? `/sucursales/${res.data.id}` : '/sucursales');
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    return (
        <div className={onCerrar ? '' : 'panel max-w-xl'}>
            {!onCerrar && <h2 className="mb-5 text-xl font-extrabold text-uk-ink dark:text-uk-ink-dark">{esEdicion ? 'Editar sucursal' : 'Nueva sucursal'}</h2>}
            <form onSubmit={submit} className="space-y-5">
                <Campo id="nombre" etiqueta="Nombre" obligatorio>
                    <input id="nombre" value={params.nombre} onChange={change} type="text" className={claseInput} placeholder="Ej: Morón Centro" />
                </Campo>
                <Campo id="direccion" etiqueta="Dirección">
                    <input id="direccion" value={params.direccion} onChange={change} type="text" className={claseInput} placeholder="Ej: Av. Rivadavia 17000" />
                </Campo>
                <Campo id="telefono" etiqueta="Teléfono">
                    <input id="telefono" value={params.telefono} onChange={change} type="text" className={claseInput} placeholder="Ej: 11 5555-5555" />
                </Campo>
                {esEdicion && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input id="activo" type="checkbox" className="form-checkbox" checked={params.activo} onChange={change} />
                        <span>Sucursal activa</span>
                    </label>
                )}
                <div className="flex justify-end gap-4">
                    <button type="button" className="btn btn-cancel" disabled={guardando} onClick={() => onCerrar ? onCerrar() : router.push(esEdicion ? `/sucursales/${sucursal.id}` : '/sucursales')}>
                        Cancelar
                    </button>
                    <button type="submit" className="btn btn-primary" disabled={guardando}>
                        {guardando ? 'Guardando…' : esEdicion ? 'Guardar cambios' : 'Crear sucursal'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default SucursalForm;
