import { useState, useEffect } from 'react';
import { fetchData } from '../axiosConfig';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';

const CACHE_KEY = 'player_basic_cache';
const CACHE_EXPIRY_KEY = 'player_basic_cache_expiry';
const CACHE_DURATION = 5 * 60 * 1000; // 5分钟缓存

interface CacheData {
    [ecid: string]: {
        data: BindPlayerDetailBasic;
        timestamp: number;
    };
}

export const usePlayerBasicCache = (ecid?: string) => {
    const [player, setPlayer] = useState<BindPlayerDetailBasic | undefined>(() => {
        // 初始化时检查缓存
        if (ecid) {
            try {
                const cached = localStorage.getItem(CACHE_KEY);
                if (cached) {
                    const cacheData: CacheData = JSON.parse(cached);
                    const cachedData = cacheData[ecid];
                    if (cachedData && Date.now() - cachedData.timestamp < CACHE_DURATION) {
                        return cachedData.data;
                    }
                }
            } catch {
                // 忽略缓存错误
            }
        }
        return undefined;
    });
    const [spinning, setSpinning] = useState<boolean>(false);

    const getCache = (): CacheData => {
        try {
            const cached = localStorage.getItem(CACHE_KEY);
            return cached ? JSON.parse(cached) : {};
        } catch {
            return {};
        }
    };

    const setCache = (cacheData: CacheData) => {
        localStorage.setItem(CACHE_KEY, JSON.stringify(cacheData));
    };

    const isCacheValid = (timestamp: number): boolean => {
        return Date.now() - timestamp < CACHE_DURATION;
    };

    const fetchPlayerBasic = async (forceRefresh = false) => {
        if (!ecid) return;

        setSpinning(true);

        try {
            const cache = getCache();
            const cachedData = cache[ecid];

            // 如果有有效缓存且不强制刷新，使用缓存
            if (!forceRefresh && cachedData && isCacheValid(cachedData.timestamp)) {
                setPlayer(cachedData.data);
                setSpinning(false);
                return;
            }

            // 获取新数据
            await fetchData({
                url: '/ec/basic',
                method: 'GET',
                data: { ecid },
                setData: rep => {
                    const playerData = rep.data;
                    setPlayer(playerData);

                    // 更新缓存
                    cache[ecid] = {
                        data: playerData,
                        timestamp: Date.now(),
                    };
                    setCache(cache);
                },
            });

            setSpinning(false);
        } catch {
            // 忽略获取玩家数据错误
            setSpinning(false);
        }
    };

    // 页面刷新时清除缓存
    useEffect(() => {
        const handleBeforeUnload = () => {
            try {
                localStorage.removeItem(CACHE_KEY);
                localStorage.removeItem(CACHE_EXPIRY_KEY);
            } catch {
                // 忽略缓存清除错误
            }
        };

        window.addEventListener('beforeunload', handleBeforeUnload);
        return () => window.removeEventListener('beforeunload', handleBeforeUnload);
    }, []);

    // 当 ecid 变化时获取数据
    useEffect(() => {
        if (ecid) {
            // 先检查缓存，如果有有效缓存就直接使用
            const cache = getCache();
            const cachedData = cache[ecid];

            if (cachedData && isCacheValid(cachedData.timestamp)) {
                setPlayer(cachedData.data);
            } else {
                fetchPlayerBasic();
            }
        }
    }, [ecid]);

    const clearCache = (targetEcid?: string) => {
        const cache = getCache();
        if (targetEcid) {
            // 清除特定玩家的缓存
            delete cache[targetEcid];
            setCache(cache);
        } else {
            // 清除所有缓存
            localStorage.removeItem(CACHE_KEY);
        }
    };

    return {
        player,
        spinning,
        fetchPlayerBasic,
        clearCache,
        setPlayer,
    };
};
