// 游戏账号详情页

import { Progress, Skeleton, Space } from 'antd';
import React, { useEffect, useState, useMemo } from 'react';
import { useParams, useLocation } from 'react-router-dom';
import { fetchData } from '@common/axiosConfig';
import { BindPlayerDetailBasic, UserGiftVipandUnexpired } from '@ecuc/shared/types/player.types';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PlayerStatistic from './components/PlayerStatistic';
import PlayerDetails from './components/PlayerDetails';
import AccountActions from './components/AccountActions';
import GiftVipModal from './components/GiftVipModal';
import ErrorDisplay from '../../../components/ErrorDisplay';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

// 淡入动画
const fadeInUpAnimation = `
@keyframes fadeInUp {
    from {
        opacity: 0;
        transform: translateY(10px);
    }
    to {
        opacity: 1;
        transform: translateY(0);
    }
}
`;

// 添加动画样式到文档头部
if (typeof document !== 'undefined' && !document.getElementById('fadeInUpAnimation')) {
    const style = document.createElement('style');
    style.id = 'fadeInUpAnimation';
    style.innerHTML = fadeInUpAnimation;
    document.head.appendChild(style);
}

const AccountDetail = () => {
    const { ecid } = useParams();
    const location = useLocation();
    const [player, setPlayer] = React.useState<BindPlayerDetailBasic | null>(null);
    const [vipLeftandUnexpired, setVipLeftandUnexpired] =
        React.useState<UserGiftVipandUnexpired | null>(null);
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(false);

    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    // Check if this is the first visit after login
    const isFirstVisitAfterLogin = useMemo(() => {
        const hasShownAnimation = sessionStorage.getItem('accountDetailAnimationShown');
        const isFromLogin =
            document.referrer.includes('/login') ||
            document.referrer.includes('/login/callback') ||
            location.state?.fromLogin === true;

        // If coming from login and haven't shown animation yet, show full animation
        if (isFromLogin && !hasShownAnimation) {
            sessionStorage.setItem('accountDetailAnimationShown', 'true');
            return true;
        }
        return false;
    }, [location.state]);

    // Animation delay: longer for first visit (0.1s), shorter for subsequent visits (0.02s)
    const animationDelay = isFirstVisitAfterLogin ? 0.1 : 0.02;

    const surfaceAlt = getThemeColor({
        light: '#fafafa',
        dark: '#1f1f1f',
        custom: { blackOrange: palette.surfaceAlt },
    });

    const fetchAccountDetail = () => {
        setLoading(true);
        setError(false);
        Promise.all([
            fetchData({
                url: '/ec/detail',
                method: 'GET',
                data: { ecid: ecid },
                setData: setPlayer,
            }),
            fetchData({
                url: '/ec/gift',
                method: 'GET',
                data: { ecid: ecid },
                setData: setVipLeftandUnexpired,
            }),
        ])
            .catch(() => {
                setError(true);
            })
            .finally(() => {
                setLoading(false);
            });
    };

    useEffect(() => {
        fetchAccountDetail();
    }, [ecid]);

    if (loading) {
        return (
            <Wrapper>
                <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </Wrapper>
        );
    }

    if (error) {
        return (
            <Wrapper>
                <ErrorDisplay onRetry={fetchAccountDetail} />
            </Wrapper>
        );
    }

    if (!player || !vipLeftandUnexpired) {
        return null;
    }

    let cardIndex = 0;

    return (
        <Wrapper>
            <Space direction="vertical" style={{ width: '100%' }} size={20}>
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <PlayerStatistic player={player} />
                </div>
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <Progress
                        percent={player?.next_level?.percentage}
                        status="active"
                        strokeColor={
                            isBlackOrangeActive
                                ? palette.accent
                                : { from: '#108ee9', to: '#87d068' }
                        }
                        trailColor={isBlackOrangeActive ? surfaceAlt : undefined}
                    />
                </div>
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <PlayerDetails player={player} />
                </div>
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <AccountActions
                        ecid={ecid}
                        player={player}
                        onGiftClick={() => setIsModalOpen(true)}
                    />
                </div>
            </Space>
            <GiftVipModal
                isOpen={isModalOpen}
                onClose={() => setIsModalOpen(false)}
                ecid={ecid}
                player={player}
                vipLeftandUnexpired={vipLeftandUnexpired}
            />
        </Wrapper>
    );
};

export default AccountDetail;
