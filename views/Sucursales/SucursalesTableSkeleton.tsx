const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const SucursalesTableSkeleton = () => (
    <div className="panel border-white-light px-0 dark:border-[#1b2e4b]">
        <div className="mb-5 flex flex-col gap-4 px-5 md:flex-row md:items-center">
            <div className="flex-1 space-y-2">
                <Bar className="h-6 w-56 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-4 w-72 bg-gray-100 dark:bg-gray-800" />
            </div>
            <Bar className="h-10 w-40 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="space-y-3 px-5 pb-5">
            {Array.from({ length: 6 }).map((_, i) => (
                <Bar key={i} className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
    </div>
);

export default SucursalesTableSkeleton;
