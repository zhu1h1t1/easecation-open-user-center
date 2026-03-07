// 游戏账号操作组件

import React, { useState } from 'react';
import { Alert, Button, message, Modal, Space } from 'antd';
import { gLang } from '@common/language';
import { submitData } from '../../../../axiosConfig';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';
import { useTheme } from '@common/contexts/ThemeContext';
import { CUSTOM_THEME_PALETTES } from '@common/themes/customPalettes';
import { useNavigate } from 'react-router-dom';

interface AccountActionsProps {
    ecid?: string;
    player?: BindPlayerDetailBasic;
    onGiftClick: () => void;
}

const AccountActions: React.FC<AccountActionsProps> = ({ ecid, onGiftClick }) => {
    const [messageApi, messageContextHolder] = message.useMessage();
    const [modal, modalContextHolder] = Modal.useModal();
    const [deleteRespackCache, setDeleteRespackCache] = useState(false);
    const { getThemeColor, customTheme, isCustomThemeActive } = useTheme();
    const palette = CUSTOM_THEME_PALETTES.blackOrange;
    const isBlackOrangeActive = isCustomThemeActive && customTheme === 'blackOrange';
    const navigate = useNavigate();

    const neutralButtonBackground = getThemeColor({
        light: '#ffffff',
        dark: '#141414',
        custom: { blackOrange: palette.surfaceAlt },
    });
    const neutralButtonBorder = getThemeColor({
        light: '#d9d9d9',
        dark: '#434343',
        custom: { blackOrange: palette.border },
    });
    const neutralButtonText = getThemeColor({
        light: '#1f1f1f',
        dark: '#f0f0f0',
        custom: { blackOrange: palette.textPrimary },
    });
    const accentButtonShadow = isBlackOrangeActive
        ? '0 0 0 1px rgba(255, 140, 26, 0.45)'
        : undefined;
    const confirmAlertStyle = isBlackOrangeActive
        ? {
              background: palette.surfaceAlt,
              borderColor: palette.border,
              color: palette.textPrimary,
          }
        : undefined;

    const handleDelRespackCache = async () => {
        setDeleteRespackCache(true);
        try {
            if (
                await modal.confirm({
                    title: gLang('ecDetail.delRespackCacheConfirmTitle'),
                    content: (
                        <Space direction={'vertical'}>
                            <Alert
                                message={gLang('ecDetail.delRespackCacheConfirm1')}
                                style={confirmAlertStyle}
                            />
                            {gLang('ecDetail.delRespackCacheConfirm2')}
                        </Space>
                    ),
                    okText: gLang('confirm'),
                    cancelText: gLang('cancel'),
                })
            ) {
                await submitData({
                    data: { ecid: ecid },
                    url: '/ec/del-respack-cache',
                    successMessage: 'success',
                    method: 'POST',
                    setIsFormDisabled: () => {},
                    setIsModalOpen: () => {},
                });
                messageApi.success(gLang('ecDetail.delRespackCacheSuccessTitle'));
                modal.success({
                    title: gLang('ecDetail.delRespackCacheSuccessTitle'),
                    content: gLang('ecDetail.delRespackCacheSuccess'),
                });
            }
        } catch (error: any) {
            messageApi.error(error.message);
        } finally {
            setDeleteRespackCache(false);
        }
    };

    return (
        <>
            {messageContextHolder}
            {modalContextHolder}
            <Space orientation="vertical" size={12} style={{ width: '100%' }}>
                <Button
                    size="large"
                    type="default"
                    block
                    style={{
                        background: neutralButtonBackground,
                        borderColor: neutralButtonBorder,
                        color: neutralButtonText,
                    }}
                    onClick={handleDelRespackCache}
                    loading={deleteRespackCache}
                >
                    {gLang('ecDetail.delRespackCache')}
                </Button>
                <Button
                    size="large"
                    type="default"
                    block
                    style={{
                        background: neutralButtonBackground,
                        borderColor: neutralButtonBorder,
                        color: neutralButtonText,
                    }}
                    onClick={() => navigate(`/account/${ecid}/manage`)}
                >
                    {gLang('ecDetail.manageAccount')}
                </Button>
                <Button
                    size="large"
                    type="primary"
                    block
                    style={{
                        background: isBlackOrangeActive ? palette.accent : undefined,
                        borderColor: isBlackOrangeActive ? palette.accent : undefined,
                        color: isBlackOrangeActive ? palette.textPrimary : undefined,
                        boxShadow: accentButtonShadow,
                    }}
                    onClick={onGiftClick}
                >
                    {gLang('ecDetail.giftBtn')}
                </Button>
            </Space>
        </>
    );
};

export default AccountActions;
