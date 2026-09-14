'use client';

import { Provider } from 'react-redux';
import { MantineProvider } from '@mantine/core';
import store from '@/store';
import '@/lib/i18n';

export default function Providers({ children }: { children: React.ReactNode }) {
    return (
        <Provider store={store}>
            <MantineProvider withNormalizeCSS={false} withGlobalStyles={false}>
                {children}
            </MantineProvider>
        </Provider>
    );
}
