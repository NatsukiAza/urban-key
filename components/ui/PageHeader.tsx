import type { ReactNode } from 'react';

const PageHeader = ({ title, description, actions }: { title: string; description?: ReactNode; actions?: ReactNode }) => (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
        <div>
            <h1 className="text-[26px] font-extrabold tracking-tight text-uk-ink dark:text-uk-ink-dark">{title}</h1>
            {description ? <p className="mt-1 text-sm text-uk-muted dark:text-uk-muted-dark">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
);

export const contar = (cantidad: number, singular: string, plural: string) => (cantidad === 1 ? `1 ${singular}` : `${cantidad} ${plural}`);

export default PageHeader;
