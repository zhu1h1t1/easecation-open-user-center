// 玩家侧工单详细页面

import { Button, Card, Form, Popconfirm, Space, Spin, Upload } from 'antd';
import { fetchData, submitData } from '@common/axiosConfig';
import React, { useEffect, useState } from 'react';
import { gLang } from '@common/language';
import TicketDetailComponent from '../../components/TicketDetailComponent';
import { useParams } from 'react-router-dom';
import { useUploadProps } from '@common/utils/uploadUtils';
import { UploadOutlined } from '@ant-design/icons';
import TextArea from 'antd/es/input/TextArea';
import { Ticket, TicketStatus } from '@ecuc/shared/types/ticket.types';
import PageMeta from '../../components/PageMeta/PageMeta';
import { generateUserTicketMeta } from '@common/utils/ticketMeta.utils';

const TicketDetail = () => {
    const { tid } = useParams();
    const [isSpinning, setIsSpinning] = useState(false);
    const [form] = Form.useForm();
    const [ticket, setTicket] = useState<Ticket | undefined>();
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [doRefresh, setDoRefresh] = useState<boolean>(false);

    const { uploadProps, contextHolder } = useUploadProps(
        10,
        uploadedFiles,
        setUploadedFiles,
        setIsUploading
    );

    useEffect(() => {
        setIsSpinning(true);
        fetchData({
            url: '/ticket/detail',
            method: 'GET',
            data: { tid: tid },
            setData: setTicket,
            setSpin: setIsSpinning,
        }).then(() => setDoRefresh(false));
    }, [doRefresh]);

    // 更新工单详情的函数
    const updateTicketDetail = async () => {
        await fetchData({
            url: '/ticket/detail',
            method: 'GET',
            data: { tid: tid },
            setData: updatedTicket => {
                setTicket(updatedTicket);
            },
        });
    };

    return (
        <>
            {/* 动态页面Meta信息 */}
            {ticket && <PageMeta {...generateUserTicketMeta(ticket)} url={window.location.href} />}

            {contextHolder}
            <Spin spinning={isSpinning} fullscreen />
            <Space direction="vertical" style={{ width: '100%' }}>
                <TicketDetailComponent ticket={ticket} isAdmin={false} />
                {ticket &&
                    [
                        TicketStatus.WaitingAssign,
                        TicketStatus.WaitingReply,
                        TicketStatus.WaitingStaffReply,
                        TicketStatus.Entrust,
                    ].includes(ticket.status) && (
                        <>
                            <Card
                                style={{ width: '100%' }}
                                title={gLang('ticketOperate.addition')}
                                styles={{ body: { paddingBottom: 8 } }}
                            >
                                <Form
                                    form={form}
                                    layout="vertical"
                                    onFinish={async values => {
                                        await submitData({
                                            data: {
                                                tid: tid,
                                                details: values.details,
                                                files: uploadedFiles,
                                            },
                                            url: '/ticket/action',
                                            successMessage: 'ticketDetail.success',
                                            method: 'POST',
                                            setIsFormDisabled: setIsFormDisabled,
                                            setIsModalOpen: () => {},
                                        });
                                        // 清空上传文件列表
                                        setUploadedFiles([]);
                                        form.resetFields();
                                        form.setFieldsValue({ details: '' });
                                        // 只更新工单详情，不刷新整个页面
                                        await updateTicketDetail();
                                    }}
                                    autoComplete="off"
                                    disabled={isFormDisabled}
                                >
                                    <Form.Item
                                        name="details"
                                        label={gLang('ticketDetail.addition')}
                                        rules={[
                                            {
                                                required: true,
                                                message: gLang('required'),
                                            },
                                        ]}
                                    >
                                        <TextArea
                                            autoSize={{ minRows: 2, maxRows: 4 }}
                                            placeholder={gLang(`ticketDetail.additionIntro`)}
                                        />
                                    </Form.Item>
                                    <Form.Item
                                        label={gLang('ticketDetail.attachment')}
                                        extra={gLang('ticketDetail.attachmentIntro')}
                                        name="files"
                                        valuePropName="fileList"
                                        getValueFromEvent={e =>
                                            Array.isArray(e) ? e : e?.fileList || []
                                        }
                                    >
                                        <Upload {...uploadProps}>
                                            <Button
                                                icon={<UploadOutlined />}
                                                loading={isUploading}
                                                disabled={isUploading}
                                            >
                                                {isUploading
                                                    ? gLang('files.uploadingText')
                                                    : gLang('files.btn')}
                                            </Button>
                                        </Upload>
                                    </Form.Item>
                                    <Form.Item>
                                        <Button
                                            type="primary"
                                            htmlType="submit"
                                            disabled={isUploading || isFormDisabled}
                                        >
                                            {gLang('ticketDetail.submit')}
                                        </Button>
                                    </Form.Item>
                                </Form>
                            </Card>
                            <Popconfirm
                                title={gLang('ticketDetail.dropConfirm')}
                                description={gLang('ticketDetail.dropInto')}
                                onConfirm={() =>
                                    submitData({
                                        data: { tid: tid },
                                        url: '/ticket/drop',
                                        successMessage: 'ticketDetail.dropSuccess',
                                        method: 'GET',
                                        redirectTo: '/ticket',
                                        setIsFormDisabled: () => {},
                                        setIsModalOpen: () => {},
                                    })
                                }
                                okText={gLang('ticketDetail.dropConfirmY')}
                                cancelText={gLang('ticketDetail.dropConfirmN')}
                            >
                                <Button
                                    type="primary"
                                    size="large"
                                    danger
                                    block
                                    style={{ marginTop: '10px' }}
                                >
                                    {gLang('ticketDetail.drop')}
                                </Button>
                            </Popconfirm>
                        </>
                    )}
            </Space>
        </>
    );
};

export default TicketDetail;
