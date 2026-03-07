import React from 'react';
import { Space, Skeleton, Descriptions, Divider, Typography, Alert } from 'antd';
import { ltransAdmin, ltransMedia, ltransVip } from '@common/languageTrans';
import { gLang } from '@common/language';
import { DescriptionsProps } from 'antd/es/descriptions';
import { BindPlayerDetailBasic } from '@ecuc/shared/types/player.types';
import BanInfoComponent from './BanInfoComponent';
import { TimeConverter, convertUTCToFormat } from '@common/components/TimeConverter';

const { Title, Text } = Typography;

interface BasicInfoProps {
    playerBasic: BindPlayerDetailBasic | undefined;
    spinningDetail: boolean;
    setPreviewTid: React.Dispatch<React.SetStateAction<number | null>>;
}

const BasicInfo: React.FC<BasicInfoProps> = ({ playerBasic, spinningDetail, setPreviewTid }) => {
    const itemsDespBasic: DescriptionsProps['items'] = [
        {
            label: gLang('ecDetail.token'),
            children: playerBasic?.credits,
        },
        {
            label: gLang('ecDetail.diamond'),
            children: playerBasic?.diamonds,
        },
        {
            label: gLang('ecDetail.coin'),
            children: playerBasic?.coin,
        },
        {
            label: gLang('ecDetail.playerPrivilege'),
            children: playerBasic
                ? ltransVip(playerBasic.vip?.level) +
                  ' (' +
                  (playerBasic.vip?.expiry === '' ||
                  playerBasic.vip?.expiry === gLang('admin.basicLongTerm')
                      ? gLang('admin.basicLongTerm')
                      : playerBasic.vip?.expiry
                        ? convertUTCToFormat(playerBasic.vip.expiry, 'YYYY-MM-DD')
                        : '-') +
                  ')'
                : '...',
        },
        {
            label: gLang('ecDetail.mediaPrivilege'),
            children: playerBasic
                ? ltransMedia(playerBasic.media?.level) +
                  ' (' +
                  (playerBasic.media?.expiry === '' ||
                  playerBasic.media?.expiry === gLang('admin.basicLongTerm')
                      ? gLang('admin.basicLongTerm')
                      : playerBasic.media?.expiry
                        ? convertUTCToFormat(playerBasic.media.expiry, 'YYYY-MM-DD')
                        : '-') +
                  ')'
                : '...',
        },
        {
            label: gLang('ecDetail.specialPrivilege'),
            children: playerBasic
                ? ltransAdmin(playerBasic.admin?.level) +
                  ' (' +
                  (playerBasic.admin?.expiry === '' ||
                  playerBasic.admin?.expiry === gLang('admin.basicLongTerm')
                      ? gLang('admin.basicLongTerm')
                      : playerBasic.admin?.expiry
                        ? convertUTCToFormat(playerBasic.admin.expiry, 'YYYY-MM-DD')
                        : '-') +
                  ')'
                : '...',
        },
        {
            label: gLang('ecDetail.latestOnlineTime'),
            children: playerBasic?.last_login ? (
                <TimeConverter utcTime={playerBasic.last_login} />
            ) : (
                '-'
            ),
        },
        {
            label: gLang('ecDetail.nextLevelExp'),
            children: playerBasic
                ? playerBasic.next_level?.current + ' / ' + playerBasic.next_level?.need
                : '...',
        },
    ];

    const itemsDespWechatBind: DescriptionsProps['items'] = [
        {
            label: gLang('superPanel.item.is_frozen'),
            children: playerBasic
                ? playerBasic.is_frozen
                    ? gLang('admin.basicFrozen')
                    : gLang('admin.basicNormal')
                : '...',
        },
        {
            label: gLang('superPanel.item.open_id'),
            children: playerBasic ? playerBasic.open_id : '...',
        },
        {
            label: gLang('superPanel.item.bind_time'),
            children: playerBasic?.bind_time ? (
                <TimeConverter utcTime={playerBasic.bind_time} />
            ) : (
                '-'
            ),
        },
    ];

    return (
        <Space direction="vertical" style={{ width: '100%' }}>
            {playerBasic?.ticket_notes?.map(note => (
                <Alert
                    key={note.note_id}
                    message={
                        <>
                            <Text>{note.note}</Text>
                            <Text disabled>
                                {' '}
                                @ <TimeConverter utcTime={note.create_time} />
                            </Text>
                        </>
                    }
                    type="info"
                />
            ))}
            <Title level={5} style={{ marginBottom: '-10px' }}>
                {gLang('superPanel.title.basic')}
            </Title>
            <Skeleton style={{ marginTop: '16px' }} loading={spinningDetail} />
            {!spinningDetail && (
                <Descriptions
                    items={itemsDespBasic}
                    style={{ marginTop: '10px' }}
                    column={{ xs: 1, sm: 2 }}
                />
            )}
            <Divider style={{ margin: '4px 0 10px' }} />
            <Title level={5} style={{ marginBottom: '-10px' }}>
                {gLang('superPanel.title.currentWechat')}
            </Title>
            <Skeleton style={{ marginTop: '16px' }} loading={spinningDetail} />
            {!spinningDetail && (
                <Descriptions
                    items={itemsDespWechatBind}
                    style={{ marginTop: '10px' }}
                    column={{ xs: 1, sm: 2 }}
                />
            )}
            <Divider style={{ margin: '4px 0 10px' }} />
            <Title level={5} style={{ marginBottom: '4px' }}>
                {gLang('superPanel.title.currentBan')}
            </Title>
            {playerBasic?.current_ban?.length === 0 && (
                <Text type="secondary">{gLang('superPanel.title.currentBanEmpty')}</Text>
            )}
            {playerBasic?.current_ban?.map(ban => (
                <BanInfoComponent key={ban.logid} ban={ban} setPreviewTid={setPreviewTid} />
            ))}
            <div style={{ marginBottom: '10px' }} />
        </Space>
    );
};

export default BasicInfo;
