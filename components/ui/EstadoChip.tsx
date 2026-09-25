const estilos: Record<string, { pill: string; dot: string }> = {
    success: { pill: 'bg-success/10 text-success dark:bg-success/20', dot: 'bg-success' },
    warning: { pill: 'bg-warning/10 text-warning dark:bg-warning/20', dot: 'bg-warning' },
    info: { pill: 'bg-info/10 text-info dark:bg-info/20', dot: 'bg-info' },
    danger: { pill: 'bg-danger/10 text-danger dark:bg-danger/20', dot: 'bg-danger' },
    primary: { pill: 'bg-primary/10 text-primary dark:bg-primary/20', dot: 'bg-primary' },
    secondary: { pill: 'bg-secondary/10 text-secondary dark:bg-secondary/20', dot: 'bg-secondary' },
    dark: { pill: 'bg-dark/10 text-dark dark:bg-white/10 dark:text-white-dark', dot: 'bg-dark dark:bg-white-dark' },
};

const EstadoChip = ({ label, color }: { label: string; color: string }) => {
    const estilo = estilos[color] ?? estilos.dark;
    return (
        <span className={`inline-flex items-center gap-1.5 rounded-full px-2.5 py-1 text-xs font-medium ${estilo.pill}`}>
            <span className={`h-1.5 w-1.5 rounded-full ${estilo.dot}`} />
            {label}
        </span>
    );
};

export default EstadoChip;
