import React, { useState } from 'react';
import {
    Badge,
    Button,
    Col,
    Descriptions,
    Empty,
    List,
    Modal,
    Row,
    Select,
    Space,
    Spin,
    Tag,
    Tooltip,
    Typography,
} from 'antd';
import { EditOutlined, LockOutlined, UnlockOutlined, UserOutlined } from '@ant-design/icons';
import { BindPlayer } from '@ecuc/shared/types/player.types';
import { UserBindStatus } from '@ecuc/shared/types';
import { gLang } from '@common/language';
import SuperPanelPlayerComponent from '../../../../panel/components/SuperPanelPlayerComponent';

const { Title, Text } = Typography;
const { Option } = Select;

interface AccountManagementModalProps {
    openid: string;
    visible: boolean;
    onClose: () => void;
    bindList: BindPlayer[];
    uniqueBindList: BindPlayer[];
    bindingStats: {
        total: number;
        normal: number;
        frozen: number;
        unbound: number;
    };
    loading: boolean;
    onUpdateStatus: (ecid: string, newStatus: string) => void;
    onFreezeAll: () => void;
    onUnfreezeAll: () => void;
    screens: any;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
}

const AccountManagementModal: React.FC<AccountManagementModalProps> = ({
    openid,
    visible,
    onClose,
    uniqueBindList,
    bindingStats,
    loading,
    onUpdateStatus,
    onFreezeAll,
    onUnfreezeAll,
    screens,
    getStatusIcon,
    getStatusColor,
}) => {
    // SuperPanelPlayerComponent模态框状态
    const [superPanelVisible, setSuperPanelVisible] = useState(false);
    const [selectedEcid, setSelectedEcid] = useState<string>('');

    // 处理ecid点击事件
    const handleEcidClick = (ecid: string) => {
        setSelectedEcid(ecid);
        setSuperPanelVisible(true);
    };

    // 关闭SuperPanelPlayerComponent模态框
    const handleSuperPanelClose = () => {
        setSuperPanelVisible(false);
        setSelectedEcid('');
    };

    return (
        <Modal
            title={
                <Space>
                    <EditOutlined />
                    <span>{`${gLang('superPanel.title.bindAccounts')} (${openid})`}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={screens.md ? '60%' : '95%'}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    {/* 绑定账号统计 */}
                    <Descriptions
                        column={screens.md ? 4 : screens.sm ? 2 : 1}
                        size="small"
                        bordered
                        style={{ width: '100%' }}
                    >
                        <Descriptions.Item
                            label={<Text strong>{gLang('superPanel.bindAccountCount')}</Text>}
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
                        >
                            <Badge status={'success'} text={<Text>{bindingStats.normal}</Text>} />
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={<Text strong>{gLang('superPanel.status.frozen')}</Text>}
                        >
                            <Badge status={'error'} text={<Text>{bindingStats.frozen}</Text>} />
                        </Descriptions.Item>
                        <Descriptions.Item
                            label={<Text strong>{gLang('superPanel.status.unbound')}</Text>}
                        >
                            <Badge status={'default'} text={<Text>{bindingStats.unbound}</Text>} />
                        </Descriptions.Item>
                    </Descriptions>

                    {/* 批量操作按钮 */}
                    <Row justify="space-between" align="middle" gutter={[16, 16]}>
                        <Col xs={24} md={12}>
                            <Title level={5} style={{ margin: 0 }}>
                                {gLang('superPanel.batchOperation')}
                            </Title>
                        </Col>
                        <Col xs={24} md={12}>
                            <Space
                                style={{
                                    justifyContent: 'flex-end',
                                    width: '100%',
                                    display: 'flex',
                                }}
                                size={12}
                            >
                                <Button
                                    type="primary"
                                    icon={<UnlockOutlined />}
                                    onClick={onUnfreezeAll}
                                    disabled={bindingStats.frozen === 0}
                                    style={{ width: screens.xs ? '100%' : 'auto' }}
                                >
                                    {gLang('superPanel.unfreezeAllAccounts')}
                                </Button>
                                <Button
                                    danger
                                    icon={<LockOutlined />}
                                    onClick={onFreezeAll}
                                    disabled={bindingStats.normal === 0}
                                    style={{ width: screens.xs ? '100%' : 'auto' }}
                                >
                                    {gLang('superPanel.freezeAllAccounts')}
                                </Button>
                            </Space>
                        </Col>
                    </Row>

                    {/* 绑定账号列表 */}
                    <div>
                        <Title level={5} style={{ marginBottom: 16 }}>
                            <Space>
                                <UserOutlined />
                                {gLang('superPanel.title.bindList')}
                            </Space>
                        </Title>
                        {uniqueBindList.length > 0 ? (
                            <List
                                bordered
                                dataSource={uniqueBindList}
                                renderItem={bindPlayer => (
                                    <List.Item
                                        style={{
                                            flexDirection: screens.xs ? 'column' : 'row',
                                            alignItems: screens.xs ? 'flex-start' : 'center',
                                        }}
                                        extra={
                                            <Space
                                                direction={screens.xs ? 'vertical' : 'horizontal'}
                                                size={12}
                                                style={{
                                                    width: screens.xs ? '100%' : 'auto',
                                                    marginTop: screens.xs ? 12 : 0,
                                                }}
                                            >
                                                {bindPlayer.status === UserBindStatus.Unbound ? (
                                                    <Tooltip
                                                        title={gLang('superPanel.unbindTooltip')}
                                                    >
                                                        <Select
                                                            value={bindPlayer.status}
                                                            style={{
                                                                width: screens.xs ? '100%' : 120,
                                                            }}
                                                            disabled
                                                        >
                                                            <Option value={UserBindStatus.Unbound}>
                                                                {gLang(
                                                                    'superPanel.bindStatus.' + 'X'
                                                                )}
                                                            </Option>
                                                        </Select>
                                                    </Tooltip>
                                                ) : (
                                                    <Select
                                                        value={bindPlayer.status}
                                                        onChange={value =>
                                                            onUpdateStatus(bindPlayer.ecid, value)
                                                        }
                                                        style={{ width: screens.xs ? '100%' : 120 }}
                                                    >
                                                        <Option value={UserBindStatus.Open}>
                                                            {gLang('superPanel.bindStatus.' + 'O')}
                                                        </Option>
                                                        <Option value={UserBindStatus.Frozen}>
                                                            {gLang('superPanel.bindStatus.' + 'F')}
                                                        </Option>
                                                    </Select>
                                                )}
                                            </Space>
                                        }
                                    >
                                        <List.Item.Meta
                                            avatar={
                                                <Tag
                                                    icon={getStatusIcon(bindPlayer.status)}
                                                    color={getStatusColor(bindPlayer.status)}
                                                />
                                            }
                                            title={
                                                <Text
                                                    style={{
                                                        color: '#1890ff',
                                                        cursor: 'pointer',
                                                        textDecoration: 'underline',
                                                    }}
                                                    onClick={() => handleEcidClick(bindPlayer.ecid)}
                                                >
                                                    {bindPlayer.ecid}
                                                </Text>
                                            }
                                            style={{ width: '100%' }}
                                        />
                                    </List.Item>
                                )}
                            />
                        ) : (
                            <Empty
                                description={gLang('superPanel.noBindAccounts')}
                                image={Empty.PRESENTED_IMAGE_SIMPLE}
                            />
                        )}
                    </div>
                </Space>
            </Spin>

            {/* SuperPanelPlayerComponent模态框 */}
            <Modal
                title={`${gLang('superPanel.title.playerPanel')} - ${selectedEcid}`}
                open={superPanelVisible}
                onCancel={handleSuperPanelClose}
                footer={null}
                width="95%"
                style={{ top: 20 }}
                destroyOnHidden
            >
                <div style={{ height: '80vh', overflow: 'auto' }}>
                    <SuperPanelPlayerComponent ecid={selectedEcid} tid={null} defaultTab="basic" />
                </div>
            </Modal>
        </Modal>
    );
};

export default AccountManagementModal;
