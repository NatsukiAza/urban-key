const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Fila = () => (
    <div className="flex min-h-[56px] items-center gap-3 rounded-[10px] border border-uk-line px-3 dark:border-uk-line-dark">
        <Bar className="h-6 w-6 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-4 w-48 bg-gray-200 dark:bg-gray-700" />
        <Bar className="ml-auto h-4 w-20 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-10 w-10 rounded-[9px] bg-gray-100 dark:bg-gray-800" />
    </div>
);

const Panel = ({ filas }: { filas: number }) => (
    <div className="space-y-3.5 rounded-[14px] border border-uk-line bg-white px-6 pb-6 pt-5 dark:border-[#232C45] dark:bg-uk-card-dark">
        <div className="space-y-2">
            <Bar className="h-5 w-40 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-3 w-80 max-w-full bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-2">
            {Array.from({ length: filas }).map((_, i) => (
                <Fila key={i} />
            ))}
        </div>
    </div>
);

const ConfiguracionSkeleton = () => (
    <div className="mx-auto flex max-w-[1080px] flex-col gap-5" aria-busy="true">
        <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
                <Bar className="h-8 w-72 max-w-full bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-4 w-96 max-w-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <Bar className="h-[42px] w-40 rounded-[10px] bg-gray-200 dark:bg-gray-700" />
        </div>
        <div className="flex gap-4 border-b border-uk-line pb-3 dark:border-uk-line-dark">
            {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className="h-5 w-32 bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
        <Panel filas={5} />
        <Panel filas={2} />
    </div>
);

export default ConfiguracionSkeleton;
