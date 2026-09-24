export type ItemTimeline = {
    id: string;
    title: string;
    meta: string;
};

const Timeline = ({ items, vacio }: { items: ItemTimeline[]; vacio: string }) => {
    if (items.length === 0) {
        return <p className="text-white-dark">{vacio}</p>;
    }

    return (
        <ol>
            {items.map((item, index) => (
                <li key={item.id} className="relative pb-5 pl-7 last:pb-0">
                    {index < items.length - 1 ? <span className="absolute bottom-0 left-[6px] top-3 w-px bg-primary/25" /> : null}
                    <span className="absolute left-0 top-1 h-3.5 w-3.5 rounded-full border-2 border-gold bg-white dark:bg-black" />
                    <p className="font-semibold">{item.title}</p>
                    <p className="text-sm text-white-dark">{item.meta}</p>
                </li>
            ))}
        </ol>
    );
};

export default Timeline;
