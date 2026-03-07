import type { CustomThemeName } from '../contexts/ThemeContext';

export const CUSTOM_THEME_PALETTES: Record<
    CustomThemeName,
    {
        background: string;
        surface: string;
        surfaceAlt: string;
        border: string;
        accent: string;
        accentSoft: string;
        textPrimary: string;
        textSecondary: string;
        textMuted: string;
        surfaceMuted: string;
        hover: string;
    }
> = {
    blackOrange: {
        background: '#000000',
        surface: '#0d0d0d',
        surfaceAlt: '#141414',
        border: '#1f1f1f',
        accent: '#ff8c1a',
        accentSoft: '#ff8c1a',
        textPrimary: '#ffffff',
        textSecondary: 'rgba(255, 255, 255, 0.85)',
        textMuted: 'rgba(255, 255, 255, 0.65)',
        surfaceMuted: '#050505',
        hover: '#1a1a1a',
    },
    whiteMinimal: {
        background: '#f5f5f5',
        surface: '#ffffff',
        surfaceAlt: '#f9f9f9',
        border: '#e5e5e5',
        accent: '#111111',
        accentSoft: '#3d3d3d',
        textPrimary: '#1a1a1a',
        textSecondary: '#3f3f3f',
        textMuted: 'rgba(17, 17, 17, 0.45)',
        surfaceMuted: '#f0f0f0',
        hover: '#ededed',
    },
};

export const getCustomThemePalette = (theme: CustomThemeName | null) =>
    theme ? CUSTOM_THEME_PALETTES[theme] : null;
