export type ItemTimeline = {
    id: string;
    title: React.ReactNode;
    meta: string;
    nota?: string | null;
    sinNota?: boolean;
    ultimo?: boolean;
};

const Timeline = ({ items, vacio, variante = 'simple' }: { items: ItemTimeline[]; vacio: string; variante?: 'simple' | 'historial' }) => {
    if (items.length === 0) {
        return <p className="text-sm text-uk-muted dark:text-uk-muted-dark">{vacio}</p>;
    }

    if (variante === 'simple') {
        return (
            <ol>
                {items.map((item, index) => (
                    <li key={item.id} className="relative pb-5 pl-7 last:pb-0">
                        {index < items.length - 1 ? <span className="absolute bottom-0 left-[6px] top-3 w-px bg-primary/25" /> : null}
                        <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-gold bg-white dark:bg-uk-card-dark" />
                        <p className="font-semibold">{item.title}</p>
                        <p className="text-sm text-uk-muted dark:text-uk-muted-dark">{item.meta}</p>
                    </li>
                ))}
            </ol>
        );
    }

    return (
        <ol>
            {items.map((item, index) => {
                const primero = index === 0;
                const esUltimo = index === items.length - 1;
                return (
                    <li key={item.id} className="relative pb-6 pl-7 last:pb-0">
                        {!esUltimo ? <span aria-hidden="true" className="absolute bottom-0 left-[6px] top-5 w-0.5 bg-primary/25 dark:bg-white/15" /> : null}
                        <span
                            aria-hidden="true"
                            className={`absolute rounded-full ${
                                primero
                                    ? 'left-0 top-[3px] h-[14px] w-[14px] border-2 border-primary bg-primary shadow-[0_0_0_4px_#F6EEF7] dark:border-gold dark:bg-gold dark:shadow-[0_0_0_4px_rgba(216,172,113,.2)]'
                                    : item.ultimo
                                      ? 'left-[1.5px] top-[4.5px] h-[11px] w-[11px] border-2 border-[#CDB8D3] bg-transparent dark:border-white/30'
                                      : 'left-[1.5px] top-[4.5px] h-[11px] w-[11px] bg-[#CDB8D3] dark:bg-white/30'
                            }`}
                        />
                        <p className={`text-sm font-bold text-uk-muted dark:text-uk-muted-dark [&_strong]:font-extrabold ${primero ? '[&_strong]:text-primary dark:[&_strong]:text-gold' : '[&_strong]:text-uk-ink dark:[&_strong]:text-uk-ink-dark'}`}>{item.title}</p>
                        <p className="mt-1.5 text-xs text-uk-muted dark:text-uk-muted-dark">
                            {item.meta}
                            {item.sinNota ? <> · <em>sin nota</em></> : null}
                        </p>
                        {item.nota ? <p className="mt-2 rounded-lg bg-uk-page px-3 py-2.5 text-sm leading-[1.5] text-uk-ink dark:bg-uk-page-dark dark:text-uk-ink-dark">{item.nota}</p> : null}
                    </li>
                );
            })}
        </ol>
    );
};

export default Timeline;
