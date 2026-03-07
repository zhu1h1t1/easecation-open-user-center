// 媒体申请工单组件

import React, { useState } from 'react';
import { Button, Form, Input, Modal, Select, Typography, Upload } from 'antd';
import { UploadOutlined } from '@ant-design/icons';

import { gLang } from '@common/language';
import { fetchData, submitData } from '../../../../axiosConfig';
import { useUploadProps } from '@common/utils/uploadUtils';
import { TicketAccount } from '@ecuc/shared/types/ticket.types';
import { SHORT_PLATFORM_CODES } from '@ecuc/shared/constants/media.constants';
import { MediaPlatform } from '@ecuc/shared/types/media.types';
import MonthlyLinkFormItem from './MonthlyLinkFormItem';

const { Paragraph } = Typography;
const { TextArea } = Input;

interface MediaApplyModalProps {
    isOpen: boolean;
    onClose: () => void;
    chooseGameList: TicketAccount[];
}

const MediaApplyTicket: React.FC<MediaApplyModalProps> = ({ isOpen, onClose, chooseGameList }) => {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [uploadedFiles, setUploadedFiles] = useState<string[]>([]);
    const [isUploading, setIsUploading] = useState(false);
    const [selectedPlatform, setSelectedPlatform] = useState<MediaPlatform | ''>('');
    const [form] = Form.useForm();

    const { uploadProps, contextHolder } = useUploadProps(
        10,
        uploadedFiles,
        setUploadedFiles,
        setIsUploading
    );

    const handlePlatformChange = (value: MediaPlatform) => {
        setSelectedPlatform(value);
        form.setFieldsValue({ biliAccount: undefined });
    };

    const getBilibiliUserInfo = async (uid: string) => {
        return new Promise<string | null>(resolve => {
            fetchData({
                url: '/proxy/bilibili/x/web-interface/card',
                method: 'POST',
                data: {
                    mid: Number(uid),
                    ua: navigator.userAgent,
                },
                setData: (data: any) => {
                    if (data && data.data && data.data.card && data.data.card.name) {
                        resolve(data.data.card.name);
                    } else if (data && data.data && data.data.name) {
                        resolve(data.data.name);
                    } else {
                        resolve(null);
                    }
                },
                setSpin: () => {},
            }).catch(() => {
                resolve(null);
            });
        });
    };

    const handleAccountBlur = async (e: React.FocusEvent<HTMLInputElement>) => {
        if (selectedPlatform === MediaPlatform.Bilibili) {
            const uid = e.target.value.trim();
            if (uid && /^[0-9]+$/.test(uid)) {
                const username = await getBilibiliUserInfo(uid);
                if (username) {
                    form.setFieldsValue({ biliAccount: username });
                }
            } else {
                form.setFieldsValue({ biliAccount: undefined });
            }
        }
    };

    return (
        <>
            {contextHolder}
            <Modal
                title={gLang('mediaList.applyTitle')}
                open={isOpen}
                footer={false}
                onCancel={onClose}
            >
                <Typography>
                    <Paragraph>{gLang('mediaList.applyIntro')}</Paragraph>
                    <Paragraph>{gLang('mediaList.applyIntro2')}</Paragraph>
                    {/* <img
            src="/image/media-intro.png"
            width={"100%"}
            style={{ marginBottom: "20px" }}
          /> */}
                </Typography>
                <Form
                    form={form} // 关联 form 实例，修复 setFieldsValue 不生效和警告
                    name="apply"
                    initialValues={{ remember: true }}
                    onFinish={values =>
                        submitData({
                            data: {
                                ecid: values.ecid,
                                detail: values.detail,
                                platform: values.platform,
                                account:
                                    selectedPlatform === MediaPlatform.Bilibili
                                        ? values.biliAccount
                                        : values.account,
                                link:
                                    selectedPlatform === MediaPlatform.Bilibili
                                        ? `https://space.bilibili.com/${values.account}`
                                        : values.bindlink,
                                monthlylink: values.monthlylink,
                                files: uploadedFiles,
                            },
                            url: '/media/applyBind',
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
                    {/* 绑定 */}
                    <Form.Item
                        label={gLang('mediaList.bindPlatform')}
                        name="platform"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Select
                            options={[
                                { value: MediaPlatform.Bilibili, label: gLang('mediaList.type.B') },
                                { value: MediaPlatform.Douyin, label: gLang('mediaList.type.D') },
                                { value: MediaPlatform.Kuaishou, label: gLang('mediaList.type.K') },
                                {
                                    value: MediaPlatform.Xiaohongshu,
                                    label: gLang('mediaList.type.X'),
                                },
                                { value: MediaPlatform.Wechat, label: gLang('mediaList.type.W') },
                                { value: MediaPlatform.Other, label: gLang('mediaList.type.Z') },
                            ]}
                            onChange={handlePlatformChange}
                        />
                    </Form.Item>
                    <Form.Item
                        label={gLang('mediaList.bindAccount')}
                        extra={
                            selectedPlatform === MediaPlatform.Other
                                ? gLang('mediaList.bindAccountIntroOth')
                                : selectedPlatform === MediaPlatform.Wechat
                                  ? gLang('mediaList.bindAccountIntroW')
                                  : selectedPlatform === MediaPlatform.Bilibili
                                    ? gLang('mediaList.bindAccountIntroB')
                                    : selectedPlatform &&
                                        SHORT_PLATFORM_CODES.includes(selectedPlatform)
                                      ? gLang('mediaList.bindAccountIntroShort')
                                      : gLang('mediaList.bindAccountIntro')
                        }
                        name="account"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                            ...(selectedPlatform === MediaPlatform.Bilibili
                                ? [
                                      {
                                          pattern: /^[0-9]+$/,
                                          message: gLang('mediaTicket.enterUidNumber'),
                                      },
                                  ]
                                : []),
                        ]}
                    >
                        <Input onBlur={handleAccountBlur} />
                    </Form.Item>

                    <Form.Item
                        label={gLang('mediaList.bindAccountbilibili')}
                        extra={gLang('mediaList.bindAccountIntrobilibili')}
                        name="biliAccount"
                        hidden={selectedPlatform !== MediaPlatform.Bilibili}
                        rules={[
                            {
                                required: selectedPlatform === MediaPlatform.Bilibili,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Input readOnly />
                    </Form.Item>
                    <Form.Item
                        label={gLang('mediaList.bindFiles')}
                        extra={gLang('mediaList.bindFilesIntro')}
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
                    {selectedPlatform !== MediaPlatform.Bilibili && (
                        <Form.Item
                            label={
                                selectedPlatform === MediaPlatform.Wechat
                                    ? gLang('mediaList.bindAccountName')
                                    : gLang('mediaList.bindLink')
                            }
                            extra={
                                selectedPlatform === MediaPlatform.Wechat
                                    ? gLang('mediaList.bindLinkIntroW')
                                    : gLang('mediaList.bindLinkIntro')
                            }
                            name="bindlink"
                            rules={[
                                {
                                    required: true,
                                    message: gLang('required'),
                                },
                                ...(selectedPlatform === MediaPlatform.Wechat
                                    ? []
                                    : [
                                          {
                                              pattern: /^(http|https):\/\//,
                                              message: gLang('mediaList.linkReq'),
                                          },
                                      ]),
                            ]}
                        >
                            <Input />
                        </Form.Item>
                    )}

                    {/* 申请 */}
                    <Form.Item
                        label={gLang('mediaList.applyEcid')}
                        name="ecid"
                        extra={gLang('mediaList.applyEcidIntro')}
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <Select
                            options={
                                Array.isArray(chooseGameList)
                                    ? chooseGameList.map(item => ({
                                          value: item.id,
                                          label: item.display,
                                      }))
                                    : []
                            }
                        />
                    </Form.Item>
                    <MonthlyLinkFormItem name="monthlylink" platform={selectedPlatform} />
                    <Form.Item
                        label={gLang('mediaList.applyDetail')}
                        extra={gLang('mediaList.applyDetailIntro')}
                        name="detail"
                        rules={[
                            {
                                required: true,
                                message: gLang('required'),
                            },
                        ]}
                    >
                        <TextArea autoSize={{ minRows: 2, maxRows: 4 }} />
                    </Form.Item>

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

export default MediaApplyTicket;
