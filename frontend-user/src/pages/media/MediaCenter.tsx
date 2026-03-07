import { useEffect, useState, useMemo } from 'react';
import { Skeleton, Space, Typography } from 'antd';
import { fetchData } from '@common/axiosConfig';
import { TicketAccount } from '@ecuc/shared/types/ticket.types';
import { MediaListData, MediaStatus } from '@ecuc/shared/types/media.types';
import MediaInfo from './components/MediaInfo';
import MediaApplyTicket from './components/media-ticket/MediaApplyTicket';
import MonthlyReviewTicket from './components/media-ticket/MonthlyReviewTicket';
import RebindingTicket from './components/media-ticket/RebindingTicket';
import { MediaActionCard } from './components/MediaActionCard';
import { gLang } from '@common/language';
import PageTitle from '@common/components/PageTitle/PageTitle';
import CardItem from '@common/components/CardItem/CardItem';
import { IoDocumentText } from 'react-icons/io5';
import { useNavigate, useLocation } from 'react-router-dom';
import { RiAccountCircleFill, RiShoppingBag3Fill } from 'react-icons/ri';
import Wrapper from '@common/components/Wrapper/Wrapper';
import PageIntro from '../../components/PageIntro/PageIntro';
import ErrorDisplay from '../../components/ErrorDisplay';
import usePageTitle from '@common/hooks/usePageTitle';
import { useTheme, type CustomThemeName } from '@common/contexts/ThemeContext';
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

const { Paragraph } = Typography;

const MediaCenter = () => {
    usePageTitle(); // 使用页面标题管理Hook

    const { isDark, getThemeColor, customTheme } = useTheme();
    const navigate = useNavigate();
    const location = useLocation();

    // Check if this is the first visit after login
    const isFirstVisitAfterLogin = useMemo(() => {
        const hasShownAnimation = sessionStorage.getItem('mediaAnimationShown');
        const isFromLogin =
            document.referrer.includes('/login') ||
            document.referrer.includes('/login/callback') ||
            location.state?.fromLogin === true;

        // If coming from login and haven't shown animation yet, show full animation
        if (isFromLogin && !hasShownAnimation) {
            sessionStorage.setItem('mediaAnimationShown', 'true');
            return true;
        }
        return false;
    }, [location.state]);

    // Animation delay: longer for first visit (0.1s), shorter for subsequent visits (0.02s)
    const animationDelay = isFirstVisitAfterLogin ? 0.1 : 0.02;
    type PaletteKey = keyof (typeof CUSTOM_THEME_PALETTES)[CustomThemeName];
    const getCustomColor = (key: PaletteKey) => {
        if (!customTheme) {
            return undefined;
        }
        return {
            [customTheme]: CUSTOM_THEME_PALETTES[customTheme][key],
        } as Partial<Record<CustomThemeName, string>>;
    };
    const bodyTextColor = getThemeColor({
        light: 'rgba(0, 0, 0, 0.85)',
        dark: 'rgba(255, 255, 255, 0.85)',
        custom: getCustomColor('textPrimary'),
    });
    const linkColor = getThemeColor({
        light: '#1890ff',
        dark: '#69c0ff',
        custom: getCustomColor('accent'),
    });
    const guidelinesAccent = getThemeColor({
        light: '#195df5',
        dark: '#69c0ff',
        custom: getCustomColor('accent'),
    });
    const applyAccent = getThemeColor({
        light: '#f5af19',
        dark: '#ffd666',
        custom: getCustomColor('accent'),
    });
    const shopAccent = getThemeColor({
        light: '#10b981',
        dark: '#36cfc9',
        custom: getCustomColor('accent'),
    });
    const cardBackground = getThemeColor({
        light: '#FFFFFF',
        dark: '#171717',
        custom: getCustomColor('surface'),
    });
    const cardHover = getThemeColor({
        light: '#F5F5F5',
        dark: '#2A2A2A',
        custom: getCustomColor('hover'),
    });
    const cardBorder = getThemeColor({
        light: '#E0E0E0',
        dark: '#303030',
        custom: getCustomColor('border'),
    });
    const cardText = getThemeColor({
        light: '#1A1A1A',
        dark: '#EEF2F7',
        custom: getCustomColor('textPrimary'),
    });
    const cardDesc = getThemeColor({
        light: '#00000099',
        dark: '#FFFFFF99',
        custom: getCustomColor('textMuted'),
    });
    const [isLoading, setIsLoading] = useState(true);
    const [isApplyModalOpen, setIsApplyModalOpen] = useState(false);
    const [isMonthModalOpen, setIsMonthModalOpen] = useState(false);
    const [updateECID, setUpdateECID] = useState(false);
    const [chooseGameList, setChooseGameList] = useState<TicketAccount[]>([]);
    const [ECID, setECID] = useState<string>('');
    const [mediaData, setMediaData] = useState<MediaListData>();
    const [groupData, setGroupData] = useState<any>(null);
    const [error, setError] = useState<boolean>(false);

    const fetchMediaData = () => {
        setIsLoading(true);
        setError(false);
        let completedRequests = 0;
        const totalRequests = 3;
        const checkAllLoaded = () => {
            completedRequests += 1;
            if (completedRequests === totalRequests) {
                setIsLoading(false);
            }
        };

        fetchData({
            url: '/media/list',
            method: 'GET',
            data: {},
            setData: value => {
                setMediaData(value);
                setECID(value?.media?.ECID || '');
                checkAllLoaded();
                if (
                    value?.media?.id &&
                    [
                        MediaStatus.PendingReview,
                        MediaStatus.ExpiredCreator,
                        MediaStatus.ActiveCreator,
                        MediaStatus.ExcellentCreator,
                    ].includes(value.media.status as MediaStatus)
                ) {
                    fetchData({
                        url: '/media/getgroup',
                        method: 'POST',
                        data: { mediaID: value.media.id },
                        setData: groupValue => {
                            setGroupData(groupValue);
                        },
                    });
                }
            },
        }).catch(() => {
            setError(true);
            setIsLoading(false);
        });

        fetchData({
            url: '/ticket/chooseList',
            method: 'GET',
            data: { type: 'game' },
            setData: value => {
                setChooseGameList(value);
                checkAllLoaded();
            },
        }).catch(() => {
            setError(true);
            setIsLoading(false);
        });

        fetchData({
            url: '/user/info',
            method: 'GET',
            data: {},
            setData: _value => {
                checkAllLoaded();
            },
        }).catch(() => {
            setError(true);
            setIsLoading(false);
        });

        if (sessionStorage.getItem('openApplyModal') === '1') {
            setIsApplyModalOpen(true);
            sessionStorage.removeItem('openApplyModal');
        }
    };

    useEffect(() => {
        fetchMediaData();
    }, []);

    if (isLoading) {
        return (
            <Wrapper>
                <Skeleton active paragraph={{ rows: 3 }} title={false} />
            </Wrapper>
        );
    }

    if (error) {
        return (
            <Wrapper>
                <PageTitle title={gLang('mediaCenter.title')} />
                <ErrorDisplay onRetry={fetchMediaData} />
            </Wrapper>
        );
    }

    let cardIndex = 0;

    return (
        <Wrapper>
            <div
                style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                }}
            >
                <PageTitle title={gLang('mediaCenter.title')} />
            </div>

            <div
                style={{
                    opacity: 0,
                    animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                }}
            >
                <PageIntro imageSrc={'/image/media-center.png'} imgSize={0.6} imgPosition={'right'}>
                    <Paragraph style={{ color: bodyTextColor }}>
                        {gLang('mediaCenter.welcomeTitle')}
                    </Paragraph>
                    <Paragraph style={{ color: bodyTextColor }}>
                        {gLang('mediaCenter.welcomeDesc1')}
                        <a
                            onClick={() => navigate('/shop-guidelines')}
                            style={{ color: linkColor, cursor: 'pointer' }}
                        >
                            {gLang('mediaCenter.shopGuidelines')}
                        </a>
                        {gLang('mediaCenter.welcomeDesc2')}
                        <a
                            onClick={() => navigate('/media-guidelines')}
                            style={{ color: linkColor, cursor: 'pointer' }}
                        >
                            {gLang('mediaCenter.creatorProgram')}
                        </a>
                        {gLang('mediaCenter.welcomeDesc3')}
                    </Paragraph>
                    {mediaData?.media?.status === MediaStatus.Player && (
                        <Paragraph style={{ color: bodyTextColor }}>
                            {gLang('mediaCenter.notCreator')}
                        </Paragraph>
                    )}
                    {mediaData?.media?.status &&
                        [
                            MediaStatus.PendingReview,
                            MediaStatus.ExpiredCreator,
                            MediaStatus.ActiveCreator,
                            MediaStatus.ExcellentCreator,
                        ].includes(mediaData.media.status as MediaStatus) && (
                            <Paragraph style={{ color: bodyTextColor }}>
                                {/* 动态群提示 */}
                                {(groupData?.shopgroup1 || groupData?.shopgroup2) && (
                                    <>
                                        <span>{gLang('mediaCenter.joinGroupDesc')}</span>
                                        {groupData.shopgroup1 && (
                                            <a
                                                href={groupData.shopgrouplink1}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: linkColor }}
                                            >
                                                {groupData.shopgroup1}
                                            </a>
                                        )}
                                        {groupData.shopgroup1 && groupData.shopgroup2 && ' | '}
                                        {groupData.shopgroup2 && (
                                            <a
                                                href={groupData.shopgrouplink2}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                style={{ color: linkColor }}
                                            >
                                                {groupData.shopgroup2}
                                            </a>
                                        )}
                                    </>
                                )}
                                {(groupData?.shopgroup1 || groupData?.shopgroup2) &&
                                    groupData?.status3group && <br />}
                                {groupData?.status3group && (
                                    <>
                                        <span>{gLang('mediaCenter.joinstatus3groupDesc')}</span>
                                        <a
                                            href={groupData.status3grouplink}
                                            target="_blank"
                                            rel="noopener noreferrer"
                                            style={{ color: linkColor }}
                                        >
                                            {groupData.status3group}
                                        </a>
                                    </>
                                )}
                            </Paragraph>
                        )}
                </PageIntro>
            </div>

            <Space direction="vertical" size={16} style={{ width: '100%' }}>
                {/* 媒体信息 */}
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <MediaInfo mediaData={mediaData} />
                </div>

                {/* 查看创作者守则 */}
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <CardItem
                        Icon={IoDocumentText}
                        color={guidelinesAccent}
                        description={gLang('mediaList.lookGuidelinesDesc')}
                        isDark={isDark}
                        isResponsive={false}
                        onClick={() => navigate('/shop-guidelines')}
                        title={gLang('mediaList.lookGuidelines')}
                        backgroundColor={cardBackground}
                        hoverColor={cardHover}
                        borderColor={cardBorder}
                        textColor={cardText}
                        descColor={cardDesc}
                    />
                </div>

                {/* 商城页面 - 只在媒体账号status为0~3时显示 */}
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <CardItem
                        Icon={RiShoppingBag3Fill}
                        color={shopAccent}
                        description={gLang('mediaCenter.shopDesc')}
                        isDark={isDark}
                        isResponsive={false}
                        onClick={() => navigate('/media/shop')}
                        title={gLang('mediaCenter.shopTitle')}
                        backgroundColor={cardBackground}
                        hoverColor={cardHover}
                        borderColor={cardBorder}
                        textColor={cardText}
                        descColor={cardDesc}
                    />
                </div>

                {/* 媒体操作卡片，申请成为土豆创作者或提交月审，title和content根据内容改变 */}
                <div
                    style={{
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                    }}
                >
                    <MediaActionCard
                        mediaData={mediaData}
                        onAction={() => {
                            // 检查是否可以显示月审（状态为1~3）
                            const canShowMonthlyAudit = () => {
                                if (!mediaData?.media?.status) return false;
                                return [
                                    MediaStatus.ExpiredCreator,
                                    MediaStatus.ActiveCreator,
                                    MediaStatus.ExcellentCreator,
                                ].includes(mediaData.media.status as MediaStatus);
                            };

                            if (mediaData?.is_media_member || canShowMonthlyAudit()) {
                                setIsMonthModalOpen(true);
                            } else {
                                setIsApplyModalOpen(true);
                            }
                        }}
                    />
                </div>

                {/* 更换媒体ECID，仅在是创作者的时候出现 */}
                {mediaData?.is_media_member && (
                    <div
                        style={{
                            opacity: 0,
                            animation: `fadeInUp 0.5s ease-in-out ${cardIndex++ * animationDelay}s forwards`,
                        }}
                    >
                        <CardItem
                            Icon={RiAccountCircleFill}
                            title={gLang('mediaList.updateECIDTitle')}
                            description={gLang('mediaList.updateECIDIntro')}
                            isDark={isDark}
                            isResponsive={false}
                            onClick={() => setUpdateECID(true)}
                            color={applyAccent}
                            backgroundColor={cardBackground}
                            hoverColor={cardHover}
                            borderColor={cardBorder}
                            textColor={cardText}
                            descColor={cardDesc}
                        />
                    </div>
                )}
            </Space>

            {/* 媒体申请模态框 */}
            <MediaApplyTicket
                isOpen={isApplyModalOpen}
                onClose={() => setIsApplyModalOpen(false)}
                chooseGameList={chooseGameList}
            />

            {/* E点申请模态框 */}
            <MonthlyReviewTicket
                isOpen={isMonthModalOpen}
                onClose={() => setIsMonthModalOpen(false)}
                ECID={ECID}
                platform={mediaData?.media?.mpa?.split('-')[0]}
            />

            {/* 更换ECID模态框 */}
            <RebindingTicket
                isOpen={updateECID}
                onClose={() => setUpdateECID(false)}
                ECID={ECID}
                chooseGameList={chooseGameList}
            />
        </Wrapper>
    );
};

export default MediaCenter;
