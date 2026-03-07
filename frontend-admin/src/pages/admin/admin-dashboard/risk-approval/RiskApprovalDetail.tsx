import React, { useState, useEffect } from 'react';
import {
    Button,
    Modal,
    Space,
    Typography,
    message,
    Spin,
    Flex,
    Image,
    Form,
    Input,
    Card,
    Descriptions,
    Tag,
    Divider,
    Row,
    Col,
} from 'antd';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { gLang } from '@common/language';
import { useAuth } from '@common/contexts/AuthContext';
import axiosInstance from '@common/axiosConfig';
import VideoPlayerComponent from '../../../../components/VideoPlayerComponent';
import dayjs from 'dayjs';
import { generateTemporaryUrl } from '@common/utils/uploadUtils';
import { ArrowLeftOutlined, EyeOutlined } from '@ant-design/icons';
import PlayerDetailPunishInfo from '../../ticket/ticket-operate/components/player-action-card/PlayerDetailPunishInfo';
import SuperPanelPlayerComponent from '../../panel/components/SuperPanelPlayerComponent';
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
    createdBy?: string | null;
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
    votesNeeded?: number;
    requiredAgrees?: number;
    senAdminCount?: number;
};

const { useBreakpoint } = Grid;

const RiskApprovalDetail: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [searchParams] = useSearchParams();
    const { user } = useAuth();
    const screens = useBreakpoint();
    const { getThemeColor } = useTheme();
    const [current, setCurrent] = useState<ApplicationRecord | null>(null);
    const [loading, setLoading] = useState(true);
    const [punishConfirmVisible, setPunishConfirmVisible] = useState(false);
    const [messageApi, messageContextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [previewEcid, setPreviewEcid] = useState<string | null>(null);
    const [previewDefaultTab, setPreviewDefaultTab] = useState<string | undefined>(undefined);
    const [previewInitialSettings, setPreviewInitialSettings] = useState<any>(undefined);

    // 从 URL 中获取 token
    const token = searchParams.get('token');

    // Theme colors
    const cardBackground = getThemeColor({
        light: '#fafafa',
        dark: '#1f1f1f',
    });
    const inputBackground = getThemeColor({
        light: '#f0f0f0',
        dark: '#262626',
    });
    const mutedTextColor = getThemeColor({
        light: '#999',
        dark: '#8c8c8c',
    });

    const handlePreview = (ecid: string, defaultTab?: string, initialSettings?: unknown) => {
        setPreviewEcid(ecid);
        setPreviewDefaultTab(defaultTab);
        setPreviewInitialSettings(initialSettings);
    };

    const handleClosePreview = () => {
        setPreviewEcid(null);
        setPreviewDefaultTab(undefined);
        setPreviewInitialSettings(undefined);
    };

    // Check if user has sen.admin permission
    const hasSuperAdminPermission = () => {
        if (!user) return false;
        const perms = user?.permission || [];
        return perms.includes('sen.admin');
    };

    const canVote = () => {
        return hasSuperAdminPermission();
    };

    const shouldShowVotingSection = () => {
        // Only show voting section to users with voting permission (super admins)
        // Creators can see voting progress but not the voting section
        return hasSuperAdminPermission();
    };

    const canViewPunishment = () => {
        if (!current) return false;
        if (current.operationType !== 'internal') return false;
        if (current.status !== 'Approved') return false;
        if (token) return true;
        if (hasSuperAdminPermission()) return true;
        return current.createdBy === user?.openid || current.createdBy === user?.userid;
    };

    const getSenAdminCount = () => {
        return current?.senAdminCount || 5;
    };

    useEffect(() => {
        if (id) {
            const approvalId = parseInt(id, 10);
            if (!isNaN(approvalId)) {
                setLoading(true);
                // 如果有 token，使用 axiosInstance 直接请求并添加 token 到请求头
                const requestConfig = token
                    ? {
                          headers: {
                              'x-risk-approval-token': token,
                          },
                      }
                    : {};

                axiosInstance
                    .get(`/risk-approval/${approvalId}`, requestConfig)
                    .then((response: any) => {
                        if (response.data.approval) {
                            setCurrent(response.data.approval);
                            setLoading(false);
                        } else {
                            const errorMsg =
                                response.data.message || gLang('adminMain.risk.notFound');
                            setTimeout(() => {
                                messageApi.error(errorMsg);
                            }, 0);
                            setTimeout(() => {
                                navigate('/risk-approval');
                            }, 100);
                            setLoading(false);
                        }
                    })
                    .catch((error: any) => {
                        const errorMessage =
                            error?.response?.data?.message ||
                            error?.response?.data?.EPF_description ||
                            gLang('adminMain.risk.loadFailed');
                        setTimeout(() => {
                            messageApi.error(errorMessage);
                        }, 0);
                        setTimeout(() => {
                            navigate('/risk-approval');
                        }, 100);
                        setLoading(false);
                    });
            } else {
                navigate('/risk-approval');
            }
        }
    }, [id, token]);

    const refreshDetail = async () => {
        if (id) {
            const approvalId = parseInt(id, 10);
            if (!isNaN(approvalId)) {
                const requestConfig = token
                    ? {
                          headers: {
                              'x-risk-approval-token': token,
                          },
                      }
                    : {};

                const response = await axiosInstance.get(
                    `/risk-approval/${approvalId}`,
                    requestConfig
                );
                if (response.data.approval) {
                    setCurrent(response.data.approval);
                }
            }
        }
    };

    const handleVote = async (
        approval: ApplicationRecord,
        decision: 'agree' | 'reject',
        reason?: string
    ) => {
        if (!canVote()) {
            messageApi.error(gLang('adminMain.risk.noPermission'));
            return;
        }

        if (approval.status === 'Approved' || approval.status === 'Punished') {
            messageApi.warning(gLang('adminMain.risk.approvalApproved'));
            await refreshDetail();
            return;
        }

        try {
            const requestConfig = token
                ? {
                      headers: {
                          'x-risk-approval-token': token,
                      },
                  }
                : {};

            await axiosInstance.post(
                '/risk-approval/vote',
                {
                    approvalId: approval.id,
                    decision,
                    reason: reason || null,
                },
                requestConfig
            );
            messageApi.success(gLang('adminMain.risk.voteSuccess'));
            await refreshDetail();
        } catch (error: any) {
            const errorMessage =
                error?.response?.data?.message ||
                error?.response?.data?.EPF_description ||
                gLang('adminMain.risk.voteFailed');
            messageApi.error(errorMessage);
            await refreshDetail();
        }
    };

    const doPunish = async (approval: ApplicationRecord) => {
        if (!approval.playerECID) {
            messageApi.error(gLang('adminMain.risk.ecidRequired'));
            return;
        }

        try {
            const requestConfig = token
                ? {
                      headers: {
                          'x-risk-approval-token': token,
                      },
                  }
                : {};

            await axiosInstance.post(
                '/risk-approval/punish',
                {
                    approvalId: approval.id,
                },
                requestConfig
            );
            messageApi.success(gLang('adminMain.risk.punishSuccess'));
            setPunishConfirmVisible(false);
            await refreshDetail();
        } catch (error: any) {
            messageApi.error(
                error?.response?.data?.message || gLang('adminMain.risk.punishFailed')
            );
        }
    };

    const hasPassed = (rec: ApplicationRecord) => {
        return rec.status === 'Approved';
    };

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

    const getVoteInfo = (rec: ApplicationRecord): { agrees: number; total: number } => {
        // Use requiredAgrees directly from backend, no calculation needed
        return {
            agrees: rec.agrees || 0,
            total: rec.requiredAgrees || 0,
        };
    };

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

    if (loading) {
        return (
            <div style={{ padding: 50, textAlign: 'center' }}>
                <Spin size="large" />
            </div>
        );
    }

    if (!current) {
        return (
            <div style={{ padding: 50, textAlign: 'center' }}>
                <Typography.Text>{gLang('adminMain.risk.notFound')}</Typography.Text>
                <br />
                <Button onClick={() => navigate('/risk-approval')} style={{ marginTop: 16 }}>
                    {gLang('common.back')}
                </Button>
            </div>
        );
    }

    const getStatusTag = () => {
        const status = computeDisplayStatus(current);
        const submittedText = gLang('adminMain.risk.statusText.submitted');
        const pendingText = gLang('adminMain.risk.statusText.pending');
        const approvedText = gLang('adminMain.risk.statusText.approved');
        const rejectedText = gLang('adminMain.risk.statusText.rejected');
        const punishedText = gLang('adminMain.risk.statusText.punished');

        const statusMap: { [key: string]: { color: string; text: string } } = {
            [submittedText]: { color: 'default', text: status },
            [pendingText]: { color: 'processing', text: status },
            [approvedText]: { color: 'success', text: status },
            [rejectedText]: { color: 'error', text: status },
            [punishedText]: { color: 'success', text: status },
        };
        const statusInfo = statusMap[status] || { color: 'default', text: status };
        return <Tag color={statusInfo.color}>{statusInfo.text}</Tag>;
    };

    return (
        <div style={{ width: '100%', padding: screens.xs ? '8px' : '0' }}>
            {messageContextHolder}
            {modalContextHolder}
            <Space direction="vertical" style={{ width: '100%' }} size="middle">
                {/* Header */}
                <div
                    style={{
                        display: 'flex',
                        alignItems: 'center',
                        gap: screens.xs ? 8 : 16,
                        flexWrap: 'wrap',
                    }}
                >
                    <Button
                        icon={<ArrowLeftOutlined />}
                        onClick={() => navigate('/risk-approval')}
                        size={screens.xs ? 'small' : 'middle'}
                    >
                        {gLang('common.back')}
                    </Button>
                    <Typography.Title
                        level={screens.xs ? 4 : 3}
                        style={{ margin: 0, flex: 1, minWidth: screens.xs ? 0 : 200 }}
                    >
                        {gLang('adminMain.risk.detail')}
                    </Typography.Title>
                    {getStatusTag()}
                </div>

                {/* Basic Information */}
                <div>
                    <Typography.Title level={5} style={{ marginBottom: screens.xs ? 12 : 16 }}>
                        {gLang('adminMain.risk.basicInfo')}
                    </Typography.Title>
                    <Descriptions
                        column={{ xs: 1, sm: 1, md: 2, lg: 2, xl: 2, xxl: 2 }}
                        bordered
                        size={screens.xs ? 'small' : 'middle'}
                    >
                        <Descriptions.Item label={gLang('adminMain.risk.submittedAt')}>
                            {new Date(current.submitTime).toLocaleString()}
                        </Descriptions.Item>
                        <Descriptions.Item label={gLang('adminMain.risk.operationType')}>
                            <Tag color={current.operationType === 'internal' ? 'blue' : 'green'}>
                                {current.operationType === 'external'
                                    ? gLang('adminMain.risk.operationTypeExternal')
                                    : gLang('adminMain.risk.operationTypeInternal')}
                            </Tag>
                        </Descriptions.Item>

                        {current.operationType === 'internal' ? (
                            <>
                                <Descriptions.Item label={gLang('adminMain.risk.player')}>
                                    {current.playerNickname || '-'}{' '}
                                    {current.playerECID ? `(${current.playerECID})` : ''}
                                </Descriptions.Item>
                                <Descriptions.Item label={gLang('adminMain.risk.operation')}>
                                    <Tag color={current.operation === 'ban' ? 'red' : 'orange'}>
                                        {current.operation === 'ban'
                                            ? gLang('superPanel.actionTypeSelect.ban')
                                            : gLang('superPanel.actionTypeSelect.hack')}
                                    </Tag>
                                </Descriptions.Item>
                                <Descriptions.Item label={gLang('adminMain.risk.hours')}>
                                    {typeof current.hours === 'number'
                                        ? `${current.hours} ${gLang('adminMain.risk.hoursUnit')}`
                                        : gLang('adminMain.risk.notSpecified')}
                                </Descriptions.Item>
                                <Descriptions.Item
                                    label={gLang('adminMain.risk.reasonshort')}
                                    span={2}
                                >
                                    <div
                                        style={{ wordBreak: 'break-word', whiteSpace: 'pre-wrap' }}
                                    >
                                        {current.reason || '-'}
                                    </div>
                                </Descriptions.Item>
                            </>
                        ) : (
                            <>
                                <Descriptions.Item
                                    label={gLang('adminMain.risk.communityNickname')}
                                >
                                    {current.communityNickname || '-'}
                                </Descriptions.Item>
                                <Descriptions.Item label={gLang('adminMain.risk.targetLocation')}>
                                    {current.targetLocation || '-'}
                                </Descriptions.Item>
                            </>
                        )}
                    </Descriptions>
                </div>

                {/* Player Detail Punish Info - Only for internal operations with voting permission */}
                {current.operationType === 'internal' &&
                    hasSuperAdminPermission() &&
                    current.playerECID && (
                        <div>
                            <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />
                            <Typography.Title
                                level={5}
                                style={{ marginTop: 0, marginBottom: screens.xs ? 12 : 16 }}
                            >
                                {gLang('adminMain.risk.playerPunishInfo')}
                            </Typography.Title>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <PlayerDetailPunishInfo
                                    ecid={current.playerECID}
                                    column={screens.md ? 2 : 1}
                                    action={
                                        screens.lg && (
                                            <Button
                                                icon={<EyeOutlined />}
                                                onClick={() =>
                                                    handlePreview(current.playerECID || '')
                                                }
                                                disabled={!current.playerECID}
                                            >
                                                {gLang('ticketOperate.actionTo')}
                                            </Button>
                                        )
                                    }
                                />

                                {!screens.lg && (
                                    <Button
                                        block
                                        icon={<EyeOutlined />}
                                        onClick={() => handlePreview(current.playerECID || '')}
                                        disabled={!current.playerECID}
                                    >
                                        {gLang('ticketOperate.actionTo')}
                                    </Button>
                                )}
                            </Space>
                        </div>
                    )}

                {/* Admin Note and Attachments */}
                <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />
                <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
                    <Col xs={24} lg={12}>
                        <Typography.Title
                            level={5}
                            style={{ marginTop: 0, marginBottom: screens.xs ? 12 : 16 }}
                        >
                            {gLang('adminMain.risk.adminNote')}
                        </Typography.Title>
                        {current.adminNote ? (
                            <div
                                style={{
                                    whiteSpace: 'pre-wrap',
                                    wordBreak: 'break-word',
                                    fontSize: screens.xs ? 13 : 14,
                                }}
                            >
                                {current.adminNote}
                            </div>
                        ) : (
                            <Typography.Text type="secondary">
                                {gLang('adminMain.risk.noAttachments')}
                            </Typography.Text>
                        )}
                    </Col>
                    <Col xs={24} lg={12}>
                        <Typography.Title
                            level={5}
                            style={{ marginTop: 0, marginBottom: screens.xs ? 12 : 16 }}
                        >
                            {gLang('adminMain.risk.attachments')}
                        </Typography.Title>
                        {current.attachments && current.attachments.length ? (
                            <AttachmentPreview attachments={current.attachments} />
                        ) : (
                            <Typography.Text type="secondary">
                                {gLang('adminMain.risk.noAttachments')}
                            </Typography.Text>
                        )}
                    </Col>
                </Row>

                {/* Voting Progress and Punishment */}
                <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />
                <Row gutter={[screens.xs ? 8 : 16, screens.xs ? 8 : 16]}>
                    {!hasPassed(current) &&
                        (() => {
                            const voteInfo = getVoteInfo(current);
                            if (voteInfo.total > 0) {
                                return (
                                    <Col
                                        xs={24}
                                        lg={current.operationType === 'internal' ? 12 : 24}
                                    >
                                        <Typography.Title
                                            level={5}
                                            style={{
                                                marginTop: 0,
                                                marginBottom: screens.xs ? 12 : 16,
                                            }}
                                        >
                                            {gLang('adminMain.risk.votingProgress')}
                                        </Typography.Title>
                                        <Space
                                            direction="vertical"
                                            style={{ width: '100%' }}
                                            size={screens.xs ? 'small' : 'middle'}
                                        >
                                            <div>
                                                <Typography.Text
                                                    strong
                                                    style={{ fontSize: screens.xs ? 13 : 14 }}
                                                >
                                                    {gLang('adminMain.risk.voteInfo')}:
                                                </Typography.Text>
                                                <Typography.Text
                                                    style={{
                                                        marginLeft: 8,
                                                        fontSize: screens.xs ? 13 : 14,
                                                    }}
                                                >
                                                    {voteInfo.agrees} / {voteInfo.total}
                                                </Typography.Text>
                                            </div>
                                            <div>
                                                <Typography.Text
                                                    strong
                                                    style={{ fontSize: screens.xs ? 13 : 14 }}
                                                >
                                                    {gLang('adminMain.risk.currentStatus')}:
                                                </Typography.Text>
                                                <span style={{ marginLeft: 8 }}>
                                                    {getStatusTag()}
                                                </span>
                                            </div>
                                        </Space>
                                    </Col>
                                );
                            }
                            return null;
                        })()}

                    {/* Punishment Section - Only for internal operations */}
                    {current.operationType === 'internal' && (
                        <Col xs={24} lg={12}>
                            <Typography.Title
                                level={5}
                                style={{ marginTop: 0, marginBottom: screens.xs ? 12 : 16 }}
                            >
                                {gLang('adminMain.risk.punishment')}
                            </Typography.Title>
                            {canViewPunishment() ? (
                                <Space
                                    direction="vertical"
                                    style={{ width: '100%' }}
                                    size={screens.xs ? 'small' : 'middle'}
                                >
                                    <Typography.Text
                                        type="success"
                                        style={{ fontSize: screens.xs ? 13 : 14 }}
                                    >
                                        {gLang('adminMain.risk.passed')}
                                    </Typography.Text>
                                    <Button
                                        type="primary"
                                        size={screens.xs ? 'middle' : 'large'}
                                        onClick={() => setPunishConfirmVisible(true)}
                                        block
                                    >
                                        {gLang('adminMain.risk.punish')}
                                    </Button>
                                </Space>
                            ) : (
                                <Typography.Text
                                    type="secondary"
                                    style={{ fontSize: screens.xs ? 13 : 14 }}
                                >
                                    {current.status === 'Punished'
                                        ? gLang('adminMain.risk.statusText.punished')
                                        : current.status === 'Approved'
                                          ? gLang('adminMain.risk.passed')
                                          : gLang('adminMain.risk.notPassed')}
                                </Typography.Text>
                            )}
                        </Col>
                    )}
                </Row>

                {/* Voting Section for sen.admin or creator */}
                {shouldShowVotingSection() && (
                    <div>
                        <Divider style={{ margin: screens.xs ? '16px 0' : '24px 0' }} />
                        <Typography.Title
                            level={5}
                            style={{ marginTop: 0, marginBottom: screens.xs ? 12 : 16 }}
                        >
                            {gLang('adminMain.risk.voting')}
                        </Typography.Title>
                        {(() => {
                            const userOpenid = user?.openid || '';
                            const userUserid = user?.userid ? String(user.userid) : '';
                            const hasVoted =
                                current.votes?.some(v => {
                                    const voteUser = v.user || '';
                                    return voteUser === userOpenid || voteUser === userUserid;
                                }) || false;

                            const senCount = getSenAdminCount();
                            const totalVotes = current.votes?.length || 0;
                            const allVoted = totalVotes >= senCount;
                            const shouldDisableVoting = allVoted && current.status !== 'Rejected';
                            const canVote =
                                current.status !== 'Approved' &&
                                current.status !== 'Punished' &&
                                !shouldDisableVoting;

                            return (
                                <Space
                                    direction="vertical"
                                    style={{ width: '100%' }}
                                    size={screens.xs ? 'small' : 'middle'}
                                >
                                    {canVote && !hasVoted ? (
                                        <Space wrap style={{ width: '100%' }}>
                                            <Button
                                                type="primary"
                                                size={screens.xs ? 'middle' : 'large'}
                                                onClick={() => handleVote(current, 'agree')}
                                                block={screens.xs}
                                            >
                                                {gLang('adminMain.risk.agree')}
                                            </Button>
                                            <Button
                                                danger
                                                size={screens.xs ? 'middle' : 'large'}
                                                onClick={() => {
                                                    modal.confirm({
                                                        title: gLang(
                                                            'adminMain.risk.rejectConfirm'
                                                        ),
                                                        content: (
                                                            <Form
                                                                onFinish={vals => {
                                                                    handleVote(
                                                                        current,
                                                                        'reject',
                                                                        vals.rejectReason
                                                                    );
                                                                    Modal.destroyAll();
                                                                }}
                                                            >
                                                                <Form.Item
                                                                    name="rejectReason"
                                                                    rules={[{ required: false }]}
                                                                >
                                                                    <Input.TextArea
                                                                        rows={3}
                                                                        placeholder={gLang(
                                                                            'adminMain.risk.rejectReasonPlaceholder'
                                                                        )}
                                                                    />
                                                                </Form.Item>
                                                                <Form.Item>
                                                                    <Button
                                                                        htmlType="submit"
                                                                        type="primary"
                                                                        danger
                                                                    >
                                                                        {gLang('common.submit')}
                                                                    </Button>
                                                                </Form.Item>
                                                            </Form>
                                                        ),
                                                        okButtonProps: {
                                                            style: { display: 'none' },
                                                        },
                                                        cancelText: gLang('common.cancel'),
                                                        width: screens.xs ? '95%' : undefined,
                                                        style: { top: screens.xs ? 20 : undefined },
                                                    });
                                                }}
                                                block={screens.xs}
                                            >
                                                {gLang('adminMain.risk.reject')}
                                            </Button>
                                        </Space>
                                    ) : hasVoted ? (
                                        <Tag
                                            color="success"
                                            style={{
                                                fontSize: screens.xs ? 12 : 14,
                                                padding: screens.xs ? '2px 8px' : '4px 12px',
                                            }}
                                        >
                                            {gLang('adminMain.risk.voted')}
                                        </Tag>
                                    ) : shouldDisableVoting ? (
                                        <Typography.Text
                                            type="secondary"
                                            style={{ fontSize: screens.xs ? 13 : 14 }}
                                        >
                                            {gLang('adminMain.risk.allVoted')}
                                        </Typography.Text>
                                    ) : (
                                        <Typography.Text
                                            type="secondary"
                                            style={{ fontSize: screens.xs ? 13 : 14 }}
                                        >
                                            {current.status === 'Approved'
                                                ? gLang('adminMain.risk.approvalApproved')
                                                : gLang('adminMain.risk.statusText.punished')}
                                        </Typography.Text>
                                    )}

                                    <Divider style={{ margin: screens.xs ? '8px 0' : '16px 0' }} />

                                    {/* Voting records */}
                                    {current.votes && current.votes.length > 0 && (
                                        <div>
                                            <Typography.Title
                                                level={screens.xs ? 5 : 4}
                                                style={{ fontSize: screens.xs ? 14 : 16 }}
                                            >
                                                {gLang('adminMain.risk.votingRecords')}
                                            </Typography.Title>
                                            <Space
                                                direction="vertical"
                                                style={{ width: '100%' }}
                                                size="small"
                                            >
                                                {current.votes.map((vote, index) => (
                                                    <Card
                                                        key={index}
                                                        size="small"
                                                        style={{ background: cardBackground }}
                                                    >
                                                        <Space
                                                            direction="vertical"
                                                            size="small"
                                                            style={{ width: '100%' }}
                                                        >
                                                            <div>
                                                                <Typography.Text
                                                                    strong
                                                                    style={{
                                                                        fontSize: screens.xs
                                                                            ? 12
                                                                            : 14,
                                                                    }}
                                                                >
                                                                    {vote.user}
                                                                </Typography.Text>
                                                                <Tag
                                                                    color={
                                                                        vote.decision === 'agree'
                                                                            ? 'success'
                                                                            : 'error'
                                                                    }
                                                                    style={{
                                                                        marginLeft: 8,
                                                                        fontSize: screens.xs
                                                                            ? 11
                                                                            : 12,
                                                                    }}
                                                                >
                                                                    {vote.decision === 'agree'
                                                                        ? gLang(
                                                                              'adminMain.risk.agree'
                                                                          )
                                                                        : gLang(
                                                                              'adminMain.risk.reject'
                                                                          )}
                                                                </Tag>
                                                            </div>
                                                            {vote.reason && (
                                                                <Typography.Text
                                                                    type="secondary"
                                                                    style={{
                                                                        display: 'block',
                                                                        fontSize: screens.xs
                                                                            ? 12
                                                                            : 13,
                                                                    }}
                                                                >
                                                                    {vote.reason}
                                                                </Typography.Text>
                                                            )}
                                                            <Typography.Text
                                                                type="secondary"
                                                                style={{
                                                                    fontSize: screens.xs ? 11 : 12,
                                                                }}
                                                            >
                                                                {new Date(vote.at).toLocaleString()}
                                                            </Typography.Text>
                                                        </Space>
                                                    </Card>
                                                ))}
                                            </Space>
                                        </div>
                                    )}
                                </Space>
                            );
                        })()}
                    </div>
                )}
            </Space>

            {/* Punish Confirm Modal */}
            <Modal
                title={gLang('adminMain.risk.punish')}
                open={punishConfirmVisible}
                onCancel={() => setPunishConfirmVisible(false)}
                onOk={() => {
                    if (current) {
                        doPunish(current);
                    }
                }}
                okText={gLang('common.confirm')}
                cancelText={gLang('common.cancel')}
                width={screens.xs ? '95%' : 600}
                style={{ top: screens.xs ? 20 : undefined }}
            >
                {current && (
                    <div>
                        <div>
                            <strong>{gLang('adminMain.risk.player')}:</strong>{' '}
                            {current.playerNickname}{' '}
                            {current.playerECID ? `(${current.playerECID})` : ''}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <strong>{gLang('adminMain.risk.operation')}:</strong>{' '}
                            {current.operation}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <strong>{gLang('adminMain.risk.hours')}:</strong>{' '}
                            {typeof current.hours === 'number'
                                ? `${current.hours} ${gLang('adminMain.risk.hoursUnit')}`
                                : gLang('adminMain.risk.notSpecified')}
                        </div>
                        <div style={{ marginTop: 8 }}>
                            <strong>{gLang('adminMain.risk.reasonshort')}:</strong> {current.reason}
                        </div>
                        {hasSuperAdminPermission() && (
                            <div style={{ marginTop: 8 }}>
                                <strong>{gLang('adminMain.risk.adminNote')}:</strong>
                                <div style={{ marginTop: 4 }}>
                                    {current.adminNote ? (
                                        <div
                                            style={{
                                                padding: 12,
                                                background: inputBackground,
                                                borderRadius: 4,
                                            }}
                                        >
                                            {current.adminNote}
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
                                {current.attachments && current.attachments.length ? (
                                    <AttachmentPreview attachments={current.attachments} />
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

            {/* Player Detail Preview Modal */}
            <Modal
                title={`${gLang('ticketOperate.modifyPlayer')}${previewEcid}`}
                open={!!previewEcid}
                onCancel={handleClosePreview}
                footer={null}
                width={screens.xs ? '100%' : '100%'}
                centered
                style={{ maxWidth: screens.xs ? '100%' : 1000, top: screens.xs ? 0 : undefined }}
            >
                <div
                    style={{
                        overflowX: 'hidden',
                        overflowY: 'scroll',
                        marginTop: '20px',
                        minHeight: '88vh',
                    }}
                >
                    {previewEcid && (
                        <SuperPanelPlayerComponent
                            key={previewEcid}
                            ecid={previewEcid}
                            tid={null}
                            defaultTab={previewDefaultTab}
                            initialSettings={previewInitialSettings}
                            setDoRefresh={() => {}}
                        />
                    )}
                </div>
            </Modal>
        </div>
    );
};

export default RiskApprovalDetail;
