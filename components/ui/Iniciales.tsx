export const inicialesDe = (nombre: string, apellido = '') => {
    const partes = `${nombre} ${apellido}`.trim().split(/\s+/).filter(Boolean);
    const letras = partes
        .slice(0, 2)
        .map((parte) => parte[0])
        .join('')
        .toUpperCase();
    return letras || '?';
};

const Iniciales = ({ nombre, apellido = '' }: { nombre: string; apellido?: string }) => (
    <span className="grid h-8 w-8 shrink-0 place-content-center rounded-full bg-primary/10 text-xs font-semibold text-primary">{inicialesDe(nombre, apellido)}</span>
);

export default Iniciales;
