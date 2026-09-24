import type { ReactNode } from 'react';

const PageHeader = ({ title, description, actions }: { title: string; description?: string; actions?: ReactNode }) => (
    <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
        <div>
            <h1 className="text-xl font-semibold text-black dark:text-white-light">{title}</h1>
            {description ? <p className="mt-1 text-sm text-white-dark">{description}</p> : null}
        </div>
        {actions ? <div className="flex flex-wrap items-center gap-2">{actions}</div> : null}
    </div>
);

export const contar = (cantidad: number, singular: string, plural: string) => (cantidad === 1 ? `1 ${singular}` : `${cantidad} ${plural}`);

export default PageHeader;
