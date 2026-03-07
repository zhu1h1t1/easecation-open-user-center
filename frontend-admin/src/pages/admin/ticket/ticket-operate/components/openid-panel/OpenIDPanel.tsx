// OpenID面板组件

import React, { useCallback, useEffect, useState } from 'react';
import { Grid, message, Spin } from 'antd';
import {
    CheckCircleOutlined,
    DisconnectOutlined,
    QuestionCircleOutlined,
    StopOutlined,
} from '@ant-design/icons';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { BindPlayer } from '@ecuc/shared/types/player.types';
import { UserBindStatus } from '@ecuc/shared/types';
import UserBindingSummary from './UserBindingSummary';
import OpenIDTicketModal from './OpenIDTicketModal';
import TicketDetailModal from './TicketDetailModal';
import AccountManagementModal from './AccountManagementModal';
import BindingHistoryModal from './BindingHistoryModal';
import PunishmentManagementModal from './PunishmentManagementModal';

const { useBreakpoint } = Grid;

interface OpenidPanelComponentProps {
    openid: string;
    defaultExpanded?: boolean;
}

const OpenidPanelComponent: React.FC<OpenidPanelComponentProps> = ({
    openid,
    defaultExpanded = false,
}) => {
    const screens = useBreakpoint();

    // 状态变量
    const [spinAll, setSpinAll] = useState<boolean>(true);
    const [ticketList, setTicketList] = useState<Ticket[]>([]);
    const [bindList, setBindList] = useState<BindPlayer[]>([]);
    const [previewTid, setPreviewTid] = useState<number | null>(null);
    const [ticketDetail, setTicketDetail] = useState<Ticket | null>(null);
    const [messageApi, contextHolder] = message.useMessage();
    // 模态框状态
    const [ticketsModalVisible, setTicketsModalVisible] = useState<boolean>(false);
    const [bindingModalVisible, setBindingModalVisible] = useState<boolean>(false);
    const [bindingHistoryModalVisible, setBindingHistoryModalVisible] = useState<boolean>(false);
    const [punishmentModalVisible, setPunishmentModalVisible] = useState<boolean>(false);
    const [modalLoading, setModalLoading] = useState<boolean>(false);
    const [detailLoading, setDetailLoading] = useState<boolean>(false);

    const fetchUserBindings = useCallback(() => {
        setSpinAll(true);

        // 请求绑定的游戏账号列表
        fetchData({
            url: '/user/userBindList',
            method: 'GET',
            data: { openid },
            setData: value => {
                setBindList(value.result ?? []);
                setSpinAll(false);
            },
        });
    }, [openid]);

    useEffect(() => {
        fetchUserBindings();
    }, [fetchUserBindings]);

    // ---------- 打开工单列表模态框 ----------
    const showTicketsModal = () => {
        setTicketsModalVisible(true);
        setModalLoading(true);

        fetchData({
            url: '/ticket/listByOpenId',
            method: 'POST',
            data: { type: 'public', openid },
            setData: data => {
                setTicketList(data);
                setModalLoading(false);
            },
            setSpin: setModalLoading,
        });
    };

    // ---------- 打开绑定管理模态框 ----------
    const showBindingModal = () => {
        setBindingModalVisible(true);
    };

    // ---------- 打开绑定历史模态框 ----------
    const showBindingHistoryModal = () => {
        setBindingHistoryModalVisible(true);
    };

    // ---------- 打开处罚管理模态框 ----------
    const showPunishmentModal = () => {
        setPunishmentModalVisible(true);
    };

    const closeTicketsModal = () => {
        setTicketsModalVisible(false);
        setPreviewTid(null);
    };

    const closeBindingModal = () => {
        setBindingModalVisible(false);
    };

    const closeBindingHistoryModal = () => {
        setBindingHistoryModalVisible(false);
    };

    const closePunishmentModal = () => {
        setPunishmentModalVisible(false);
    };

    // ---------- 更新单个绑定状态 ----------
    const handleUpdateStatus = async (ecid: string, newStatus: string) => {
        try {
            setModalLoading(true);
            await fetchData({
                url: '/user/updateBindByOpenid',
                method: 'POST',
                data: { openid, ecid, status: newStatus },
                setData: () => {},
            });
            messageApi.success(gLang('superPanel.updateSuccess'));
            fetchUserBindings();
        } catch (error) {
            messageApi.error(gLang('superPanel.updateFailed'));
            throw error;
        } finally {
            setModalLoading(false);
        }
    };

    // ---------- 冻结/解冻所有账号 ----------
    const freezeAllAccounts = async () => {
        try {
            setModalLoading(true);
            await fetchData({
                url: '/user/updateAllBindByOpenid',
                method: 'POST',
                data: { openid, status: UserBindStatus.Frozen },
                setData: () => {},
            });
            messageApi.success(gLang('superPanel.freezeAllSuccess'));
            fetchUserBindings();
        } catch (error) {
            messageApi.error(gLang('superPanel.freezeAllFailed'));
            throw error;
        } finally {
            setModalLoading(false);
        }
    };

    const unfreezeAllAccounts = async () => {
        try {
            setModalLoading(true);
            await fetchData({
                url: '/user/updateAllBindByOpenid',
                method: 'POST',
                data: { openid, status: UserBindStatus.Open },
                setData: () => {},
            });
            messageApi.success(gLang('superPanel.unfreezeAllSuccess'));
            fetchUserBindings();
        } catch (error) {
            messageApi.error(gLang('superPanel.unfreezeAllFailed'));
            throw error;
        } finally {
            setModalLoading(false);
        }
    };

    // ---------- 拉取选中工单详情 ----------
    const fetchTicketDetail = useCallback(() => {
        if (previewTid) {
            setDetailLoading(true);
            // 清除之前的数据，避免显示错误的工单信息
            setTicketDetail(null);

            fetchData({
                url: '/ticket/detail',
                method: 'GET',
                data: { tid: previewTid },
                setData: data => {
                    setTicketDetail(data);
                    setDetailLoading(false);
                },
                setSpin: () => {},
            }).catch(() => {
                // 如果加载失败，确保清除数据并停止加载状态
                setTicketDetail(null);
                setDetailLoading(false);
            });
        } else {
            setTicketDetail(null);
        }
    }, [previewTid]);

    useEffect(() => {
        fetchTicketDetail();
    }, [fetchTicketDetail]);

    const handleTicketClick = (tid: number) => {
        setPreviewTid(prev => (prev === tid ? null : tid));
    };

    // ---------- 计算绑定状态统计 ----------
    const bindingStats = React.useMemo(() => {
        const total = bindList.length;
        const normal = bindList.filter(item => item.status === UserBindStatus.Open).length;
        const frozen = bindList.filter(item => item.status === UserBindStatus.Frozen).length;
        const unbound = bindList.filter(item => item.status === UserBindStatus.Unbound).length;
        return { total, normal, frozen, unbound };
    }, [bindList]);

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

    // ---------- 根据状态返回标签颜色 ----------
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

    // ---------- 根据状态返回图标 ----------
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

    return (
        <div>
            {contextHolder}
            {/* 全局加载遮罩 */}
            <Spin spinning={spinAll}>
                {/* 概览卡片 */}
                <UserBindingSummary
                    bindList={bindList}
                    onViewDetailsClick={e => {
                        e.stopPropagation();
                        showTicketsModal();
                    }}
                    defaultExpanded={defaultExpanded}
                />

                {/* 工单列表模态框 */}
                <OpenIDTicketModal
                    openid={openid}
                    visible={ticketsModalVisible}
                    onClose={closeTicketsModal}
                    onBindingManage={showBindingModal}
                    onBindingHistory={showBindingHistoryModal}
                    onPunishmentManage={showPunishmentModal}
                    onTicketClick={handleTicketClick}
                    ticketList={ticketList}
                    loading={modalLoading}
                />

                {/* 工单详情模态框 */}
                <TicketDetailModal
                    tid={previewTid}
                    visible={previewTid !== null}
                    onClose={() => setPreviewTid(null)}
                    ticket={ticketDetail}
                    loading={detailLoading}
                    screens={screens}
                />

                {/* 绑定账号管理模态框 */}
                <AccountManagementModal
                    openid={openid}
                    visible={bindingModalVisible}
                    onClose={closeBindingModal}
                    bindList={bindList}
                    uniqueBindList={uniqueBindList}
                    bindingStats={bindingStats}
                    loading={modalLoading}
                    onUpdateStatus={handleUpdateStatus}
                    onFreezeAll={freezeAllAccounts}
                    onUnfreezeAll={unfreezeAllAccounts}
                    screens={screens}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                />

                {/* 绑定历史模态框 */}
                <BindingHistoryModal
                    openid={openid}
                    visible={bindingHistoryModalVisible}
                    onClose={closeBindingHistoryModal}
                    bindList={bindList}
                    loading={modalLoading}
                    screens={screens}
                    getStatusIcon={getStatusIcon}
                    getStatusColor={getStatusColor}
                />

                {/* 处罚管理模态框 */}
                <PunishmentManagementModal
                    openid={openid}
                    visible={punishmentModalVisible}
                    onClose={closePunishmentModal}
                    screens={screens}
                />
            </Spin>
        </div>
    );
};

export default OpenidPanelComponent;
