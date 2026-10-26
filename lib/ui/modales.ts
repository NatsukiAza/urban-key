import Swal from 'sweetalert2';
import { monedaConfig, type Moneda } from '@/lib/enums/moneda';
import { montarFechaCierre, type ControlFecha } from '@/lib/ui/FechaCierreHost';

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

const encabezado = (tipo: 'ganada' | 'perdida' | 'mover' | 'actividad', titulo: string, subtitulo: string) => `
    <div class="mb-4 flex items-center gap-3">
        <span aria-hidden="true" class="grid h-10 w-10 shrink-0 place-content-center rounded-full text-lg font-extrabold ${
            tipo === 'ganada'
                ? 'bg-[#E6F6EE] text-uk-won dark:bg-success/15 dark:text-uk-won-dark'
                : tipo === 'perdida'
                  ? 'bg-[#FDECEE] text-uk-lost dark:bg-danger/15 dark:text-uk-lost-dark'
                  : 'bg-primary-light text-primary dark:bg-white/10 dark:text-uk-link-dark'
        }">${tipo === 'ganada' ? '✓' : tipo === 'perdida' ? '✕' : tipo === 'actividad' ? '+' : '→'}</span>
        <div class="min-w-0">
            <h2 id="uk-modal-titulo" class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">${titulo}</h2>
            <p class="truncate text-sm text-uk-muted dark:text-uk-muted-dark">${escapar(subtitulo)}</p>
        </div>
    </div>`;

const campoFechaYObservacion = (placeholder: string) => `
    <div class="mt-4">
        <label for="uk-fecha" class="${claseLabel}">Fecha de cierre</label>
        <div id="uk-fecha-root"></div>
        <p id="uk-err-fecha" class="${claseError}">Elegí una fecha de cierre que no sea futura.</p>
    </div>
    <div class="mt-4">
        <label for="uk-obs" class="${claseLabel}">Observación <span class="${claseOpcional}">Opcional</span></label>
        <textarea id="uk-obs" class="form-textarea w-full resize-none rounded-[9px] border-uk-field dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark" rows="3" placeholder="${placeholder}"></textarea>
    </div>`;

let controlFecha: ControlFecha = { valor: '' };
let desmontarFecha: () => void = () => undefined;

const prepararFecha = (): (() => void) => {
    controlFecha = { valor: hoy() };
    const contenedor = document.getElementById('uk-fecha-root');
    return contenedor ? montarFechaCierre(contenedor, controlFecha, hoy()) : () => undefined;
};

const mostrarError = (id: string, visible: boolean) => {
    const el = document.getElementById(id);
    if (!el) return;
    el.classList.toggle('hidden', !visible);
    if (id === 'uk-err-fecha') {
        controlFecha.setInvalido?.(visible);
        return;
    }
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
        didOpen: () => {
            desmontarFecha = prepararFecha();
            document.getElementById('uk-valor')?.focus();
        },
        willClose: () => desmontarFecha(),
        preConfirm: () => {
            const valorFinal = valor('uk-valor');
            const fechaCierre = controlFecha.valor;
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
        didOpen: () => {
            desmontarFecha = prepararFecha();
            document.getElementById('uk-motivo')?.focus();
        },
        willClose: () => desmontarFecha(),
        preConfirm: () => {
            const motivoPerdidaId = valor('uk-motivo');
            const fechaCierre = controlFecha.valor;
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

export interface NuevaActividad {
    tipoId: string;
    titulo: string | null;
    descripcion: string | null;
    fecha: string;
}

const horaActual = () => {
    const d = new Date();
    return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`;
};

export async function modalRegistrarActividad(datos: { subtitulo: string; tipos: { id: string; nombre: string }[] }): Promise<NuevaActividad | null> {
    const opciones = datos.tipos.map((t) => `<option value="${t.id}">${escapar(t.nombre)}</option>`).join('');
    const resultado = await crearModal('btn-primary shadow-none').fire({
        html: `
            ${encabezado('actividad', 'Registrar actividad', datos.subtitulo)}
            <div class="grid gap-4 sm:grid-cols-2">
                <div class="sm:col-span-2">
                    <label for="uk-tipo" class="${claseLabel}">Tipo</label>
                    <select id="uk-tipo" class="form-select ${claseCampo.replace('form-input ', '')}">
                        <option value="">Elegí un tipo</option>
                        ${opciones}
                    </select>
                    <p id="uk-err-tipo" class="${claseError}">Elegí qué tipo de actividad fue.</p>
                </div>
                <div>
                    <label for="uk-fecha" class="${claseLabel}">Fecha</label>
                    <div id="uk-fecha-root"></div>
                    <p id="uk-err-fecha" class="${claseError}">Elegí una fecha que no sea futura.</p>
                </div>
                <div>
                    <label for="uk-hora" class="${claseLabel}">Hora</label>
                    <input id="uk-hora" type="time" class="${claseCampo} tabular-nums" value="${horaActual()}" />
                    <p id="uk-err-hora" class="${claseError}">La actividad ya tiene que haber ocurrido: elegí una hora pasada.</p>
                </div>
                <div class="sm:col-span-2">
                    <label for="uk-titulo" class="${claseLabel}">Título <span class="${claseOpcional}">Opcional</span></label>
                    <input id="uk-titulo" type="text" maxlength="120" autocomplete="off" placeholder="Ej.: Visita con la familia Pérez" class="${claseCampo}" />
                    <p class="mt-1 text-xs text-uk-muted dark:text-uk-muted-dark">Si lo dejás vacío, se usa el nombre del tipo.</p>
                </div>
                <div class="sm:col-span-2">
                    <label for="uk-obs" class="${claseLabel}">Descripción <span class="${claseOpcional}">Opcional</span></label>
                    <textarea id="uk-obs" maxlength="2000" class="form-textarea w-full resize-none rounded-[9px] border-uk-field dark:border-uk-field-dark dark:bg-uk-page-dark dark:text-uk-ink-dark" rows="3" placeholder="Ej.: le gustó la luz del living, pide ver otra en la misma zona"></textarea>
                </div>
            </div>`,
        confirmButtonText: 'Registrar actividad',
        footer: 'Una actividad registrada no se edita: si te equivocás, dala de baja y cargala de nuevo.',
        focusCancel: false,
        didOpen: () => {
            controlFecha = { valor: hoy() };
            const contenedor = document.getElementById('uk-fecha-root');
            desmontarFecha = contenedor ? montarFechaCierre(contenedor, controlFecha, hoy(), 'Fecha de la actividad') : () => undefined;
            document.getElementById('uk-tipo')?.focus();
        },
        willClose: () => desmontarFecha(),
        preConfirm: () => {
            const tipoId = valor('uk-tipo');
            const fecha = controlFecha.valor;
            const hora = valor('uk-hora');
            mostrarError('uk-err-tipo', !tipoId);
            const fechaInvalida = !fecha || fecha > hoy();
            mostrarError('uk-err-fecha', fechaInvalida);
            const momento = fecha && hora ? new Date(`${fecha}T${hora}`) : null;
            const horaInvalida = !fechaInvalida && (!momento || Number.isNaN(momento.getTime()) || momento.getTime() > Date.now());
            mostrarError('uk-err-hora', horaInvalida);
            if (!tipoId || fechaInvalida || horaInvalida || !momento) return false;
            return { tipoId, titulo: valor('uk-titulo') || null, descripcion: valor('uk-obs') || null, fecha: momento.toISOString() };
        },
    });
    return resultado.isConfirmed ? (resultado.value as NuevaActividad) : null;
}

export async function modalDarDeBaja(titulo: string, texto ='Deja de aparecer en el tablero y la lista. El historial se conserva.'): Promise<boolean> {
    const resultado = await crearModal('border-uk-lost bg-uk-lost text-white shadow-none hover:brightness-110').fire({
        html: `
            <h2 class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">¿Dar de baja <strong>${escapar(titulo)}</strong>?</h2>
            <p class="mt-2 text-sm text-uk-muted dark:text-uk-muted-dark">${escapar(texto)}</p>`,
        confirmButtonText: 'Dar de baja',
    });
    return resultado.isConfirmed;
}

export async function modalNombre(datos: { titulo: string; etiqueta: string; placeholder: string; confirmar: string; existentes: string[] }): Promise<string | null> {
    const resultado = await crearModal('btn-primary shadow-none').fire({
        html: `
            <h2 class="mb-4 text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">${escapar(datos.titulo)}</h2>
            <div>
                <label for="uk-nombre" class="${claseLabel}">${escapar(datos.etiqueta)}</label>
                <input id="uk-nombre" type="text" maxlength="60" autocomplete="off" placeholder="${escapar(datos.placeholder)}" class="${claseCampo}" />
                <p id="uk-err-nombre" class="${claseError}"></p>
            </div>`,
        confirmButtonText: datos.confirmar,
        focusCancel: false,
        didOpen: () => document.getElementById('uk-nombre')?.focus(),
        preConfirm: () => {
            const nombre = valor('uk-nombre');
            const err = document.getElementById('uk-err-nombre');
            const mensaje = !nombre ? 'Escribí un nombre.' : datos.existentes.some((n) => n.trim().toLowerCase() === nombre.toLowerCase()) ? 'Ya existe uno con ese nombre. Elegí otro.' : '';
            if (err) {
                err.textContent = mensaje;
                err.classList.toggle('hidden', !mensaje);
            }
            document.getElementById('uk-nombre')?.classList.toggle('!border-uk-lost', Boolean(mensaje));
            return mensaje ? false : nombre;
        },
    });
    return resultado.isConfirmed ? (resultado.value as string) : null;
}

export async function modalDesactivar(datos: { titulo: string; texto: string }): Promise<boolean> {
    const resultado = await crearModal('border-uk-lost bg-uk-lost text-white shadow-none hover:brightness-110').fire({
        html: `
            <h2 class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">${escapar(datos.titulo)}</h2>
            <p class="mt-2 text-sm text-uk-muted dark:text-uk-muted-dark">${escapar(datos.texto)}</p>`,
        confirmButtonText: 'Desactivar',
    });
    return resultado.isConfirmed;
}


export interface DatosNuevoContacto {
    nombre: string;
    apellido: string;
    telefono: string;
    email: string;
}

const camposContacto = [
    { id: 'nombre', etiqueta: 'Nombre', obligatorio: true },
    { id: 'apellido', etiqueta: 'Apellido', obligatorio: true },
    { id: 'telefono', etiqueta: 'Teléfono', obligatorio: false },
    { id: 'email', etiqueta: 'Email', obligatorio: false },
];

export async function modalNuevoContacto(datos: { titulo: string; ayuda: string; confirmar: string; busqueda?: string }): Promise<DatosNuevoContacto | null> {
    const [primero, ...resto] = (datos.busqueda ?? '').trim().split(/\s+/).filter(Boolean);
    const inicial: Record<string, string> = { nombre: primero ?? '', apellido: resto.join(' ') };
    const resultado = await crearModal('btn-primary shadow-none').fire({
        html: `
            <h2 class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">${escapar(datos.titulo)}</h2>
            <p class="mb-4 mt-1 text-sm text-uk-muted dark:text-uk-muted-dark">${escapar(datos.ayuda)}</p>
            <div class="grid gap-4 sm:grid-cols-2">
                ${camposContacto
                    .map(
                        (c) => `
                <div>
                    <label for="uk-${c.id}" class="${claseLabel}">${c.etiqueta}</label>
                    <input id="uk-${c.id}" type="${c.id === 'email' ? 'email' : c.id === 'telefono' ? 'tel' : 'text'}" autocomplete="off" value="${escapar(inicial[c.id] ?? '')}" class="${claseCampo}" />
                    <p id="uk-err-${c.id}" class="${claseError}"></p>
                </div>`
                    )
                    .join('')}
            </div>
            <p id="uk-err-contacto" class="${claseError}">Cargá al menos un teléfono o un email.</p>`,
        confirmButtonText: datos.confirmar,
        focusCancel: false,
        didOpen: () => document.getElementById(inicial.nombre ? 'uk-apellido' : 'uk-nombre')?.focus(),
        preConfirm: () => {
            const v = { nombre: valor('uk-nombre'), apellido: valor('uk-apellido'), telefono: valor('uk-telefono'), email: valor('uk-email') };
            const errNombre = document.getElementById('uk-err-nombre');
            const errApellido = document.getElementById('uk-err-apellido');
            if (errNombre) errNombre.textContent = 'Cargá el nombre.';
            if (errApellido) errApellido.textContent = 'Cargá el apellido.';
            mostrarError('uk-err-nombre', !v.nombre);
            mostrarError('uk-err-apellido', !v.apellido);
            const sinContacto = !v.telefono && !v.email;
            document.getElementById('uk-err-contacto')?.classList.toggle('hidden', !sinContacto);
            if (!v.nombre || !v.apellido || sinContacto) return false;
            return v;
        },
    });
    return resultado.isConfirmed ? (resultado.value as DatosNuevoContacto) : null;
}

export async function modalGenerarContrasena(nombre: string): Promise<boolean> {
    const resultado = await crearModal('btn-primary shadow-none').fire({
        html: `
            <h2 class="text-xl font-extrabold leading-tight text-uk-ink dark:text-uk-ink-dark">¿Generar una contraseña nueva para <strong>${escapar(nombre)}</strong>?</h2>
            <p class="mt-2 text-sm text-uk-muted dark:text-uk-muted-dark">La contraseña actual deja de funcionar y tendrá que cambiar la nueva en su próximo ingreso.</p>`,
        confirmButtonText: 'Generar contraseña',
        focusCancel: false,
    });
    return resultado.isConfirmed;
}
