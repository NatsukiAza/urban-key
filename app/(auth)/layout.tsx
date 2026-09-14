'use client';

import BlankLayout from '@/components/Layouts/BlankLayout';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
    return <BlankLayout>{children}</BlankLayout>;
}
