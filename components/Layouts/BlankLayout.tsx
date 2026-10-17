'use client';
import { PropsWithChildren } from 'react';
import App from '../theme-shell';

const BlankLayout = ({ children }: PropsWithChildren) => {
    return (
        <App>
            <div className="text-black dark:text-uk-muted-dark min-h-screen">{children} </div>
        </App>
    );
};

export default BlankLayout;
