// 管理端社区风格的反馈列表项组件

import React, { useState } from 'react';
import { Card, Typography, Space, Button, Modal, Input, Select, Tag } from 'antd';
import { DeleteOutlined, EditOutlined } from '@ant-design/icons';
import { Link } from 'react-router-dom';
import { FeedbackListItemDto } from '@ecuc/shared/types/ticket.types';
import { ltransFeedbackStatusBarColor } from '@common/languageTrans';
import { formatSmartTime } from '@common/components/TimeConverter';
import { gLang } from '@common/language';
import useDarkMode from '@common/hooks/useDarkMode';
import { submitData } from '@common/axiosConfig';

const { Text } = Typography;

/** 管理端列表项：与 /feedback/list、/feedback/subscriptions 返回格式一致，支持 tag 编辑与删除 */
interface FeedbackListItemProps {
    ticket: FeedbackListItemDto & { feedbackTag?: string };
    to: string;
    selected?: boolean;
    highlightColor?: string;
    onRemove?: (tid: number) => void | Promise<void>;
    /** 保存标签后回调，用于更新列表中的 ticket.feedbackTag */
    onTagUpdate?: (tid: number, tag: string) => void;
    /** 保存类型后回调，用于更新列表中的 ticket.feedbackType */
    onTypeUpdate?: (tid: number, type: 'SUGGESTION' | 'BUG') => void;
}

const FeedbackListItem: React.FC<FeedbackListItemProps> = ({
    ticket,
    to,
    selected,
    highlightColor,
    onRemove,
    onTagUpdate,
    onTypeUpdate,
}) => {
    const [removing, setRemoving] = useState(false);
    const [editingTag, setEditingTag] = useState(false);
    const [tagInput, setTagInput] = useState(ticket.feedbackTag ?? ticket.tag ?? '');
    const [tagSaving, setTagSaving] = useState(false);
    const [typeSaving, setTypeSaving] = useState(false);
    const [modal, modalContextHolder] = Modal.useModal();
    const isDarkMode = useDarkMode();
    const currentType = ticket.feedbackType ?? 'SUGGESTION';

    // 删除：从反馈列表移除，后端将工单类型改为 JY、状态改为 R
    const handleRemove = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onRemove) return;
        modal.confirm({
            title: gLang('feedback.delete'),
            content: gLang('feedback.removeFromListConfirm'),
            okText: gLang('confirm'),
            cancelText: gLang('cancel'),
            onOk: async () => {
                setRemoving(true);
                try {
                    await onRemove(ticket.tid);
                } finally {
                    setRemoving(false);
                }
            },
        });
    };

    const title = ticket.title.replace(/^反馈:\s*/, '');
    const replyCount = ticket.replyCount ?? 0;
    const lastReplyTime = ticket.lastReplyTime ?? ticket.create_time;
    const feedbackTag = ticket.feedbackTag ?? ticket.tag ?? '';
    const statusColor = ltransFeedbackStatusBarColor(ticket.status);
    // 开启状态不显示竖线
    const showBar = ticket.status !== 'O';
    const handleSaveTag = (e: React.MouseEvent) => {
        e.preventDefault();
        e.stopPropagation();
        if (!onTagUpdate) return;
        setTagSaving(true);
        submitData({
            data: { tid: ticket.tid, tag: tagInput },
            url: '/feedback/tag',
            method: 'POST',
            successMessage: 'feedback.tagSaved',
            setIsFormDisabled: () => {},
            setIsModalOpen: () => {},
        })
            .then(() => {
                onTagUpdate(ticket.tid, tagInput);
                setEditingTag(false);
            })
            .finally(() => setTagSaving(false));
    };

    const handleTypeChange = (value: 'SUGGESTION' | 'BUG') => {
        if (value === currentType || !onTypeUpdate) return;
        setTypeSaving(true);
        submitData({
            data: { tid: ticket.tid, type: value },
            url: '/feedback/type',
            method: 'POST',
            successMessage: 'feedback.typeSaved',
            setIsFormDisabled: () => {},
            setIsModalOpen: () => {},
        })
            .then(() => {
                onTypeUpdate(ticket.tid, value);
            })
            .finally(() => setTypeSaving(false));
    };

    return (
        <>
            <Link to={to} style={{ textDecoration: 'none', display: 'block' }}>
                <Card
                    hoverable
                    style={{
                        borderRadius: 8,
                        transition: 'all 0.3s ease',
                        border: selected
                            ? `2px solid ${highlightColor || '#1677ff'}`
                            : `1px solid ${isDarkMode ? '#303030' : '#f0f0f0'}`,
                        boxShadow: selected
                            ? `0 0 0 2px ${highlightColor || '#1677ff'}30`
                            : undefined,
                        overflow: 'hidden',
                    }}
                    bodyStyle={{ padding: '12px 16px' }}
                    onMouseEnter={e => {
                        if (!selected) {
                            e.currentTarget.style.boxShadow = '0 4px 12px rgba(0, 0, 0, 0.15)';
                            e.currentTarget.style.transform = 'translateY(-2px)';
                        }
                    }}
                    onMouseLeave={e => {
                        if (!selected) {
                            e.currentTarget.style.boxShadow = '';
                            e.currentTarget.style.transform = '';
                        }
                    }}
                >
                    <div style={{ display: 'flex', gap: 12, alignItems: 'stretch' }}>
                        {/* 左侧状态竖线：仅关闭/完成时显示 */}
                        {showBar && (
                            <div
                                style={{
                                    width: 3,
                                    borderRadius: 99,
                                    background: statusColor,
                                    flexShrink: 0,
                                    alignSelf: 'stretch',
                                }}
                            />
                        )}

                        {/* 主要内容区域 */}
                        <div style={{ flex: 1, minWidth: 0 }}>
                            {/* 标题行：标题文字与 tag 内联混排，换行后 tag 跟随文字末尾 */}
                            <div style={{ marginBottom: 6, lineHeight: 1.6 }}>
                                <Text strong style={{ fontSize: 14 }}>
                                    {title}
                                </Text>
                                {feedbackTag && !editingTag && (
                                    <Tag
                                        color="blue"
                                        style={{ marginLeft: 6, verticalAlign: 'middle' }}
                                    >
                                        {feedbackTag}
                                    </Tag>
                                )}
                                {currentType === 'BUG' ? (
                                    <Tag
                                        color="red"
                                        style={{
                                            marginLeft: feedbackTag && !editingTag ? 4 : 6,
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        {gLang('feedback.typeBug')}
                                    </Tag>
                                ) : (
                                    <Tag
                                        color="green"
                                        style={{
                                            marginLeft: feedbackTag && !editingTag ? 4 : 6,
                                            verticalAlign: 'middle',
                                        }}
                                    >
                                        {gLang('feedback.typeSuggestion')}
                                    </Tag>
                                )}
                            </div>

                            {/* 类型和标签编辑区（管理端专用） */}
                            {(onTypeUpdate || onTagUpdate) && (
                                <div style={{ marginBottom: 6 }} onClick={e => e.preventDefault()}>
                                    <Space size="small" wrap onMouseDown={e => e.stopPropagation()}>
                                        {/* 类型编辑 */}
                                        {onTypeUpdate && (
                                            <Space size={4}>
                                                <Text type="secondary" style={{ fontSize: 12 }}>
                                                    {gLang('feedback.filterType')}:
                                                </Text>
                                                <Select
                                                    size="small"
                                                    value={currentType}
                                                    onChange={handleTypeChange}
                                                    loading={typeSaving}
                                                    style={{ width: 80 }}
                                                    options={[
                                                        {
                                                            value: 'SUGGESTION',
                                                            label: gLang('feedback.typeSuggestion'),
                                                        },
                                                        {
                                                            value: 'BUG',
                                                            label: gLang('feedback.typeBug'),
                                                        },
                                                    ]}
                                                />
                                            </Space>
                                        )}

                                        {/* 标签编辑 */}
                                        {onTagUpdate && (
                                            <>
                                                {editingTag ? (
                                                    <>
                                                        <Input
                                                            size="small"
                                                            value={tagInput}
                                                            onChange={e =>
                                                                setTagInput(e.target.value)
                                                            }
                                                            placeholder={gLang(
                                                                'feedback.tagPlaceholder'
                                                            )}
                                                            style={{ width: 120 }}
                                                            maxLength={64}
                                                            onPressEnter={handleSaveTag as any}
                                                        />
                                                        <Button
                                                            type="primary"
                                                            size="small"
                                                            loading={tagSaving}
                                                            onClick={handleSaveTag}
                                                        >
                                                            {gLang('common.save')}
                                                        </Button>
                                                        <Button
                                                            size="small"
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setEditingTag(false);
                                                                setTagInput(feedbackTag);
                                                            }}
                                                        >
                                                            {gLang('common.cancel')}
                                                        </Button>
                                                    </>
                                                ) : (
                                                    <>
                                                        <Text
                                                            type="secondary"
                                                            style={{ fontSize: 12 }}
                                                        >
                                                            {gLang('feedback.tag')}:{' '}
                                                            {feedbackTag || '-'}
                                                        </Text>
                                                        <Button
                                                            type="link"
                                                            size="small"
                                                            icon={<EditOutlined />}
                                                            style={{
                                                                padding: 0,
                                                                height: 'auto',
                                                                fontSize: 12,
                                                            }}
                                                            onClick={e => {
                                                                e.preventDefault();
                                                                e.stopPropagation();
                                                                setTagInput(feedbackTag);
                                                                setEditingTag(true);
                                                            }}
                                                        />
                                                    </>
                                                )}
                                            </>
                                        )}
                                    </Space>
                                </div>
                            )}

                            {/* 元信息行 */}
                            <Space wrap size="small" style={{ fontSize: 12 }}>
                                {ticket.create_time && (
                                    <Text type="secondary">
                                        {gLang('feedback.createdAt')}{' '}
                                        {formatSmartTime(ticket.create_time)}
                                    </Text>
                                )}
                                {replyCount > 0 && (
                                    <>
                                        {ticket.create_time && <Text type="secondary">·</Text>}
                                        <Space size={4}>
                                            <Text type="secondary">
                                                {gLang('feedback.reply').replace(
                                                    '{count}',
                                                    String(replyCount)
                                                )}
                                            </Text>
                                        </Space>
                                    </>
                                )}
                                {lastReplyTime && lastReplyTime !== ticket.create_time && (
                                    <>
                                        <Text type="secondary">·</Text>
                                        <Text type="secondary">
                                            {gLang('feedback.lastReplyAt')}{' '}
                                            {formatSmartTime(lastReplyTime)}
                                        </Text>
                                    </>
                                )}
                            </Space>
                        </div>

                        {/* 右侧：删除按钮 */}
                        {onRemove && (
                            <div style={{ flexShrink: 0 }}>
                                <Button
                                    type="text"
                                    danger
                                    size="small"
                                    icon={<DeleteOutlined />}
                                    loading={removing}
                                    onClick={handleRemove}
                                    title={gLang('feedback.delete')}
                                />
                            </div>
                        )}
                    </div>
                </Card>
            </Link>
            {modalContextHolder}
        </>
    );
};

export default FeedbackListItem;
