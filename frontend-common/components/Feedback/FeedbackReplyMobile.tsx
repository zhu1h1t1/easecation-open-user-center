// 移动端反馈回复组件 - 简化版本，专为移动端设计

import React, { useRef, useState } from 'react';
import useIsPC from '@common/hooks/useIsPC';
import Form from 'antd/es/form';
import Button from 'antd/es/button';
import Input from 'antd/es/input';
import Upload from 'antd/es/upload';
import Drawer from 'antd/es/drawer';
import { UploadOutlined, SendOutlined, CloseOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import { Ticket, TicketStatus } from '@ecuc/shared/types/ticket.types';
import { useTheme } from '@common/contexts/ThemeContext';
import { useUploadProps } from '@common/utils/uploadUtils';
import MarkdownEditor from '@common/components/MarkdownEditor/MarkdownEditor';

interface FeedbackReplyMobileProps {
    ticket: Ticket;
    onReply: (values: any, parent_detail_id?: number) => void;
    onCancelReply: () => void;
    replyingToDetailId: number | null;
    isFormDisabled: boolean;
    animationDelay: number;
    cardIndex: React.MutableRefObject<number>;
    mainPost: any;
    replies: any[];
}

const FeedbackReplyMobile: React.FC<FeedbackReplyMobileProps> = ({
    ticket,
    onReply,
    onCancelReply,
    replyingToDetailId,
    isFormDisabled,
    animationDelay,
    cardIndex,
    mainPost,
    replies,
}) => {
    const { getThemeColor } = useTheme();
    const isPC = useIsPC();
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [drawerOpen, setDrawerOpen] = useState(false);
    const [quickReplyValue, setQuickReplyValue] = useState('');
    const replyFormRef = useRef<HTMLDivElement>(null);
    const [form] = Form.useForm();

    const { uploadProps, contextHolder } = useUploadProps(
        10,
        uploadedFiles,
        setUploadedFiles,
        setIsUploading
    );

    const canReply = ticket.status !== TicketStatus.Accept && ticket.status !== TicketStatus.Reject;

    const handleCancelReply = () => {
        onCancelReply();
        form.resetFields(['details']);
        setDrawerOpen(false);
    };

    const handleSubmit = (values: any) => {
        // 将上传的文件添加到提交的值中
        const submitValues = {
            ...values,
            files: uploadedFiles,
        };
        onReply(submitValues, replyingToDetailId || undefined);
        setUploadedFiles([]);
        form.resetFields();
        setDrawerOpen(false);
    };

    const handleQuickReply = () => {
        if (quickReplyValue.trim()) {
            onReply({ details: quickReplyValue }, replyingToDetailId || undefined);
            setQuickReplyValue('');
        }
    };

    const openReplyDrawer = () => {
        setDrawerOpen(true);
    };

    // 当replyingToDetailId发生变化时，自动打开抽屉
    React.useEffect(() => {
        if (replyingToDetailId != null) {
            setDrawerOpen(true);
        }
    }, [replyingToDetailId]);

    return (
        <>
            {contextHolder}
            {/* 回复表单容器 - 移动端固定在底部 */}
            {canReply ? (
                <>
                    {/* 紧凑的回复输入框 */}
                    <div
                        style={{
                            position: 'fixed',
                            bottom: isPC ? 20 : 0,
                            left: isPC ? '50%' : 0,
                            right: isPC ? 'auto' : 0,
                            transform: isPC ? 'translateX(-50%)' : 'none',
                            width: isPC ? '80%' : '100%',
                            maxWidth: isPC ? 800 : '100%',
                            zIndex: 100,
                            padding: '8px',
                            background: getThemeColor({ light: '#ffffff', dark: '#141414' }),
                            border: `1px solid ${getThemeColor({ light: '#f0f0f0', dark: '#303030' })}`,
                            borderRadius: isPC ? 8 : 0,
                            margin: 0,
                            boxSizing: 'border-box',
                            boxShadow: isPC ? '0 2px 8px rgba(0, 0, 0, 0.15)' : 'none',
                        }}
                    >
                        <div
                            ref={replyFormRef}
                            style={{
                                width: '100%',
                                opacity: 0,
                                animation: `fadeInUp 0.5s ease-in-out ${cardIndex.current++ * animationDelay}s forwards`,
                                display: 'flex',
                                alignItems: 'center',
                                gap: 8,
                            }}
                        >
                            {/* 输入框和回复按钮组合 */}
                            <div style={{ flex: 1, display: 'flex', alignItems: 'center', gap: 8 }}>
                                {/* 包裹div，用于捕获点击事件 */}
                                <div
                                    style={{
                                        flex: 1,
                                        position: 'relative',
                                        cursor: 'pointer',
                                        borderRadius: 20,
                                        overflow: 'hidden',
                                        // 确保在PC端也能正确捕获点击事件
                                        pointerEvents: 'auto',
                                    }}
                                    onClick={openReplyDrawer}
                                    onMouseDown={e => {
                                        e.preventDefault();
                                        openReplyDrawer();
                                    }}
                                >
                                    <Input
                                        placeholder={gLang('feedback.additionIntro')}
                                        value={quickReplyValue}
                                        onChange={e => setQuickReplyValue(e.target.value)}
                                        onPressEnter={handleQuickReply}
                                        disabled
                                        onMouseDown={e => {
                                            e.preventDefault();
                                            openReplyDrawer();
                                        }}
                                        onTouchStart={openReplyDrawer}
                                        style={{
                                            width: '100%',
                                            borderRadius: 20,
                                            borderColor: getThemeColor({
                                                light: '#e8e8e8',
                                                dark: '#434343',
                                            }),
                                            height: 40,
                                            maxHeight: 40,
                                            overflow: 'hidden',
                                            cursor: 'pointer',
                                            userSelect: 'none',
                                            // 确保在PC端也能正确显示
                                            pointerEvents: 'none',
                                        }}
                                        suffix={
                                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                                <UploadOutlined
                                                    style={{
                                                        color: getThemeColor({
                                                            light: '#999',
                                                            dark: '#666',
                                                        }),
                                                        cursor: 'pointer',
                                                        marginRight: 8,
                                                        // 确保在PC端也能正确捕获点击事件
                                                        pointerEvents: 'auto',
                                                    }}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        openReplyDrawer();
                                                    }}
                                                />
                                                <Button
                                                    type="primary"
                                                    icon={<SendOutlined />}
                                                    size="small"
                                                    style={{
                                                        width: 32,
                                                        height: 32,
                                                        borderRadius: '50%',
                                                        minWidth: 32,
                                                        padding: 0,
                                                    }}
                                                    onClick={e => {
                                                        e.stopPropagation();
                                                        e.preventDefault();
                                                        openReplyDrawer();
                                                    }}
                                                />
                                            </div>
                                        }
                                    />
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* 回复抽屉 */}
                    <Drawer
                        title={
                            replyingToDetailId != null ? (
                                <div
                                    style={{
                                        marginBottom: 8,
                                        fontSize: 12,
                                        color: getThemeColor({ light: '#666', dark: '#999' }),
                                        display: 'flex',
                                        justifyContent: 'space-between',
                                        alignItems: 'center',
                                    }}
                                >
                                    <div>
                                        {(() => {
                                            // 找到被回复的评论
                                            const repliedComment = [
                                                ...(mainPost ? [mainPost] : []),
                                                ...replies,
                                            ].find(d => d.id === replyingToDetailId);
                                            if (repliedComment) {
                                                return (
                                                    gLang('feedback.replyToUser').replace(
                                                        '{user}',
                                                        repliedComment.displayTitle || ''
                                                    ) + ' '
                                                );
                                            }
                                            return '';
                                        })()}
                                        <Button
                                            type="link"
                                            size="small"
                                            style={{
                                                padding: 0,
                                                height: 'auto',
                                                verticalAlign: 'baseline',
                                                fontSize: 12,
                                            }}
                                            onClick={handleCancelReply}
                                        >
                                            {gLang('feedback.cancelReply')}
                                        </Button>
                                    </div>
                                </div>
                            ) : (
                                gLang('ticketDetail.submit')
                            )
                        }
                        placement={isPC ? 'right' : 'bottom'}
                        onClose={() => setDrawerOpen(false)}
                        open={drawerOpen}
                        maskClosable={true}
                        size={320}
                        closeIcon={false}
                        extra={
                            <Button
                                type="text"
                                icon={<CloseOutlined />}
                                onClick={() => setDrawerOpen(false)}
                            />
                        }
                        style={{
                            borderRadius: isPC ? 0 : '16px 16px 0 0',
                        }}
                        headerStyle={{
                            borderBottom: 'none',
                            padding: '16px 24px 0',
                        }}
                        bodyStyle={{
                            padding: '0 24px 16px',
                            margin: 0,
                        }}
                    >
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            autoComplete="off"
                            disabled={isFormDisabled}
                            style={{ marginBottom: 0 }}
                        >
                            <Form.Item
                                name="details"
                                rules={[
                                    {
                                        required: true,
                                        message: gLang('required'),
                                    },
                                ]}
                            >
                                <MarkdownEditor
                                    placeholder={gLang('feedback.additionIntro')}
                                    maxLength={2000}
                                    minRows={4}
                                    maxRows={6}
                                />
                            </Form.Item>

                            <div
                                style={{
                                    display: 'flex',
                                    justifyContent: 'flex-start',
                                    marginTop: 16,
                                }}
                            >
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    disabled={isUploading || isFormDisabled}
                                    size="small"
                                    icon={<SendOutlined />}
                                    style={{
                                        height: 32,
                                        padding: '0 16px',
                                        marginRight: 8,
                                    }}
                                >
                                    {gLang('feedback.sendReply')}
                                </Button>
                                <Form.Item
                                    name="files"
                                    valuePropName="fileList"
                                    getValueFromEvent={e =>
                                        Array.isArray(e) ? e : e?.fileList || []
                                    }
                                    noStyle
                                    style={{ marginLeft: 8 }}
                                >
                                    <Upload {...uploadProps}>
                                        <Button
                                            icon={<UploadOutlined />}
                                            size="small"
                                            loading={isUploading}
                                            disabled={isUploading}
                                            style={{
                                                height: 32,
                                            }}
                                        >
                                            {gLang('feedback.attachment')}
                                        </Button>
                                    </Upload>
                                </Form.Item>
                            </div>
                        </Form>
                    </Drawer>
                </>
            ) : (
                <div
                    style={{
                        borderRadius: 8,
                        border: `1px solid ${getThemeColor({ light: '#f0f0f0', dark: '#303030' })}`,
                        padding: '8px',
                        background: getThemeColor({ light: '#ffffff', dark: '#141414' }),
                        opacity: 0,
                        animation: `fadeInUp 0.5s ease-in-out ${cardIndex.current++ * animationDelay}s forwards`,
                    }}
                >
                    <div
                        style={{
                            textAlign: 'center',
                            color: getThemeColor({ light: '#999', dark: '#666' }),
                        }}
                    >
                        {ticket.status === TicketStatus.Accept
                            ? gLang('feedback.completedCannotReply')
                            : gLang('feedback.rejectedCannotReply')}
                    </div>
                </div>
            )}
        </>
    );
};

export default FeedbackReplyMobile;
