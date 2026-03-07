// 工单操作页面中的快捷消息

import React, { useMemo } from 'react';
import { Button, Space } from 'antd';
import { StaffShortcut } from '@ecuc/shared/types/player.types';
import { gLang } from '@common/language';

function getPresetActions() {
    return [
        {
            labelKey: 'admin.quickMsgInsufficient',
            contentKey: 'admin.quickMsgInsufficientBodyFull',
        },
        { labelKey: 'admin.quickMsgSupervise', contentKey: 'admin.quickMsgSuperviseBodyFull' },
        { labelKey: 'admin.quickMsgDeceptive', contentKey: 'admin.quickMsgDeceptiveBodyFull' },
        { labelKey: 'admin.quickMsgOffline', contentKey: 'admin.quickMsgOfflineBodyFull' },
        { labelKey: 'admin.quickMsgLife', contentKey: 'admin.quickMsgLifeBodyFull' },
        { labelKey: 'admin.quickMsgEcidExplain', contentKey: 'admin.quickMsgEcidBodyFull' },
    ];
}

interface QuickActionsProps {
    shortcuts: StaffShortcut[];
    form: any;
}

export const QuickMessages = React.memo(({ shortcuts, form }: QuickActionsProps) => {
    const presetActions = useMemo(
        () =>
            getPresetActions().map(({ labelKey, contentKey }) => ({
                label: gLang(labelKey),
                content: gLang(contentKey),
            })),
        []
    );

    const handleClick = (content: string) => {
        const details = form.getFieldValue('details') ?? '';
        form.setFieldValue('details', details + content);
    };

    return (
        <Space wrap style={{ marginBottom: 16 }}>
            {presetActions.map((action, index) => (
                <Button
                    key={`preset-${index}`}
                    type="dashed"
                    size="small"
                    onClick={() => handleClick(action.content)}
                >
                    {action.label}
                </Button>
            ))}

            {shortcuts.map((shortcut, index) => (
                <Button
                    key={`shortcut-${shortcut.uid}-${index}`}
                    type="dashed"
                    size="small"
                    onClick={() => handleClick(shortcut.content)}
                >
                    {shortcut.title}
                </Button>
            ))}
        </Space>
    );
});
