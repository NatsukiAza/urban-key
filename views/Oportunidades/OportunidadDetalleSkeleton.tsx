const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Dato = () => (
    <div className="space-y-2">
        <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-5 w-32 bg-gray-100 dark:bg-gray-800" />
    </div>
);

const OportunidadDetalleSkeleton = () => (
    <div className="space-y-5" aria-busy="true">
        <div className="panel flex flex-col gap-6 !rounded-[14px] !p-6">
            <div className="flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <div className="flex items-center gap-3">
                        <Bar className="h-8 w-64 bg-gray-200 dark:bg-gray-700" />
                        <Bar className="h-6 w-20 rounded-full bg-gray-100 dark:bg-gray-800" />
                    </div>
                    <Bar className="h-3 w-72 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="flex gap-2">
                    <Bar className="h-10 w-10 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <Bar className="h-10 w-32 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <Bar className="h-10 w-32 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <Bar className="h-10 w-44 rounded-[10px] bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
            <div className="flex gap-2 overflow-hidden">
                {Array.from({ length: 6 }).map((_, i) => (
                    <Bar key={i} className="h-11 min-w-[96px] flex-1 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                ))}
            </div>
            <div className="grid gap-5 border-t border-uk-line pt-5 dark:border-uk-line-dark sm:grid-cols-2 lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <Dato key={i} />
                ))}
            </div>
        </div>

        <div className="flex flex-wrap items-start gap-5">
            <div className="panel min-w-0 flex-[2_1_480px] space-y-4 !p-6">
                <Bar className="h-6 w-48 bg-gray-200 dark:bg-gray-700" />
                {Array.from({ length: 3 }).map((_, i) => (
                    <div key={i} className="space-y-2 pl-7">
                        <Bar className="h-4 w-56 bg-gray-100 dark:bg-gray-800" />
                        <Bar className="h-3 w-40 bg-gray-100 dark:bg-gray-800" />
                    </div>
                ))}
            </div>
            <div className="flex min-w-0 flex-[1_1_320px] flex-col gap-5">
                <div className="panel space-y-3 !p-6">
                    <Bar className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
                    <Bar className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
                    <Bar className="h-4 w-40 bg-gray-100 dark:bg-gray-800" />
                </div>
                <div className="panel grid grid-cols-2 gap-4 !p-6">
                    <Bar className="col-span-2 h-5 w-24 bg-gray-200 dark:bg-gray-700" />
                    {Array.from({ length: 4 }).map((_, i) => (
                        <Dato key={i} />
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default OportunidadDetalleSkeleton;
