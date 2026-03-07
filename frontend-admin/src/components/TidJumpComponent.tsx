import { fetchData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import TicketDetailComponent from './TicketDetailComponent';
import { Button, Form, InputNumber, Modal, Spin } from 'antd';
import { gLang } from '@common/language';
import { SizeType } from 'antd/es/config-provider/SizeContext';
import { Ticket } from '@ecuc/shared/types/ticket.types';

const TidJumpComponent = ({
    type,
    isBlock = false,
    size = 'middle',
    initialTid,
}: {
    type: 'link' | 'text' | 'primary' | 'default' | 'dashed' | undefined;
    isBlock?: boolean;
    size?: SizeType;
    initialTid?: number;
}) => {
    const [previewTid, setPreviewTid] = React.useState<number | null>(null);
    const [ticket, setTicket] = useState<Ticket | undefined>();
    // 表单不禁用，保留简单 boolean 常量以免未使用变量报错
    const isFormDisabled = false;
    const [isModalOpen, setIsModalOpen] = useState(false);
    const [spinning, setSpinning] = React.useState(false);

    useEffect(() => {
        const initTicket = async () => {
            if (previewTid !== null && previewTid !== 0) {
                setSpinning(true);
                // 清除之前的数据，避免显示错误的工单信息
                setTicket(undefined);

                try {
                    await fetchData({
                        url: '/ticket/detail',
                        method: 'GET',
                        data: { tid: previewTid },
                        setData: setTicket,
                        setSpin: setSpinning,
                    });
                } catch {
                    // 如果加载失败，确保清除数据并停止加载状态
                    setTicket(undefined);
                    setSpinning(false);
                }
            }
        };
        initTicket().then();
    }, [previewTid]);

    // 监听从 TicketDetailComponent 派发的跳转事件
    useEffect(() => {
        const handler = (e: any) => {
            const tid = e?.detail?.tid;
            if (typeof tid === 'number' && tid > 0) {
                setPreviewTid(tid);
            }
        };
        // event registered without DOM typings cast to avoid TS config issues
        window.addEventListener('openTidFromDetail', handler as any);
        return () => window.removeEventListener('openTidFromDetail', handler as any);
    }, []);

    return (
        <>
            <Button
                type={type}
                onClick={() => {
                    if (initialTid) {
                        // 如果有初始tid，直接显示工单详情
                        setPreviewTid(initialTid);
                    } else {
                        // 否则打开输入表单
                        setIsModalOpen(true);
                    }
                }}
                block={isBlock}
                size={size}
            >
                {initialTid ? gLang('previewTid.preview') : gLang('previewTid.title')}
            </Button>
            <Spin spinning={spinning} fullscreen />

            <Modal
                title={gLang('previewTid.title')}
                open={isModalOpen}
                footer={false}
                onCancel={() => setIsModalOpen(false)}
                // ensure modal is mounted to body and zIndex is below ticket detail modal
                getContainer={() => document.body}
                zIndex={1100}
            >
                <Form
                    name="basic"
                    onFinish={values => {
                        setPreviewTid(values.tid);
                    }}
                    autoComplete="off"
                    disabled={isFormDisabled}
                >
                    <Form.Item
                        label={gLang('previewTid.tid')}
                        name="tid"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <InputNumber
                            min={0} // 设置最小值
                            step={1} // 设置步长为1
                            parser={(value: string | undefined): number => {
                                const parsedValue = value ? value.replace(/[^\d]/g, '') : '0';
                                return parseInt(parsedValue, 10);
                            }} // 只允许输入整数
                            formatter={(value: number | string | undefined) =>
                                value ? `${value}`.replace(/[^\d]/g, '') : ''
                            } // 格式化显示为整数
                        />
                    </Form.Item>

                    <Form.Item>
                        <Button type="primary" htmlType="submit">
                            {gLang('previewTid.submit')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
            <Modal
                title={gLang('superPanel.currentViewingTid') + previewTid}
                open={previewTid !== null}
                onCancel={() => setPreviewTid(null)}
                footer={null}
                // mount ticket detail modal on body and make sure it appears above other modals
                getContainer={() => document.body}
                zIndex={1200}
                maskClosable={true}
            >
                <TicketDetailComponent ticket={ticket} isAdmin={true} />
            </Modal>
        </>
    );
};

export default TidJumpComponent;
