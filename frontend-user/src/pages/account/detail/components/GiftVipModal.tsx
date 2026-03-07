// 赠送VIP组件

import React, { useMemo, useRef, useState } from 'react';
import { Alert, Button, Form, Modal, Select, Space, Typography } from 'antd';
import { gLang } from '@common/language';
import { BindPlayerDetailBasic, UserGiftVipandUnexpired } from '@ecuc/shared/types/player.types';
import { submitData } from '../../../../axiosConfig';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import AccountMatchingFormItem from '../../../../components/AccountMatchingFormItem';

interface GiftVipModalProps {
    isOpen: boolean;
    onClose: () => void;
    ecid?: string;
    player?: BindPlayerDetailBasic;
    vipLeftandUnexpired?: UserGiftVipandUnexpired;
}

const GiftVipModal: React.FC<GiftVipModalProps> = ({
    isOpen,
    onClose,
    ecid,
    player: _player,
    vipLeftandUnexpired,
}) => {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [isSubmitBtnDisabled, setIsSubmitBtnDisabled] = useState(false);
    const { Paragraph } = Typography;
    const formRef = useRef<any>();
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';

    const modalStyles = useMemo(() => {
        if (!isBlackOrangeActive) return undefined;
        return {
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
        } as const;
    }, [
        isBlackOrangeActive,
        palette.border,
        palette.surface,
        palette.surfaceAlt,
        palette.textPrimary,
    ]);

    const secondaryTextColor = getThemeColor({
        light: '#595959',
        dark: '#bfbfbf',
        custom: { blackOrange: palette.textSecondary },
    });
    const primaryTextColor = getThemeColor({
        light: '#1f1f1f',
        dark: '#f5f5f5',
        custom: { blackOrange: palette.textPrimary },
    });
    const surfaceAlt = getThemeColor({
        light: '#fafafa',
        dark: '#1f1f1f',
        custom: { blackOrange: palette.surfaceAlt },
    });
    const borderColor = getThemeColor({
        light: '#d9d9d9',
        dark: '#434343',
        custom: { blackOrange: palette.border },
    });

    return (
        <Modal
            title={gLang('ecDetail.giftBtn')}
            open={isOpen}
            footer={false}
            onCancel={onClose}
            styles={modalStyles}
        >
            {!vipLeftandUnexpired?.canGiftUnexpired && (
                <Alert
                    type="warning"
                    showIcon
                    style={{
                        marginBottom: 8,
                        background: isBlackOrangeActive ? surfaceAlt : undefined,
                        borderColor: isBlackOrangeActive ? borderColor : undefined,
                        color: isBlackOrangeActive ? primaryTextColor : undefined,
                    }}
                    message={gLang('ecDetail.giftNeedExpire')}
                />
            )}
            <Space orientation="vertical">
                <Alert
                    type="error"
                    message={gLang('ecDetail.giftIntro1')}
                    style={{
                        background: isBlackOrangeActive ? surfaceAlt : undefined,
                        borderColor: isBlackOrangeActive ? borderColor : undefined,
                        color: isBlackOrangeActive ? primaryTextColor : undefined,
                    }}
                />
                <Paragraph style={{ color: secondaryTextColor }}>
                    {gLang('ecDetail.giftIntro2')}
                </Paragraph>
            </Space>
            <Form
                name="basic"
                initialValues={{ remember: true }}
                onFinish={async values => {
                    try {
                        await submitData({
                            data: {
                                ecid: ecid,
                                to_ecid: values.to_ecid,
                                to_level: values.to_level,
                            },
                            url: '/ec/gift',
                            successMessage: 'success',
                            method: 'POST',
                            redirectTo: '/account/' + ecid,
                            setIsFormDisabled,
                            setIsModalOpen: onClose,
                        });
                    } catch {
                        setIsFormDisabled(false);
                        setIsSubmitBtnDisabled(false);
                    }
                }}
                autoComplete="off"
                disabled={isFormDisabled}
                ref={formRef}
            >
                <Form.Item
                    label={gLang('ecDetail.giftLevel')}
                    name="to_level"
                    rules={[
                        {
                            required: true,
                            message: gLang('required'),
                        },
                    ]}
                >
                    <Select
                        style={{
                            background: surfaceAlt,
                            borderColor,
                            color: primaryTextColor,
                        }}
                        options={[
                            {
                                value: 'v1',
                                label:
                                    gLang('vip1') +
                                    gLang('ecDetail.giftLeft', {
                                        left: String(vipLeftandUnexpired?.v1),
                                    }),
                                disabled: !vipLeftandUnexpired || vipLeftandUnexpired.v1 === 0,
                            },
                            {
                                value: 'v2',
                                label:
                                    gLang('vip2') +
                                    gLang('ecDetail.giftLeft', {
                                        left: String(vipLeftandUnexpired?.v2),
                                    }),
                                disabled: !vipLeftandUnexpired || vipLeftandUnexpired.v2 === 0,
                            },
                            {
                                value: 'v3',
                                label:
                                    gLang('vip3') +
                                    gLang('ecDetail.giftLeft', {
                                        left: String(vipLeftandUnexpired?.v3),
                                    }),
                                disabled: !vipLeftandUnexpired || vipLeftandUnexpired.v3 === 0,
                            },
                            {
                                value: 'v4',
                                label:
                                    gLang('vip4') +
                                    gLang('ecDetail.giftLeft', {
                                        left: String(vipLeftandUnexpired?.v4),
                                    }),
                                disabled: !vipLeftandUnexpired || vipLeftandUnexpired.v4 === 0,
                            },
                        ]}
                    />
                </Form.Item>
                <AccountMatchingFormItem
                    name="to_ecid"
                    label={gLang('ecDetail.giftEcid')}
                    extra={gLang('ecDetail.giftEcidIntro')}
                    required={true}
                    requiredMessage={gLang('required')}
                    chooseFieldName="to_ecidChoose"
                    chooseRequired={true}
                    placeholder={gLang('ecDetail.bestMatchPlaceholder')}
                    matchingOptions={{
                        triggerMode: 'blur',
                        clearOnEmpty: true,
                    }}
                    onUserSelect={(ecid: string) => {
                        if (formRef.current) {
                            formRef.current.setFieldsValue({ to_ecid: ecid, to_ecidChoose: ecid });
                        }
                    }}
                    style={{
                        background: surfaceAlt,
                        borderColor,
                        color: primaryTextColor,
                    }}
                />

                <Form.Item>
                    <Button
                        type="primary"
                        htmlType="submit"
                        disabled={
                            !vipLeftandUnexpired?.canGiftUnexpired ||
                            isFormDisabled ||
                            isSubmitBtnDisabled
                        }
                        loading={isFormDisabled}
                        style={{
                            background: isBlackOrangeActive ? palette.accent : undefined,
                            borderColor: isBlackOrangeActive ? palette.accent : undefined,
                            color: isBlackOrangeActive ? palette.textPrimary : undefined,
                            boxShadow: isBlackOrangeActive
                                ? '0 0 0 1px rgba(255,140,26,0.45)'
                                : undefined,
                        }}
                    >
                        {isFormDisabled ? gLang('common.submitting') : gLang('ecDetail.giftSubmit')}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default GiftVipModal;
