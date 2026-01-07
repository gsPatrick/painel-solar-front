'use client';

import Sidebar from '@/components/layout/Sidebar/Sidebar';

export default function DashboardLayout({ children }) {
    return (
        <>
            <Sidebar />
            <main style={{
                marginLeft: 'var(--sidebar-width)',
                minHeight: '100vh',
                paddingTop: 'var(--header-height)',
            }}>
                {children}
            </main>
        </>
    );
}
