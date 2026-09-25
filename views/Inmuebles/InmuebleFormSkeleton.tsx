const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = () => (
    <div className="space-y-2">
        <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
    </div>
);

const InmuebleFormSkeleton = () => (
    <div className="panel max-w-4xl">
        <Bar className="mb-5 h-7 w-48 bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-3">
            <Bar className="h-4 w-32 bg-gray-200 dark:bg-gray-700 sm:col-span-2 lg:col-span-3" />
            {Array.from({ length: 4 }).map((_, i) => (
                <Campo key={`id-${i}`} />
            ))}
            <Bar className="mt-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 sm:col-span-2 lg:col-span-3" />
            {Array.from({ length: 6 }).map((_, i) => (
                <Campo key={`car-${i}`} />
            ))}
            <Bar className="mt-2 h-4 w-32 bg-gray-200 dark:bg-gray-700 sm:col-span-2 lg:col-span-3" />
            {Array.from({ length: 3 }).map((_, i) => (
                <Campo key={`val-${i}`} />
            ))}
            <div className="sm:col-span-2 lg:col-span-3">
                <Bar className="h-24 w-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="mt-2 flex justify-end gap-4 sm:col-span-2 lg:col-span-3">
                <Bar className="h-10 w-24 bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-10 w-32 bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    </div>
);

export default InmuebleFormSkeleton;
