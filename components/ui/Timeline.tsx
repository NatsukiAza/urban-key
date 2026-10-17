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
                    <li key={item.id} className="relative pb-5 pl-7 last:pb-0">
                        {!esUltimo ? <span aria-hidden="true" className="absolute bottom-0 left-[5px] top-4 w-px bg-primary/25 dark:bg-white/15" /> : null}
                        <span
                            aria-hidden="true"
                            className={`absolute left-0 top-[5px] h-[11px] w-[11px] rounded-full border-2 ${
                                primero ? 'border-primary bg-primary dark:border-gold dark:bg-gold' : item.ultimo ? 'border-primary/40 bg-transparent dark:border-white/30' : 'border-primary/40 bg-primary/40 dark:border-white/30 dark:bg-white/30'
                            }`}
                        />
                        <p className="text-[13px] text-uk-muted dark:text-uk-muted-dark [&_strong]:font-extrabold [&_strong]:text-uk-ink dark:[&_strong]:text-uk-ink-dark">{item.title}</p>
                        <p className="mt-0.5 text-xs text-uk-muted dark:text-uk-muted-dark">
                            {item.meta}
                            {item.sinNota ? <> · <em>sin nota</em></> : null}
                        </p>
                        {item.nota ? <p className="mt-2 rounded-lg bg-uk-page p-3 text-[13px] text-uk-ink dark:bg-uk-page-dark dark:text-uk-ink-dark">{item.nota}</p> : null}
                    </li>
                );
            })}
        </ol>
    );
};

export default Timeline;
