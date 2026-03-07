// 排行榜

import {
    Button,
    Empty,
    Flex,
    message,
    Segmented,
    Space,
    Spin,
    Tabs,
    TabsProps,
    Typography,
} from 'antd';
import { useEffect, useMemo, useState } from 'react';
import { PublicScoreTopFullData } from '@ecuc/shared/types/player.types';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import ScoreTopCard from '../../components/ScoreTopCard';
import { ReloadOutlined } from '@ant-design/icons';
import ErrorDisplay from '../../components/ErrorDisplay';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

const PublicScoreTop = () => {
    const { getThemeColor } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;

    const headingColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f5f5f5',
        custom: { blackOrange: palette.accent },
    });
    const mutedTextColor = getThemeColor({
        light: '#666666',
        dark: '#a6a6a6',
        custom: { blackOrange: palette.textSecondary },
    });
    const segmentedBackground = getThemeColor({
        light: '#f5f5f5',
        dark: '#1f1f1f',
        custom: { blackOrange: palette.surfaceAlt },
    });
    const segmentedBorder = getThemeColor({
        light: '#d9d9d9',
        dark: '#434343',
        custom: { blackOrange: palette.border },
    });
    const tabColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f0f0f0',
        custom: { blackOrange: palette.textPrimary },
    });
    const tabBarBorder = getThemeColor({
        light: '#f0f0f0',
        dark: '#303030',
        custom: { blackOrange: palette.border },
    });

    const [, contextHolder] = message.useMessage();
    const [data, setData] = useState<PublicScoreTopFullData>();
    const [loading, setLoading] = useState(true);
    const [empty, setEmpty] = useState(false);
    const [pc, setPC] = useState(false);
    const [error, setError] = useState<boolean>(false);

    const [tabItems, setTabItems] = useState<TabsProps['items']>([
        {
            key: 'all',
            label: gLang('scoreTop.all'),
        },
    ]);
    const [tab, setTab] = useState('all');

    useEffect(() => {
        onRefresh();
    }, []);

    const onRefresh = () => {
        setLoading(true);
        setError(false);
        fetchData({
            url: '/ec/scoretop',
            method: 'GET',
            data: {},
            setData: data => setData(data.data),
            setSpin: setLoading,
        }).catch(e => {
            console.error('Failed to fetch score top data:', e);
            setError(true);
            setLoading(false);
        });
    };

    useEffect(() => {
        if (data) {
            const newTabItems = [
                {
                    key: 'all',
                    label: gLang('scoreTop.all'),
                },
            ];
            for (const game in data) {
                newTabItems.push({
                    key: `${game}`,
                    label: gLang(`game.${game}`) === `game.${game}` ? game : gLang(`game.${game}`),
                });
            }
            setTabItems(newTabItems);
        }
    }, [data]);

    const renderedCards = useMemo(() => {
        if (!data) return [];
        const cards = Object.entries(data)
            .flatMap(([game, gameData]) =>
                tab === 'all' || tab === game
                    ? Object.entries(gameData).flatMap(([type, typeData]) =>
                          type.startsWith('PC-')
                              ? pc
                                  ? Object.entries(typeData).map(
                                        ([deadlineType, deadlineTypeData]) => (
                                            <div
                                                key={`${game}-${type}-${deadlineType}`}
                                                style={{
                                                    flex: '1 1 300px',
                                                    maxWidth: '500px',
                                                    minWidth: '300px',
                                                }}
                                            >
                                                <ScoreTopCard
                                                    game={game}
                                                    type={type.substring(3)}
                                                    deadlineType={deadlineType}
                                                    pc={true}
                                                    data={deadlineTypeData}
                                                />
                                            </div>
                                        )
                                    )
                                  : undefined
                              : !pc
                                ? Object.entries(typeData).map(
                                      ([deadlineType, deadlineTypeData]) => (
                                          <div
                                              key={`${game}-${type}-${deadlineType}`}
                                              style={{
                                                  flex: '1 1 300px',
                                                  maxWidth: '500px',
                                                  minWidth: '300px',
                                              }}
                                          >
                                              <ScoreTopCard
                                                  game={game}
                                                  type={type}
                                                  deadlineType={deadlineType}
                                                  pc={false}
                                                  data={deadlineTypeData}
                                              />
                                          </div>
                                      )
                                  )
                                : undefined
                      )
                    : undefined
            )
            .filter(e => e !== undefined);

        setEmpty(cards.length === 0);
        return cards;
    }, [data, tab, pc]);

    return (
        <Space direction="vertical" size={16} style={{ width: '100%' }}>
            {contextHolder}
            <Typography>
                <Flex wrap="wrap" justify="space-between">
                    <Flex wrap="wrap" justify="flex-start" gap={16}>
                        <h2 style={{ marginBottom: 0, color: headingColor }}>
                            {gLang('scoreTop.title')}
                        </h2>
                        <div style={{ paddingTop: 4 }}>
                            <Segmented<string>
                                options={[
                                    { value: 'PE', label: gLang('scoreTop.platform.pe') },
                                    { value: 'PC', label: gLang('scoreTop.platform.pc') },
                                ]}
                                value={pc ? 'PC' : 'PE'}
                                onChange={value => {
                                    setPC(value === 'PC');
                                }}
                                style={{
                                    background: segmentedBackground,
                                    borderRadius: 8,
                                    padding: 2,
                                    border: `1px solid ${segmentedBorder}`,
                                    color: mutedTextColor,
                                }}
                            />
                        </div>
                    </Flex>
                    <div style={{ paddingTop: 4 }}>
                        <Button icon={<ReloadOutlined />} loading={loading} onClick={onRefresh}>
                            {gLang('scoreTop.refresh')}
                        </Button>
                    </div>
                </Flex>
            </Typography>

            {!error && (
                <Tabs
                    items={tabItems}
                    activeKey={tab}
                    onChange={key => setTab(key)}
                    tabBarStyle={{
                        color: mutedTextColor,
                        borderBottom: `1px solid ${tabBarBorder}`,
                    }}
                    moreIcon={null}
                    style={{
                        color: tabColor,
                    }}
                />
            )}

            {!data && loading && <Spin style={{ display: 'block', padding: 40 }} />}
            {error && <ErrorDisplay onRetry={onRefresh} />}

            {data && (
                <Flex wrap="wrap" gap="middle" justify="space-around">
                    {renderedCards}
                </Flex>
            )}

            {data && empty && (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={gLang('scoreTop.empty')}
                    style={{
                        paddingTop: 40,
                        color: mutedTextColor,
                    }}
                />
            )}
        </Space>
    );
};

export default PublicScoreTop;
