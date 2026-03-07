import React from 'react';
import {
    Alert,
    Button,
    Descriptions,
    Space,
    Spin,
    Typography,
    DatePicker,
    Row,
    Col,
    Input,
} from 'antd';
import { gLang } from '@common/language';
import dayjs from 'dayjs';
import useIsPC from '@common/hooks/useIsPC';
import { TimeConverter } from '@common/components/TimeConverter';

const { Title, Text } = Typography;
const { RangePicker } = DatePicker;

interface RecordingTabProps {
    playerRecordingLogs: any[] | undefined;
    spinningRecoding: boolean;
    timeRange: [dayjs.Dayjs, dayjs.Dayjs];
    onTimeRangeChange: (from: string, to: string) => void;
    onViewOverwatch: (recordId: number) => void;
}

export const RecordingTab: React.FC<RecordingTabProps> = ({
    playerRecordingLogs,
    spinningRecoding,
    timeRange,
    onTimeRangeChange,
    onViewOverwatch,
}) => {
    const isPC = useIsPC();

    return (
        <Spin spinning={spinningRecoding}>
            <Space orientation="vertical" style={{ width: '100%' }}>
                {isPC ? (
                    // PC端：标题和日期控件在同一行
                    <Row justify="space-between" align="middle" style={{ marginBottom: '16px' }}>
                        <Col>
                            <Title level={5} style={{ marginBottom: '0px' }}>
                                {gLang('superPanel.title.recoding')}
                            </Title>
                        </Col>
                        <Col>
                            <RangePicker
                                value={timeRange}
                                onChange={dates => {
                                    if (dates && dates[0] && dates[1]) {
                                        onTimeRangeChange(
                                            dates[0].format('YYYY-MM-DD'),
                                            dates[1].format('YYYY-MM-DD')
                                        );
                                    }
                                }}
                                format="YYYY-MM-DD"
                                placeholder={[
                                    gLang('admin.recordingStartDate'),
                                    gLang('admin.recordingEndDate'),
                                ]}
                            />
                        </Col>
                    </Row>
                ) : (
                    // 移动端：标题和日期控件垂直排列
                    <>
                        <Title level={5} style={{ marginBottom: '0px' }}>
                            {gLang('superPanel.title.recoding')}
                        </Title>

                        {/* 时间筛选 */}
                        <div style={{ marginBottom: '16px' }}>
                            <RangePicker
                                value={timeRange}
                                onChange={dates => {
                                    if (dates && dates[0] && dates[1]) {
                                        onTimeRangeChange(
                                            dates[0].format('YYYY-MM-DD'),
                                            dates[1].format('YYYY-MM-DD')
                                        );
                                    }
                                }}
                                format="YYYY-MM-DD"
                                placeholder={[
                                    gLang('admin.recordingStartDate'),
                                    gLang('admin.recordingEndDate'),
                                ]}
                            />
                        </div>
                    </>
                )}

                {playerRecordingLogs?.length === 0 && (
                    <Text type="secondary">{gLang('superPanel.title.recodingEmpty')}</Text>
                )}

                {playerRecordingLogs?.map(rec => (
                    <Alert
                        key={rec.record_id}
                        description={
                            <>
                                <Text disabled>
                                    {rec.record_id} @ <TimeConverter utcTime={rec.create_time} />
                                </Text>
                                <Descriptions size="small" column={{ xs: 1, sm: 2 }}>
                                    <Descriptions.Item label={gLang('superPanel.item.gameType')}>
                                        {rec.game}
                                    </Descriptions.Item>
                                    <Descriptions.Item label={gLang('superPanel.item.mapName')}>
                                        {rec.map}
                                    </Descriptions.Item>
                                    {rec.players && rec.players.length > 0 && (
                                        <Descriptions.Item
                                            label={gLang('admin.recordingPlayers')}
                                            span={2}
                                        >
                                            <Input.TextArea
                                                value={rec.players.join(', ')}
                                                readOnly
                                                autoSize={{ minRows: 1, maxRows: 3 }}
                                                style={{
                                                    width: '100%',
                                                    cursor: 'text',
                                                    resize: 'none',
                                                    fontSize: '12px',
                                                    fontFamily: 'monospace',
                                                }}
                                                onClick={e => {
                                                    e.stopPropagation();
                                                }}
                                            />
                                        </Descriptions.Item>
                                    )}
                                </Descriptions>
                            </>
                        }
                        type="info"
                        action={
                            <Space>
                                <Button size="small" onClick={() => onViewOverwatch(rec.record_id)}>
                                    {gLang('superPanel.overwatchModal.general')}
                                </Button>
                            </Space>
                        }
                        style={{ paddingBottom: '10px' }}
                    />
                ))}
            </Space>
        </Spin>
    );
};
