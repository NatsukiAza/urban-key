'use client';
import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { useDispatch } from 'react-redux';
import { setPageTitle } from '@/store/themeConfigSlice';
import { showToast } from '@/lib/ui/toast';
import { actualizarSucursal, crearSucursal } from '@/lib/sucursal/actions';
import type { Sucursal } from '@/lib/sucursal/types';

interface Props {
    sucursal?: Sucursal | null;
}

const texto = (v: string | null | undefined) => v ?? '';

const SucursalForm = ({ sucursal }: Props) => {
    const dispatch = useDispatch();
    const router = useRouter();
    const esEdicion = !!sucursal;

    useEffect(() => {
        dispatch(setPageTitle(esEdicion ? 'Editar sucursal' : 'Nueva sucursal'));
    });

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
            const destino = esEdicion ? `/sucursales/${sucursal.id}` : res.data ? `/sucursales/${res.data.id}` : '/sucursales';
            router.push(destino);
            router.refresh();
        } else {
            showToast(res.mensaje, 'error');
        }
    };

    return (
        <div className="panel max-w-xl">
            <h2 className="text-xl font-semibold mb-5">{esEdicion ? 'Editar sucursal' : 'Nueva sucursal'}</h2>
            <form onSubmit={submit} className="space-y-5">
                <div>
                    <label htmlFor="nombre">Nombre *</label>
                    <input id="nombre" value={params.nombre} onChange={change} type="text" className="form-input" placeholder="Ej: Morón Centro" />
                </div>
                <div>
                    <label htmlFor="direccion">Dirección</label>
                    <input id="direccion" value={params.direccion} onChange={change} type="text" className="form-input" placeholder="Ej: Av. Rivadavia 17000" />
                </div>
                <div>
                    <label htmlFor="telefono">Teléfono</label>
                    <input id="telefono" value={params.telefono} onChange={change} type="text" className="form-input" placeholder="Ej: 11 5555-5555" />
                </div>
                {esEdicion && (
                    <label className="inline-flex items-center gap-2 cursor-pointer">
                        <input id="activo" type="checkbox" className="form-checkbox" checked={params.activo} onChange={change} />
                        <span>Sucursal activa</span>
                    </label>
                )}
                <div className="flex justify-end gap-4">
                    <button type="button" className="btn btn-outline-danger" onClick={() => router.push(esEdicion ? `/sucursales/${sucursal.id}` : '/sucursales')}>
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
