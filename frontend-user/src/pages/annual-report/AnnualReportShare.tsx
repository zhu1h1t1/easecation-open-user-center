// Annual Report Share Page - 2025年度报告分享页
import React, { useState, useRef, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import { Button } from 'antd';
import { SoundOutlined, SoundFilled, DoubleRightOutlined } from '@ant-design/icons';
import MinecraftPlayer3D from '../../components/MinecraftPlayer3D/MinecraftPlayer3D';
import { TICKET_TYPE_NAME_MAP } from '@ecuc/shared/constants/ticket.constants';
import './AnnualReport.css';

const ANNUAL_REPORT_BACKGROUND_VIDEO_URL =
    'https://uc.easecation.net/media/annual-report/background-20260304.mp4';

// Share type to determine which pages to show
type ShareType =
    | 'basic-info'
    | 'login-stats'
    | 'game-stats'
    | 'rank-data'
    | 'currency-data'
    | 'social-data'
    | 'ticket-stats'
    | 'ai-evaluation'
    | 'calculate-title'
    | 'all';

// Transformed data structure for display
interface AnnualReportData {
    ecid: string;
    nickname: string;
    firstLoginDate: string;
    yearsWithEC: number;
    skinData?: string;
    geometryData?: string;
    // login-stats
    totalLoginDays: number;
    earliestLoginTime: string;
    latestLoginTime: string;
    totalHours: number;
    longestOnlineDate: string;
    longestOnlineHours: number;
    // game-stats
    totalGames: number;
    totalKills: number;
    totalWins: number;
    winRate: number;
    gameModeStats: Array<{
        game: string;
        ENTER?: number;
        WIN?: number;
        LOSE?: number;
        KILL?: number;
        BED?: number;
        CRYSTAL?: number;
        'PC-KILL'?: number;
    }>;
    replayTotalCount: number;
    replayMostPlayedMap: string;
    replayOverwatchCount: number;
    favoriteMode: string;
    favoriteModeGames: number;
    favoriteModeWinRate: number;
    favoriteModeMaxKills: number;
    favoriteModeMaxStreak: number;
    // rank-data
    versusRank: number;
    versusRankName: string;
    casualRank: number;
    casualRankName: string;
    // currency-data
    currentEcCoin: number;
    currentDiamond: number;
    currentPoint: number;
    rechargeCount: number;
    // social-data
    friendCount: number;
    teammateGames: number;
    bestTeammate: string;
    // ticket-stats
    totalTickets: number;
    ticketTypeCounts: Record<string, number>;
    rewardCount: number;
    unbanCount: number;
    // AI
    personaTitle: string;
    aiEvaluation?: string;
    // calculate-title
    yearTitle?: {
        key: string;
        name: string;
        description: string;
        prefix: string;
    };
}

/**
 * 将工单类型代码转换为文字
 * @param typeCounts 类型统计对象，键为类型代码（如 "AB", "AG"）
 * @returns 转换后的对象，键为类型名称（如 "权限审核", "处罚申诉与减罚申请"）
 */
const convertTicketTypeCounts = (typeCounts: Record<string, number>): Record<string, number> => {
    const converted: Record<string, number> = {};
    Object.entries(typeCounts).forEach(([typeCode, count]) => {
        const typeName = TICKET_TYPE_NAME_MAP[typeCode] || typeCode;
        converted[typeName] = count;
    });
    return converted;
};

const AnnualReportShare: React.FC = () => {
    // State management
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [data, setData] = useState<AnnualReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [isProgressComplete, setIsProgressComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    const [shareType, setShareType] = useState<ShareType>('all');
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const appRef = useRef<HTMLDivElement>(null);

    // Router
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();

    // Touch swipe logic
    const startY = useRef<number>(0);
    const startX = useRef<number>(0);
    const videoRef = useRef<HTMLVideoElement>(null);
    // Calculate total pages dynamically based on available data
    // Base pages: Cover(1) + Login(2) + LoginTime(3, optional) + LongestOnline(4, optional) + Game(5-7, 3 pages) + Rank(8) + Currency(9) + Social(10) + Ticket(11-13, optional) + Keyword(14) + Summary(last page) = 14 + conditionals + 1 summary
    // Optional: LoginTime(3) + LongestOnline(4) + Ticket(11-13, 3 pages)
    // Page 14: 年度关键词 (fixed)
    // Last page: 总结页 (all data summary)
    const totalPages = data
        ? 14 +
          (data.earliestLoginTime || data.latestLoginTime ? 1 : 0) +
          (data.longestOnlineHours > 0 ? 1 : 0) +
          (data.totalTickets > 0 ? 2 : 0) +
          1 // +1 for summary page
        : 1; // Loading page

    // Video playback control - ensure auto loop
    useEffect(() => {
        const video = videoRef.current;
        if (!video) {
            return;
        }

        // Set initial muted state
        video.muted = isMuted;

        // Ensure video plays and loops
        const ensurePlayback = () => {
            if (video.paused && !video.ended) {
                video.play().catch(() => {
                    // Silent fail - browser may block autoplay
                });
            }
        };

        // Handle video ended event - restart playback
        const handleEnded = () => {
            video.currentTime = 0;
            video.play().catch(() => {
                // Silent fail - browser may block autoplay
            });
        };

        // Handle video error - try to reload
        const handleError = () => {
            video.load();
            setTimeout(() => {
                video.play().catch(() => {
                    // Silent fail - browser may block autoplay
                });
            }, 100);
        };

        // Handle video pause - resume playback
        const handlePause = () => {
            if (!video.ended) {
                video.play().catch(() => {
                    // Silent fail - browser may block autoplay
                });
            }
        };

        // Initial play attempt
        video.play().catch(() => {
            // Silent fail - browser may block autoplay
        });

        // Add event listeners
        video.addEventListener('ended', handleEnded);
        video.addEventListener('error', handleError);
        video.addEventListener('pause', handlePause);
        video.addEventListener('loadeddata', ensurePlayback);

        // Periodic check to ensure video is playing
        const playCheckInterval = setInterval(() => {
            if (video.paused && !video.ended) {
                video.play().catch(() => {
                    // Silent fail - browser may block autoplay
                });
            }
        }, 3000);

        return () => {
            video.removeEventListener('ended', handleEnded);
            video.removeEventListener('error', handleError);
            video.removeEventListener('pause', handlePause);
            video.removeEventListener('loadeddata', ensurePlayback);
            clearInterval(playCheckInterval);
        };
    }, [isMuted]);

    // Handle mute toggle
    const handleToggleMute = () => {
        const video = videoRef.current;
        if (video) {
            const newMutedState = !isMuted;
            video.muted = newMutedState;
            setIsMuted(newMutedState);
        }
    };

    // Disable body scroll when component mounts
    useEffect(() => {
        const originalStyle = window.getComputedStyle(document.body).overflow;
        const originalHtmlStyle = window.getComputedStyle(document.documentElement).overflow;

        // Disable scroll
        document.body.style.overflow = 'hidden';
        document.documentElement.style.overflow = 'hidden';

        return () => {
            // Restore scroll on unmount
            document.body.style.overflow = originalStyle;
            document.documentElement.style.overflow = originalHtmlStyle;
        };
    }, []);

    // Fetch share data from token
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get token from URL params
                const token = searchParams.get('token');
                if (!token) {
                    setError(gLang('annualReport.missingShareToken'));
                    setLoading(false);
                    return;
                }

                // Fetch share data
                const response = await axiosInstance.get('/year-summary/share', {
                    params: { token },
                });

                if (response.data.EPF_code !== 200) {
                    setError(
                        response.data.EPF_description || gLang('annualReport.fetchShareFailed')
                    );
                    setLoading(false);
                    return;
                }

                const responseData = response.data.data || {};
                const aiEvaluation = response.data.aiEvaluation;
                const responseType = response.data.type || 'all'; // 从后端响应中获取 type

                // Determine share type from response structure
                // If response has nested data structure (all type), extract it
                let actualData: any = {};

                // Helper functions
                const formatDate = (dateStr: string) => {
                    const date = new Date(dateStr);
                    return gLang('annualReport.dateMonthDay', {
                        month: date.getMonth() + 1,
                        day: date.getDate(),
                    });
                };

                const getGameName = (gameKey: string): string => {
                    if (gameKey === 'bedwars') {
                        return gLang('annualReport.gameBedwars');
                    }
                    const gameName = gLang(`game.${gameKey}`);
                    return gameName !== `game.${gameKey}`
                        ? gameName
                        : gameKey || gLang('annualReport.unknown');
                };

                const extractKeyword = (evaluation: string): string => {
                    const keywordMap: Record<string, string> = {
                        [gLang('annualReport.categoryBedbreak')]: gLang(
                            'annualReport.categoryBedbreakTitle'
                        ),
                        [gLang('annualReport.categoryCombat')]: gLang(
                            'annualReport.categoryCombatTitle'
                        ),
                        [gLang('annualReport.categorySocial')]: gLang(
                            'annualReport.categorySocialTitle'
                        ),
                        [gLang('annualReport.categoryExplore')]: gLang(
                            'annualReport.categoryExploreTitle'
                        ),
                        [gLang('annualReport.categoryCompetitive')]: gLang(
                            'annualReport.categoryCompetitiveTitle'
                        ),
                        [gLang('annualReport.categoryCasual')]: gLang(
                            'annualReport.categoryCasualTitle'
                        ),
                        [gLang('annualReport.categoryBedwars')]: gLang(
                            'annualReport.categoryBedwarsTitle'
                        ),
                        [gLang('annualReport.categorySkywars')]: gLang(
                            'annualReport.categorySkywarsTitle'
                        ),
                        Pit: gLang('annualReport.categoryPit'),
                        [gLang('annualReport.categoryStreak')]: gLang(
                            'annualReport.categoryStreakTitle'
                        ),
                        [gLang('annualReport.categoryWinrate')]: gLang(
                            'annualReport.categoryWinrateTitle'
                        ),
                    };

                    for (const [keyword, title] of Object.entries(keywordMap)) {
                        if (evaluation.includes(keyword)) {
                            return title;
                        }
                    }

                    return gLang('annualReport.ecPlayer');
                };

                const versusScoreToRank = (score: number): string => {
                    if (score > 14300) return gLang('annualReport.rankCrystal');
                    if (score >= 13301) return gLang('annualReport.rankBedrock1');
                    if (score >= 12301) return gLang('annualReport.rankBedrock2');
                    if (score >= 11301) return gLang('annualReport.rankBedrock3');
                    if (score >= 10301) return gLang('annualReport.rankBedrock4');
                    if (score >= 9501) return gLang('annualReport.rankDiamond1');
                    if (score >= 8701) return gLang('annualReport.rankDiamond2');
                    if (score >= 7901) return gLang('annualReport.rankDiamond3');
                    if (score >= 7101) return gLang('annualReport.rankDiamond4');
                    if (score >= 6501) return gLang('annualReport.rankGold1');
                    if (score >= 5901) return gLang('annualReport.rankGold2');
                    if (score >= 5301) return gLang('annualReport.rankGold3');
                    if (score >= 4701) return gLang('annualReport.rankGold4');
                    if (score >= 4201) return gLang('annualReport.rankIron1');
                    if (score >= 3701) return gLang('annualReport.rankIron2');
                    if (score >= 3201) return gLang('annualReport.rankIron3');
                    if (score >= 2701) return gLang('annualReport.rankIron4');
                    if (score >= 2301) return gLang('annualReport.rankCoal1');
                    if (score >= 1901) return gLang('annualReport.rankCoal2');
                    if (score >= 1501) return gLang('annualReport.rankCoal3');
                    if (score >= 1101) return gLang('annualReport.rankCoal4');
                    if (score >= 801) return gLang('annualReport.rankCharcoal1');
                    if (score >= 501) return gLang('annualReport.rankCharcoal2');
                    if (score >= 201) return gLang('annualReport.rankCharcoal3');
                    if (score >= 0) return gLang('annualReport.rankCharcoal4');
                    return gLang('annualReport.rankUnranked');
                };

                const casualScoreToRank = (score: number): string => {
                    if (score > 10900) return gLang('annualReport.rankCrystal');
                    if (score >= 10201) return gLang('annualReport.rankBedrock1');
                    if (score >= 9501) return gLang('annualReport.rankBedrock2');
                    if (score >= 8701) return gLang('annualReport.rankBedrock3');
                    if (score >= 8001) return gLang('annualReport.rankBedrock4');
                    if (score >= 7401) return gLang('annualReport.rankDiamond1');
                    if (score >= 6801) return gLang('annualReport.rankDiamond2');
                    if (score >= 6201) return gLang('annualReport.rankDiamond3');
                    if (score >= 5601) return gLang('annualReport.rankDiamond4');
                    if (score >= 5101) return gLang('annualReport.rankGold1');
                    if (score >= 4601) return gLang('annualReport.rankGold2');
                    if (score >= 4101) return gLang('annualReport.rankGold3');
                    if (score >= 3601) return gLang('annualReport.rankGold4');
                    if (score >= 3201) return gLang('annualReport.rankIron1');
                    if (score >= 2801) return gLang('annualReport.rankIron2');
                    if (score >= 2401) return gLang('annualReport.rankIron3');
                    if (score >= 2001) return gLang('annualReport.rankIron4');
                    if (score >= 1701) return gLang('annualReport.rankCoal1');
                    if (score >= 1401) return gLang('annualReport.rankCoal2');
                    if (score >= 1101) return gLang('annualReport.rankCoal3');
                    if (score >= 801) return gLang('annualReport.rankCoal4');
                    if (score >= 601) return gLang('annualReport.rankCharcoal1');
                    if (score >= 401) return gLang('annualReport.rankCharcoal2');
                    if (score >= 201) return gLang('annualReport.rankCharcoal3');
                    if (score >= 0) return gLang('annualReport.rankCharcoal4');
                    return gLang('annualReport.rankUnranked');
                };

                if (responseData['basic-info']) {
                    // This is 'all' type

                    const basicInfo = responseData['basic-info'] || {};
                    const loginStats = responseData['login-stats'] || {};
                    const gameStats = responseData['game-stats'] || {};
                    const rankData = responseData['rank-data'] || {};
                    const currencyData = responseData['currency-data'] || {};
                    const socialData = responseData['social-data'] || {};
                    const ticketStats = responseData['ticket-stats'] || {};
                    const calculateTitleData = responseData['calculate-title'] || {};

                    // Calculate yearsWithEC from registerDate
                    let yearsWithEC = 0;
                    if (basicInfo.registerDate) {
                        const registerDate = new Date(basicInfo.registerDate);
                        const currentYear = new Date().getFullYear();
                        yearsWithEC = Math.max(0, currentYear - registerDate.getFullYear());
                    }

                    const totalHours = loginStats.totalOnlineSeconds
                        ? Math.round(loginStats.totalOnlineSeconds / 3600)
                        : 0;
                    const longestOnlineHours = loginStats.longestOnlineSeconds
                        ? Math.round(loginStats.longestOnlineSeconds / 3600)
                        : 0;

                    // Process game stats
                    let totalGames = 0;
                    let totalKills = 0;
                    let totalWins = 0;
                    let favoriteMode = gLang('annualReport.unknown');
                    let favoriteModeGames = 0;
                    let favoriteModeMaxKills = 0;

                    if (gameStats.gameModeStats && Array.isArray(gameStats.gameModeStats)) {
                        gameStats.gameModeStats.forEach((mode: any) => {
                            const win = mode.WIN || 0;
                            const kill = mode.KILL || 0;
                            const modeGames = win || (kill > 0 ? 1 : 0);

                            totalGames += modeGames;
                            totalKills += kill;
                            totalWins += win;

                            if (modeGames > favoriteModeGames) {
                                favoriteModeGames = modeGames;
                                favoriteMode = getGameName(mode.game);
                                favoriteModeMaxKills = kill;
                            }
                        });
                    }

                    const replayTotalCount = gameStats.replayStats?.replayTotalCount || 0;
                    const replayMostPlayedMap =
                        gameStats.replayStats?.replayMostPlayedMap?.map ||
                        gLang('annualReport.unknown');
                    const replayOverwatchCount = gameStats.replayStats?.replayOverwatchCount || 0;

                    const versusRank = rankData.s8VersusRank?.score || 0;
                    const versusRankName = versusScoreToRank(versusRank);
                    const casualRank = rankData.s8CasualRank?.score || 0;
                    const casualRankName = casualScoreToRank(casualRank);

                    actualData = {
                        ecid: basicInfo.ecid || '',
                        nickname: basicInfo.name || '',
                        firstLoginDate: loginStats.firstLoginDate || basicInfo.registerDate || '',
                        yearsWithEC: yearsWithEC,
                        skinData: basicInfo.skinData,
                        geometryData: basicInfo.geometryData,
                        totalLoginDays: loginStats.loginDays || 0,
                        earliestLoginTime: loginStats.earliestLoginTime || '',
                        latestLoginTime: loginStats.latestLoginTime || '',
                        totalHours: totalHours,
                        longestOnlineDate: loginStats.longestOnlineDate
                            ? formatDate(loginStats.longestOnlineDate)
                            : '',
                        longestOnlineHours: longestOnlineHours,
                        totalGames: totalGames,
                        totalKills: totalKills,
                        totalWins: totalWins,
                        winRate: 0,
                        gameModeStats: gameStats.gameModeStats || [],
                        replayTotalCount: replayTotalCount,
                        replayMostPlayedMap: replayMostPlayedMap,
                        replayOverwatchCount: replayOverwatchCount,
                        favoriteMode: favoriteMode,
                        favoriteModeGames: favoriteModeGames,
                        favoriteModeWinRate: 0,
                        favoriteModeMaxKills: favoriteModeMaxKills,
                        favoriteModeMaxStreak: 0,
                        versusRank: versusRank,
                        versusRankName: versusRankName,
                        casualRank: casualRank,
                        casualRankName: casualRankName,
                        currentEcCoin: currencyData.currentEcCoin || 0,
                        currentDiamond: currencyData.currentDiamond || 0,
                        currentPoint: currencyData.currentPoint || 0,
                        rechargeCount: currencyData.rechargeCount || 0,
                        friendCount: socialData.friendCount || 0,
                        teammateGames: socialData.teamCount || 0,
                        bestTeammate:
                            socialData.mostTeammateName ||
                            socialData.mostTeammateEcid ||
                            gLang('annualReport.none'),
                        totalTickets: ticketStats.totalTickets || 0,
                        ticketTypeCounts: convertTicketTypeCounts(ticketStats.typeCounts || {}),
                        rewardCount: ticketStats.rewardCount || 0,
                        unbanCount: ticketStats.unbanCount || 0,
                        personaTitle: aiEvaluation
                            ? extractKeyword(aiEvaluation)
                            : gLang('annualReport.ecPlayer'),
                        aiEvaluation: aiEvaluation,
                        yearTitle: calculateTitleData?.title || undefined,
                    };
                } else {
                    // Single type response - need to detect type and transform accordingly
                    // This is a simplified version - you may need to handle each type separately
                    // For now, assume it's basic-info if it has name/ecid
                    if (responseData.name || responseData.ecid) {
                        actualData = {
                            ecid: responseData.ecid || '',
                            nickname: responseData.name || '',
                            firstLoginDate: responseData.registerDate || '',
                            yearsWithEC: responseData.registerDate
                                ? new Date().getFullYear() -
                                  new Date(responseData.registerDate).getFullYear()
                                : 0,
                            skinData: responseData.skinData,
                            geometryData: responseData.geometryData,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: aiEvaluation,
                            yearTitle: undefined,
                        };
                    } else if (
                        responseData.loginDays !== undefined ||
                        responseData.totalOnlineSeconds !== undefined
                    ) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: responseData.firstLoginDate || '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: responseData.loginDays || 0,
                            earliestLoginTime: responseData.earliestLoginTime || '',
                            latestLoginTime: responseData.latestLoginTime || '',
                            totalHours: responseData.totalOnlineSeconds
                                ? Math.round(responseData.totalOnlineSeconds / 3600)
                                : 0,
                            longestOnlineDate: responseData.longestOnlineDate
                                ? formatDate(responseData.longestOnlineDate)
                                : '',
                            longestOnlineHours: responseData.longestOnlineSeconds
                                ? Math.round(responseData.longestOnlineSeconds / 3600)
                                : 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (responseData.gameModeStats !== undefined) {
                        let totalGames = 0;
                        let totalKills = 0;
                        let totalWins = 0;
                        let favoriteMode = gLang('annualReport.unknown');
                        let favoriteModeGames = 0;
                        let favoriteModeMaxKills = 0;

                        if (
                            responseData.gameModeStats &&
                            Array.isArray(responseData.gameModeStats)
                        ) {
                            responseData.gameModeStats.forEach((mode: any) => {
                                const win = mode.WIN || 0;
                                const kill = mode.KILL || 0;
                                const modeGames = win || (kill > 0 ? 1 : 0);

                                totalGames += modeGames;
                                totalKills += kill;
                                totalWins += win;

                                if (modeGames > favoriteModeGames) {
                                    favoriteModeGames = modeGames;
                                    favoriteMode = getGameName(mode.game);
                                    favoriteModeMaxKills = kill;
                                }
                            });
                        }

                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: totalGames,
                            totalKills: totalKills,
                            totalWins: totalWins,
                            winRate: 0,
                            gameModeStats: responseData.gameModeStats || [],
                            replayTotalCount: responseData.replayStats?.replayTotalCount || 0,
                            replayMostPlayedMap:
                                responseData.replayStats?.replayMostPlayedMap?.map ||
                                gLang('annualReport.unknown'),
                            replayOverwatchCount:
                                responseData.replayStats?.replayOverwatchCount || 0,
                            favoriteMode: favoriteMode,
                            favoriteModeGames: favoriteModeGames,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: favoriteModeMaxKills,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (
                        responseData.s8VersusRank !== undefined ||
                        responseData.s8CasualRank !== undefined
                    ) {
                        const versusRank = responseData.s8VersusRank?.score || 0;
                        const versusRankName = versusScoreToRank(versusRank);
                        const casualRank = responseData.s8CasualRank?.score || 0;
                        const casualRankName = casualScoreToRank(casualRank);

                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: versusRank,
                            versusRankName: versusRankName,
                            casualRank: casualRank,
                            casualRankName: casualRankName,
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (
                        responseData.currentEcCoin !== undefined ||
                        responseData.currentDiamond !== undefined
                    ) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: responseData.currentEcCoin || 0,
                            currentDiamond: responseData.currentDiamond || 0,
                            currentPoint: responseData.currentPoint || 0,
                            rechargeCount: responseData.rechargeCount || 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (
                        responseData.friendCount !== undefined ||
                        responseData.teamCount !== undefined
                    ) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: responseData.friendCount || 0,
                            teammateGames: responseData.teamCount || 0,
                            bestTeammate:
                                responseData.mostTeammateName ||
                                responseData.mostTeammateEcid ||
                                gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (responseData.totalTickets !== undefined) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: responseData.totalTickets || 0,
                            ticketTypeCounts: convertTicketTypeCounts(
                                responseData.typeCounts || {}
                            ),
                            rewardCount: responseData.rewardCount || 0,
                            unbanCount: responseData.unbanCount || 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: undefined,
                        };
                    } else if (responseData.title) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: gLang('annualReport.ecPlayer'),
                            aiEvaluation: undefined,
                            yearTitle: responseData.title,
                        };
                    } else if (aiEvaluation) {
                        actualData = {
                            ecid: '',
                            nickname: '',
                            firstLoginDate: '',
                            yearsWithEC: 0,
                            skinData: undefined,
                            geometryData: undefined,
                            totalLoginDays: 0,
                            earliestLoginTime: '',
                            latestLoginTime: '',
                            totalHours: 0,
                            longestOnlineDate: '',
                            longestOnlineHours: 0,
                            totalGames: 0,
                            totalKills: 0,
                            totalWins: 0,
                            winRate: 0,
                            gameModeStats: [],
                            replayTotalCount: 0,
                            replayMostPlayedMap: gLang('annualReport.unknown'),
                            replayOverwatchCount: 0,
                            favoriteMode: gLang('annualReport.unknown'),
                            favoriteModeGames: 0,
                            favoriteModeWinRate: 0,
                            favoriteModeMaxKills: 0,
                            favoriteModeMaxStreak: 0,
                            versusRank: 0,
                            versusRankName: gLang('annualReport.rankUnranked'),
                            casualRank: 0,
                            casualRankName: gLang('annualReport.rankUnranked'),
                            currentEcCoin: 0,
                            currentDiamond: 0,
                            currentPoint: 0,
                            rechargeCount: 0,
                            friendCount: 0,
                            teammateGames: 0,
                            bestTeammate: gLang('annualReport.none'),
                            totalTickets: 0,
                            ticketTypeCounts: {},
                            rewardCount: 0,
                            unbanCount: 0,
                            personaTitle: aiEvaluation
                                ? extractKeyword(aiEvaluation)
                                : gLang('annualReport.ecPlayer'),
                            aiEvaluation: aiEvaluation,
                            yearTitle: undefined,
                        };
                    }
                }

                // Use responseType (which may be comma-separated) instead of detectedType
                // This preserves the actual share types from the backend
                setShareType(responseType as ShareType);
                setData(actualData);
                setProgress(100);
                setIsProgressComplete(true);
                setLoading(false);
            } catch (err: any) {
                setError(
                    err.response?.data?.EPF_description ||
                        err.message ||
                        gLang('annualReport.fetchShareFailed')
                );
                setLoading(false);
            }
        };

        loadData();
    }, [searchParams]);

    // Helper function to check if shareType includes a specific type
    const hasShareType = (type: string): boolean => {
        if (shareType === 'all') return true;
        if (shareType === type) return true;
        // Check if shareType is a comma-separated string containing the type
        if (typeof shareType === 'string' && shareType.includes(',')) {
            const types = shareType.split(',').map(t => t.trim());
            return types.includes(type);
        }
        return false;
    };

    // Helper to mask value if not in shareType
    // Note: basic-info data is always shown (not masked)
    const maskValue = (value: any, dataType: ShareType): any => {
        // basic-info data is always shown
        if (dataType === 'basic-info') return value;
        // Check if the data type is included in shareType
        if (hasShareType(dataType)) return value;
        return '***';
    };

    // Helper to check if a data type is included in shareType
    const isDataTypeIncluded = (dataType: ShareType): boolean => {
        // basic-info is always included
        if (dataType === 'basic-info') return true;
        return hasShareType(dataType);
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // 如果触摸的是可交互元素（如按钮、链接），不阻止默认行为
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [role="button"], [onclick]')) {
            return;
        }

        // 如果触摸的是可拖动的模型，不处理滑动事件
        if (target.closest('[data-draggable-model]')) {
            return;
        }

        // 阻止默认滚动行为
        if (e.cancelable) {
            e.preventDefault();
        }
        startY.current = e.touches[0].clientY;
        startX.current = e.touches[0].clientX;
    };

    const handleTouchMove = (e: React.TouchEvent) => {
        // 如果触摸的是可交互元素，不阻止默认行为
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [role="button"], [onclick]')) {
            return;
        }

        // 如果触摸的是可拖动的模型，不处理滑动事件
        if (target.closest('[data-draggable-model]')) {
            return;
        }

        // 阻止默认滚动行为
        if (e.cancelable) {
            e.preventDefault();
        }
    };

    const handleTouchEnd = (e: React.TouchEvent) => {
        // 如果触摸的是可交互元素，不阻止默认行为
        const target = e.target as HTMLElement;
        if (target.closest('button, a, [role="button"], [onclick]')) {
            return;
        }

        // 如果触摸的是可拖动的模型，不处理滑动事件
        if (target.closest('[data-draggable-model]')) {
            return;
        }

        // 阻止默认滚动行为
        if (e.cancelable) {
            e.preventDefault();
        }

        const endY = e.changedTouches[0].clientY;
        const endX = e.changedTouches[0].clientX;
        const distanceY = startY.current - endY;
        const distanceX = startX.current - endX;
        const minSwipeDistance = 50;

        // 判断是垂直滑动还是水平滑动
        if (Math.abs(distanceY) > Math.abs(distanceX)) {
            // 垂直滑动：向上滑进入下一页，向下滑返回上一页
            if (Math.abs(distanceY) > minSwipeDistance) {
                if (distanceY > 0) {
                    nextPage();
                } else {
                    prevPage();
                }
            }
        } else {
            // 水平滑动：向左滑进入下一页，向右滑返回上一页
            if (Math.abs(distanceX) > minSwipeDistance) {
                if (distanceX > 0) {
                    nextPage();
                } else {
                    prevPage();
                }
            }
        }
    };

    // Get the actual index of the last page
    const getLastPageIndex = (): number => {
        if (!data) return 0;
        return getPageIndex(totalPages);
    };

    // Check if a page index has data to display and is included in shareType
    const hasPageData = (index: number): boolean => {
        if (!data) return false;

        // Page 0: Cover - always has data, always shown (basic-info)
        if (index === 0) {
            return hasShareType('basic-info');
        }

        // Page 1: Login Stats - needs login-stats type
        if (index === 1) {
            return hasShareType('login-stats') || hasShareType('basic-info');
        }

        // Page 2: Login Time Record - needs login-stats type and data
        if (index === 2) {
            return (
                (hasShareType('login-stats') || hasShareType('basic-info')) &&
                !!(data.earliestLoginTime || data.latestLoginTime)
            );
        }

        // Page 3: Longest Online Record - needs login-stats type and data
        if (index === getPageIndex(4)) {
            return (
                (hasShareType('login-stats') || hasShareType('basic-info')) &&
                data.longestOnlineHours > 0
            );
        }

        // Pages 5-7: Game Stats - needs game-stats type
        if (index >= getPageIndex(5) && index <= getPageIndex(7)) {
            return hasShareType('game-stats') || hasShareType('basic-info');
        }

        // Page 8: Rank Data - needs rank-data type
        if (index === getPageIndex(8)) {
            return hasShareType('rank-data') || hasShareType('basic-info');
        }

        // Page 9: Currency Data - needs currency-data type
        if (index === getPageIndex(9)) {
            return hasShareType('currency-data') || hasShareType('basic-info');
        }

        // Page 10: Social Data - needs social-data type
        if (index === getPageIndex(10)) {
            return hasShareType('social-data') || hasShareType('basic-info');
        }

        // Pages 11-13: Ticket Stats - needs ticket-stats type and data
        if (index >= getPageIndex(11) && index <= getPageIndex(13)) {
            return (
                (hasShareType('ticket-stats') || hasShareType('basic-info')) &&
                data.totalTickets > 0
            );
        }

        // Page 14: 年度关键词 - needs ai-evaluation or calculate-title type, and data
        if (index === getPageIndex(14)) {
            return (
                (hasShareType('ai-evaluation') ||
                    hasShareType('calculate-title') ||
                    hasShareType('basic-info')) &&
                (!!data.aiEvaluation || !!data.yearTitle)
            );
        }

        // Last page: 总结页 - always shown (basic-info)
        if (index === getPageIndex(totalPages)) {
            return hasShareType('basic-info');
        }

        return false; // Default to false for unknown pages
    };

    const nextPage = () => {
        const lastPageIndex = getLastPageIndex();

        // Find next page with data
        let nextIndex = pageIndex + 1;
        while (nextIndex <= lastPageIndex && !hasPageData(nextIndex)) {
            nextIndex++;
        }

        if (nextIndex <= lastPageIndex) {
            setPageIndex(nextIndex);
        }
    };

    const prevPage = () => {
        if (pageIndex <= 0) return;

        // Find previous page with data
        let prevIndex = pageIndex - 1;
        while (prevIndex >= 0 && !hasPageData(prevIndex)) {
            prevIndex--;
        }

        if (prevIndex >= 0) {
            setPageIndex(prevIndex);
        }
    };

    // Calculate page index based on actual page position
    const getPageIndex = (pageNumber: number): number => {
        // Page structure:
        // 1: Cover (index 0)
        // 2: Login Stats (index 1)
        // 3: Login Time Record (index 2, optional)
        // 4: Longest Online Record (index 3, optional)
        // 5: Game Stats - Overview (index varies)
        // 6: Game Stats - Modes (index varies)
        // 7: Game Stats - Replays (index varies)
        // 8: Rank Data (index varies)
        // 9: Currency Data (index varies)
        // 10: Social Data (index varies)
        // 11-13: Ticket Stats (3 pages, optional)
        // 14: 年度关键词 (fixed page number, index varies)
        // Last page: 总结页 (all data summary, index = totalPages - 1)

        if (pageNumber <= 3) {
            return pageNumber - 1; // Pages 1-3 map to indices 0-2
        }

        let currentIndex = 3; // Start after page 3

        // Page 4: Longest Online Record (if exists)
        if (pageNumber === 4) {
            if (data && data.longestOnlineHours > 0) {
                return currentIndex; // Index 3
            } else {
                // Skip longest online page, this is actually Game Stats page
                return currentIndex; // Index 3 (Game Stats Overview)
            }
        }

        // Page 5-7: Game Stats (3 pages)
        if (pageNumber >= 5 && pageNumber <= 7) {
            let offset = pageNumber - 5; // 0, 1, 2
            if (data && data.longestOnlineHours > 0) {
                return currentIndex + 1 + offset; // Index 4, 5, 6
            } else {
                return currentIndex + offset; // Index 3, 4, 5
            }
        }

        // Page 8-10: Rank, Currency, Social (always present)
        if (pageNumber >= 8 && pageNumber <= 10) {
            let offset = pageNumber - 8; // 0, 1, 2
            if (data && data.longestOnlineHours > 0) {
                return currentIndex + 4 + offset; // Index 7, 8, 9
            } else {
                return currentIndex + 3 + offset; // Index 6, 7, 8
            }
        }

        // Page 11-13: Ticket Stats (3 pages, if exists)
        if (pageNumber >= 11 && pageNumber <= 13) {
            let baseIndex = data && data.longestOnlineHours > 0 ? 10 : 9;
            if (data && data.totalTickets > 0) {
                let offset = pageNumber - 11; // 0, 1, 2
                return baseIndex + offset; // Index 9-11 or 10-12
            } else {
                // Skip ticket pages, this is actually Page 14 (年度关键词)
                if (pageNumber === 11) {
                    return baseIndex; // Index 9 or 10 (Page 14 - 年度关键词)
                }
                // Pages 12-13 don't exist if no tickets
                return baseIndex;
            }
        }

        // Page 14: 年度关键词 (fixed page number)
        if (pageNumber === 14) {
            let baseIndex = data && data.longestOnlineHours > 0 ? 10 : 9;
            if (data && data.totalTickets > 0) {
                return baseIndex + 3; // Index 12 or 13
            } else {
                return baseIndex; // Index 9 or 10
            }
        }

        // Last page: 总结页 (all data summary)
        if (pageNumber === totalPages) {
            let baseIndex = data && data.longestOnlineHours > 0 ? 10 : 9;
            if (data && data.totalTickets > 0) {
                return baseIndex + 4; // Index 13 or 14 (after Page 14)
            } else {
                return baseIndex + 1; // Index 10 or 11 (after Page 14)
            }
        }

        return pageNumber - 1; // Fallback
    };

    // Get page style class name
    const getPageClass = (index: number) => {
        if (index === pageIndex) return 'page active';
        if (index > pageIndex) return 'page next';
        return 'page prev';
    };

    // Helper functions
    const formatDate = (dateStr: string) => {
        const date = new Date(dateStr);
        return gLang('annualReport.dateMonthDay', {
            month: date.getMonth() + 1,
            day: date.getDate(),
        });
    };

    // Helper function to create pie chart path
    const createPieSlice = (
        startAngle: number,
        endAngle: number,
        radius: number,
        centerX: number,
        centerY: number
    ) => {
        const start = {
            x: centerX + radius * Math.cos((startAngle * Math.PI) / 180),
            y: centerY + radius * Math.sin((startAngle * Math.PI) / 180),
        };
        const end = {
            x: centerX + radius * Math.cos((endAngle * Math.PI) / 180),
            y: centerY + radius * Math.sin((endAngle * Math.PI) / 180),
        };
        const largeArcFlag = endAngle - startAngle > 180 ? 1 : 0;
        return `M ${centerX} ${centerY} L ${start.x} ${start.y} A ${radius} ${radius} 0 ${largeArcFlag} 1 ${end.x} ${end.y} Z`;
    };

    const getModeEmoji = (mode: string) => {
        const emojiMap: Record<string, string> = {
            [gLang('annualReport.gameBedwars')]: '🛏️',
            [gLang('annualReport.bedwarsShort')]: '🛏️',
            [gLang('annualReport.skywars')]: '🏝️',
            Pit: '⚔️',
            [gLang('annualReport.other')]: '🎮',
        };
        return emojiMap[mode] || '🎮';
    };

    if (loading || !data) {
        return (
            <div
                className="app-container"
                onTouchStart={handleTouchStart}
                onTouchMove={handleTouchMove}
                onTouchEnd={handleTouchEnd}
            >
                <video
                    ref={videoRef}
                    id="global-video-bg"
                    autoPlay
                    loop
                    playsInline
                    preload="auto"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        objectFit: 'cover',
                        zIndex: 0,
                        backgroundColor: '#000',
                        pointerEvents: 'none',
                    }}
                >
                    <source src={ANNUAL_REPORT_BACKGROUND_VIDEO_URL} type="video/mp4" />
                </video>
                <div
                    id="video-overlay"
                    style={{
                        position: 'fixed',
                        top: 0,
                        left: 0,
                        width: '100vw',
                        height: '100vh',
                        backgroundColor: 'rgba(0, 0, 0, 0.6)',
                        zIndex: 1,
                        pointerEvents: 'none',
                    }}
                ></div>
                <div id="app">
                    <div className="page active">
                        <h1>
                            {gLang('annualReport.sharePageTitle')
                                .split('\n')
                                .map((line, i) => (
                                    <span key={i}>
                                        {i > 0 && <br />}
                                        {line}
                                    </span>
                                ))}
                        </h1>
                        <p className="sub-text">
                            {error ? error : gLang('annualReport.loadingMemoriesThird')}
                        </p>
                        {error && (
                            <div style={{ marginTop: '20px' }}>
                                <button className="mc-btn" onClick={() => navigate('/')}>
                                    {gLang('annualReport.backToHome')}
                                </button>
                            </div>
                        )}
                    </div>
                </div>
            </div>
        );
    }

    // Helper function to get game name from language.ts
    const getGameName = (gameKey: string): string => {
        // Special case for bedwars in annual report
        if (gameKey === 'bedwars') {
            return gLang('annualReport.gameBedwars');
        }
        const gameName = gLang(`game.${gameKey}`);
        return gameName !== `game.${gameKey}` ? gameName : gameKey || gLang('annualReport.unknown');
    };

    return (
        <div
            className="app-container"
            onTouchStart={handleTouchStart}
            onTouchMove={handleTouchMove}
            onTouchEnd={handleTouchEnd}
        >
            {/* Video Background */}
            <video
                ref={videoRef}
                id="global-video-bg"
                autoPlay
                loop
                playsInline
                preload="auto"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    objectFit: 'cover',
                    zIndex: 0,
                    backgroundColor: '#000',
                    pointerEvents: 'none',
                }}
            >
                <source src={ANNUAL_REPORT_BACKGROUND_VIDEO_URL} type="video/mp4" />
            </video>
            <div
                id="video-overlay"
                style={{
                    position: 'fixed',
                    top: 0,
                    left: 0,
                    width: '100vw',
                    height: '100vh',
                    backgroundColor: 'rgba(0, 0, 0, 0.6)',
                    zIndex: 1,
                    pointerEvents: 'none',
                }}
            ></div>

            {/* Mute/Unmute Button */}
            <Button
                type="text"
                icon={isMuted ? <SoundOutlined /> : <SoundFilled />}
                onClick={handleToggleMute}
                style={{
                    position: 'fixed',
                    top: '20px',
                    left: '20px',
                    zIndex: 1000,
                    color: '#fff',
                    fontSize: '20px',
                    width: '40px',
                    height: '40px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: 'rgba(0, 0, 0, 0.3)',
                    border: 'none',
                    borderRadius: '50%',
                    backdropFilter: 'blur(10px)',
                }}
                title={isMuted ? gLang('annualReport.unmute') : gLang('annualReport.mute')}
            />

            {/* Skip Button - Show when data is loaded */}
            {(() => {
                // Check if data is loaded (not loading and data exists)
                const dataLoaded = !loading && data !== null;

                // Get Page 14 index
                const page14Index = getPageIndex(14);

                // Only show if Page 14 has data, and we're not already on Page 14
                const canShowSkip =
                    dataLoaded && hasPageData(page14Index) && pageIndex !== page14Index;

                if (canShowSkip) {
                    return (
                        <Button
                            type="text"
                            icon={<DoubleRightOutlined />}
                            onClick={() => setPageIndex(page14Index)}
                            style={{
                                position: 'fixed',
                                top: '20px',
                                right: '20px',
                                zIndex: 1000,
                                color: '#fff',
                                fontSize: '14px',
                                height: '32px',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '6px',
                                backgroundColor: 'rgba(0, 0, 0, 0.3)',
                                border: 'none',
                                borderRadius: '16px',
                                padding: '0 12px',
                                backdropFilter: 'blur(10px)',
                            }}
                            title={gLang('annualReport.skipToKeyword')}
                        >
                            {gLang('annualReport.skip')}
                        </Button>
                    );
                }
                return null;
            })()}

            {/* 3D Player Models - positioned outside #app to avoid transform: scale() affecting position: fixed */}
            {/* Models are in .app-container so they're positioned relative to viewport (screen edges) */}
            {/* Page 2: Login Stats */}
            {data.skinData && pageIndex === 1 && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="run"
                    position="bottom-left"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 3: Login Time Record */}
            {data.skinData &&
                pageIndex === 2 &&
                (data.earliestLoginTime || data.latestLoginTime) && (
                    <MinecraftPlayer3D
                        skinData={data.skinData}
                        width={200}
                        height={280}
                        animation="wave"
                        waveArm="left"
                        position="left-peek"
                        rotate={false}
                        rotateSpeed={0.5}
                        background="transparent"
                        interactive={true}
                        tiltAngle={25}
                    />
                )}

            {/* Page 4: Longest Online Record */}
            {data.skinData && pageIndex === getPageIndex(4) && data.longestOnlineHours > 0 && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="sit-idle"
                    position="bottom-left"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 5: Game Stats - Overview */}
            {data.skinData && pageIndex === getPageIndex(5) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="walk"
                    position="bottom-right"
                    rotate={false}
                    rotateSpeed={0.8}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 6: Game Stats - Modes */}
            {data.skinData &&
                pageIndex === getPageIndex(6) &&
                data.gameModeStats &&
                data.gameModeStats.length > 0 && (
                    <MinecraftPlayer3D
                        skinData={data.skinData}
                        width={200}
                        height={280}
                        animation="run"
                        position="bottom-left"
                        rotate={false}
                        rotateSpeed={0.8}
                        background="transparent"
                        interactive={true}
                    />
                )}

            {/* Page 7: Game Stats - Replays */}
            {data.skinData && pageIndex === getPageIndex(7) && data.replayTotalCount > 0 && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="wave"
                    position="bottom-right"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 8: Rank Data */}
            {data.skinData && pageIndex === getPageIndex(8) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="run"
                    position="bottom-center"
                    rotate={false}
                    rotateSpeed={0.6}
                    background="transparent"
                    interactive={true}
                    autoMove={true}
                    moveSpeed={3}
                />
            )}

            {/* Page 9: Currency Data */}
            {data.skinData && pageIndex === getPageIndex(9) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="wave"
                    position="bottom-left"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 10: Social Data */}
            {data.skinData && pageIndex === getPageIndex(10) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="idle"
                    position="bottom-right"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Page 13: Ticket Stats - Special */}
            {data.skinData &&
                pageIndex === getPageIndex(13) &&
                data.totalTickets > 0 &&
                (data.rewardCount > 0 || data.unbanCount > 0) && (
                    <MinecraftPlayer3D
                        skinData={data.skinData}
                        width={200}
                        height={280}
                        animation="wave"
                        position="bottom-center"
                        rotate={false}
                        rotateSpeed={0.5}
                        background="transparent"
                        interactive={true}
                    />
                )}

            {/* Page 14: 年度关键词 */}
            {data.skinData && pageIndex === getPageIndex(14) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={200}
                    height={280}
                    animation="sit"
                    position="bottom-left"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                />
            )}

            {/* Last Page: 总结页 */}
            {data.skinData && pageIndex === getPageIndex(totalPages) && (
                <MinecraftPlayer3D
                    skinData={data.skinData}
                    width={180}
                    height={250}
                    animation="idle"
                    position="bottom-left"
                    rotate={false}
                    rotateSpeed={0.5}
                    background="transparent"
                    interactive={true}
                    autoMove={false}
                    moveSpeed={1}
                />
            )}

            <div id="app" ref={appRef}>
                {/* Page 1: Cover */}
                <div className={getPageClass(0)}>
                    <h1>
                        {gLang('annualReport.sharePageTitle')
                            .split('\n')
                            .map((line, i) => (
                                <span key={i}>
                                    {i > 0 && <br />}
                                    {line}
                                </span>
                            ))}
                    </h1>
                    {isProgressComplete && (
                        <p className="sub-text" style={{ fontSize: '1.1rem' }}>
                            ECer: {data.nickname || data.ecid}
                        </p>
                    )}
                    <p className="sub-text">{gLang('annualReport.loadingMemoriesThird')}</p>

                    {/* Progress Bar */}
                    <div
                        className="progress-container"
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            margin: '30px auto',
                            padding: '0 20px',
                            opacity: isProgressComplete ? 0 : 1,
                            transition: 'opacity 0.8s ease-out',
                            pointerEvents: isProgressComplete ? 'none' : 'auto',
                        }}
                    >
                        <div
                            style={{
                                width: '100%',
                                height: '10px',
                                backgroundColor: 'rgba(255, 255, 255, 0.2)',
                                borderRadius: '5px',
                                overflow: 'hidden',
                                border: '2px solid rgba(255, 255, 255, 0.3)',
                                boxShadow: 'inset 0 2px 4px rgba(0, 0, 0, 0.3)',
                                position: 'relative',
                            }}
                        >
                            <div
                                className="progress-bar-fill"
                                style={{
                                    width: `${progress}%`,
                                    height: '100%',
                                    background:
                                        'linear-gradient(90deg, #ff0080 0%, #ff8c00 16.66%, #ffd700 33.33%, #32cd32 50%, #00bfff 66.66%, #8a2be2 83.33%, #ff0080 100%)',
                                    backgroundSize: '200% 100%',
                                    transition: 'width 0.05s ease',
                                    boxShadow:
                                        '0 0 20px rgba(255, 0, 128, 0.6), 0 0 40px rgba(255, 140, 0, 0.4)',
                                    animation: 'rainbowFlow 2s linear infinite',
                                    borderRadius: '3px',
                                }}
                            ></div>
                        </div>
                        <p className="sub-text" style={{ marginTop: '10px', fontSize: '0.9rem' }}>
                            {progress}%
                        </p>
                    </div>

                    <div style={{ marginTop: '40px' }}>
                        <button
                            className="mc-btn"
                            onClick={nextPage}
                            disabled={!isProgressComplete}
                            style={{
                                opacity: isProgressComplete ? 1 : 0.5,
                                cursor: isProgressComplete ? 'pointer' : 'not-allowed',
                            }}
                        >
                            {isProgressComplete
                                ? gLang('annualReport.openMemory')
                                : gLang('annualReport.loading')}
                        </button>
                    </div>
                </div>

                {/* Page 2: Login Stats - 登录统计 */}
                <div className={getPageClass(1)}>
                    <h2># 陪伴是最长情的告白</h2>
                    {data.firstLoginDate && (
                        <div className="sub-text" style={{ marginBottom: '30px' }}>
                            {formatDate(data.firstLoginDate)}
                            <br />
                            今年他/她第一次推开了 EC 的大门
                        </div>
                    )}

                    {/* 全年累计登录 - 大号卡片样式 */}
                    <div
                        style={{
                            width: '100%',
                            maxWidth: '270px',
                            padding: '18px',
                            background:
                                'linear-gradient(135deg, rgba(76, 175, 80, 0.25) 0%, rgba(56, 142, 60, 0.25) 100%)',
                            borderRadius: '12px',
                            border: '2px solid rgba(76, 175, 80, 0.6)',
                            marginBottom: '15px',
                            boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                        }}
                    >
                        <div
                            style={{
                                fontSize: '0.85rem',
                                color: '#81C784',
                                marginBottom: '9px',
                                fontWeight: 'bold',
                            }}
                        >
                            全年累计登录
                        </div>
                        <div
                            style={{
                                fontSize: '2.7rem',
                                color: '#4CAF50',
                                fontWeight: '900',
                                lineHeight: '1',
                                marginBottom: '6px',
                            }}
                        >
                            {data.totalLoginDays}
                        </div>
                        <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>天</div>
                    </div>

                    {/* 累计在线时长 - 大号卡片样式 */}
                    {data.totalHours > 0 && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '270px',
                                padding: '18px',
                                background:
                                    'linear-gradient(135deg, rgba(33, 150, 243, 0.25) 0%, rgba(25, 118, 210, 0.25) 100%)',
                                borderRadius: '12px',
                                border: '2px solid rgba(33, 150, 243, 0.6)',
                                marginBottom: '15px',
                                boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#64B5F6',
                                    marginBottom: '9px',
                                    fontWeight: 'bold',
                                }}
                            >
                                累计在线时长
                            </div>
                            <div
                                style={{
                                    fontSize: '2.7rem',
                                    color: '#2196F3',
                                    fontWeight: '900',
                                    lineHeight: '1',
                                    marginBottom: '6px',
                                }}
                            >
                                {data.totalHours}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                小时
                            </div>
                        </div>
                    )}

                    {/* 陪伴 EC - 大号卡片样式 */}
                    {data.yearsWithEC > 0 && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '270px',
                                padding: '18px',
                                background:
                                    'linear-gradient(135deg, rgba(255, 193, 7, 0.25) 0%, rgba(255, 152, 0, 0.25) 100%)',
                                borderRadius: '12px',
                                border: '2px solid rgba(255, 193, 7, 0.6)',
                                marginBottom: '15px',
                                boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#FFD54F',
                                    marginBottom: '9px',
                                    fontWeight: 'bold',
                                }}
                            >
                                陪伴 EC
                            </div>
                            <div
                                style={{
                                    fontSize: '2.7rem',
                                    color: '#FFC107',
                                    fontWeight: '900',
                                    lineHeight: '1',
                                    marginBottom: '6px',
                                }}
                            >
                                {data.yearsWithEC}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                年
                            </div>
                        </div>
                    )}

                    {pageIndex < getLastPageIndex() &&
                        (() => {
                            // Check if next page has data
                            const nextIndex = pageIndex + 1;
                            const nextPageHasData =
                                nextIndex <= getLastPageIndex() && hasPageData(nextIndex);
                            return nextPageHasData ? (
                                <div className="swipe-hint show" onClick={nextPage}>
                                    <div className="swipe-icon">👆</div>
                                    <div className="swipe-text">
                                        {gLang('annualReport.swipeUp')}
                                    </div>
                                </div>
                            ) : null;
                        })()}
                </div>

                {/* Page 3: Login Time Record - 登录时间记录 */}
                {(data.earliestLoginTime || data.latestLoginTime) && (
                    <div className={getPageClass(2)}>
                        <h2># 他/她的登录时间</h2>
                        <p className="sub-text" style={{ marginBottom: '30px' }}>
                            记录他/她与 EC 的每一次相遇。
                        </p>

                        {/* 最早登录 - 大号显示 */}
                        {data.earliestLoginTime &&
                            (() => {
                                const date = new Date(data.earliestLoginTime);
                                // 转换为本地时间（北京时间，UTC+8）
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                const timeStr = `${hours}:${minutes}`;
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;
                                return (
                                    <div
                                        style={{
                                            marginBottom: '18px',
                                            padding: '15px',
                                            background:
                                                'linear-gradient(135deg, rgba(255, 193, 7, 0.2) 0%, rgba(255, 152, 0, 0.2) 100%)',
                                            borderRadius: '12px',
                                            border: '2px solid rgba(255, 193, 7, 0.5)',
                                            width: '100%',
                                            maxWidth: '240px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.9rem',
                                                color: '#FFC107',
                                                marginBottom: '9px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            🌅 这一年他/她的登录时间
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                color: 'rgba(255,255,255,0.9)',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            最早是
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '2.1rem',
                                                color: '#FF5252',
                                                fontWeight: '900',
                                                lineHeight: '1',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            {timeStr}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'rgba(255,255,255,0.8)',
                                            }}
                                        >
                                            {dateStr}
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* 最晚登录 - 大号显示 */}
                        {data.latestLoginTime &&
                            (() => {
                                const date = new Date(data.latestLoginTime);
                                // 转换为本地时间（北京时间，UTC+8）
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                const timeStr = `${hours}:${minutes}`;
                                const year = date.getFullYear();
                                const month = String(date.getMonth() + 1).padStart(2, '0');
                                const day = String(date.getDate()).padStart(2, '0');
                                const dateStr = `${year}-${month}-${day}`;
                                return (
                                    <div
                                        style={{
                                            marginBottom: '18px',
                                            padding: '15px',
                                            background:
                                                'linear-gradient(135deg, rgba(63, 81, 181, 0.2) 0%, rgba(103, 58, 183, 0.2) 100%)',
                                            borderRadius: '12px',
                                            border: '2px solid rgba(63, 81, 181, 0.5)',
                                            width: '100%',
                                            maxWidth: '240px',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.9rem',
                                                color: '#9C27B0',
                                                marginBottom: '9px',
                                                fontWeight: 'bold',
                                            }}
                                        >
                                            🌙 这一年他/她的登录时间
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.85rem',
                                                color: 'rgba(255,255,255,0.9)',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            最晚是
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '2.1rem',
                                                color: '#FF5252',
                                                fontWeight: '900',
                                                lineHeight: '1',
                                                marginBottom: '6px',
                                            }}
                                        >
                                            {timeStr}
                                        </div>
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                color: 'rgba(255,255,255,0.8)',
                                            }}
                                        >
                                            {dateStr}
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* Generate evaluation based on login times */}
                        {(() => {
                            let evaluation = '';
                            if (data.earliestLoginTime && data.latestLoginTime) {
                                const earliestDate = new Date(data.earliestLoginTime);
                                const latestDate = new Date(data.latestLoginTime);
                                const earliestHour = earliestDate.getHours();
                                const latestHour = latestDate.getHours();

                                // Night owl (23:00 - 05:00, considering 5 AM as start of new day)
                                if (latestHour >= 23 || latestHour < 5) {
                                    // Check if also early bird (05:00 - 08:00) to make it wide range
                                    if (earliestHour >= 5 && earliestHour < 8) {
                                        evaluation = gLang('annualReport.playerTimeThirdAllDay');
                                    } else {
                                        evaluation = gLang('annualReport.playerTimeThirdNight');
                                    }
                                }
                                // Early bird (05:00 - 08:00)
                                else if (earliestHour >= 5 && earliestHour < 8) {
                                    evaluation = gLang('annualReport.playerTimeThirdMorning');
                                } else if (earliestHour >= 8 && latestHour < 23) {
                                    evaluation = gLang('annualReport.playerTimeThirdLoyal');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeThirdLoyal2');
                                }
                            } else if (data.earliestLoginTime) {
                                const earliestDate = new Date(data.earliestLoginTime);
                                const earliestHour = earliestDate.getHours();
                                if (earliestHour >= 5 && earliestHour < 8) {
                                    evaluation = gLang('annualReport.playerTimeThirdMorning');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeThirdLoyal2');
                                }
                            } else if (data.latestLoginTime) {
                                const latestDate = new Date(data.latestLoginTime);
                                const latestHour = latestDate.getHours();
                                if (latestHour >= 23 || latestHour < 5) {
                                    evaluation = gLang('annualReport.playerTimeThirdNight');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeThirdLoyal2');
                                }
                            }

                            return evaluation ? (
                                <p
                                    className="sub-text"
                                    style={{
                                        marginTop: '30px',
                                        fontSize: '1rem',
                                        lineHeight: '1.6',
                                        padding: '0 20px',
                                    }}
                                >
                                    "{evaluation}"
                                </p>
                            ) : null;
                        })()}

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint show" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 4: Longest Online Record - 最长在线记录 */}
                {data.longestOnlineHours > 0 && (
                    <div className={getPageClass(getPageIndex(4))}>
                        <h2># {gLang('annualReport.longestOnlineTitle')}</h2>
                        <p className="sub-text" style={{ marginBottom: '30px' }}>
                            {gLang('annualReport.longestOnlineDesc')}
                        </p>

                        <div className="big-data-block">
                            <span className="data-label">{gLang('annualReport.dateLabel')}</span>
                            <span className="big-data green-text">{data.longestOnlineDate}</span>
                        </div>

                        <div className="big-data-block" style={{ marginTop: '30px' }}>
                            <span className="data-label">
                                {gLang('annualReport.onlineDurationLabel')}
                            </span>
                            <span className="big-data green-text">
                                {data.longestOnlineHours}{' '}
                                <span style={{ fontSize: '1.5rem' }}>
                                    {gLang('annualReport.hours')}
                                </span>
                            </span>
                        </div>

                        <p className="sub-text" style={{ marginTop: '40px', fontSize: '1rem' }}>
                            {gLang('annualReport.thatDayBondThird')}
                        </p>

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 5: Game Stats - Overview - 游戏统计概览 */}
                <div className={getPageClass(getPageIndex(5))}>
                    <h2># {gLang('annualReport.combatDailyTitle')}</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        {gLang('annualReport.combatDailyDesc')}
                    </p>

                    {/* 年度总胜利 - 大号卡片样式 */}
                    {data.totalWins > 0 && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '270px',
                                padding: '18px',
                                background:
                                    'linear-gradient(135deg, rgba(244, 67, 54, 0.25) 0%, rgba(198, 40, 40, 0.25) 100%)',
                                borderRadius: '12px',
                                border: '2px solid rgba(244, 67, 54, 0.6)',
                                marginBottom: '15px',
                                boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#EF5350',
                                    marginBottom: '9px',
                                    fontWeight: 'bold',
                                }}
                            >
                                年度总胜利
                            </div>
                            <div
                                style={{
                                    fontSize: '2.7rem',
                                    color: '#F44336',
                                    fontWeight: '900',
                                    lineHeight: '1',
                                    marginBottom: '6px',
                                }}
                            >
                                {data.totalWins}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                场
                            </div>
                        </div>
                    )}

                    {/* 累计击败 - 单独显示 */}
                    {data.totalKills > 0 && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '270px',
                                padding: '18px',
                                background:
                                    'linear-gradient(135deg, rgba(231, 76, 60, 0.25) 0%, rgba(192, 57, 43, 0.25) 100%)',
                                borderRadius: '12px',
                                border: '2px solid rgba(231, 76, 60, 0.6)',
                                marginBottom: '15px',
                                boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#E57373',
                                    marginBottom: '9px',
                                    fontWeight: 'bold',
                                }}
                            >
                                累计击败
                            </div>
                            <div
                                style={{
                                    fontSize: '2.7rem',
                                    color: '#E74C3C',
                                    fontWeight: '900',
                                    lineHeight: '1',
                                    marginBottom: '6px',
                                }}
                            >
                                {data.totalKills}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                名
                            </div>
                        </div>
                    )}

                    {data.totalGames === 0 && (
                        <p className="sub-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                            还没有战斗记录，快去游戏里大展身手吧！
                        </p>
                    )}

                    {pageIndex < getLastPageIndex() && (
                        <div className="swipe-hint show" onClick={nextPage}>
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 6: Game Stats - Modes - 各模式数据 */}
                {data.gameModeStats &&
                    data.gameModeStats.length > 0 &&
                    (() => {
                        // Sort by WIN+KILL total (descending) and take top 4
                        const sortedModes = [...data.gameModeStats]
                            .filter((mode: any) => {
                                const win = mode.WIN || 0;
                                const kill = mode.KILL || 0;
                                return win > 0 || kill > 0;
                            })
                            .sort((a: any, b: any) => {
                                const aTotal = (a.WIN || 0) + (a.KILL || 0);
                                const bTotal = (b.WIN || 0) + (b.KILL || 0);
                                return bTotal - aTotal; // Descending order
                            })
                            .slice(0, 4); // Take top 4

                        return (
                            <div className={getPageClass(getPageIndex(6))}>
                                <h2># 各模式数据</h2>
                                <p className="sub-text" style={{ marginBottom: '30px' }}>
                                    他/她在不同模式中的精彩表现。
                                </p>

                                <div
                                    className="data-list"
                                    style={{
                                        background: 'rgba(231, 76, 60, 0.1)',
                                        padding: '15px',
                                        border: '2px dashed #e74c3c',
                                    }}
                                >
                                    {sortedModes.map((mode: any, index: number) => {
                                        const modeName = getGameName(mode.game);
                                        const win = mode.WIN || 0;
                                        const kill = mode.KILL || 0;
                                        const bed = mode.BED || 0;
                                        const crystal = mode.CRYSTAL || 0;
                                        const pcKill = mode['PC-KILL'] || 0;

                                        return (
                                            <div
                                                key={index}
                                                className="data-item"
                                                style={{
                                                    borderColor: '#e74c3c',
                                                    background: 'transparent',
                                                    marginTop: index > 0 ? '8px' : '0',
                                                }}
                                            >
                                                <div style={{ flexGrow: 1 }}>
                                                    <div
                                                        style={{
                                                            fontWeight: 'bold',
                                                            marginBottom: '4px',
                                                        }}
                                                    >
                                                        {modeName}
                                                    </div>
                                                    <div
                                                        style={{
                                                            fontSize: '0.85rem',
                                                            opacity: 0.9,
                                                        }}
                                                    >
                                                        {win > 0 && <span>胜利: {win}场 </span>}
                                                        {kill > 0 && <span>击杀: {kill}人 </span>}
                                                        {bed > 0 && <span>拆床: {bed}次 </span>}
                                                        {crystal > 0 && (
                                                            <span>水晶: {crystal}次 </span>
                                                        )}
                                                        {pcKill > 0 && (
                                                            <span>PC击杀: {pcKill}次 </span>
                                                        )}
                                                    </div>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>

                                {pageIndex < getLastPageIndex() && (
                                    <div className="swipe-hint" onClick={nextPage}>
                                        <div className="swipe-icon">👆</div>
                                        <div className="swipe-text">
                                            {gLang('annualReport.swipeUp')}
                                        </div>
                                    </div>
                                )}
                            </div>
                        );
                    })()}

                {/* Page 7: Game Stats - Replays - 回放记录 */}
                {data.replayTotalCount > 0 && (
                    <div className={getPageClass(getPageIndex(7))}>
                        <h2># 回放记录</h2>
                        <p className="sub-text" style={{ marginBottom: '30px' }}>
                            记录他/她的精彩瞬间。
                        </p>

                        {/* 总回放数 - 大号卡片样式 */}
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '270px',
                                padding: '18px',
                                background:
                                    'linear-gradient(135deg, rgba(155, 89, 182, 0.25) 0%, rgba(142, 68, 173, 0.25) 100%)',
                                borderRadius: '12px',
                                border: '2px solid rgba(155, 89, 182, 0.6)',
                                marginBottom: '15px',
                                boxShadow: '0 5px 12px rgba(0, 0, 0, 0.3)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.85rem',
                                    color: '#BA68C8',
                                    marginBottom: '9px',
                                    fontWeight: 'bold',
                                }}
                            >
                                🎬 总回放数
                            </div>
                            <div
                                style={{
                                    fontSize: '2.7rem',
                                    color: '#9B59B6',
                                    fontWeight: '900',
                                    lineHeight: '1',
                                    marginBottom: '6px',
                                }}
                            >
                                {data.replayTotalCount}
                            </div>
                            <div style={{ fontSize: '0.9rem', color: 'rgba(255,255,255,0.9)' }}>
                                个
                            </div>
                        </div>

                        {/* 其他回放数据 - 网格布局 */}
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: 'repeat(2, 1fr)',
                                gap: '10px',
                                width: '100%',
                                maxWidth: '270px',
                                marginBottom: '15px',
                            }}
                        >
                            {data.replayMostPlayedMap !== gLang('annualReport.unknown') && (
                                <div
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(155, 89, 182, 0.2)',
                                        borderRadius: '10px',
                                        border: '2px solid rgba(155, 89, 182, 0.5)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
                                        🗺️
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        {gLang('annualReport.mostUsedMap')}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.75rem',
                                            color: '#9B59B6',
                                            fontWeight: 'bold',
                                            wordBreak: 'break-word',
                                        }}
                                    >
                                        {data.replayMostPlayedMap}
                                    </div>
                                </div>
                            )}
                            {data.replayOverwatchCount > 0 && (
                                <div
                                    style={{
                                        padding: '12px',
                                        background: 'rgba(155, 89, 182, 0.2)',
                                        borderRadius: '10px',
                                        border: '2px solid rgba(155, 89, 182, 0.5)',
                                        textAlign: 'center',
                                    }}
                                >
                                    <div style={{ fontSize: '1.2rem', marginBottom: '5px' }}>
                                        👮
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.7rem',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginBottom: '5px',
                                        }}
                                    >
                                        {gLang('annualReport.overwatchCount')}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1.1rem',
                                            color: '#9B59B6',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {data.replayOverwatchCount}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            color: 'rgba(255,255,255,0.7)',
                                        }}
                                    >
                                        个
                                    </div>
                                </div>
                            )}
                        </div>

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 8: Rank Data - 段位数据 */}
                <div className={getPageClass(getPageIndex(8))}>
                    <h2># {gLang('annualReport.rankRoadTitle')}</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        {gLang('annualReport.rankRoadDesc')}
                    </p>

                    {(data.versusRank > 0 || data.casualRank > 0) && (
                        <div
                            style={{
                                display: 'grid',
                                gridTemplateColumns: '1fr 1fr',
                                gap: '20px',
                                width: '100%',
                                maxWidth: '400px',
                                marginBottom: '20px',
                            }}
                        >
                            {data.versusRank > 0 && (
                                <div
                                    style={{
                                        background: 'rgba(231, 76, 60, 0.2)',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: '2px solid #e74c3c',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#e74c3c',
                                            marginBottom: '10px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {gLang('annualReport.versusMode')}
                                    </div>
                                    <div
                                        className="big-data"
                                        style={{
                                            color: '#e74c3c',
                                            fontSize: '2.5rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {data.versusRankName}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginTop: '8px',
                                        }}
                                    >
                                        {gLang('annualReport.scoreLabel')}:{' '}
                                        {data.versusRank.toLocaleString()}
                                    </div>
                                </div>
                            )}
                            {data.casualRank > 0 && (
                                <div
                                    style={{
                                        background: 'rgba(52, 152, 219, 0.2)',
                                        padding: '20px',
                                        borderRadius: '12px',
                                        border: '2px solid #3498db',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.9rem',
                                            color: '#3498db',
                                            marginBottom: '10px',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {gLang('annualReport.casualMode')}
                                    </div>
                                    <div
                                        className="big-data"
                                        style={{
                                            color: '#3498db',
                                            fontSize: '2.5rem',
                                            fontWeight: 'bold',
                                        }}
                                    >
                                        {data.casualRankName}
                                    </div>
                                    <div
                                        style={{
                                            fontSize: '1rem',
                                            color: 'rgba(255,255,255,0.8)',
                                            marginTop: '8px',
                                        }}
                                    >
                                        {gLang('annualReport.scoreLabel')}:{' '}
                                        {data.casualRank.toLocaleString()}
                                    </div>
                                </div>
                            )}
                        </div>
                    )}

                    {data.favoriteMode && data.favoriteMode !== gLang('annualReport.unknown') && (
                        <div
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '20px',
                                background: 'rgba(241, 196, 15, 0.1)',
                                borderRadius: '15px',
                                border: '2px dashed #f1c40f',
                                marginTop: '20px',
                                textAlign: 'left',
                            }}
                        >
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                {gLang('annualReport.thirdPersonFavoriteMode')}{' '}
                                <span
                                    style={{
                                        color: '#FFC107',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {getModeEmoji(data.favoriteMode)} {data.favoriteMode}
                                </span>
                            </p>
                            {data.favoriteModeGames > 0 && (
                                <p
                                    className="sub-text"
                                    style={{
                                        fontSize: '1rem',
                                        marginBottom: '15px',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    {gLang('annualReport.thirdPersonYearWins', {
                                        mode: data.favoriteMode,
                                        count: String(data.favoriteModeGames),
                                    })}
                                </p>
                            )}
                            {data.favoriteModeMaxKills > 0 && (
                                <p
                                    className="sub-text"
                                    style={{
                                        fontSize: '1rem',
                                        marginBottom: '15px',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    {gLang('annualReport.thirdPersonMaxKills', {
                                        count: String(data.favoriteModeMaxKills),
                                    })}
                                </p>
                            )}
                        </div>
                    )}

                    {data.versusRank === 0 && data.casualRank === 0 && (
                        <p className="sub-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                            {gLang('annualReport.noRankYet')}
                        </p>
                    )}

                    {pageIndex < getLastPageIndex() &&
                        (() => {
                            // Check if next page has data
                            const nextIndex = pageIndex + 1;
                            const nextPageHasData =
                                nextIndex <= getLastPageIndex() && hasPageData(nextIndex);
                            return nextPageHasData ? (
                                <div className="swipe-hint show" onClick={nextPage}>
                                    <div className="swipe-icon">👆</div>
                                    <div className="swipe-text">
                                        {gLang('annualReport.swipeUp')}
                                    </div>
                                </div>
                            ) : null;
                        })()}
                </div>

                {/* Page 9: Currency Data - 货币数据 */}
                <div className={getPageClass(getPageIndex(9))}>
                    <h2># 钱包鼓鼓</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        他/她的财富，见证他/她的努力。
                    </p>

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '20px',
                            background: 'rgba(241, 196, 15, 0.1)',
                            borderRadius: '15px',
                            border: '2px dashed #f1c40f',
                            textAlign: 'left',
                        }}
                    >
                        {data.currentEcCoin > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                他/她的钱包里躺着{' '}
                                <span
                                    style={{
                                        color: '#FFC107',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.currentEcCoin.toLocaleString()}
                                </span>{' '}
                                EC币
                            </p>
                        )}
                        {data.currentDiamond > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                他/她的钻石库存有{' '}
                                <span
                                    style={{
                                        color: '#FFC107',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.currentDiamond.toLocaleString()}
                                </span>{' '}
                                颗
                            </p>
                        )}
                        {data.currentPoint > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                他/她的账户显示{' '}
                                <span
                                    style={{
                                        color: '#FFC107',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.currentPoint.toLocaleString()}
                                </span>{' '}
                                点卷
                            </p>
                        )}
                        {data.rechargeCount > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                这一年，他/她为 EC 充值了{' '}
                                <span
                                    style={{
                                        color: '#FFC107',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.rechargeCount}
                                </span>{' '}
                                次
                            </p>
                        )}
                        {data.currentEcCoin === 0 &&
                            data.currentDiamond === 0 &&
                            data.currentPoint === 0 && (
                                <p
                                    className="sub-text"
                                    style={{ textAlign: 'center', marginTop: '10px' }}
                                >
                                    还没有资产记录
                                </p>
                            )}
                    </div>

                    {pageIndex < getLastPageIndex() && (
                        <div className="swipe-hint show" onClick={nextPage}>
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 10: Social Data - 社交数据 */}
                <div className={getPageClass(getPageIndex(10))}>
                    <h2># 方块世界的羁绊</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        无兄弟不方块，他/她的每一次组队都是珍贵的回忆。
                    </p>

                    <div
                        style={{
                            width: '100%',
                            maxWidth: '400px',
                            padding: '20px',
                            background: 'rgba(52, 152, 219, 0.1)',
                            borderRadius: '15px',
                            border: '2px dashed #3498db',
                            textAlign: 'left',
                        }}
                    >
                        {data.friendCount > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                他/她的好友列表里有{' '}
                                <span
                                    style={{
                                        color: '#3498DB',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.friendCount}
                                </span>{' '}
                                位伙伴
                            </p>
                        )}
                        {data.teammateGames > 0 && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                这一年，他/她和朋友们组队了{' '}
                                <span
                                    style={{
                                        color: '#3498DB',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.teammateGames}
                                </span>{' '}
                                次
                            </p>
                        )}
                        {data.bestTeammate && data.bestTeammate !== gLang('annualReport.none') && (
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                与他/她并肩作战最多的，是{' '}
                                <span
                                    style={{
                                        color: '#3498DB',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.bestTeammate}
                                </span>
                            </p>
                        )}
                    </div>

                    {data.friendCount === 0 && data.teammateGames === 0 && (
                        <p className="sub-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                            还没有社交记录，快去结交新朋友吧！
                        </p>
                    )}

                    {pageIndex < getLastPageIndex() && (
                        <div className="swipe-hint show" onClick={nextPage}>
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 11: Ticket Stats - Overview - 工单概览 */}
                {data.totalTickets > 0 && (
                    <div className={getPageClass(getPageIndex(11))}>
                        <p
                            className="sub-text"
                            style={{ marginBottom: '30px', fontSize: '1.1rem' }}
                        >
                            他/她的每一次反馈，都在让 EC 变得更好。
                        </p>

                        <div
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '20px',
                                background: 'rgba(231, 76, 60, 0.1)',
                                borderRadius: '15px',
                                border: '2px dashed #e74c3c',
                                textAlign: 'left',
                            }}
                        >
                            <p
                                className="sub-text"
                                style={{
                                    fontSize: '1rem',
                                    marginBottom: '15px',
                                    lineHeight: '1.8',
                                }}
                            >
                                这一年，他/她向 EC 提交了{' '}
                                <span
                                    style={{
                                        color: '#F44336',
                                        fontWeight: 'bold',
                                        fontSize: '1.2rem',
                                        fontFamily: "'Minecraft', monospace",
                                    }}
                                >
                                    {data.totalTickets}
                                </span>{' '}
                                次工单
                            </p>
                        </div>

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 12: Ticket Stats - Types - 工单类型分布 */}
                {data.totalTickets > 0 && Object.keys(data.ticketTypeCounts).length > 0 && (
                    <div className={getPageClass(getPageIndex(12))}>
                        <p
                            className="sub-text"
                            style={{ marginBottom: '30px', fontSize: '1.1rem' }}
                        >
                            看看他/她都提交了哪些类型的工单。
                        </p>

                        {/* Pie Chart */}
                        {(() => {
                            const entries = Object.entries(data.ticketTypeCounts);
                            const total = entries.reduce((sum, [, count]) => sum + count, 0);
                            const colors = [
                                '#F44336',
                                '#E91E63',
                                '#9C27B0',
                                '#673AB7',
                                '#3F51B5',
                                '#2196F3',
                                '#03A9F4',
                                '#00BCD4',
                                '#009688',
                                '#4CAF50',
                            ];
                            const radius = 80;
                            const centerX = 100;
                            const centerY = 100;
                            let currentAngle = -90; // Start from top

                            return (
                                <div
                                    style={{
                                        width: '100%',
                                        maxWidth: '400px',
                                        padding: '20px',
                                        background: 'rgba(231, 76, 60, 0.1)',
                                        borderRadius: '15px',
                                        border: '2px dashed #e74c3c',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        alignItems: 'center',
                                        gap: '20px',
                                    }}
                                >
                                    <svg
                                        width="200"
                                        height="200"
                                        viewBox="0 0 200 200"
                                        style={{ flexShrink: 0 }}
                                    >
                                        {entries.map(([type, count], index) => {
                                            const percentage = (count / total) * 100;
                                            const angle = (percentage / 100) * 360;
                                            const startAngle = currentAngle;
                                            const endAngle = currentAngle + angle;
                                            const path = createPieSlice(
                                                startAngle,
                                                endAngle,
                                                radius,
                                                centerX,
                                                centerY
                                            );
                                            const color = colors[index % colors.length];
                                            currentAngle = endAngle;

                                            return (
                                                <path
                                                    key={type}
                                                    d={path}
                                                    fill={color}
                                                    stroke="#fff"
                                                    strokeWidth="2"
                                                    opacity="0.8"
                                                />
                                            );
                                        })}
                                    </svg>

                                    {/* Legend */}
                                    <div
                                        style={{
                                            width: '100%',
                                            display: 'flex',
                                            flexDirection: 'column',
                                            gap: '10px',
                                        }}
                                    >
                                        {entries.map(([type, count], index) => {
                                            const percentage = ((count / total) * 100).toFixed(1);
                                            const color = colors[index % colors.length];
                                            return (
                                                <div
                                                    key={type}
                                                    style={{
                                                        color: '#f5f5f5',
                                                        fontWeight: 'bold',
                                                        display: 'flex',
                                                        alignItems: 'center',
                                                        justifyContent: 'space-between',
                                                        gap: '10px',
                                                        fontSize: '0.9rem',
                                                    }}
                                                >
                                                    <div
                                                        style={{
                                                            display: 'flex',
                                                            alignItems: 'center',
                                                            gap: '10px',
                                                            flex: 1,
                                                        }}
                                                    >
                                                        <div
                                                            style={{
                                                                width: '16px',
                                                                height: '16px',
                                                                backgroundColor: color,
                                                                borderRadius: '4px',
                                                                flexShrink: 0,
                                                            }}
                                                        ></div>
                                                        <span>{type}</span>
                                                    </div>
                                                    <span
                                                        style={{
                                                            color: '#f5f5f5',
                                                            fontWeight: 'bold',
                                                            whiteSpace: 'nowrap',
                                                        }}
                                                    >
                                                        {count} 次 ({percentage}%)
                                                    </span>
                                                </div>
                                            );
                                        })}
                                    </div>
                                </div>
                            );
                        })()}

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 13: Ticket Stats - Special - 特殊记录 */}
                {data.totalTickets > 0 && (data.rewardCount > 0 || data.unbanCount > 0) && (
                    <div className={getPageClass(getPageIndex(13))}>
                        <p
                            className="sub-text"
                            style={{ marginBottom: '30px', fontSize: '1.1rem' }}
                        >
                            这些时刻值得被记住。
                        </p>

                        <div
                            style={{
                                width: '100%',
                                maxWidth: '400px',
                                padding: '20px',
                                background: 'rgba(46, 204, 113, 0.1)',
                                borderRadius: '15px',
                                border: '2px dashed #2ecc71',
                                textAlign: 'left',
                            }}
                        >
                            {data.rewardCount > 0 && (
                                <p
                                    className="sub-text"
                                    style={{
                                        fontSize: '1rem',
                                        marginBottom: '15px',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    这一年，他/她收到了{' '}
                                    <span
                                        style={{
                                            color: '#4CAF50',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            fontFamily: "'Minecraft', monospace",
                                        }}
                                    >
                                        {data.rewardCount}
                                    </span>{' '}
                                    次礼包奖励
                                </p>
                            )}
                            {data.unbanCount > 0 && (
                                <p
                                    className="sub-text"
                                    style={{
                                        fontSize: '1rem',
                                        marginBottom: '15px',
                                        lineHeight: '1.8',
                                    }}
                                >
                                    他/她的账号被解封了{' '}
                                    <span
                                        style={{
                                            color: '#4CAF50',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            fontFamily: "'Minecraft', monospace",
                                        }}
                                    >
                                        {data.unbanCount}
                                    </span>{' '}
                                    次
                                </p>
                            )}
                        </div>

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 14: 年度称号 */}
                {hasPageData(getPageIndex(14)) && (
                    <div className={getPageClass(getPageIndex(14))}>
                        <h2>我的 2025 年度称号</h2>

                        <div
                            style={{
                                background: '#fff',
                                color: '#1a1a1a',
                                padding: '25px 20px',
                                borderRadius: '15px',
                                width: '100%',
                                maxWidth: '320px',
                                boxShadow: '0 10px 20px rgba(0,0,0,0.5)',
                                position: 'relative',
                                marginBottom: '30px',
                            }}
                        >
                            {data.yearTitle && (
                                <>
                                    <h1
                                        style={{
                                            color: '#1a1a1a',
                                            textShadow: 'none',
                                            fontSize: '2.2rem',
                                            marginBottom: '10px',
                                        }}
                                    >
                                        {data.yearTitle.name}
                                    </h1>
                                    <p style={{ fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                                        {data.yearTitle.description}
                                    </p>
                                    <hr
                                        style={{
                                            margin: '15px 0',
                                            border: 'none',
                                            borderTop: '2px dashed #1a1a1a',
                                        }}
                                    />
                                </>
                            )}
                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'space-around',
                                    fontFamily: 'sans-serif',
                                    fontSize: '0.9rem',
                                }}
                            >
                                <div>
                                    <b>{data.totalGames}</b>
                                    <br />
                                    总场次
                                </div>
                                <div>
                                    <b>{data.favoriteMode}</b>
                                    <br />
                                    本命模式
                                </div>
                                <div>
                                    <b>{data.yearsWithEC}年</b>
                                    <br />
                                    EC老兵
                                </div>
                            </div>
                            {data.aiEvaluation && (
                                <div
                                    style={{
                                        marginTop: '20px',
                                        padding: '15px',
                                        background: 'rgba(52, 152, 219, 0.1)',
                                        borderRadius: '8px',
                                        fontSize: '0.85rem',
                                        lineHeight: '1.6',
                                        color: '#34495e',
                                        fontFamily: 'sans-serif',
                                        textAlign: 'left',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontWeight: 'bold',
                                            marginBottom: '8px',
                                            color: '#3498db',
                                            display: 'flex',
                                            alignItems: 'center',
                                            justifyContent: 'space-between',
                                        }}
                                    >
                                        <span>✨ AI年度评价</span>
                                    </div>
                                    <div>{data.aiEvaluation}</div>
                                </div>
                            )}
                            <div
                                style={{
                                    marginTop: '20px',
                                    fontSize: '0.8rem',
                                    color: '#7f8c8d',
                                    fontFamily: 'sans-serif',
                                }}
                            >
                                EaseCation 2025 年度报告
                            </div>
                        </div>

                        {pageIndex < getLastPageIndex() && (
                            <div className="swipe-hint" onClick={nextPage}>
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Last Page: 总结页 */}
                <div
                    className={getPageClass(getPageIndex(totalPages))}
                    style={{
                        position: 'relative',
                        padding: '0',
                        paddingBottom: '160px',
                        maxWidth: '100%',
                        width: '100%',
                        marginTop: '0',
                        top: '0',
                        alignItems: 'flex-start',
                    }}
                >
                    <h2
                        style={{
                            fontSize: '1.3rem',
                            marginBottom: '6px',
                            marginTop: '0',
                            paddingTop: '0',
                            lineHeight: '1.2',
                            width: '100%',
                            textAlign: 'center',
                            color: '#d3d3d3',
                        }}
                    >
                        2025 年度总结
                    </h2>

                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(3, 1fr)',
                            gap: '4px',
                            width: '100%',
                            maxWidth: '100%',
                            marginBottom: '10px',
                            padding: '0 8px',
                        }}
                    >
                        {/* 登录统计 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.totalLoginDays, 'login-stats')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>登录天数</div>
                        </div>

                        {/* 游戏场次 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.totalGames, 'game-stats')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>总场次</div>
                        </div>

                        {/* 总击杀 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.totalKills, 'game-stats')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>总击杀</div>
                        </div>

                        {/* 总胜利 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.totalWins, 'game-stats')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>总胜利</div>
                        </div>

                        {/* 在线时长 */}
                        {(data.totalHours > 0 || !isDataTypeIncluded('login-stats')) && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(
                                        data.totalHours > 0 ? Math.floor(data.totalHours) : 0,
                                        'login-stats'
                                    )}
                                    {isDataTypeIncluded('login-stats') ? 'h' : ''}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>在线时长</div>
                            </div>
                        )}

                        {/* 本命模式 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    wordBreak: 'break-word',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.favoriteMode, 'game-stats')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>本命模式</div>
                        </div>

                        {/* 竞技段位 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '0.7rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    wordBreak: 'break-word',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.versusRankName, 'rank-data')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>竞技段位</div>
                        </div>

                        {/* 休闲段位 */}
                        {data.casualRankName && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.7rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        wordBreak: 'break-word',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.casualRankName, 'rank-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>休闲段位</div>
                            </div>
                        )}

                        {/* 好友数 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.friendCount, 'social-data')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>好友数</div>
                        </div>

                        {/* 队友场次 */}
                        {data.teammateGames > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.teammateGames, 'social-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>队友场次</div>
                            </div>
                        )}

                        {/* EC币 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.currentEcCoin, 'currency-data')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>EC币</div>
                        </div>

                        {/* 钻石 */}
                        <div
                            style={{
                                background: 'rgba(255, 255, 255, 0.1)',
                                padding: '6px 4px',
                                borderRadius: '4px',
                                backdropFilter: 'blur(10px)',
                            }}
                        >
                            <div
                                style={{
                                    fontSize: '1rem',
                                    fontWeight: 'bold',
                                    marginBottom: '1px',
                                    lineHeight: '1',
                                    color: '#d3d3d3',
                                }}
                            >
                                {maskValue(data.currentDiamond, 'currency-data')}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>钻石</div>
                        </div>

                        {/* 积分 */}
                        {data.currentPoint > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.currentPoint, 'currency-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>积分</div>
                            </div>
                        )}

                        {/* 充值次数 */}
                        {data.rechargeCount > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.rechargeCount, 'currency-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>充值次数</div>
                            </div>
                        )}

                        {/* 最长在线 */}
                        {data.longestOnlineHours > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.longestOnlineHours, 'login-stats')}
                                    {isDataTypeIncluded('login-stats') ? 'h' : ''}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>最长在线</div>
                            </div>
                        )}

                        {/* 回放数 */}
                        {data.replayTotalCount > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.replayTotalCount, 'game-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>回放数</div>
                            </div>
                        )}

                        {/* 工单数 */}
                        {data.totalTickets > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.totalTickets, 'ticket-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>工单数</div>
                            </div>
                        )}

                        {/* {gLang('annualReport.withEC')}年数 */}
                        {data.yearsWithEC > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.yearsWithEC, 'basic-info')}
                                    {isDataTypeIncluded('basic-info')
                                        ? gLang('annualReport.yearSuffix')
                                        : ''}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                    {gLang('annualReport.withEC')}
                                </div>
                            </div>
                        )}

                        {/* 首次登录日期 */}
                        {data.firstLoginDate && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        wordBreak: 'break-word',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(formatDate(data.firstLoginDate), 'login-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>首次登录</div>
                            </div>
                        )}

                        {/* 最早登录时间 */}
                        {data.earliestLoginTime &&
                            (() => {
                                const date = new Date(data.earliestLoginTime);
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return (
                                    <div
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            padding: '6px 4px',
                                            borderRadius: '4px',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                marginBottom: '1px',
                                                lineHeight: '1',
                                                color: '#d3d3d3',
                                            }}
                                        >
                                            {maskValue(`${hours}:${minutes}`, 'login-stats')}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                            最早登录
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* 最晚登录时间 */}
                        {data.latestLoginTime &&
                            (() => {
                                const date = new Date(data.latestLoginTime);
                                const hours = String(date.getHours()).padStart(2, '0');
                                const minutes = String(date.getMinutes()).padStart(2, '0');
                                return (
                                    <div
                                        style={{
                                            background: 'rgba(255, 255, 255, 0.1)',
                                            padding: '6px 4px',
                                            borderRadius: '4px',
                                            backdropFilter: 'blur(10px)',
                                        }}
                                    >
                                        <div
                                            style={{
                                                fontSize: '0.75rem',
                                                fontWeight: 'bold',
                                                marginBottom: '1px',
                                                lineHeight: '1',
                                                color: '#d3d3d3',
                                            }}
                                        >
                                            {maskValue(`${hours}:${minutes}`, 'login-stats')}
                                        </div>
                                        <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                            最晚登录
                                        </div>
                                    </div>
                                );
                            })()}

                        {/* 最长在线日期 */}
                        {data.longestOnlineDate && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        wordBreak: 'break-word',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.longestOnlineDate, 'login-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                    最长在线日
                                </div>
                            </div>
                        )}

                        {/* 竞技段位分数 */}
                        {data.versusRank > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.versusRank, 'rank-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>竞技分数</div>
                            </div>
                        )}

                        {/* 休闲段位分数 */}
                        {data.casualRank > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.85rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.casualRank, 'rank-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>休闲分数</div>
                            </div>
                        )}

                        {/* 本命模式游戏数 */}
                        {data.favoriteModeGames > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.favoriteModeGames, 'game-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>本命场次</div>
                            </div>
                        )}

                        {/* 本命模式最高击杀 */}
                        {data.favoriteModeMaxKills > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.favoriteModeMaxKills, 'game-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                    {gLang('annualReport.cumulativeKills')}
                                </div>
                            </div>
                        )}

                        {/* {gLang('annualReport.mostUsedMap')} */}
                        {data.replayMostPlayedMap &&
                            data.replayMostPlayedMap !== gLang('annualReport.unknown') && (
                                <div
                                    style={{
                                        background: 'rgba(255, 255, 255, 0.1)',
                                        padding: '6px 4px',
                                        borderRadius: '4px',
                                        backdropFilter: 'blur(10px)',
                                    }}
                                >
                                    <div
                                        style={{
                                            fontSize: '0.65rem',
                                            fontWeight: 'bold',
                                            marginBottom: '1px',
                                            lineHeight: '1',
                                            wordBreak: 'break-word',
                                            color: '#d3d3d3',
                                        }}
                                    >
                                        {maskValue(data.replayMostPlayedMap, 'game-stats')}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                        常用地图
                                    </div>
                                </div>
                            )}

                        {/* {gLang('annualReport.overwatchCount')}数 */}
                        {data.replayOverwatchCount > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.replayOverwatchCount, 'game-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                    {gLang('annualReport.overwatchCount')}
                                </div>
                            </div>
                        )}

                        {/* 最佳队友 */}
                        {data.bestTeammate && data.bestTeammate !== gLang('annualReport.none') && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '0.65rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        wordBreak: 'break-word',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.bestTeammate, 'social-data')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>最佳队友</div>
                            </div>
                        )}

                        {/* 奖励数 */}
                        {data.rewardCount > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.rewardCount, 'ticket-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>奖励数</div>
                            </div>
                        )}

                        {/* 解封数 */}
                        {data.unbanCount > 0 && (
                            <div
                                style={{
                                    background: 'rgba(255, 255, 255, 0.1)',
                                    padding: '6px 4px',
                                    borderRadius: '4px',
                                    backdropFilter: 'blur(10px)',
                                }}
                            >
                                <div
                                    style={{
                                        fontSize: '1rem',
                                        fontWeight: 'bold',
                                        marginBottom: '1px',
                                        lineHeight: '1',
                                        color: '#d3d3d3',
                                    }}
                                >
                                    {maskValue(data.unbanCount, 'ticket-stats')}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>解封数</div>
                            </div>
                        )}
                    </div>

                    <div
                        style={{
                            display: 'flex',
                            flexDirection: 'column',
                            alignItems: 'center',
                            marginTop: '8px',
                            width: '100%',
                            position: 'relative',
                        }}
                    >
                        <div
                            style={{
                                position: 'absolute',
                                left: '66.67%',
                                transform: 'translateX(-50%)',
                                display: 'flex',
                                flexDirection: 'column',
                                alignItems: 'center',
                            }}
                        >
                            <button
                                className="mc-btn"
                                style={{
                                    background: '#f1c40f',
                                    color: '#1a1a1a',
                                    borderColor: '#1a1a1a',
                                    fontSize: '0.85rem',
                                    padding: '6px 12px',
                                    width: 'auto',
                                }}
                                onClick={() => navigate('/?openModal=AnnualReportModal')}
                            >
                                查看我的年度报告
                            </button>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default AnnualReportShare;
