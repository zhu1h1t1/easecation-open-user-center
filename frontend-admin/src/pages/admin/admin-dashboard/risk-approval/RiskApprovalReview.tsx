import React from 'react';
import { Table, Button, Space, Modal, Form, Input, Typography, message, Card } from 'antd';
import type { ColumnsType } from 'antd/es/table';
import { useAuth } from '@common/contexts/AuthContext';
import { gLang } from '@common/language';
import { generateTemporaryUrl } from '@common/utils/uploadUtils';
import { Grid } from 'antd';

type Vote = {
    user: string;
    decision: 'agree' | 'reject';
    reason?: string;
    at: string;
};

type ApplicationRecord = {
    id: number;
    submitTime: string;
    playerNickname: string;
    playerECID?: string;
    operation: string;
    hours?: number;
    attachments?: string[];
    reason: string;
    agrees: number;
    rejects: number;
    status: 'Pending' | 'Approved' | 'Rejected' | 'Punished';
    votes: Vote[];
};

const { useBreakpoint } = Grid;

const RiskApprovalReview: React.FC = () => {
    const { user } = useAuth();
    const screens = useBreakpoint();
    const [list, setList] = React.useState<ApplicationRecord[]>([]);
    // loading currently unused
    const [previewVisible, setPreviewVisible] = React.useState(false);
    const [previewUrl, setPreviewUrl] = React.useState<string | null>(null);
    const [previewType, setPreviewType] = React.useState<'image' | 'video' | 'pdf' | 'other'>(
        'other'
    );
    const [messageApi, contextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();

    React.useEffect(() => {
        try {
            const raw = localStorage.getItem('riskApprovalList');
            if (raw) setList(JSON.parse(raw) as ApplicationRecord[]);
        } catch {
            // 解析失败，使用空数组
            setList([]);
        }
    }, []);

    const isHighAdmin = () => {
        return user?.permission?.includes('sen.admin') || false;
    };

    const previewAttachment = async (p: string) => {
        try {
            const url = await generateTemporaryUrl(p);
            const lower = url.toLowerCase();
            if (/(.png|.jpg|.jpeg|.gif|.bmp|.webp)$/.test(lower)) setPreviewType('image');
            else if (/(.mp4|.webm|.mov)$/.test(lower)) setPreviewType('video');
            else if (/(.pdf)$/.test(lower)) setPreviewType('pdf');
            else setPreviewType('other');
            setPreviewUrl(url);
            setPreviewVisible(true);
        } catch {
            setPreviewUrl(p);
            setPreviewVisible(true);
        }
    };

    const handleVote = (
        record: ApplicationRecord,
        decision: 'agree' | 'reject',
        reason?: string
    ) => {
        if (!isHighAdmin()) {
            messageApi.error(gLang('adminMain.risk.noPermission'));
            return;
        }
        const voterId = (user?.userid ? String(user.userid) : user?.openid) || 'unknown';
        const already = record.votes.find(v => v.user === voterId);
        if (already) {
            messageApi.warning(gLang('adminMain.risk.voteOnce'));
            return;
        }
        const vote: Vote = { user: voterId, decision, reason, at: new Date().toISOString() };
        const updated: ApplicationRecord = {
            ...record,
            votes: [...record.votes, vote],
            agrees: record.agrees + (decision === 'agree' ? 1 : 0),
            rejects: record.rejects + (decision === 'reject' ? 1 : 0),
        };
        const newList = list.map(it => (it.id === record.id ? updated : it));
        setList(newList);
        localStorage.setItem('riskApprovalList', JSON.stringify(newList));
        messageApi.success(gLang('adminMain.risk.voteSuccess'));
    };

    const columns: ColumnsType<ApplicationRecord> = [
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
        },
        { title: gLang('adminMain.risk.operation'), dataIndex: 'operation', key: 'operation' },
        {
            title: gLang('adminMain.risk.hours'),
            dataIndex: 'hours',
            key: 'hours',
            render: h =>
                typeof h === 'number'
                    ? `${h} ${gLang('adminMain.risk.hoursUnit')}`
                    : gLang('adminMain.risk.notSpecified'),
        },
        { title: gLang('adminMain.risk.agrees'), dataIndex: 'agrees', key: 'agrees' },
        { title: gLang('adminMain.risk.rejects'), dataIndex: 'rejects', key: 'rejects' },
        {
            title: gLang('adminMain.risk.actions'),
            key: 'actions',
            render: (_, record) => {
                const voterId = (user?.userid ? String(user.userid) : user?.openid) || 'unknown';
                const hasVoted = record.votes.some(v => v.user === voterId);
                return (
                    <Space>
                        {record.attachments && record.attachments.length ? (
                            <Button
                                onClick={() => previewAttachment(record.attachments?.[0] ?? '')}
                            >
                                {gLang('adminMain.risk.viewAttachment')}
                            </Button>
                        ) : null}
                        {!hasVoted ? (
                            <>
                                <Button type="primary" onClick={() => handleVote(record, 'agree')}>
                                    {gLang('adminMain.risk.agree')}
                                </Button>
                                <Button
                                    danger
                                    onClick={() => {
                                        modal.confirm({
                                            title: gLang('adminMain.risk.rejectConfirm'),
                                            content: (
                                                <Form
                                                    onFinish={vals => {
                                                        handleVote(
                                                            record,
                                                            'reject',
                                                            vals.rejectReason
                                                        );
                                                        Modal.destroyAll();
                                                    }}
                                                >
                                                    <Form.Item
                                                        name="rejectReason"
                                                        rules={[{ required: true }]}
                                                    >
                                                        <Input.TextArea rows={3} />
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
                                            okButtonProps: { style: { display: 'none' } },
                                            cancelText: gLang('common.cancel'),
                                        });
                                    }}
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
    ];

    return (
        <div style={{ width: '100%', padding: screens.xs ? '8px' : '0' }}>
            {contextHolder}
            {modalContextHolder}
            <Typography.Title level={4} style={{ marginBottom: screens.xs ? 8 : 16 }}>
                {gLang('adminMain.risk.title')}
            </Typography.Title>
            {screens.xs ? (
                <div>
                    {list.map(record => (
                        <Card key={record.id} style={{ marginBottom: 16 }}>
                            <Space direction="vertical" style={{ width: '100%' }} size="small">
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {gLang('adminMain.risk.submittedAt')}:
                                    </Typography.Text>
                                    <Typography.Text style={{ marginLeft: 8 }}>
                                        {new Date(record.submitTime).toLocaleString()}
                                    </Typography.Text>
                                </div>
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {gLang('adminMain.risk.player')}:
                                    </Typography.Text>
                                    <Typography.Text style={{ marginLeft: 8 }}>
                                        {record.playerNickname}
                                    </Typography.Text>
                                </div>
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {gLang('adminMain.risk.operation')}:
                                    </Typography.Text>
                                    <Typography.Text style={{ marginLeft: 8 }}>
                                        {record.operation}
                                    </Typography.Text>
                                </div>
                                <div>
                                    <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                        {gLang('adminMain.risk.hours')}:
                                    </Typography.Text>
                                    <Typography.Text style={{ marginLeft: 8 }}>
                                        {typeof record.hours === 'number'
                                            ? `${record.hours} ${gLang('adminMain.risk.hoursUnit')}`
                                            : gLang('adminMain.risk.notSpecified')}
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
                                        <Typography.Text style={{ marginLeft: 4 }}>
                                            {record.agrees}
                                        </Typography.Text>
                                    </div>
                                    <div>
                                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                            {gLang('adminMain.risk.rejects')}:
                                        </Typography.Text>
                                        <Typography.Text style={{ marginLeft: 4 }}>
                                            {record.rejects}
                                        </Typography.Text>
                                    </div>
                                </div>
                                <Space wrap style={{ width: '100%', marginTop: 8 }}>
                                    {record.attachments && record.attachments.length ? (
                                        <Button
                                            size="small"
                                            onClick={() =>
                                                previewAttachment(record.attachments?.[0] ?? '')
                                            }
                                        >
                                            {gLang('adminMain.risk.viewAttachment')}
                                        </Button>
                                    ) : null}
                                    {(() => {
                                        const voterId =
                                            (user?.userid ? String(user.userid) : user?.openid) ||
                                            'unknown';
                                        const hasVoted = record.votes.some(v => v.user === voterId);
                                        if (!hasVoted) {
                                            return (
                                                <>
                                                    <Button
                                                        type="primary"
                                                        size="small"
                                                        onClick={() => handleVote(record, 'agree')}
                                                    >
                                                        {gLang('adminMain.risk.agree')}
                                                    </Button>
                                                    <Button
                                                        danger
                                                        size="small"
                                                        onClick={() => {
                                                            modal.confirm({
                                                                title: gLang(
                                                                    'adminMain.risk.rejectConfirm'
                                                                ),
                                                                content: (
                                                                    <Form
                                                                        onFinish={vals => {
                                                                            handleVote(
                                                                                record,
                                                                                'reject',
                                                                                vals.rejectReason
                                                                            );
                                                                            Modal.destroyAll();
                                                                        }}
                                                                    >
                                                                        <Form.Item
                                                                            name="rejectReason"
                                                                            rules={[
                                                                                { required: true },
                                                                            ]}
                                                                        >
                                                                            <Input.TextArea
                                                                                rows={3}
                                                                            />
                                                                        </Form.Item>
                                                                        <Form.Item>
                                                                            <Button
                                                                                htmlType="submit"
                                                                                type="primary"
                                                                                danger
                                                                            >
                                                                                {gLang(
                                                                                    'common.submit'
                                                                                )}
                                                                            </Button>
                                                                        </Form.Item>
                                                                    </Form>
                                                                ),
                                                                okButtonProps: {
                                                                    style: { display: 'none' },
                                                                },
                                                                cancelText: gLang('common.cancel'),
                                                                width: screens.xs
                                                                    ? '95%'
                                                                    : undefined,
                                                                style: {
                                                                    top: screens.xs
                                                                        ? 20
                                                                        : undefined,
                                                                },
                                                            });
                                                        }}
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
                    dataSource={list}
                    columns={columns}
                    scroll={{ x: 'max-content' }}
                />
            )}

            <Modal
                open={previewVisible}
                onCancel={() => setPreviewVisible(false)}
                footer={null}
                width={screens.xs ? '95%' : 800}
                style={{ top: screens.xs ? 20 : undefined }}
            >
                {previewUrl ? (
                    previewType === 'image' ? (
                        <img src={previewUrl} style={{ width: '100%' }} alt="attachment" />
                    ) : previewType === 'video' ? (
                        <video src={previewUrl || undefined} style={{ width: '100%' }} controls />
                    ) : previewType === 'pdf' ? (
                        <iframe
                            src={previewUrl}
                            style={{ width: '100%', height: 600 }}
                            title="pdf"
                        />
                    ) : (
                        <a href={previewUrl} target="_blank" rel="noreferrer">
                            {gLang('adminMain.risk.openAttachment')}
                        </a>
                    )
                ) : null}
            </Modal>
        </div>
    );
};

export default RiskApprovalReview;
