import React from 'react';
import { BasicInfo } from './index';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';

interface BasicInfoTabProps {
    playerBasic: BindPlayerDetailBasic | undefined;
    spinningDetail: boolean;
    setPreviewTid: React.Dispatch<React.SetStateAction<number | null>>;
}

const BasicInfoTab: React.FC<BasicInfoTabProps> = ({
    playerBasic,
    spinningDetail,
    setPreviewTid,
}) => {
    return (
        <BasicInfo
            playerBasic={playerBasic}
            spinningDetail={spinningDetail}
            setPreviewTid={setPreviewTid}
        />
    );
};

export { BasicInfoTab };
