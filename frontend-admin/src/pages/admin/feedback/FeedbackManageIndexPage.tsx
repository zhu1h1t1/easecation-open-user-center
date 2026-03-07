// 反馈管理首页占位页面
// 当用户未选择任何反馈时，右侧显示此空状态引导页

import React from 'react';
import { Typography } from 'antd';
import { MessageOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import useDarkMode from '@common/hooks/useDarkMode';

const { Text } = Typography;

const FeedbackManageIndexPage: React.FC = () => {
    const isDarkMode = useDarkMode();

    return (
        <div
            style={{
                flex: 1,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: 12,
                userSelect: 'none',
            }}
        >
            <div
                style={{
                    width: 64,
                    height: 64,
                    borderRadius: '50%',
                    background: isDarkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.04)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                }}
            >
                <MessageOutlined
                    style={{
                        fontSize: 28,
                        color: isDarkMode ? 'rgba(255,255,255,0.2)' : 'rgba(0,0,0,0.2)',
                    }}
                />
            </div>
            <Text
                style={{
                    fontSize: 13,
                    color: isDarkMode ? 'rgba(255,255,255,0.25)' : 'rgba(0,0,0,0.25)',
                }}
            >
                {gLang('feedback.selectToView')}
            </Text>
        </div>
    );
};

export default FeedbackManageIndexPage;
