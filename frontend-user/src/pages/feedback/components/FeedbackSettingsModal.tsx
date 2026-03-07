// 反馈设置 Modal 组件
// 在 Feedback 主页和 FeedbackDetail 中直接弹出，不跳转到单独页面

import React, { useState, useEffect } from 'react';
import { Modal, Form, Select, Checkbox, Button, Space, Alert, Spin } from 'antd';
import { gLang } from '@common/language';
import { PlayerBindListData } from '@ecuc/shared/types/player.types';
import { fetchData, submitData } from '@common/axiosConfig';
import { useTheme } from '@common/contexts/ThemeContext';
import { useFeedbackEligibility } from '../../../contexts/FeedbackEligibilityContext';

interface FeedbackSettingsForm {
    account: string;
    notifications: string[];
    inGameAccounts?: string[];
}

interface FeedbackSettingsResponse {
    account: string;
    notifications: string[];
    inGameAccounts?: string[];
    openid: string;
    wechatOpenIdPrefix?: string;
}

interface FeedbackSettingsModalProps {
    open: boolean;
    onClose: () => void;
}

const FeedbackSettingsModal: React.FC<FeedbackSettingsModalProps> = ({ open, onClose }) => {
    const [form] = Form.useForm<FeedbackSettingsForm>();
    const [ecList, setEcList] = useState<PlayerBindListData[]>([]);
    const [openid, setOpenid] = useState<string>('');
    const [wechatOpenIdPrefix, setWechatOpenIdPrefix] = useState<string>('oWac56');
    // 两个数据源都加载完毕才显示表单，避免显示"无 ECID"误导
    const [ecListLoaded, setEcListLoaded] = useState(false);
    const [settingsLoaded, setSettingsLoaded] = useState(false);
    const [submitting, setSubmitting] = useState(false);
    const { getThemeColor } = useTheme();
    const { refresh: refreshEligibility } = useFeedbackEligibility();

    // 使用 Form.useWatch 监听表单值变化
    const notifications = Form.useWatch('notifications', form) || [];
    const inGameAccounts = Form.useWatch('inGameAccounts', form) || [];

    const isDataLoaded = ecListLoaded && settingsLoaded;
    const isInGameAvailable = ecList.length > 0;
    const isWechatAvailable = wechatOpenIdPrefix ? openid.startsWith(wechatOpenIdPrefix) : false;
    const isQQAvailable = false;

    // 每次打开 Modal 时重新加载数据
    useEffect(() => {
        if (!open) return;

        setEcListLoaded(false);
        setSettingsLoaded(false);

        // 并行加载绑定列表和当前设置
        fetchData({
            url: '/ec/list',
            method: 'GET',
            data: {},
            setData: (data: PlayerBindListData[]) => {
                setEcList(data || []);
                setEcListLoaded(true);
            },
        }).catch(() => setEcListLoaded(true));

        fetchData({
            url: '/feedback/settings',
            method: 'GET',
            data: {},
            setData: (data: FeedbackSettingsResponse) => {
                form.setFieldsValue({
                    // 旧设置是匿名则不填，强制重新选择 ECID
                    account: data.account === 'anonymous' ? undefined : data.account,
                    notifications: data.notifications || [],
                    inGameAccounts: data.inGameAccounts || [],
                });
                if (data.openid) setOpenid(data.openid);
                if (data.wechatOpenIdPrefix !== undefined)
                    setWechatOpenIdPrefix(data.wechatOpenIdPrefix);
                setSettingsLoaded(true);
            },
        }).catch(() => setSettingsLoaded(true));
    }, [open, form]);

    // 关闭时重置状态
    const handleClose = () => {
        form.resetFields();
        setEcListLoaded(false);
        setSettingsLoaded(false);
        onClose();
    };

    const getNotificationsArray = (): string[] => {
        const value = form.getFieldValue('notifications');
        return Array.isArray(value) ? value : [];
    };

    const handleInGameAccountsChange = (checkedValues: string[]) => {
        const safeValues = Array.isArray(checkedValues) ? checkedValues : [];
        form.setFieldsValue({ inGameAccounts: safeValues });
        if (safeValues.length === 0) {
            form.setFieldsValue({
                notifications: getNotificationsArray().filter(n => n !== 'inGame'),
            });
        } else {
            const current = getNotificationsArray();
            if (!current.includes('inGame')) {
                form.setFieldsValue({ notifications: [...current, 'inGame'] });
            }
        }
    };

    const handleInGameCheckAll = (checked: boolean) => {
        const current = getNotificationsArray();
        if (checked) {
            form.setFieldsValue({
                notifications: [...current, 'inGame'],
                inGameAccounts: ecList.map(ec => ec.ecid),
            });
        } else {
            form.setFieldsValue({
                notifications: current.filter(n => n !== 'inGame'),
                inGameAccounts: [],
            });
        }
    };

    const handleSubmit = async (values: FeedbackSettingsForm) => {
        let notifs = Array.isArray(values.notifications) ? values.notifications : [];
        const inGame = Array.isArray(values.inGameAccounts) ? values.inGameAccounts : [];

        if (inGame.length > 0 && !notifs.includes('inGame')) notifs = [...notifs, 'inGame'];
        if (inGame.length === 0 && notifs.includes('inGame'))
            notifs = notifs.filter(n => n !== 'inGame');

        setSubmitting(true);
        try {
            await submitData({
                url: '/feedback/settings',
                method: 'POST',
                data: { account: values.account, notifications: notifs, inGameAccounts: inGame },
                successMessage: gLang('feedback.save'),
                setIsFormDisabled: () => {},
                setIsModalOpen: () => {},
            });
            // 保存后刷新资格状态，让回复框立即响应
            await refreshEligibility();
            handleClose();
        } finally {
            setSubmitting(false);
        }
    };

    return (
        <Modal
            title={gLang('feedback.settings')}
            open={open}
            onCancel={handleClose}
            footer={null}
            destroyOnClose
            width={480}
        >
            {/* 数据加载完毕前显示 Spin，避免闪烁错误状态 */}
            {!isDataLoaded ? (
                <div style={{ textAlign: 'center', padding: '32px 0' }}>
                    <Spin />
                </div>
            ) : (
                <Form
                    form={form}
                    layout="vertical"
                    onFinish={handleSubmit}
                    initialValues={{ account: undefined, notifications: [], inGameAccounts: [] }}
                >
                    {/* 无 ECID 绑定时的提示 */}
                    {ecList.length === 0 && (
                        <Alert
                            type="warning"
                            showIcon
                            message={gLang('feedback.selectAccountRequireEcid')}
                            style={{ marginBottom: 16 }}
                        />
                    )}

                    <Form.Item
                        label={gLang('feedback.selectAccount')}
                        name="account"
                        tooltip={gLang('feedback.selectAccountRequireEcid')}
                        rules={[
                            { required: true, message: gLang('feedback.eligibilityRequireEcid') },
                        ]}
                    >
                        <Select
                            placeholder={
                                ecList.length === 0
                                    ? gLang('feedback.selectAccountRequireEcid')
                                    : gLang('feedback.selectAccount')
                            }
                            disabled={ecList.length === 0}
                        >
                            {ecList.map(ec => (
                                <Select.Option key={ec.ecid} value={ec.ecid}>
                                    {ec.name || ec.ecid} ({ec.ecid})
                                </Select.Option>
                            ))}
                        </Select>
                    </Form.Item>

                    <Form.Item label={gLang('feedback.notificationOptions')} name="notifications">
                        <Space direction="vertical" style={{ width: '100%' }}>
                            <Checkbox.Group
                                value={
                                    Array.isArray(notifications)
                                        ? notifications.filter(n => n !== 'inGame')
                                        : []
                                }
                                onChange={values => {
                                    const safe = Array.isArray(values) ? values : [];
                                    const inGameChecked =
                                        Array.isArray(notifications) &&
                                        notifications.includes('inGame');
                                    form.setFieldsValue({
                                        notifications: inGameChecked ? [...safe, 'inGame'] : safe,
                                    });
                                }}
                            >
                                <Space direction="vertical">
                                    <Checkbox value="wechat" disabled={!isWechatAvailable}>
                                        {gLang('feedback.wechat')}
                                        {!isWechatAvailable && (
                                            <span
                                                style={{
                                                    color: getThemeColor({
                                                        light: '#999',
                                                        dark: '#666',
                                                    }),
                                                    marginLeft: 8,
                                                }}
                                            >
                                                ({gLang('feedback.unboundDisabled')})
                                            </span>
                                        )}
                                    </Checkbox>
                                    <Checkbox value="qq" disabled={!isQQAvailable}>
                                        {gLang('feedback.qq')}
                                        {!isQQAvailable && (
                                            <span
                                                style={{
                                                    color: getThemeColor({
                                                        light: '#999',
                                                        dark: '#666',
                                                    }),
                                                    marginLeft: 8,
                                                }}
                                            >
                                                ({gLang('feedback.qqNotImplemented')})
                                            </span>
                                        )}
                                    </Checkbox>
                                </Space>
                            </Checkbox.Group>

                            {/* 服内通知 */}
                            <div>
                                <Checkbox
                                    disabled={!isInGameAvailable}
                                    indeterminate={
                                        isInGameAvailable &&
                                        Array.isArray(inGameAccounts) &&
                                        inGameAccounts.length > 0 &&
                                        inGameAccounts.length < ecList.length
                                    }
                                    checked={
                                        isInGameAvailable &&
                                        Array.isArray(inGameAccounts) &&
                                        inGameAccounts.length === ecList.length &&
                                        inGameAccounts.length > 0
                                    }
                                    onChange={e => handleInGameCheckAll(e.target.checked)}
                                >
                                    {gLang('feedback.inGame')}
                                    {!isInGameAvailable && (
                                        <span
                                            style={{
                                                color: getThemeColor({
                                                    light: '#999',
                                                    dark: '#666',
                                                }),
                                                marginLeft: 8,
                                            }}
                                        >
                                            ({gLang('feedback.unboundDisabled')})
                                        </span>
                                    )}
                                </Checkbox>
                                {ecList.length > 0 && (
                                    <div style={{ marginLeft: 24, marginTop: 8 }}>
                                        <Checkbox.Group
                                            value={
                                                Array.isArray(inGameAccounts) ? inGameAccounts : []
                                            }
                                            onChange={handleInGameAccountsChange}
                                            style={{ width: '100%' }}
                                        >
                                            <Space direction="vertical" style={{ width: '100%' }}>
                                                {ecList.map(ec => (
                                                    <Checkbox key={ec.ecid} value={ec.ecid}>
                                                        {ec.name || ec.ecid} ({ec.ecid})
                                                    </Checkbox>
                                                ))}
                                            </Space>
                                        </Checkbox.Group>
                                    </div>
                                )}
                            </div>
                        </Space>
                    </Form.Item>

                    {/* 隐藏字段：服内账号列表 */}
                    <Form.Item name="inGameAccounts" hidden>
                        <input type="hidden" />
                    </Form.Item>

                    <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                        <Space>
                            <Button onClick={handleClose}>{gLang('feedback.cancel')}</Button>
                            <Button type="primary" htmlType="submit" loading={submitting}>
                                {gLang('feedback.save')}
                            </Button>
                        </Space>
                    </Form.Item>
                </Form>
            )}
        </Modal>
    );
};

export default FeedbackSettingsModal;
