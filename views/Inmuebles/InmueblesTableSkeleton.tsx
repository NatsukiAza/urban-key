const InmueblesTableSkeleton = () => {
    return (
        <div className="panel">
            <div className="mb-5 h-9 w-40 animate-pulse rounded bg-gray-200 dark:bg-gray-700" />
            <div className="space-y-3">
                {Array.from({ length: 8 }).map((_, i) => (
                    <div key={i} className="h-10 w-full animate-pulse rounded bg-gray-100 dark:bg-gray-800" />
                ))}
            </div>
        </div>
    );
};

export default InmueblesTableSkeleton;
