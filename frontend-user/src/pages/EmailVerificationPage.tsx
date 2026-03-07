import React, { useEffect, useState } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import { Card, Result, Button, Spin, Alert, Typography, Space, Form, Input, message } from 'antd';
import {
    CheckCircleOutlined,
    CloseCircleOutlined,
    LoadingOutlined,
    LockOutlined,
} from '@ant-design/icons';
import { verifyEmailToken } from '../services/emailVerification.service';
import { encryptPassword } from '@common/utils/passwordUtils';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { useTheme } from '@common/contexts/ThemeContext';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import { useAuth } from '@common/contexts/AuthContext';

const { Title, Text } = Typography;

const EmailVerificationPage: React.FC = () => {
    const [messageApi, contextHolder] = message.useMessage();
    const [searchParams] = useSearchParams();
    const navigate = useNavigate();
    const { isCustomThemeActive, customTheme } = useTheme();
    const [form] = Form.useForm();
    const { setUser } = useAuth();

    const [loading, setLoading] = useState(true);
    const [passwordLoading, setPasswordLoading] = useState(false);
    const [result, setResult] = useState<{
        success: boolean;
        message: string;
        action?: string;
        ecid?: string;
    } | null>(null);

    const token = searchParams.get('token');

    // 检测是否为网易账号
    const isNeteaseAccount = (ecid: string): boolean => {
        return ecid.startsWith('netease');
    };

    // 检查用户认证状态
    const checkUserAuth = async () => {
        try {
            const response = await axiosInstance.get('/user/info');
            setUser(response.data);
            return true;
        } catch {
            return false;
        }
    };

    useEffect(() => {
        const verifyToken = async () => {
            if (!token) {
                setResult({
                    success: false,
                    message: gLang('emailVerification.missingToken'),
                });
                setLoading(false);
                return;
            }

            try {
                // 对于重置密码操作，不直接验证token，而是解析token获取信息
                const tokenParts = token.split('.');
                if (tokenParts.length === 3) {
                    const payload = JSON.parse(atob(tokenParts[1]));
                    if (payload.action === 'reset_password') {
                        // 检测是否为网易账号
                        if (isNeteaseAccount(payload.ecid)) {
                            // 网易账号直接调用验证API，无需密码设置
                            const response = await verifyEmailToken(token);

                            if (response.EPF_code === 200) {
                                setResult({
                                    success: true,
                                    message: response.message,
                                    action: payload.action,
                                    ecid: payload.ecid,
                                });
                            } else {
                                setResult({
                                    success: false,
                                    message:
                                        response.message ||
                                        gLang('emailVerification.verificationFailed'),
                                });
                            }
                        } else {
                            // 普通账号显示密码设置表单
                            setResult({
                                success: false,
                                message: gLang('emailVerification.setNewPassword'),
                                action: payload.action,
                                ecid: payload.ecid,
                            });
                        }
                        setLoading(false);
                        return;
                    }
                }

                // 其他操作正常验证token
                const response = await verifyEmailToken(token);

                if (response.EPF_code === 200) {
                    setResult({
                        success: true,
                        message: response.message,
                        action: response.action,
                        ecid: response.ecid,
                    });
                } else {
                    setResult({
                        success: false,
                        message: response.message || gLang('emailVerification.verificationFailed'),
                    });
                }
            } catch {
                setResult({
                    success: false,
                    message: gLang('emailVerification.verificationError'),
                });
            } finally {
                setLoading(false);
            }
        };

        verifyToken();
    }, [token]);

    // 主题样式
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const cardStyle = isBlackOrangeActive
        ? {
              background: '#1a1a1a',
              borderColor: '#333333',
          }
        : {};

    const buttonStyle = isBlackOrangeActive
        ? {
              background: '#ff6b35',
              borderColor: '#ff6b35',
              color: '#ffffff',
          }
        : {};

    if (loading) {
        return (
            <Wrapper>
                <Card style={cardStyle}>
                    <div style={{ textAlign: 'center', padding: '50px 0' }}>
                        <Spin
                            indicator={
                                <LoadingOutlined
                                    style={{
                                        fontSize: 48,
                                        color: isBlackOrangeActive ? '#ff6b35' : '#1890ff',
                                    }}
                                    spin
                                />
                            }
                            size="large"
                        />
                        <div style={{ marginTop: 24 }}>
                            <Text
                                style={{
                                    color: isBlackOrangeActive ? '#ffffff' : '#000000',
                                    fontSize: 16,
                                }}
                            >
                                {gLang('emailVerification.verifying')}
                            </Text>
                        </div>
                    </div>
                </Card>
            </Wrapper>
        );
    }

    if (!result) {
        return (
            <Wrapper>
                <Card style={cardStyle}>
                    <Result
                        status="error"
                        title={gLang('emailVerification.verificationFailed')}
                        subTitle={gLang('emailVerification.verificationError')}
                    />
                </Card>
            </Wrapper>
        );
    }

    const getActionDescription = (action?: string, ecid?: string) => {
        const descriptions: { [key: string]: string } = {
            clear_security: gLang('emailVerification.actionDescriptions.clear_security'),
            set_security: gLang('emailVerification.actionDescriptions.set_security'),
            reset_password: isNeteaseAccount(ecid || '')
                ? gLang('emailVerification.actionDescriptions.unbind_ticket')
                : gLang('emailVerification.actionDescriptions.reset_password'),
        };
        return descriptions[action || ''] || gLang('common.confirm');
    };

    // 处理密码重置
    const handlePasswordReset = async (values: {
        newPassword: string;
        confirmPassword: string;
    }) => {
        if (!result?.ecid || !token) {
            messageApi.error(gLang('emailVerification.missingInfo'));
            return;
        }

        try {
            setPasswordLoading(true);

            // 检测是否为网易账号
            if (isNeteaseAccount(result.ecid)) {
                // 网易账号直接调用验证API，无需密码
                const response = await verifyEmailToken(token);

                if (response.EPF_code === 200) {
                    setResult({
                        success: true,
                        message: response.message,
                        action: result.action,
                        ecid: result.ecid,
                    });
                } else {
                    messageApi.error(
                        response.message || gLang('emailVerification.verificationFailed')
                    );
                }
            } else {
                // 普通账号加密新密码
                const newPasswordHash = await encryptPassword(result.ecid, values.newPassword);

                // 使用邮件验证服务调用API
                const response = await verifyEmailToken(token, newPasswordHash);

                if (response.EPF_code === 200) {
                    setResult({
                        success: true,
                        message: response.message,
                        action: result.action,
                        ecid: result.ecid,
                    });
                } else {
                    messageApi.error(
                        response.message || gLang('emailVerification.passwordResetError')
                    );
                }
            }
        } catch {
            messageApi.error(gLang('emailVerification.passwordResetFailed'));
        } finally {
            setPasswordLoading(false);
        }
    };

    return (
        <Wrapper>
            {contextHolder}
            <Card style={cardStyle}>
                {result.action === 'reset_password' && !result.success ? (
                    // 密码重置表单
                    <div style={{ maxWidth: 400, margin: '0 auto', padding: '20px 0' }}>
                        <div style={{ textAlign: 'center', marginBottom: 32 }}>
                            <LockOutlined
                                style={{
                                    fontSize: 48,
                                    color: isBlackOrangeActive ? '#ff6b35' : '#1890ff',
                                    marginBottom: 16,
                                }}
                            />
                            <Title
                                level={3}
                                style={{
                                    color: isBlackOrangeActive ? '#ffffff' : '#000000',
                                    marginBottom: 8,
                                }}
                            >
                                {gLang('emailVerification.resetPassword')}
                            </Title>
                            <Text style={{ color: isBlackOrangeActive ? '#cccccc' : '#666666' }}>
                                {gLang('emailVerification.setPasswordForEcid', {
                                    ecid: result.ecid || '',
                                })}
                            </Text>
                        </div>

                        <Form
                            form={form}
                            onFinish={handlePasswordReset}
                            layout="vertical"
                            size="large"
                        >
                            <Form.Item
                                label={gLang('emailVerification.newPassword')}
                                name="newPassword"
                                rules={[
                                    {
                                        required: true,
                                        message: gLang('emailVerification.newPasswordRequired'),
                                    },
                                    {
                                        min: 6,
                                        message: gLang('emailVerification.passwordMinLength'),
                                    },
                                ]}
                            >
                                <Input.Password
                                    placeholder={gLang('emailVerification.newPasswordPlaceholder')}
                                    style={
                                        isBlackOrangeActive
                                            ? {
                                                  background: '#1a1a1a',
                                                  borderColor: '#333333',
                                                  color: '#ffffff',
                                              }
                                            : undefined
                                    }
                                />
                            </Form.Item>

                            <Form.Item
                                label={gLang('emailVerification.confirmPassword')}
                                name="confirmPassword"
                                dependencies={['newPassword']}
                                rules={[
                                    {
                                        required: true,
                                        message: gLang('emailVerification.confirmPasswordRequired'),
                                    },
                                    ({ getFieldValue }) => ({
                                        validator(_rule, value) {
                                            if (!value || getFieldValue('newPassword') === value) {
                                                return Promise.resolve();
                                            }
                                            return Promise.reject(
                                                new Error(
                                                    gLang('emailVerification.passwordMismatch')
                                                )
                                            );
                                        },
                                    }),
                                ]}
                            >
                                <Input.Password
                                    placeholder={gLang(
                                        'emailVerification.confirmPasswordPlaceholder'
                                    )}
                                    style={
                                        isBlackOrangeActive
                                            ? {
                                                  background: '#1a1a1a',
                                                  borderColor: '#333333',
                                                  color: '#ffffff',
                                              }
                                            : undefined
                                    }
                                />
                            </Form.Item>

                            <Form.Item style={{ marginBottom: 0 }}>
                                <Button
                                    type="primary"
                                    htmlType="submit"
                                    loading={passwordLoading}
                                    style={{ width: '100%', ...buttonStyle }}
                                >
                                    {gLang('emailVerification.confirmResetPassword')}
                                </Button>
                            </Form.Item>
                        </Form>
                    </div>
                ) : (
                    // 其他操作的结果页面
                    <Result
                        icon={
                            result.success ? (
                                <CheckCircleOutlined
                                    style={{ color: isBlackOrangeActive ? '#52c41a' : '#52c41a' }}
                                />
                            ) : (
                                <CloseCircleOutlined
                                    style={{ color: isBlackOrangeActive ? '#ff4d4f' : '#ff4d4f' }}
                                />
                            )
                        }
                        status={result.success ? 'success' : 'error'}
                        title={
                            result.success
                                ? gLang('emailVerification.verificationSuccess')
                                : gLang('emailVerification.verificationFailed')
                        }
                        subTitle={
                            <Space direction="vertical" style={{ width: '100%' }}>
                                <Text
                                    style={{ color: isBlackOrangeActive ? '#ffffff' : '#000000' }}
                                >
                                    {result.message}
                                </Text>
                                {result.success && result.action && result.ecid && (
                                    <Alert
                                        message={gLang('emailVerification.actionCompleted', {
                                            action: getActionDescription(
                                                result.action,
                                                result.ecid
                                            ),
                                        })}
                                        description={`ECID: ${result.ecid}`}
                                        type="success"
                                        style={
                                            isBlackOrangeActive
                                                ? {
                                                      background: '#1a1a1a',
                                                      borderColor: '#333333',
                                                      color: '#ffffff',
                                                  }
                                                : undefined
                                        }
                                    />
                                )}
                            </Space>
                        }
                        extra={
                            <Space>
                                <Button
                                    type="primary"
                                    onClick={async () => {
                                        const isAuthenticated = await checkUserAuth();
                                        if (isAuthenticated) {
                                            navigate('/');
                                        } else {
                                            navigate('/login');
                                        }
                                    }}
                                    style={buttonStyle}
                                >
                                    {gLang('emailVerification.returnHome')}
                                </Button>
                                {result.success && result.ecid && (
                                    <Button
                                        onClick={async () => {
                                            const isAuthenticated = await checkUserAuth();
                                            if (isAuthenticated) {
                                                navigate(`/account/${result.ecid}`);
                                            } else {
                                                navigate('/login');
                                            }
                                        }}
                                        style={
                                            isBlackOrangeActive
                                                ? {
                                                      background: '#1a1a1a',
                                                      borderColor: '#333333',
                                                      color: '#ffffff',
                                                  }
                                                : undefined
                                        }
                                    >
                                        {gLang('emailVerification.viewAccount')}
                                    </Button>
                                )}
                            </Space>
                        }
                    />
                )}
            </Card>
        </Wrapper>
    );
};

export default EmailVerificationPage;
