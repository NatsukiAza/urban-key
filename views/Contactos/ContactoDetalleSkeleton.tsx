const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const Campo = () => (
    <div className="space-y-2">
        <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800" />
        <Bar className="h-5 w-28 bg-gray-100 dark:bg-gray-800" />
    </div>
);

const ContactoDetalleSkeleton = () => (
    <div className="space-y-5">
        <div className="panel">
            <div className="flex flex-wrap items-start justify-between gap-3">
                <Bar className="h-7 w-56 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-10 w-24 bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className="mt-5 grid gap-4 border-t border-white-light pt-5 dark:border-[#1b2e4b] sm:grid-cols-3">
                {Array.from({ length: 3 }).map((_, i) => (
                    <Campo key={i} />
                ))}
            </div>
        </div>

        <div className="panel space-y-3">
            <Bar className="mb-2 h-6 w-24 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-4 w-2/3 bg-gray-100 dark:bg-gray-800" />
        </div>

        <div className="panel space-y-3">
            <Bar className="mb-2 h-6 w-40 bg-gray-200 dark:bg-gray-700" />
            <Bar className="h-24 w-full bg-gray-100 dark:bg-gray-800" />
            {Array.from({ length: 2 }).map((_, i) => (
                <Bar key={i} className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
            ))}
        </div>
    </div>
);

export default ContactoDetalleSkeleton;
