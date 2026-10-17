const dosDigitos = (n: number) => String(n).padStart(2, '0');

// Acepta 'yyyy-mm-dd' (fechas sin hora, sin correrse de día por zona horaria) o un ISO completo.
const aFecha = (valor: string) => (/^\d{4}-\d{2}-\d{2}$/.test(valor) ? new Date(`${valor}T12:00:00`) : new Date(valor));

export const formatearFecha = (valor: string | null | undefined): string => {
    if (!valor) return '—';
    const d = aFecha(valor);
    return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}/${d.getFullYear()}`;
};

export const formatearFechaHora = (valor: string | null | undefined): string => {
    if (!valor) return '—';
    const d = new Date(valor);
    return `${formatearFecha(valor)} · ${dosDigitos(d.getHours())}:${dosDigitos(d.getMinutes())}`;
};

// Días de calendario entre hoy y la fecha: positivo si es futura, negativo si ya pasó.
export const diasHasta = (valor: string): number => {
    const d = aFecha(valor);
    const hoy = new Date();
    return Math.round((Date.UTC(d.getFullYear(), d.getMonth(), d.getDate()) - Date.UTC(hoy.getFullYear(), hoy.getMonth(), hoy.getDate())) / 86_400_000);
};

export const diasRelativos = (dias: number): string => {
    if (dias === 0) return 'hoy';
    const n = Math.abs(dias);
    const texto = `${n} ${n === 1 ? 'día' : 'días'}`;
    return dias > 0 ? `en ${texto}` : `hace ${texto}`;
};
