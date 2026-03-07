import { Button, Flex, Result, Spin } from 'antd';
import { useLocation, useParams } from 'react-router-dom';
import { fetchData } from '@common/axiosConfig';
import { useEffect, useState } from 'react';
import TicketDetailComponent from '../../components/TicketDetailComponent';
import { Ticket } from '@ecuc/shared/types/ticket.types';
import { gLang } from '@common/language';
import { ExportOutlined } from '@ant-design/icons';
import PageMeta from '../../components/PageMeta/PageMeta';
import { generateSnapshotTicketMeta } from '@common/utils/ticketMeta.utils';
import { switchDomain } from '@common/utils/crossDomainSwitch';

const TicketSnapshot = () => {
    const { tid } = useParams();
    const [isSpinning, setIsSpinning] = useState(false);
    const [ticket, setTicket] = useState<Ticket | undefined>();
    const [doRefresh, setDoRefresh] = useState<boolean>(false);
    const [show403, setShow403] = useState(false);

    const location = useLocation();
    const searchParams = new URLSearchParams(location.search);
    const token = searchParams.get('token');

    useEffect(() => {
        setIsSpinning(true);
        fetchData({
            url: '/ticket/detail',
            method: 'GET',
            data: { tid: tid, token: token },
            setData: setTicket,
            setSpin: setIsSpinning,
        })
            .then(() => setDoRefresh(false))
            .catch(() => {
                setShow403(true);
            });
    }, [doRefresh]);

    // 跨子域切换到管理端
    const handleSwitchToAdminDomain = async () => {
        if (!tid) return;

        // 目标路径：管理端的工单操作页面
        const targetPath = `/ticket/operate/backToMy/${tid}`;
        await switchDomain({ type: 'admin', path: targetPath });
    };

    return (
        <>
            {/* 动态页面Meta信息 */}
            {ticket && (
                <PageMeta {...generateSnapshotTicketMeta(ticket)} url={window.location.href} />
            )}

            <Spin spinning={isSpinning} fullscreen />
            <Flex align={'center'} justify={'center'} flex={1}>
                {show403 ? (
                    <Result status="403" title="403" subTitle={gLang('noPermission')} />
                ) : (
                    <TicketDetailComponent ticket={ticket} isAdmin={false} />
                )}
            </Flex>
            <Button
                type="primary"
                icon={<ExportOutlined />}
                size="large"
                onClick={handleSwitchToAdminDomain}
                style={{
                    position: 'fixed',
                    bottom: '20px',
                    right: '20px',
                }}
            >
                {gLang('ticketAnonymity.openInWorkshop')}
            </Button>
        </>
    );
};

export default TicketSnapshot;
