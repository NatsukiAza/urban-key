const COLUMNAS = ['Propiedad', 'Propietario', 'Operación & Tipo', 'Distribución', 'Superficie', 'Precio', 'Estado', ''];
const ALINEADAS_DERECHA = ['Superficie', 'Precio'];
const ANCHOS = ['w-44', 'w-28', 'w-32', 'w-16', 'w-14', 'w-24', 'w-20', 'w-8'];

const Filas = () => (
    <div className="datatables tabla-lista" aria-busy="true" aria-label="Cargando inmuebles">
        <div className="overflow-x-auto">
            <table className="w-full whitespace-nowrap">
                <thead>
                    <tr>
                        {COLUMNAS.map((c, i) => (
                            <th key={i} className={`text-left ${ALINEADAS_DERECHA.includes(c) ? '!text-right' : ''} ${i === 0 ? '!text-uk-ink dark:!text-uk-ink-dark' : ''}`}>
                                {c}
                            </th>
                        ))}
                    </tr>
                </thead>
                <tbody>
                    {Array.from({ length: 8 }).map((_, f) => (
                        <tr key={f}>
                            {ANCHOS.map((ancho, i) => (
                                <td key={i}>
                                    <div className={`h-4 animate-pulse rounded bg-gray-100 dark:bg-gray-800 ${ancho} ${ALINEADAS_DERECHA.includes(COLUMNAS[i]) ? 'ml-auto' : ''}`} />
                                </td>
                            ))}
                        </tr>
                    ))}
                </tbody>
            </table>
        </div>
    </div>
);

const InmueblesTableSkeleton = ({ soloFilas = false }: { soloFilas?: boolean }) => {
    if (soloFilas) return <Filas />;
    return (
        <div className="panel">
            <div className="mb-5 h-9 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <Filas />
        </div>
    );
};

export default InmueblesTableSkeleton;
