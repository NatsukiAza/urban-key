const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = () => (
    <div className="space-y-2">
        <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
    </div>
);

const SucursalFormSkeleton = () => (
    <div className="panel max-w-xl">
        <Bar className="mb-5 h-7 w-48 bg-gray-200 dark:bg-gray-700" />
        <div className="space-y-5">
            {Array.from({ length: 3 }).map((_, i) => (
                <Campo key={i} />
            ))}
            <div className="flex justify-end gap-4">
                <Bar className="h-10 w-24 bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-10 w-36 bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    </div>
);

export default SucursalFormSkeleton;
