// 更多资源页面

import React from 'react';
import { Row, Col, Space, Typography, Card, Tag } from 'antd';
import {
    GithubOutlined,
    ToolOutlined,
    BookOutlined,
    GlobalOutlined,
    StarOutlined,
} from '@ant-design/icons';
import {
    FaFont,
    FaCode,
    FaPython,
    FaJava,
    FaWeixin,
    FaTiktok,
    FaQq,
    FaImage,
} from 'react-icons/fa';
import { SiXiaohongshu, SiBilibili } from 'react-icons/si';
import { gLang } from '@common/language';
import PageTitle from '@common/components/PageTitle/PageTitle';
import CardItem from '@common/components/CardItem/CardItem';
import { useNavigate } from 'react-router-dom';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

const { Paragraph, Title, Text } = Typography;

const Resources: React.FC = () => {
    const navigate = useNavigate();
    const { isDark, customTheme, isCustomThemeActive, getThemeColor } = useTheme();
    const customPalette =
        isCustomThemeActive && customTheme ? CUSTOM_THEME_PALETTES[customTheme] : null;

    const pickColor = (light: string, dark?: string, customValue?: string) => {
        if (customPalette && customValue) {
            return customValue;
        }
        return getThemeColor({ light, dark });
    };

    const sectionDescriptionColor = pickColor('#666', '#8c8c8c', customPalette?.textMuted);
    const cardDescriptionColor = pickColor('#666', '#bfbfbf', customPalette?.textSecondary);
    const cardBackground = pickColor('#fff', '#1f1f1f', customPalette?.surface);
    const cardBorder = pickColor('#f0f0f0', '#303030', customPalette?.border);
    const cardTitleColor = pickColor('#1a1a1a', '#f5f5f5', customPalette?.textPrimary);
    const secondaryTextColor = pickColor('#8c8c8c', '#a6a6a6', customPalette?.textSecondary);
    const accentColor = customPalette?.accent;
    const sectionTitleBaseStyle = { marginBottom: 16 } as const;
    const sectionTitleStyle = customPalette
        ? { ...sectionTitleBaseStyle, color: customPalette.accent }
        : sectionTitleBaseStyle;
    const sectionTitleEmphasis = customPalette
        ? {
              color: customPalette.accent,
          }
        : undefined;
    const cardItemBackground = pickColor('#FFFFFF', '#171717', customPalette?.surfaceAlt);
    const cardItemHover = pickColor('#F5F5F5', '#2A2A2A', customPalette?.hover);
    const cardItemBorder = pickColor('#E0E0E0', '#303030', customPalette?.border);
    const cardItemText = pickColor('#1A1A1A', '#EEF2F7', customPalette?.textPrimary);
    const cardItemDesc = pickColor('#00000099', '#FFFFFF99', customPalette?.textMuted);

    const textGeneratorAccent = pickColor('#FF8C69', '#E05350', customPalette?.accent);
    const imageProcessorAccent = pickColor(
        '#6C9EFF',
        '#5181E0',
        customPalette?.accentSoft ?? customPalette?.accent
    );
    const mcTextFormatterAccent = pickColor(
        '#FF8A65',
        '#FF6B35',
        customPalette?.accentSoft ?? customPalette?.accent
    );
    const githubAccent = pickColor(
        '#24292F',
        '#f0f6fc',
        customPalette?.accentSoft ?? customPalette?.accent
    );
    const wikiToolsAccent = pickColor('#9254de', '#722ed1', customPalette?.accent);

    const pythonBrandColor = pickColor(
        '#3776ab',
        '#90c2ff',
        customPalette?.accentSoft ?? customPalette?.accent
    );
    const javaBrandColor = pickColor('#f89820', '#ffb366', customPalette?.accent);

    const bilibiliColor = pickColor('#00a1d6', '#00a1d6', customPalette?.accent);
    const xiaohongshuColor = pickColor('#ff2442', '#ff647c', customPalette?.accent);
    const wechatColor = pickColor(
        '#07c160',
        '#4cd964',
        customPalette?.accentSoft ?? customPalette?.accent
    );
    const douyinColor = pickColor('#000000', '#ffffff', customPalette?.accent);
    const qqColor = pickColor('#12b7f5', '#60d8ff', customPalette?.accent);

    // 开源项目数据
    const openSourceProjects = [
        {
            key: 'eccamera',
            title: gLang('resources.openSource.eccamera.title'),
            description: gLang('resources.openSource.eccamera.description'),
            features: gLang('resources.openSource.eccamera.features'),
            stars: gLang('resources.openSource.eccamera.stars'),
            language: gLang('resources.openSource.eccamera.language'),
            url: 'https://github.com/EaseCation/ECCamera',
            icon: <FaPython style={{ color: pythonBrandColor }} />,
            color: pythonBrandColor,
        },
        {
            key: 'mcpywrap',
            title: gLang('resources.openSource.mcpywrap.title'),
            description: gLang('resources.openSource.mcpywrap.description'),
            features: gLang('resources.openSource.mcpywrap.features'),
            stars: gLang('resources.openSource.mcpywrap.stars'),
            language: gLang('resources.openSource.mcpywrap.language'),
            url: 'https://github.com/EaseCation/mcpywrap',
            icon: <FaPython style={{ color: pythonBrandColor }} />,
            color: pythonBrandColor,
        },
        {
            key: 'fabricrock',
            title: gLang('resources.openSource.fabricrock.title'),
            description: gLang('resources.openSource.fabricrock.description'),
            features: gLang('resources.openSource.fabricrock.features'),
            stars: gLang('resources.openSource.fabricrock.stars'),
            language: gLang('resources.openSource.fabricrock.language'),
            url: 'https://github.com/EaseCation/FabricRock',
            icon: <FaJava style={{ color: javaBrandColor }} />,
            color: javaBrandColor,
        },
    ];

    // Wiki 数据
    const wikiItems = [
        {
            key: 'devWiki',
            title: gLang('resources.wiki.devWiki.title'),
            description: gLang('resources.wiki.devWiki.description'),
            url: gLang('resources.wiki.devWiki.url'),
            icon: <BookOutlined />,
        },
        {
            key: 'gameWiki',
            title: gLang('resources.wiki.gameWiki.title'),
            description: gLang('resources.wiki.gameWiki.description'),
            url: gLang('resources.wiki.gameWiki.url'),
            icon: <GlobalOutlined />,
        },
    ];

    // 社交媒体数据
    const socialItems = [
        {
            key: 'bilibili',
            title: gLang('resources.social.bilibili.title'),
            description: gLang('resources.social.bilibili.description'),
            handle: gLang('resources.social.bilibili.handle'),
            icon: <SiBilibili style={{ color: bilibiliColor }} />,
            color: bilibiliColor,
            url: 'https://space.bilibili.com/382198016',
        },
        {
            key: 'xiaohongshu',
            title: gLang('resources.social.xiaohongshu.title'),
            description: gLang('resources.social.xiaohongshu.description'),
            handle: gLang('resources.social.xiaohongshu.handle'),
            icon: <SiXiaohongshu style={{ color: xiaohongshuColor }} />,
            color: xiaohongshuColor,
            url: 'https://www.xiaohongshu.com/user/profile/683824fe000000001b0195d2',
        },
        {
            key: 'wechat',
            title: gLang('resources.social.wechat.title'),
            description: gLang('resources.social.wechat.description'),
            handle: gLang('resources.social.wechat.handle'),
            icon: <FaWeixin style={{ color: wechatColor }} />,
            color: wechatColor,
            url: null, // 微信公众号没有直接链接
        },
        {
            key: 'douyin',
            title: gLang('resources.social.douyin.title'),
            description: gLang('resources.social.douyin.description'),
            handle: gLang('resources.social.douyin.handle'),
            icon: <FaTiktok style={{ color: douyinColor }} />,
            color: douyinColor,
            url: 'https://v.douyin.com/Qzag7VjZcHM/',
        },
        {
            key: 'qqchannel',
            title: gLang('resources.social.qqchannel.title'),
            description: gLang('resources.social.qqchannel.description'),
            handle: gLang('resources.social.qqchannel.handle'),
            icon: <FaQq style={{ color: qqColor }} />,
            color: qqColor,
            url: 'https://pd.qq.com/s/gbyoxl8uj?b=9',
        },
    ];

    const renderAccentBar = (marginBottom = 16) =>
        customPalette ? (
            <div
                style={{
                    height: 3,
                    background: customPalette.accent,
                    margin: `-20px -20px ${marginBottom}px -20px`,
                    borderRadius: '2px 2px 0 0',
                }}
            />
        ) : null;

    let itemIndex = 0;
    const animationDelay = 0.05;

    return (
        <Wrapper>
            <div
                style={{
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: 'fadeInUp 0.5s ease-in-out forwards',
                }}
            >
                <PageTitle title={gLang('resources.title')} />
            </div>

            <Space direction="vertical" size={32} style={{ width: '100%' }}>
                {/* 实用工具部分 */}
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `fadeInUp 0.5s ease-in-out ${0.1 + itemIndex++ * 0.1}s forwards`,
                    }}
                >
                    <Title level={3} style={sectionTitleStyle}>
                        🛠️ {gLang('resources.sections.tools.title')}
                    </Title>
                    <Paragraph style={{ marginBottom: 24, color: sectionDescriptionColor }}>
                        {gLang('resources.sections.tools.description')}
                    </Paragraph>
                    <Row gutter={[16, 16]}>
                        {/* Wiki工具集合 */}
                        <CardItem
                            Icon={ToolOutlined}
                            color={wikiToolsAccent}
                            title={gLang('resources.tools.wikiTools.title')}
                            description={gLang('resources.tools.wikiTools.description')}
                            isDark={isDark}
                            onClick={() => navigate('/resources/wiki')}
                            backgroundColor={cardItemBackground}
                            borderColor={cardItemBorder}
                            hoverColor={cardItemHover}
                            textColor={cardItemText}
                            descColor={cardItemDesc}
                            fadeInDelay={0.2 + itemIndex++ * animationDelay}
                        />

                        {/*3D字生成器 - 外部工具*/}
                        <CardItem
                            Icon={FaFont}
                            color={textGeneratorAccent}
                            title={gLang('resources.tools.textGenerator.title')}
                            description={gLang('resources.tools.textGenerator.description')}
                            isDark={isDark}
                            onClick={() => window.open('https://3dtext.easecation.net/', '_blank')}
                            backgroundColor={cardItemBackground}
                            borderColor={cardItemBorder}
                            hoverColor={cardItemHover}
                            textColor={cardItemText}
                            descColor={cardItemDesc}
                            fadeInDelay={0.2 + itemIndex++ * animationDelay}
                        />

                        {/*图片处理器 - 外部工具*/}
                        <CardItem
                            Icon={FaImage}
                            color={imageProcessorAccent}
                            title={gLang('resources.tools.imageProcessor.title')}
                            description={gLang('resources.tools.imageProcessor.description')}
                            isDark={isDark}
                            onClick={() =>
                                window.open(
                                    'https://service.wiki.easecation.net/image-processor?from=uc',
                                    '_blank'
                                )
                            }
                            backgroundColor={cardItemBackground}
                            borderColor={cardItemBorder}
                            hoverColor={cardItemHover}
                            textColor={cardItemText}
                            descColor={cardItemDesc}
                            fadeInDelay={0.2 + itemIndex++ * animationDelay}
                        />

                        {/*MC文本格式化工具 - 外部工具*/}
                        <CardItem
                            Icon={FaCode}
                            color={mcTextFormatterAccent}
                            title={gLang('resources.tools.mcTextFormatter.title')}
                            description={gLang('resources.tools.mcTextFormatter.description')}
                            isDark={isDark}
                            onClick={() => window.open('https://f.easecation.net', '_blank')}
                            backgroundColor={cardItemBackground}
                            borderColor={cardItemBorder}
                            hoverColor={cardItemHover}
                            textColor={cardItemText}
                            descColor={cardItemDesc}
                            fadeInDelay={0.2 + itemIndex++ * animationDelay}
                        />

                        {/*GitHub主页 - 更多资源*/}
                        <CardItem
                            Icon={GithubOutlined}
                            color={githubAccent}
                            title={gLang('resources.tools.github.title')}
                            description={gLang('resources.tools.github.description')}
                            isDark={isDark}
                            onClick={() => window.open('https://github.com/EaseCation', '_blank')}
                            backgroundColor={cardItemBackground}
                            borderColor={cardItemBorder}
                            hoverColor={cardItemHover}
                            textColor={cardItemText}
                            descColor={cardItemDesc}
                            fadeInDelay={0.2 + itemIndex++ * animationDelay}
                        />
                    </Row>
                </div>

                {/* 知识库部分 */}
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `fadeInUp 0.5s ease-in-out ${0.1 + itemIndex++ * 0.1}s forwards`,
                    }}
                >
                    <Title level={3} style={sectionTitleStyle}>
                        📚 {gLang('resources.sections.wiki.title')}
                    </Title>
                    <Paragraph style={{ marginBottom: 24, color: sectionDescriptionColor }}>
                        {gLang('resources.sections.wiki.description')}
                    </Paragraph>
                    <Row gutter={[24, 24]}>
                        {wikiItems.map((item, _index) => (
                            <Col xs={24} sm={12} key={item.key}>
                                <Card
                                    hoverable
                                    style={{
                                        height: '100%',
                                        border: `1px solid ${cardBorder}`,
                                        background: cardBackground,
                                        opacity: 0,
                                        transform: 'translateY(10px)',
                                        animation: `fadeInUp 0.5s ease-in-out ${0.2 + itemIndex++ * animationDelay}s forwards`,
                                    }}
                                    bodyStyle={{ padding: '20px' }}
                                    onClick={() => window.open(item.url, '_blank')}
                                >
                                    {renderAccentBar()}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                        }}
                                    >
                                        <span
                                            style={{
                                                display: 'flex',
                                                color: accentColor,
                                            }}
                                        >
                                            {item.icon}
                                        </span>
                                        <Title
                                            level={4}
                                            style={
                                                isCustomThemeActive
                                                    ? {
                                                          margin: '0 0 0 10px',
                                                          color: accentColor ?? cardTitleColor,
                                                      }
                                                    : { margin: '0 0 0 10px' }
                                            }
                                        >
                                            {item.title}
                                        </Title>
                                    </div>
                                    <Paragraph
                                        style={{
                                            color: cardDescriptionColor,
                                            marginBottom: 0,
                                        }}
                                    >
                                        {item.description}
                                    </Paragraph>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>

                {/* 社交媒体部分 */}
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `fadeInUp 0.5s ease-in-out ${0.1 + itemIndex++ * 0.1}s forwards`,
                    }}
                >
                    <Title level={3} style={sectionTitleStyle}>
                        📱 {gLang('resources.sections.social.title')}
                    </Title>
                    <Paragraph style={{ marginBottom: 24, color: sectionDescriptionColor }}>
                        {gLang('resources.sections.social.description')}
                    </Paragraph>
                    <div
                        style={{
                            display: 'grid',
                            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                            gap: '16px',
                            width: '100%',
                        }}
                    >
                        {socialItems.map(item => (
                            <div key={item.key}>
                                <Card
                                    hoverable
                                    style={{
                                        textAlign: 'center',
                                        border: `1px solid ${cardBorder}`,
                                        background: cardBackground,
                                        cursor: item.url ? 'pointer' : 'default',
                                        height: '100%',
                                        display: 'flex',
                                        flexDirection: 'column',
                                        opacity: 0,
                                        transform: 'translateY(10px)',
                                        animation: `fadeInUp 0.5s ease-in-out ${0.2 + itemIndex++ * animationDelay}s forwards`,
                                    }}
                                    bodyStyle={{
                                        padding: '20px 16px',
                                        flex: 1,
                                        display: 'flex',
                                        flexDirection: 'column',
                                        justifyContent: 'center',
                                    }}
                                    onClick={() => item.url && window.open(item.url, '_blank')}
                                >
                                    {renderAccentBar(12)}
                                    <div
                                        style={{
                                            fontSize: '24px',
                                            marginBottom: 8,
                                            color: item.color,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: accentColor ?? item.color,
                                                display: 'inline-flex',
                                            }}
                                        >
                                            {item.icon}
                                        </span>
                                    </div>
                                    <Title
                                        level={5}
                                        style={{
                                            margin: '0 0 4px 0',
                                            color: accentColor ?? item.color,
                                        }}
                                    >
                                        {item.title}
                                    </Title>
                                    <Text
                                        type="secondary"
                                        style={{
                                            fontSize: '12px',
                                            ...(isCustomThemeActive
                                                ? { color: secondaryTextColor }
                                                : {}),
                                        }}
                                    >
                                        {item.handle}
                                    </Text>
                                </Card>
                            </div>
                        ))}
                    </div>
                </div>

                {/* 开源项目部分 */}
                <div
                    style={{
                        opacity: 0,
                        transform: 'translateY(10px)',
                        animation: `fadeInUp 0.5s ease-in-out ${0.1 + itemIndex++ * 0.1}s forwards`,
                    }}
                >
                    <Title level={3} style={sectionTitleStyle}>
                        🚀 {gLang('resources.sections.openSource.title')}
                    </Title>
                    <Paragraph style={{ marginBottom: 24, color: sectionDescriptionColor }}>
                        {gLang('resources.sections.openSource.description')}
                    </Paragraph>
                    <Row gutter={[24, 24]}>
                        {openSourceProjects.map(project => (
                            <Col xs={24} sm={12} lg={8} key={project.key}>
                                <Card
                                    hoverable
                                    style={{
                                        height: '100%',
                                        border: `1px solid ${cardBorder}`,
                                        background: cardBackground,
                                        opacity: 0,
                                        transform: 'translateY(10px)',
                                        animation: `fadeInUp 0.5s ease-in-out ${0.2 + itemIndex++ * animationDelay}s forwards`,
                                    }}
                                    bodyStyle={{ padding: '20px' }}
                                    onClick={() => window.open(project.url, '_blank')}
                                >
                                    {renderAccentBar()}
                                    <div
                                        style={{
                                            display: 'flex',
                                            alignItems: 'center',
                                            marginBottom: 12,
                                            gap: 8,
                                        }}
                                    >
                                        <span
                                            style={{
                                                color: accentColor,
                                                display: 'flex',
                                            }}
                                        >
                                            {project.icon}
                                        </span>
                                        <Title
                                            level={4}
                                            style={{
                                                margin: 0,
                                                color: accentColor ?? project.color,
                                            }}
                                        >
                                            {project.title}
                                        </Title>
                                    </div>
                                    <Paragraph
                                        style={{
                                            color: cardDescriptionColor,
                                            marginBottom: 16,
                                        }}
                                    >
                                        {project.description}
                                    </Paragraph>
                                    <div style={{ marginBottom: 16 }}>
                                        {Array.isArray(project.features) &&
                                            project.features.map(
                                                (feature: string, index: number) => (
                                                    <Tag
                                                        key={index}
                                                        color={accentColor ?? project.color}
                                                        style={{ marginBottom: 4 }}
                                                    >
                                                        {feature}
                                                    </Tag>
                                                )
                                            )}
                                    </div>
                                    <div
                                        style={{
                                            display: 'flex',
                                            justifyContent: 'space-between',
                                            alignItems: 'center',
                                        }}
                                    >
                                        <Space>
                                            <Text
                                                type="secondary"
                                                style={
                                                    isCustomThemeActive
                                                        ? { color: secondaryTextColor }
                                                        : undefined
                                                }
                                            >
                                                <StarOutlined style={sectionTitleEmphasis} />{' '}
                                                {project.stars}
                                            </Text>
                                            <Text
                                                type="secondary"
                                                style={
                                                    isCustomThemeActive
                                                        ? { color: secondaryTextColor }
                                                        : undefined
                                                }
                                            >
                                                {project.language}
                                            </Text>
                                        </Space>
                                    </div>
                                </Card>
                            </Col>
                        ))}
                    </Row>
                </div>
            </Space>
        </Wrapper>
    );
};

export default Resources;
