const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Tarjeta = () => (
    <div className="mb-3 space-y-2 rounded-md border border-white-light bg-white p-3 shadow-sm ltr:border-l-4 dark:border-[#1b2e4b] dark:bg-black">
        <Bar className="h-4 w-3/4 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-3 w-1/2 bg-gray-100 dark:bg-gray-800" />
        <div className="flex items-center justify-between pt-1">
            <Bar className="h-4 w-20 bg-gray-100 dark:bg-gray-800" />
            <Bar className="h-7 w-7 rounded-full bg-gray-100 dark:bg-gray-800" />
        </div>
    </div>
);

const Columna = () => (
    <div className="panel w-80 flex-none border-t-4 border-t-primary bg-primary/[0.04]">
        <div className="mb-5 flex justify-between">
            <Bar className="h-5 w-32 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-5 w-6 bg-gray-100 dark:bg-gray-800" />
        </div>
        {Array.from({ length: 3 }).map((_, i) => (
            <Tarjeta key={i} />
        ))}
    </div>
);

const OportunidadBoardSkeleton = () => (
    <div className="flex h-[calc(100dvh-10rem)] flex-col">
        <div className="mb-5 space-y-2">
            <Bar className="h-7 w-64 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-4 w-72 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="mb-5 flex flex-wrap items-center justify-between gap-3">
            <Bar className="h-10 w-72 bg-gray-100 dark:bg-gray-800" />
            <Bar className="h-10 w-28 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="min-h-0 flex-1 overflow-hidden">
            <div className="flex items-start flex-nowrap gap-5 pb-2">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Columna key={i} />
                ))}
            </div>
        </div>
    </div>
);

export default OportunidadBoardSkeleton;
