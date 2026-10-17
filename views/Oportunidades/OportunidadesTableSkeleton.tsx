const Barra = ({ className }: { className: string }) => <div className={`animate-pulse rounded bg-gray-100 dark:bg-gray-800 ${className}`} />;

const Filas = () => (
    <div className="px-5 pb-5" aria-busy="true">
        {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="flex items-center gap-4 border-t border-uk-col py-3.5 dark:border-uk-line-dark">
                <Barra className="h-4 w-40" />
                <Barra className="hidden h-4 w-28 sm:block" />
                <Barra className="hidden h-4 w-40 lg:block" />
                <Barra className="h-[26px] w-[26px] rounded-full" />
                <Barra className="h-8 w-32" />
                <Barra className="h-6 w-20 rounded-full" />
                <Barra className="ml-auto h-4 w-24" />
                <Barra className="hidden h-[34px] w-[146px] md:block" />
            </div>
        ))}
    </div>
);

const OportunidadesTableSkeleton = ({ soloFilas = false }: { soloFilas?: boolean }) => {
    if (soloFilas) return <Filas />;
    return (
        <div aria-busy="true">
            <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
                <div className="space-y-2">
                    <div className="h-8 w-56 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
                    <div className="h-4 w-48 animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex gap-3">
                    <div className="h-[42px] w-40 animate-pulse rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <div className="h-[42px] w-44 animate-pulse rounded-[10px] bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
            <div className="panel !p-0 !rounded-[14px]">
                <div className="flex flex-wrap gap-2 border-b border-uk-line px-5 py-4 dark:border-uk-line-dark">
                    <Barra className="h-[38px] w-full sm:w-[320px]" />
                    <Barra className="hidden h-[38px] w-[170px] sm:block" />
                    <Barra className="hidden h-[38px] w-[170px] sm:block" />
                    <Barra className="h-[38px] w-28" />
                </div>
                <Filas />
            </div>
        </div>
    );
};

export default OportunidadesTableSkeleton;
