import type { ReactNode } from 'react';

export type DatoHero = {
    label: string;
    value: ReactNode;
    emphasis?: boolean;
};

const DetailHero = ({ title, badges, actions, facts }: { title: string; badges?: ReactNode; actions?: ReactNode; facts: DatoHero[] }) => (
    <div className="panel">
        <div className="flex flex-wrap items-start justify-between gap-3">
            <div className="flex min-w-0 flex-wrap items-center gap-2">
                <h1 className="text-xl font-semibold text-black dark:text-white-light">{title}</h1>
                {badges}
            </div>
            {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
        </div>
        {facts.length > 0 ? (
            <dl className="mt-5 grid gap-4 border-t border-white-light pt-5 dark:border-[#1b2e4b] sm:grid-cols-3">
                {facts.map((fact) => (
                    <div key={fact.label}>
                        <dt className="text-xs uppercase tracking-wide text-white-dark">{fact.label}</dt>
                        <dd className={fact.emphasis ? 'mt-1 text-2xl font-semibold text-gold-dark' : 'mt-1 font-semibold'}>{fact.value}</dd>
                    </div>
                ))}
            </dl>
        ) : null}
    </div>
);

export default DetailHero;
