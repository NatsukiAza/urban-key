const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = () => (
    <div className="space-y-2">
        <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-5 w-32 bg-gray-100 dark:bg-gray-800" />
    </div>
);

const SucursalDetalleSkeleton = () => (
    <div className="space-y-5">
        <div className="panel">
            <div className="mb-5 flex flex-wrap items-start justify-between gap-4">
                <div className="space-y-2">
                    <Bar className="h-7 w-56 bg-gray-200 dark:bg-gray-700" />
                    <Bar className="h-5 w-20 bg-gray-100 dark:bg-gray-800" />
                </div>
                <Bar className="h-10 w-24 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
                <Campo />
                <Campo />
            </div>
        </div>

        <div className="panel space-y-3">
            <Bar className="mb-4 h-6 w-56 bg-gray-200 dark:bg-gray-700" />
            {Array.from({ length: 4 }).map((_, i) => (
                <Bar key={i} className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
    </div>
);

export default SucursalDetalleSkeleton;
