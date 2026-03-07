// E点申请工单组件

import React, { useState } from 'react';
import { Button, Form, Input, Modal, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import { submitData } from '../../../../axiosConfig';
import { useUploadProps } from '@common/utils/uploadUtils';
import MonthlyLinkFormItem from './MonthlyLinkFormItem';

const { Paragraph } = Typography;

interface MonthlyReviewModalProps {
    isOpen: boolean;
    onClose: () => void;
    ECID: string;
    platform?: string; // 平台代码
}

const MonthlyReviewTicket: React.FC<MonthlyReviewModalProps> = ({
    isOpen,
    onClose,
    ECID,
    platform,
}) => {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);

    const { uploadProps, contextHolder } = useUploadProps(
        10,
        uploadedFiles,
        setUploadedFiles,
        setIsUploading
    );

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('mediaList.monthlyTitle')}
                open={isOpen}
                footer={false}
                onCancel={onClose}
            >
                <Typography>
                    <Paragraph>{gLang('mediaList.monthlyIntro')}</Paragraph>
                </Typography>
                <Form
                    name="monthly"
                    initialValues={{ remember: true, ecid: ECID }}
                    onFinish={values =>
                        submitData({
                            data: {
                                files: uploadedFiles,
                                link: values.link,
                                ecid: values.ecid,
                            },
                            url: '/ticket/media/monthly',
                            redirectTo: '/media',
                            successMessage: 'mediaList.submitSuccess',
                            method: 'POST',
                            setIsFormDisabled: setIsFormDisabled,
                            setIsModalOpen: onClose,
                        })
                    }
                    autoComplete="off"
                    disabled={isFormDisabled}
                >
                    <Form.Item
                        label={gLang('mediaList.applyEcid')}
                        name="ecid"
                        initialValue={ECID}
                        extra={gLang('mediaList.monthlyEcidIntro')}
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Input defaultValue={ECID} readOnly />
                    </Form.Item>
                    <Form.Item
                        label={gLang('mediaList.monthlyFiles')}
                        extra={gLang('mediaList.monthlyFilesIntro')}
                        name="files"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                        valuePropName="fileList"
                        getValueFromEvent={e => (Array.isArray(e) ? e : e?.fileList || [])}
                    >
                        <Upload {...uploadProps}>
                            <Button
                                icon={<UploadOutlined />}
                                loading={isUploading}
                                disabled={isUploading}
                            >
                                {isUploading ? gLang('files.uploadingText') : gLang('files.btn')}
                            </Button>
                        </Upload>
                    </Form.Item>
                    <MonthlyLinkFormItem name="link" platform={platform} />
                    <Form.Item>
                        <Button
                            type="primary"
                            htmlType="submit"
                            disabled={isUploading || isFormDisabled}
                        >
                            {gLang('mediaList.applySubmit')}
                        </Button>
                    </Form.Item>
                </Form>
            </Modal>
        </>
    );
};

export default MonthlyReviewTicket;
