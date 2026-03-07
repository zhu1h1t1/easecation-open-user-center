// 用户中心首页

import React, { useMemo, useState, useEffect } from 'react';
import { Row, Modal, List, Skeleton, message, Button } from 'antd';
import './Home.css';
import { useLocation, useSearchParams } from 'react-router-dom';
import { FaBilibili, FaGamepad } from 'react-icons/fa6';
import { BsBarChartFill } from 'react-icons/bs';
import { HiOutlineClipboardList } from 'react-icons/hi';
import { AppstoreOutlined, MessageOutlined } from '@ant-design/icons';
import { useTheme } from '@common/contexts/ThemeContext';
import { gLang } from '@common/language';
import CardItem from '@common/components/CardItem/CardItem';
import { useNavigate } from 'react-router-dom';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { FaUsers } from 'react-icons/fa';
import { IoDocumentText } from 'react-icons/io5';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import {
    AnnouncementCard,
    AnnouncementModal,
    HistoryAnnouncementModal,
    useAnnouncement,
} from '@common/components/Announcement';
import usePageTitle from '@common/hooks/usePageTitle';
import { fetchData } from '@common/axiosConfig';
import { switchDomain } from '@common/utils/crossDomainSwitch';
import { PlayerBindListData } from '@ecuc/shared/types/player.types';
import { applyLocalStorageFromUrl } from '@common/utils/localStorageFromUrl';

const Home: React.FC = () => {
    usePageTitle(); // 使用页面标题管理Hook

    const navigate = useNavigate();
    const location = useLocation();
    const [messageApi, contextHolder] = message.useMessage();

    // 用于 AutoDo 的跨域切换函数，支持动态目标类型
    const handleCrossDomainSwitchForAutoDo = async (targetPath: string, targetType: string) => {
        const normalizedType = targetType.trim();
        if (normalizedType !== 'user' && normalizedType !== 'admin') {
            return;
        }
        await switchDomain({ type: normalizedType, path: targetPath });
    };

    // 从 URL 参数中解析并设置 localStorage
    useEffect(() => {
        applyLocalStorageFromUrl();

        // 检查是否从管理端切换过来，并保存管理端路径
        const params = new URLSearchParams(location.search);
        const adminReturnPath = params.get('admin_return_path');
        if (adminReturnPath) {
            try {
                localStorage.setItem('admin_last_path', adminReturnPath);

                // 清理 URL 参数（可选，避免刷新页面时重复保存）
                const newUrl = new URL(window.location.href);
                newUrl.searchParams.delete('admin_return_path');
                window.history.replaceState({}, '', newUrl.toString());
            } catch {
                // 忽略保存失败的情况
            }
        }

        // 检查并处理 AutoDo
        const autoDo = localStorage.getItem('AutoDo');
        if (autoDo) {
            // 解析 GOTO 函数：GOTO(admin,/wiki-bindings) 或 GOTO(user,/)
            // 使用更宽松的正则表达式，支持路径中包含引号和特殊字符
            // 先找到最后一个 )，然后向前匹配
            const lastParenIndex = autoDo.lastIndexOf(')');
            if (lastParenIndex === -1) {
                localStorage.removeItem('AutoDo');
                return;
            }
            const beforeParen = autoDo.substring(0, lastParenIndex);
            const gotoMatch = beforeParen.match(/^GOTO\(([^,]+),\s*(.+)$/);
            if (gotoMatch) {
                let [, targetType, targetPath] = gotoMatch;
                // 处理转义的引号：将 \" 还原为 "
                targetPath = targetPath.replace(/\\"/g, '"');

                const trimmedType = targetType.trim();
                // 去除 localStorage 中的 AutoDo
                localStorage.removeItem('AutoDo');

                // 本页面属于用户端，目标为 user 则站内跳转，否则跨域跳转（如 admin）
                if (trimmedType === 'user') {
                    navigate(targetPath);
                } else {
                    handleCrossDomainSwitchForAutoDo(targetPath, trimmedType);
                }
            } else {
                // 如果不是 GOTO 函数，清除 AutoDo
                localStorage.removeItem('AutoDo');
            }
        }
    }, []);

    // Check if this is the first visit after login
    const isFirstVisitAfterLogin = useMemo(() => {
        const hasShownAnimation = sessionStorage.getItem('homeAnimationShown');
        const isFromLogin =
            document.referrer.includes('/login') ||
            document.referrer.includes('/login/callback') ||
            location.state?.fromLogin === true;

        // If coming from login and haven't shown animation yet, show full animation
        if (isFromLogin && !hasShownAnimation) {
            sessionStorage.setItem('homeAnimationShown', 'true');
            return true;
        }
        return false;
    }, [location.state]);

    // Animation delay: longer for first visit (0.1s), shorter for subsequent visits (0.02s)
    const animationDelay = isFirstVisitAfterLogin ? 0.1 : 0.02;
    const { isDark, getThemeColor, customTheme, isCustomThemeActive } = useTheme();

    const customPalette =
        isCustomThemeActive && customTheme ? CUSTOM_THEME_PALETTES[customTheme] : null;

    const pickColor = (light: string, dark: string, customValue?: string) => {
        if (customPalette && customValue) {
            return customValue;
        }

        return getThemeColor({ light, dark });
    };

    const themedCardProps = customPalette
        ? {
              backgroundColor: pickColor('#FFFFFF', '#171717', customPalette.surfaceAlt),
              borderColor: pickColor('#E0E0E0', '#303030', customPalette.border),
              hoverColor: pickColor('#F5F5F5', '#2A2A2A', customPalette.hover),
              textColor: pickColor('#1A1A1A', '#EEF2F7', customPalette.textPrimary),
              descColor: pickColor('#00000099', '#FFFFFF99', customPalette.textMuted),
          }
        : {};

    const createAccent = (light: string, dark: string, customValue?: string) => {
        if (customPalette) {
            return customValue ?? customPalette.accent;
        }

        return getThemeColor({ light, dark });
    };

    const {
        announcements,
        latestActiveAnnouncement,
        isAnnouncementModalVisible,
        isHistoryModalVisible,
        popupSetting,
        setIsAnnouncementModalVisible,
        setIsHistoryModalVisible,
        setPopupSetting,
    } = useAnnouncement();

    // 年度报告选择模态框
    const [isAnnualReportModalVisible, setIsAnnualReportModalVisible] = useState(false);
    const [ecList, setEcList] = useState<PlayerBindListData[]>([]);
    const [loadingEcList, setLoadingEcList] = useState(false);
    const [searchParams, setSearchParams] = useSearchParams();

    // 处理特殊公告中的模态框打开命令
    const handleModalOpen = (modalName: string) => {
        switch (modalName) {
            case 'AnnualReportModal':
                setIsAnnualReportModalVisible(true);
                loadEcList();
                break;
        }
    };

    // 加载EC列表的函数
    const loadEcList = async () => {
        setLoadingEcList(true);
        try {
            await fetchData({
                url: '/ec/list',
                method: 'GET',
                data: {},
                setData: (data: PlayerBindListData[]) => {
                    setEcList(data);
                    // 如果只有一个绑定，直接跳转
                    if (data.length === 1) {
                        navigate(`/account/${data[0].ecid}/annual-report`);
                        setIsAnnualReportModalVisible(false);
                    }
                },
            });
        } catch {
            messageApi.error(gLang('home.fetchAccountListFailed'));
        } finally {
            setLoadingEcList(false);
        }
    };

    // 检查 URL 参数，如果存在 openModal=AnnualReportModal，则打开模态框
    useEffect(() => {
        const openModal = searchParams.get('openModal');
        if (openModal === 'AnnualReportModal' && !isAnnualReportModalVisible) {
            setIsAnnualReportModalVisible(true);
            loadEcList();
            // 清除 URL 参数，避免刷新页面时重复打开
            const newSearchParams = new URLSearchParams(searchParams);
            newSearchParams.delete('openModal');
            setSearchParams(newSearchParams, { replace: true });
        }
    }, [searchParams]);

    const accent = customPalette?.accent;
    const accentSoft = customPalette?.accentSoft ?? accent;

    const gameAccountAccent = createAccent('#6C9EFF', '#5181E0', accentSoft);
    const mediaCenterAccent = createAccent('#FF8C69', '#E05350', accentSoft);
    const leaderboardAccent = createAccent('#FFCC66', '#E0AD51', accent);
    const ticketSystemAccent = createAccent('#C36FFF', '#A051E0', accent);
    const feedbackCenterAccent = createAccent('#52C41A', '#73D13D', accent);

    const guidelinesAccent = createAccent('#4A90E2', '#195df5', accent);
    const recruitmentAccent = createAccent('#FF8A65', '#FF6B35', accentSoft);
    const resourcesAccent = createAccent('#657AFF', '#4B5CC4', accent);
    const annualReportAccent = createAccent('#FF6B9D', '#E91E63', accent);

    let cardIndex = 0;

    return (
        <Wrapper>
            {contextHolder}
            <>
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(-10px)',
                        animation: `fadeInUp ${isFirstVisitAfterLogin ? '0.5s' : '0.3s'} ease-in-out forwards`,
                    }}
                >
                    {/* 新春版标题 */}
                    <div
                        style={{
                            textAlign: 'center',
                            marginBottom: '32px',
                        }}
                    >
                        <h1
                            style={{
                                margin: 0,
                                fontWeight: 700,
                                fontSize: '38px',
                                backgroundClip: 'text',
                                backgroundSize: '200% auto',
                                position: 'relative',
                                display: 'inline-block',
                            }}
                        >
                            {gLang('dashboard.title')}
                        </h1>
                    </div>
                </div>
            </>

            <Row gutter={[16, 16]}>
                {/*公告卡片：有活跃公告时放最前，无活跃公告时不渲染，稍后插入到管理系统前*/}
                {latestActiveAnnouncement && (
                    <AnnouncementCard
                        announcement={latestActiveAnnouncement}
                        isDark={isDark}
                        onClick={() => setIsAnnouncementModalVisible(true)}
                        recruitmentAccent={recruitmentAccent}
                        fadeInDelay={cardIndex++ * animationDelay}
                        onModalOpen={handleModalOpen}
                    />
                )}

                {/*我的游戏账号*/}
                <CardItem
                    Icon={FaGamepad}
                    color={gameAccountAccent}
                    title={gLang('dashboard.gameAccount')}
                    description={gLang('dashboard.gameAccountDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/account')}
                />

                {/*工单系统*/}
                <CardItem
                    Icon={HiOutlineClipboardList}
                    color={ticketSystemAccent}
                    title={gLang('dashboard.ticketSystem')}
                    description={gLang('dashboard.ticketSystemDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/ticket')}
                />

                {/*反馈中心*/}
                <CardItem
                    Icon={MessageOutlined}
                    color={feedbackCenterAccent}
                    title={gLang('dashboard.feedbackCenter')}
                    description={gLang('dashboard.feedbackCenterDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/feedback')}
                />

                {/*排行榜*/}
                <CardItem
                    Icon={BsBarChartFill}
                    color={leaderboardAccent}
                    title={gLang('dashboard.leaderboard')}
                    description={gLang('dashboard.leaderboardDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/scoretop')}
                />

                {/*媒体中心*/}
                <CardItem
                    Icon={FaBilibili}
                    color={mediaCenterAccent}
                    title={gLang('dashboard.mediaCenter')}
                    description={gLang('dashboard.mediaCenterDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/media')}
                />

                {/*文档中心*/}
                <CardItem
                    Icon={IoDocumentText}
                    color={guidelinesAccent}
                    title={gLang('dashboard.documentCenter')}
                    description={gLang('dashboard.documentCenterDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/document')}
                />

                {/*更多资源*/}
                <CardItem
                    Icon={AppstoreOutlined}
                    color={resourcesAccent}
                    title={gLang('dashboard.moreResources')}
                    description={gLang('dashboard.moreResourcesDesc')}
                    isDark={isDark}
                    fadeInDelay={cardIndex++ * animationDelay}
                    {...themedCardProps}
                    onClick={() => navigate('/resources')}
                />

                {/*公告卡片：无活跃公告时插入到管理系统前*/}
                {!latestActiveAnnouncement && (
                    <CardItem
                        Icon={FaUsers}
                        color={recruitmentAccent}
                        title={gLang('dashboard.AnnouncementCard')}
                        description={gLang('dashboard.AnnouncementCardDesc')}
                        isDark={isDark}
                        fadeInDelay={cardIndex++ * animationDelay}
                        {...themedCardProps}
                        onClick={() => setIsHistoryModalVisible(true)}
                    />
                )}
            </Row>

            {/* 公告模态框 */}
            <AnnouncementModal
                visible={isAnnouncementModalVisible}
                onClose={() => setIsAnnouncementModalVisible(false)}
                onShowHistory={() => setIsHistoryModalVisible(true)}
                announcements={announcements}
                popupSetting={popupSetting}
                onPopupSettingChange={setPopupSetting}
                latestActiveAnnouncement={latestActiveAnnouncement}
                onModalOpen={handleModalOpen}
            />

            {/* 历史公告模态框 */}
            <HistoryAnnouncementModal
                visible={isHistoryModalVisible}
                onClose={() => setIsHistoryModalVisible(false)}
                announcements={announcements}
                onModalOpen={handleModalOpen}
            />

            {/* 年度报告选择模态框 */}
            <Modal
                title={gLang('home.selectGameAccount')}
                open={isAnnualReportModalVisible}
                onCancel={() => setIsAnnualReportModalVisible(false)}
                footer={null}
                width={500}
                centered
            >
                {loadingEcList ? (
                    <Skeleton active paragraph={{ rows: 3 }} />
                ) : ecList.length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px 0' }}>
                        <p
                            style={{
                                color: getThemeColor({
                                    light: 'rgba(0, 0, 0, 0.6)',
                                    dark: 'rgba(255, 255, 255, 0.6)',
                                }),
                                marginBottom: '20px',
                            }}
                        >
                            {gLang('home.noBoundGameAccount')}
                        </p>
                        <Button
                            type="primary"
                            onClick={() => {
                                setIsAnnualReportModalVisible(false);
                                navigate('/account');
                            }}
                        >
                            {gLang('home.goBindGameAccount')}
                        </Button>
                    </div>
                ) : (
                    <List
                        dataSource={ecList}
                        renderItem={ec => (
                            <List.Item
                                style={{
                                    cursor: 'pointer',
                                    padding: '16px',
                                    borderRadius: '8px',
                                    marginBottom: '8px',
                                    border: `1px solid ${getThemeColor({ light: '#f0f0f0', dark: '#303030' })}`,
                                    transition: 'all 0.3s',
                                }}
                                onMouseEnter={e => {
                                    e.currentTarget.style.backgroundColor = getThemeColor({
                                        light: '#f5f5f5',
                                        dark: '#2A2A2A',
                                    });
                                    e.currentTarget.style.borderColor = annualReportAccent;
                                }}
                                onMouseLeave={e => {
                                    e.currentTarget.style.backgroundColor = 'transparent';
                                    e.currentTarget.style.borderColor = getThemeColor({
                                        light: '#f0f0f0',
                                        dark: '#303030',
                                    });
                                }}
                                onClick={() => {
                                    navigate(`/account/${ec.ecid}/annual-report`);
                                    setIsAnnualReportModalVisible(false);
                                }}
                            >
                                <List.Item.Meta
                                    title={
                                        <div
                                            style={{
                                                fontWeight: 600,
                                                fontSize: '16px',
                                                color: getThemeColor({
                                                    light: '#1A1A1A',
                                                    dark: '#EEF2F7',
                                                }),
                                            }}
                                        >
                                            {ec.name || ec.ecid}
                                        </div>
                                    }
                                    description={
                                        <div
                                            style={{
                                                fontSize: '12px',
                                                color: getThemeColor({
                                                    light: 'rgba(0, 0, 0, 0.6)',
                                                    dark: 'rgba(255, 255, 255, 0.6)',
                                                }),
                                                fontFamily: 'monospace',
                                            }}
                                        >
                                            {ec.ecid}
                                        </div>
                                    }
                                />
                            </List.Item>
                        )}
                    />
                )}
            </Modal>
        </Wrapper>
    );
};

export default Home;
