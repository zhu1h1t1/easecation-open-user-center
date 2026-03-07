// 玩家绑定信息组件

import React, { useEffect, useState } from 'react';
import { Table, message, Spin, Empty, Tag, Button, Modal } from 'antd';
import { ExclamationCircleOutlined } from '@ant-design/icons';
import { fetchData, submitData } from '../../../../axiosConfig';
import { gLang } from '@common/language';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface PlayerBindingInfoProps {
    ecid: string;
}

interface BindingInfo {
    totalResults: number;
    inputType: 'international' | 'netease' | 'unknown';
    ecidToNetease: {
        results: Array<{
            name: string;
            neteaseId: string;
            originalEcid: string;
            xuid: string;
        }>;
    };
    neteaseToEcid: {
        results: Array<{
            internationalEcid: string;
            neteaseId: string;
            xuid: string;
            originalInput: string;
        }>;
    };
}

const PlayerBindingInfo: React.FC<PlayerBindingInfoProps> = ({ ecid }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [loading, setLoading] = useState(false);
    const [bindingInfo, setBindingInfo] = useState<BindingInfo | null>(null);
    const { customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const loadBindingInfo = async () => {
        if (!ecid) return;

        setLoading(true);
        try {
            await fetchData({
                url: '/ec/binding-info',
                method: 'GET',
                data: { ecid },
                setData: response => setBindingInfo(response.data),
            });
        } catch (error: any) {
            messageApi.error(error.message || gLang('playerBinding.queryBindingFailedShort'));
            setBindingInfo(null);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        loadBindingInfo();
    }, [ecid]);

    // 解绑操作
    const handleUnbind = async (record: any) => {
        const xuid = record.xuid || '';

        if (!xuid) {
            messageApi.error(gLang('playerBinding.invalidXuid'));
            return;
        }

        modal.confirm({
            title: gLang('ecDetail.confirmUnbind'),
            icon: <ExclamationCircleOutlined />,
            content: gLang('ecDetail.unbindConfirmDesc'),
            okText: gLang('ecDetail.confirm'),
            cancelText: gLang('cancel'),
            onOk: async () => {
                await submitData({
                    url: '/ec/reset-binding',
                    method: 'POST',
                    data: {
                        ecid: ecid,
                        xuid: xuid,
                    },
                    successMessage: gLang('ecDetail.unbindSuccess'),
                    setIsFormDisabled: () => {},
                    setIsModalOpen: () => {},
                });
                loadBindingInfo();
            },
        });
    };

    // 解绑全部账号
    const handleUnbindAll = async () => {
        modal.confirm({
            title: gLang('ecDetail.confirmUnbindAll'),
            icon: <ExclamationCircleOutlined />,
            content: gLang('ecDetail.unbindAllConfirmDesc'),
            okText: gLang('ecDetail.confirm'),
            cancelText: gLang('cancel'),
            onOk: async () => {
                await submitData({
                    url: '/ec/reset-binding',
                    method: 'POST',
                    data: {
                        ecid: ecid,
                        nick: ecid,
                    },
                    successMessage: gLang('ecDetail.unbindAllSuccess'),
                    setIsFormDisabled: () => {},
                    setIsModalOpen: () => {},
                });
                loadBindingInfo();
            },
        });
    };

    if (loading) {
        return (
            <div style={{ textAlign: 'center', padding: '50px 0' }}>
                <Spin size="large" />
                <div style={{ marginTop: 16 }}>{gLang('ecDetail.loadingBindingInfo')}</div>
            </div>
        );
    }

    if (!bindingInfo) {
        return (
            <Empty
                description={gLang('ecDetail.noBindingInfo')}
                image={Empty.PRESENTED_IMAGE_SIMPLE}
            />
        );
    }

    // 网易账号绑定数据
    const neteaseData = bindingInfo.ecidToNetease.results.map((item, index) => ({
        key: `netease-${index}`,
        type: 'netease',
        name: item.name,
        neteaseId: item.neteaseId,
        originalEcid: item.originalEcid,
        xuid: item.xuid,
    }));

    // 国际版ECID绑定数据
    const ecidData = bindingInfo.neteaseToEcid.results.map((item, index) => ({
        key: `ecid-${index}`,
        type: 'ecid',
        internationalEcid: item.internationalEcid,
        neteaseId: item.neteaseId,
        xuid: item.xuid,
        originalInput: item.originalInput,
    }));

    // 合并数据
    const allData = [...neteaseData, ...ecidData];

    const columns: any[] = [
        {
            title: gLang('ecDetail.nickname'),
            dataIndex: 'name',
            key: 'name',
            width: 120,
            ellipsis: true,
            render: (name: string, record: any) => {
                if (record.type === 'netease' && name) {
                    return <span style={{ fontWeight: 600 }}>{name}</span>;
                }
                return '-';
            },
        },
        {
            title:
                bindingInfo.inputType === 'netease'
                    ? gLang('ecDetail.boundIndependentAccount')
                    : gLang('ecDetail.boundNeteaseAccount'),
            key: 'accountId',
            ellipsis: true,
            render: (_: any, record: any) => {
                if (record.type === 'netease') {
                    return (
                        <span
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                wordBreak: 'break-all',
                            }}
                        >
                            {record.neteaseId}
                        </span>
                    );
                } else {
                    return (
                        <span
                            style={{
                                fontFamily: 'monospace',
                                fontSize: 12,
                                wordBreak: 'break-all',
                            }}
                        >
                            {record.internationalEcid}
                        </span>
                    );
                }
            },
        },
        {
            title: gLang('ecDetail.actions'),
            key: 'action',
            width: 80,
            render: (_: any, record: any) => {
                return (
                    <Button
                        type="link"
                        danger
                        size="small"
                        onClick={() => handleUnbind(record)}
                        title={gLang('ecDetail.unbindAccount')}
                    >
                        {gLang('ecDetail.unbind')}
                    </Button>
                );
            },
        },
    ];

    const tableStyle = isBlackOrangeActive
        ? {
              background: palette.surface,
              color: palette.textPrimary,
          }
        : undefined;

    return (
        <>
            {contextHolder}
            {modalContextHolder}
            <div>
                <div
                    style={{
                        marginBottom: 16,
                        display: 'flex',
                        alignItems: 'flex-start',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    <h3
                        style={{
                            margin: 0,
                            flex: '1 1 200px',
                            minWidth: 0,
                            whiteSpace: 'nowrap',
                        }}
                    >
                        {gLang('ecDetail.playerBindingInfo')} (
                        {gLang('ecDetail.totalResults', { count: bindingInfo.totalResults })})
                    </h3>
                    <div
                        style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: 8,
                            flexWrap: 'wrap',
                            flexShrink: 0,
                        }}
                    >
                        <Tag color={bindingInfo.inputType === 'netease' ? 'purple' : 'blue'}>
                            {bindingInfo.inputType === 'netease'
                                ? gLang('ecDetail.neteaseIdSearch')
                                : gLang('ecDetail.ecidSearch')}
                        </Tag>
                        {bindingInfo.inputType !== 'netease' && (
                            <Button
                                type="primary"
                                danger
                                size="small"
                                onClick={handleUnbindAll}
                                title={gLang('ecDetail.unbindAllAccounts')}
                            >
                                {gLang('ecDetail.unbindAll')}
                            </Button>
                        )}
                    </div>
                </div>

                <Table
                    columns={columns}
                    dataSource={allData}
                    pagination={false}
                    rowKey="key"
                    size="small"
                    style={tableStyle}
                    scroll={{ x: 'max-content' }}
                />
            </div>
        </>
    );
};

export default PlayerBindingInfo;
