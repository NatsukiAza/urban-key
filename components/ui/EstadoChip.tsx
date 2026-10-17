const estilos: Record<string, { pill: string; dot: string }> = {
    primary: { pill: 'bg-primary-light text-primary dark:bg-white/10 dark:text-uk-link-dark', dot: 'bg-primary dark:bg-uk-link-dark' },
    success: { pill: 'bg-[#E6F6EE] text-uk-won dark:bg-success/10 dark:text-uk-won-dark', dot: 'bg-success' },
    danger: { pill: 'bg-[#FDECEE] text-uk-lost dark:bg-danger/10 dark:text-uk-lost-dark', dot: 'bg-danger' },
    warning: { pill: 'bg-uk-warn-bg text-uk-warn dark:bg-warning/10 dark:text-uk-warn-dark', dot: 'bg-warning' },
    neutral: { pill: 'bg-uk-col text-uk-muted dark:bg-white/5 dark:text-uk-muted-dark', dot: 'bg-uk-muted dark:bg-uk-muted-dark' },
};

const EstadoChip = ({ label, color }: { label: string; color: string }) => {
    const estilo = estilos[color] ?? estilos.neutral;
    return (
        <span className={`inline-flex h-6 items-center gap-1.5 rounded-full px-2.5 text-xs font-extrabold ${estilo.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estilo.dot}`} />
            {label}
        </span>
    );
};

export default EstadoChip;
