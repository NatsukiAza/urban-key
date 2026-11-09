import { useEffect, useState } from 'react';
import type { ReactNode } from 'react';
import { flushSync } from 'react-dom';
import { createRoot } from 'react-dom/client';
import DatePicker from '@/components/ui/DatePicker';
import Select, { type OpcionSelect } from '@/components/ui/Select';
import TimePicker from '@/components/ui/TimePicker';

export interface ControlCampo {
    valor: string;
    setInvalido?: (invalido: boolean) => void;
}

type Campo = (props: { valor: string; invalido: boolean; cambiar: (v: string) => void }) => ReactNode;

interface HostProps {
    inicial: string;
    alCambiar: (v: string) => void;
    registrar: (setInvalido: (invalido: boolean) => void) => void;
    campo: Campo;
}

const Host = ({ inicial, alCambiar, registrar, campo }: HostProps) => {
    const [valor, setValor] = useState(inicial);
    const [invalido, setInvalido] = useState(false);
    useEffect(() => registrar(setInvalido), [registrar]);
    return campo({
        valor,
        invalido,
        cambiar: (v) => {
            alCambiar(v);
            setValor(v);
            if (v) setInvalido(false);
        },
    });
};

// Monta un campo de React dentro del HTML de un modal de SweetAlert. Devuelve la función para desmontarlo.
const montar = (contenedorId: string, control: ControlCampo, campo: Campo): (() => void) => {
    const contenedor = document.getElementById(contenedorId);
    if (!contenedor) return () => undefined;
    const raiz = createRoot(contenedor);
    const alCambiar = (v: string) => {
        control.valor = v;
    };
    const registrar = (setInvalido: (invalido: boolean) => void) => {
        control.setInvalido = setInvalido;
    };
    flushSync(() => raiz.render(<Host inicial={control.valor} alCambiar={alCambiar} registrar={registrar} campo={campo} />));
    return () => raiz.unmount();
};

export const montarFecha = (contenedorId: string, control: ControlCampo, datos: { id: string; ariaLabel: string; max?: string }) =>
    montar(contenedorId, control, ({ valor, invalido, cambiar }) => <DatePicker id={datos.id} ariaLabel={datos.ariaLabel} max={datos.max} invalido={invalido} value={valor} onChange={cambiar} />);

export const montarHora = (contenedorId: string, control: ControlCampo, datos: { id: string; ariaLabel: string }) =>
    montar(contenedorId, control, ({ valor, invalido, cambiar }) => <TimePicker id={datos.id} ariaLabel={datos.ariaLabel} invalido={invalido} value={valor} onChange={cambiar} />);

export const montarSelect = (contenedorId: string, control: ControlCampo, datos: { id: string; ariaLabel: string; opciones: OpcionSelect[]; placeholder: string }) =>
    montar(contenedorId, control, ({ valor, invalido, cambiar }) => (
        <Select id={datos.id} alto="lg" ariaLabel={datos.ariaLabel} placeholder={datos.placeholder} opciones={datos.opciones} invalido={invalido} value={valor} onChange={cambiar} />
    ));
