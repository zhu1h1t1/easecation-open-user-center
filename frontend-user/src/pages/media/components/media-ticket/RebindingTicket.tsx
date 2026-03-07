// 媒体换绑工单组件

import React, { useState } from 'react';
import { Button, Form, Input, Modal, Select, Typography } from 'antd';
import { gLang } from '@common/language';
import { submitData } from '../../../../axiosConfig';
import { TicketAccount } from '@ecuc/shared/types/ticket.types';

const { Paragraph } = Typography;

interface ECIDUpdateModalProps {
    isOpen: boolean;
    onClose: () => void;
    ECID: string;
    chooseGameList: TicketAccount[];
}

const RebindingTicket: React.FC<ECIDUpdateModalProps> = ({
    isOpen,
    onClose,
    ECID,
    chooseGameList,
}) => {
    const [isFormDisabled, setIsFormDisabled] = useState(false);
    const [form] = Form.useForm();

    const validateNewECID = (value: string) => {
        if (value === ECID) {
            return Promise.reject(gLang('mediaList.errorSameECID'));
        }
        return Promise.resolve();
    };

    return (
        <Modal
            title={gLang('mediaList.updateECIDTitle')}
            open={isOpen}
            footer={false}
            onCancel={onClose}
        >
            <Typography>
                <Paragraph>{gLang('mediaList.updateECID')}</Paragraph>
                <Paragraph style={{ marginBottom: 16 }}>
                    {gLang('mediaList.currentECID')}:{'  ' + ECID}
                </Paragraph>
            </Typography>
            <Form
                form={form}
                name="update"
                onFinish={values =>
                    submitData({
                        data: {
                            ecid: values.ecid,
                            text: values.explain,
                        },
                        url: '/ticket/ecidTicket',
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
                    rules={[
                        {
                            required: true,
                            message: gLang('required'),
                        },
                        {
                            validator: (_rule, value) => validateNewECID(value),
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
                <Form.Item
                    label={gLang('mediaList.updateExplain')}
                    name="explain"
                    rules={[
                        {
                            required: true,
                            message: gLang('required'),
                        },
                    ]}
                >
                    <Input.TextArea
                        placeholder={gLang('mediaList.explainPlaceholder')}
                        disabled={isFormDisabled}
                    />
                </Form.Item>
                <Form.Item>
                    <Button type="primary" htmlType="submit">
                        {gLang('mediaList.applySubmit')}
                    </Button>
                </Form.Item>
            </Form>
        </Modal>
    );
};

export default RebindingTicket;
