// 编辑媒体信息的组件

import {
    Button,
    Col,
    DatePicker,
    Form,
    Input,
    Row,
    Select,
    Space,
    Tooltip,
    Typography,
} from 'antd';
import { useEffect, useState } from 'react';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import { MediaUser, MediaStatus } from '@ecuc/shared/types/media.types';
import { MEDIA_STATUS_MAP } from '@ecuc/shared/constants/media.constants';
import dayjs from 'dayjs';
import utc from 'dayjs/plugin/utc';
import { CloseOutlined, EditOutlined, HistoryOutlined, SaveOutlined } from '@ant-design/icons';
import React from 'react';

// 注册 UTC 插件
dayjs.extend(utc);

const { Text } = Typography;

interface EditMediaComponentProps {
    media: MediaUser;
    onUpdate: () => void;
    onClose: () => void;
    onViewLogs?: () => void;
    canViewLogs?: boolean;
}

const DATE_FORMAT = 'YYYY-MM-DD';

const MEDIA_STATUS_OPTIONS = Object.entries(MEDIA_STATUS_MAP).map(([value, label]) => ({
    value,
    label: `${value} ${label}`,
}));

const EditMediaComponent = ({
    media,
    onUpdate,
    onClose,
    onViewLogs,
    canViewLogs = false,
}: EditMediaComponentProps) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState<boolean>(false);
    const [editMode, setEditMode] = useState<boolean>(false);
    const [changedFields, setChangedFields] = useState<Set<string>>(new Set());

    useEffect(() => {
        // 简单处理日期字段
        const formattedMedia = {
            ...media,
            status:
                media.status !== undefined && media.status !== null
                    ? String(media.status)
                    : undefined,
            expireDate: media.expireDate ? dayjs(media.expireDate) : undefined,
            lastReviewed: media.lastReviewed ? dayjs(media.lastReviewed) : undefined,
            createTime: media.createTime ? dayjs(media.createTime) : undefined,
        };
        form.setFieldsValue(formattedMedia);
    }, [media, form]);

    // 监听表单变更，记录已修改的字段
    const onValuesChange = (changedValues: any) => {
        const fieldName = Object.keys(changedValues)[0];
        setChangedFields(prev => new Set([...prev, fieldName]));
    };

    // 切换到编辑模式
    const enterEditMode = () => {
        setEditMode(true);
    };

    // 取消编辑，重置表单和修改记录
    const cancelEdit = () => {
        setEditMode(false);
        setChangedFields(new Set());
        form.setFieldsValue({
            ...media,
            expireDate: media.expireDate ? dayjs(media.expireDate) : undefined,
            lastReviewed: media.lastReviewed ? dayjs(media.lastReviewed) : undefined,
            createTime: media.createTime ? dayjs(media.createTime) : undefined,
        });
    };

    const handleSubmit = async (values: any) => {
        // 确保所有日期字段都被正确处理
        const formatDate = (dateValue: any) => {
            if (!dateValue) return undefined;

            // 对象类型（如dayjs）
            if (dateValue && typeof dateValue === 'object') {
                if (dayjs.isDayjs(dateValue)) {
                    return dateValue.format(DATE_FORMAT);
                }
                if (dateValue.format) {
                    return dateValue.format(DATE_FORMAT);
                }
            }

            // 字符串类型但不是日期格式
            if (typeof dateValue === 'string' && !/^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                const parsed = dayjs(dateValue);
                if (parsed.isValid()) {
                    return parsed.format(DATE_FORMAT);
                }
            }

            // 已经是正确格式的字符串
            if (typeof dateValue === 'string' && /^\d{4}-\d{2}-\d{2}/.test(dateValue)) {
                return dateValue;
            }

            // 其他情况
            try {
                return dayjs(dateValue).format(DATE_FORMAT);
            } catch {
                return undefined;
            }
        };

        // 构建仅包含修改过的字段的对象
        const modifiedValues: Partial<MediaUser> = {};
        changedFields.forEach(fieldName => {
            let value = values[fieldName];
            if (
                fieldName === 'expireDate' ||
                fieldName === 'lastReviewed' ||
                fieldName === 'createTime'
            ) {
                value = formatDate(value);
            }
            if (fieldName === 'status' && value !== undefined && value !== null) {
                value = String(value); // 保证 status 为 string
            }
            modifiedValues[fieldName as keyof MediaUser] = value;
        });

        // 确保 id 总是包含在请求中
        modifiedValues.id = media.id;

        setLoading(true);
        await fetchData({
            url: '/media/update',
            method: 'POST',
            data: modifiedValues,
            setData: () => {
                setLoading(false);
                setEditMode(false);
                setChangedFields(new Set());
                onClose();
            },
        });
        onUpdate(); // 通知父组件更新数据
    };

    // 根据字段名判断该字段是否已修改
    const isFieldChanged = (fieldName: string) => {
        return changedFields.has(fieldName);
    };

    // 简化显示值逻辑
    const getDisplayValue = (fieldName: string, dateField = false) => {
        const value = media[fieldName as keyof MediaUser];

        if (value === undefined || value === null || value === '') {
            return '-';
        }

        if (fieldName === 'status') {
            // 状态字段显示数字加中文描述
            const statusText = MEDIA_STATUS_MAP[value as MediaStatus];
            return statusText ? `${value} ${statusText}` : String(value);
        }

        if (dateField && value && !Array.isArray(value)) {
            // 使用 dayjs 解析 UTC 时间并格式化显示
            return dayjs
                .utc(value as string)
                .local()
                .format(DATE_FORMAT);
        }

        // 新增：主页链接字段显示为超链接
        if (fieldName === 'link') {
            return (
                <a href={String(value)} target="_blank" rel="noopener noreferrer">
                    {String(value)}
                </a>
            );
        }

        return String(value);
    };

    // 渲染表单项，根据编辑模式决定展示方式
    const renderFormItem = (
        label: string,
        name: string,
        inputComponent: React.ReactNode,
        rules?: any[]
    ) => {
        return (
            <Form.Item
                label={
                    <Space>
                        {label}
                        {isFieldChanged(name) && editMode && (
                            <Tooltip title={gLang('common.modified')}>
                                <Text type="warning">*</Text>
                            </Tooltip>
                        )}
                    </Space>
                }
                name={name}
                rules={rules}
            >
                {editMode ? (
                    inputComponent
                ) : (
                    <div className="read-only-value" style={{ minHeight: '22px' }}>
                        {['expireDate', 'lastReviewed', 'createTime'].includes(name)
                            ? getDisplayValue(name, true)
                            : getDisplayValue(name)}
                    </div>
                )}
            </Form.Item>
        );
    };

    return (
        <div className="edit-media-container">
            <div className="edit-media-header">
                <div className="edit-media-title"></div>
            </div>

            <Form
                form={form}
                layout="vertical"
                onFinish={handleSubmit}
                onValuesChange={onValuesChange}
                style={{
                    marginTop: '10px',
                    maxWidth: '100%',
                    padding: '0 10px',
                }}
            >
                <Row gutter={16}>
                    <Col span={12}>
                        {renderFormItem(gLang('mediaPanel.media_id'), 'id', <Input disabled />)}
                    </Col>
                    <Col span={12}>
                        {renderFormItem(
                            gLang('mediaPanel.statusDis'),
                            'status',
                            <Select
                                options={MEDIA_STATUS_OPTIONS}
                                disabled={!editMode}
                                style={{ width: '100%' }}
                            />
                        )}
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        {renderFormItem(
                            gLang('mediaPanel.EBalance'),
                            'EBalance',
                            <Input inputMode="decimal" />,
                            [
                                {
                                    validator: (_: any, value: any) => {
                                        if (value === undefined || value === null || value === '')
                                            return Promise.resolve();
                                        const str = String(value).trim();
                                        if (!/^(\d+)(\.\d+)?$/.test(str)) {
                                            return Promise.reject(
                                                new Error(
                                                    gLang('mediaPanel.validation.numberRequired')
                                                )
                                            );
                                        }
                                        const digitsOnly = str.replace(/\D/g, '');
                                        if (digitsOnly.length > 15) {
                                            return Promise.reject(
                                                new Error(
                                                    gLang('mediaPanel.validation.max15Digits')
                                                )
                                            );
                                        }
                                        return Promise.resolve();
                                    },
                                },
                            ]
                        )}
                    </Col>
                    <Col span={12}>
                        {renderFormItem(gLang('mediaPanel.ecid'), 'ECID', <Input />)}
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={12}>
                        {renderFormItem(gLang('mediaPanel.remark'), 'QQNumber', <Input />)}
                    </Col>
                    <Col span={12}>{renderFormItem(gLang('mediaPanel.mpa'), 'mpa', <Input />)}</Col>
                </Row>

                {/* 主页链接保持全宽 */}
                {renderFormItem(gLang('mediaPanel.link'), 'link', <Input />)}

                <Row gutter={16}>
                    <Col span={12}>
                        {renderFormItem(
                            gLang('mediaPanel.expire_date'),
                            'expireDate',
                            <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                        )}
                    </Col>
                    <Col span={12}>
                        {renderFormItem(
                            gLang('mediaPanel.lastReviewed'),
                            'lastReviewed',
                            <DatePicker format={DATE_FORMAT} style={{ width: '100%' }} />
                        )}
                    </Col>
                </Row>

                <Row gutter={16}>
                    <Col span={24}>
                        {renderFormItem(
                            gLang('mediaPanel.create_time'),
                            'createTime',
                            <DatePicker format={DATE_FORMAT} disabled style={{ width: '100%' }} />
                        )}
                    </Col>
                </Row>

                {/* 隐藏表单提交按钮 - 使用头部右上角的按钮代替 */}
                <Form.Item style={{ display: 'none' }}>
                    <Button type="primary" htmlType="submit">
                        {gLang('save')}
                    </Button>
                </Form.Item>
            </Form>
            <div className="edit-media-actions">
                {editMode ? (
                    <Space>
                        <Button icon={<CloseOutlined />} onClick={cancelEdit}>
                            {gLang('cancel')}
                        </Button>
                        <Button
                            type="primary"
                            icon={<SaveOutlined />}
                            onClick={() => form.submit()}
                            loading={loading}
                        >
                            {gLang('save')}
                        </Button>
                    </Space>
                ) : (
                    <Space>
                        <Button type="primary" icon={<EditOutlined />} onClick={enterEditMode}>
                            {gLang('admin.editInfo')}
                        </Button>
                        {canViewLogs && (
                            <Button
                                icon={<HistoryOutlined />}
                                onClick={onViewLogs}
                                disabled={!onViewLogs}
                            >
                                {gLang('mediaPanel.viewEpointLogs')}
                            </Button>
                        )}
                    </Space>
                )}
            </div>
        </div>
    );
};

export default EditMediaComponent;
