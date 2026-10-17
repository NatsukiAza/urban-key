'use client';
import type { KeyboardEvent } from 'react';

interface Tab {
    id: string;
    nombre: string;
}

interface Props {
    tabs: Tab[];
    activeId: string;
    conteos?: Record<string, number>;
    onSelect: (id: string) => void;
    ariaLabel?: string;
}

const FunnelTabs = ({ tabs, activeId, conteos, onSelect, ariaLabel = 'Funnels' }: Props) => {
    const mover = (event: KeyboardEvent<HTMLDivElement>) => {
        if (event.key !== 'ArrowRight' && event.key !== 'ArrowLeft') return;
        const actual = tabs.findIndex((tab) => tab.id === activeId);
        const siguiente = tabs[(actual + (event.key === 'ArrowRight' ? 1 : tabs.length - 1)) % tabs.length];
        onSelect(siguiente.id);
    };

    return (
        <div role="tablist" aria-label={ariaLabel} onKeyDown={mover} className="flex flex-nowrap overflow-x-auto [scrollbar-width:none] border-b border-uk-line dark:border-uk-line-dark">
            {tabs.map((tab) => {
                const activa = tab.id === activeId;
                const conteo = conteos?.[tab.id] ?? 0;
                return (
                    <button
                        key={tab.id}
                        type="button"
                        role="tab"
                        aria-selected={activa}
                        tabIndex={activa ? 0 : -1}
                        onClick={() => onSelect(tab.id)}
                        className={`flex h-11 shrink-0 items-center gap-2 border-b-[3px] px-3.5 text-sm font-bold focus-visible:ring-2 focus-visible:ring-primary/40 dark:focus-visible:ring-gold/50 ${
                            activa
                                ? 'border-primary font-extrabold text-primary dark:border-gold dark:text-white'
                                : 'border-transparent text-uk-muted hover:text-uk-ink dark:text-uk-muted-dark dark:hover:text-uk-ink-dark'
                        }`}
                    >
                        {tab.nombre}
                        {conteos ? (
                            <span
                                className={`inline-flex h-5 min-w-[22px] items-center justify-center rounded-full px-1.5 text-[11px] font-extrabold tabular-nums ${
                                    activa ? 'bg-primary text-white dark:bg-gold dark:text-[#2A1A00]' : 'bg-uk-col text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark'
                                }`}
                            >
                                {conteo}
                            </span>
                        ) : null}
                    </button>
                );
            })}
        </div>
    );
};

export default FunnelTabs;
