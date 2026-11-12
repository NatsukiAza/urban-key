'use client';
import { Dialog } from '@headlessui/react';
import type { Sucursal } from '@/lib/sucursal/types';
import SucursalForm from './SucursalForm';

const SucursalModal = ({ sucursal, onCerrar }: { sucursal?: Sucursal; onCerrar: () => void }) => (
    <Dialog open onClose={onCerrar} className="relative z-[51]">
        <div className="fixed inset-0 bg-black/60" aria-hidden="true" />
        <div className="fixed inset-0 overflow-y-auto">
            <div className="flex min-h-full items-center justify-center p-4">
                <Dialog.Panel className="panel w-full max-w-xl rounded-[14px] text-uk-ink dark:border dark:border-[#232C45] dark:bg-uk-card-dark dark:text-uk-ink-dark">
                    <Dialog.Title className="mb-5 text-xl font-extrabold text-uk-ink dark:text-uk-ink-dark">{sucursal ? 'Editar sucursal' : 'Nueva sucursal'}</Dialog.Title>
                    <SucursalForm sucursal={sucursal} onCerrar={onCerrar} />
                </Dialog.Panel>
            </div>
        </div>
    </Dialog>
);

export default SucursalModal;
