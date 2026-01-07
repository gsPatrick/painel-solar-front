'use client';

export default function FullscreenLayout({ children }) {
    return (
        <main style={{
            minHeight: '100vh',
            width: '100vw',
            overflow: 'hidden',
        }}>
            {children}
        </main>
    );
}
