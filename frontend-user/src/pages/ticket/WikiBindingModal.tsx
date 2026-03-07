// WIKI绑定验证码弹窗组件

import React, { useEffect, useState } from 'react';
import { Modal, Form, Button, Select, message, Typography, Alert } from 'antd';
import { fetchData } from '@common/axiosConfig';
import { gLang } from '@common/language';
import { PlayerBindListData } from '@ecuc/shared/types/player.types';

const { Paragraph } = Typography;

interface WikiBindingModalProps {
    isOpen: boolean;
    onClose: () => void;
    /** ECIDs already bound to Wiki; these will be excluded from the select options */
    boundEcidList?: string[];
}

interface VercodeResponse {
    vercode: number;
    ecid: string;
}

const WikiBindingModal: React.FC<WikiBindingModalProps> = ({
    isOpen,
    onClose,
    boundEcidList = [],
}) => {
    const [form] = Form.useForm();
    const [loading, setLoading] = useState(false);
    const [bindPlayers, setBindPlayers] = useState<PlayerBindListData[]>([]);
    const [vercodeResult, setVercodeResult] = useState<VercodeResponse | null>(null);
    const [messageApi, messageContextHolder] = message.useMessage();

    // 获取用户绑定的账号列表
    useEffect(() => {
        if (isOpen) {
            fetchData({
                url: '/ec/list',
                method: 'GET',
                data: {},
                setData: result => {
                    setBindPlayers(result || []);
                },
            });
            // 重置状态
            setVercodeResult(null);
            form.resetFields();
        }
    }, [isOpen, form]);

    // 获取验证码
    const handleGetVerificationCode = async (values: { ecid: string }) => {
        if (!values.ecid) {
            messageApi.error(gLang('wiki.binding.form.selectEcid'));
            return;
        }

        setLoading(true);
        setVercodeResult(null);
        try {
            await fetchData({
                url: `/wiki/bindings/vercode?ecid=${values.ecid}`,
                method: 'GET',
                data: {},
                setData: (result: { data: VercodeResponse }) => {
                    setVercodeResult(result.data);
                    messageApi.success(gLang('wikiBinding.codeSuccess'));
                },
            });
        } catch (error: any) {
            messageApi.error(error.message || gLang('wikiBinding.codeFailed'));
        } finally {
            setLoading(false);
        }
    };

    const handleClose = () => {
        form.resetFields();
        setVercodeResult(null);
        onClose();
    };

    return (
        <>
            {messageContextHolder}
            <Modal
                title={gLang('wikiBinding.getCode')}
                open={isOpen}
                onCancel={handleClose}
                footer={null}
                width={600}
                destroyOnClose
            >
                <Typography>
                    <Paragraph>{gLang('wikiBinding.modalDesc')}</Paragraph>

                    <Form
                        form={form}
                        layout="vertical"
                        onFinish={handleGetVerificationCode}
                        autoComplete="off"
                        disabled={loading}
                    >
                        <Form.Item
                            name="ecid"
                            label={gLang('wiki.binding.form.ecidLabel')}
                            rules={[{ required: true, message: gLang('required') }]}
                            extra={gLang('wiki.binding.form.ecidExtra')}
                        >
                            <Select placeholder={gLang('wiki.binding.form.ecidPlaceholder')}>
                                {bindPlayers
                                    .filter(player => !boundEcidList.includes(player.ecid))
                                    .map(player => (
                                        <Select.Option key={player.ecid} value={player.ecid}>
                                            {player.ecid}{' '}
                                            {player.vip === 999
                                                ? gLang('wiki.binding.form.frozenAccount')
                                                : ''}
                                        </Select.Option>
                                    ))}
                            </Select>
                        </Form.Item>

                        {vercodeResult && (
                            <Form.Item>
                                <Alert
                                    message={gLang('wikiBinding.codeLabel')}
                                    description={
                                        <div>
                                            <p>
                                                <strong>{gLang('wikiBinding.ecidLabel')}</strong>{' '}
                                                {vercodeResult.ecid}
                                            </p>
                                            <p>
                                                <strong>
                                                    {gLang('wikiBinding.verificationCodeLabel')}
                                                </strong>{' '}
                                                <span
                                                    style={{
                                                        fontSize: '24px',
                                                        fontWeight: 'bold',
                                                        color: '#1890ff',
                                                    }}
                                                >
                                                    {vercodeResult.vercode}
                                                </span>
                                            </p>
                                        </div>
                                    }
                                    type="success"
                                    showIcon
                                />
                            </Form.Item>
                        )}

                        <Form.Item>
                            <Button type="primary" htmlType="submit" loading={loading} block>
                                {gLang('wikiBinding.getCodeButton')}
                            </Button>
                        </Form.Item>
                    </Form>
                </Typography>
            </Modal>
        </>
    );
};

export default WikiBindingModal;
