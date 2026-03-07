/**
 * 年度总结数据类型
 */
export type YearSummaryType =
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

/**
 * 年度总结数据接口
 */
export interface YearSummaryResponse {
    data: {
        'basic-info'?: BasicInfo;
        'login-stats'?: LoginStats;
        'game-stats'?: GameStats;
        'rank-data'?: RankData;
        'currency-data'?: CurrencyData;
        'social-data'?: SocialData;
        'ticket-stats'?: TicketStats;
        'calculate-title'?: {
            title: {
                key: string;
                name: string;
                description: string;
                prefix: string;
            };
        };
    };
    aiEvaluation?: string;
}

export interface BasicInfo {
    ecid: string;
    nickname?: string;
    firstLoginDate?: string;
    yearsWithEC?: number;
}

export interface LoginStats {
    totalLoginDays?: number;
    earliestOnlineTime?: string;
    latestOnlineTime?: string;
    totalHours?: number;
}

export interface GameStats {
    totalGames?: number;
    totalKills?: number;
    winRate?: number;
    totalVoidDeaths?: number;
    totalMisjudgments?: number;
    favoriteMode?: string;
    favoriteModeGames?: number;
    favoriteModeWinRate?: number;
    favoriteModeMaxKills?: number;
    favoriteModeMaxStreak?: number;
}

export interface RankData {
    seasonRank?: string;
    seasonScore?: number;
}

export interface CurrencyData {
    totalChestsOpened?: number;
    mostOpenedChest?: string;
    totalExpGained?: number;
    totalCoins?: number;
    totalECCoins?: number;
    totalSpent?: number;
}

export interface SocialData {
    bestTeammate?: string;
    mostTeammateName?: string;
    teammateGames?: number;
    totalTeamGames?: number;
}

export interface TicketStats {
    totalTickets?: number;
    typeCounts?: Record<string, number>;
    rewardCount?: number;
    unbanCount?: number;
}
