import React from 'react';
import PlayerPanelAction from '../PlayerPanelAction';
import { Spin } from 'antd';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';

interface PlayerActionTabProps {
    tid: number | null;
    player: BindPlayerDetailBasic | undefined;
    setRefresh: React.Dispatch<React.SetStateAction<boolean>>;
    initialValues?: any;
    disabled: boolean;
    spinningDetail: boolean;
    clearCache?: (ecid?: string) => void;
}

export const PlayerActionTab: React.FC<PlayerActionTabProps> = ({
    tid,
    player,
    setRefresh,
    initialValues,
    disabled,
    spinningDetail,
    clearCache,
}) => (
    <Spin spinning={spinningDetail}>
        {player && (
            <PlayerPanelAction
                tid={tid}
                player={player}
                setRefresh={v => setRefresh(v)}
                initialValues={initialValues}
                disabled={disabled}
                clearCache={clearCache}
            />
        )}
    </Spin>
);
