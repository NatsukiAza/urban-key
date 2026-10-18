const Bar = ({ className }: { className: string }) => <div className={`animate-pulse rounded ${className}`} />;

const tarjeta = 'rounded-[14px] border border-uk-line bg-white shadow-[0_2px_4px_rgba(30,15,40,.14)] dark:border-[#232C45] dark:bg-uk-card-dark dark:shadow-none';

const FichaSkeleton = ({ cuadrado = false, etiqueta }: { cuadrado?: boolean; etiqueta: string }) => (
    <div className="mx-auto flex max-w-[1240px] flex-col gap-5" aria-busy="true" aria-label={etiqueta}>
        <section className={`${tarjeta} flex flex-col gap-5 p-6`}>
            <div className="flex flex-wrap items-center justify-between gap-4">
                <div className="flex items-center gap-4">
                    <Bar className={`h-[60px] w-[60px] bg-gray-100 dark:bg-gray-800 ${cuadrado ? 'rounded-[14px]' : '!rounded-full'}`} />
                    <div className="space-y-2">
                        <Bar className="h-8 w-56 bg-gray-200 dark:bg-gray-700" />
                        <Bar className="h-5 w-40 bg-gray-100 dark:bg-gray-800" />
                    </div>
                </div>
                <div className="flex gap-2">
                    <Bar className="h-10 w-10 rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                    <Bar className="h-10 w-36 rounded-[10px] bg-gray-200 dark:bg-gray-700" />
                </div>
            </div>
            <div className="grid grid-cols-2 gap-4 border-t border-uk-col pt-[18px] dark:border-[#232C45] lg:grid-cols-4">
                {Array.from({ length: 4 }).map((_, i) => (
                    <div key={i} className="space-y-2">
                        <Bar className="h-3 w-20 bg-gray-100 dark:bg-gray-800" />
                        <Bar className="h-5 w-28 bg-gray-200 dark:bg-gray-700" />
                    </div>
                ))}
            </div>
        </section>
        <div className="flex flex-wrap items-start gap-5">
            <div className={`${tarjeta} min-w-0 flex-[999_1_520px] space-y-3 px-6 py-5`}>
                <Bar className="h-6 w-40 bg-gray-200 dark:bg-gray-700" />
                <Bar className="h-[66px] w-full rounded-[10px] bg-gray-100 dark:bg-gray-800" />
                <Bar className="h-[66px] w-full rounded-[10px] bg-gray-100 dark:bg-gray-800" />
            </div>
            <div className={`${tarjeta} min-w-0 flex-[1_1_320px] space-y-4 p-5`}>
                <Bar className="h-5 w-24 bg-gray-200 dark:bg-gray-700" />
                <div className="grid grid-cols-2 gap-4">
                    {Array.from({ length: 6 }).map((_, i) => (
                        <div key={i} className="space-y-2">
                            <Bar className="h-3 w-16 bg-gray-100 dark:bg-gray-800" />
                            <Bar className="h-4 w-24 bg-gray-200 dark:bg-gray-700" />
                        </div>
                    ))}
                </div>
            </div>
        </div>
    </div>
);

export default FichaSkeleton;
