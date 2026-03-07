import { useState, useEffect } from 'react';

const useIsPC = () => {
    const [isPC, setIsPC] = useState(window.innerWidth >= 768);

    useEffect(() => {
        const handleResize = () => {
            setIsPC(window.innerWidth >= 1200);
        };

        window.addEventListener('resize', handleResize);
        return () => window.removeEventListener('resize', handleResize);
    }, []);

    return isPC;
};

export default useIsPC;
