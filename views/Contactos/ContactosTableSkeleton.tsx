const Barra = ({ className }: { className: string }) => <div className={`animate-pulse rounded bg-gray-100 dark:bg-gray-800 ${className}`} />;

const ContactosTableSkeleton = () => (
    <div className="datatables tabla-lista" aria-busy="true" aria-label="Cargando contactos">
        <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
                <thead>
                    <tr>
                        <th className="text-left !text-uk-ink dark:!text-uk-ink-dark">Nombre</th>
                        <th className="text-left">Email</th>
                        <th className="text-left">Teléfono</th>
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 8 }).map((_, i) => (
                        <tr key={i}>
                            <td>
                                <div className="flex items-center gap-3">
                                    <Barra className="h-8 w-8 shrink-0 rounded-full" />
                                    <Barra className="h-4 w-36" />
                                </div>
                            </td>
                            <td>
                                <Barra className="h-4 w-48" />
                            </td>
                            <td>
                                <Barra className="h-4 w-28" />
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

export default ContactosTableSkeleton;
