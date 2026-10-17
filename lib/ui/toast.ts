import Swal from 'sweetalert2';

// Toast compacto reutilizable. La clase 'uk-toast' lo achica (ver override en app/globals.css).
export function showToast(mensaje: string, type: 'success' | 'error' | 'info' = 'success') {
    Swal.fire({
        toast: true,
        position: 'bottom-end',
        showConfirmButton: false,
        timer: 2500,
        timerProgressBar: true,
        icon: type,
        title: mensaje,
        customClass: { popup: 'uk-toast' },
    });
}

const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const ukToast = Swal.mixin({
    toast: true,
    position: 'bottom-end',
    timer: 6000,
    timerProgressBar: true,
    showConfirmButton: true,
    buttonsStyling: false,
    customClass: { popup: 'uk-toast rounded-xl', confirmButton: 'font-extrabold underline-offset-2 hover:underline' },
});

// Devuelve true si la persona tocó "Deshacer".
export async function toastMovimiento(titulo: string, etapa: string): Promise<boolean> {
    const { isConfirmed } = await ukToast.fire({
        icon: 'success',
        iconColor: '#34D27B',
        html: `“${escapar(titulo)}” pasó a <strong>${escapar(etapa)}</strong>.`,
        confirmButtonText: 'Deshacer',
        customClass: { popup: 'uk-toast rounded-xl !bg-uk-ink !text-white dark:!bg-[#2A3350]', confirmButton: 'font-extrabold text-gold hover:underline' },
    });
    return isConfirmed;
}

// Devuelve true si la persona tocó "Reintentar".
export async function toastErrorMovimiento(etapaOrigen: string): Promise<boolean> {
    const { isConfirmed } = await ukToast.fire({
        icon: 'error',
        iconColor: '#C42B35',
        html: `<strong>No pudimos mover la tarjeta</strong><br/>Volvió a ${escapar(etapaOrigen)}. Revisá tu conexión.`,
        confirmButtonText: 'Reintentar',
        customClass: { popup: 'uk-toast rounded-xl border border-[#F0B7BB] !bg-white !text-uk-ink dark:!bg-uk-card-dark dark:!text-uk-ink-dark dark:border-uk-lost-dark/45', confirmButton: 'font-extrabold text-primary hover:underline dark:text-uk-link-dark' },
    });
    return isConfirmed;
}
