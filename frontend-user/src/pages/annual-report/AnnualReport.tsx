// Annual Report Page - 2025年度报告
import React, { useState, useRef, useEffect } from 'react';
import { useParams, useSearchParams, useNavigate } from 'react-router-dom';
import { fetchData } from '@common/axiosConfig';
import axiosInstance from '@common/axiosConfig';
import { getGlobalMessageApi } from '@common/utils/messageApiHolder';
import { YearSummaryResponse } from '../../services/yearSummary.service';
import { gLang } from '@common/language';
import { Modal, Button, message, Checkbox, InputNumber, Space } from 'antd';
import {
    CopyOutlined,
    DownloadOutlined,
    SoundOutlined,
    SoundFilled,
    DoubleRightOutlined,
} from '@ant-design/icons';
import QRCode from 'qrcode';
import MinecraftPlayer3D from '../../components/MinecraftPlayer3D/MinecraftPlayer3D';
import useIsPC from '@common/hooks/useIsPC';
import { TICKET_TYPE_NAME_MAP } from '@ecuc/shared/constants/ticket.constants';
import './AnnualReport.css';

const ANNUAL_REPORT_BACKGROUND_VIDEO_URL =
    'https://uc.easecation.net/media/annual-report/background-20260304.mp4';

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

const AnnualReport: React.FC = () => {
    // State management
    const [pageIndex, setPageIndex] = useState<number>(0);
    const [data, setData] = useState<AnnualReportData | null>(null);
    const [loading, setLoading] = useState<boolean>(true);
    const [progress, setProgress] = useState<number>(0);
    const [isProgressComplete, setIsProgressComplete] = useState<boolean>(false);
    const [error, setError] = useState<string | null>(null);
    // Track request status: 'pending' | 'success' | 'error'
    const [requestStatus, setRequestStatus] = useState<
        Record<string, 'pending' | 'success' | 'error'>
    >({
        'basic-info': 'pending',
        'login-stats': 'pending',
        'game-stats': 'pending',
        'rank-data': 'pending',
        'currency-data': 'pending',
        'social-data': 'pending',
        'ticket-stats': 'pending',
        'calculate-title': 'pending',
        'ai-evaluation': 'pending',
    });

    // Track which pages should show swipe hint (only after request returns)
    const [showSwipeHint, setShowSwipeHint] = useState<Record<number, boolean>>({});

    // Legacy boolean flags for backward compatibility (derived from requestStatus)
    const basicInfoLoaded = requestStatus['basic-info'] === 'success';
    const loginStatsLoaded = requestStatus['login-stats'] === 'success';
    const [regeneratingAI, setRegeneratingAI] = useState<boolean>(false); // Track if regenerating AI evaluation
    const [shareModalVisible, setShareModalVisible] = useState<boolean>(false);
    const [shareLink, setShareLink] = useState<string>('');
    const [shareImage, setShareImage] = useState<string>('');
    const [isGeneratingShare, setIsGeneratingShare] = useState<boolean>(false);
    const [shareConfigStep, setShareConfigStep] = useState<'config' | 'result'>('config');
    const [selectedShareTypes, setSelectedShareTypes] = useState<string[]>(['basic-info']);
    const [shareValidHours, setShareValidHours] = useState<number | null>(168); // Default 7 days (max 3 months = 2160 hours)
    const [desktopWarningVisible, setDesktopWarningVisible] = useState<boolean>(false);
    const [isClaimingTitle, setIsClaimingTitle] = useState<boolean>(false);
    const [titleAlreadyClaimed, setTitleAlreadyClaimed] = useState<boolean>(false);
    const [claimTitleModalOpen, setClaimTitleModalOpen] = useState<boolean>(false);
    const [claimTitleData, setClaimTitleData] = useState<{
        key: string;
        name: string;
        description: string;
        prefix: string;
    } | null>(null);
    const [isMuted, setIsMuted] = useState<boolean>(false);
    const appRef = useRef<HTMLDivElement>(null);
    const yearTitleNameRef = useRef<HTMLHeadingElement>(null);
    const [messageApi, contextHolder] = message.useMessage();
    const isPC = useIsPC();

    // Available share types
    const shareTypeOptions = [
        { label: gLang('annualReport.sectionBasic'), value: 'basic-info' },
        { label: gLang('annualReport.sectionLogin'), value: 'login-stats' },
        { label: gLang('annualReport.sectionGame'), value: 'game-stats' },
        { label: gLang('annualReport.sectionRank'), value: 'rank-data' },
        { label: gLang('annualReport.sectionCurrency'), value: 'currency-data' },
        { label: gLang('annualReport.sectionSocial'), value: 'social-data' },
        { label: gLang('annualReport.sectionTicket'), value: 'ticket-stats' },
        { label: gLang('annualReport.sectionAI'), value: 'ai-evaluation' },
        { label: gLang('annualReport.sectionTitle'), value: 'calculate-title' },
    ];

    // Router
    const { ecid: ecidFromParams } = useParams<{ ecid: string }>();
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

    // Check if device is desktop (width > height) and show warning modal
    useEffect(() => {
        const checkDevice = () => {
            const isDesktop = window.innerWidth > window.innerHeight;
            if (isDesktop) {
                // Check if warning has been shown before
                const hasSeenWarning = localStorage.getItem('annual-report-desktop-warning-seen');
                if (!hasSeenWarning) {
                    setDesktopWarningVisible(true);
                }
            }
        };

        // Check on mount
        checkDevice();

        // Check on resize
        window.addEventListener('resize', checkDevice);
        return () => {
            window.removeEventListener('resize', checkDevice);
        };
    }, []);

    // Show progress bar immediately when component mounts
    useEffect(() => {
        if (pageIndex === 0 && !isProgressComplete) {
            setProgress(0);
            setIsProgressComplete(false);
        }
    }, []);

    // Progress bar animation for page 1 - only completes when basic-info and login-stats are both loaded
    useEffect(() => {
        if (pageIndex === 0 && basicInfoLoaded && loginStatsLoaded) {
            // If progress is already complete (e.g., user navigated back), keep it complete
            if (isProgressComplete) {
                // Already complete, keep it at 100%
                setProgress(100);
                return;
            }

            // Only start progress animation when both basic-info and login-stats are loaded
            // Progress bar should already be visible at 0%, now animate to 100%
            const interval = setInterval(() => {
                setProgress(prev => {
                    if (prev >= 100) {
                        clearInterval(interval);
                        setIsProgressComplete(true);
                        return 100;
                    }
                    return prev + 2; // 每次增加2%，50次更新完成
                });
            }, 50); // 每50ms更新一次，总共约2.5秒

            return () => clearInterval(interval);
        }
    }, [pageIndex, basicInfoLoaded, loginStatsLoaded, isProgressComplete]);

    // Monitor request status changes and show swipe hint when request returns
    useEffect(() => {
        // When page changes, immediately hide hint (ensure it starts from opacity 0)
        setShowSwipeHint(prev => ({ ...prev, [pageIndex]: false }));

        // Check if current page should show hint based on request status
        const shouldShow = shouldShowSwipeHintBasedOnRequest(pageIndex);

        // Only show hint if request has returned (not pending)
        if (shouldShow) {
            // Wait for React to update the DOM and browser to apply the hidden state
            // Then trigger fade-in animation
            const timer = setTimeout(() => {
                // Use requestAnimationFrame to ensure the element is in the DOM with opacity 0
                requestAnimationFrame(() => {
                    requestAnimationFrame(() => {
                        // Now add show class to trigger fade-in
                        setShowSwipeHint(prev => ({ ...prev, [pageIndex]: true }));
                    });
                });
            }, 200); // Delay to ensure the element is hidden first

            return () => clearTimeout(timer);
        }
    }, [pageIndex, requestStatus, data]);

    // Helper function to check if swipe hint should be shown based on request status
    const shouldShowSwipeHintBasedOnRequest = (currentIndex: number): boolean => {
        // Don't show hint on last page
        if (currentIndex >= getLastPageIndex()) return false;

        const lastPageIndex = getLastPageIndex();
        let nextIndex = currentIndex + 1;

        // First, check if the immediate next page's request is still pending
        if (nextIndex <= lastPageIndex && isRequestPendingForPage(nextIndex)) {
            return false; // Don't show hint if request is still pending
        }

        // If the immediate next page can be accessed, show hint
        if (nextIndex <= lastPageIndex && canAccessPage(nextIndex) && hasPageData(nextIndex)) {
            return true;
        }

        // If the immediate next page doesn't have data (and request has returned), check next available page
        // But don't show hint if any page in the path has pending request
        while (nextIndex <= lastPageIndex) {
            // Don't show hint if request is still pending for any page in the path
            if (isRequestPendingForPage(nextIndex)) {
                return false;
            }

            // Check if this page can be accessed and has data
            if (canAccessPage(nextIndex) && hasPageData(nextIndex)) {
                return true;
            }

            nextIndex++;
        }

        return false; // No accessible page found
    };

    // Get ECID from route params and fetch year summary data
    useEffect(() => {
        const loadData = async () => {
            try {
                setLoading(true);
                setError(null);

                // Get ECID from route params (required)
                const ecid = ecidFromParams;

                if (!ecid) {
                    setError(gLang('annualReport.ecidMissing'));
                    setLoading(false);
                    return;
                }

                // Fetch player name from account list (non-blocking)
                let playerName: string = ecid;
                fetchData({
                    url: '/ec/list',
                    method: 'GET',
                    data: {},
                    setData: response => {
                        const ecList = response?.data || response || [];
                        const matchedAccount = ecList.find((ec: any) => ec.ecid === ecid);
                        if (matchedAccount && matchedAccount.name) {
                            playerName = matchedAccount.name;
                        }
                    },
                    setSpin: () => {},
                }).catch(() => {
                    // Continue with ecid as fallback
                });

                // Fetch year summary data - request each type separately in parallel
                const year = parseInt(searchParams.get('year') || '2025', 10);
                const types: Array<
                    | 'basic-info'
                    | 'login-stats'
                    | 'game-stats'
                    | 'rank-data'
                    | 'currency-data'
                    | 'social-data'
                    | 'ticket-stats'
                    | 'ai-evaluation'
                    | 'calculate-title'
                > = [
                    'basic-info',
                    'login-stats',
                    'game-stats',
                    'rank-data',
                    'currency-data',
                    'social-data',
                    'ticket-stats',
                    'ai-evaluation',
                    'calculate-title',
                ];

                // Request data storage (will be populated as responses arrive)
                const summaryData: YearSummaryResponse = {
                    data: {},
                    aiEvaluation: undefined,
                };

                // Send all requests in parallel (non-blocking, don't wait for responses)
                types.forEach(type => {
                    // Mark request as pending
                    setRequestStatus(prev => ({ ...prev, [type]: 'pending' }));

                    // Fire and forget - each request updates state when it completes
                    fetchData({
                        url: '/year-summary',
                        method: 'GET',
                        data: {
                            ecid,
                            year,
                            type,
                        },
                        setData: response => {
                            // Extract data from response
                            const responseData = response?.data || response;

                            // Mark request as success
                            setRequestStatus(prev => ({ ...prev, [type]: 'success' }));

                            // Store data for later transformation
                            if (type === 'ai-evaluation') {
                                summaryData.aiEvaluation =
                                    responseData?.evaluation || responseData?.aiEvaluation;
                            } else if (type === 'calculate-title') {
                                (summaryData.data as any)['calculate-title'] = responseData;
                            } else {
                                (summaryData.data as any)[type] = responseData;
                            }

                            // Transform and update data when all required data is available
                            // Check if we have enough data to transform (at least basic-info)
                            if (summaryData.data['basic-info']) {
                                transformAndSetData(summaryData, playerName, ecid);
                            }
                        },
                        setSpin: () => {},
                    }).catch(() => {
                        // Mark request as error
                        setRequestStatus(prev => ({ ...prev, [type]: 'error' }));
                        // If basic-info fails, show error
                        if (type === 'basic-info') {
                            setError(gLang('annualReport.fetchBasicFailed'));
                            setLoading(false);
                        }
                    });
                });

                // Helper function to transform and set data
                const transformAndSetData = (
                    data: YearSummaryResponse,
                    name: string,
                    ecid: string
                ) => {
                    // Transform backend data to display format
                    const basicInfo: any = data.data['basic-info'] || {};
                    const loginStats: any = data.data['login-stats'] || {};
                    const gameStats: any = data.data['game-stats'] || {};
                    const rankData: any = data.data['rank-data'] || {};
                    const currencyData: any = data.data['currency-data'] || {};
                    const socialData: any = data.data['social-data'] || {};
                    const ticketStats: any = data.data['ticket-stats'] || {};
                    const calculateTitleData: any = data.data['calculate-title'] || {};

                    // Only transform if we have basic-info (required)
                    if (!basicInfo || Object.keys(basicInfo).length === 0) {
                        return;
                    }

                    // Calculate yearsWithEC from registerDate
                    let yearsWithEC = 0;
                    if (basicInfo.registerDate) {
                        const registerDate = new Date(basicInfo.registerDate);
                        const currentYear = new Date().getFullYear();
                        yearsWithEC = Math.max(0, currentYear - registerDate.getFullYear());
                    }

                    // Calculate totalHours from totalOnlineSeconds
                    const totalHours = loginStats?.totalOnlineSeconds
                        ? Math.round(loginStats.totalOnlineSeconds / 3600)
                        : 0;

                    // Process login-stats
                    const longestOnlineHours = loginStats?.longestOnlineSeconds
                        ? Math.round(loginStats.longestOnlineSeconds / 3600)
                        : 0;

                    // Helper function to get game name from language.ts
                    const getGameName = (gameKey: string): string => {
                        if (gameKey === 'bedwars') {
                            return gLang('annualReport.gameBedwars');
                        }
                        const gameName = gLang(`game.${gameKey}`);
                        return gameName !== `game.${gameKey}`
                            ? gameName
                            : gameKey || gLang('annualReport.unknown');
                    };

                    // Process game-stats: calculate totals from gameModeStats array
                    let totalGames = 0;
                    let totalKills = 0;
                    let totalWins = 0;
                    let favoriteMode = gLang('annualReport.unknown');
                    let favoriteModeGames = 0;
                    let favoriteModeWinRate = 0;
                    let favoriteModeMaxKills = 0;

                    if (gameStats?.gameModeStats && Array.isArray(gameStats.gameModeStats)) {
                        gameStats.gameModeStats.forEach((mode: any) => {
                            const win = mode.WIN !== undefined ? mode.WIN : 0;
                            const kill = mode.KILL !== undefined ? mode.KILL : 0;
                            const modeGames = win || (kill > 0 ? 1 : 0);

                            totalGames += modeGames;
                            totalKills += kill;
                            totalWins += win;

                            if (modeGames > favoriteModeGames) {
                                favoriteModeGames = modeGames;
                                favoriteMode = getGameName(mode.game);
                                favoriteModeWinRate = 0;
                                favoriteModeMaxKills = kill;
                            }
                        });
                    }

                    // Process replay stats
                    const replayTotalCount = gameStats?.replayStats?.replayTotalCount || 0;
                    const replayMostPlayedMap =
                        gameStats?.replayStats?.replayMostPlayedMap?.map ||
                        gLang('annualReport.unknown');
                    const replayOverwatchCount = gameStats?.replayStats?.replayOverwatchCount || 0;

                    // Process rank-data: extract from s8VersusRank and s8CasualRank
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

                    const versusRank = rankData?.s8VersusRank?.score || 0;
                    const versusRankName = versusScoreToRank(versusRank);
                    const casualRank = rankData?.s8CasualRank?.score || 0;
                    const casualRankName = casualScoreToRank(casualRank);

                    // Process currency-data
                    const currentEcCoin = currencyData?.currentEcCoin || 0;
                    const currentDiamond = currencyData?.currentDiamond || 0;
                    const currentPoint = currencyData?.currentPoint || 0;
                    const rechargeCount = currencyData?.rechargeCount || 0;

                    // Process social-data
                    const teammateGames = socialData?.teamCount || 0;
                    const friendCount = socialData?.friendCount || 0;
                    const bestTeammate =
                        socialData?.mostTeammateName ||
                        socialData?.mostTeammateEcid ||
                        gLang('annualReport.none');

                    const transformedData: AnnualReportData = {
                        ecid: ecid,
                        nickname: basicInfo.name || name,
                        firstLoginDate: loginStats?.firstLoginDate || basicInfo.registerDate || '',
                        yearsWithEC: yearsWithEC,
                        skinData: basicInfo.skinData,
                        geometryData: basicInfo.geometryData,
                        totalLoginDays: loginStats?.loginDays || 0,
                        earliestLoginTime: loginStats?.earliestLoginTime || '',
                        latestLoginTime: loginStats?.latestLoginTime || '',
                        totalHours: totalHours,
                        longestOnlineDate: loginStats?.longestOnlineDate
                            ? formatDate(loginStats.longestOnlineDate)
                            : '',
                        longestOnlineHours: longestOnlineHours,
                        totalGames: totalGames,
                        totalKills: totalKills,
                        totalWins: totalWins,
                        winRate: 0,
                        gameModeStats: gameStats?.gameModeStats || [],
                        replayTotalCount: replayTotalCount,
                        replayMostPlayedMap: replayMostPlayedMap,
                        replayOverwatchCount: replayOverwatchCount,
                        favoriteMode: favoriteMode,
                        favoriteModeGames: favoriteModeGames,
                        favoriteModeWinRate: favoriteModeWinRate,
                        favoriteModeMaxKills: favoriteModeMaxKills,
                        favoriteModeMaxStreak: 0,
                        versusRank: versusRank,
                        versusRankName: versusRankName,
                        casualRank: casualRank,
                        casualRankName: casualRankName,
                        currentEcCoin: currentEcCoin,
                        currentDiamond: currentDiamond,
                        currentPoint: currentPoint,
                        rechargeCount: rechargeCount,
                        friendCount: friendCount,
                        teammateGames: teammateGames,
                        bestTeammate: bestTeammate,
                        totalTickets: ticketStats?.totalTickets || 0,
                        ticketTypeCounts: convertTicketTypeCounts(ticketStats?.typeCounts || {}),
                        rewardCount: ticketStats?.rewardCount || 0,
                        unbanCount: ticketStats?.unbanCount || 0,
                        personaTitle: data.aiEvaluation
                            ? extractKeyword(data.aiEvaluation)
                            : gLang('annualReport.ecPlayer'),
                        aiEvaluation: data.aiEvaluation,
                        yearTitle: calculateTitleData?.title || undefined,
                    };

                    setData(transformedData);
                    setLoading(false);
                };
            } catch (err: any) {
                setError(
                    err.response?.data?.EPF_description ||
                        err.message ||
                        gLang('annualReport.fetchYearSummaryFailedShort')
                );
                setLoading(false);
            }
        };

        loadData();
    }, [ecidFromParams, searchParams]);

    // Auto-resize year title name font size to fit card width (only on Page 14)
    useEffect(() => {
        // Only adjust when on Page 14
        if (pageIndex !== getPageIndex(14) || !yearTitleNameRef.current || !data?.yearTitle?.name)
            return;

        const element = yearTitleNameRef.current;
        const cardElement = element.parentElement;
        if (!cardElement) return;

        // Get card width (maxWidth: 320px, padding: 20px each side)
        const cardWidth = Math.min(320, cardElement.offsetWidth || 320);
        const maxWidth = cardWidth - 40; // Subtract padding

        // Start with 2.2rem and reduce until it fits
        let fontSize = 2.2;
        const minFontSize = 0.8;

        // Create a temporary span to measure text width
        const measureSpan = document.createElement('span');
        measureSpan.style.visibility = 'hidden';
        measureSpan.style.position = 'absolute';
        measureSpan.style.whiteSpace = 'nowrap';
        measureSpan.style.fontWeight = 'bold';
        measureSpan.style.fontFamily = 'sans-serif';
        document.body.appendChild(measureSpan);

        const adjustFontSize = () => {
            measureSpan.style.fontSize = `${fontSize}rem`;
            measureSpan.textContent = data.yearTitle?.name ?? '';
            const textWidth = measureSpan.offsetWidth;

            if (textWidth > maxWidth && fontSize > minFontSize) {
                fontSize -= 0.1;
                adjustFontSize();
            } else {
                element.style.fontSize = `${fontSize}rem`;
            }
        };

        // Small delay to ensure DOM is ready
        setTimeout(() => {
            adjustFontSize();
            document.body.removeChild(measureSpan);
        }, 100);
    }, [data?.yearTitle?.name, pageIndex]);

    // Regenerate AI evaluation
    const handleRegenerateAIEvaluation = async () => {
        if (regeneratingAI || !data) return;

        const ecid = ecidFromParams;
        const year = parseInt(searchParams.get('year') || '2025', 10);

        if (!ecid) {
            alert(gLang('annualReport.ecidMissing'));
            return;
        }

        setRegeneratingAI(true);

        const messageApi = getGlobalMessageApi();
        if (messageApi) {
            messageApi.loading(gLang('inProgress'), 0.5);
        }

        try {
            // Send POST request and get response directly
            const response = await axiosInstance.post('/year-summary/ai-evaluation', {
                ecid,
                year,
            });

            // Check response status
            if (response.data.EPF_code && response.data.EPF_code !== 200) {
                const api = messageApi || getGlobalMessageApi();
                api?.error(
                    response.data.message ||
                        response.data.EPF_description ||
                        gLang('annualReport.regenerateFailed')
                );
                return;
            }

            // Extract aiEvaluation from response
            const aiEvaluation = response.data?.aiEvaluation || response.data?.data?.aiEvaluation;

            if (aiEvaluation) {
                // Update the data state with new AI evaluation
                setData(prev => (prev ? { ...prev, aiEvaluation } : null));

                // Show success message
                const api = messageApi || getGlobalMessageApi();
                api?.success(gLang('success'));
            } else {
                const api = messageApi || getGlobalMessageApi();
                api?.error(gLang('annualReport.regenerateFailedRetry'));
            }
        } catch (err: any) {
            const api = messageApi || getGlobalMessageApi();
            if (err.response?.data?.EPF_code && err.response?.data?.EPF_code !== 200) {
                api?.error(
                    err.response.data.message ||
                        err.response.data.EPF_description ||
                        gLang('annualReport.regenerateFailed')
                );
            } else {
                api?.error(err.message || gLang('annualReport.regenerateFailed'));
            }
        } finally {
            setRegeneratingAI(false);
        }
    };

    // Open share modal with config
    const handleShareAnnualReport = () => {
        if (!data) return;
        // Reset to default values when opening modal
        // basic-info is always required
        const allOtherTypes = [
            'basic-info',
            'login-stats',
            'game-stats',
            'rank-data',
            'currency-data',
            'social-data',
            'ticket-stats',
            'ai-evaluation',
            'calculate-title',
        ];
        setSelectedShareTypes(allOtherTypes);
        setShareValidHours(168);
        setShareConfigStep('config');
        setShareLink('');
        setShareImage('');
        setShareModalVisible(true);
    };

    // Calculate and claim year title
    const handleClaimYearTitle = async () => {
        if (!data || isClaimingTitle) return;

        try {
            setIsClaimingTitle(true);
            const ecid = ecidFromParams;
            const year = 2025; // Current year

            // First, check if we already have the title from initial load
            let title = data.yearTitle;

            // If not, fetch it
            if (!title) {
                const calculateResponse = await axiosInstance.get('/year-summary', {
                    params: { ecid, year, type: 'calculate-title' },
                });

                if (calculateResponse.data.EPF_code === 200 && calculateResponse.data.data) {
                    // calculate-title 类型返回的数据格式是 { title: {...} }
                    const titleData = calculateResponse.data.data;
                    title = titleData.title || titleData;
                } else {
                    messageApi.error(
                        calculateResponse.data.EPF_description ||
                            gLang('annualReport.calcTitleFailed')
                    );
                    return;
                }
            }

            // Show confirmation modal (controlled for dark mode)
            if (title) {
                setClaimTitleData(title);
                setClaimTitleModalOpen(true);
            }
        } catch (error: any) {
            messageApi.error(
                error.response?.data?.EPF_description || gLang('annualReport.calcTitleFailedRetry')
            );
        } finally {
            setIsClaimingTitle(false);
        }
    };

    const handleClaimTitleConfirm = async () => {
        if (!claimTitleData || !ecidFromParams) return;
        try {
            const claimResponse = await axiosInstance.post('/year-summary/calculate-title', {
                ecid: ecidFromParams,
                year: 2025,
            });
            if (claimResponse.data.EPF_code === 200 && claimResponse.data.data) {
                setYearTitle(claimResponse.data.data);
                setTitleAlreadyClaimed(true);
                messageApi.success(gLang('annualReport.claimSuccess'));
                setClaimTitleModalOpen(false);
                setClaimTitleData(null);
            } else {
                messageApi.error(
                    claimResponse.data.EPF_description || gLang('annualReport.claimFailed')
                );
            }
        } catch (error: unknown) {
            const err = error as { response?: { data?: { EPF_description?: string } } };
            messageApi.error(
                err.response?.data?.EPF_description || gLang('annualReport.claimFailedRetry')
            );
        }
    };

    // Generate share link and image
    const handleGenerateShare = async () => {
        if (!data || isGeneratingShare) return;

        // Ensure basic-info is always selected
        if (!selectedShareTypes.includes('basic-info')) {
            setSelectedShareTypes(prev => [...prev, 'basic-info']);
        }

        if (selectedShareTypes.length === 0) {
            messageApi.error(gLang('annualReport.shareTypeRequired'));
            return;
        }

        if (!shareValidHours || shareValidHours <= 0 || !Number.isInteger(shareValidHours)) {
            messageApi.error(gLang('annualReport.validHoursRequired'));
            return;
        }

        const ecid = ecidFromParams;
        const year = parseInt(searchParams.get('year') || '2025', 10);

        if (!ecid) {
            messageApi.error(gLang('annualReport.ecidMissing'));
            return;
        }

        setIsGeneratingShare(true);
        messageApi.loading(gLang('annualReport.generatingShareLink'), 0);

        try {
            // Filter out 'all' if it exists (should not happen, but just in case)
            const typesToShare = selectedShareTypes.filter(t => t !== 'all');

            if (typesToShare.length === 0) {
                messageApi.error(gLang('annualReport.shareTypeRequiredShort'));
                setIsGeneratingShare(false);
                return;
            }

            // 1. Generate share link with types array
            const shareResponse = await axiosInstance.post('/year-summary/share-link', {
                ecid,
                year,
                types: typesToShare,
                validHours: shareValidHours,
            });

            if (shareResponse.data.EPF_code && shareResponse.data.EPF_code !== 200) {
                messageApi.error(
                    shareResponse.data.message ||
                        shareResponse.data.EPF_description ||
                        gLang('annualReport.shareLinkFailed')
                );
                return;
            }

            const link = shareResponse.data?.data?.shareLink || shareResponse.data?.shareLink;
            if (!link) {
                messageApi.error(gLang('annualReport.shareLinkFailedShort'));
                return;
            }

            setShareLink(link);

            // 2. Generate share image by directly rendering Page 14 (年度称号) with Canvas
            if (!data || !data.yearTitle) {
                messageApi.error(gLang('annualReport.yearTitleDataMissing'));
                return;
            }

            // Base ratio: 390*844, but actual image size is 2x: 780*1688
            const scale = 2; // Scale factor
            const baseWidth = 390;
            const baseHeight = 844;

            // All dimensions are based on baseWidth/baseHeight, then multiplied by scale
            // This ensures consistent layout regardless of scale

            // Render a new 3D model for the share image (not capturing existing one)
            let modelImageData: string | null = null;

            if (data.skinData) {
                try {
                    // Dynamically import skinview3d
                    const skinview3d = await import('skinview3d');

                    // Create a temporary canvas for rendering the 3D model (scaled)
                    const modelCanvas = document.createElement('canvas');
                    modelCanvas.width = 200 * scale;
                    modelCanvas.height = 280 * scale;

                    // Create skin viewer
                    const viewer = new skinview3d.SkinViewer({
                        canvas: modelCanvas,
                        width: 200 * scale,
                        height: 280 * scale,
                        skin: data.skinData.startsWith('data:')
                            ? data.skinData
                            : `data:image/png;base64,${data.skinData}`,
                    });

                    // Set background to transparent
                    viewer.background = null;

                    // Set camera position
                    viewer.camera.position.set(0, 0, 60);
                    viewer.controls.enableRotate = false;
                    viewer.controls.enableZoom = false;
                    viewer.controls.enablePan = false;
                    viewer.autoRotate = false;

                    // Set idle animation (微动)
                    if (skinview3d.IdleAnimation) {
                        const idleAnim = new skinview3d.IdleAnimation();
                        idleAnim.speed = 1;
                        idleAnim.paused = false;
                        viewer.animation = idleAnim;
                    }

                    // Wait for model to render (render a few frames)
                    await new Promise(resolve => setTimeout(resolve, 1000));

                    // Force render
                    viewer.render();

                    // Wait a bit more for animation to start
                    await new Promise(resolve => setTimeout(resolve, 500));

                    // Capture the canvas using readPixels
                    const gl =
                        modelCanvas.getContext('webgl', { preserveDrawingBuffer: true }) ||
                        modelCanvas.getContext('webgl2', { preserveDrawingBuffer: true });

                    if (gl) {
                        const width = modelCanvas.width;
                        const height = modelCanvas.height;
                        const pixels = new Uint8Array(width * height * 4);

                        gl.bindFramebuffer(gl.FRAMEBUFFER, null);
                        gl.readPixels(0, 0, width, height, gl.RGBA, gl.UNSIGNED_BYTE, pixels);

                        // Create a 2D canvas from the pixels
                        const tempCanvas = document.createElement('canvas');
                        tempCanvas.width = width;
                        tempCanvas.height = height;
                        const tempCtx = tempCanvas.getContext('2d');
                        if (tempCtx) {
                            const imageData = tempCtx.createImageData(width, height);
                            // Flip vertically (WebGL has origin at bottom-left, Canvas has origin at top-left)
                            for (let y = 0; y < height; y++) {
                                for (let x = 0; x < width; x++) {
                                    const srcIdx = ((height - 1 - y) * width + x) * 4;
                                    const dstIdx = (y * width + x) * 4;
                                    imageData.data[dstIdx] = pixels[srcIdx];
                                    imageData.data[dstIdx + 1] = pixels[srcIdx + 1];
                                    imageData.data[dstIdx + 2] = pixels[srcIdx + 2];
                                    imageData.data[dstIdx + 3] = pixels[srcIdx + 3];
                                }
                            }
                            tempCtx.putImageData(imageData, 0, 0);
                            modelImageData = tempCanvas.toDataURL('image/png');
                            console.log(
                                gLang('annualReport.modelRenderSuccess'),
                                modelImageData.length
                            );
                        }
                    }

                    // Cleanup
                    viewer.dispose();
                } catch (e) {
                    console.error(gLang('annualReport.modelRenderFailed'), e);
                }
            }

            // Load background image
            const bgImage = new Image();
            bgImage.crossOrigin = 'anonymous';
            await new Promise((resolve, reject) => {
                bgImage.onload = resolve;
                bgImage.onerror = reject;
                bgImage.src = '/sharebackground.png';
            });

            // Load logo image
            const logoImage = new Image();
            logoImage.crossOrigin = 'anonymous';
            await new Promise((resolve, _reject) => {
                logoImage.onload = resolve;
                logoImage.onerror = err => {
                    console.warn(gLang('annualReport.logoLoadFailed'), err);
                    resolve(null); // Continue even if logo fails to load
                };
                logoImage.src = '/logo/EaseCation.png';
            });

            // Create QR code canvas (scaled)
            const qrSize = 120 * scale;
            const qrCanvas = document.createElement('canvas');
            qrCanvas.width = qrSize;
            qrCanvas.height = qrSize;

            // Generate QR code
            await QRCode.toCanvas(qrCanvas, link, {
                width: qrSize,
                margin: 2 * scale,
                color: {
                    dark: '#000000',
                    light: '#FFFFFF',
                },
            });

            // Apply gradient to QR code and make background transparent
            const qrCtx = qrCanvas.getContext('2d');
            if (qrCtx) {
                const imageData = qrCtx.getImageData(0, 0, qrSize, qrSize);
                const data = imageData.data;

                for (let y = 0; y < qrSize; y++) {
                    for (let x = 0; x < qrSize; x++) {
                        const idx = (y * qrSize + x) * 4;
                        const r = data[idx];
                        const g = data[idx + 1];
                        const b = data[idx + 2];

                        // Check if pixel is white (light background) - make it transparent
                        if (r > 200 && g > 200 && b > 200) {
                            data[idx + 3] = 0; // Set alpha to 0 (transparent)
                        } else {
                            // Apply gradient to dark pixels (QR code)
                            const gradientX = x / qrSize;
                            const gradientY = y / qrSize;
                            const gradientPos = (gradientX + gradientY) / 2;

                            // Top-left orange (#FF8C00) to bottom-right green-yellow (#ADFF2F)
                            const r1 = 255,
                                g1 = 140,
                                b1 = 0; // Orange
                            const r2 = 173,
                                g2 = 255,
                                b2 = 47; // Green-yellow

                            data[idx] = Math.round(r1 + (r2 - r1) * gradientPos);
                            data[idx + 1] = Math.round(g1 + (g2 - g1) * gradientPos);
                            data[idx + 2] = Math.round(b1 + (b2 - b1) * gradientPos);
                        }
                    }
                }
                qrCtx.putImageData(imageData, 0, 0);
            }

            // Create final canvas
            const canvas = document.createElement('canvas');
            canvas.width = baseWidth * scale; // 780
            canvas.height = baseHeight * scale; // 1688
            const ctx = canvas.getContext('2d');

            if (!ctx) {
                messageApi.error(gLang('annualReport.canvasCreateFailed'));
                return;
            }

            // Draw background image (scaled to canvas size)
            ctx.drawImage(bgImage, 0, 0, canvas.width, canvas.height);

            // Draw logo in top-right corner
            if (logoImage.complete && logoImage.naturalWidth > 0) {
                const logoBaseWidth = 80; // Base logo width (will be scaled)
                const logoBaseHeight = 30; // Base logo height (will be scaled)
                const logoWidth = logoBaseWidth * scale;
                const logoHeight = logoBaseHeight * scale;
                const logoMargin = 20; // Base margin from edges
                const logoX = canvas.width - logoWidth - logoMargin * scale;
                const logoY = logoMargin * scale;

                // Draw logo with aspect ratio preserved
                const logoAspectRatio = logoImage.naturalWidth / logoImage.naturalHeight;
                let drawLogoWidth = logoWidth;
                let drawLogoHeight = logoHeight;

                // Adjust to maintain aspect ratio
                if (logoAspectRatio > logoWidth / logoHeight) {
                    // Logo is wider, fit to width
                    drawLogoHeight = logoWidth / logoAspectRatio;
                } else {
                    // Logo is taller, fit to height
                    drawLogoWidth = logoHeight * logoAspectRatio;
                }

                // Center logo in the allocated space
                const logoDrawX = logoX + (logoWidth - drawLogoWidth) / 2;
                const logoDrawY = logoY + (logoHeight - drawLogoHeight) / 2;

                ctx.drawImage(logoImage, logoDrawX, logoDrawY, drawLogoWidth, drawLogoHeight);
            }

            // Load Minecraft font for Canvas
            // Wait for font to be loaded before using it
            const normalFont =
                '-apple-system, BlinkMacSystemFont, "Segoe UI", "PingFang SC", "Hiragino Sans GB", "Microsoft YaHei", "Helvetica Neue", Helvetica, Arial, sans-serif';
            const minecraftFont = 'Minecraft, monospace';

            // Wait for Minecraft font to load
            try {
                await document.fonts.load(`bold ${12}px ${minecraftFont}`);
            } catch (e) {
                console.warn(gLang('annualReport.fontLoadFailed'), e);
            }

            // Draw title: nickname\n的2025 年度称号
            // Base positions (for 390*844): title at top, card centered
            const titleMainFontSize = 1.3;
            const titleY = 60;
            const titleLineHeight = 30;

            ctx.fillStyle = '#d3d3d3';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'top';

            // Draw nickname with Minecraft font
            const nickname = data.nickname || data.ecid || gLang('annualReport.player');
            ctx.font = `bold ${titleMainFontSize * scale}rem ${minecraftFont}`;
            ctx.fillText(nickname, canvas.width / 2, titleY * scale);

            // Draw "的2025 年度称号" with normal font
            ctx.font = `bold ${titleMainFontSize * scale}rem ${normalFont}`;
            ctx.fillText(
                gLang('annualReport.yearTitleSuffix'),
                canvas.width / 2,
                (titleY + titleLineHeight) * scale
            );

            // Draw title card background
            // Card is centered horizontally, positioned below title
            const cardWidth = 280; // Base width (will be scaled)
            const cardHeight = 440; // Base height (will be scaled)
            const cardX = (baseWidth - cardWidth) / 2; // Center horizontally
            const cardY = 150; // Base Y position
            const cardRadius = 15; // Base radius

            // Helper function to draw rounded rectangle
            const drawRoundedRect = (
                x: number,
                y: number,
                width: number,
                height: number,
                radius: number
            ) => {
                ctx.beginPath();
                ctx.moveTo(x + radius, y);
                ctx.lineTo(x + width - radius, y);
                ctx.quadraticCurveTo(x + width, y, x + width, y + radius);
                ctx.lineTo(x + width, y + height - radius);
                ctx.quadraticCurveTo(x + width, y + height, x + width - radius, y + height);
                ctx.lineTo(x + radius, y + height);
                ctx.quadraticCurveTo(x, y + height, x, y + height - radius);
                ctx.lineTo(x, y + radius);
                ctx.quadraticCurveTo(x, y, x + radius, y);
                ctx.closePath();
            };

            // Card shadow (offset by 5px base, scaled)
            ctx.fillStyle = 'rgba(0, 0, 0, 0.3)';
            drawRoundedRect(
                (cardX + 5) * scale,
                (cardY + 5) * scale,
                cardWidth * scale,
                cardHeight * scale,
                cardRadius * scale
            );
            ctx.fill();

            // Card background
            ctx.fillStyle = '#ffffff';
            drawRoundedRect(
                cardX * scale,
                cardY * scale,
                cardWidth * scale,
                cardHeight * scale,
                cardRadius * scale
            );
            ctx.fill();

            // Draw title name with auto-sizing to fit card width
            ctx.fillStyle = '#1a1a1a';
            ctx.textAlign = 'center';
            const titleName = data.yearTitle.name;
            const cardPadding = 20; // Base padding
            const maxTitleWidth = (cardWidth - cardPadding * 2) * scale; // Scaled max width
            let titleFontSize = 2.2; // Start with 2.2rem (base)
            let titleWidth = 0;

            // Calculate font size to fit width (using Minecraft font)
            do {
                ctx.font = `bold ${titleFontSize * scale}rem ${minecraftFont}`;
                titleWidth = ctx.measureText(titleName).width;
                if (titleWidth > maxTitleWidth && titleFontSize > 0.8) {
                    titleFontSize -= 0.1;
                } else {
                    break;
                }
            } while (titleWidth > maxTitleWidth && titleFontSize > 0.8);

            // Draw the title with calculated font size (Minecraft font)
            ctx.font = `bold ${titleFontSize * scale}rem ${minecraftFont}`;
            ctx.fillText(titleName, (cardX + cardWidth / 2) * scale, (cardY + 25) * scale);

            // Draw description with text wrapping (normal font for description text)
            ctx.fillStyle = '#1a1a1a';
            const descFontSize = 1; // Base font size
            ctx.font = `bold ${descFontSize * scale}rem ${normalFont}`;
            ctx.textAlign = 'center';
            const descriptionText = data.yearTitle.description;
            const maxDescWidth = (cardWidth - cardPadding * 2) * scale; // Scaled max width
            const descLineHeight = 24; // Base line height
            let descY = (cardY + 80) * scale; // Scaled Y position

            // Helper function to wrap text
            const wrapText = (text: string, maxWidth: number, x: number, y: number) => {
                const words = text.split('');
                let line = '';
                let currentY = y;

                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i];
                    const metrics = ctx.measureText(testLine);

                    if (metrics.width > maxWidth && line.length > 0) {
                        ctx.fillText(line, x, currentY);
                        line = words[i];
                        currentY += descLineHeight * scale;
                    } else {
                        line = testLine;
                    }
                }

                if (line.length > 0) {
                    ctx.fillText(line, x, currentY);
                    currentY += descLineHeight * scale;
                }

                return currentY;
            };

            descY = wrapText(descriptionText, maxDescWidth, (cardX + cardWidth / 2) * scale, descY);

            // Draw divider line (adjust position based on description height)
            const dividerSpacing = 10; // Base spacing
            const dividerY = descY + dividerSpacing * scale; // Add some spacing after description
            ctx.strokeStyle = '#1a1a1a';
            ctx.lineWidth = 2 * scale;
            ctx.setLineDash([10 * scale, 5 * scale]);
            ctx.beginPath();
            ctx.moveTo((cardX + cardPadding) * scale, dividerY);
            ctx.lineTo((cardX + cardWidth - cardPadding) * scale, dividerY);
            ctx.stroke();
            ctx.setLineDash([]);

            // Draw stats (adjust position based on divider)
            ctx.fillStyle = '#1a1a1a';
            const statsFontSize = 0.9; // Base font size
            ctx.textAlign = 'center';
            const statsSpacing = 20; // Base spacing
            const statsY = dividerY + statsSpacing * scale; // Position after divider with spacing
            const cardCenterX = (cardX + cardWidth / 2) * scale;

            // Draw variable values with Minecraft font
            ctx.font = `bold ${statsFontSize * scale}rem ${minecraftFont}`;
            ctx.fillText(`${data.totalGames}`, (cardX + cardWidth / 6) * scale, statsY);
            ctx.fillText(data.favoriteMode || gLang('annualReport.unknown'), cardCenterX, statsY);
            ctx.fillText(
                `${data.yearsWithEC}${gLang('annualReport.yearSuffix')}`,
                (cardX + (cardWidth * 5) / 6) * scale,
                statsY
            );

            // Draw labels with normal font
            ctx.font = `bold ${statsFontSize * scale}rem ${normalFont}`;
            ctx.fillText(
                gLang('annualReport.totalGames'),
                (cardX + cardWidth / 6) * scale,
                statsY + statsSpacing * scale
            );
            ctx.fillText(
                gLang('annualReport.favoriteMode'),
                cardCenterX,
                statsY + statsSpacing * scale
            );
            ctx.fillText(
                gLang('annualReport.ecVeteran'),
                (cardX + (cardWidth * 5) / 6) * scale,
                statsY + statsSpacing * scale
            );

            // Draw AI evaluation if exists
            if (data.aiEvaluation) {
                const evalOffsetY = 200; // Base offset from card top
                const evalHeight = 180; // Base height
                const evalY = (cardY + evalOffsetY) * scale;
                const evalPadding = 15; // Base padding

                // Evaluation background
                ctx.fillStyle = 'rgba(52, 152, 219, 0.1)';
                drawRoundedRect(
                    (cardX + cardPadding) * scale,
                    evalY,
                    (cardWidth - cardPadding * 2) * scale,
                    evalHeight * scale,
                    8 * scale
                );
                ctx.fill();

                // Evaluation title
                ctx.fillStyle = '#3498db';
                const evalTitleFontSize = 0.85;
                ctx.font = `bold ${evalTitleFontSize * scale}rem ${normalFont}`;
                ctx.textAlign = 'left';
                ctx.fillText(
                    gLang('annualReport.aiReviewTitle'),
                    (cardX + cardPadding + evalPadding) * scale,
                    evalY + 15 * scale
                );

                // Evaluation text (wrap text) - normal font
                ctx.fillStyle = '#34495e';
                ctx.font = `${evalTitleFontSize * scale}rem ${normalFont}`;
                ctx.textAlign = 'left';
                const evalText = data.aiEvaluation;
                const maxWidth = (cardWidth - cardPadding * 2 - evalPadding * 2) * scale;
                const lineHeight = 20; // Base line height
                let y = evalY + 40 * scale;
                const words = evalText.split('');
                let line = '';
                for (let i = 0; i < words.length; i++) {
                    const testLine = line + words[i];
                    const metrics = ctx.measureText(testLine);
                    if (metrics.width > maxWidth && line.length > 0) {
                        ctx.fillText(line, (cardX + cardPadding + evalPadding) * scale, y);
                        line = words[i];
                        y += lineHeight * scale;
                        if (y > evalY + evalHeight * scale - 20 * scale) break; // Prevent overflow
                    } else {
                        line = testLine;
                    }
                }
                if (line.length > 0 && y <= evalY + evalHeight * scale - 20 * scale) {
                    ctx.fillText(line, (cardX + cardPadding + evalPadding) * scale, y);
                }
            }

            // Draw footer - normal font
            ctx.fillStyle = '#7f8c8d';
            const footerFontSize = 0.8;
            ctx.font = `${footerFontSize * scale}rem ${normalFont}`;
            ctx.textAlign = 'center';
            const footerY = (cardY + cardHeight - 30) * scale;
            ctx.fillText(
                gLang('annualReport.reportTitle2025'),
                (cardX + cardWidth / 2) * scale,
                footerY
            );

            // Draw QR code in bottom right corner
            // qrSize is already scaled (120 * scale)
            const qrMargin = 30; // Base margin from edges
            const qrYOffset = 80; // Base Y offset from bottom
            const qrX = canvas.width - qrSize - qrMargin * scale;
            const qrY = canvas.height - qrSize - qrYOffset * scale;

            // QR code background with glass effect
            const qrBgPadding = 20; // Base padding
            const qrBgSize = qrSize + qrBgPadding * 2 * scale;
            ctx.fillStyle = 'rgba(0, 0, 0, 0.6)';
            drawRoundedRect(
                qrX - qrBgPadding * scale,
                qrY - qrBgPadding * scale,
                qrBgSize,
                qrBgSize + 30 * scale,
                16 * scale
            );
            ctx.fill();

            // Draw QR code
            ctx.drawImage(qrCanvas, qrX, qrY, qrSize, qrSize);

            // Draw QR code text - normal font
            ctx.fillStyle = '#b0b0b0';
            const qrTextFontSize = 0.65;
            ctx.font = `${qrTextFontSize * scale}rem ${normalFont}`;
            ctx.textAlign = 'center';
            const qrTextY = qrY + qrSize + 15 * scale;
            ctx.fillText(gLang('annualReport.scanQRHint'), qrX + qrSize / 2, qrTextY);

            // Draw 3D model if available (bottom-left position for Page 14)
            const modelBaseWidth = 200; // Base model width
            const modelBaseHeight = 280; // Base model height
            const modelWidth = modelBaseWidth * scale;
            const modelHeight = modelBaseHeight * scale;
            const modelX = 0;
            const modelY = canvas.height - modelHeight;

            // Use captured WebGL image
            if (modelImageData && modelImageData !== 'data:,' && modelImageData.length > 100) {
                try {
                    const modelImg = new Image();
                    await new Promise((resolve, _reject) => {
                        modelImg.onload = () => {
                            console.log(
                                gLang('annualReport.modelImageSuccess'),
                                modelImg.width,
                                'x',
                                modelImg.height
                            );
                            resolve(null);
                        };
                        modelImg.onerror = err => {
                            console.error(gLang('annualReport.modelImageFailed'), err);
                            _reject(err);
                        };
                        modelImg.src = modelImageData || '';
                    });

                    // Draw the image, maintaining aspect ratio
                    const sourceAspect = modelImg.width / modelImg.height;
                    const targetAspect = modelWidth / modelHeight;

                    let drawWidth = modelWidth;
                    let drawHeight = modelHeight;
                    let drawX = modelX;
                    let drawY = modelY;

                    if (sourceAspect > targetAspect) {
                        // Source is wider, fit to height
                        drawWidth = modelHeight * sourceAspect;
                        drawX = modelX - (drawWidth - modelWidth) / 2;
                    } else {
                        // Source is taller, fit to width
                        drawHeight = modelWidth / sourceAspect;
                        drawY = modelY - (drawHeight - modelHeight) / 2;
                    }

                    ctx.drawImage(modelImg, drawX, drawY, drawWidth, drawHeight);
                } catch {
                    messageApi.error(gLang('annualReport.modelImageFailedRetry'));
                }
            }

            const imageData = canvas.toDataURL('image/png');
            setShareImage(imageData);

            messageApi.destroy();
            setShareConfigStep('result');
        } catch (err: any) {
            messageApi.error(
                err.response?.data?.EPF_description ||
                    err.message ||
                    gLang('annualReport.generateShareFailedShort')
            );
            setIsGeneratingShare(false);
        } finally {
            setIsGeneratingShare(false);
        }
    };

    // Copy share link to clipboard
    const handleCopyLink = async () => {
        try {
            await navigator.clipboard.writeText(shareLink);
            messageApi.success(gLang('annualReport.linkCopied'));
        } catch {
            messageApi.error(gLang('annualReport.copyFailedManual'));
        }
    };

    // dataURL 转 Blob
    const dataURLtoBlob = (dataUrl: string): Blob => {
        const [header, base64] = dataUrl.split(',');
        const mimeMatch = header.match(/data:(.*?);base64/);
        const mime = mimeMatch ? mimeMatch[1] : 'image/png';
        const binaryString = atob(base64);
        const len = binaryString.length;
        const bytes = new Uint8Array(len);
        for (let i = 0; i < len; i++) {
            bytes[i] = binaryString.charCodeAt(i);
        }
        return new Blob([bytes], { type: mime });
    };

    // Download share image
    const handleDownloadImage = () => {
        if (!shareImage) return;

        const year = parseInt(searchParams.get('year') || '2025', 10);
        const filename = gLang('annualReport.reportFilename', {
            year,
            name: data?.nickname || data?.ecid || 'report',
        });

        const link = document.createElement('a');
        link.href = shareImage;
        link.download = filename;
        link.click();
        messageApi.success(gLang('annualReport.imageDownloadSuccess'));
    };

    // Copy share image to clipboard
    const handleCopyImage = async () => {
        if (!shareImage) return;

        try {
            const blob = dataURLtoBlob(shareImage);
            const mimeType = blob.type || 'image/png';
            const ClipboardItemCtor: any = (window as any).ClipboardItem;
            if (
                navigator.clipboard &&
                typeof (navigator.clipboard as any).write === 'function' &&
                ClipboardItemCtor
            ) {
                const item = new ClipboardItemCtor({ [mimeType]: blob });
                await (navigator.clipboard as any).write([item]);
                messageApi.success(gLang('annualReport.imageCopied'));
            } else if (navigator.clipboard && typeof navigator.clipboard.writeText === 'function') {
                await navigator.clipboard.writeText(shareImage);
                messageApi.info(gLang('annualReport.imageLinkCopied'));
            } else {
                messageApi.error(gLang('annualReport.copyImageUnsupported'));
            }
        } catch {
            messageApi.error(gLang('annualReport.copyImageFailedRetry'));
        }
    };

    // Extract keyword from AI evaluation for persona title
    const extractKeyword = (evaluation: string): string => {
        // Try to extract a meaningful title from evaluation
        // Look for common patterns or keywords
        const keywordMap: Record<string, string> = {
            [gLang('annualReport.categoryBedbreak')]: gLang('annualReport.categoryBedbreakTitle'),
            [gLang('annualReport.categoryCombat')]: gLang('annualReport.categoryCombatTitle'),
            [gLang('annualReport.categorySocial')]: gLang('annualReport.categorySocialTitle'),
            [gLang('annualReport.categoryExplore')]: gLang('annualReport.categoryExploreTitle'),
            [gLang('annualReport.categoryCompetitive')]: gLang(
                'annualReport.categoryCompetitiveTitle'
            ),
            [gLang('annualReport.categoryCasual')]: gLang('annualReport.categoryCasualTitle'),
            [gLang('annualReport.categoryBedwars')]: gLang('annualReport.categoryBedwarsTitle'),
            [gLang('annualReport.categorySkywars')]: gLang('annualReport.categorySkywarsTitle'),
            Pit: gLang('annualReport.categoryPit'),
            [gLang('annualReport.categoryStreak')]: gLang('annualReport.categoryStreakTitle'),
            [gLang('annualReport.categoryWinrate')]: gLang('annualReport.categoryWinrateTitle'),
        };

        for (const [keyword, title] of Object.entries(keywordMap)) {
            if (evaluation.includes(keyword)) {
                return title;
            }
        }

        // Default fallback
        return gLang('annualReport.ecPlayer');
    };

    const handleTouchStart = (e: React.TouchEvent) => {
        // 如果模态框打开，停止捕捉滑动事件
        if (shareModalVisible || desktopWarningVisible) {
            return;
        }

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
        // 如果模态框打开，停止捕捉滑动事件
        if (shareModalVisible || desktopWarningVisible) {
            return;
        }

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
        // 如果模态框打开，停止捕捉滑动事件
        if (shareModalVisible || desktopWarningVisible) {
            return;
        }

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

        // 第一页且进度条未完成时，禁止滑动
        if (pageIndex === 0 && !isProgressComplete) {
            return;
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

    // Check if a page index has data to display
    const hasPageData = (index: number): boolean => {
        if (!data) return false;

        // Page 0: Cover - always has data
        if (index === 0) return true;

        // Page 1: Login Stats - always has data
        if (index === 1) return true;

        // Page 2: Login Time Record - needs earliestLoginTime or latestLoginTime
        // Only skip if login-stats request has returned (success or error)
        if (index === 2) {
            const loginStatsStatus = requestStatus['login-stats'];
            // If request is still pending, don't skip (return true)
            if (loginStatsStatus === 'pending') return true;
            // If request returned, check data
            return !!(data.earliestLoginTime || data.latestLoginTime);
        }

        // Page 4: Longest Online Record - needs longestOnlineHours > 0
        // When longestOnlineHours === 0, getPageIndex(4) returns Page 5's index (Game Stats Overview)
        // Only skip if login-stats request has returned (success or error)
        const page4Index = getPageIndex(4);
        const page5Index = getPageIndex(5);

        // Check if this index could be Page 4 or Page 5 (they share the same index when longestOnlineHours === 0)
        if (index === page4Index || index === page5Index) {
            // If longestOnlineHours === 0, Page 4 doesn't exist, so this index is Page 5
            if (data.longestOnlineHours === 0) {
                // This is Page 5 (Game Stats Overview)
                const gameStatsStatus = requestStatus['game-stats'];
                if (gameStatsStatus === 'pending') return true;
                return true;
            }

            // If longestOnlineHours > 0, check which page this actually is
            if (index === page4Index && index !== page5Index) {
                // This is Page 4 (indices are different)
                const loginStatsStatus = requestStatus['login-stats'];
                if (loginStatsStatus === 'pending') return true;
                return data.longestOnlineHours > 0;
            }

            if (index === page5Index) {
                // This is Page 5 (Game Stats Overview)
                const gameStatsStatus = requestStatus['game-stats'];
                if (gameStatsStatus === 'pending') return true;
                return true;
            }
        }

        // Pages 5-7: Game Stats - always has data (if game-stats request returned)
        if (index >= getPageIndex(5) && index <= getPageIndex(7)) {
            const gameStatsStatus = requestStatus['game-stats'];
            // If request is still pending, don't skip (return true)
            if (gameStatsStatus === 'pending') return true;
            // If request returned, always has data
            return true;
        }

        // Pages 8-10: Rank, Currency, Social - always has data (if respective request returned)
        if (index >= getPageIndex(8) && index <= getPageIndex(10)) {
            // Check the corresponding request status
            if (index === getPageIndex(8)) {
                const rankDataStatus = requestStatus['rank-data'];
                if (rankDataStatus === 'pending') return true;
                return true;
            }
            if (index === getPageIndex(9)) {
                const currencyDataStatus = requestStatus['currency-data'];
                if (currencyDataStatus === 'pending') return true;
                return true;
            }
            if (index === getPageIndex(10)) {
                const socialDataStatus = requestStatus['social-data'];
                if (socialDataStatus === 'pending') return true;
                return true;
            }
            return true;
        }

        // Page 11-13: Ticket Stats (only exist if totalTickets > 0)
        // When totalTickets === 0, these pages don't exist and getPageIndex(11) returns Page 14's index
        const page11Index = getPageIndex(11);
        const page14Index = getPageIndex(14);

        // Check if this index could be Page 11 or Page 14 (they share the same index when totalTickets === 0)
        if (index === page11Index || index === page14Index) {
            // If totalTickets === 0, Page 11-13 don't exist, so this index is Page 14
            if (data.totalTickets === 0) {
                // This is Page 14
                const calculateTitleStatus = requestStatus['calculate-title'];
                const aiEvaluationStatus = requestStatus['ai-evaluation'];
                if (calculateTitleStatus === 'pending' || aiEvaluationStatus === 'pending')
                    return true;
                return true;
            }

            // If totalTickets > 0, check which page this actually is
            if (index === page11Index && index !== page14Index) {
                // This is Page 11 (indices are different)
                const ticketStatsStatus = requestStatus['ticket-stats'];
                if (ticketStatsStatus === 'pending') return true;
                return data.totalTickets > 0;
            }

            if (index === page14Index) {
                // This is Page 14
                const calculateTitleStatus = requestStatus['calculate-title'];
                const aiEvaluationStatus = requestStatus['ai-evaluation'];
                if (calculateTitleStatus === 'pending' || aiEvaluationStatus === 'pending')
                    return true;
                return true;
            }
        }

        // Page 12: Ticket Stats Types - needs totalTickets > 0 and ticketTypeCounts
        // Only exists if totalTickets > 0
        if (index === getPageIndex(12)) {
            const ticketStatsStatus = requestStatus['ticket-stats'];
            if (ticketStatsStatus === 'pending') return true;
            if (data.totalTickets === 0) return false; // Page doesn't exist
            return data.totalTickets > 0 && Object.keys(data.ticketTypeCounts || {}).length > 0;
        }

        // Page 13: Ticket Stats Special - needs totalTickets > 0 and (rewardCount > 0 or unbanCount > 0)
        // Only exists if totalTickets > 0
        if (index === getPageIndex(13)) {
            const ticketStatsStatus = requestStatus['ticket-stats'];
            if (ticketStatsStatus === 'pending') return true;
            if (data.totalTickets === 0) return false; // Page doesn't exist
            return data.totalTickets > 0 && (data.rewardCount > 0 || data.unbanCount > 0);
        }

        // Last page: 总结页 - always has data
        if (index === getPageIndex(totalPages)) {
            return true;
        }

        return true; // Default to true for unknown pages
    };

    // Check if swipe hint should be shown on current page
    // Uses the showSwipeHint state which is updated when request returns
    const shouldShowSwipeHint = (currentIndex: number): boolean => {
        // Return the state value (will be true only after request returns)
        return showSwipeHint[currentIndex] === true;
    };

    // Check if a page can be accessed based on data loading status
    const canAccessPage = (targetIndex: number): boolean => {
        // Page 0: Cover - always accessible
        if (targetIndex === 0) return true;

        // Page 1: Login Stats - requires basic-info and login-stats to be success (not pending)
        if (targetIndex === 1) {
            const basicInfoStatus = requestStatus['basic-info'];
            const loginStatsStatus = requestStatus['login-stats'];
            // Only allow if both are success (not pending)
            return basicInfoStatus === 'success' && loginStatsStatus === 'success';
        }

        // Page 2: Login Time Record - requires basic-info and login-stats to be success (not pending)
        if (targetIndex === 2) {
            const basicInfoStatus = requestStatus['basic-info'];
            const loginStatsStatus = requestStatus['login-stats'];
            return basicInfoStatus === 'success' && loginStatsStatus === 'success';
        }

        // Page 4: Longest Online Record - requires basic-info and login-stats to be success (not pending)
        // When longestOnlineHours === 0, getPageIndex(4) returns Page 5's index (Game Stats Overview)
        const page4Index = getPageIndex(4);
        const page5Index = getPageIndex(5);

        // Check if this index could be Page 4 or Page 5 (they share the same index when longestOnlineHours === 0)
        if (targetIndex === page4Index || targetIndex === page5Index) {
            // If longestOnlineHours === 0, Page 4 doesn't exist, so this index is Page 5
            if (data && data.longestOnlineHours === 0) {
                // This is Page 5 (Game Stats Overview)
                const gameStatsStatus = requestStatus['game-stats'];
                return gameStatsStatus === 'success';
            }

            // If longestOnlineHours > 0, check which page this actually is
            if (targetIndex === page4Index && targetIndex !== page5Index) {
                // This is Page 4 (indices are different)
                const basicInfoStatus = requestStatus['basic-info'];
                const loginStatsStatus = requestStatus['login-stats'];
                return basicInfoStatus === 'success' && loginStatsStatus === 'success';
            }

            if (targetIndex === page5Index) {
                // This is Page 5 (Game Stats Overview)
                const gameStatsStatus = requestStatus['game-stats'];
                return gameStatsStatus === 'success';
            }
        }

        // Pages 5-7: Game Stats - requires game-stats to be success (not pending)
        // Note: Page 5 is already handled above, but we need to handle pages 6-7
        if (targetIndex >= getPageIndex(6) && targetIndex <= getPageIndex(7)) {
            const gameStatsStatus = requestStatus['game-stats'];
            // Only allow if success (not pending)
            return gameStatsStatus === 'success';
        }

        // Page 8: Rank Data - requires rank-data to be success (not pending)
        if (targetIndex === getPageIndex(8)) {
            const rankDataStatus = requestStatus['rank-data'];
            return rankDataStatus === 'success';
        }

        // Page 9: Currency Data - requires currency-data to be success (not pending)
        if (targetIndex === getPageIndex(9)) {
            const currencyDataStatus = requestStatus['currency-data'];
            return currencyDataStatus === 'success';
        }

        // Page 10: Social Data - requires social-data to be success (not pending)
        if (targetIndex === getPageIndex(10)) {
            const socialDataStatus = requestStatus['social-data'];
            return socialDataStatus === 'success';
        }

        // Pages 11-13: Ticket Stats - requires ticket-stats to be success (not pending)
        if (targetIndex >= getPageIndex(11) && targetIndex <= getPageIndex(13)) {
            const ticketStatsStatus = requestStatus['ticket-stats'];
            return ticketStatsStatus === 'success';
        }

        // Page 14: 年度关键词 - requires calculate-title and ai-evaluation to be success (not pending)
        if (targetIndex === getPageIndex(14)) {
            const calculateTitleStatus = requestStatus['calculate-title'];
            const aiEvaluationStatus = requestStatus['ai-evaluation'];
            return calculateTitleStatus === 'success' && aiEvaluationStatus === 'success';
        }

        // Last page: 总结页 - accessible if basic-info and login-stats are success (not pending)
        if (targetIndex === getLastPageIndex()) {
            const basicInfoStatus = requestStatus['basic-info'];
            const loginStatsStatus = requestStatus['login-stats'];
            return basicInfoStatus === 'success' && loginStatsStatus === 'success';
        }

        return true; // Default to true for unknown pages
    };

    // Check if a request is still pending for a specific page
    const isRequestPendingForPage = (targetIndex: number): boolean => {
        // Page 0: Cover - no request needed
        if (targetIndex === 0) return false;

        // Page 1: Login Stats - check basic-info and login-stats
        if (targetIndex === 1) {
            return (
                requestStatus['basic-info'] === 'pending' ||
                requestStatus['login-stats'] === 'pending'
            );
        }

        // Page 2: Login Time Record - check basic-info and login-stats
        if (targetIndex === 2) {
            return (
                requestStatus['basic-info'] === 'pending' ||
                requestStatus['login-stats'] === 'pending'
            );
        }

        // Page 4: Longest Online Record - check basic-info and login-stats
        // When longestOnlineHours === 0, getPageIndex(4) returns Page 5's index (Game Stats Overview)
        const page4Index = getPageIndex(4);
        const page5Index = getPageIndex(5);

        // Check if this index could be Page 4 or Page 5 (they share the same index when longestOnlineHours === 0)
        if (targetIndex === page4Index || targetIndex === page5Index) {
            // If longestOnlineHours === 0, Page 4 doesn't exist, so this index is Page 5
            if (data && data.longestOnlineHours === 0) {
                // This is Page 5 (Game Stats Overview)
                return requestStatus['game-stats'] === 'pending';
            }

            // If longestOnlineHours > 0, check which page this actually is
            if (targetIndex === page4Index && targetIndex !== page5Index) {
                // This is Page 4 (indices are different)
                return (
                    requestStatus['basic-info'] === 'pending' ||
                    requestStatus['login-stats'] === 'pending'
                );
            }

            if (targetIndex === page5Index) {
                // This is Page 5 (Game Stats Overview)
                return requestStatus['game-stats'] === 'pending';
            }
        }

        // Pages 5-7: Game Stats - check game-stats
        // Note: Page 5 is already handled above, but we need to handle pages 6-7
        if (targetIndex >= getPageIndex(6) && targetIndex <= getPageIndex(7)) {
            return requestStatus['game-stats'] === 'pending';
        }

        // Page 8: Rank Data - check rank-data
        if (targetIndex === getPageIndex(8)) {
            return requestStatus['rank-data'] === 'pending';
        }

        // Page 9: Currency Data - check currency-data
        if (targetIndex === getPageIndex(9)) {
            return requestStatus['currency-data'] === 'pending';
        }

        // Page 10: Social Data - check social-data
        if (targetIndex === getPageIndex(10)) {
            return requestStatus['social-data'] === 'pending';
        }

        // Pages 11-13: Ticket Stats - check ticket-stats
        // Note: When totalTickets === 0, these pages don't exist and getPageIndex(11) returns Page 14's index
        const page11Index = getPageIndex(11);
        const page14Index = getPageIndex(14);

        // Check if this index could be Page 11 or Page 14 (they share the same index when totalTickets === 0)
        if (targetIndex === page11Index || targetIndex === page14Index) {
            // If totalTickets === 0, Page 11-13 don't exist, so this index is Page 14
            if (data && data.totalTickets === 0) {
                // This is Page 14
                return (
                    requestStatus['calculate-title'] === 'pending' ||
                    requestStatus['ai-evaluation'] === 'pending'
                );
            }

            // If totalTickets > 0, check which page this actually is
            if (targetIndex === page11Index && targetIndex !== page14Index) {
                // This is Page 11 (indices are different)
                return requestStatus['ticket-stats'] === 'pending';
            }

            if (targetIndex === page14Index) {
                // This is Page 14
                return (
                    requestStatus['calculate-title'] === 'pending' ||
                    requestStatus['ai-evaluation'] === 'pending'
                );
            }
        }

        // Page 12-13: Ticket Stats (only exist if totalTickets > 0)
        if (targetIndex === getPageIndex(12) || targetIndex === getPageIndex(13)) {
            if (data && data.totalTickets === 0) {
                // These pages don't exist, so check Page 14 instead
                return (
                    requestStatus['calculate-title'] === 'pending' ||
                    requestStatus['ai-evaluation'] === 'pending'
                );
            }
            return requestStatus['ticket-stats'] === 'pending';
        }

        // Last page: 总结页 - check basic-info and login-stats
        if (targetIndex === getLastPageIndex()) {
            return (
                requestStatus['basic-info'] === 'pending' ||
                requestStatus['login-stats'] === 'pending'
            );
        }

        return false; // Default to false
    };

    const nextPage = () => {
        // 第一页且进度条未完成时，禁止翻页
        if (pageIndex === 0 && !isProgressComplete) {
            return;
        }
        const lastPageIndex = getLastPageIndex();

        // Check the immediate next page first
        let nextIndex = pageIndex + 1;

        // If the immediate next page's request is still pending, block sliding
        if (nextIndex <= lastPageIndex && isRequestPendingForPage(nextIndex)) {
            return; // Block sliding if request is still pending
        }

        // If the immediate next page can be accessed, go to it
        if (nextIndex <= lastPageIndex && canAccessPage(nextIndex) && hasPageData(nextIndex)) {
            setPageIndex(nextIndex);
            return;
        }

        // If the immediate next page doesn't have data (and request has returned), skip to next available page
        // Only skip pages whose requests have returned (success or error)
        while (nextIndex <= lastPageIndex) {
            // Don't skip if request is still pending
            if (isRequestPendingForPage(nextIndex)) {
                return; // Block sliding if any page in the path has pending request
            }

            // Check if this page can be accessed and has data
            if (canAccessPage(nextIndex) && hasPageData(nextIndex)) {
                setPageIndex(nextIndex);
                return;
            }

            nextIndex++;
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
                            2025
                            <br />
                            EaseCation
                            <br />
                            {gLang('annualReport.reportHeading')}
                        </h1>
                        <p className="sub-text">
                            {error ? error : gLang('annualReport.loadingMemories')}
                        </p>
                        {error && (
                            <div style={{ marginTop: '20px' }}>
                                <button className="mc-btn" onClick={() => navigate('/')}>
                                    {gLang('emailVerification.returnHome')}
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
        // Use language.ts mapping for other games
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

            {/* Skip Button - Show when all requests are completed */}
            {(() => {
                // Check if all requests are completed (not pending)
                const allRequestsCompleted = Object.values(requestStatus).every(
                    status => status !== 'pending'
                );

                // Get Page 14 index
                const page14Index = getPageIndex(14);

                // Only show if Page 14 can be accessed and has data, and we're not already on Page 14
                const canShowSkip =
                    allRequestsCompleted &&
                    canAccessPage(page14Index) &&
                    hasPageData(page14Index) &&
                    pageIndex !== page14Index;

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
                        2025
                        <br />
                        EaseCation
                        <br />
                        玩家年度报告
                    </h1>
                    {isProgressComplete && (
                        <p className="sub-text" style={{ fontSize: '1.1rem' }}>
                            ECer: {data.nickname || data.ecid}
                        </p>
                    )}
                    <p className="sub-text">正在加载你的易什记忆...</p>

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
                            今年你第一次推开了 EC 的大门
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

                    {pageIndex < getLastPageIndex() && (
                        <div
                            key={`swipe-hint-${pageIndex}`}
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 3: Login Time Record - 登录时间记录 */}
                {(data.earliestLoginTime || data.latestLoginTime) && (
                    <div className={getPageClass(2)}>
                        <h2># 你的登录时间</h2>
                        <p className="sub-text" style={{ marginBottom: '30px' }}>
                            记录你与 EC 的每一次相遇。
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
                                            🌅 这一年你的登录时间
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
                                            🌙 这一年你的登录时间
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
                                        evaluation = gLang('annualReport.playerTimeAllDay');
                                    } else {
                                        evaluation = gLang('annualReport.playerTimeNight');
                                    }
                                }
                                // Early bird (05:00 - 08:00)
                                else if (earliestHour >= 5 && earliestHour < 8) {
                                    evaluation = gLang('annualReport.playerTimeMorning');
                                }
                                // Regular player (08:00 - 23:00)
                                else if (earliestHour >= 8 && latestHour < 23) {
                                    evaluation = gLang('annualReport.playerTimeLoyal');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeLoyal2');
                                }
                            } else if (data.earliestLoginTime) {
                                const earliestDate = new Date(data.earliestLoginTime);
                                const earliestHour = earliestDate.getHours();
                                // Early bird (05:00 - 08:00)
                                if (earliestHour >= 5 && earliestHour < 8) {
                                    evaluation = gLang('annualReport.playerTimeMorning');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeLoyal2');
                                }
                            } else if (data.latestLoginTime) {
                                const latestDate = new Date(data.latestLoginTime);
                                const latestHour = latestDate.getHours();
                                // Night owl (23:00 - 05:00, considering 5 AM as start of new day)
                                if (latestHour >= 23 || latestHour < 5) {
                                    evaluation = gLang('annualReport.playerTimeNight');
                                } else {
                                    evaluation = gLang('annualReport.playerTimeLoyal2');
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

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 4: Longest Online Record - 最长在线记录 */}
                {data.longestOnlineHours > 0 && (
                    <div className={getPageClass(getPageIndex(4))}>
                        <h2># 最长在线记录</h2>
                        <p className="sub-text" style={{ marginBottom: '30px' }}>
                            那一天，你在 EC 停留了最久。
                        </p>

                        <div className="big-data-block">
                            <span className="data-label">日期</span>
                            <span className="big-data green-text">{data.longestOnlineDate}</span>
                        </div>

                        <div className="big-data-block" style={{ marginTop: '30px' }}>
                            <span className="data-label">在线时长</span>
                            <span className="big-data green-text">
                                {data.longestOnlineHours}{' '}
                                <span style={{ fontSize: '1.5rem' }}>
                                    {gLang('annualReport.hours')}
                                </span>
                            </span>
                        </div>

                        <p className="sub-text" style={{ marginTop: '40px', fontSize: '1rem' }}>
                            {gLang('annualReport.thatDayBond')}
                        </p>

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 5: Game Stats - Overview - 游戏统计概览 */}
                <div className={getPageClass(getPageIndex(5))}>
                    <h2># 战斗狂人的日常</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        你的每一场战斗，都在书写传奇。
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
                        <div
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
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
                                    你在不同模式中的精彩表现。
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

                                {pageIndex < getLastPageIndex() &&
                                    shouldShowSwipeHint(pageIndex) && (
                                        <div
                                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                            onClick={nextPage}
                                        >
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
                            记录你的精彩瞬间。
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
                                        最常用地图
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
                                        被监管
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

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 8: Rank Data - 段位数据 */}
                <div className={getPageClass(getPageIndex(8))}>
                    <h2># 竞技之路</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        你的段位，见证你的成长。
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
                                        竞技模式
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
                                        分数: {data.versusRank.toLocaleString()}
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
                                        休闲模式
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
                                        分数: {data.casualRank.toLocaleString()}
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
                                你的本命模式是{' '}
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
                                    这一年，你在{' '}
                                    <span
                                        style={{
                                            color: '#FFC107',
                                            fontWeight: 'bold',
                                            fontFamily: "'Minecraft', monospace",
                                        }}
                                    >
                                        {data.favoriteMode}
                                    </span>{' '}
                                    中胜利了{' '}
                                    <span
                                        style={{
                                            color: '#FFC107',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            fontFamily: "'Minecraft', monospace",
                                        }}
                                    >
                                        {data.favoriteModeGames}
                                    </span>{' '}
                                    场
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
                                    你的全年击杀记录是{' '}
                                    <span
                                        style={{
                                            color: '#F44336',
                                            fontWeight: 'bold',
                                            fontSize: '1.2rem',
                                            fontFamily: "'Minecraft', monospace",
                                        }}
                                    >
                                        {data.favoriteModeMaxKills}
                                    </span>{' '}
                                    杀
                                </p>
                            )}
                        </div>
                    )}

                    {data.versusRank === 0 && data.casualRank === 0 && (
                        <p className="sub-text" style={{ textAlign: 'center', marginTop: '20px' }}>
                            还没有段位记录，快去排位赛证明自己吧！
                        </p>
                    )}

                    {pageIndex < getLastPageIndex() && (
                        <div
                            key={`swipe-hint-${pageIndex}`}
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 9: Currency Data - 货币数据 */}
                <div className={getPageClass(getPageIndex(9))}>
                    <h2># 钱包鼓鼓</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        你的财富，见证你的努力。
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
                                你的钱包里躺着{' '}
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
                                你的钻石库存有{' '}
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
                                你的账户显示{' '}
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
                                这一年，你为 EC 充值了{' '}
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
                        <div
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

                {/* Page 10: Social Data - 社交数据 */}
                <div className={getPageClass(getPageIndex(10))}>
                    <h2># 方块世界的羁绊</h2>
                    <p className="sub-text" style={{ marginBottom: '30px' }}>
                        无兄弟不方块，你的每一次组队都是珍贵的回忆。
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
                                你的好友列表里有{' '}
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
                                这一年，你和朋友们组队了{' '}
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
                                与你并肩作战最多的，是{' '}
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
                        <div
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
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
                            你的每一次反馈，都在让 EC 变得更好。
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
                                这一年，你向 EC 提交了{' '}
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

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
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
                            看看你都提交了哪些类型的工单。
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

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
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
                                    这一年，你收到了{' '}
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
                                    你的账号被解封了{' '}
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

                        {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                            <div
                                className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                                onClick={nextPage}
                            >
                                <div className="swipe-icon">👆</div>
                                <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                            </div>
                        )}
                    </div>
                )}

                {/* Page 14: 年度称号 */}
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
                        <h1
                            ref={yearTitleNameRef}
                            style={{
                                color: '#1a1a1a',
                                textShadow: 'none',
                                fontSize: '2.2rem',
                                marginBottom: '10px',
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                            }}
                        >
                            {data.yearTitle?.name}
                        </h1>
                        <p style={{ fontFamily: 'sans-serif', fontWeight: 'bold' }}>
                            {data.yearTitle?.description}
                        </p>
                        <hr
                            style={{
                                margin: '15px 0',
                                border: 'none',
                                borderTop: '2px dashed #1a1a1a',
                            }}
                        />
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
                                    <span
                                        onClick={e => {
                                            e.stopPropagation();
                                            handleRegenerateAIEvaluation();
                                        }}
                                        onTouchStart={e => {
                                            e.stopPropagation();
                                        }}
                                        onTouchEnd={e => {
                                            e.stopPropagation();
                                            // 不调用 preventDefault，让点击事件正常触发
                                        }}
                                        style={{
                                            cursor: regeneratingAI ? 'not-allowed' : 'pointer',
                                            fontSize: '1rem',
                                            opacity: regeneratingAI ? 0.5 : 1,
                                            userSelect: 'none',
                                            transition: 'transform 0.2s',
                                            display: 'inline-block',
                                            touchAction: 'manipulation',
                                        }}
                                        onMouseEnter={e => {
                                            if (!regeneratingAI) {
                                                e.currentTarget.style.transform = 'rotate(180deg)';
                                            }
                                        }}
                                        onMouseLeave={e => {
                                            e.currentTarget.style.transform = 'rotate(0deg)';
                                        }}
                                        title={
                                            regeneratingAI
                                                ? gLang('annualReport.regenerating')
                                                : gLang('annualReport.regenerateAI')
                                        }
                                        role="button"
                                        tabIndex={0}
                                        onKeyDown={e => {
                                            if (e.key === 'Enter' || e.key === ' ') {
                                                e.preventDefault();
                                                e.stopPropagation();
                                                handleRegenerateAIEvaluation();
                                            }
                                        }}
                                    >
                                        🔄
                                    </span>
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
                            {gLang('annualReport.reportTitle2025')}
                        </div>
                    </div>

                    <button
                        className="mc-btn"
                        style={{
                            background: '#f1c40f',
                            color: '#1a1a1a',
                            borderColor: '#1a1a1a',
                            marginTop: '20px',
                        }}
                        onClick={handleClaimYearTitle}
                        disabled={isClaimingTitle}
                    >
                        {isClaimingTitle
                            ? gLang('annualReport.calculating')
                            : titleAlreadyClaimed
                              ? gLang('annualReport.claimed')
                              : gLang('annualReport.claimBtn')}
                    </button>

                    {pageIndex < getLastPageIndex() && shouldShowSwipeHint(pageIndex) && (
                        <div
                            className={`swipe-hint ${shouldShowSwipeHint(pageIndex) ? 'show' : ''}`}
                            onClick={nextPage}
                        >
                            <div className="swipe-icon">👆</div>
                            <div className="swipe-text">{gLang('annualReport.swipeUp')}</div>
                        </div>
                    )}
                </div>

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
                                {data.totalLoginDays}
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
                                {data.totalGames}
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
                                {data.totalKills}
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
                                {data.totalWins}
                            </div>
                            <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>总胜利</div>
                        </div>

                        {/* 在线时长 */}
                        {data.totalHours > 0 && (
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
                                    {Math.floor(data.totalHours)}h
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
                                {data.favoriteMode}
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
                                {data.versusRankName}
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
                                    {data.casualRankName}
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
                                {data.friendCount}
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
                                    {data.teammateGames}
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
                                {data.currentEcCoin}
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
                                {data.currentDiamond}
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
                                    {data.currentPoint}
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
                                    {data.rechargeCount}
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
                                    {data.longestOnlineHours}h
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
                                    {data.replayTotalCount}
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
                                    {data.totalTickets}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>工单数</div>
                            </div>
                        )}

                        {/* 陪伴EC年数 */}
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
                                    {data.yearsWithEC}年
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>陪伴EC</div>
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
                                    {formatDate(data.firstLoginDate)}
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
                                            {hours}:{minutes}
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
                                            {hours}:{minutes}
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
                                    {data.longestOnlineDate}
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
                                    {data.versusRank}
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
                                    {data.casualRank}
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
                                    {data.favoriteModeGames}
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
                                    {data.favoriteModeMaxKills}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>累积击杀</div>
                            </div>
                        )}

                        {/* 最常用地图 */}
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
                                        {data.replayMostPlayedMap}
                                    </div>
                                    <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>
                                        常用地图
                                    </div>
                                </div>
                            )}

                        {/* 被监管数 */}
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
                                    {data.replayOverwatchCount}
                                </div>
                                <div style={{ fontSize: '0.6rem', color: '#b0b0b0' }}>被监管</div>
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
                                    {data.bestTeammate}
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
                                    {data.rewardCount}
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
                                    {data.unbanCount}
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
                                onClick={handleShareAnnualReport}
                                disabled={isGeneratingShare}
                            >
                                {isGeneratingShare
                                    ? gLang('annualReport.generating')
                                    : gLang('annualReport.shareReportBtn')}
                            </button>
                            <p
                                className="sub-text"
                                style={{
                                    marginTop: '6px',
                                    fontSize: '0.65rem',
                                    color: '#b0b0b0',
                                    textAlign: 'center',
                                    whiteSpace: 'nowrap',
                                }}
                            >
                                (分享链接给好友，一起回顾2025年)
                            </p>
                        </div>
                    </div>
                </div>
            </div>

            {/* Desktop Warning Modal */}
            <Modal
                open={desktopWarningVisible}
                onCancel={() => {
                    setDesktopWarningVisible(false);
                    // Save to localStorage so it only shows once
                    localStorage.setItem('annual-report-desktop-warning-seen', 'true');
                }}
                footer={[
                    <Button
                        key="confirm"
                        type="primary"
                        onClick={() => {
                            setDesktopWarningVisible(false);
                            // Save to localStorage so it only shows once
                            localStorage.setItem('annual-report-desktop-warning-seen', 'true');
                        }}
                    >
                        {gLang('annualReport.gotIt')}
                    </Button>,
                ]}
                centered
                title={gLang('annualReport.deviceHint')}
                width={400}
            >
                <div style={{ padding: '20px 0', lineHeight: '1.8', fontSize: '14px' }}>
                    <p style={{ marginBottom: '12px' }}>
                        {gLang('annualReport.desktopResolutionHint')}
                    </p>
                    <p style={{ marginBottom: '0', color: '#666' }}>
                        {gLang('annualReport.desktopSwipeHint')}
                    </p>
                </div>
            </Modal>

            {/* Claim title confirmation (controlled for dark mode) */}
            <Modal
                open={claimTitleModalOpen}
                title={gLang('annualReport.confirmClaimTitle')}
                okText={gLang('annualReport.confirmClaim')}
                cancelText={gLang('common.cancel')}
                onCancel={() => {
                    setClaimTitleModalOpen(false);
                    setClaimTitleData(null);
                }}
                onOk={handleClaimTitleConfirm}
            >
                {claimTitleData && (
                    <div style={{ padding: '10px 0' }}>
                        <p style={{ marginBottom: '8px', fontWeight: 'bold' }}>您的年度称号：</p>
                        <p style={{ fontSize: '16px', color: '#1890ff', marginBottom: '8px' }}>
                            {claimTitleData.name}
                        </p>
                        <p style={{ fontSize: '12px', color: '#666' }}>
                            {claimTitleData.description}
                        </p>
                    </div>
                )}
            </Modal>

            {/* Share Modal */}
            {contextHolder}
            <Modal
                open={shareModalVisible}
                onCancel={() => {
                    setShareModalVisible(false);
                    setShareConfigStep('config');
                    setShareLink('');
                    setShareImage('');
                }}
                footer={null}
                width={window.innerWidth > 768 ? 600 : '90%'}
                centered
                title={gLang('annualReport.shareReport')}
                style={{ maxWidth: '500px' }}
            >
                {shareConfigStep === 'config' ? (
                    <div style={{ padding: '20px 0' }}>
                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    marginBottom: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                }}
                            >
                                选择分享类型：
                            </div>
                            <div
                                style={{ marginBottom: '8px', fontSize: '12px', color: '#8c8c8c' }}
                            >
                                提示：如果选择多个类型，将使用第一个选择的类型生成分享链接
                            </div>
                            <Checkbox.Group
                                value={selectedShareTypes}
                                onChange={values => {
                                    const newValues = values as string[];

                                    // Filter out 'all' if it exists
                                    const filteredValues = newValues.filter(v => v !== 'all');

                                    // Ensure basic-info is always selected
                                    if (!filteredValues.includes('basic-info')) {
                                        filteredValues.push('basic-info');
                                    }

                                    setSelectedShareTypes(filteredValues);
                                }}
                                style={{ width: '100%' }}
                            >
                                <Space direction="vertical" style={{ width: '100%' }}>
                                    {shareTypeOptions.map(option => (
                                        <Checkbox
                                            key={option.value}
                                            value={option.value}
                                            disabled={option.value === 'basic-info'}
                                        >
                                            {option.label}
                                            {option.value === 'basic-info' && (
                                                <span
                                                    style={{
                                                        color: '#999',
                                                        fontSize: '12px',
                                                        marginLeft: '4px',
                                                    }}
                                                >
                                                    (必选)
                                                </span>
                                            )}
                                        </Checkbox>
                                    ))}
                                </Space>
                            </Checkbox.Group>
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <div
                                style={{
                                    marginBottom: '12px',
                                    fontWeight: 'bold',
                                    fontSize: '16px',
                                }}
                            >
                                链接有效期（小时）：
                            </div>
                            <InputNumber
                                value={shareValidHours}
                                onChange={value => setShareValidHours(value ?? null)}
                                min={1}
                                max={2160}
                                style={{ width: '100%' }}
                                addonAfter={gLang('annualReport.hours')}
                            />
                            <div style={{ marginTop: '8px', fontSize: '12px', color: '#8c8c8c' }}>
                                建议值：24小时（1天）、168小时（7天）、720小时（30天）、2160小时（3个月，最长）
                            </div>
                        </div>

                        <div style={{ textAlign: 'center', marginTop: '30px' }}>
                            <Button
                                type="primary"
                                size="large"
                                onClick={handleGenerateShare}
                                loading={isGeneratingShare}
                                disabled={
                                    !selectedShareTypes.includes('basic-info') ||
                                    selectedShareTypes.length === 0 ||
                                    !shareValidHours ||
                                    shareValidHours <= 0 ||
                                    !Number.isInteger(shareValidHours)
                                }
                            >
                                {gLang('annualReport.generateShareLinkButton')}
                            </Button>
                        </div>
                    </div>
                ) : (
                    <>
                        {shareImage && (
                            <div style={{ textAlign: 'center', marginBottom: '20px' }}>
                                <img
                                    src={shareImage}
                                    alt={gLang('annualReport.shareImageTitle')}
                                    style={{
                                        width: '70%',
                                        height: 'auto',
                                        borderRadius: '8px',
                                        border: '1px solid #d9d9d9',
                                    }}
                                />
                            </div>
                        )}
                        <div style={{ marginTop: '20px', textAlign: 'center' }}>
                            <div style={{ marginBottom: '15px' }}>
                                <input
                                    type="text"
                                    value={shareLink}
                                    readOnly
                                    style={{
                                        width: '100%',
                                        padding: '8px 12px',
                                        borderRadius: '4px',
                                        border: '1px solid #d9d9d9',
                                        fontSize: '14px',
                                        fontFamily: 'monospace',
                                    }}
                                />
                            </div>
                            <div style={{ display: 'flex', gap: '10px', justifyContent: 'center' }}>
                                <Button
                                    type="primary"
                                    icon={<CopyOutlined />}
                                    onClick={handleCopyLink}
                                >
                                    复制链接
                                </Button>
                                <Button
                                    type="default"
                                    icon={<DownloadOutlined />}
                                    onClick={handleDownloadImage}
                                    disabled={!shareImage}
                                >
                                    下载图片
                                </Button>
                                {isPC && (
                                    <Button
                                        type="default"
                                        icon={<CopyOutlined />}
                                        onClick={handleCopyImage}
                                        disabled={!shareImage}
                                    >
                                        复制图片
                                    </Button>
                                )}
                                <Button
                                    onClick={() => {
                                        setShareConfigStep('config');
                                        setShareLink('');
                                        setShareImage('');
                                    }}
                                >
                                    重新配置
                                </Button>
                            </div>
                        </div>
                    </>
                )}
            </Modal>
        </div>
    );
};

export default AnnualReport;
function setYearTitle(_data: any) {
    throw new Error('Function not implemented.');
}
