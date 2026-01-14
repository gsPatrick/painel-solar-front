'use client';

import { createContext, useContext, useState, useEffect } from 'react';
import { usePathname } from 'next/navigation';

const SidebarContext = createContext({
    isOpen: false,
    toggle: () => { },
    close: () => { }
});

export function SidebarProvider({ children }) {
    const [isOpen, setIsOpen] = useState(false);
    const pathname = usePathname();

    const toggle = () => setIsOpen(prev => !prev);
    const close = () => setIsOpen(false);

    // Close sidebar on route change (mobile)
    useEffect(() => {
        close();
    }, [pathname]);

    return (
        <SidebarContext.Provider value={{ isOpen, toggle, close }}>
            {children}
        </SidebarContext.Provider>
    );
}

export const useSidebar = () => useContext(SidebarContext);
