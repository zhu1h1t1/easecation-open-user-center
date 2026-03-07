import React, { createContext, useCallback, useContext, useEffect, useMemo, useState } from 'react';
import type { ReactNode } from 'react';
import useSystemDarkMode from '../hooks/useSystemDarkMode';

export type CustomThemeName = 'blackOrange' | 'whiteMinimal';

export interface ThemeColorConfig {
    light: string;
    dark?: string;
    custom?: Partial<Record<CustomThemeName, string>>;
}

interface ThemeContextType {
    isDark: boolean;
    customTheme: CustomThemeName | null;
    isCustomThemeActive: boolean;
    activateCustomTheme: (theme: CustomThemeName) => void;
    deactivateCustomTheme: () => void;
    getThemeColor: (config: ThemeColorConfig) => string;
}

const CUSTOM_THEME_STORAGE_KEY = 'ec-custom-theme';
const CUSTOM_THEME_MODE: Record<CustomThemeName, 'light' | 'dark'> = {
    blackOrange: 'dark',
    whiteMinimal: 'light',
};

const ThemeContext = createContext<ThemeContextType | undefined>(undefined);

const readStoredTheme = (): CustomThemeName | null => {
    if (typeof window === 'undefined') return null;
    const stored = window.localStorage.getItem(CUSTOM_THEME_STORAGE_KEY);
    if (stored === 'blackOrange' || stored === 'whiteMinimal') {
        return stored;
    }
    return null;
};

export const ThemeProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const systemPrefersDark = useSystemDarkMode();
    const [customTheme, setCustomTheme] = useState<CustomThemeName | null>(readStoredTheme);

    const customThemeMode = customTheme ? CUSTOM_THEME_MODE[customTheme] : null;
    const isDark = customThemeMode ? customThemeMode === 'dark' : systemPrefersDark;

    useEffect(() => {
        if (typeof window === 'undefined') return;
        if (customTheme) {
            window.localStorage.setItem(CUSTOM_THEME_STORAGE_KEY, customTheme);
        } else {
            window.localStorage.removeItem(CUSTOM_THEME_STORAGE_KEY);
        }
    }, [customTheme]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;

        if (customTheme) {
            root.setAttribute('data-custom-theme', customTheme);
        } else {
            root.removeAttribute('data-custom-theme');
        }
    }, [customTheme]);

    useEffect(() => {
        if (typeof document === 'undefined') return;
        const root = document.documentElement;
        root.setAttribute('data-theme', isDark ? 'dark' : 'light');
        root.style.colorScheme = isDark ? 'dark' : 'light';
    }, [isDark]);

    const activateCustomTheme = useCallback((themeName: CustomThemeName) => {
        setCustomTheme(themeName);
    }, []);

    const deactivateCustomTheme = useCallback(() => {
        setCustomTheme(null);
    }, []);

    const getThemeColor = useCallback(
        (config: ThemeColorConfig): string => {
            if (customTheme) {
                const customColor = config.custom?.[customTheme];
                if (customColor) {
                    return customColor;
                }
            }

            if (isDark) {
                return config.dark ?? config.light;
            }

            return config.light;
        },
        [customTheme, isDark]
    );

    const value = useMemo(
        () => ({
            isDark,
            customTheme,
            isCustomThemeActive: Boolean(customTheme),
            activateCustomTheme,
            deactivateCustomTheme,
            getThemeColor,
        }),
        [activateCustomTheme, customTheme, deactivateCustomTheme, getThemeColor, isDark]
    );

    return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = (): ThemeContextType => {
    const ctx = useContext(ThemeContext);
    if (!ctx) {
        throw new Error('useTheme must be used within a ThemeProvider');
    }
    return ctx;
};
