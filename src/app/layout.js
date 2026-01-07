'use client';

import { ThemeProvider } from '@/contexts/ThemeContext';
import { ToastProvider } from '@/components/shared/Toast/Toast';
import { NotificationProvider } from '@/contexts/NotificationContext';
import AiPauseModal from '@/components/shared/AiPauseModal/AiPauseModal';
import '@/styles/globals.css';

export default function RootLayout({ children }) {
  return (
    <html lang="pt-BR">
      <head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700;800&display=swap"
          rel="stylesheet"
        />
      </head>
      <body>
        <ThemeProvider>
          <ToastProvider>
            <NotificationProvider>
              <AiPauseModal />
              {children}
            </NotificationProvider>
          </ToastProvider>
        </ThemeProvider>
      </body>
    </html>
  );
}
