// 管理员WIKI绑定列表页面 - 适配 EPF 格式及新 API 数据 (user_id, ecid, bind_status, bound_at, unbound_at, user_name)

import {
    Space,
    Table,
    TableProps,
    Tag,
    Typography,
    Button,
    message,
    App,
    Input,
    Select,
    Row,
    Col,
} from 'antd';
import { useEffect, useState } from 'react';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { saveAs } from 'file-saver';
import { DownloadOutlined } from '@ant-design/icons';
import { buildCsvContent, ensureCsvExtension } from '@common/utils/csvExport';

dayjs.extend(utc);

/** New API list item shape */
export interface WikiBindingListItem {
    user_id: number;
    ecid: string;
    bind_status: string;
    bound_at: string;
    unbound_at: string | null;
    user_name: string;
}

function getStatusColor(status: string): string {
    switch (status) {
        case 'O':
            return 'green';
        case 'X':
            return 'red';
        case 'F':
            return 'orange';
        default:
            return 'default';
    }
}

function getStatusText(status: string): string {
    switch (status) {
        case 'O':
            return gLang('wiki.bindingList.status.open');
        case 'X':
            return gLang('wiki.bindingList.status.unbound');
        case 'F':
            return gLang('wiki.bindingList.status.frozen');
        default:
            return gLang('common.unknown');
    }
}

const AdminWikiBindingList = () => {
    const [bindingList, setBindingList] = useState<WikiBindingListItem[]>([]);
    const [filteredBindingList, setFilteredBindingList] = useState<WikiBindingListItem[]>([]);
    const { Title, Paragraph } = Typography;
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [unbindLoading, setUnbindLoading] = useState<boolean>(false);
    const { modal } = App.useApp();
    const [messageApi, contextHolder] = message.useMessage();

    const [searchField, setSearchField] = useState<string>('ecid');
    const [searchText, setSearchText] = useState<string>('');
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    const columns: TableProps<WikiBindingListItem>['columns'] = [
        {
            title: gLang('wiki.bindingList.table.wikiUserid'),
            dataIndex: 'user_id',
            key: 'user_id',
            width: 100,
            sorter: (a, b) => a.user_id - b.user_id,
        },
        {
            title: gLang('wiki.bindingList.table.ecid'),
            dataIndex: 'ecid',
            key: 'ecid',
            width: 120,
            sorter: (a, b) => a.ecid.localeCompare(b.ecid),
        },
        {
            title: gLang('wiki.bindingList.table.wikiUsername'),
            dataIndex: 'user_name',
            key: 'user_name',
            width: 150,
            sorter: (a, b) => (a.user_name || '').localeCompare(b.user_name || ''),
            render: (name: string) => name || '-',
        },
        {
            title: gLang('wiki.bindingList.table.status'),
            dataIndex: 'bind_status',
            key: 'bind_status',
            width: 100,
            filters: [
                { text: gLang('wiki.bindingList.status.open'), value: 'O' },
                { text: gLang('wiki.bindingList.status.unbound'), value: 'X' },
                { text: gLang('wiki.bindingList.status.frozen'), value: 'F' },
            ],
            onFilter: (value, record) => record.bind_status === value,
            render: (status: string) => (
                <Tag color={getStatusColor(status)}>{getStatusText(status)}</Tag>
            ),
        },
        {
            title: gLang('wiki.bindingList.table.createTime'),
            dataIndex: 'bound_at',
            key: 'bound_at',
            width: 160,
            sorter: (a, b) => dayjs(a.bound_at).valueOf() - dayjs(b.bound_at).valueOf(),
            render: (date: string) => dayjs.utc(date).local().format('YYYY-MM-DD HH:mm'),
        },
        {
            title: gLang('wiki.bindingList.table.unbindTime'),
            dataIndex: 'unbound_at',
            key: 'unbound_at',
            width: 160,
            sorter: (a, b) => {
                const au = a.unbound_at;
                const bu = b.unbound_at;
                if (!au && !bu) return 0;
                if (!au) return 1;
                if (!bu) return -1;
                return dayjs(au).valueOf() - dayjs(bu).valueOf();
            },
            render: (date: string | null) =>
                date ? dayjs.utc(date).local().format('YYYY-MM-DD HH:mm') : '-',
        },
        {
            title: gLang('wiki.binding.bindingList.table.userPageLink'),
            key: 'user_link',
            width: 180,
            render: (_, record: WikiBindingListItem) =>
                record.user_name ? (
                    <a
                        href={`https://${gLang('wiki.binding.bindingList.table.userPageUrl', { username: record.user_name })}`}
                        target="_blank"
                        rel="noopener noreferrer"
                    >
                        {gLang('wiki.binding.bindingList.table.userPageUrl', {
                            username: record.user_name,
                        })}
                    </a>
                ) : (
                    '-'
                ),
        },
        {
            title: gLang('wiki.bindingList.table.action'),
            key: 'action',
            width: 100,
            render: (_, record: WikiBindingListItem) => (
                <Button
                    danger
                    size="small"
                    loading={unbindLoading}
                    onClick={() => handleUnbind(record)}
                    disabled={record.bind_status === 'X'}
                >
                    {gLang('wiki.bindingList.table.unbind')}
                </Button>
            ),
        },
    ];

    useEffect(() => {
        handleUpdate();
    }, []);

    const handleUpdate = async () => {
        await fetchData({
            url: '/wiki/bindings/list',
            method: 'GET',
            data: {},
            setData: (response: { EPF_code?: number; data?: WikiBindingListItem[] }) => {
                const list = Array.isArray(response?.data) ? response.data : [];
                setBindingList(list);
                setFilteredBindingList(list);
                setSearchText('');
            },
            setSpin: setIsLoading,
        });
    };

    const onSearch = (value: string) => {
        setSearchText(value);
        if (!value) {
            setFilteredBindingList(bindingList);
            return;
        }
        const lowerValue = value.toLowerCase();
        const filtered = bindingList.filter(item => {
            if (searchField === 'ecid') return item.ecid?.toLowerCase().includes(lowerValue);
            if (searchField === 'user_id') return String(item.user_id).includes(value);
            if (searchField === 'user_name')
                return item.user_name?.toLowerCase().includes(lowerValue);
            return false;
        });
        setFilteredBindingList(filtered);
    };

    const exportToCsv = () => {
        try {
            const headers = [
                gLang('admin.wikiBindingListUserId'),
                'ECID',
                gLang('admin.wikiBindingListUsername'),
                gLang('admin.wikiBindingListStatus'),
                gLang('admin.wikiBindingListBindTime'),
                gLang('admin.wikiBindingListUnbindTime'),
            ];
            const rows = filteredBindingList.map(item => [
                item.user_id,
                item.ecid || '',
                item.user_name || '',
                getStatusText(item.bind_status),
                item.bound_at ? dayjs.utc(item.bound_at).local().format('YYYY-MM-DD HH:mm') : '-',
                item.unbound_at
                    ? dayjs.utc(item.unbound_at).local().format('YYYY-MM-DD HH:mm')
                    : '-',
            ]);

            const fileName = ensureCsvExtension(
                gLang('admin.wikiBindingListExportFilename', {
                    date: dayjs().format('YYYY-MM-DD_HH-mm-ss'),
                })
            );
            const csv = buildCsvContent(headers, rows);
            saveAs(new Blob([csv], { type: 'text/csv;charset=utf-8;' }), fileName);
            messageApi.success(gLang('admin.wikiBindingListExportSuccess'));
        } catch {
            messageApi.error(gLang('admin.wikiBindingListExportFailedRetry'));
        }
    };

    const handleUnbind = async (binding: WikiBindingListItem) => {
        modal.confirm({
            title: gLang('wiki.binding.admin.confirmUnbind'),
            content: gLang('wiki.binding.admin.unbindConfirm', {
                ecid: binding.ecid,
                username: binding.user_name || '',
            }),
            onOk: async () => {
                try {
                    setUnbindLoading(true);
                    await fetchData({
                        url: '/wiki/admin/unbind',
                        method: 'POST',
                        data: { ecid: binding.ecid },
                        setData: () => {
                            messageApi.success(gLang('wiki.binding.admin.unbindSuccess'));
                            handleUpdate();
                        },
                    });
                } catch {
                    messageApi.error(gLang('wiki.binding.admin.unbindFailed'));
                } finally {
                    setUnbindLoading(false);
                }
            },
        });
    };

    return (
        <>
            {contextHolder}
            <Space direction="vertical" style={{ width: '100%' }}>
                <Typography>
                    <Title level={3}>{gLang('wiki.bindingList.title')}</Title>
                    <Paragraph type="secondary">{gLang('wiki.bindingList.intro')}</Paragraph>
                </Typography>

                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={6}>
                        <Select
                            value={searchField}
                            onChange={v => {
                                setSearchField(v);
                                setSearchText('');
                                setFilteredBindingList(bindingList);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="ecid">
                                {gLang('wiki.bindingList.table.ecid')}
                            </Select.Option>
                            <Select.Option value="user_id">
                                {gLang('wiki.bindingList.table.wikiUserid')}
                            </Select.Option>
                            <Select.Option value="user_name">
                                {gLang('wiki.bindingList.table.wikiUsername')}
                            </Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={10}>
                        <Input.Search
                            placeholder={
                                searchField === 'user_id'
                                    ? gLang('wiki.bindingList.table.wikiUserid')
                                    : searchField === 'user_name'
                                      ? gLang('wiki.bindingList.search.wikiUsername')
                                      : gLang('wiki.bindingList.search.ecid')
                            }
                            value={searchText}
                            onChange={e => setSearchText(e.target.value)}
                            onSearch={onSearch}
                            style={{ width: '100%' }}
                        />
                    </Col>
                    <Col xs={24} sm={8}>
                        <Button icon={<DownloadOutlined />} onClick={exportToCsv}>
                            {gLang('wiki.bindingList.search.export')}
                        </Button>
                    </Col>
                </Row>

                <Table<WikiBindingListItem>
                    loading={isLoading}
                    columns={columns}
                    dataSource={filteredBindingList}
                    rowKey={(record, index) =>
                        `${record.ecid}-${record.user_id}-${record.bound_at}-${index}`
                    }
                    scroll={{ x: 1000 }}
                    pagination={{
                        pageSize,
                        current: currentPage,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50', '100'],
                        onChange: (page, size) => {
                            setCurrentPage(page);
                            setPageSize(size || 10);
                        },
                    }}
                />
            </Space>
        </>
    );
};

export default AdminWikiBindingList;
