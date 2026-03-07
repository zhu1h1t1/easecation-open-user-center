// 反馈管理路由分发组件
// PC 端：左侧 FeedbackPCSidebar 负责列表，右侧显示空状态占位（当前文件渲染）
// 手机端：直接渲染完整的 FeedbackManage 列表页（含搜索、筛选、列表）

import React from 'react';
import useIsPC from '@common/hooks/useIsPC';
import FeedbackManage from './FeedbackManage';
import FeedbackManageIndexPage from './FeedbackManageIndexPage';

const FeedbackManageRoute: React.FC = () => {
    const isPC = useIsPC();
    // 手机端没有侧边栏，直接展示完整列表页
    if (!isPC) {
        return <FeedbackManage />;
    }
    // PC 端侧边栏已承担列表职责，此处仅渲染右侧空状态引导
    return <FeedbackManageIndexPage />;
};

export default FeedbackManageRoute;
