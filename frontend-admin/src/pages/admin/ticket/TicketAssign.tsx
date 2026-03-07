// 工单分配

import { Col, message, Result, Row } from 'antd';
import { fetchData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { gLang } from '@common/language';
import { LoadingOutlined, SmileOutlined } from '@ant-design/icons';

const TicketAssign = () => {
    const { type } = useParams();
    const [, setSpinning] = React.useState(false);
    const [tid, setTid] = useState<number>();
    const [status, setStatus] = useState<number>();
    const [messageApi, messageContextHolder] = message.useMessage();

    const navigate = useNavigate();

    useEffect(() => {
        const initialFunc = async () => {
            setSpinning(true);
            if (
                [
                    'my',
                    'upgrade',
                    'upgradeMedia',
                    'unassigned',
                    'myMedia',
                    'updateMedia',
                    'monthlyMedia',
                    'auditMedia',
                    'mediaEvent',
                ].includes(type ?? 'unknown')
            ) {
                await fetchData({
                    url: '/ticket/assign',
                    method: 'GET',
                    data: { type: type },
                    setData: resp => {
                        setTid(resp.tid);
                        setStatus(resp.status);
                    },
                    setSpin: setSpinning,
                });
            } else {
                setTid(parseInt(type ?? '0'));
                setStatus(undefined);
            }
        };
        initialFunc().then();
    }, [type]);

    useEffect(() => {
        const assignTicket = async (tid?: number, status?: number) => {
            if (status === 0) {
                messageApi.success(gLang('ticketOperate.allDone'));
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (type?.endsWith('Media') || type == 'mediaEvent') {
                    navigate('/media', { replace: true });
                } else {
                    navigate('/panel', { replace: true });
                }
            } else if (status === -1) {
                messageApi.success(gLang('ticketOperate.tooManyTickets'));
                await new Promise(resolve => setTimeout(resolve, 1000));
                if (tid) {
                    if (type?.endsWith('Media') || type === 'mediaEvent') {
                        navigate(`/media/ticket/operate/${type}/${tid}`, { replace: true });
                    } else {
                        navigate(`/ticket/operate/${type}/${tid}`, { replace: true });
                    }
                }
            } else if (tid) {
                if (type?.endsWith('Media') || type == 'mediaEvent') {
                    navigate(`/media/ticket/operate/${type}/${tid}`, { replace: true });
                } else {
                    navigate(`/ticket/operate/${type}/${tid}`, { replace: true });
                }
            }
        };
        assignTicket(tid, status).then();
    }, [tid, status, navigate]);

    return (
        <Row
            justify="center"
            align="middle"
            style={{ display: 'flex', flex: 1, height: '100%', paddingBottom: 64 }}
        >
            {messageContextHolder}
            <Col>
                {status === 0 ? (
                    <Result
                        icon={<SmileOutlined />}
                        title={gLang('ticketOperate.allDone')}
                        style={{ width: '100%' }}
                    />
                ) : status === -1 ? (
                    <Result
                        icon={<SmileOutlined />}
                        title={gLang('ticketOperate.tooManyTickets')}
                        style={{ width: '100%' }}
                    />
                ) : (
                    <Result
                        icon={<LoadingOutlined />}
                        title={gLang('ticketOperate.assigning')}
                        style={{ width: '100%' }}
                    />
                )}
            </Col>
        </Row>
    );
};

export default TicketAssign;
