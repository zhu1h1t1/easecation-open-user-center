// 找回账号模态框组件

import React, { useState } from 'react';
import { Modal, Form, Input, Button, Space, Alert, message } from 'antd';
import { UserOutlined, MailOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import { submitData } from '@common/axiosConfig';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';

interface AccountRecoveryModalProps {
    open: boolean;
    onCancel: () => void;
}

const AccountRecoveryModal: React.FC<AccountRecoveryModalProps> = ({ open, onCancel }) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const { isCustomThemeActive, customTheme } = useTheme();
    const [messageApi, contextHolder] = message.useMessage();

    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const modalStyles = isBlackOrangeActive
        ? {
              body: {
                  background: palette.surfaceAlt,
                  color: palette.textPrimary,
              },
              header: {
                  background: palette.surface,
                  color: palette.textPrimary,
                  borderBottom: `1px solid ${palette.border}`,
              },
              footer: {
                  background: palette.surface,
                  borderTop: `1px solid ${palette.border}`,
              },
          }
        : undefined;

    const handleSubmit = async (values: { email: string; ecid: string }) => {
        try {
            setLoading(true);

            await submitData({
                url: '/account/recovery',
                method: 'POST',
                data: {
                    email: values.email,
                    ecid: values.ecid,
                },
                successMessage: gLang('ecDetail.accountRecovery.success'),
                setIsFormDisabled: () => {},
                setIsModalOpen: () => {},
                messageApi: messageApi,
            });

            messageApi.success(gLang('ecDetail.accountRecovery.emailSent'));
            form.resetFields();
            onCancel();
        } finally {
            setLoading(false);
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('ecDetail.accountRecovery.title')}
                open={open}
                onCancel={onCancel}
                footer={null}
                styles={modalStyles}
                width={500}
            >
                <Space orientation="vertical" style={{ width: '100%' }} size={16}>
                    <Alert
                        message={gLang('ecDetail.unbindWarning')}
                        type="warning"
                        showIcon
                        style={{
                            ...(isBlackOrangeActive
                                ? {
                                      background: palette.surfaceAlt,
                                      borderColor: palette.border,
                                      color: palette.textPrimary,
                                  }
                                : {}),
                        }}
                    />
                    <Alert
                        message={gLang('ecDetail.accountRecovery.description')}
                        type="info"
                        showIcon
                        style={
                            isBlackOrangeActive
                                ? {
                                      background: palette.surfaceAlt,
                                      borderColor: palette.border,
                                      color: palette.textPrimary,
                                  }
                                : undefined
                        }
                    />

                    <Form form={form} onFinish={handleSubmit} layout="vertical" size="large">
                        <Form.Item
                            label={gLang('ecDetail.accountRecovery.emailLabel')}
                            name="email"
                            rules={[
                                {
                                    required: true,
                                    message: gLang('accountRecovery.emailPlaceholder'),
                                },
                                { type: 'email', message: gLang('accountRecovery.emailInvalid') },
                            ]}
                        >
                            <Input
                                prefix={<MailOutlined />}
                                placeholder={gLang('ecDetail.accountRecovery.emailPlaceholder')}
                                style={
                                    isBlackOrangeActive
                                        ? {
                                              background: palette.surfaceAlt,
                                              borderColor: palette.border,
                                              color: palette.textPrimary,
                                          }
                                        : undefined
                                }
                            />
                        </Form.Item>

                        <Form.Item
                            label={gLang('ecDetail.accountRecovery.ecidLabel')}
                            name="ecid"
                            rules={[
                                {
                                    required: true,
                                    message: gLang('accountRecovery.ecidPlaceholder'),
                                },
                                { min: 3, message: gLang('accountRecovery.ecidMinLength') },
                            ]}
                        >
                            <Input
                                prefix={<UserOutlined />}
                                placeholder={gLang('ecDetail.accountRecovery.ecidPlaceholder')}
                                style={
                                    isBlackOrangeActive
                                        ? {
                                              background: palette.surfaceAlt,
                                              borderColor: palette.border,
                                              color: palette.textPrimary,
                                          }
                                        : undefined
                                }
                            />
                        </Form.Item>

                        <Form.Item style={{ marginBottom: 0, textAlign: 'right' }}>
                            <Space>
                                <Button onClick={onCancel}>{gLang('cancel')}</Button>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={loading}
                                    style={
                                        isBlackOrangeActive
                                            ? {
                                                  background: palette.accent,
                                                  borderColor: palette.accent,
                                                  color: palette.textPrimary,
                                              }
                                            : undefined
                                    }
                                >
                                    {gLang('ecDetail.accountRecovery.submitButton')}
                                </Button>
                            </Space>
                        </Form.Item>
                    </Form>
                </Space>
            </Modal>
        </>
    );
};

export default AccountRecoveryModal;
