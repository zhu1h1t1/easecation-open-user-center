// 反馈回复组件 - 包含回复表单和相关功能

import React, { useRef, useState, useEffect } from 'react';
import Form from 'antd/es/form';
import Button from 'antd/es/button';
import Upload from 'antd/es/upload';
import { SendOutlined, UploadOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import { Ticket, TicketStatus } from '@ecuc/shared/types/ticket.types';
import { useTheme } from '@common/contexts/ThemeContext';
import { useUploadProps } from '@common/utils/uploadUtils';
import MarkdownEditor from '@common/components/MarkdownEditor/MarkdownEditor';

interface FeedbackReplyProps {
    ticket: Ticket;
    onReply: (values: any, parent_detail_id?: number) => void;
    onCancelReply: () => void;
    replyingToDetailId: number | null;
    isFormDisabled: boolean;
    animationDelay: number;
    cardIndex: React.MutableRefObject<number>;
    mainPost: any;
    replies: any[];
    formWidth?: string;
    formLeft?: number;
}

const FeedbackReply: React.FC<FeedbackReplyProps> = ({
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
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [formWidth, setFormWidth] = useState<string>('100%');
    const [formLeft, setFormLeft] = useState<number>(0);
    const replyFormRef = useRef<HTMLDivElement>(null);
    const [form] = Form.useForm();

    // 动态计算回复框的位置，确保与评论区对齐
    useEffect(() => {
        const updateFormPosition = () => {
            // 获取最近的评论区容器
            let commentContainer = replyFormRef.current;

            // 向上查找包含评论的容器
            while (commentContainer && !commentContainer.querySelector('.ant-card')) {
                commentContainer = commentContainer.parentElement as HTMLDivElement | null;
            }

            if (commentContainer) {
                // 获取评论容器的位置和宽度
                const rect = commentContainer.getBoundingClientRect();
                setFormWidth(`${rect.width}px`);
                setFormLeft(rect.left);
            }
        };

        // 初始获取宽度和位置
        const timer = setTimeout(() => {
            updateFormPosition();
        }, 100);

        // 窗口大小变化时重新获取
        window.addEventListener('resize', updateFormPosition);
        // 滚动时也重新计算位置
        window.addEventListener('scroll', updateFormPosition);

        return () => {
            clearTimeout(timer);
            window.removeEventListener('resize', updateFormPosition);
            window.removeEventListener('scroll', updateFormPosition);
        };
    }, []);

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
    };

    const handleSubmit = (values: any) => {
        // 将uploadedFiles添加到表单值中
        onReply({ ...values, files: uploadedFiles }, replyingToDetailId || undefined);
        // 清空上传的文件和表单内容
        setUploadedFiles([]);
        form.resetFields();
    };

    return (
        <>
            {contextHolder}
            {/* 回复表单容器 */}
            {canReply ? (
                <div
                    style={{
                        position: 'fixed',
                        bottom: '20px',
                        left: `${formLeft}px`,
                        transform: 'none',
                        zIndex: 100,
                        width: formWidth,
                        padding: '0',
                    }}
                >
                    <div
                        ref={replyFormRef}
                        style={{
                            // 基础外观
                            borderRadius: 8,
                            border: `1px solid ${getThemeColor({ light: '#f0f0f0', dark: '#303030' })}`,
                            padding: '8px',
                            background: getThemeColor({ light: '#ffffff', dark: '#141414' }),
                            width: '100%',
                            boxShadow: '0 0 10px rgba(0, 0, 0, 0.1)',
                            opacity: 0,
                            animation: `fadeInUp 0.5s ease-in-out ${cardIndex.current++ * animationDelay}s forwards`,
                        }}
                    >
                        {replyingToDetailId != null && (
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
                        )}
                        <Form
                            form={form}
                            layout="vertical"
                            onFinish={handleSubmit}
                            autoComplete="off"
                            disabled={isFormDisabled}
                        >
                            <div style={{ position: 'relative' }}>
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
                                        minRows={3}
                                        maxRows={5}
                                        style={{ marginBottom: 0 }}
                                    />
                                </Form.Item>
                                <div
                                    style={{
                                        display: 'flex',
                                        justifyContent: 'flex-start',
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
                            </div>
                        </Form>
                    </div>
                </div>
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

export default FeedbackReply;
