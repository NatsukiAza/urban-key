const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const ConfiguracionSkeleton = () => (
    <div>
        <div className="mb-5 flex flex-wrap items-end justify-between gap-3">
            <div className="space-y-2">
                <Bar className="h-6 w-56 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-4 w-80 bg-gray-100 dark:bg-gray-800" />
            </div>
            <Bar className="h-10 w-36 bg-gray-100 dark:bg-gray-800" />
        </div>
        <div className="panel space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
                <Bar key={i} className="h-12 w-full bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
    </div>
);

export default ConfiguracionSkeleton;
