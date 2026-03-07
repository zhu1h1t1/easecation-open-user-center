import React, { useState, useEffect } from 'react';
import {
    Modal,
    Spin,
    Descriptions,
    Tag,
    Alert,
    Typography,
    Segmented,
    Form,
    InputNumber,
    Select,
    Button,
    message,
    Input,
    theme,
} from 'antd';
import { fetchData, submitData } from '@common/axiosConfig';
import { convertUTCToFormat } from './TimeConverter';
import { gLang } from '@common/language';

const { Text } = Typography;

// 监督案例相关类型定义
interface OverwatchCase {
    id: number;
    record_id: number;
    status: 'HIDDEN' | 'OVERWATCH' | 'PUBLIC' | 'PUBLIC_LOCKED';
    source: string;
    target: string;
    punish: {
        type: string;
        hours: number;
        reason: string;
        operation: string;
    };
    created_at: string;
    updated_at: string;
    reason?: string | null;
    review_type?: string;
    difficulty?: number;
    determine_votes?: number;
    review_status?: string;
    final_verdict?: string;
    review_created_at?: string;
    review_updated_at?: string;
}

interface OverwatchModalProps {
    visible: boolean;
    recordId: number;
    ecid: string;
    onCancel: () => void;
}

const OverwatchModal: React.FC<OverwatchModalProps> = ({ visible, recordId, ecid, onCancel }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [overwatchData, setOverwatchData] = useState<OverwatchCase | null>(null);
    const [error, setError] = useState<string | null>(null);
    const [editing, setEditing] = useState(false);
    const [editingStatus, setEditingStatus] = useState<string>(''); // 跟踪编辑时的状态
    const [form] = Form.useForm();
    const { token } = theme.useToken();

    useEffect(() => {
        if (visible && recordId) {
            fetchOverwatchData();
        }
    }, [visible, recordId]);

    const fetchOverwatchData = async () => {
        setLoading(true);
        setError(null);
        try {
            await fetchData({
                url: '/ec/overwatch',
                method: 'GET',
                data: { record_id: recordId },
                setData: response => {
                    const data = response.data; // 从响应中提取实际的监督案例数据
                    setOverwatchData(data);
                    // 初始化表单数据
                    form.setFieldsValue({
                        status: data.status,
                        source: data.source,
                        target: data.target || ecid, // 如果没有目标玩家数据，使用传入的ecid
                        punishType: data.punish?.type || '',
                        punishHours: data.punish?.hours || 1,
                        punishReason: data.punish?.reason || '',
                        punishOperation: data.punish?.operation || '',
                        reviewType: data.review_type || 'VERDICT',
                        difficulty: data.difficulty || 3,
                        determineVotes: data.determine_votes || 5,
                    });
                },
                setSpin: setLoading,
            });
        } catch (err: any) {
            // 检查是否是"未找到指定的监督案例"错误（与 language 案语一致以便匹配后端返回）
            const notFoundMsg = gLang('overwatch.caseNotFound');
            const isNotFoundError =
                (err.message && err.message.includes(notFoundMsg)) ||
                (err.message && err.message.includes('Not Found')) ||
                err.status === 404 ||
                err.code === 404 ||
                (err.response?.data?.EPF_description &&
                    err.response.data.EPF_description.includes(notFoundMsg)) ||
                err.response?.data?.EPF_code === 2018;

            if (isNotFoundError) {
                const privateData: OverwatchCase = {
                    id: 0,
                    record_id: recordId,
                    status: 'HIDDEN',
                    source: '',
                    target: '',
                    punish: {
                        type: '',
                        hours: 0,
                        reason: '',
                        operation: '',
                    },
                    created_at: '',
                    updated_at: '',
                    reason: null,
                };
                setOverwatchData(privateData);
                form.setFieldsValue({
                    status: 'HIDDEN',
                    source: '',
                    target: ecid,
                    punishType: '',
                    punishHours: 0,
                    punishReason: '',
                    punishOperation: '',
                    reviewType: 'VERDICT',
                    difficulty: 3,
                    determineVotes: 5,
                });
            } else {
                setError(err.message || gLang('overwatch.fetchFailed'));
            }
        }
    };

    const handleEdit = () => {
        // 确保表单数据是最新的
        if (overwatchData) {
            form.setFieldsValue({
                status: overwatchData.status,
                source: overwatchData.source,
                target: overwatchData.target || ecid, // 如果没有目标玩家数据，使用传入的ecid
                punishType: overwatchData.punish?.type || '',
                punishHours: overwatchData.punish?.hours || 1,
                punishReason: overwatchData.punish?.reason || '',
                punishOperation: overwatchData.punish?.operation || '',
                reviewType: overwatchData.review_type || 'VERDICT',
                difficulty: overwatchData.difficulty || 3,
                determineVotes: overwatchData.determine_votes || 5,
            });

            // 初始化编辑状态
            setEditingStatus(overwatchData.status);
        }
        setEditing(true);
    };

    const handleStatusChange = (newStatus: string) => {
        setEditingStatus(newStatus);
        form.setFieldValue('status', newStatus);
    };

    const handleUpdatePunish = async () => {
        try {
            const values = await form.validateFields();

            // 根据状态决定发送的数据
            let updateData: any;

            if (values.status === 'HIDDEN') {
                // HIDDEN状态发送record_id和status（删除案例）
                updateData = {
                    record_id: recordId,
                    status: values.status,
                };
            } else if (values.status === 'PUBLIC' || values.status === 'PUBLIC_LOCKED') {
                // PUBLIC和PUBLIC_LOCKED状态发送基本信息和惩罚信息
                updateData = {
                    record_id: recordId,
                    status: values.status,
                    source: values.source,
                    target: values.target,
                    punish: {
                        type: values.punishType,
                        hours: values.punishHours,
                        reason: values.punishReason,
                        operation: values.punishOperation,
                    },
                };
            } else {
                // OVERWATCH状态发送完整数据包括评审信息
                updateData = {
                    record_id: recordId,
                    status: values.status,
                    source: values.source,
                    target: values.target,
                    punish: {
                        type: values.punishType,
                        hours: values.punishHours,
                        reason: values.punishReason,
                        operation: values.punishOperation,
                    },
                    review_type: values.reviewType,
                    difficulty: values.difficulty,
                    determine_votes: values.determineVotes,
                };
            }

            await submitData({
                data: updateData,
                url: '/ec/overwatch',
                method: 'POST',
                successMessage: gLang('overwatch.updateSuccess'),
                setIsFormDisabled: () => {},
                setIsModalOpen: () => {
                    setEditing(false);
                    // 重新获取数据
                    fetchOverwatchData();
                },
            });
        } catch (err: any) {
            // 如果是表单验证错误，不显示错误消息
            if (err.errorFields) {
                return;
            }
            // 只有API请求失败时才显示错误消息
            messageApi.error(err.message || gLang('overwatch.updateFailed'));
        }
    };

    const getOperationText = (operation: string) => {
        switch (operation) {
            case 'hack':
                return gLang('overwatch.operationHack');
            case 'ban':
                return gLang('overwatch.operationBan');
            default:
                return operation;
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('superPanel.overwatchModal.title')}
                open={visible}
                onCancel={() => {
                    setEditing(false);
                    setEditingStatus('');
                    onCancel();
                }}
                footer={null}
                width={800}
                destroyOnHidden
            >
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                        <Spin size="large" />
                        <div style={{ marginTop: 16 }}>
                            {gLang('superPanel.overwatchModal.loading')}
                        </div>
                    </div>
                ) : error ? (
                    <Alert
                        message={gLang('superPanel.overwatchModal.loadError')}
                        description={error}
                        type="error"
                        showIcon
                    />
                ) : overwatchData ? (
                    <div>
                        {editing ? (
                            <Form form={form} layout="vertical">
                                {/* 案例状态 */}
                                <Form.Item
                                    label={gLang('superPanel.overwatchModal.status')}
                                    name="status"
                                    rules={[
                                        {
                                            required: true,
                                            message: gLang(
                                                'superPanel.overwatchModal.validationMessages.selectStatus'
                                            ),
                                        },
                                    ]}
                                >
                                    <Segmented
                                        options={[
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusHidden'
                                                ),
                                                value: 'HIDDEN',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusOverwatch'
                                                ),
                                                value: 'OVERWATCH',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusPublic'
                                                ),
                                                value: 'PUBLIC',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusPublicLocked'
                                                ),
                                                value: 'PUBLIC_LOCKED',
                                            },
                                        ]}
                                        block
                                        size="large"
                                        onChange={handleStatusChange}
                                    />
                                </Form.Item>

                                {/* 只有当编辑状态为OVERWATCH、PUBLIC或PUBLIC_LOCKED时才显示其他字段 */}
                                {(editingStatus === 'OVERWATCH' ||
                                    editingStatus === 'PUBLIC' ||
                                    editingStatus === 'PUBLIC_LOCKED') && (
                                    <>
                                        {/* 案例基本信息 */}
                                        <div
                                            style={{
                                                display: 'grid',
                                                gridTemplateColumns: '1fr 1fr',
                                                gap: 16,
                                            }}
                                        >
                                            <Form.Item
                                                label={gLang('superPanel.overwatchModal.target')}
                                                name="target"
                                                rules={[
                                                    {
                                                        required: true,
                                                        message: gLang(
                                                            'superPanel.overwatchModal.validationMessages.enterTarget'
                                                        ),
                                                    },
                                                ]}
                                            >
                                                <Input
                                                    placeholder={gLang(
                                                        'superPanel.overwatchModal.placeholders.enterTarget'
                                                    )}
                                                />
                                            </Form.Item>
                                        </div>

                                        {/* 惩罚信息 */}
                                        <div style={{ marginTop: 16 }}>
                                            <Text
                                                strong
                                                style={{ display: 'block', marginBottom: 8 }}
                                            >
                                                {gLang('superPanel.overwatchModal.punishInfo')}
                                            </Text>
                                            <div
                                                style={{
                                                    display: 'grid',
                                                    gridTemplateColumns: '1fr 1fr',
                                                    gap: 16,
                                                }}
                                            >
                                                <Form.Item
                                                    label={gLang(
                                                        'superPanel.overwatchModal.violationType'
                                                    )}
                                                    name="punishType"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: gLang(
                                                                'superPanel.overwatchModal.validationMessages.enterViolationType'
                                                            ),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        options={[
                                                            {
                                                                value: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.speechViolation'
                                                                ),
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.speechViolation'
                                                                ),
                                                            },
                                                            {
                                                                value: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.cheatViolation'
                                                                ),
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.cheatViolation'
                                                                ),
                                                            },
                                                            {
                                                                value: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.negativeGame'
                                                                ),
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.negativeGame'
                                                                ),
                                                            },
                                                            {
                                                                value: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.other'
                                                                ),
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.violationTypes.other'
                                                                ),
                                                            },
                                                        ]}
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label={gLang(
                                                        'superPanel.overwatchModal.operationType'
                                                    )}
                                                    name="punishOperation"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: gLang(
                                                                'superPanel.overwatchModal.validationMessages.selectOperationType'
                                                            ),
                                                        },
                                                    ]}
                                                >
                                                    <Select
                                                        options={[
                                                            {
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.operationHack'
                                                                ),
                                                                value: 'hack',
                                                            },
                                                            {
                                                                label: gLang(
                                                                    'superPanel.overwatchModal.operationBan'
                                                                ),
                                                                value: 'ban',
                                                            },
                                                        ]}
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label={gLang(
                                                        'superPanel.overwatchModal.punishHours'
                                                    )}
                                                    name="punishHours"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: gLang(
                                                                'superPanel.overwatchModal.validationMessages.enterPunishHours'
                                                            ),
                                                        },
                                                    ]}
                                                >
                                                    <InputNumber
                                                        min={1}
                                                        max={8760}
                                                        style={{ width: '100%' }}
                                                    />
                                                </Form.Item>

                                                <Form.Item
                                                    label={gLang(
                                                        'superPanel.overwatchModal.punishReason'
                                                    )}
                                                    name="punishReason"
                                                    rules={[
                                                        {
                                                            required: true,
                                                            message: gLang(
                                                                'superPanel.overwatchModal.validationMessages.enterPunishReason'
                                                            ),
                                                        },
                                                    ]}
                                                >
                                                    <Input
                                                        placeholder={gLang(
                                                            'superPanel.overwatchModal.placeholders.enterPunishReason'
                                                        )}
                                                    />
                                                </Form.Item>
                                            </div>
                                        </div>

                                        {/* 评审信息 - 只在OVERWATCH状态时显示 */}
                                        {editingStatus === 'OVERWATCH' && (
                                            <div style={{ marginTop: 16 }}>
                                                <Text
                                                    strong
                                                    style={{ display: 'block', marginBottom: 8 }}
                                                >
                                                    {gLang('superPanel.overwatchModal.reviewInfo')}
                                                </Text>
                                                <div
                                                    style={{
                                                        display: 'grid',
                                                        gridTemplateColumns: '1fr 1fr',
                                                        gap: 16,
                                                    }}
                                                >
                                                    <Form.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewType'
                                                        )}
                                                        name="reviewType"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'superPanel.overwatchModal.validationMessages.selectReviewType'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <Select
                                                            options={[
                                                                {
                                                                    label: gLang(
                                                                        'superPanel.overwatchModal.reviewTypeVerdict'
                                                                    ),
                                                                    value: 'VERDICT',
                                                                },
                                                                {
                                                                    label: gLang(
                                                                        'superPanel.overwatchModal.reviewTypeAppeal'
                                                                    ),
                                                                    value: 'APPEAL',
                                                                },
                                                            ]}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewDifficulty'
                                                        )}
                                                        name="difficulty"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'superPanel.overwatchModal.validationMessages.enterReviewDifficulty'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <InputNumber
                                                            min={1}
                                                            max={5}
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Form.Item>

                                                    <Form.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.determineVotes'
                                                        )}
                                                        name="determineVotes"
                                                        rules={[
                                                            {
                                                                required: true,
                                                                message: gLang(
                                                                    'superPanel.overwatchModal.validationMessages.enterDetermineVotes'
                                                                ),
                                                            },
                                                        ]}
                                                    >
                                                        <InputNumber
                                                            min={1}
                                                            max={10}
                                                            style={{ width: '100%' }}
                                                        />
                                                    </Form.Item>
                                                </div>
                                            </div>
                                        )}
                                    </>
                                )}

                                <div
                                    style={{
                                        display: 'flex',
                                        gap: 8,
                                        justifyContent: 'flex-end',
                                        marginTop: 16,
                                    }}
                                >
                                    <Button
                                        onClick={() => {
                                            setEditing(false);
                                            setEditingStatus('');
                                        }}
                                    >
                                        {gLang('superPanel.overwatchModal.cancel')}
                                    </Button>
                                    <Button type="primary" onClick={handleUpdatePunish}>
                                        {gLang('superPanel.overwatchModal.save')}
                                    </Button>
                                </div>

                                {/* 编辑模式状态提示 */}
                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: 16,
                                        background: token.colorFillSecondary,
                                        borderRadius: 6,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                >
                                    <Text type="secondary">
                                        {editingStatus === 'HIDDEN' &&
                                            gLang('superPanel.overwatchModal.statusTipHidden')}
                                        {editingStatus === 'OVERWATCH' &&
                                            gLang('superPanel.overwatchModal.statusTipOverwatch')}
                                        {editingStatus === 'PUBLIC' &&
                                            gLang('superPanel.overwatchModal.statusTipPublic')}
                                        {editingStatus === 'PUBLIC_LOCKED' &&
                                            gLang(
                                                'superPanel.overwatchModal.statusTipPublicLocked'
                                            )}
                                    </Text>
                                </div>
                            </Form>
                        ) : (
                            <div>
                                {/* 案例状态显示 */}
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        {gLang('superPanel.overwatchModal.status')}
                                    </Text>
                                    <Segmented
                                        value={overwatchData.status}
                                        options={[
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusHidden'
                                                ),
                                                value: 'HIDDEN',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusOverwatch'
                                                ),
                                                value: 'OVERWATCH',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusPublic'
                                                ),
                                                value: 'PUBLIC',
                                            },
                                            {
                                                label: gLang(
                                                    'superPanel.overwatchModal.statusPublicLocked'
                                                ),
                                                value: 'PUBLIC_LOCKED',
                                            },
                                        ]}
                                        block
                                        size="large"
                                        disabled
                                    />
                                </div>

                                {/* 记录ID显示 */}
                                <div style={{ marginBottom: 16 }}>
                                    <Text strong style={{ display: 'block', marginBottom: 8 }}>
                                        {gLang('superPanel.overwatchModal.recordId')}
                                    </Text>
                                    <Text code>{overwatchData.record_id}</Text>
                                </div>

                                {/* 只有当状态为OVERWATCH、PUBLIC或PUBLIC_LOCKED时才显示其他信息 */}
                                {(overwatchData.status === 'OVERWATCH' ||
                                    overwatchData.status === 'PUBLIC' ||
                                    overwatchData.status === 'PUBLIC_LOCKED') && (
                                    <>
                                        {/* 基本信息显示 */}
                                        <Descriptions
                                            title={gLang('superPanel.overwatchModal.basicInfo')}
                                            bordered
                                            column={2}
                                            size="small"
                                        >
                                            <Descriptions.Item
                                                label={gLang('superPanel.overwatchModal.caseId')}
                                            >
                                                <Text code>{overwatchData.id}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={gLang('superPanel.overwatchModal.source')}
                                            >
                                                <Text strong>{overwatchData.source}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={gLang('superPanel.overwatchModal.target')}
                                            >
                                                <Text strong>{overwatchData.target}</Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={gLang(
                                                    'superPanel.overwatchModal.createTime'
                                                )}
                                            >
                                                <Text>
                                                    {convertUTCToFormat(overwatchData.created_at)}
                                                </Text>
                                            </Descriptions.Item>
                                            <Descriptions.Item
                                                label={gLang(
                                                    'superPanel.overwatchModal.updateTime'
                                                )}
                                            >
                                                <Text>
                                                    {convertUTCToFormat(overwatchData.updated_at)}
                                                </Text>
                                            </Descriptions.Item>
                                        </Descriptions>

                                        {/* 惩罚信息显示 */}
                                        {overwatchData.punish && (
                                            <div style={{ marginTop: 16 }}>
                                                <Descriptions
                                                    title={gLang(
                                                        'superPanel.overwatchModal.punishInfo'
                                                    )}
                                                    bordered
                                                    column={2}
                                                    size="small"
                                                >
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.violationType'
                                                        )}
                                                    >
                                                        <Text strong>
                                                            {overwatchData.punish.type}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.operationType'
                                                        )}
                                                    >
                                                        <Tag color="red">
                                                            {getOperationText(
                                                                overwatchData.punish.operation
                                                            )}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.punishHours'
                                                        )}
                                                    >
                                                        <Text>
                                                            {overwatchData.punish.hours}{' '}
                                                            {gLang(
                                                                'superPanel.overwatchModal.timeUnit'
                                                            )}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.punishReason'
                                                        )}
                                                    >
                                                        <Text>{overwatchData.punish.reason}</Text>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </div>
                                        )}

                                        {/* 评审信息显示 - 只在OVERWATCH状态时显示 */}
                                        {overwatchData.status === 'OVERWATCH' && (
                                            <div style={{ marginTop: 16 }}>
                                                <Descriptions
                                                    title={gLang(
                                                        'superPanel.overwatchModal.reviewInfo'
                                                    )}
                                                    bordered
                                                    column={2}
                                                    size="small"
                                                >
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewType'
                                                        )}
                                                    >
                                                        <Text strong>
                                                            {overwatchData.review_type === 'VERDICT'
                                                                ? gLang(
                                                                      'superPanel.overwatchModal.reviewTypeVerdict'
                                                                  )
                                                                : gLang(
                                                                      'superPanel.overwatchModal.reviewTypeAppeal'
                                                                  )}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewStatus'
                                                        )}
                                                    >
                                                        <Tag
                                                            color={
                                                                overwatchData.review_status ===
                                                                'COMPLETED'
                                                                    ? 'green'
                                                                    : 'orange'
                                                            }
                                                        >
                                                            {overwatchData.review_status ===
                                                            'COMPLETED'
                                                                ? gLang(
                                                                      'superPanel.overwatchModal.reviewStatusCompleted'
                                                                  )
                                                                : gLang(
                                                                      'superPanel.overwatchModal.reviewStatusPending'
                                                                  )}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewDifficulty'
                                                        )}
                                                    >
                                                        <Text>
                                                            {overwatchData.difficulty || 0}{' '}
                                                            {gLang(
                                                                'superPanel.overwatchModal.difficultyUnit'
                                                            )}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.determineVotes'
                                                        )}
                                                    >
                                                        <Text>
                                                            {overwatchData.determine_votes || 0}{' '}
                                                            {gLang(
                                                                'superPanel.overwatchModal.votesUnit'
                                                            )}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.finalVerdict'
                                                        )}
                                                    >
                                                        <Tag
                                                            color={
                                                                overwatchData.final_verdict ===
                                                                'PUNISH'
                                                                    ? 'red'
                                                                    : overwatchData.final_verdict ===
                                                                        'MAINTAIN'
                                                                      ? 'blue'
                                                                      : overwatchData.final_verdict ===
                                                                          'REVOKE'
                                                                        ? 'green'
                                                                        : overwatchData.final_verdict ===
                                                                            'REDUCE'
                                                                          ? 'orange'
                                                                          : 'default'
                                                            }
                                                        >
                                                            {overwatchData.final_verdict ===
                                                            'PUNISH'
                                                                ? gLang(
                                                                      'superPanel.overwatchModal.verdictPunish'
                                                                  )
                                                                : overwatchData.final_verdict ===
                                                                    'MAINTAIN'
                                                                  ? gLang(
                                                                        'superPanel.overwatchModal.verdictMaintain'
                                                                    )
                                                                  : overwatchData.final_verdict ===
                                                                      'REVOKE'
                                                                    ? gLang(
                                                                          'superPanel.overwatchModal.verdictRevoke'
                                                                      )
                                                                    : overwatchData.final_verdict ===
                                                                        'REDUCE'
                                                                      ? gLang(
                                                                            'superPanel.overwatchModal.verdictReduce'
                                                                        )
                                                                      : overwatchData.final_verdict}
                                                        </Tag>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewCreateTime'
                                                        )}
                                                    >
                                                        <Text>
                                                            {overwatchData.review_created_at
                                                                ? convertUTCToFormat(
                                                                      overwatchData.review_created_at
                                                                  )
                                                                : '-'}
                                                        </Text>
                                                    </Descriptions.Item>
                                                    <Descriptions.Item
                                                        label={gLang(
                                                            'superPanel.overwatchModal.reviewUpdateTime'
                                                        )}
                                                    >
                                                        <Text>
                                                            {overwatchData.review_updated_at
                                                                ? convertUTCToFormat(
                                                                      overwatchData.review_updated_at
                                                                  )
                                                                : '-'}
                                                        </Text>
                                                    </Descriptions.Item>
                                                </Descriptions>
                                            </div>
                                        )}
                                    </>
                                )}

                                {/* 编辑按钮 */}
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-end',
                                        marginTop: 16,
                                    }}
                                >
                                    <Button type="primary" size="small" onClick={handleEdit}>
                                        {gLang('superPanel.overwatchModal.edit')}
                                    </Button>
                                </div>

                                {/* 查看模式状态提示 */}
                                <div
                                    style={{
                                        marginTop: 16,
                                        padding: 16,
                                        background: token.colorFillSecondary,
                                        borderRadius: 6,
                                        border: `1px solid ${token.colorBorderSecondary}`,
                                    }}
                                >
                                    <Text type="secondary">
                                        {overwatchData.status === 'HIDDEN' &&
                                            gLang('superPanel.overwatchModal.statusTipHidden')}
                                        {overwatchData.status === 'OVERWATCH' &&
                                            gLang('superPanel.overwatchModal.statusTipOverwatch')}
                                        {overwatchData.status === 'PUBLIC' &&
                                            gLang('superPanel.overwatchModal.statusTipPublic')}
                                        {overwatchData.status === 'PUBLIC_LOCKED' &&
                                            gLang(
                                                'superPanel.overwatchModal.statusTipPublicLocked'
                                            )}
                                    </Text>
                                </div>
                            </div>
                        )}

                        {overwatchData.reason && (
                            <div style={{ marginTop: 16 }}>
                                <Descriptions
                                    title={gLang('superPanel.overwatchModal.additionalInfo')}
                                    bordered
                                    column={1}
                                    size="small"
                                >
                                    <Descriptions.Item
                                        label={gLang('superPanel.overwatchModal.description')}
                                    >
                                        <Text>{overwatchData.reason}</Text>
                                    </Descriptions.Item>
                                </Descriptions>
                            </div>
                        )}
                    </div>
                ) : null}
            </Modal>
        </>
    );
};

export default OverwatchModal;
