// 吃饱杯游戏排行信息

import React, { useEffect, useState } from 'react';
import {
    PublicStageDataSG,
    PublicStageDataSGScoreboardItem,
} from '@ecuc/shared/types/player.types';
import { fetchData } from '@common/axiosConfig';
import {
    Collapse,
    CollapseProps,
    Descriptions,
    DescriptionsProps,
    Empty,
    Popover,
    Space,
    Spin,
    Table,
    theme,
    Typography,
} from 'antd';
import { gLang } from '@common/language';
import { convertUTCToFormat } from '@common/components/TimeConverter';

const { Title, Paragraph } = Typography;

const PublicStageDataSGMatch: React.FC = () => {
    const [data, setData] = useState<PublicStageDataSG[] | undefined>(undefined);

    const { token } = theme.useToken();

    useEffect(() => {
        fetchData({
            url: '/public/sgmatchscore',
            method: 'GET',
            data: {},
            setData: data => {
                if (data.data) {
                    // 时间倒序排序，最新的在最顶上
                    data.data.sort((a: PublicStageDataSG, b: PublicStageDataSG) => {
                        return parseInt(b.time) - parseInt(a.time);
                    });
                    setData(data.data);
                }
            },
        });
    }, []);

    const renderTime = (timeStr: string) => {
        const timestamp = parseInt(timeStr) * 1000;
        return convertUTCToFormat(timestamp, 'YYYY-MM-DD HH:mm:ss');
    };

    const panelStyle: React.CSSProperties = {
        marginBottom: 16,
        background: token.colorFillAlter,
        borderRadius: token.borderRadiusLG,
        border: 'none',
    };

    const genItems: () => CollapseProps['items'] = () => {
        return data?.map(item => {
            return {
                key: item.uuid,
                label:
                    renderTime(item.time) +
                    ' (' +
                    item.playerCount +
                    gLang('publicSgmatch.peopleSuffix'),
                children: renderChild(item),
                style: panelStyle,
            };
        });
    };

    const tableColumns = [
        {
            title: '#',
            dataIndex: 'key',
            key: 'key',
            width: 24,
            render: (text: any, record: any, index: number) => {
                return index + 1;
            },
        },
        {
            title: gLang('sgMatchScore.table.player'),
            dataIndex: 'name',
            key: 'name',
            render: (text: any, record: any) => <Popover title={record.player}>{text}</Popover>,
        },
        {
            title: gLang('sgMatchScore.table.kills'),
            dataIndex: 'kills',
            key: 'kills',
            width: 96,
        },
        {
            title: gLang('sgMatchScore.table.playersRemainWhenDeath'),
            dataIndex: 'playersRemainWhenDeath',
            key: 'playersRemainWhenDeath',
            width: 96,
            render: (text: any) => <>{text === -1 ? '-' : text + 1}</>,
        },
        {
            title: gLang('sgMatchScore.table.totalScore'),
            dataIndex: 'totalScore',
            key: 'totalScore',
            width: 96,
        },
    ];

    const renderChild = (item: PublicStageDataSG) => {
        const items: DescriptionsProps['items'] = [
            {
                label: gLang('sgMatchScore.item.time'),
                children: renderTime(item.time),
            },
            {
                label: gLang('sgMatchScore.item.type'),
                children: item.type,
            },
            {
                label: gLang('sgMatchScore.item.mapName'),
                children: item.mapName,
            },
        ];
        return (
            <Space direction={'vertical'} style={{ width: '100%' }}>
                <Descriptions items={items} size={'small'} />
                {renderTable(item.scoreboard)}
            </Space>
        );
    };

    const renderTable = (scoreboard: PublicStageDataSGScoreboardItem[]) => {
        const dataSource = scoreboard.map((item, index) => {
            return {
                key: index,
                player: item.player,
                name: item.name,
                kills: item.kills,
                killScore: item.killScore,
                survivalScore: item.survivalScore,
                totalScore: item.totalScore,
                winTeam: item.winTeam,
                playersRemainWhenDeath: item.playersRemainWhenDeath,
            };
        });
        const tableStyle: React.CSSProperties = {
            overflowX: 'auto',
        };
        return (
            <Table
                style={tableStyle}
                dataSource={dataSource}
                columns={tableColumns}
                pagination={false} // 禁用分页
            />
        );
    };

    return (
        <Space direction="vertical" size="large" style={{ width: '100%' }}>
            <Typography>
                <Title>{gLang('sgMatchScore.title')}</Title>
                <Paragraph>{gLang('sgMatchScore.intro')}</Paragraph>
            </Typography>
            <img
                alt="sg_chibaobei"
                src="/image/sg_chibaobei.jpg"
                style={{ maxHeight: 400, objectFit: 'cover', width: '100%' }}
            />
            <Spin spinning={data === undefined}>
                {data !== undefined && data?.length > 0 ? (
                    <Collapse
                        style={{ flex: 1, background: 'transparent' }}
                        bordered={false}
                        items={genItems()}
                    />
                ) : (
                    <Empty
                        description={gLang('sgMatchScore.empty')}
                        image={Empty.PRESENTED_IMAGE_SIMPLE}
                        style={{ paddingTop: 24 }}
                    />
                )}
            </Spin>
        </Space>
    );
};

export default PublicStageDataSGMatch;
