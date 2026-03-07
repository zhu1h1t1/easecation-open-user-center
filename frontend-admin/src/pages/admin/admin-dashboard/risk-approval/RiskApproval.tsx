import React, { useState, useEffect } from 'react';
import {
    Button,
    Table,
    Modal,
    Form,
    Input,
    Select,
    Space,
    Typography,
    message,
    Row,
    Col,
    Upload,
    Image,
    Spin,
    Flex,
    Card,
    Tag,
} from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import AccountMatchingFormItem from '../../../../components/AccountMatchingFormItem';
import { useUploadProps, generateTemporaryUrl } from '@common/utils/uploadUtils';
import { parseDuration } from '@common/utils/parseDuration';
import type { ColumnsType } from 'antd/es/table';
import { gLang } from '@common/language';
import { useAuth } from '@common/contexts/AuthContext';
import { fetchData } from '@common/axiosConfig';
import VideoPlayerComponent from '../../../../components/VideoPlayerComponent';
import dayjs from 'dayjs';
import { useParams, useNavigate } from 'react-router-dom';
import { Grid } from 'antd';
import { useTheme } from '@common/contexts/ThemeContext';

type Vote = {
    user: string;
    decision: 'agree' | 'reject';
    reason?: string;
    at: string;
};

type ApplicationRecord = {
    id: number;
    submitTime: string;
    playerNickname: string | null;
    playerECID?: string | null;
    operation: string;
    hours?: number | null;
    attachments?: string[] | null;
    reason: string;
    adminNote?: string | null;
    operationType?: 'internal' | 'external';
    communityNickname?: string | null;
    targetLocation?: string | null;
    agrees: number;
    rejects: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Punished';
    votes: Vote[];
    senAdminCount?: number;
    hasVoted?: boolean; // 当前用户是否已投票
};

const DefaultSenAdminCount = 5; // Default value, can be replaced with backend API

const { useBreakpoint } = Grid;

const RiskApproval: React.FC = () => {
    const { user } = useAuth();
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const screens = useBreakpoint();
    const { getThemeColor } = useTheme();
    const [list, setList] = useState<ApplicationRecord[]>([]);
    const [createVisible, setCreateVisible] = useState(false);
    const [reviewVisible, setReviewVisible] = useState(false);
    const [form] = Form.useForm();
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const { uploadProps, contextHolder } = useUploadProps(
        10,
        uploadedFiles,
        setUploadedFiles,
        setIsUploading
    );
    const [rawData, setRawData] = useState<string>('');
    const [messageApi, messageContextHolder] = message.useMessage();
    const [operationType, setOperationType] = useState<'internal' | 'external' | ''>('');
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Watch form value for operationType to sync with state
    const formOperationType = Form.useWatch('operationType', form);

    // Theme colors
    const mutedTextColor = getThemeColor({
        light: '#999',
        dark: '#8c8c8c',
    });
    const primaryColor = getThemeColor({
        light: '#1890ff',
        dark: '#40a9ff',
    });
    const errorColor = getThemeColor({
        light: '#ff4d4f',
        dark: '#ff7875',
    });
    const warningColor = getThemeColor({
        light: '#faad14',
        dark: '#ffc53d',
    });
    const inputBackground = getThemeColor({
        light: '#f0f0f0',
        dark: '#262626',
    });

    // Check if user has sen.admin permission (for risk approval only)
    const hasSuperAdminPermission = () => {
        const perms = user?.permission || [];
        return perms.includes('sen.admin');
    };

    const [senAdminCount, setSenAdminCount] = useState<number>(DefaultSenAdminCount);

    const openCreate = () => {
        form.resetFields();
        setOperationType('');
        setUploadedFiles([]);
        setRawData('');
        setCreateVisible(true);
    };

    const openReview = () => {
        if (!hasSuperAdminPermission()) {
            messageApi.error(gLang('adminMain.risk.noPermission'));
            return;
        }
        setReviewVisible(true);
    };

    // Initialize: load approval list (senAdminCount is included in the response)
    useEffect(() => {
        refreshList();
    }, []);

    // Handle route parameter: if id is provided, navigate to detail page
    useEffect(() => {
        if (id) {
            const approvalId = parseInt(id, 10);
            if (!isNaN(approvalId)) {
                navigate(`/risk-approval/${approvalId}`);
            }
        }
    }, [id]);

    const onCreate = async () => {
        // 防抖：如果正在提交，直接返回
        if (isSubmitting) {
            return;
        }

        try {
            const values = await form.validateFields();
            const currentOperationType = values.operationType;

            if (
                !currentOperationType ||
                (currentOperationType !== 'internal' && currentOperationType !== 'external')
            ) {
                messageApi.error(gLang('adminMain.risk.operationTypeRequired'));
                return;
            }

            // Validate attachments
            if (uploadedFiles.length === 0) {
                messageApi.error(gLang('adminMain.risk.attachmentsRequired'));
                form.setFields([
                    { name: 'attachments', errors: [gLang('adminMain.risk.attachmentsRequired')] },
                ]);
                return;
            }

            // 设置提交状态
            setIsSubmitting(true);

            const requestData: any = {
                operationType: currentOperationType,
                attachments: uploadedFiles.length > 0 ? uploadedFiles : null,
                adminNote: values.adminNote || null,
            };

            if (currentOperationType === 'internal') {
                const hoursValue = values.rawData ? parseDuration(values.rawData) : undefined;
                requestData.playerNickname =
                    values.targetChoose || values.target || values.playerNickname || null;
                requestData.playerECID = values.targetChoose || null;
                requestData.operation = values.operation;
                requestData.hours = hoursValue || null;
                requestData.reason = values.reason;
            } else {
                requestData.communityNickname = values.communityNickname || null;
                requestData.targetLocation = values.targetLocation || null;
                requestData.operation = 'external'; // For external operations, we use 'external' as operation type
                requestData.hours = null;
                requestData.reason = ''; // 服外操作不填原因
            }

            await fetchData({
                url: '/risk-approval',
                method: 'POST',
                data: requestData,
                setData: (_response: any) => {
                    setCreateVisible(false);
                    setOperationType('');
                    form.resetFields();
                    setUploadedFiles([]);
                    setRawData('');
                    messageApi.success(gLang('adminMain.risk.submitSuccess'));
                    // Refresh list after a short delay to ensure backend has processed the request
                    setTimeout(() => {
                        refreshList();
                    }, 500);
                },
            });
        } finally {
            // 重置提交状态
            setIsSubmitting(false);
        }
    };

    const refreshList = async () => {
        try {
            await fetchData({
                url: '/risk-approval',
                method: 'GET',
                data: {},
                setData: (data: any) => {
                    const approvals = data.approvals || [];
                    setList(approvals);
                    if (approvals.length > 0 && approvals[0].senAdminCount !== undefined) {
                        setSenAdminCount(approvals[0].senAdminCount || DefaultSenAdminCount);
                    }
                },
            });
        } catch {
            messageApi.error(gLang('adminMain.risk.refreshFailed'));
        }
    };

    const openDetail = (record: ApplicationRecord) => {
        navigate(`/risk-approval/${record.id}`);
    };

    // Attachment preview component
    const AttachmentPreview: React.FC<{ attachments: string[] }> = ({ attachments }) => {
        const [urls, setUrls] = useState<{ [key: string]: string }>({});
        const [loading, setLoading] = useState<boolean>(true);

        useEffect(() => {
            const fetchUrls = async () => {
                const urlPromises =
                    attachments?.map(async attachment => {
                        const fullUrl = `https://ec-user-center.oss-cn-hangzhou.aliyuncs.com/${attachment}`;
                        const tempUrl = await generateTemporaryUrl(fullUrl);
                        return { [attachment]: tempUrl };
                    }) || [];

                const results = await Promise.all(urlPromises);
                const urlMap = results.reduce((acc, urlObj) => ({ ...acc, ...urlObj }), {});
                setUrls(urlMap);
                setLoading(false);
            };

            fetchUrls();
        }, [attachments]);

        return (
            <Flex wrap gap="small">
                <Image.PreviewGroup>
                    {attachments?.map(attachment => {
                        const lowerAttachment = attachment.toLowerCase();
                        if (loading) {
                            return <Spin key={attachment} />;
                        } else if (lowerAttachment.match(/\.(mp4|mov|webm)$/)) {
                            return (
                                <VideoPlayerComponent
                                    key={attachment}
                                    src={urls[attachment] || ''}
                                    width={50}
                                    height={50}
                                />
                            );
                        } else if (lowerAttachment.match(/\.(jpg|jpeg|png|gif|bmp|webp|svg)$/)) {
                            return (
                                <Image
                                    key={attachment}
                                    width={50}
                                    height={50}
                                    src={urls[attachment] || ''}
                                />
                            );
                        } else {
                            return (
                                <Button
                                    type="dashed"
                                    key={attachment}
                                    style={{
                                        whiteSpace: 'normal',
                                        wordBreak: 'break-all',
                                        height: 'auto',
                                        lineHeight: 'normal',
                                        padding: '8px',
                                    }}
                                    onClick={() => window.open(urls[attachment] || '', '_blank')}
                                >
                                    {gLang('adminMain.risk.download')}{' '}
                                    {(() => {
                                        const fileName = attachment.substring(
                                            attachment.lastIndexOf('/') + 1
                                        );
                                        const pattern = /^(\d{14})_(.+)$/;
                                        const match = fileName.match(pattern);
                                        if (match) {
                                            const dateTime = dayjs(
                                                match[1],
                                                'YYYYMMDDHHmmss'
                                            ).format('YYYY-MM-DD HH:mm:ss');
                                            return `[${dateTime}] ${match[2]}`;
                                        } else {
                                            return fileName;
                                        }
                                    })()}
                                </Button>
                            );
                        }
                    })}
                </Image.PreviewGroup>
            </Flex>
        );
    };

    const getSenAdminCount = () => {
        return senAdminCount;
    };

    const [punishConfirmVisible, setPunishConfirmVisible] = useState(false);
    const [punishRecord, setPunishRecord] = useState<ApplicationRecord | null>(null);

    const shouldHighlightPending = (record: ApplicationRecord) =>
        hasSuperAdminPermission() && !record.hasVoted && record.status === 'Pending';
    const getRowClassName = (record: ApplicationRecord) =>
        shouldHighlightPending(record) ? 'risk-approval-row-pending' : '';

    // 直接使用后端返回的 status 字段，不进行前端判断
    const computeDisplayStatus = (rec: ApplicationRecord) => {
        switch (rec.status) {
            case 'Punished':
                return gLang('adminMain.risk.statusText.punished');
            case 'Approved':
                return gLang('adminMain.risk.statusText.approved');
            case 'Rejected':
                return gLang('adminMain.risk.statusText.rejected');
            case 'Pending':
            default:
                // 如果没有投票记录，显示"已提交"，否则显示"等待审核"
                if (!rec.votes || rec.votes.length === 0) {
                    return gLang('adminMain.risk.statusText.submitted');
                }
                return gLang('adminMain.risk.statusText.pending');
        }
    };

    // 获取投票信息（只显示 agrees 和总投票数）

    // Handle vote
    const handleVote = async (record: ApplicationRecord, decision: 'agree' | 'reject') => {
        if (!hasSuperAdminPermission()) {
            messageApi.error(gLang('adminMain.risk.noPermission'));
            return;
        }
        await fetchData({
            url: '/risk-approval/vote',
            method: 'POST',
            data: {
                approvalId: record.id,
                decision,
                reason: null,
            },
            setData: async () => {
                messageApi.success(gLang('adminMain.risk.voteSuccess'));
                // Refresh list to get updated vote information
                await refreshList();
            },
        });
    };

    // Execute punishment
    const doPunish = async (rec: ApplicationRecord) => {
        if (!rec.playerECID) {
            messageApi.error(gLang('adminMain.risk.ecidRequired'));
            return;
        }

        try {
            await fetchData({
                url: '/risk-approval/punish',
                method: 'POST',
                data: {
                    approvalId: rec.id,
                },
                setData: () => {
                    messageApi.success(gLang('adminMain.risk.punishSuccess'));
                    setPunishConfirmVisible(false);
                    setPunishRecord(null);
                    refreshList();
                },
            });
        } catch {
            messageApi.error(gLang('adminMain.risk.punishFailed'));
        }
    };

    const columns: ColumnsType<ApplicationRecord> = [
        {
            title: gLang('adminMain.risk.submittedAt'),
            dataIndex: 'submitTime',
            key: 'submitTime',
            render: t => new Date(t).toLocaleString(),
        },
        {
            title: gLang('adminMain.risk.operationType'),
            dataIndex: 'operationType',
            key: 'operationType',
            render: (type: string) =>
                type === 'external'
                    ? gLang('adminMain.risk.operationTypeExternal')
                    : gLang('adminMain.risk.operationTypeInternal'),
        },
        {
            title: gLang('adminMain.risk.player'),
            dataIndex: 'playerNickname',
            key: 'playerNickname',
            render: (nickname: string | null, record: ApplicationRecord) => {
                if (record.operationType === 'external') {
                    return record.communityNickname || '-';
                }
                return nickname || '-';
            },
        },
        {
            title: gLang('adminMain.risk.agrees'),
            dataIndex: 'agrees',
            key: 'agrees',
        },
        {
            title: gLang('adminMain.risk.rejects'),
            dataIndex: 'rejects',
            key: 'rejects',
        },

        {
            title: gLang('adminMain.risk.status'),
            key: 'displayStatus',
            render: (_, record) => {
                const displayStatus = computeDisplayStatus(record);
                const needsReview = shouldHighlightPending(record);

                return (
                    <Space size="small">
                        <span>{displayStatus}</span>
                        {needsReview && (
                            <Tag color="warning" style={{ margin: 0 }}>
                                {gLang('adminMain.risk.pendingReviewTag')}
                            </Tag>
                        )}
                    </Space>
                );
            },
        },
    ];

    // Add punish column - always show, but display different content based on status
    const columnsWithPunish = [...columns];
    columnsWithPunish.push({
        title: gLang('adminMain.risk.punish'),
        key: 'punish',
        render: (_, record) => {
            // 服外操作：显示"无需服内处罚"
            if (record.operationType === 'external') {
                return (
                    <span style={{ color: mutedTextColor }}>
                        {gLang('adminMain.risk.punishNotNeeded')}
                    </span>
                );
            }

            // 已处罚：显示"已处罚"
            if (record.status === 'Punished') {
                return (
                    <span style={{ color: primaryColor }}>
                        {gLang('adminMain.risk.statusText.punished')}
                    </span>
                );
            }

            // 已拒绝状态：显示"申请被拒"
            if (record.status === 'Rejected') {
                return (
                    <span style={{ color: errorColor }}>
                        {gLang('adminMain.risk.punishRejected')}
                    </span>
                );
            }

            // 已通过状态：显示处罚按钮
            // 只检查后端返回的 status 字段
            if (record.status === 'Approved') {
                return (
                    <Button
                        onClick={() => {
                            setPunishRecord(record);
                            setPunishConfirmVisible(true);
                        }}
                        type="primary"
                    >
                        {gLang('adminMain.risk.punish')}
                    </Button>
                );
            }

            // 未达到通过票数：显示"暂未通过"
            return (
                <span style={{ color: warningColor }}>
                    {gLang('adminMain.risk.punishNotPassed')}
                </span>
            );
        },
    });

    // Mobile card view
    const renderMobileCard = (record: ApplicationRecord) => (
        <Card
            key={record.id}
            style={{ marginBottom: 16 }}
            actions={[
                <Button type="link" onClick={() => openDetail(record)} block>
                    {gLang('adminMain.risk.detail')}
                </Button>,
            ]}
        >
            <Space direction="vertical" style={{ width: '100%' }} size="small">
                <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {gLang('adminMain.risk.submittedAt')}:
                    </Typography.Text>
                    <Typography.Text style={{ marginLeft: 8 }}>
                        {new Date(record.submitTime).toLocaleString()}
                    </Typography.Text>
                </div>
                <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {gLang('adminMain.risk.operationType')}:
                    </Typography.Text>
                    <Typography.Text style={{ marginLeft: 8 }}>
                        {record.operationType === 'external'
                            ? gLang('adminMain.risk.operationTypeExternal')
                            : gLang('adminMain.risk.operationTypeInternal')}
                    </Typography.Text>
                </div>
                <div>
                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                        {gLang('adminMain.risk.player')}:
                    </Typography.Text>
                    <Typography.Text style={{ marginLeft: 8 }}>
                        {record.operationType === 'external'
                            ? record.communityNickname || '-'
                            : record.playerNickname || '-'}
                    </Typography.Text>
                </div>
                <div
                    style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        flexWrap: 'wrap',
                        gap: 8,
                    }}
                >
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('adminMain.risk.agrees')}:
                        </Typography.Text>
                        <Typography.Text style={{ marginLeft: 4 }}>{record.agrees}</Typography.Text>
                    </div>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('adminMain.risk.rejects')}:
                        </Typography.Text>
                        <Typography.Text style={{ marginLeft: 4 }}>
                            {record.rejects}
                        </Typography.Text>
                    </div>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('adminMain.risk.status')}:
                        </Typography.Text>
                        <Typography.Text style={{ marginLeft: 4 }}>
                            {computeDisplayStatus(record)}
                        </Typography.Text>
                        {shouldHighlightPending(record) && (
                            <Tag color="warning" style={{ marginLeft: 4, margin: 0 }}>
                                {gLang('adminMain.risk.pendingReviewTag')}
                            </Tag>
                        )}
                    </div>
                </div>
                {record.operationType === 'internal' && record.status === 'Approved' && (
                    <Button
                        type="primary"
                        block
                        onClick={() => {
                            setPunishRecord(record);
                            setPunishConfirmVisible(true);
                        }}
                    >
                        {gLang('adminMain.risk.punish')}
                    </Button>
                )}
            </Space>
        </Card>
    );

    return (
        <div style={{ width: '100%', padding: screens.xs ? '8px' : '0' }}>
            {messageContextHolder}
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                <Typography>
                    <Typography.Title level={3}>{gLang('adminMain.risk.title')}</Typography.Title>
                    <Typography.Paragraph type="secondary">
                        {gLang('adminMain.risk.intro')}
                    </Typography.Paragraph>
                </Typography>
                <Space wrap={screens.xs}>
                    <Button type="primary" onClick={openCreate}>
                        {gLang('adminMain.risk.create')}
                    </Button>
                    {hasSuperAdminPermission() && (
                        <Button onClick={openReview}>{gLang('adminMain.risk.review')}</Button>
                    )}
                    <Button onClick={refreshList}>{gLang('adminMain.risk.refresh')}</Button>
                </Space>

                {screens.xs ? (
                    <div>{list.map(renderMobileCard)}</div>
                ) : (
                    <Table
                        rowKey="id"
                        columns={columnsWithPunish}
                        dataSource={list}
                        rowClassName={getRowClassName}
                        scroll={{ x: 'max-content' }}
                    />
                )}

                {/* Create Modal */}
                <Modal
                    title={gLang('adminMain.risk.create')}
                    open={createVisible}
                    onCancel={() => {
                        if (isSubmitting) return; // 提交中不允许关闭
                        setCreateVisible(false);
                        setOperationType('');
                        form.resetFields();
                        setUploadedFiles([]);
                        setRawData('');
                        setIsSubmitting(false);
                    }}
                    onOk={onCreate}
                    okText={gLang('adminMain.risk.submit')}
                    confirmLoading={isSubmitting}
                    okButtonProps={{ disabled: isSubmitting }}
                    width={screens.xs ? '95%' : 600}
                    style={{ top: screens.xs ? 20 : undefined }}
                >
                    <Form form={form} layout="vertical">
                        <Form.Item
                            name="operationType"
                            label={gLang('adminMain.risk.operationType')}
                            rules={[
                                {
                                    required: true,
                                    message: gLang('adminMain.risk.operationTypeRequired'),
                                },
                            ]}
                        >
                            <Select
                                onChange={value => {
                                    setOperationType(value);
                                    form.setFieldsValue({ operationType: value });
                                    // Reset form fields when switching type
                                    form.resetFields([
                                        'target',
                                        'targetChoose',
                                        'operation',
                                        'rawData',
                                        'reason',
                                        'communityNickname',
                                        'targetLocation',
                                        'adminNote',
                                    ]);
                                }}
                                placeholder={gLang('adminMain.risk.operationTypePlaceholder')}
                                options={[
                                    {
                                        label: gLang('adminMain.risk.operationTypeInternal'),
                                        value: 'internal',
                                    },
                                    {
                                        label: gLang('adminMain.risk.operationTypeExternal'),
                                        value: 'external',
                                    },
                                ]}
                            />
                        </Form.Item>

                        {(formOperationType === 'internal' || operationType === 'internal') && (
                            <>
                                <Row gutter={12}>
                                    <Col span={24}>
                                        <AccountMatchingFormItem
                                            name="target"
                                            label={gLang('adminMain.risk.playerNickname')}
                                            chooseFieldName="targetChoose"
                                            required={true}
                                            requiredMessage={gLang('adminMain.risk.playerRequired')}
                                        />
                                    </Col>
                                </Row>

                                <Form.Item
                                    name="operation"
                                    label={gLang('adminMain.risk.operation')}
                                    rules={[
                                        {
                                            required: true,
                                            message: gLang('adminMain.risk.operationRequired'),
                                        },
                                    ]}
                                >
                                    <Select
                                        options={[
                                            {
                                                label: gLang('superPanel.actionTypeSelect.ban'),
                                                value: 'ban',
                                            },
                                            {
                                                label: gLang('superPanel.actionTypeSelect.hack'),
                                                value: 'hack',
                                            },
                                        ]}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="rawData"
                                    label={gLang('adminMain.risk.hours')}
                                    rules={[
                                        {
                                            required: true,
                                            message: gLang('adminMain.risk.hoursRequired'),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={gLang('adminMain.risk.hoursPlaceholder')}
                                        value={rawData}
                                        onChange={e => setRawData(e.target.value)}
                                        onBlur={() => {
                                            const hours = parseDuration(rawData);
                                            form.setFieldsValue({ data: hours });
                                        }}
                                    />
                                </Form.Item>
                            </>
                        )}

                        {(formOperationType === 'external' || operationType === 'external') && (
                            <>
                                <Form.Item
                                    name="communityNickname"
                                    label={gLang('adminMain.risk.communityNickname')}
                                    rules={[
                                        {
                                            required: true,
                                            message: gLang(
                                                'adminMain.risk.communityNicknameRequired'
                                            ),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={gLang(
                                            'adminMain.risk.communityNicknamePlaceholder'
                                        )}
                                    />
                                </Form.Item>

                                <Form.Item
                                    name="targetLocation"
                                    label={gLang('adminMain.risk.targetLocation')}
                                    rules={[
                                        {
                                            required: true,
                                            message: gLang('adminMain.risk.targetLocationRequired'),
                                        },
                                    ]}
                                >
                                    <Input
                                        placeholder={gLang(
                                            'adminMain.risk.targetLocationPlaceholder'
                                        )}
                                    />
                                </Form.Item>
                            </>
                        )}

                        {(formOperationType === 'internal' || operationType === 'internal') && (
                            <Form.Item
                                name="reason"
                                label={gLang('adminMain.risk.reason')}
                                rules={[
                                    {
                                        required: true,
                                        message: gLang('adminMain.risk.reasonRequired'),
                                    },
                                ]}
                            >
                                <Input.TextArea rows={4} />
                            </Form.Item>
                        )}

                        <Form.Item
                            name="adminNote"
                            label={gLang('adminMain.risk.adminNote')}
                            extra={gLang('adminMain.risk.adminNoteExtra')}
                            rules={
                                formOperationType === 'external' || operationType === 'external'
                                    ? [
                                          {
                                              required: true,
                                              message: gLang('adminMain.risk.adminNoteRequired'),
                                          },
                                      ]
                                    : []
                            }
                        >
                            <Input.TextArea
                                rows={3}
                                placeholder={
                                    formOperationType === 'external' || operationType === 'external'
                                        ? gLang('adminMain.risk.adminNotePlaceholderRequired')
                                        : gLang('adminMain.risk.adminNotePlaceholder')
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label={gLang('adminMain.risk.attachments')}
                            name="attachments"
                            rules={[
                                {
                                    required: true,
                                    validator: () => {
                                        if (uploadedFiles.length === 0) {
                                            return Promise.reject(
                                                new Error(
                                                    gLang('adminMain.risk.attachmentsRequired')
                                                )
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]}
                            valuePropName="fileList"
                            getValueFromEvent={(e: any) =>
                                Array.isArray(e) ? e : e?.fileList || []
                            }
                        >
                            {contextHolder}
                            <Upload {...uploadProps}>
                                <Button
                                    icon={<UploadOutlined />}
                                    loading={isUploading}
                                    disabled={isUploading}
                                >
                                    {isUploading
                                        ? gLang('files.uploadingText')
                                        : gLang('files.btn')}
                                </Button>
                            </Upload>
                        </Form.Item>
                    </Form>
                </Modal>

                {/* Review Modal */}
                <Modal
                    title={gLang('adminMain.risk.review')}
                    open={reviewVisible}
                    onCancel={() => setReviewVisible(false)}
                    footer={null}
                    width={screens.xs ? '95%' : 1000}
                    style={{ top: screens.xs ? 20 : undefined }}
                >
                    {screens.xs ? (
                        <div>
                            {list
                                .filter(r => r.status !== 'Punished')
                                .map(record => (
                                    <Card key={record.id} style={{ marginBottom: 16 }}>
                                        <Space
                                            direction="vertical"
                                            style={{ width: '100%' }}
                                            size="small"
                                        >
                                            <div>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {gLang('adminMain.risk.submittedAt')}:
                                                </Typography.Text>
                                                <Typography.Text style={{ marginLeft: 8 }}>
                                                    {new Date(record.submitTime).toLocaleString()}
                                                </Typography.Text>
                                            </div>
                                            <div>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {gLang('adminMain.risk.player')}:
                                                </Typography.Text>
                                                <Typography.Text style={{ marginLeft: 8 }}>
                                                    {record.operationType === 'external'
                                                        ? record.communityNickname || '-'
                                                        : record.playerNickname || '-'}
                                                </Typography.Text>
                                            </div>
                                            <div>
                                                <Typography.Text
                                                    type="secondary"
                                                    style={{ fontSize: 12 }}
                                                >
                                                    {gLang('adminMain.risk.operation')}:
                                                </Typography.Text>
                                                <Typography.Text style={{ marginLeft: 8 }}>
                                                    {record.operation}
                                                </Typography.Text>
                                            </div>
                                            <div
                                                style={{
                                                    display: 'flex',
                                                    justifyContent: 'space-between',
                                                    flexWrap: 'wrap',
                                                    gap: 8,
                                                }}
                                            >
                                                <div>
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {gLang('adminMain.risk.agrees')}:
                                                    </Typography.Text>
                                                    <Typography.Text style={{ marginLeft: 4 }}>
                                                        {record.agrees}
                                                    </Typography.Text>
                                                </div>
                                                <div>
                                                    <Typography.Text
                                                        type="secondary"
                                                        style={{ fontSize: 12 }}
                                                    >
                                                        {gLang('adminMain.risk.rejects')}:
                                                    </Typography.Text>
                                                    <Typography.Text style={{ marginLeft: 4 }}>
                                                        {record.rejects}
                                                    </Typography.Text>
                                                </div>
                                            </div>
                                            <Space wrap style={{ width: '100%', marginTop: 8 }}>
                                                <Button
                                                    onClick={() => openDetail(record)}
                                                    size="small"
                                                >
                                                    {gLang('adminMain.risk.detail')}
                                                </Button>
                                                {(() => {
                                                    const userOpenid = user?.openid || '';
                                                    const userUserid = user?.userid
                                                        ? String(user.userid)
                                                        : '';
                                                    const hasVoted =
                                                        record.votes?.some(v => {
                                                            const voteUser = v.user || '';
                                                            return (
                                                                voteUser === userOpenid ||
                                                                voteUser === userUserid
                                                            );
                                                        }) || false;

                                                    const senCount = getSenAdminCount();
                                                    const totalVotes = record.votes?.length || 0;
                                                    const allVoted = totalVotes >= senCount;
                                                    const shouldDisableVoting =
                                                        allVoted && record.status !== 'Rejected';

                                                    if (
                                                        record.status === 'Approved' ||
                                                        record.status === 'Punished'
                                                    ) {
                                                        return (
                                                            <Typography.Text
                                                                type="secondary"
                                                                style={{ fontSize: 12 }}
                                                            >
                                                                {record.status === 'Approved'
                                                                    ? gLang(
                                                                          'adminMain.risk.approvalApproved'
                                                                      )
                                                                    : gLang(
                                                                          'adminMain.risk.statusText.punished'
                                                                      )}
                                                            </Typography.Text>
                                                        );
                                                    }

                                                    if (shouldDisableVoting) {
                                                        return (
                                                            <Typography.Text
                                                                type="secondary"
                                                                style={{ fontSize: 12 }}
                                                            >
                                                                {gLang('adminMain.risk.allVoted')}
                                                            </Typography.Text>
                                                        );
                                                    }

                                                    if (!hasVoted) {
                                                        return (
                                                            <>
                                                                <Button
                                                                    type="primary"
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleVote(record, 'agree')
                                                                    }
                                                                >
                                                                    {gLang('adminMain.risk.agree')}
                                                                </Button>
                                                                <Button
                                                                    danger
                                                                    size="small"
                                                                    onClick={() =>
                                                                        handleVote(record, 'reject')
                                                                    }
                                                                >
                                                                    {gLang('adminMain.risk.reject')}
                                                                </Button>
                                                            </>
                                                        );
                                                    }

                                                    return (
                                                        <Typography.Text
                                                            type="secondary"
                                                            style={{ fontSize: 12 }}
                                                        >
                                                            {gLang('adminMain.risk.voted')}
                                                        </Typography.Text>
                                                    );
                                                })()}
                                            </Space>
                                        </Space>
                                    </Card>
                                ))}
                        </div>
                    ) : (
                        <Table
                            rowKey="id"
                            dataSource={list.filter(r => r.status !== 'Punished')}
                            rowClassName={getRowClassName}
                            columns={[
                                {
                                    title: gLang('adminMain.risk.submittedAt'),
                                    dataIndex: 'submitTime',
                                    key: 'submitTime',
                                    render: t => new Date(t).toLocaleString(),
                                },
                                {
                                    title: gLang('adminMain.risk.player'),
                                    dataIndex: 'playerNickname',
                                    key: 'playerNickname',
                                    render: (
                                        nickname: string | null,
                                        record: ApplicationRecord
                                    ) => {
                                        if (record.operationType === 'external') {
                                            return record.communityNickname || '-';
                                        }
                                        return nickname || '-';
                                    },
                                },
                                {
                                    title: gLang('adminMain.risk.operation'),
                                    dataIndex: 'operation',
                                    key: 'operation',
                                },
                                {
                                    title: gLang('adminMain.risk.agrees'),
                                    dataIndex: 'agrees',
                                    key: 'agrees',
                                },
                                {
                                    title: gLang('adminMain.risk.rejects'),
                                    dataIndex: 'rejects',
                                    key: 'rejects',
                                },
                                {
                                    title: gLang('adminMain.risk.actions'),
                                    key: 'actions',
                                    render: (_, record) => {
                                        // If approval is approved or punished, no more votes allowed
                                        if (
                                            record.status === 'Approved' ||
                                            record.status === 'Punished'
                                        ) {
                                            return (
                                                <Space>
                                                    <Button onClick={() => openDetail(record)}>
                                                        {gLang('adminMain.risk.detail')}
                                                    </Button>
                                                    <span style={{ color: mutedTextColor }}>
                                                        {record.status === 'Approved'
                                                            ? gLang(
                                                                  'adminMain.risk.approvalApproved'
                                                              )
                                                            : gLang(
                                                                  'adminMain.risk.statusText.punished'
                                                              )}
                                                    </span>
                                                </Space>
                                            );
                                        }

                                        // Check both openid and userid to match the voter
                                        const userOpenid = user?.openid || '';
                                        const userUserid = user?.userid ? String(user.userid) : '';
                                        const hasVoted =
                                            record.votes?.some(v => {
                                                const voteUser = v.user || '';
                                                return (
                                                    voteUser === userOpenid ||
                                                    voteUser === userUserid
                                                );
                                            }) || false;

                                        // Disable voting if: all sen.admin have voted AND status is not Rejected
                                        // Note: Rejected status doesn't disable voting, so users can still vote
                                        const senCount = getSenAdminCount();
                                        const totalVotes = record.votes?.length || 0;
                                        const allVoted = totalVotes >= senCount;
                                        const shouldDisableVoting =
                                            allVoted && record.status !== 'Rejected';

                                        return (
                                            <Space>
                                                <Button onClick={() => openDetail(record)}>
                                                    {gLang('adminMain.risk.detail')}
                                                </Button>
                                                {shouldDisableVoting ? (
                                                    <span style={{ color: mutedTextColor }}>
                                                        {gLang('adminMain.risk.allVoted')}
                                                    </span>
                                                ) : !hasVoted ? (
                                                    <>
                                                        <Button
                                                            type="primary"
                                                            onClick={() =>
                                                                handleVote(record, 'agree')
                                                            }
                                                        >
                                                            {gLang('adminMain.risk.agree')}
                                                        </Button>
                                                        <Button
                                                            danger
                                                            onClick={() =>
                                                                handleVote(record, 'reject')
                                                            }
                                                        >
                                                            {gLang('adminMain.risk.reject')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <span>{gLang('adminMain.risk.voted')}</span>
                                                )}
                                            </Space>
                                        );
                                    },
                                },
                            ]}
                            scroll={{ x: 'max-content' }}
                        />
                    )}
                </Modal>

                {/* Punish Confirm Modal */}
                <Modal
                    title={gLang('adminMain.risk.punish')}
                    open={punishConfirmVisible}
                    onCancel={() => {
                        setPunishConfirmVisible(false);
                        setPunishRecord(null);
                    }}
                    onOk={() => {
                        if (punishRecord) {
                            doPunish(punishRecord);
                        }
                    }}
                    okText={gLang('common.confirm')}
                    cancelText={gLang('common.cancel')}
                    width={screens.xs ? '95%' : 600}
                    style={{ top: screens.xs ? 20 : undefined }}
                >
                    {punishRecord && (
                        <div>
                            <div>
                                <strong>{gLang('adminMain.risk.player')}:</strong>{' '}
                                {punishRecord.playerNickname}{' '}
                                {punishRecord.playerECID ? `(${punishRecord.playerECID})` : ''}
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <strong>{gLang('adminMain.risk.operation')}:</strong>{' '}
                                {punishRecord.operation}
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <strong>{gLang('adminMain.risk.hours')}:</strong>{' '}
                                {typeof punishRecord.hours === 'number'
                                    ? `${punishRecord.hours} ${gLang('adminMain.risk.hoursUnit')}`
                                    : gLang('adminMain.risk.notSpecified')}
                            </div>
                            <div style={{ marginTop: 8 }}>
                                <strong>{gLang('adminMain.risk.reason')}:</strong>{' '}
                                {punishRecord.reason}
                            </div>
                            {hasSuperAdminPermission() && (
                                <div style={{ marginTop: 8 }}>
                                    <strong>{gLang('adminMain.risk.adminNote')}:</strong>
                                    <div style={{ marginTop: 4 }}>
                                        {punishRecord.adminNote ? (
                                            <div
                                                style={{
                                                    padding: 12,
                                                    background: inputBackground,
                                                    borderRadius: 4,
                                                }}
                                            >
                                                {punishRecord.adminNote}
                                            </div>
                                        ) : (
                                            <span>{gLang('adminMain.risk.noAttachments')}</span>
                                        )}
                                    </div>
                                </div>
                            )}
                            <div style={{ marginTop: 8 }}>
                                <strong>{gLang('adminMain.risk.attachments')}:</strong>
                                <div style={{ marginTop: 8 }}>
                                    {punishRecord.attachments && punishRecord.attachments.length ? (
                                        <AttachmentPreview attachments={punishRecord.attachments} />
                                    ) : (
                                        <span>{gLang('adminMain.risk.noAttachments')}</span>
                                    )}
                                </div>
                            </div>
                            <div style={{ marginTop: 12, color: mutedTextColor }}>
                                * {gLang('adminMain.risk.punishInfo')}
                            </div>
                        </div>
                    )}
                </Modal>
            </Space>
        </div>
    );
};

export default RiskApproval;
