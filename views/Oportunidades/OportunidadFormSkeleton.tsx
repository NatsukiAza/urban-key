const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = ({ className = '' }: { className?: string }) => (
    <div className={`space-y-2 ${className}`}>
        <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
    </div>
);

const OportunidadFormSkeleton = () => (
    <div className="panel max-w-3xl">
        <Bar className="mb-5 h-7 w-52 bg-gray-200 dark:bg-gray-700" />
        <div className="grid grid-cols-1 gap-5 sm:grid-cols-2">
            <Campo className="sm:col-span-2" />
            {Array.from({ length: 8 }).map((_, i) => (
                <Campo key={i} />
            ))}
            <div className="space-y-2 sm:col-span-2">
                <Bar className="h-3 w-24 bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-24 w-full bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="mt-2 flex justify-end gap-4 sm:col-span-2">
                <Bar className="h-10 w-24 bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-10 w-36 bg-gray-200 dark:bg-gray-700" />
            </div>
        </div>
    </div>
);

export default OportunidadFormSkeleton;
