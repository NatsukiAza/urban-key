import Swal from 'sweetalert2';
import { monedaConfig, type Moneda } from '@/lib/enums/moneda';

const claseCampo = 'form-input h-[42px] w-full rounded-[9px] border-uk-field dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark';
const claseError = 'mt-1 hidden text-xs font-bold text-uk-lost dark:text-uk-lost-dark';
const claseLabel = 'mb-1.5 block text-left text-sm font-bold text-uk-ink dark:text-uk-ink-dark';
const claseOpcional = 'ml-1 text-xs font-semibold text-uk-muted dark:text-uk-muted-dark';

const crearModal = (claseConfirmar: string) =>
    Swal.mixin({
        customClass: {
            popup: 'uk-modal rounded-2xl dark:border dark:border-uk-line-dark dark:bg-uk-card-dark dark:text-uk-ink-dark',
            htmlContainer: 'text-left',
            actions: 'justify-end gap-2',
            footer: 'justify-start text-xs text-uk-muted dark:text-uk-muted-dark',
            confirmButton: `btn h-10 rounded-[10px] ${claseConfirmar}`,
            cancelButton: 'btn btn-cancel h-10 rounded-[10px]',
        },
        buttonsStyling: false,
        reverseButtons: true,
        showCancelButton: true,
        cancelButtonText: 'Cancelar',
        focusCancel: true,
    });

const escapar = (texto: string) => texto.replace(/[&<>"']/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' })[c] as string);

const hoy = () => {
    const d = new Date();
    return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
};

const encabezado = (tipo: 'ganada' | 'perdida' | 'mover', titulo: string, subtitulo: string) => `
    <div class="mb-4 flex items-center gap-3">
        <span aria-hidden="true" class="grid h-10 w-10 shrink-0 place-content-center rounded-full text-lg font-extrabold ${
            tipo === 'ganada'
                ? 'bg-[#E6F6EE] text-uk-won dark:bg-success/15 dark:text-uk-won-dark'
                : tipo === 'perdida'
                  ? 'bg-[#FDECEE] text-uk-lost dark:bg-danger/15 dark:text-uk-lost-dark'
                  : 'bg-primary-light text-primary dark:bg-white/10 dark:text-uk-link-dark'
        }">${tipo === 'ganada' ? '✓' : tipo === 'perdida' ? '✕' : '→'}</span>
        <div class="min-w-0">
            <h2 id="uk-modal-titulo" class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">${titulo}</h2>
            <p class="truncate text-sm text-uk-muted dark:text-uk-muted-dark">${escapar(subtitulo)}</p>
        </div>
    </div>`;

const campoFechaYObservacion = (placeholder: string) => `
    <div class="mt-4">
        <label for="uk-fecha" class="${claseLabel}">Fecha de cierre</label>
        <input id="uk-fecha" type="date" class="${claseCampo}" value="${hoy()}" max="${hoy()}" />
        <p id="uk-err-fecha" class="${claseError}">Elegí una fecha de cierre que no sea futura.</p>
    </div>
    <div class="mt-4">
        <label for="uk-obs" class="${claseLabel}">Observación <span class="${claseOpcional}">Opcional</span></label>
        <textarea id="uk-obs" class="form-textarea w-full resize-none rounded-[9px] border-uk-field dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark" rows="3" placeholder="${placeholder}"></textarea>
    </div>`;

const mostrarError = (id: string, visible: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !visible);
    const campo = document.getElementById(id.replace('uk-err-', 'uk-'));
    campo?.classList.toggle('!border-uk-lost', visible);
    campo?.classList.toggle('dark:!border-uk-lost-dark', visible);
    if (campo) campo.setAttribute('aria-invalid', String(visible));
};

const valor = (id: string) => (document.getElementById(id) as HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement | null)?.value.trim() ?? '';

export interface CierreGanada {
    valorFinal: number | null;
    fechaCierre: string;
    observacion: string | null;
}

export interface CierrePerdida {
    motivoPerdidaId: string;
    fechaCierre: string;
    observacion: string | null;
}

interface DatosModal {
    titulo?: string;
    contacto?: string;
    etapaOrigen?: string;
    etapaDestino?: string;
}

const subtituloDe = (datos: DatosModal) => [datos.titulo, datos.contacto].filter(Boolean).join(' · ') || (datos.etapaDestino ? `Pasa a ${datos.etapaDestino}` : '');
const pieDe = (datos: DatosModal) => (datos.etapaOrigen ? `Si cancelás, la tarjeta vuelve a ${escapar(datos.etapaOrigen)}.` : undefined);

export async function modalCerrarGanada(datos: DatosModal & { valorEstimado: number | null; moneda: Moneda }): Promise<CierreGanada | null> {
    const { valorEstimado, moneda } = datos;
    const estimado = valorEstimado != null ? `${monedaConfig[moneda].label} ${valorEstimado.toLocaleString('es-AR', { maximumFractionDigits: 0 })}` : null;
    const resultado = await crearModal('border-uk-won bg-uk-won text-white shadow-none hover:brightness-110').fire({
        html: `
            ${encabezado('ganada', '¡Operación concretada!', subtituloDe(datos))}
            <div>
                <label for="uk-valor" class="${claseLabel}">Valor final</label>
                <div class="flex">
                    <span class="inline-flex h-[42px] shrink-0 items-center whitespace-nowrap rounded-l-[9px] bg-gold-light px-3 text-xs font-extrabold text-uk-money dark:bg-gold/10 dark:text-uk-money-dark">${monedaConfig[moneda].label}</span>
                    <input id="uk-valor" type="number" min="0" step="0.01" class="${claseCampo} !rounded-l-none" value="${valorEstimado ?? ''}" />
                </div>
                ${estimado ? `<p class="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">Estimado: ${estimado}</p>` : ''}
                <p id="uk-err-valor" class="${claseError}">Ingresá el valor final de la operación.</p>
            </div>
            ${campoFechaYObservacion('Ej.: cierre con escribanía')}`,
        confirmButtonText: 'Confirmar cierre',
        footer: pieDe(datos),
        didOpen: () => document.getElementById('uk-valor')?.focus(),
        preConfirm: () => {
            const valorFinal = valor('uk-valor');
            const fechaCierre = valor('uk-fecha');
            const sinValor = valorEstimado != null && (valorFinal === '' || Number(valorFinal) < 0);
            mostrarError('uk-err-valor', sinValor);
            const fechaInvalida = !fechaCierre || fechaCierre > hoy();
            mostrarError('uk-err-fecha', fechaInvalida);
            if (sinValor || fechaInvalida) return false;
            return { valorFinal: valorFinal === '' ? null : Number(valorFinal), fechaCierre, observacion: valor('uk-obs') || null };
        },
    });
    return resultado.isConfirmed ? (resultado.value as CierreGanada) : null;
}

export async function modalCerrarPerdida(datos: DatosModal & { motivos: { id: string; nombre: string }[] }): Promise<CierrePerdida | null> {
    const opciones = datos.motivos.map((m) => `<option value="${m.id}">${escapar(m.nombre)}</option>`).join('');
    const resultado = await crearModal('border-uk-lost bg-uk-lost text-white shadow-none hover:brightness-110').fire({
        html: `
            ${encabezado('perdida', 'Cerrar como perdida', subtituloDe(datos))}
            <div>
                <label for="uk-motivo" class="${claseLabel}">Motivo</label>
                <select id="uk-motivo" class="form-select ${claseCampo.replace('form-input ', '')}">
                    <option value="">Elegí un motivo</option>
                    ${opciones}
                </select>
                <p id="uk-err-motivo" class="${claseError}">Elegí un motivo para poder cerrarla.</p>
            </div>
            ${campoFechaYObservacion('Ej.: compró con otra inmobiliaria')}`,
        confirmButtonText: 'Cerrar como perdida',
        footer: pieDe(datos),
        didOpen: () => document.getElementById('uk-motivo')?.focus(),
        preConfirm: () => {
            const motivoPerdidaId = valor('uk-motivo');
            const fechaCierre = valor('uk-fecha');
            mostrarError('uk-err-motivo', !motivoPerdidaId);
            const fechaInvalida = !fechaCierre || fechaCierre > hoy();
            mostrarError('uk-err-fecha', fechaInvalida);
            if (!motivoPerdidaId || fechaInvalida) return false;
            return { motivoPerdidaId, fechaCierre, observacion: valor('uk-obs') || null };
        },
    });
    return resultado.isConfirmed ? (resultado.value as CierrePerdida) : null;
}

export async function modalMoverEtapa(datos: { titulo: string; etapaOrigen: string; etapaDestino: string }): Promise<{ observacion: string | null } | null> {
    const resultado = await crearModal('btn-primary shadow-none').fire({
        html: `
            ${encabezado('mover', `Mover a ${escapar(datos.etapaDestino)}`, `${datos.titulo} · desde ${datos.etapaOrigen}`)}
            <div>
                <label for="uk-obs" class="${claseLabel}">Nota <span class="${claseOpcional}">Opcional</span></label>
                <textarea id="uk-obs" class="form-textarea w-full resize-none rounded-[9px] border-uk-field dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark" rows="3" placeholder="Ej.: se acordó visita para el jueves"></textarea>
                <p class="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">La nota queda en el historial de la oportunidad.</p>
            </div>`,
        confirmButtonText: 'Mover',
        focusCancel: false,
        didOpen: () => document.getElementById('uk-obs')?.focus(),
        preConfirm: () => ({ observacion: valor('uk-obs') || null }),
    });
    return resultado.isConfirmed ? (resultado.value as { observacion: string | null }) : null;
}
