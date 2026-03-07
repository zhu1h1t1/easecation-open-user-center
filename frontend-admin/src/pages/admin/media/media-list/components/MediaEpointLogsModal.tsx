import React, { useCallback, useEffect, useMemo, useState } from 'react';
import {
    Modal,
    Table,
    Tag,
    Typography,
    message,
    Row,
    Col,
    Select,
    Input,
    Button,
    Card,
    Space,
    Grid,
} from 'antd';
import { gLang } from '@common/language';
import { fetchData } from '@common/axiosConfig';
import { TimeConverter } from '@common/components/TimeConverter';
import { MediaEpointChangeLog } from '@ecuc/shared/types/media.types';

const { useBreakpoint } = Grid;

interface Props {
    open: boolean;
    onClose: () => void;
    mediaId?: number | null;
}

type AdminEpointLogRecord = MediaEpointChangeLog & {
    operator: string;
};

// use Typography components directly when needed

const getAmountTagColor = (amount: number) => {
    if (amount > 0) return 'green';
    if (amount < 0) return 'red';
    return 'default';
};

const MediaEpointLogsModal: React.FC<Props> = ({ open, onClose, mediaId }) => {
    const screens = useBreakpoint();
    const isPC = screens.md ?? false;
    const [messageApi, contextHolder] = message.useMessage();
    const [loading, setLoading] = useState(false);
    const [page, setPage] = useState(1);
    const [pageSize, setPageSize] = useState(isPC ? 10 : 5);
    const [total, setTotal] = useState(0);
    const [dataSource, setDataSource] = useState<AdminEpointLogRecord[]>([]);
    // filter states (frontend-only filtering applied to current page data)
    const [filterChangeType, setFilterChangeType] = useState<string | null>(null);
    const [filterSource, setFilterSource] = useState<string | null>(null);
    const [filterOperator, setFilterOperator] = useState<string>('');
    const [filterReason, setFilterReason] = useState<string>('');
    // removed date and amount range filters to avoid toolbar overflow

    const loadData = useCallback(
        (targetPage: number, targetPageSize: number) => {
            if (!mediaId) {
                return;
            }
            setLoading(true);
            fetchData({
                url: '/media/epoints/logs',
                method: 'GET',
                data: {
                    mediaId,
                    page: targetPage,
                    pageSize: targetPageSize,
                },
                setData: resp => {
                    const payload = resp?.data;
                    const list = (payload?.list ?? []) as AdminEpointLogRecord[];
                    setDataSource(list);
                    setTotal(payload?.total ?? 0);
                    setPage(payload?.page ?? targetPage);
                    setPageSize(payload?.pageSize ?? targetPageSize);
                },
                setSpin: setLoading,
            }).catch(() => {
                messageApi.error(gLang('mediaPanel.epointLogs.loadFailed'));
                setLoading(false);
            });
        },
        [mediaId]
    );

    useEffect(() => {
        if (open && mediaId) {
            const targetPageSize = isPC ? 10 : 5;
            loadData(1, targetPageSize);
        }
    }, [open, mediaId, isPC, loadData]);

    useEffect(() => {
        if (!open) {
            setDataSource([]);
            setTotal(0);
            setPage(1);
        }
    }, [open]);

    const columns = useMemo(
        () => [
            {
                title: gLang('mediaPanel.epointLogs.columns.time'),
                dataIndex: 'created_at',
                key: 'created_at',
                width: 180,
                render: (value: string) => {
                    // 强制不换行并允许横向滚动，覆盖任何可能的全局换行规则
                    const timeStyle: React.CSSProperties = {
                        display: 'block',
                        maxWidth: 180,
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap',
                        wordBreak: 'normal',
                        overflowWrap: 'normal',
                    };

                    return (
                        <div style={timeStyle} title={String(value)}>
                            <TimeConverter utcTime={value} />
                        </div>
                    );
                },
            },
            {
                title: gLang('mediaPanel.epointLogs.columns.changeType'),
                dataIndex: 'change_type',
                key: 'change_type',
                width: 120,
                render: (value: string) => {
                    // map backend change_type to short uppercase labels per requirement
                    const map: Record<string, string> = {
                        purchase: 'BUY',
                        grant: 'SEND',
                        adjust: 'SET',
                        deduct: 'REMOVE',
                        expire: 'EXPIRED',
                    };
                    return (
                        map[value] ?? gLang(`mediaPanel.epointLogs.changeType.${value}`) ?? value
                    );
                },
            },
            {
                title: gLang('mediaPanel.epointLogs.columns.amount'),
                dataIndex: 'amount',
                key: 'amount',
                width: 120,
                render: (amount: number) => (
                    <Tag color={getAmountTagColor(amount)}>
                        {amount > 0 ? `+${amount}` : amount}
                    </Tag>
                ),
            },
            {
                title: gLang('mediaPanel.epointLogs.columns.balanceAfter'),
                dataIndex: 'balance_after',
                key: 'balance_after',
                width: 140,
            },

            {
                title: gLang('mediaPanel.epointLogs.columns.reason'),
                dataIndex: 'reason',
                key: 'reason',
                width: 240,
                render: (_value: any, row: AdminEpointLogRecord) => {
                    const extra = (row as any).extra ?? {};
                    const reasonText =
                        extra && typeof extra.reason === 'string' ? extra.reason : (_value ?? '');
                    const tid = extra?.tid ?? null;
                    // container is a single-line box with horizontal scroll (no wrapping)
                    const containerStyle: React.CSSProperties = {
                        maxWidth: 240,
                        display: 'block',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap',
                        // when inside flex containers, ensure overflow works
                        minWidth: 0,
                        boxSizing: 'border-box',
                        WebkitOverflowScrolling: 'touch',
                    };

                    if (tid) {
                        const displayText = `TID #${tid}`;
                        const showExtraReason = reasonText && reasonText !== `TID #${tid}`;
                        return (
                            <div
                                style={{ maxWidth: 240, boxSizing: 'border-box', minWidth: 0 }}
                                title={displayText + (showExtraReason ? ' - ' + reasonText : '')}
                            >
                                {/* TID link on top (blue, not bold) */}
                                <div style={{ marginBottom: 6 }}>
                                    <Typography.Link
                                        onClick={() =>
                                            window.dispatchEvent(
                                                new CustomEvent('openTidFromDetail', {
                                                    detail: { tid },
                                                })
                                            )
                                        }
                                        style={{ fontWeight: 400, cursor: 'pointer' }}
                                    >
                                        {displayText}
                                    </Typography.Link>
                                </div>
                                {/* reason below as a single-line scrollable text */}
                                <div style={containerStyle}>
                                    {showExtraReason ? (
                                        <span
                                            style={{
                                                display: 'inline-block',
                                                whiteSpace: 'nowrap',
                                            }}
                                        >
                                            {reasonText}
                                        </span>
                                    ) : null}
                                </div>
                            </div>
                        );
                    }

                    return (
                        <div style={containerStyle} title={reasonText}>
                            <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                                {reasonText}
                            </span>
                        </div>
                    );
                },
            },
            {
                title: gLang('mediaPanel.epointLogs.columns.operator'),
                dataIndex: 'operator',
                key: 'operator',
                width: 160,
                render: (value: string) => {
                    const opStyle: React.CSSProperties = {
                        maxWidth: 160,
                        display: 'block',
                        overflowX: 'auto',
                        overflowY: 'hidden',
                        whiteSpace: 'nowrap',
                        minWidth: 0,
                        boxSizing: 'border-box',
                    };
                    return (
                        <div style={opStyle} title={String(value)}>
                            <span style={{ display: 'inline-block', whiteSpace: 'nowrap' }}>
                                {value}
                            </span>
                        </div>
                    );
                },
            },
        ],
        []
    );

    // client-side filtered list for the current page
    const filteredData = useMemo(() => {
        return dataSource.filter(row => {
            // change type filter
            if (filterChangeType && filterChangeType !== '' && row.change_type !== filterChangeType)
                return false;
            // source filter
            if (filterSource && filterSource !== '' && row.source !== filterSource) return false;
            // operator fuzzy
            if (filterOperator && filterOperator.trim() !== '') {
                const k = filterOperator.trim().toLowerCase();
                if (
                    !String(row.operator ?? '')
                        .toLowerCase()
                        .includes(k) &&
                    !String(row.operator_openid ?? '')
                        .toLowerCase()
                        .includes(k)
                )
                    return false;
            }
            // reason fuzzy (checks reason and extra.item_title)
            if (filterReason && filterReason.trim() !== '') {
                const k = filterReason.trim().toLowerCase();
                const extra = (row as any).extra ?? {};
                const reasonText = String(extra.reason ?? '') + ' ' + JSON.stringify(extra);
                if (!reasonText.toLowerCase().includes(k)) return false;
            }
            // (date and amount filters removed)

            return true;
        });
    }, [dataSource, filterChangeType, filterSource, filterOperator, filterReason]);

    const resetFilters = () => {
        setFilterChangeType(null);
        setFilterSource(null);
        setFilterOperator('');
        setFilterReason('');
    };

    // Mobile card render
    const renderMobileCard = (record: AdminEpointLogRecord) => {
        const extra = (record as any).extra ?? {};
        const reasonText = extra && typeof extra.reason === 'string' ? extra.reason : '';
        const tid = extra?.tid ?? null;
        const changeTypeMap: Record<string, string> = {
            purchase: 'BUY',
            grant: 'SEND',
            adjust: 'SET',
            deduct: 'REMOVE',
            expire: 'EXPIRED',
        };
        const changeTypeLabel = changeTypeMap[record.change_type] ?? record.change_type;

        return (
            <Card
                key={record.id}
                size="small"
                style={{
                    marginBottom: 12,
                    borderRadius: 8,
                    border: '1px solid var(--ant-color-border)',
                }}
            >
                <Space direction="vertical" size={8} style={{ width: '100%' }}>
                    <div
                        style={{
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                        }}
                    >
                        <Tag color={getAmountTagColor(record.amount)}>
                            {record.amount > 0 ? `+${record.amount}` : record.amount}
                        </Tag>
                        <Tag>{changeTypeLabel}</Tag>
                    </div>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('mediaPanel.epointLogs.columns.time')}:{' '}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                            <TimeConverter utcTime={record.created_at} />
                        </Typography.Text>
                    </div>
                    <div>
                        <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                            {gLang('mediaPanel.epointLogs.columns.balanceAfter')}:{' '}
                        </Typography.Text>
                        <Typography.Text style={{ fontSize: 12 }}>
                            {record.balance_after}
                        </Typography.Text>
                    </div>
                    {tid && (
                        <div>
                            <Typography.Link
                                onClick={() =>
                                    window.dispatchEvent(
                                        new CustomEvent('openTidFromDetail', { detail: { tid } })
                                    )
                                }
                                style={{ fontSize: 12 }}
                            >
                                TID #{tid}
                            </Typography.Link>
                        </div>
                    )}
                    {reasonText && reasonText !== `TID #${tid}` && (
                        <div>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {gLang('mediaPanel.epointLogs.columns.reason')}:{' '}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 12 }} ellipsis>
                                {reasonText}
                            </Typography.Text>
                        </div>
                    )}
                    {record.operator && (
                        <div>
                            <Typography.Text type="secondary" style={{ fontSize: 12 }}>
                                {gLang('mediaPanel.epointLogs.columns.operator')}:{' '}
                            </Typography.Text>
                            <Typography.Text style={{ fontSize: 12 }} ellipsis>
                                {record.operator}
                            </Typography.Text>
                        </div>
                    )}
                </Space>
            </Card>
        );
    };

    return (
        <>
            {contextHolder}
            <Modal
                open={open}
                onCancel={onClose}
                footer={null}
                title={gLang('mediaPanel.epointLogs.title')}
                width={isPC ? 960 : '95%'}
                style={{ top: isPC ? 50 : 20 }}
            >
                {/* Filters toolbar - client-side filtering of current page */}
                <div style={{ marginBottom: 12 }}>
                    {isPC ? (
                        <Row gutter={8} wrap={false} style={{ alignItems: 'center' }}>
                            <Col>
                                <Select
                                    allowClear
                                    placeholder={gLang('mediaPanel.epointLogs.columns.changeType')}
                                    style={{ width: 140 }}
                                    value={filterChangeType ?? undefined}
                                    onChange={v => setFilterChangeType(v ?? null)}
                                    options={[
                                        { label: 'BUY', value: 'purchase' },
                                        { label: 'SENT', value: 'grant' },
                                        { label: 'SET', value: 'adjust' },
                                        { label: 'REMOVE', value: 'deduct' },
                                        { label: 'EXPIRED', value: 'expire' },
                                    ]}
                                />
                            </Col>
                            <Col>
                                <Select
                                    allowClear
                                    placeholder={gLang('mediaPanel.epointLogs.source')}
                                    style={{ width: 120 }}
                                    value={filterSource ?? undefined}
                                    onChange={v => setFilterSource(v ?? null)}
                                    options={[
                                        {
                                            label: gLang(
                                                'mediaPanel.epointLogs.sourceOptions.player'
                                            ),
                                            value: 'player',
                                        },
                                        {
                                            label: gLang(
                                                'mediaPanel.epointLogs.sourceOptions.admin'
                                            ),
                                            value: 'admin',
                                        },
                                        {
                                            label: gLang(
                                                'mediaPanel.epointLogs.sourceOptions.system'
                                            ),
                                            value: 'system',
                                        },
                                    ]}
                                />
                            </Col>
                            <Col>
                                <Input
                                    placeholder={gLang('mediaPanel.epointLogs.operatorPlaceholder')}
                                    value={filterOperator}
                                    onChange={e => setFilterOperator(e.target.value)}
                                    style={{ width: 180 }}
                                />
                            </Col>
                            <Col>
                                <Input
                                    placeholder={gLang('mediaPanel.epointLogs.reasonKeyword')}
                                    value={filterReason}
                                    onChange={e => setFilterReason(e.target.value)}
                                    style={{ width: 200 }}
                                />
                            </Col>
                            <Col>
                                <Button onClick={resetFilters}>
                                    {gLang('mediaPanel.epointLogs.reset')}
                                </Button>
                            </Col>
                        </Row>
                    ) : (
                        <Space direction="vertical" style={{ width: '100%' }} size={8}>
                            <Select
                                allowClear
                                placeholder={gLang('mediaPanel.epointLogs.columns.changeType')}
                                style={{ width: '100%' }}
                                value={filterChangeType ?? undefined}
                                onChange={v => setFilterChangeType(v ?? null)}
                                options={[
                                    { label: 'BUY', value: 'purchase' },
                                    { label: 'SENT', value: 'grant' },
                                    { label: 'SET', value: 'adjust' },
                                    { label: 'REMOVE', value: 'deduct' },
                                    { label: 'EXPIRED', value: 'expire' },
                                ]}
                            />
                            <Select
                                allowClear
                                placeholder={gLang('mediaPanel.epointLogs.source')}
                                style={{ width: '100%' }}
                                value={filterSource ?? undefined}
                                onChange={v => setFilterSource(v ?? null)}
                                options={[
                                    {
                                        label: gLang('mediaPanel.epointLogs.sourceOptions.player'),
                                        value: 'player',
                                    },
                                    {
                                        label: gLang('mediaPanel.epointLogs.sourceOptions.admin'),
                                        value: 'admin',
                                    },
                                    {
                                        label: gLang('mediaPanel.epointLogs.sourceOptions.system'),
                                        value: 'system',
                                    },
                                ]}
                            />
                            <Input
                                placeholder={gLang('mediaPanel.epointLogs.operatorPlaceholder')}
                                value={filterOperator}
                                onChange={e => setFilterOperator(e.target.value)}
                            />
                            <Input
                                placeholder={gLang('mediaPanel.epointLogs.reasonKeyword')}
                                value={filterReason}
                                onChange={e => setFilterReason(e.target.value)}
                            />
                            <Button onClick={resetFilters} block>
                                {gLang('mediaPanel.epointLogs.reset')}
                            </Button>
                        </Space>
                    )}
                </div>

                {isPC ? (
                    <Table<AdminEpointLogRecord>
                        rowKey="id"
                        dataSource={filteredData}
                        columns={columns}
                        loading={loading}
                        pagination={{
                            current: page,
                            pageSize,
                            total,
                            onChange: (p, ps) => {
                                const nextPageSize = ps ?? pageSize;
                                setPage(p);
                                setPageSize(nextPageSize);
                                loadData(p, nextPageSize);
                            },
                        }}
                        scroll={{ x: 720 }}
                    />
                ) : (
                    <>
                        <div style={{ maxHeight: '60vh', overflowY: 'auto' }}>
                            {filteredData.map(renderMobileCard)}
                            {filteredData.length === 0 && !loading && (
                                <div
                                    style={{
                                        textAlign: 'center',
                                        padding: '40px 20px',
                                        color: 'var(--ant-color-text-secondary)',
                                    }}
                                >
                                    {gLang('common.noData')}
                                </div>
                            )}
                        </div>
                        {total > 0 && (
                            <div style={{ marginTop: 16, textAlign: 'center' }}>
                                <Space>
                                    <Button
                                        disabled={page === 1}
                                        onClick={() => {
                                            const newPage = page - 1;
                                            setPage(newPage);
                                            loadData(newPage, pageSize);
                                        }}
                                    >
                                        {gLang('common.prevPage')}
                                    </Button>
                                    <Typography.Text>
                                        {page} / {Math.ceil(total / pageSize)}
                                    </Typography.Text>
                                    <Button
                                        disabled={page >= Math.ceil(total / pageSize)}
                                        onClick={() => {
                                            const newPage = page + 1;
                                            setPage(newPage);
                                            loadData(newPage, pageSize);
                                        }}
                                    >
                                        {gLang('common.nextPage')}
                                    </Button>
                                </Space>
                            </div>
                        )}
                    </>
                )}
            </Modal>
        </>
    );
};

export default MediaEpointLogsModal;
