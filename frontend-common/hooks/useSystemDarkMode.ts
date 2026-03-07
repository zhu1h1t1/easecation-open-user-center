import { useEffect, useState } from 'react';

const getPreferredDark = () =>
    typeof window !== 'undefined' &&
    typeof window.matchMedia === 'function' &&
    window.matchMedia('(prefers-color-scheme: dark)').matches;

const useSystemDarkMode = () => {
    const [isDarkMode, setIsDarkMode] = useState<boolean>(getPreferredDark);

    useEffect(() => {
        if (!window?.matchMedia) return;
        const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
        const handleChange = () => setIsDarkMode(mediaQuery.matches);

        if (typeof mediaQuery.addEventListener === 'function') {
            mediaQuery.addEventListener('change', handleChange);
            return () => mediaQuery.removeEventListener('change', handleChange);
        }

        mediaQuery.addListener(handleChange);
        return () => mediaQuery.removeListener(handleChange);
    }, []);

    return isDarkMode;
};

export default useSystemDarkMode;
