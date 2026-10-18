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

const DIAS_AVISO_VENCIMIENTO = 3;

// "20/10" si la fecha estimada de cierre ya pasó o faltan 3 días o menos; null si todavía falta.
export const venceProximamente = (fecha: string | null | undefined): string | null => {
    if (!fecha || diasHasta(fecha) > DIAS_AVISO_VENCIMIENTO) return null;
    const d = aFecha(fecha);
    return `${dosDigitos(d.getDate())}/${dosDigitos(d.getMonth() + 1)}`;
};

// "1155551006", "11-5555-1006" o "+54 9 11 5555 1006" -> "11 5555-1006". Si no se puede normalizar, devuelve el dato tal cual.
export const formatearTelefono = (valor: string | null | undefined): string => {
    if (!valor || !valor.trim()) return '—';
    let d = valor.replace(/\D/g, '');
    if (d.startsWith('54')) d = d.slice(2);
    if (d.startsWith('9') && d.length === 11) d = d.slice(1);
    if (d.startsWith('0')) d = d.slice(1);
    if (d.length === 10 && d.startsWith('11')) return `${d.slice(0, 2)} ${d.slice(2, 6)}-${d.slice(6)}`;
    if (d.length === 10) return `${d.slice(0, 3)} ${d.slice(3, 6)}-${d.slice(6)}`;
    if (d.length === 8) return `${d.slice(0, 4)}-${d.slice(4)}`;
    return valor.trim();
};
