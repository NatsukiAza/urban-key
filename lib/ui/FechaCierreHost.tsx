import { useState } from 'react';
import { createRoot } from 'react-dom/client';
import DatePicker from '@/components/ui/DatePicker';

export interface ControlFecha {
    valor: string;
    setInvalido?: (invalido: boolean) => void;
}

const Host = ({ control, max }: { control: ControlFecha; max: string }) => {
    const [valor, setValor] = useState(control.valor);
    const [invalido, setInvalido] = useState(false);
    control.setInvalido = setInvalido;
    return (
        <DatePicker
            id="uk-fecha"
            ariaLabel="Fecha de cierre"
            max={max}
            invalido={invalido}
            value={valor}
            onChange={(v) => {
                control.valor = v;
                setValor(v);
                if (v) setInvalido(false);
            }}
        />
    );
};

// Monta el selector de fecha dentro del HTML de un modal de SweetAlert. Devuelve la función para desmontarlo.
export function montarFechaCierre(contenedor: HTMLElement, control: ControlFecha, max: string): () => void {
    const raiz = createRoot(contenedor);
    raiz.render(<Host control={control} max={max} />);
    return () => raiz.unmount();
}
