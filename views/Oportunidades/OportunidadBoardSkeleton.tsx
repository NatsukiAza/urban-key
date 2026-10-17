const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Tarjeta = () => (
    <div className="flex flex-col gap-2 rounded-[10px] border border-uk-line bg-white p-3 dark:border-uk-line-dark dark:bg-uk-card-raised-dark">
        <Bar className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-3 w-2/3 bg-gray-100 dark:bg-gray-800" />
        <div className="flex items-center justify-between border-t border-uk-col pt-2 dark:border-uk-line-dark">
            <Bar className="h-4 w-20 bg-gray-100 dark:bg-gray-800" />
            <Bar className="h-[26px] w-[26px] rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
    </div>
);

const Columna = () => (
    <div className="w-[248px] shrink-0 space-y-2 rounded-xl bg-uk-col p-3 dark:border dark:border-[#1E2740] dark:bg-uk-col-dark">
        <div className="mb-3 space-y-2 px-1">
            <div className="flex justify-between">
                <Bar className="h-4 w-28 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-5 w-6 rounded-full bg-white dark:bg-gray-800" />
            </div>
            <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
        </div>
        {Array.from({ length: 2 }).map((_, i) => (
            <Tarjeta key={i} />
        ))}
    </div>
);

const OportunidadBoardSkeleton = () => (
    <div className="flex h-[calc(100dvh-10rem)] flex-col" aria-busy="true">
        <div className="mb-5 flex flex-wrap items-end justify-between gap-4">
            <div className="space-y-2">
                <Bar className="h-8 w-72 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-4 w-64 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="flex gap-2">
                <Bar className="h-11 w-36 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-10 w-40 rounded-[10px] bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
        <div className="mb-4 flex gap-4 border-b border-uk-line pb-3 dark:border-uk-line-dark">
            {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className="h-5 w-32 bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
            <div className="flex flex-nowrap items-start gap-3 pb-2">
                {Array.from({ length: 5 }).map((_, i) => (
                    <Columna key={i} />
                ))}
            </div>
        </div>
    </div>
);

export default OportunidadBoardSkeleton;
