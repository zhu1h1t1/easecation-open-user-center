// 委托列表
// TODO refactor

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
    Alert,
    Button,
    Checkbox,
    Empty,
    List,
    message,
    Modal,
    Skeleton,
    Space,
    Tag,
    Typography,
} from 'antd';
import {
    CheckCircleOutlined,
    ClockCircleOutlined,
    CloseCircleOutlined,
    FileTextOutlined,
    UserOutlined,
} from '@ant-design/icons';
import { gLang } from '@common/language';
import { fetchData } from '@common/axiosConfig';
import { TicketEntrust, TicketEntrustStatus } from '@ecuc/shared/types/ticket.types';
import { useLocation, useNavigate } from 'react-router-dom';
import useDarkMode from '@common/hooks/useDarkMode';
import useIsPC from '@common/hooks/useIsPC';
import TidJumpComponent from '../../../../components/TidJumpComponent';
import { TimeConverter } from '@common/components/TimeConverter';

const { Text, Title } = Typography;

const EntrustList: React.FC = () => {
    useNavigate();
    useLocation();
    const [entrusts, setEntrusts] = useState<TicketEntrust[]>([]);
    const [loading, setLoading] = useState(true);
    const [error] = useState('');
    const isDarkMode = useDarkMode();
    const isPC = useIsPC();
    // 添加ref用于滚动
    const entrustListRef = useRef<HTMLDivElement>(null);
    // 选中的委托ID列表
    const [selectedEntrusts, setSelectedEntrusts] = useState<number[]>([]);
    // 是否全选
    const [selectAll, setSelectAll] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();

    // 暗黑模式样式配置
    const styles = {
        container: {
            marginBottom: 24,
        },
        title: {
            marginBottom: 16,
        },
        listHeader: {
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            marginBottom: 16,
            flexWrap: 'wrap' as const,
            gap: 12,
        },
        batchActions: {
            marginBottom: 16,
        },
        listItem: {
            padding: '16px',
            borderRadius: '8px',
            border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
            marginBottom: '16px',
            transition: 'all 0.3s ease',
            background: isDarkMode ? '#1f1f1f' : '#fff',
            boxShadow: '0 1px 2px rgba(0, 0, 0, 0.03)',
        },
        hoverEffect: {
            boxShadow: `0 4px 12px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'}`,
        },
    };

    // 计算列表项背景色的函数
    const getBackgroundColor = (status: TicketEntrustStatus) => {
        if (status === TicketEntrustStatus.Pending) {
            return isDarkMode ? '#202020' : '#fafafa';
        }
        return isDarkMode ? '#1f1f1f' : '#fff';
    };

    // 滚动到委托列表
    const scrollToEntrustList = () => {
        if (entrustListRef.current) {
            entrustListRef.current.scrollIntoView({
                behavior: 'smooth',
                block: 'start',
            });
        }
    };

    // 新增：受控 Modal 状态 + 今日不再提醒功能
    const [newEntrustModalOpen, setNewEntrustModalOpen] = useState(false);
    const [statusConfirmModal, setStatusConfirmModal] = useState<{
        open: boolean;
        id?: number;
        status?: TicketEntrustStatus;
    }>({ open: false });
    // 批量操作确认模态框
    const [batchConfirmModal, setBatchConfirmModal] = useState<{
        open: boolean;
        status?: TicketEntrustStatus;
        type: 'selected';
    }>({ open: false, type: 'selected' });

    // 今日不再提醒本地存储 key（存储为 YYYY-MM-DD）
    const DO_NOT_REMIND_KEY = 'entrust_do_not_remind_date';
    const getTodayDateString = () => new Date().toISOString().slice(0, 10);

    const handleDoNotRemindToday = () => {
        try {
            const today = getTodayDateString();
            localStorage.setItem(DO_NOT_REMIND_KEY, today);
            messageApi.success(gLang('entrust.doNotRemindTodaySuccess'));
            setNewEntrustModalOpen(false);
        } catch {
            messageApi.error(gLang('admin.entrustSetFailed'));
        }
    };

    // 获取委托数据
    const loadEntrusts = useCallback(async () => {
        setLoading(true);
        try {
            await fetchData({
                url: '/entrust/my',
                method: 'GET',
                data: { type: 'target' },
                setData: value => {
                    const list = Array.isArray(value.data) ? value.data : [];
                    setEntrusts(list);
                    if (list.length > 0) {
                        // 用受控 Modal 替换 Modal.confirm，并支持“今日不再提醒”
                        const dismissed = localStorage.getItem(DO_NOT_REMIND_KEY);
                        if (dismissed !== getTodayDateString()) {
                            setNewEntrustModalOpen(true);
                        }
                    }
                },
            });
        } catch {
            messageApi.error(gLang('admin.entrustFetchError'));
        } finally {
            setLoading(false);
        }
    }, [messageApi]);

    useEffect(() => {
        void loadEntrusts();
    }, [loadEntrusts]);

    // 处理状态更新，添加确认对话框
    const showStatusConfirm = (id: number, status: TicketEntrustStatus) => {
        setStatusConfirmModal({ open: true, id, status });
    };

    // 处理批量状态更新确认
    const showBatchStatusConfirm = (status: TicketEntrustStatus) => {
        setBatchConfirmModal({ open: true, status, type: 'selected' });
    };

    const handleStatusChange = async (id: number, status: TicketEntrustStatus) => {
        try {
            setLoading(true);
            await fetchData({
                url: `/entrust/${id}/status`,
                method: 'POST',
                data: { status },
                setData: () => {
                    void (async () => {
                        await fetchData({
                            url: '/entrust/my',
                            method: 'GET',
                            data: { type: 'target' },
                            setData: value => {
                                setEntrusts(Array.isArray(value.data) ? value.data : []);
                                // 清空选中状态
                                setSelectedEntrusts([]);
                                setSelectAll(false);
                            },
                        });
                        messageApi.success(
                            status === TicketEntrustStatus.Approved
                                ? gLang('entrust.approveSuccess')
                                : gLang('entrust.rejectSuccess')
                        );
                    })();
                },
            });
        } catch (err) {
            const error = err as any;
            messageApi.error(
                error.response?.data?.EPF_description ?? gLang('admin.entrustRequestFailed')
            );
        } finally {
            setLoading(false);
        }
    };

    // 处理批量状态更新
    const handleBatchStatusChange = async (status: TicketEntrustStatus) => {
        try {
            setLoading(true);
            const ids = selectedEntrusts;

            await fetchData({
                url: '/entrust/batch-status',
                method: 'POST',
                data: { ids, status },
                setData: () => {
                    void (async () => {
                        await fetchData({
                            url: '/entrust/my',
                            method: 'GET',
                            data: { type: 'target' },
                            setData: value => {
                                setEntrusts(Array.isArray(value.data) ? value.data : []);
                                // 清空选中状态
                                setSelectedEntrusts([]);
                                setSelectAll(false);
                            },
                        });
                        messageApi.success(
                            status === TicketEntrustStatus.Approved
                                ? gLang('entrust.batchApproveSuccess')
                                : gLang('entrust.batchRejectSuccess')
                        );
                    })();
                },
            });
        } catch (err) {
            const error = err as any;
            messageApi.error(
                error.response?.data?.EPF_description ?? gLang('admin.entrustBatchFailed')
            );
        } finally {
            setLoading(false);
        }
    };

    // 选择委托
    const selectEntrust = (id: number) => {
        setSelectedEntrusts(prev => [...prev, id]);
    };

    // 取消选择委托
    const deselectEntrust = (id: number) => {
        setSelectedEntrusts(prev => prev.filter(item => item !== id));
    };

    // 全选
    const selectAllPending = () => {
        setSelectAll(true);
        const allPendingIds = entrusts
            .filter(item => item.status === TicketEntrustStatus.Pending)
            .map(item => item.id);
        setSelectedEntrusts(allPendingIds);
    };

    // 取消全选
    const deselectAll = () => {
        setSelectAll(false);
        setSelectedEntrusts([]);
    };

    // 检查是否有可选的委托
    const hasPendingEntrusts = entrusts.some(item => item.status === TicketEntrustStatus.Pending);

    // 状态标签渲染
    const statusTag = (status: TicketEntrustStatus) => {
        const colorMap: Record<TicketEntrustStatus, 'processing' | 'success' | 'error'> = {
            [TicketEntrustStatus.Pending]: 'processing',
            [TicketEntrustStatus.Approved]: 'success',
            [TicketEntrustStatus.Rejected]: 'error',
        };
        const iconMap: Record<TicketEntrustStatus, React.ReactNode> = {
            [TicketEntrustStatus.Pending]: <ClockCircleOutlined />,
            [TicketEntrustStatus.Approved]: <CheckCircleOutlined />,
            [TicketEntrustStatus.Rejected]: <CloseCircleOutlined />,
        };
        const statusInfo = {
            color: colorMap[status],
            icon: iconMap[status],
            text: gLang('entrust.status.' + status),
        };
        return (
            <Tag color={statusInfo.color} icon={statusInfo.icon}>
                {statusInfo.text}
            </Tag>
        );
    };

    if (error) {
        return (
            <div style={styles.container}>
                <Title level={4} style={styles.title}>
                    {gLang('entrust.title')}
                </Title>
                <Alert type="error" message={error} showIcon />
            </div>
        );
    }

    const getBatchConfirmText = () => {
        const { status } = batchConfirmModal;
        if (status === TicketEntrustStatus.Approved) {
            return gLang('entrust.approveSelectedConfirmText', { count: selectedEntrusts.length });
        } else {
            return gLang('entrust.rejectSelectedConfirmText', { count: selectedEntrusts.length });
        }
    };

    const renderListContent = () => {
        if (loading && entrusts.length === 0) {
            return (
                <div style={{ padding: '0 0 20px' }}>
                    {[...Array(3)].map((_, index) => (
                        <Skeleton
                            key={index}
                            active
                            avatar
                            paragraph={{ rows: 3 }}
                            style={{
                                marginBottom: 16,
                                padding: 16,
                                background: isDarkMode ? '#1f1f1f' : '#fff',
                                borderRadius: '8px',
                                border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                            }}
                        />
                    ))}
                </div>
            );
        }

        if (entrusts.length === 0) {
            return (
                <Empty
                    image={Empty.PRESENTED_IMAGE_SIMPLE}
                    description={<Text type="secondary">{gLang('entrust.empty')}</Text>}
                    style={{
                        margin: '20px 0',
                        padding: '40px 0',
                        background: isDarkMode ? '#1f1f1f' : '#fff',
                        borderRadius: '8px',
                        border: `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                    }}
                />
            );
        }

        return (
            <List
                loading={loading}
                dataSource={entrusts}
                itemLayout="vertical"
                renderItem={item => (
                    <List.Item
                        key={item.id}
                        style={{
                            ...styles.listItem,
                            backgroundColor: getBackgroundColor(item.status),
                        }}
                        className="entrust-list-item hover-shadow"
                        actions={[
                            <Space key="actions">
                                <TidJumpComponent type="link" size="small" initialTid={item.tid} />
                                {item.status === TicketEntrustStatus.Pending && (
                                    <>
                                        <Checkbox
                                            checked={selectedEntrusts.includes(item.id)}
                                            onChange={e =>
                                                e.target.checked
                                                    ? selectEntrust(item.id)
                                                    : deselectEntrust(item.id)
                                            }
                                        />
                                        <Button
                                            type="primary"
                                            ghost
                                            icon={<CheckCircleOutlined />}
                                            onClick={() =>
                                                showStatusConfirm(
                                                    item.id,
                                                    TicketEntrustStatus.Approved
                                                )
                                            }
                                        >
                                            {gLang('entrust.approve')}
                                        </Button>
                                        <Button
                                            danger
                                            icon={<CloseCircleOutlined />}
                                            onClick={() =>
                                                showStatusConfirm(
                                                    item.id,
                                                    TicketEntrustStatus.Rejected
                                                )
                                            }
                                        >
                                            {gLang('entrust.reject')}
                                        </Button>
                                    </>
                                )}
                            </Space>,
                        ]}
                    >
                        <div className="entrust-item-header" style={{ marginBottom: 12 }}>
                            <Space size="large" align="center" style={{ flexWrap: 'wrap' }}>
                                <Space>
                                    <FileTextOutlined style={{ color: '#1677ff' }} />
                                    <Text strong>{`${gLang('entrust.ticket')} #${item.tid}`}</Text>
                                </Space>
                                {statusTag(item.status)}
                                <Text type="secondary">
                                    <ClockCircleOutlined style={{ marginRight: 4 }} />
                                    <TimeConverter utcTime={item.create_time ?? ''} />
                                </Text>
                            </Space>
                        </div>

                        <Space direction="vertical" size="small" style={{ width: '100%' }}>
                            <div style={{ display: 'flex', gap: isPC ? 32 : 12, flexWrap: 'wrap' }}>
                                <div>
                                    <Text type="secondary">{gLang('entrust.originator')}:</Text>{' '}
                                    <Text strong style={{ marginLeft: 8 }}>
                                        <UserOutlined style={{ marginRight: 4 }} />
                                        {item.advisor_uid}
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary">{gLang('entrust.targetUser')}:</Text>{' '}
                                    <Text strong style={{ marginLeft: 8 }}>
                                        <UserOutlined style={{ marginRight: 4 }} />
                                        {item.target}
                                    </Text>
                                </div>
                                <div>
                                    <Text type="secondary">{gLang('entrust.reason')}:</Text>{' '}
                                    <Text strong style={{ marginLeft: 8 }}>
                                        {item.introduce ?? (
                                            <Text type="secondary" italic>
                                                {gLang('entrust.noReason')}
                                            </Text>
                                        )}
                                    </Text>
                                </div>
                            </div>
                        </Space>
                    </List.Item>
                )}
            />
        );
    };

    return (
        <div style={styles.container} ref={entrustListRef}>
            {messageContextHolder}
            {/* 新委托提醒 Modal */}
            <Modal
                open={newEntrustModalOpen}
                title={gLang('entrust.newEntrustTitle')}
                onCancel={() => setNewEntrustModalOpen(false)}
                onOk={() => {
                    setNewEntrustModalOpen(false);
                    scrollToEntrustList();
                }}
                okText={gLang('entrust.viewNow')}
                cancelText={gLang('entrust.viewLater')}
                centered
            >
                <div>
                    {gLang('entrust.newEntrustContent')}
                    <div style={{ marginTop: 12, textAlign: 'right' }}>
                        <Button type="link" onClick={handleDoNotRemindToday}>
                            {gLang('entrust.doNotRemindToday')}
                        </Button>
                    </div>
                </div>
            </Modal>
            {/* 状态确认 Modal */}
            <Modal
                open={statusConfirmModal.open}
                title={
                    statusConfirmModal.status === TicketEntrustStatus.Approved
                        ? gLang('entrust.approveConfirm')
                        : gLang('entrust.rejectConfirm')
                }
                onCancel={() => setStatusConfirmModal({ open: false })}
                onOk={async () => {
                    if (statusConfirmModal.id && statusConfirmModal.status) {
                        await handleStatusChange(statusConfirmModal.id, statusConfirmModal.status);
                    }
                    setStatusConfirmModal({ open: false });
                }}
                okText={
                    statusConfirmModal.status === TicketEntrustStatus.Approved
                        ? gLang('entrust.approve')
                        : gLang('entrust.reject')
                }
                cancelText={gLang('cancel')}
                okButtonProps={{
                    danger: statusConfirmModal.status === TicketEntrustStatus.Rejected,
                    type:
                        statusConfirmModal.status === TicketEntrustStatus.Approved
                            ? 'primary'
                            : 'default',
                }}
                centered
            >
                {statusConfirmModal.status === TicketEntrustStatus.Approved
                    ? gLang('entrust.approveConfirmText')
                    : gLang('entrust.rejectConfirmText')}
            </Modal>

            {/* 批量操作确认 Modal */}
            <Modal
                open={batchConfirmModal.open}
                title={
                    batchConfirmModal.status === TicketEntrustStatus.Approved
                        ? gLang('entrust.batchApproveConfirm')
                        : gLang('entrust.batchRejectConfirm')
                }
                onCancel={() => setBatchConfirmModal({ open: false, type: 'selected' })}
                onOk={async () => {
                    if (batchConfirmModal.status) {
                        await handleBatchStatusChange(batchConfirmModal.status);
                    }
                    setBatchConfirmModal({ open: false, type: 'selected' });
                }}
                okText={
                    batchConfirmModal.status === TicketEntrustStatus.Approved
                        ? gLang('entrust.approve')
                        : gLang('entrust.reject')
                }
                cancelText={gLang('cancel')}
                okButtonProps={{
                    danger: batchConfirmModal.status === TicketEntrustStatus.Rejected,
                    type:
                        batchConfirmModal.status === TicketEntrustStatus.Approved
                            ? 'primary'
                            : 'default',
                }}
                centered
            >
                {getBatchConfirmText()}
            </Modal>

            <Title level={4} style={styles.title}>
                {gLang('entrust.title')}
            </Title>

            {/* 批量操作按钮 */}
            {hasPendingEntrusts && !loading && (
                <div style={styles.listHeader}>
                    <div>
                        <Checkbox
                            checked={selectAll}
                            onChange={e => (e.target.checked ? selectAllPending() : deselectAll())}
                        >
                            {gLang('entrust.selectAll')}
                        </Checkbox>
                    </div>
                    <Space wrap size={[8, 8]}>
                        <Button
                            type="primary"
                            ghost
                            icon={<CheckCircleOutlined />}
                            disabled={selectedEntrusts.length === 0}
                            onClick={() => showBatchStatusConfirm(TicketEntrustStatus.Approved)}
                        >
                            {gLang('entrust.batchApprove')}
                        </Button>
                        <Button
                            danger
                            icon={<CloseCircleOutlined />}
                            disabled={selectedEntrusts.length === 0}
                            onClick={() => showBatchStatusConfirm(TicketEntrustStatus.Rejected)}
                        >
                            {gLang('entrust.batchReject')}
                        </Button>
                    </Space>
                </div>
            )}

            {renderListContent()}

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                .entrust-list-item:hover {
                    box-shadow: 0 4px 12px ${isDarkMode ? 'rgba(0, 0, 0, 0.3)' : 'rgba(0, 0, 0, 0.05)'};
                }
            `,
                }}
            />
        </div>
    );
};

export default EntrustList;
