import React from 'react';
import { Empty, Modal, Space, Spin, Table, Tag } from 'antd';
import { HistoryOutlined } from '@ant-design/icons';
import { BindPlayer } from '@ecuc/shared/types/player.types';
import { UserBindStatus } from '@ecuc/shared/types';
import { gLang } from '@common/language';
import { TimeConverter } from '../../../../../../components/TimeConverter';

interface BindingHistoryModalProps {
    openid: string;
    visible: boolean;
    onClose: () => void;
    bindList: BindPlayer[];
    loading: boolean;
    screens: any;
    getStatusIcon: (status: string) => React.ReactElement;
    getStatusColor: (status: string) => string;
}

const BindingHistoryModal: React.FC<BindingHistoryModalProps> = ({
    openid,
    visible,
    onClose,
    bindList,
    loading,
    screens,
    getStatusIcon,
    getStatusColor,
}) => {
    // 定义表格列
    const bindingHistoryColumns = [
        {
            title: 'ECID',
            dataIndex: 'ecid',
            key: 'ecid',
        },
        {
            title: gLang('superPanel.statusTitle'),
            dataIndex: 'status',
            key: 'status',
            render: (status: string) => (
                <Tag icon={getStatusIcon(status)} color={getStatusColor(status)}>
                    {status === UserBindStatus.Open
                        ? gLang('superPanel.status.normal')
                        : status === UserBindStatus.Frozen
                          ? gLang('superPanel.status.frozen')
                          : gLang('superPanel.status.unbound')}
                </Tag>
            ),
        },
        {
            title: gLang('superPanel.bindTime'),
            dataIndex: 'create_time',
            key: 'create_time',
            render: (time: string) => (time ? <TimeConverter utcTime={time} /> : '-'),
        },
        {
            title: gLang('superPanel.unbindTime'),
            dataIndex: 'unbind_time',
            key: 'unbind_time',
            render: (time: string) => (time ? <TimeConverter utcTime={time} /> : '-'),
        },
    ];

    return (
        <Modal
            title={
                <Space>
                    <HistoryOutlined />
                    <span>{`${gLang('superPanel.bindHistory')} (${openid})`}</span>
                </Space>
            }
            open={visible}
            onCancel={onClose}
            footer={null}
            width={screens.md ? '70%' : '95%'}
            destroyOnHidden
        >
            <Spin spinning={loading}>
                <Space direction="vertical" size={24} style={{ width: '100%' }}>
                    {bindList.length > 0 ? (
                        <Table
                            dataSource={bindList}
                            columns={bindingHistoryColumns}
                            rowKey="ecid"
                            pagination={false}
                            scroll={{ x: 'max-content' }}
                            size={screens.xs ? 'small' : 'middle'}
                        />
                    ) : (
                        <Empty
                            description={gLang('superPanel.noBindAccounts')}
                            image={Empty.PRESENTED_IMAGE_SIMPLE}
                        />
                    )}
                </Space>
            </Spin>
        </Modal>
    );
};

export default BindingHistoryModal;
