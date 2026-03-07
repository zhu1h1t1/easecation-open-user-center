// 媒体超级面板

import React from 'react';
import { message, Modal, Space, Spin } from 'antd';
import { fetchData } from '@common/axiosConfig';
import { useCallback, useEffect, useState } from 'react';
import { gLang } from '@common/language';
import TicketDetailComponent from '../../../../../components/TicketDetailComponent';
import { UserBindMediaWithFullData } from '@ecuc/shared/types/media.types';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import EditMediaComponent from './EditMediaComponent';
import TicketListPanel from './TicketListPanel';
import MediaEpointLogsModal from './MediaEpointLogsModal';
import { useAuth } from '@common/contexts/AuthContext';

interface Props {
    openid: string;
}

const MediaPanelComponent = ({ openid }: Props) => {
    const [, contextHolder] = message.useMessage();
    const [spinning, setSpinning] = useState(false);
    const [media, setMedia] = useState<UserBindMediaWithFullData | null>(null);
    const [previewTid, setPreviewTid] = useState<number | null>(null);
    const [ticket, setTicket] = useState<Ticket | undefined>(undefined);
    const [logsVisible, setLogsVisible] = useState(false);
    const { user } = useAuth();
    const canViewLogs = Boolean(user?.permission?.includes('ticket.media'));

    // 拉取 media 详情
    const fetchMedia = useCallback(() => {
        setSpinning(true);
        fetchData({
            url: '/media/detail',
            method: 'GET',
            data: { mid: '', openid },
            setData: setMedia,
            setSpin: setSpinning,
        });
    }, [openid]);

    useEffect(fetchMedia, [fetchMedia]);

    // 拉取 ticket 详情
    useEffect(() => {
        if (previewTid) {
            setSpinning(true);
            // 清除之前的数据，避免显示错误的工单信息
            setTicket(undefined);

            fetchData({
                url: '/ticket/detail',
                method: 'GET',
                data: { tid: previewTid },
                setData: setTicket,
                setSpin: setSpinning,
            }).catch(() => {
                // 如果加载失败，确保清除数据并停止加载状态
                setTicket(undefined);
                setSpinning(false);
            });
        }
    }, [previewTid]);

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            <Spin spinning={spinning} fullscreen />
            {contextHolder}
            {/* 编辑面板 */}
            {media && (
                <div style={{ marginBottom: 20 }}>
                    <EditMediaComponent
                        media={media}
                        onUpdate={fetchMedia}
                        onClose={() => setMedia(null)}
                        onViewLogs={() => setLogsVisible(true)}
                        canViewLogs={canViewLogs && Boolean(media?.id)}
                    />
                </div>
            )}

            {/* 使用新的 TicketListPanel 组件 */}
            <TicketListPanel
                title={gLang('superPanel.title.ticketNormal')}
                tickets={media?.tickets?.regular || []}
                loading={spinning}
                defaultCollapsed={false}
                onTicketClick={setPreviewTid}
            />

            {/* Ticket Detail Modal */}
            <Modal
                title={gLang('superPanel.currentViewingTid') + previewTid}
                open={previewTid !== null}
                footer={null}
                onCancel={() => setPreviewTid(null)}
            >
                <TicketDetailComponent ticket={ticket} isAdmin />
            </Modal>

            <MediaEpointLogsModal
                open={logsVisible}
                onClose={() => setLogsVisible(false)}
                mediaId={media?.id}
            />
        </Space>
    );
};

export default MediaPanelComponent;
