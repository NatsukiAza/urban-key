const Filas = () => (
    <div className="space-y-3 px-5 pb-5">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
        ))}
    </div>
);

const OportunidadesTableSkeleton = ({ soloFilas = false }: { soloFilas?: boolean }) => {
    if (soloFilas) return <Filas />;
    return (
        <div className="panel">
            <div className="mb-5 h-9 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <Filas />
        </div>
    );
};

export default OportunidadesTableSkeleton;
