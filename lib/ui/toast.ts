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
