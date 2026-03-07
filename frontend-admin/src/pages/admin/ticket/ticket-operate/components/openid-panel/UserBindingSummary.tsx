import React from 'react';
import { Badge, Button, Card, Col, Descriptions, Grid, Row, Space, Tag, Typography } from 'antd';
import {
    CheckCircleOutlined,
    DisconnectOutlined,
    FileTextOutlined,
    QuestionCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { UpOutlined, DownOutlined } from '@ant-design/icons';
import { BindPlayer } from '@ecuc/shared/types/player.types';
import { UserBindStatus } from '@ecuc/shared/types';
import { gLang } from '@common/language';

const { Text } = Typography;
const { useBreakpoint } = Grid;

interface UserBindingSummaryProps {
    bindList: BindPlayer[];
    onViewDetailsClick: (e: React.MouseEvent) => void;
    defaultExpanded?: boolean;
}

// 根据状态返回标签颜色
const getStatusColor = (status: string) => {
    switch (status) {
        case UserBindStatus.Open:
            return 'success';
        case UserBindStatus.Frozen:
            return 'error';
        case UserBindStatus.Unbound:
            return 'default';
        default:
            return 'processing';
    }
};

// 根据状态返回图标
const getStatusIcon = (status: string) => {
    switch (status) {
        case UserBindStatus.Open:
            return <CheckCircleOutlined />;
        case UserBindStatus.Frozen:
            return <StopOutlined />;
        case UserBindStatus.Unbound:
            return <DisconnectOutlined />;
        default:
            return <QuestionCircleOutlined />;
    }
};

const UserBindingSummary: React.FC<UserBindingSummaryProps> = ({
    bindList,
    onViewDetailsClick,
    defaultExpanded = false,
}) => {
    const screens = useBreakpoint();
    const [collapsed, setCollapsed] = React.useState(!defaultExpanded);

    // 对绑定列表进行去重处理
    const uniqueBindList = React.useMemo(() => {
        const ecidSet = new Set();
        return bindList.filter(item => {
            if (ecidSet.has(item.ecid)) {
                return false;
            }
            ecidSet.add(item.ecid);
            return true;
        });
    }, [bindList]);

    // 计算绑定状态统计
    const bindingStats = React.useMemo(() => {
        const total = bindList.length;
        const normal = bindList.filter(item => item.status === UserBindStatus.Open).length;
        const frozen = bindList.filter(item => item.status === UserBindStatus.Frozen).length;
        const unbound = bindList.filter(item => item.status === UserBindStatus.Unbound).length;
        return { total, normal, frozen, unbound };
    }, [bindList]);

    const topAccounts = React.useMemo(() => {
        // 使用去重后的列表
        return [...uniqueBindList].sort((a, b) => {
            const order = {
                [UserBindStatus.Open]: 0,
                [UserBindStatus.Frozen]: 1,
                [UserBindStatus.Unbound]: 2,
            } as const;
            return order[a.status as keyof typeof order] - order[b.status as keyof typeof order];
        });
    }, [uniqueBindList]);

    return (
        <Card
            size="small"
            styles={{
                header: {
                    padding: '8px 12px',
                    color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined,
                },
                body: collapsed ? { padding: 0, display: 'none' } : { padding: 12 },
            }}
            title={
                <Space
                    size={8}
                    align="center"
                    onClick={() => setCollapsed(prev => !prev)}
                    style={{ cursor: 'pointer' }}
                >
                    <FileTextOutlined
                        style={{ color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined }}
                    />
                    <Text
                        strong
                        type={collapsed ? 'secondary' : undefined}
                        style={{ fontSize: 16 }}
                    >
                        {gLang('superPanel.openIdInfo')}
                    </Text>
                </Space>
            }
            extra={
                <Button
                    type="text"
                    size="small"
                    icon={collapsed ? <DownOutlined /> : <UpOutlined />}
                    onClick={() => setCollapsed(prev => !prev)}
                    title={collapsed ? gLang('common.switch.open') : gLang('common.switch.close')}
                    style={{ color: collapsed ? 'var(--ant-color-text-tertiary)' : undefined }}
                />
            }
        >
            {!collapsed && (
                <Space direction="vertical" size={screens.xs ? 12 : 14} style={{ width: '100%' }}>
                    <Row
                        justify="space-between"
                        align={screens.xs ? 'top' : 'middle'}
                        gutter={[8, 8]}
                    >
                        <Col xs={24} md={18}>
                            <Descriptions
                                column={screens.md ? 4 : screens.sm ? 2 : 1}
                                size="small"
                                bordered
                                style={{ width: '100%' }}
                            >
                                <Descriptions.Item
                                    label={
                                        <Text strong>
                                            {gLang('superPanel.historyBindAccounts')}
                                        </Text>
                                    }
                                    labelStyle={{ padding: '6px 8px' }}
                                    contentStyle={{ padding: '6px 8px' }}
                                >
                                    <Badge
                                        status={bindingStats.total > 0 ? 'processing' : 'warning'}
                                        text={
                                            <Text>
                                                {bindingStats.total > 0
                                                    ? `${bindingStats.total}`
                                                    : gLang('superPanel.noBindAccounts')}
                                            </Text>
                                        }
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Text strong>{gLang('superPanel.status.normal')}</Text>}
                                    labelStyle={{ padding: '6px 8px' }}
                                    contentStyle={{ padding: '6px 8px' }}
                                >
                                    <Badge
                                        status={'success'}
                                        text={<Text>{bindingStats.normal}</Text>}
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Text strong>{gLang('superPanel.status.frozen')}</Text>}
                                    labelStyle={{ padding: '6px 8px' }}
                                    contentStyle={{ padding: '6px 8px' }}
                                >
                                    <Badge
                                        status={'error'}
                                        text={<Text>{bindingStats.frozen}</Text>}
                                    />
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={<Text strong>{gLang('superPanel.status.unbound')}</Text>}
                                    labelStyle={{ padding: '6px 8px' }}
                                    contentStyle={{ padding: '6px 8px' }}
                                >
                                    <Badge
                                        status={'default'}
                                        text={<Text>{bindingStats.unbound}</Text>}
                                    />
                                </Descriptions.Item>
                            </Descriptions>
                        </Col>
                        <Col xs={24} md={6} style={{ textAlign: screens.xs ? 'left' : 'right' }}>
                            <Button icon={<FileTextOutlined />} onClick={onViewDetailsClick}>
                                {gLang('superPanel.showDetails')}
                            </Button>
                        </Col>
                    </Row>

                    {topAccounts.length > 0 && (
                        <Space size={6} wrap style={{ width: '100%' }}>
                            {topAccounts.slice(0, 3).map(item => (
                                <Tag
                                    key={item.ecid}
                                    icon={getStatusIcon(item.status)}
                                    color={getStatusColor(item.status)}
                                    style={{ margin: '2px 0' }}
                                >
                                    {item.ecid}
                                </Tag>
                            ))}
                            {topAccounts.length > 3 && (
                                <Tag color="default" style={{ margin: '2px 0' }}>
                                    +{topAccounts.length - 3} {gLang('more')}
                                </Tag>
                            )}
                        </Space>
                    )}
                </Space>
            )}
        </Card>
    );
};

export default UserBindingSummary;
