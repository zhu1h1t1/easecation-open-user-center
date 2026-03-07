import {
    Button,
    Col,
    Input,
    message,
    Row,
    Select,
    Space,
    Table,
    TableProps,
    Tag,
    Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { AnnouncementDetailModal } from './UpdateDetailModal';
import CreateAnnouncementModal from './CreateModel';
import { Announcement } from '@ecuc/shared/types/media.types';

// 注册UTC插件
dayjs.extend(utc);

/**
 * 根据不同权限返回对应的 Tag 颜色
 * 你可以根据自己实际业务来调整权限值与颜色的映射
 */
export function getPermissionColor(permission: number): string {
    switch (permission) {
        case 0: // 公开
            return 'green';
        case 1: // 仅创作者
            return 'orange';
        case 2: // 个人
            return 'red';
        case 3: // 未发布
            return 'gray';
        default:
            return 'default'; // 未知权限
    }
}

const AdminAnnouncementList = () => {
    const [filteredAnnouncements, setFilteredAnnouncements] = useState<Announcement[]>([]);
    const [announcements, setAnnouncements] = useState<Announcement[]>([]);
    const { Title, Paragraph } = Typography;
    const [editAnnouncement, setEditAnnouncement] = useState<Announcement | null>(null);
    const [isLoading, setIsLoading] = useState<boolean>(false);
    const [isCreateModalVisible, setIsCreateModalVisible] = useState(false);

    // 新的搜索框状态
    const [searchField, setSearchField] = useState<string>('id'); // 默认按ID搜索
    const [searchText, setSearchText] = useState<string>('');

    // 搜索过滤，适配新字段
    const handleSearch = (value: string) => {
        setSearchText(value);
        const lowerValue = value.toLowerCase();
        const filtered = announcements.filter(item => {
            if (searchField === 'id') {
                return item.id.toString().includes(value);
            } else if (searchField === 'title') {
                return item.title && item.title.toLowerCase().includes(lowerValue);
            } else if (searchField === 'card') {
                return item.card && item.card.toLowerCase().includes(lowerValue);
            }
            return false;
        });
        setFilteredAnnouncements(filtered);
    };

    const handleClose = () => {
        setEditAnnouncement(null);
    };

    // 定义表格列
    // 新公告字段适配的表格列
    const columns: TableProps<Announcement>['columns'] = [
        {
            title: gLang('announcement.panel.id'),
            dataIndex: 'id',
            key: 'id',
            width: 50,
            sorter: (a, b) => a.id - b.id,
            render: (id: number, record: Announcement) => (
                <a onClick={() => setEditAnnouncement(record)}>{id}</a>
            ),
        },
        {
            title: gLang('announcement.panel.title'),
            dataIndex: 'title',
            key: 'title',
            width: 180,
        },
        {
            title: gLang('announcement.panel.content'),
            dataIndex: 'content',
            key: 'content',
            width: 260,
            render: (text: string) => <span style={{ whiteSpace: 'pre-wrap' }}>{text}</span>,
        },
        {
            title: gLang('announcement.panel.autoShow'),
            dataIndex: 'autoShow',
            key: 'autoShow',
            width: 100,
            render: (autoShow: boolean) => (
                <Tag color={autoShow ? 'green' : 'red'}>
                    {autoShow ? gLang('common.switch.open') : gLang('common.switch.close')}
                </Tag>
            ),
        },
        {
            title: gLang('announcement.panel.startTime'),
            dataIndex: 'startTime',
            key: 'startTime',
            width: 180,
            render: (startTime: string) => dayjs(startTime).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: gLang('announcement.panel.endTime'),
            dataIndex: 'endTime',
            key: 'endTime',
            width: 180,
            render: (endTime: string) => dayjs(endTime).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: gLang('announcement.panel.dieTime'),
            dataIndex: 'dieTime',
            key: 'dieTime',
            width: 180,
            render: (dieTime: string) => dayjs(dieTime).format('YYYY-MM-DD HH:mm:ss'),
        },
        {
            title: gLang('announcement.panel.card'),
            dataIndex: 'card',
            key: 'card',
            width: 160,
        },
        {
            title: gLang('announcement.panel.carddesc'),
            dataIndex: 'carddesc',
            key: 'carddesc',
            width: 200,
        },
    ];

    useEffect(() => {
        handleUpdate();
    }, []);

    const handleUpdate = async () => {
        await fetchData({
            url: '/announcement', // 修改为正确的API路径
            method: 'GET',
            data: {},
            setData: value => {
                setAnnouncements(value.announcements);
                setFilteredAnnouncements(value.announcements);
                setSearchText('');
            },
            setSpin: setIsLoading,
        });
    };

    const [, messageContextHolder] = message.useMessage();

    return (
        <div style={{ width: '100%', overflowX: 'auto' }}>
            {messageContextHolder}
            <Space orientation="vertical" style={{ width: '100%' }}>
                <Typography>
                    <Title level={3}>{gLang('announcement.title')}</Title>
                    <Paragraph type="secondary">{gLang('announcement.intro')}</Paragraph>
                </Typography>

                {/* 创建公告按钮 */}
                <Button
                    type="primary"
                    onClick={() => setIsCreateModalVisible(true)}
                    style={{ marginBottom: 16 }}
                >
                    {gLang('common.create')}
                </Button>

                {/* 搜索部分：左侧选择搜索字段，右侧输入搜索内容 */}
                <Row gutter={[16, 16]} align="middle" style={{ marginBottom: 16 }}>
                    <Col xs={24} sm={8}>
                        <Select
                            value={searchField}
                            onChange={value => {
                                setSearchField(value);
                                setSearchText('');
                                setFilteredAnnouncements(announcements);
                            }}
                            style={{ width: '100%' }}
                        >
                            <Select.Option value="id">
                                {gLang('announcement.panel.id')}
                            </Select.Option>
                            <Select.Option value="title">
                                {gLang('announcement.panel.title')}
                            </Select.Option>
                            <Select.Option value="card">
                                {gLang('announcement.panel.card')}
                            </Select.Option>
                        </Select>
                    </Col>
                    <Col xs={24} sm={8}>
                        <Input.Search
                            placeholder={
                                gLang('announcement.panel.search_placeholder') ||
                                gLang('admin.announcementSearchPlaceholder', {
                                    field:
                                        searchField === 'id'
                                            ? gLang('announcement.panel.id')
                                            : searchField === 'title'
                                              ? gLang('announcement.panel.title')
                                              : gLang('announcement.panel.card'),
                                })
                            }
                            value={searchText}
                            onChange={e => handleSearch(e.target.value)}
                            style={{ width: '100%' }}
                        />
                    </Col>
                </Row>

                {/* 表格部分 */}
                <Table
                    rowKey="id"
                    loading={isLoading}
                    dataSource={filteredAnnouncements}
                    columns={columns}
                    pagination={{
                        pageSize: 10,
                        showSizeChanger: true,
                        pageSizeOptions: ['10', '20', '50'],
                    }}
                />

                {/* 编辑公告模态框 */}
                <AnnouncementDetailModal
                    announcement={editAnnouncement}
                    onClose={handleClose}
                    onSuccess={handleUpdate}
                />

                {/* 创建公告模态框 */}
                <CreateAnnouncementModal
                    visible={isCreateModalVisible}
                    onClose={() => setIsCreateModalVisible(false)}
                    onSuccess={handleUpdate}
                />
            </Space>
        </div>
    );
};

export default AdminAnnouncementList;
