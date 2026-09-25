const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const ContactosTableSkeleton = () => (
    <div className="space-y-3 px-5 pb-5">
        {Array.from({ length: 8 }).map((_, i) => (
            <Bar key={i} className="h-10 w-full bg-gray-100 dark:bg-gray-800" />
        ))}
    </div>
);

export default ContactosTableSkeleton;
