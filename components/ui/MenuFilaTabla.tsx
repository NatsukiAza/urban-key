'use client';
import Link from 'next/link';
import Dropdown from '@/components/Dropdown';
import IconHorizontalDots from '@/components/Icon/IconHorizontalDots';

export interface ItemMenuFila {
    etiqueta: string;
    href?: string;
    onClick?: () => void;
    destructivo?: boolean;
}

const claseItem = 'flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] font-bold text-uk-ink hover:bg-primary-light dark:text-uk-ink-dark dark:hover:bg-uk-line-dark';
const claseDestructivo = 'flex h-9 w-full items-center rounded-lg px-2.5 text-left text-[13px] font-extrabold text-uk-lost hover:bg-[#FDECEE] dark:text-uk-lost-dark dark:hover:bg-danger/10';

// Menú "⋯" de las filas de tabla. Un separador antecede a la primera acción destructiva.
const MenuFilaTabla = ({ items, ariaLabel = 'Más acciones' }: { items: ItemMenuFila[]; ariaLabel?: string }) => (
    <div onClick={(e) => e.stopPropagation()}>
        <Dropdown
            placement="bottom-end"
            fijo
            offset={[0, 6]}
            btnClassName="grid h-[34px] w-[34px] place-content-center rounded-[9px] border border-uk-line bg-white text-uk-muted hover:bg-uk-col dark:border-uk-line-dark dark:bg-transparent dark:text-uk-muted-dark dark:hover:bg-white/5"
            aria-label={ariaLabel}
            title={ariaLabel}
            button={<IconHorizontalDots className="h-4 w-4" />}
        >
            <div role="menu" className="w-[196px] rounded-xl border border-uk-line bg-white p-1.5 shadow-[0_8px_24px_rgba(30,15,40,.16)] dark:border-uk-line-dark dark:bg-uk-card-raised-dark dark:shadow-[0_16px_32px_rgba(0,0,0,.5)]">
                {items.map((item, i) => {
                    const primerDestructivo = item.destructivo && !items.slice(0, i).some((x) => x.destructivo);
                    const clase = item.destructivo ? claseDestructivo : claseItem;
                    return (
                        <div key={item.etiqueta}>
                            {primerDestructivo && i > 0 ? <span role="separator" className="my-1 block h-px bg-uk-line dark:bg-uk-line-dark" /> : null}
                            {item.href ? (
                                <Link role="menuitem" href={item.href} className={clase}>
                                    {item.etiqueta}
                                </Link>
                            ) : (
                                <button type="button" role="menuitem" className={clase} onClick={item.onClick}>
                                    {item.etiqueta}
                                </button>
                            )}
                        </div>
                    );
                })}
            </div>
        </Dropdown>
    </div>
);

export default MenuFilaTabla;
