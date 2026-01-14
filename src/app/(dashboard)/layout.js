'use client';

import Sidebar from '@/components/layout/Sidebar/Sidebar';
import { SidebarProvider, useSidebar } from '@/contexts/SidebarContext';

function DashboardContent({ children }) {
    const { isOpen } = useSidebar();

    return (
        <>
            <Sidebar />
            <main style={{
                marginLeft: 'var(--sidebar-width)',
                minHeight: '100vh',
                paddingTop: 'var(--header-height)',
                transition: 'margin-left 0.3s ease',
                // On mobile, sidebar is fixed overlay, so no margin needed
                // But we handle this via CSS media query usually, or inline style check
                // For simplicity, we'll keep the variable but override it in global css or let CSS handle it
            }}
                className="dashboard-main"
            >
                {children}
            </main>
            <style jsx global>{`
                @media (max-width: 1024px) {
                    .dashboard-main {
                        margin-left: 0 !important;
                    }
                }
            `}</style>
        </>
    );
}

export default function DashboardLayout({ children }) {
    return (
        <SidebarProvider>
            <DashboardContent>{children}</DashboardContent>
        </SidebarProvider>
    );
}
