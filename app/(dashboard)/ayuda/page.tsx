import type { Metadata } from 'next';
import IconMail from '@/components/Icon/IconMail';
import IconClock from '@/components/Icon/IconClock';
import IconCaretDown from '@/components/Icon/IconCaretDown';

export const metadata: Metadata = {
    title: 'Ayuda | UrbanKey',
};

const SOPORTE_EMAIL = 'soporte@urbankey.com.ar';
const SOPORTE_HORARIO = 'Lunes a viernes de 9 a 18 h';

const preguntas: { pregunta: string; respuesta: string }[] = [
    {
        pregunta: '¿Cómo cargo una oportunidad nueva?',
        respuesta: 'Entrá a Oportunidades (Lista o Tablero) y tocá "Nueva oportunidad". También podés crearla desde el detalle de un contacto o de un inmueble, y ya queda precargado.',
    },
    {
        pregunta: '¿Cómo cambio una oportunidad de etapa?',
        respuesta: 'En el tablero, arrastrá la tarjeta a otra columna. En la lista, usá "Avanzar". En el detalle, tocá la etapa en la barra de etapas. Cada cambio queda en el historial con fecha y usuario.',
    },
    {
        pregunta: '¿Cómo cierro una oportunidad como ganada o perdida?',
        respuesta: 'Soltá la tarjeta en Ganada o Perdida del tablero, o usá los botones del detalle. Para cerrarla como perdida tenés que elegir un motivo. Una oportunidad cerrada ya no se puede modificar.',
    },
    {
        pregunta: 'No veo un contacto o una oportunidad que sé que existe',
        respuesta: 'Si sos vendedor, ves los contactos y las oportunidades que tenés asignados. Pedile al responsable comercial o al administrador que te lo reasigne.',
    },
    {
        pregunta: '¿Quién puede reasignar contactos y oportunidades?',
        respuesta: 'El responsable comercial y el administrador.',
    },
    {
        pregunta: '¿Cómo agrego usuarios, etapas o motivos de pérdida?',
        respuesta: 'Solo el administrador puede hacerlo, desde Usuarios y desde Configuración.',
    },
    {
        pregunta: 'Si doy de baja algo, ¿se pierde?',
        respuesta: 'No. Deja de aparecer en las listas, pero el historial comercial se conserva.',
    },
];

export default function Page() {
    return (
        <div className="mx-auto flex max-w-[1080px] flex-col gap-5">
            <div className="flex flex-col gap-1">
                <h1 className="text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark">Ayuda</h1>
                <p className="text-sm text-uk-muted dark:text-uk-muted-dark">Respuestas rápidas sobre el uso de UrbanKey y cómo contactarnos.</p>
            </div>

            <div className="flex flex-wrap items-start gap-5">
                <section className="panel flex-[2_1_480px] rounded-[14px] p-6" aria-labelledby="preguntas-frecuentes">
                    <h2 id="preguntas-frecuentes" className="mb-4 text-lg font-extrabold text-uk-ink dark:text-uk-ink-dark">
                        Preguntas frecuentes
                    </h2>
                    <div className="divide-y divide-uk-line dark:divide-uk-line-dark">
                        {preguntas.map(({ pregunta, respuesta }) => (
                            <details key={pregunta} className="group">
                                <summary className="flex min-h-11 cursor-pointer list-none items-center justify-between gap-3 rounded-[10px] py-3 text-sm font-bold text-uk-ink focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/40 dark:text-uk-ink-dark dark:focus-visible:ring-gold/50 [&::-webkit-details-marker]:hidden">
                                    {pregunta}
                                    <IconCaretDown className="shrink-0 text-uk-muted transition-transform group-open:rotate-180 dark:text-uk-muted-dark" />
                                </summary>
                                <p className="pb-4 text-sm text-uk-muted dark:text-uk-muted-dark">{respuesta}</p>
                            </details>
                        ))}
                    </div>
                </section>

                <section className="panel flex flex-[1_1_320px] flex-col gap-4 rounded-[14px] p-6" aria-labelledby="contacto-soporte">
                    <div className="flex flex-col gap-1">
                        <h2 id="contacto-soporte" className="text-lg font-extrabold text-uk-ink dark:text-uk-ink-dark">
                            ¿Necesitás ayuda?
                        </h2>
                        <p className="text-sm text-uk-muted dark:text-uk-muted-dark">Escribinos contándonos qué estabas haciendo y en qué pantalla. Si podés, sumá una captura.</p>
                    </div>
                    <dl className="flex flex-col gap-3 text-sm">
                        <div className="flex items-center gap-2">
                            <IconMail className="shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                            <dt className="sr-only">Email</dt>
                            <dd className="break-all font-bold text-uk-ink dark:text-uk-ink-dark">{SOPORTE_EMAIL}</dd>
                        </div>
                        <div className="flex items-center gap-2">
                            <IconClock className="shrink-0 text-uk-muted dark:text-uk-muted-dark" />
                            <dt className="sr-only">Horario</dt>
                            <dd className="text-uk-ink dark:text-uk-ink-dark">{SOPORTE_HORARIO}</dd>
                        </div>
                    </dl>
                    <a href={`mailto:${SOPORTE_EMAIL}?subject=${encodeURIComponent('Consulta sobre UrbanKey')}`} className="btn btn-primary h-10 rounded-[10px]">
                        Escribir a soporte
                    </a>
                </section>
            </div>
        </div>
    );
}
