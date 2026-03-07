import React, { useMemo, useState } from 'react';
import { Button, Modal, Typography } from 'antd';
import { ArrowLeftOutlined } from '@ant-design/icons';
import { useNavigate } from 'react-router-dom';
import Wrapper from '@common/components/Wrapper/Wrapper';
import { gLang } from '@common/language';
import { useTheme } from '@common/contexts/ThemeContext';
import usePageTitle from '@common/hooks/usePageTitle';
import TicketForm from '../ticket-list/components/TicketForm';
import TicketTypeSelector, {
    getTicketTypeGroups,
} from '../ticket-list/components/TicketTypeSelector';
import styles from '../ticket-list/components/TicketForm.module.css';
import { TicketType } from '@ecuc/shared/types/ticket.types';

const TicketTypeSelect: React.FC = () => {
    usePageTitle();
    const navigate = useNavigate();
    const { isDark } = useTheme();
    const ticketTypeGroups = useMemo(() => getTicketTypeGroups((key: string) => gLang(key)), []);
    const [selectedType, setSelectedType] = useState<TicketType | undefined>();
    const [isModalOpen, setIsModalOpen] = useState(false);

    const handleTypeSelect = (type: TicketType) => {
        setSelectedType(type);
        setIsModalOpen(true);
    };

    const handleModalToggle = (open: boolean) => {
        setIsModalOpen(open);
        if (!open) {
            setSelectedType(undefined);
        }
    };

    return (
        <Wrapper>
            <div
                style={{
                    marginBottom: 16,
                    opacity: 0,
                    transform: 'translateY(-10px)',
                    animation: 'fadeInUp 0.5s ease-in-out forwards',
                }}
            >
                <Button
                    type="link"
                    icon={<ArrowLeftOutlined />}
                    onClick={() => navigate('/ticket')}
                >
                    {gLang('ticketList.backToList')}
                </Button>
            </div>
            <Typography>
                <div className={styles.ticketLayout}></div>
                <TicketTypeSelector
                    groups={ticketTypeGroups}
                    isDark={isDark}
                    value={selectedType}
                    onChange={setSelectedType}
                    onTypeSelect={handleTypeSelect}
                />
            </Typography>
            <Modal
                title={gLang('ticketList.newBtn')}
                open={isModalOpen}
                onCancel={() => handleModalToggle(false)}
                footer={null}
                destroyOnHidden
            >
                {selectedType && (
                    <TicketForm
                        setIsModalOpen={handleModalToggle}
                        initialType={selectedType}
                        hideTypeSelector
                    />
                )}
            </Modal>
        </Wrapper>
    );
};

export default TicketTypeSelect;
