// 工单操作页面中的AI生成按钮

import React from 'react';
import { Button, ConfigProvider, Input, Modal, Space, message } from 'antd';
import { MessageFilled } from '@ant-design/icons';
import { gLang } from '@common/language';
import { useStyle } from '@common/hooks/useStyle';
import { AIStreamProvider, useAIStreamContext } from '@common/contexts/AIStreamContext';
import { StreamModalContent } from '../../../../../components/StreamModalContent';

interface AIGenerateButtonProps {
    onGenerate?: (prompt: string) => Promise<void>; // 向后兼容，但不再使用
    isGenerating?: boolean; // 向后兼容，但不再使用
    className?: string;
    tid?: string;
    form?: any;
}

const { TextArea } = Input;

// 模态框底部按钮组件
const StreamModalFooter: React.FC<{
    form: any;
    onCancel: () => void;
    onClose: () => void;
}> = ({ form, onCancel, onClose }) => {
    // 直接从Context获取最新状态，避免闭包问题
    const { isLoading, isCompleted, finalAnswer, content, editedAnswer } = useAIStreamContext();

    const handleUse = () => {
        // 直接从DOM获取TextArea的当前值
        const textAreas = document.querySelectorAll(gLang('admin.ticketAiAnswerSelector'));
        let replyContent = '';

        if (textAreas.length > 0) {
            const textArea = textAreas[0] as HTMLTextAreaElement;
            replyContent = textArea.value;
        } else {
            // 如果找不到TextArea，使用Context中的值作为备选
            replyContent = editedAnswer || finalAnswer || content;
        }

        if (form && replyContent) {
            form.setFieldValue('details', replyContent);
            form.validateFields(['details']);
        }
        onClose();
    };

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'space-between',
                marginTop: 16,
                paddingTop: 16,
                borderTop: '1px solid #f0f0f0',
            }}
        >
            <div>
                {isLoading && (
                    <Button danger onClick={onCancel}>
                        {gLang('admin.ticketCancelGenerate')}
                    </Button>
                )}
            </div>
            <div>
                <Button onClick={onClose}>{gLang('admin.ticketClose')}</Button>
                {isCompleted && (editedAnswer || finalAnswer || content) && (
                    <Button type="primary" onClick={handleUse} style={{ marginLeft: 8 }}>
                        {gLang('admin.ticketUseReply')}
                    </Button>
                )}
            </div>
        </div>
    );
};

// 内部组件，使用Context获取状态
const AIGenerateButtonInternal = React.memo((props: AIGenerateButtonProps) => {
    const { className, tid, form } = props;
    const [modal, contextHolder] = Modal.useModal();
    const [streamModal, streamContextHolder] = Modal.useModal();
    const [messageApi, messageContextHolder] = message.useMessage();
    const promptRef = React.useRef('');
    const { isLoading, startStream, cancelStream, resetStream } = useAIStreamContext();

    // 流式生成处理函数
    const handleStreamGenerate = async (prompt: string) => {
        if (!tid) {
            messageApi.error(gLang('admin.ticketIdMissing'));
            return;
        }

        resetStream();

        // 显示流式输出模态框 - 使用React Portal方式
        const streamModalInstance = streamModal.info({
            title: gLang('admin.ticketAiThinkingTitle'),
            content: (
                <div>
                    <StreamModalContent />
                    <StreamModalFooter
                        form={form}
                        onCancel={() => {
                            cancelStream();
                            streamModalInstance.destroy();
                        }}
                        onClose={() => {
                            cancelStream();
                            streamModalInstance.destroy();
                        }}
                    />
                </div>
            ),
            width: 800,
            footer: null, // 不使用默认footer
        });

        // 开始流式请求
        const ticketId = parseInt(tid || '0');
        if (isNaN(ticketId) || ticketId === 0) {
            throw new Error(gLang('admin.ticketInvalidId'));
        }
        await startStream(ticketId, prompt || undefined);
    };

    const showDialog = async () => {
        promptRef.current = '';
        const confirmed = await modal.confirm({
            icon: <MessageFilled />,
            centered: true,
            title: gLang('ticketOperate.aiReplyConfirm'),
            content: (
                <Space orientation="vertical" style={{ display: 'flex' }}>
                    {gLang('ticketOperate.aiReplyConfirmContent')}
                    <TextArea
                        placeholder={gLang('ticketOperate.aiReplyConfirmPrompt')}
                        onChange={e => (promptRef.current = e.target.value)}
                        autoSize={{ minRows: 2, maxRows: 6 }}
                    />
                </Space>
            ),
            okText: gLang('ticketOperate.aiReplyConfirmOK'),
            okButtonProps: {
                className: className, // 应用相同样式类
            },
            cancelText: gLang('cancel'),
        });

        if (confirmed) {
            await handleStreamGenerate(promptRef.current);
        }
    };

    const { styles } = useStyle();

    return (
        <ConfigProvider
            button={{
                className: styles.aiButton,
            }}
        >
            {contextHolder}
            <div key="stream-modal-holder">{streamContextHolder}</div>
            {messageContextHolder}
            <Button
                type="primary"
                icon={<MessageFilled />}
                loading={isLoading}
                onClick={showDialog}
                className={className}
            >
                {gLang('ticketOperate.aiReply')}
            </Button>
            <style>{`
                @keyframes blink {
                    0%, 50% { opacity: 1; }
                    51%, 100% { opacity: 0; }
                }
            `}</style>
        </ConfigProvider>
    );
});

AIGenerateButtonInternal.displayName = 'AIGenerateButtonInternal';

// 主导出组件，包装Context Provider
export const AIGenerateButton = React.memo((props: AIGenerateButtonProps) => {
    return (
        <AIStreamProvider>
            <AIGenerateButtonInternal {...props} />
        </AIStreamProvider>
    );
});

AIGenerateButton.displayName = 'AIGenerateButton';
