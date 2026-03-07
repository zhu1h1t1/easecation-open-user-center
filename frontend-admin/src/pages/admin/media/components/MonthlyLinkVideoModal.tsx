import React, { useEffect, useState } from 'react';
import { Modal, Spin, Descriptions, message } from 'antd';
import { fetchData } from '@common/axiosConfig';
import { isCurrentMonth } from '@ecuc/shared/utils/MediaisCurrent';
import { gLang } from '@common/language';

interface MonthlyLinkVideoModalProps {
    bv: string;
    open: boolean;
    onCancel: () => void;
}

const MonthlyLinkVideoModal: React.FC<MonthlyLinkVideoModalProps> = ({ bv, open, onCancel }) => {
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [videoInfo, setVideoInfo] = useState<any>(null);

    useEffect(() => {
        if (open && bv) {
            setLoading(true);
            fetchData({
                url: `/proxy/bilibili/video/${bv}`,
                method: 'GET',
                data: {},
                setData: (data: any) => {
                    setVideoInfo(data);
                    setLoading(false);
                },
            }).catch(() => {
                messageApi.error(gLang('monthlyLinkVideo.fetchError'));
                setLoading(false);
            });
        } else {
            setVideoInfo(null);
        }
    }, [open, bv]);

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('monthlyLinkVideo.title')}
                open={open}
                onCancel={onCancel}
                footer={null}
            >
                {loading ? (
                    <Spin />
                ) : videoInfo ? (
                    <>
                        <Descriptions column={1}>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.title')}>
                                {videoInfo.title}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.up')}>
                                {videoInfo.up}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.playCount')}>
                                {videoInfo.playCount}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.likeCount')}>
                                {videoInfo.likeCount}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.bvid')}>
                                {videoInfo.bvid}
                            </Descriptions.Item>
                            <Descriptions.Item label={gLang('monthlyLinkVideo.labels.pubdate')}>
                                {videoInfo.pubdate}
                            </Descriptions.Item>
                            {/* {isCurrentWeek(videoInfo.pubdate) ? (
                        <Descriptions.Item>
                          <span style={{ color: 'green' }}>{gLang("monthlyLinkVideo.currentWeek")}</span>
                        </Descriptions.Item>
                      ) : (
                        <Descriptions.Item>
                          <span style={{ color: 'red' }}>{gLang("monthlyLinkVideo.notCurrentWeek")}</span>
                        </Descriptions.Item>
                      )} */}

                            {isCurrentMonth(videoInfo.pubdate) ? (
                                <Descriptions.Item>
                                    <span style={{ color: 'green' }}>
                                        {gLang('monthlyLinkVideo.currentMonth')}
                                    </span>
                                </Descriptions.Item>
                            ) : (
                                <Descriptions.Item>
                                    <span style={{ color: 'red' }}>
                                        {gLang('monthlyLinkVideo.notCurrentMonth')}
                                    </span>
                                </Descriptions.Item>
                            )}
                        </Descriptions>
                        <div style={{ marginTop: 20, textAlign: 'center' }}>
                            <iframe
                                src={`//player.bilibili.com/player.html?isOutside=true&bvid=${bv}&p=1`}
                                allowFullScreen
                                style={{
                                    width: '100%',
                                    aspectRatio: '16 / 9',
                                    maxWidth: '800px',
                                    borderRadius: '8px',
                                    border: 'none',
                                }}
                            ></iframe>
                        </div>
                    </>
                ) : (
                    <div>{gLang('monthlyLinkVideo.noData')}</div>
                )}
            </Modal>
        </>
    );
};

export default MonthlyLinkVideoModal;
