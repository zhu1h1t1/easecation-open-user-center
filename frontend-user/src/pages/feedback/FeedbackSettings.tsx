// 反馈设置页面（包装层）
// 该路由仍保留用于从外部直接链接访问，内部使用 FeedbackSettingsModal 实现

import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Wrapper from '@common/components/Wrapper/Wrapper';
import usePageTitle from '@common/hooks/usePageTitle';
import FeedbackSettingsModal from './components/FeedbackSettingsModal';

const FeedbackSettings: React.FC = () => {
    usePageTitle();
    const navigate = useNavigate();
    const [open, setOpen] = useState(true);

    // 关闭 Modal 后返回反馈中心
    const handleClose = () => {
        setOpen(false);
        navigate('/feedback');
    };

    return (
        <Wrapper>
            <FeedbackSettingsModal open={open} onClose={handleClose} />
        </Wrapper>
    );
};

export default FeedbackSettings;
