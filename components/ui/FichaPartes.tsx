import Link from 'next/link';
import type { ReactNode } from 'react';
import IconEdit from '@/components/Icon/IconEdit';
import IconPlus from '@/components/Icon/IconPlus';

const claseTarjeta = 'rounded-[14px] border border-uk-line bg-white shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none';

export interface DatoFicha {
    etiqueta: string;
    valor: ReactNode;
    grande?: boolean;
}

interface FichaHeroProps {
    avatar: ReactNode;
    titulo: string;
    junto?: ReactNode;
    debajo?: ReactNode;
    acciones?: ReactNode;
    datos: DatoFicha[];
}

export const FichaHero = ({ avatar, titulo, junto, debajo, acciones, datos }: FichaHeroProps) => (
    <section className={`${claseTarjeta} flex flex-col gap-5 p-6`}>
        <div className="flex flex-wrap items-center justify-between gap-4">
            <div className="flex min-w-0 items-center gap-4">
                {avatar}
                <div className="flex min-w-0 flex-col gap-1.5">
                    <div className="flex flex-wrap items-center gap-2.5">
                        <h1 className="text-[28px] font-extrabold leading-tight tracking-tight text-uk-ink dark:text-uk-ink-dark">{titulo}</h1>
                        {junto}
                    </div>
                    {debajo ? <div className="flex flex-wrap items-center gap-1.5 text-[13px] text-uk-muted dark:text-uk-muted-dark">{debajo}</div> : null}
                </div>
            </div>
            {acciones ? <div className="flex flex-wrap items-center gap-2">{acciones}</div> : null}
        </div>
        <dl className="m-0 grid grid-cols-2 gap-y-4 border-t border-uk-col pt-[18px] dark:border-[#232C45] lg:grid-cols-4">
            {datos.map((d, i) => (
                <div key={d.etiqueta} className={`flex min-w-0 flex-col gap-1 pr-4 lg:px-4 ${i % 2 === 1 ? 'border-l border-uk-col dark:border-[#232C45]' : ''} lg:border-l lg:border-uk-col lg:dark:border-[#232C45] ${i === 0 ? 'lg:border-l-0 lg:pl-0' : ''} ${i === datos.length - 1 ? 'lg:pr-0' : ''}`}>
                    <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">{d.etiqueta}</dt>
                    <dd className={`m-0 min-w-0 break-words tabular-nums ${d.grande ? 'text-2xl font-extrabold text-uk-money dark:text-uk-money-dark' : 'text-[15px] font-bold text-uk-ink dark:text-uk-ink-dark'}`}>{d.valor}</dd>
                </div>
            ))}
        </dl>
    </section>
);

export const Avatar = ({ iniciales, cuadrado = false, children }: { iniciales?: string; cuadrado?: boolean; children?: ReactNode }) => (
    <span
        className={`grid h-[60px] w-[60px] shrink-0 place-content-center ${cuadrado ? 'rounded-[14px] bg-uk-col text-primary dark:bg-white/5 dark:text-uk-link-dark' : 'rounded-full bg-primary-light text-xl font-extrabold text-primary dark:bg-white/10 dark:text-uk-link-dark'}`}
    >
        {children ?? iniciales}
    </span>
);

const claseBotonSecundario = 'inline-flex h-10 items-center gap-2 rounded-[10px] border border-uk-field bg-white px-3.5 text-[13px] font-extrabold text-uk-ink hover:bg-uk-col dark:border-uk-field-dark dark:bg-transparent dark:text-uk-ink-dark dark:hover:bg-white/5';

export const BotonEditar = ({ href, etiqueta }: { href: string; etiqueta: string }) => (
    <Link href={href} aria-label={etiqueta} title={etiqueta} className="grid h-10 w-10 place-content-center rounded-[10px] border border-uk-field bg-white text-primary hover:bg-primary-light dark:border-uk-field-dark dark:bg-transparent dark:text-uk-link-dark dark:hover:bg-white/5">
        <IconEdit className="h-4 w-4" />
    </Link>
);

export const AccionSecundaria = ({ href, children }: { href: string; children: ReactNode }) => (
    <a href={href} className={claseBotonSecundario}>
        {children}
    </a>
);

export const BotonNuevaOportunidad = ({ href, onClick }: { href?: string; onClick?: () => void }) => {
    const clase = 'btn btn-primary h-10 gap-2 rounded-[10px] px-4 font-extrabold';
    const contenido = (
        <>
            <IconPlus className="h-4 w-4" />
            Nueva oportunidad
        </>
    );
    return href ? (
        <Link href={href} className={clase}>
            {contenido}
        </Link>
    ) : (
        <button type="button" className={clase} onClick={onClick}>
            {contenido}
        </button>
    );
};

export const Tarjeta = ({ titulo, derecha, compacta = false, children }: { titulo: string; derecha?: ReactNode; compacta?: boolean; children: ReactNode }) => (
    <section className={`${claseTarjeta} flex flex-col ${compacta ? 'gap-4 p-5' : 'gap-3 px-6 py-5'}`}>
        <div className="flex flex-wrap items-center justify-between gap-2">
            <h2 className={`font-extrabold text-uk-ink dark:text-uk-ink-dark ${compacta ? 'text-base' : 'text-lg'}`}>{titulo}</h2>
            {derecha}
        </div>
        {children}
    </section>
);

export const EnlaceTarjeta = ({ href, children }: { href: string; children: ReactNode }) => (
    <Link href={href} className="text-[13px] font-extrabold text-primary hover:underline dark:text-uk-link-dark">
        {children}
    </Link>
);

// Fila clickeable que lleva a otra ficha: título en violeta, detalle debajo y datos a la derecha.
export const FilaRelacionada = ({ href, icono, titulo, detalle, medio, importe }: { href: string; icono?: ReactNode; titulo: string; detalle: ReactNode; medio?: ReactNode; importe?: ReactNode }) => (
    <Link href={href} className="flex flex-wrap items-center gap-x-4 gap-y-2 rounded-[10px] border border-uk-line px-4 py-3.5 no-underline hover:bg-uk-page dark:border-[#232C45] dark:hover:bg-white/5">
        {icono ? <span className="grid h-11 w-11 shrink-0 place-content-center rounded-[10px] bg-uk-col text-primary dark:bg-white/5 dark:text-uk-link-dark">{icono}</span> : null}
        <span className="flex min-w-[180px] flex-1 flex-col gap-0.5">
            <span className="text-[15px] font-extrabold text-primary dark:text-uk-link-dark">{titulo}</span>
            <span className="text-xs text-uk-muted dark:text-uk-muted-dark">{detalle}</span>
        </span>
        {medio}
        {importe ? <span className="min-w-[96px] text-right text-sm font-extrabold tabular-nums text-uk-money dark:text-uk-money-dark">{importe}</span> : null}
    </Link>
);

export const ListaDatos = ({ children }: { children: ReactNode }) => <dl className="m-0 grid grid-cols-2 gap-x-4 gap-y-3.5">{children}</dl>;

export const DatoLista = ({ etiqueta, ancho = false, children }: { etiqueta: string; ancho?: boolean; children: ReactNode }) => (
    <div className={ancho ? 'col-span-2' : ''}>
        <dt className="text-xs font-bold text-uk-muted dark:text-uk-muted-dark">{etiqueta}</dt>
        <dd className="m-0 mt-0.5 text-sm font-bold text-uk-ink dark:text-uk-ink-dark">{children}</dd>
    </div>
);

export const SinDato = ({ children }: { children: ReactNode }) => <span className="font-semibold italic text-uk-muted dark:text-uk-muted-dark">{children}</span>;
