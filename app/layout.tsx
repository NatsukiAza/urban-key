import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import Providers from '@/components/providers';
import './globals.css';

const nunito = Nunito({
    subsets: ['latin'],
    variable: '--font-nunito',
    display: 'swap',
});

export const metadata: Metadata = {
    title: 'UrbanKey — CRM',
    description: 'Urban Key CRM dashboard',
};

export default function RootLayout({ children }: LayoutProps<'/'>) {
    return (
        <html lang="en" className={`${nunito.variable} h-full`}>
            <body className={`${nunito.className} min-h-full`}>
                <Providers>{children}</Providers>
            </body>
        </html>
    );
}
