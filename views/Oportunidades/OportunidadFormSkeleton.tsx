const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = ({ className = '' }: { className?: string }) => (
    <div className={`space-y-2 ${className}`}>
        <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-[42px] w-full rounded-[9px] bg-gray-100 dark:bg-gray-800" />
    </div>
);

const Bloque = ({ campos, ancho = false, ultimo = false }: { campos: number; ancho?: boolean; ultimo?: boolean }) => (
    <div className={`flex flex-wrap gap-6 p-6 ${ultimo ? '' : 'border-b border-uk-col dark:border-[#232C45]'}`}>
        <div className="flex max-w-[240px] flex-[1_1_200px] flex-col gap-2">
            <Bar className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-3 w-full bg-gray-100 dark:bg-gray-800" />
            <Bar className="h-3 w-3/4 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="grid min-w-0 flex-[999_1_420px] grid-cols-1 gap-5 md:grid-cols-2">
            {ancho ? <Campo className="md:col-span-2" /> : null}
            {Array.from({ length: campos }).map((_, i) => (
                <Campo key={i} />
            ))}
        </div>
    </div>
);

const OportunidadFormSkeleton = () => (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-5" aria-busy="true">
        <div className="space-y-2">
            <Bar className="h-8 w-64 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-4 w-72 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="rounded-[14px] border border-uk-line bg-white dark:border-[#232C45] dark:bg-uk-card-dark">
            <Bloque ancho campos={3} />
            <Bloque campos={2} />
            <Bloque ancho campos={2} />
            <Bloque ancho campos={0} ultimo />
            <div className="flex justify-end gap-2 border-t border-uk-line px-6 py-4 dark:border-[#232C45]">
                <Bar className="h-[42px] w-24 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-[42px] w-40 rounded-[10px] bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    </div>
);

export default OportunidadFormSkeleton;
