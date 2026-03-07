// ...existing code...
import React, { useState, useEffect } from 'react';
import {
    Card,
    Space,
    Spin,
    Typography,
    Tag,
    Alert,
    Modal,
    InputNumber,
    message,
    Button,
} from 'antd';
import { gLang } from '@common/language';
import { fetchData, submitData } from '@common/axiosConfig';
import { TimeConverter, convertUTCToFormat } from '@common/components/TimeConverter';
interface GiftVipItem {
    id: string;
    vipType: string;
    user: string;
    expire: string | null;
    status: string;
}

interface GiftVipTabProps {
    vipList: GiftVipItem[] | undefined;
    spinning: boolean;
    ecid: string;
    activeTab?: string;
}
export const GiftVipTab: React.FC<GiftVipTabProps> = ({ vipList, spinning, ecid, activeTab }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [giftVipAll, setGiftVipAll] = useState<GiftVipItem[] | undefined>(undefined);
    const [spinningGiftVipAll, setSpinningGiftVipAll] = useState(false);
    useEffect(() => {
        if (activeTab === 'giftVip' && !giftVipAll && !spinningGiftVipAll && ecid) {
            setSpinningGiftVipAll(true);
            fetchData({
                url: '/ec/giftVipall',
                method: 'GET',
                data: { ecid },
                setData: rep => setGiftVipAll(rep.data),
            }).then(() => setSpinningGiftVipAll(false));
        }
    }, [activeTab, ecid, giftVipAll, spinningGiftVipAll]);
    // 编辑模态框相关
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [editValues, setEditValues] = useState<{
        v1: number;
        v2: number;
        v3: number;
        v4: number;
    }>({ v1: 0, v2: 0, v3: 0, v4: 0 });
    const [vipGiftCountState, setVipGiftCountState] = useState<{
        v1: number;
        v2: number;
        v3: number;
        v4: number;
    } | null>(null);

    const handleEditChange = (key: keyof typeof editValues, value: number) => {
        setEditValues(prev => ({ ...prev, [key]: value }));
    };

    const handleEditSave = async () => {
        await submitData({
            data: {
                ecid,
                vip_gift: editValues,
            },
            url: '/ec/giftvip',
            successMessage: 'common.success',
            method: 'POST',
            setIsFormDisabled: () => {}, // 这里无需禁用表单
            setIsModalOpen: setEditModalOpen,
            messageApi,
        });
        // 保存后刷新礼包数量
        fetchData({
            url: '/ec/giftvip',
            method: 'GET',
            data: { ecid },
            setData: response => {
                if (response && response.EPF_code === 200) {
                    setVipGiftCountState({
                        v1: response.v1 || 0,
                        v2: response.v2 || 0,
                        v3: response.v3 || 0,
                        v4: response.v4 || 0,
                    });
                } else {
                    setVipGiftCountState(null);
                }
            },
        });
        // 保存后刷新giftVipAll
        fetchData({
            url: '/ec/giftVipall',
            method: 'GET',
            data: { ecid },
            setData: rep => setGiftVipAll(rep.data),
        });
    };
    const [, setTotal] = useState(0);
    const [data, setData] = useState<GiftVipItem[]>([]);
    const [loading] = useState(false);
    const [typeFilter] = useState('');
    // 获取VIP礼包数量，tab切换到giftVip时自动请求
    useEffect(() => {
        if (activeTab === 'giftVip' && ecid) {
            fetchData({
                url: '/ec/giftvip',
                method: 'GET',
                data: { ecid },
                setData: response => {
                    if (response && response.EPF_code === 200) {
                        setVipGiftCountState({
                            v1: response.v1 || 0,
                            v2: response.v2 || 0,
                            v3: response.v3 || 0,
                            v4: response.v4 || 0,
                        });
                    } else {
                        setVipGiftCountState(null);
                    }
                },
            });
        }
    }, [activeTab, ecid]);
    useEffect(() => {
        if (vipList && !data.length && !typeFilter) {
            setData(vipList);
            setTotal(vipList.length);
        }
    }, [vipList]);

    return (
        <>
            {contextHolder}
            <Spin spinning={spinning || loading || spinningGiftVipAll}>
                <Space direction="vertical" style={{ width: '100%' }}>
                    {vipGiftCountState && (
                        <Alert
                            type="success"
                            showIcon
                            style={{ marginBottom: 12, display: 'flex', alignItems: 'center' }}
                            message={
                                <div
                                    style={{ display: 'flex', alignItems: 'center', width: '100%' }}
                                >
                                    <span style={{ flex: 1 }}>
                                        {`${gLang('superPanel.vipGift.v1')}: ${vipGiftCountState.v1}  `}
                                        {`${gLang('superPanel.vipGift.v2')}: ${vipGiftCountState.v2}  `}
                                        {`${gLang('superPanel.vipGift.v3')}: ${vipGiftCountState.v3}  `}
                                        {`${gLang('superPanel.vipGift.v4')}: ${vipGiftCountState.v4}`}
                                    </span>
                                    <Button
                                        type="primary"
                                        ghost
                                        size="small"
                                        style={{ marginLeft: 12 }}
                                        onClick={() => {
                                            if (vipGiftCountState) {
                                                setEditValues({ ...vipGiftCountState });
                                            }
                                            setEditModalOpen(true);
                                        }}
                                    >
                                        {gLang('superPanel.vipGift.editBtn')}
                                    </Button>
                                </div>
                            }
                        />
                    )}

                    {giftVipAll && (
                        <>
                            <Typography.Title level={5}>
                                {gLang('superPanel.vipGift.giftVipAll')}
                            </Typography.Title>
                            {giftVipAll.length === 0 ? (
                                <Typography.Text type="secondary">
                                    {gLang('superPanel.vipGift.noGiftVipAll')}
                                </Typography.Text>
                            ) : (
                                giftVipAll.map((item: any, idx: number) => {
                                    let sendLeftObj: Record<string, number> = {};
                                    sendLeftObj = item.vip_send_left
                                        ? JSON.parse(item.vip_send_left)
                                        : {};
                                    return (
                                        <Card
                                            key={item.create_time + '-' + idx}
                                            style={{ marginBottom: 8 }}
                                        >
                                            <div style={{ fontSize: 13, color: '#888' }}>
                                                <span>
                                                    {gLang('superPanel.vipGift.senderLabel')}{' '}
                                                    <b>{item.from_ecid}</b>{' '}
                                                </span>
                                                <span style={{ marginLeft: 12 }}>
                                                    VIP{item.from_level}{' '}
                                                    {gLang('superPanel.vipGift.expireAtLabel')}{' '}
                                                    {item.from_expiry ? (
                                                        <TimeConverter utcTime={item.from_expiry} />
                                                    ) : (
                                                        '-'
                                                    )}
                                                </span>
                                            </div>
                                            {item.to_max_expiry === '1989-12-31T16:00:01.000Z' ? (
                                                <Tag color="red">
                                                    <b>
                                                        {gLang(
                                                            'superPanel.vipGift.adminManualUpdate',
                                                            { ecid: item.to_ecid }
                                                        )}
                                                    </b>
                                                </Tag>
                                            ) : item.to_max_expiry ===
                                              '1989-12-31T16:00:00.000Z' ? (
                                                <Tag color="orange">
                                                    <b>
                                                        {gLang('superPanel.vipGift.initVipTimes')}
                                                    </b>
                                                </Tag>
                                            ) : (
                                                <div style={{ marginTop: 4 }}>
                                                    <Tag color="green">
                                                        <b>
                                                            {gLang('superPanel.vipGift.receiver', {
                                                                ecid: item.to_ecid,
                                                            })}
                                                        </b>
                                                    </Tag>
                                                    <Tag color="gold">
                                                        {gLang('superPanel.vipGift.vipLevel', {
                                                            level: item.vip_level,
                                                        })}
                                                    </Tag>
                                                    <Tag color="purple">
                                                        {gLang('superPanel.vipGift.giftTime', {
                                                            time: item.create_time
                                                                ? convertUTCToFormat(
                                                                      item.create_time
                                                                  )
                                                                : '-',
                                                        })}
                                                    </Tag>
                                                    <Tag color="blue">
                                                        {gLang('superPanel.vipGift.expiryTime', {
                                                            time: item.to_max_expiry
                                                                ? convertUTCToFormat(
                                                                      item.to_max_expiry
                                                                  )
                                                                : '-',
                                                        })}
                                                    </Tag>
                                                </div>
                                            )}
                                            <div style={{ marginTop: 4, fontSize: 13 }}>
                                                {gLang('superPanel.vipGift.leftToSend')}:{' '}
                                                {Object.entries(sendLeftObj).map(([k, v]) => (
                                                    <Tag
                                                        key={k}
                                                        color={v > 0 ? 'green' : 'default'}
                                                    >
                                                        {k}: {v}
                                                    </Tag>
                                                ))}
                                            </div>
                                        </Card>
                                    );
                                })
                            )}
                        </>
                    )}

                    <Modal
                        title={gLang('superPanel.vipGift.editTitle')}
                        open={editModalOpen}
                        onCancel={() => setEditModalOpen(false)}
                        onOk={handleEditSave}
                        okText={gLang('common.confirm')}
                        cancelText={gLang('common.cancel')}
                    >
                        <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                            <label>
                                {gLang('superPanel.vipGift.v1')}:
                                <InputNumber
                                    min={0}
                                    value={editValues.v1}
                                    onChange={(v: number | null) =>
                                        handleEditChange('v1', Number(v ?? 0))
                                    }
                                    style={{ width: 80 }}
                                />
                            </label>
                            <label>
                                {gLang('superPanel.vipGift.v2')}:
                                <InputNumber
                                    min={0}
                                    value={editValues.v2}
                                    onChange={(v: number | null) =>
                                        handleEditChange('v2', Number(v ?? 0))
                                    }
                                    style={{ width: 80 }}
                                />
                            </label>
                            <label>
                                {gLang('superPanel.vipGift.v3')}:
                                <InputNumber
                                    min={0}
                                    value={editValues.v3}
                                    onChange={(v: number | null) =>
                                        handleEditChange('v3', Number(v ?? 0))
                                    }
                                    style={{ width: 80 }}
                                />
                            </label>
                            <label>
                                {gLang('superPanel.vipGift.v4')}:
                                <InputNumber
                                    min={0}
                                    value={editValues.v4}
                                    onChange={(v: number | null) =>
                                        handleEditChange('v4', Number(v ?? 0))
                                    }
                                    style={{ width: 80 }}
                                />
                            </label>
                        </div>
                    </Modal>
                </Space>
            </Spin>
        </>
    );
};
