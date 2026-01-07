'use client';

import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext(null);

export function useTheme() {
    const context = useContext(ThemeContext);
    if (!context) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return context;
}

export function ThemeProvider({ children }) {
    const [theme, setTheme] = useState('light');
    const [primaryColor, setPrimaryColor] = useState('#4318FF');
    const [settings, setSettings] = useState({
        companyName: 'DGE Energia Solar',
        notifyOverdue: true,
        notifySla: true,
        notifyNewLead: true,
    });

    useEffect(() => {
        // Load from localStorage
        const savedTheme = localStorage.getItem('theme') || 'light';
        const savedColor = localStorage.getItem('primaryColor') || '#4318FF';
        const savedSettings = localStorage.getItem('settings');

        setTheme(savedTheme);
        setPrimaryColor(savedColor);
        if (savedSettings) {
            setSettings(JSON.parse(savedSettings));
        }

        // Apply theme
        document.documentElement.setAttribute('data-theme', savedTheme);
        document.documentElement.style.setProperty('--color-primary-custom', savedColor);
    }, []);

    const toggleTheme = () => {
        const newTheme = theme === 'light' ? 'dark' : 'light';
        setTheme(newTheme);
        localStorage.setItem('theme', newTheme);
        document.documentElement.setAttribute('data-theme', newTheme);
    };

    const updatePrimaryColor = (color) => {
        setPrimaryColor(color);
        localStorage.setItem('primaryColor', color);
        document.documentElement.style.setProperty('--color-primary-custom', color);
    };

    const updateSettings = (newSettings) => {
        setSettings(newSettings);
        localStorage.setItem('settings', JSON.stringify(newSettings));
    };

    return (
        <ThemeContext.Provider value={{
            theme,
            toggleTheme,
            primaryColor,
            updatePrimaryColor,
            settings,
            updateSettings,
        }}>
            {children}
        </ThemeContext.Provider>
    );
}

export default ThemeProvider;
