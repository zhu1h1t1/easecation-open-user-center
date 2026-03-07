// 管理员媒体列表页面

import {
    Col,
    Input,
    Modal,
    Row,
    Select,
    Space,
    Table,
    TableProps,
    Tag,
    Typography,
    Button,
    message,
} from 'antd';
import { useEffect, useState } from 'react';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import MediaPanelComponent from './components/MediaPanelComponent';
import { MediaUser, MediaStatus } from '@ecuc/shared/types/media.types';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { saveAs } from 'file-saver';
import { DownloadOutlined } from '@ant-design/icons';
import { buildCsvContent, ensureCsvExtension } from '@common/utils/csvExport';

// 注册UTC插件
dayjs.extend(utc);

/**
 * 根据不同状态返回对应的 Tag 颜色
 * 你可以根据自己实际业务来调整状态值与颜色的映射
 */
function getStatusColor(status: string): string {
    switch (status) {
        case MediaStatus.ExpiredCreator:
            return 'green';
        case MediaStatus.ActiveCreator: // 进阶媒体
            return 'orange';
        case MediaStatus.ExcellentCreator: // 高级媒体
            return 'red';
        case MediaStatus.Frozen: // 未审核
            return 'gray';
        case MediaStatus.PendingReview: // 审核中
            return 'blue';
        case MediaStatus.Player: // 冻结
            return 'darkgray';
        default:
            return 'default'; // 未知状态
    }
}

export function getStatusNumber(status: string): string {
    switch (status) {
        case MediaStatus.ExpiredCreator:
        case MediaStatus.ActiveCreator:
        case MediaStatus.ExcellentCreator: // 普通媒体
            return status;
        case MediaStatus.Frozen: // 进阶媒体
            return '4';
        case MediaStatus.PendingReview: // 高级媒体
            return '5';
        case MediaStatus.Player: // 高级媒体
            return '6';
        default:
            return '6';
    }
}

const AdminMediaList = () => {
    const [filteredMediaList, setFilteredMediaList] = useState<MediaUser[]>([]);
    const [mediaList, setMediaList] = useState<MediaUser[]>([]);
    const { Title, Paragraph } = Typography;
    const [editMedia, setEditMedia] = useState<MediaUser | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [messageApi, messageContextHolder] = message.useMessage();

    // 新的搜索框状态
    const [searchField, setSearchField] = useState<string>('media_id'); // 默认按媒体ID搜索
    const [searchText, setSearchText] = useState<string>('');

    // 新增分页相关状态
    const [pageSize, setPageSize] = useState<number>(10);
    const [currentPage, setCurrentPage] = useState<number>(1);

    // 定义表格列
    const columns: TableProps<MediaUser>['columns'] = [
        {
            title: 'ID',
            dataIndex: 'id',
            key: 'id',
            width: 50,
            sorter: (a, b) => (a.id || 0) - (b.id || 0),
            render: (id: number, record: MediaUser) => (
                <a onClick={() => setEditMedia(record)}>{id}</a>
            ),
        },
        {
            title: gLang('mediaPanel.statusDis'),
            dataIndex: 'status',
            key: 'status',
            width: 50,
            // 列举所有可能的状态值，给用户做筛选
            filters: [
                { text: `-2 ${gLang('mediaPanel.status.5')}`, value: MediaStatus.PendingReview },
                { text: `-1 ${gLang('mediaPanel.status.4')}`, value: MediaStatus.Frozen },
                { text: `0 ${gLang('mediaPanel.status.6')}`, value: MediaStatus.Player },
                { text: `1 ${gLang('mediaPanel.status.1')}`, value: MediaStatus.ExpiredCreator },
                { text: `2 ${gLang('mediaPanel.status.2')}`, value: MediaStatus.ActiveCreator },
                { text: `3 ${gLang('mediaPanel.status.3')}`, value: MediaStatus.ExcellentCreator },
            ],
            onFilter: (value, record) => record.status === value,
            render: (text: string) => {
                const color = getStatusColor(text);
                return (
                    <Tag color={color}>
                        {text} {gLang('mediaPanel.status.' + getStatusNumber(text))}
                    </Tag>
                );
            },
        },
        {
            title: gLang('mediaPanel.expire_date'),
            dataIndex: 'expireDate',
            key: 'expireDate',
            width: 100,
            sorter: (a, b) => {
                const getTimestamp = (value?: Date | string) => {
                    if (!value) return Infinity; // 空值视为无限未来
                    return typeof value === 'string' ? dayjs.utc(value).valueOf() : value.getTime();
                };

                return getTimestamp(a.expireDate) - getTimestamp(b.expireDate);
            },
            render: (date?: Date) => (date ? dayjs.utc(date).local().format('YYYY-MM-DD') : 'N/A'),
        },
        {
            title: gLang('mediaPanel.EBalance'),
            dataIndex: 'EBalance',
            key: 'EBalance',
            width: 100,
            sorter: (a, b) => {
                // E点数字排序，空值视为0
                const getEValue = (value?: number) => {
                    return value || 0;
                };
                return getEValue(a.EBalance) - getEValue(b.EBalance);
            },
            render: (EBalance: number) => EBalance,
        },
        {
            title: gLang('mediaPanel.ecid'),
            dataIndex: 'ECID',
            key: 'ECID',
            width: 100,
            render: (ECID: string) => (ECID ? ECID : 'N/A'),
        },
        {
            title: gLang('mediaPanel.remark'),
            dataIndex: 'QQNumber',
            key: 'QQNumber',
            width: 100,
        },
        {
            title: gLang('mediaPanel.mpa'),
            dataIndex: 'mpa',
            key: 'mpa',
            width: 100,
        },
        {
            title: gLang('mediaPanel.link'),
            dataIndex: 'link',
            key: 'link',
            width: 100,
            render: (link: string) =>
                link ? (
                    <a href={link} target="_blank" rel="noopener noreferrer">
                        {link}
                    </a>
                ) : (
                    'N/A'
                ),
        },
        {
            title: gLang('mediaPanel.lastReviewed'),
            dataIndex: 'lastReviewed',
            key: 'lastReviewed',
            width: 100,
            sorter: (a, b) => {
                // 按上次月审时间排序，空值或 N/A 视为最大
                const getTimestamp = (value?: Date | string) => {
                    if (!value || value === 'N/A') return Infinity;
                    return typeof value === 'string' ? dayjs.utc(value).valueOf() : value.getTime();
                };
                return getTimestamp(a.lastReviewed) - getTimestamp(b.lastReviewed);
            },
            render: (date?: Date) => (date ? dayjs.utc(date).local().format('YYYY-MM-DD') : 'N/A'),
        },
        {
            title: gLang('mediaPanel.create_time'),
            dataIndex: 'createTime',
            key: 'createTime',
            width: 100,
            sorter: (a, b) => {
                // 按创建时间排序，空值视为最早时间
                const getTimestamp = (value?: Date | string) => {
                    if (!value) return 0; // 空值视为最早时间
                    return typeof value === 'string' ? dayjs.utc(value).valueOf() : value.getTime();
                };
                return getTimestamp(a.createTime) - getTimestamp(b.createTime);
            },
            render: (date?: Date) => (date ? dayjs.utc(date).local().format('YYYY-MM-DD') : 'N/A'),
        },
    ];

    useEffect(() => {
        handleUpdate();
    }, []);

    const handleUpdate = async () => {
        await fetchData({
            url: '/media/listAdmin',
            method: 'GET',
            data: {},
            setData: (data: MediaUser[]) => {
                setMediaList(data);
                setFilteredMediaList(data);
                setSearchText('');
            },
            setSpin: setIsLoading,
        });
    };

    // 搜索框回车或点击按钮时触发搜索
    const onSearch = (value: string) => {
        setSearchText(value);
        if (!value) {
            setFilteredMediaList(mediaList);
            return;
        }
        const lowerValue = value.toLowerCase();
        const filtered = mediaList.filter(item => {
            if (searchField === 'media_id') {
                return item.id.toString().includes(value);
            } else if (searchField === 'link') {
                return item.link && item.link.toLowerCase().includes(lowerValue);
            } else if (searchField === 'remark') {
                return item.QQNumber && item.QQNumber.toLowerCase().includes(lowerValue);
            } else if (searchField === 'mpa') {
                return item.mpa && item.mpa.toLowerCase().includes(lowerValue);
            } else if (searchField === 'ecid') {
                return item.ECID && item.ECID.toLowerCase().includes(lowerValue);
            }
            return false;
        });
        setFilteredMediaList(filtered);
    };

    // 导出CSV功能
    const exportToCsv = () => {
        try {
            const headers = [
                'ID',
                gLang('admin.mediaListStatus'),
                gLang('admin.mediaListExpire'),
                gLang('admin.mediaListEpoint'),
                'ECID',
                gLang('admin.mediaListRemark'),
                gLang('admin.mediaListAccount'),
                gLang('admin.mediaListLink'),
                gLang('admin.mediaListLastReview'),
                gLang('admin.mediaListCreateTime'),
            ];
            const rows = filteredMediaList.map(item => [
                item.id,
                `${item.status} ${gLang('mediaPanel.status.' + getStatusNumber(item.status))}`,
                item.expireDate ? dayjs.utc(item.expireDate).local().format('YYYY-MM-DD') : 'N/A',
                item.EBalance || 0,
                item.ECID || 'N/A',
                item.QQNumber || '',
                item.mpa || '',
                item.link || 'N/A',
                item.lastReviewed
                    ? dayjs.utc(item.lastReviewed).local().format('YYYY-MM-DD')
                    : 'N/A',
                item.createTime ? dayjs.utc(item.createTime).local().format('YYYY-MM-DD') : 'N/A',
            ]);

            // 生成文件名
            const fileName = ensureCsvExtension(
                gLang('admin.mediaListExportFilename', {
                    date: dayjs().format('YYYY-MM-DD_HH-mm-ss'),
                })
            );

            // 导出文件
            const csv = buildCsvContent(headers, rows);
            const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
            saveAs(blob, fileName);

            messageApi.success(gLang('admin.mediaListExportSuccess'));
        } catch {
            messageApi.error(gLang('admin.mediaListExportFailedRetry'));
        }
    };

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {messageContextHolder}
            <Typography>
                <Title level={3}>{gLang('mediaListAdmin.title')}</Title>
                <Paragraph type="secondary">{gLang('mediaListAdmin.intro')}</Paragraph>
            </Typography>

            {/* 搜索部分：左侧选择搜索字段，右侧输入搜索内容，最右侧导出按钮 */}
            <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                <Col xs={24} sm={6}>
                    <Select
                        value={searchField}
                        onChange={value => {
                            setSearchField(value);
                            // 切换搜索字段时重置搜索内容和结果
                            setSearchText('');
                            setFilteredMediaList(mediaList);
                        }}
                        style={{ width: '100%' }}
                    >
                        <Select.Option value="media_id">
                            {gLang('mediaPanel.media_id')}
                        </Select.Option>
                        <Select.Option value="link">{gLang('mediaPanel.link')}</Select.Option>
                        <Select.Option value="remark">{gLang('mediaPanel.remark')}</Select.Option>
                        <Select.Option value="mpa">{gLang('mediaPanel.mpa')}</Select.Option>
                        <Select.Option value="ecid">{gLang('mediaPanel.ecid')}</Select.Option>
                    </Select>
                </Col>
                <Col xs={24} sm={10}>
                    <Input.Search
                        placeholder={gLang('admin.mediaListSearchPlaceholder', {
                            field: gLang('mediaPanel.' + searchField),
                        })}
                        value={searchText}
                        onChange={e => setSearchText(e.target.value)}
                        onSearch={onSearch}
                        style={{ width: '100%' }}
                    />
                </Col>
                <Col xs={24} sm={8}>
                    <Button icon={<DownloadOutlined />} onClick={exportToCsv}>
                        {gLang('admin.mediaListExportButton')}
                    </Button>
                </Col>
            </Row>

            <Table
                loading={isLoading}
                columns={columns}
                dataSource={filteredMediaList}
                rowKey={record => record.id}
                scroll={{ x: 1500 }}
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

            <Modal
                title={editMedia ? `${gLang('ticketOperate.modifyMedia')}` : ''}
                open={!!editMedia}
                onCancel={() => setEditMedia(null)}
                footer={null}
                width={800}
            >
                <div style={{ overflowY: 'auto' }}>
                    {editMedia && <MediaPanelComponent openid={editMedia.openID} />}
                </div>
            </Modal>
        </Space>
    );
};

export default AdminMediaList;
