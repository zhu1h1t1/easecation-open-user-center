import { useTheme } from '../contexts/ThemeContext';

const useDarkMode = () => {
    const { isDark } = useTheme();
    return isDark;
};

export default useDarkMode;
