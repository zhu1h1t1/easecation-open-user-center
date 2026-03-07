// 返回页面顶部按钮组件

import React, { useState, useEffect } from 'react';
import Button from 'antd/es/button';
import { VerticalAlignTopOutlined } from '@ant-design/icons';

interface BackToTopProps {
    isPC: boolean;
    officialReplies: Array<{
        id: number;
        floor: number;
        title: string;
    }>;
}

const BackToTop: React.FC<BackToTopProps> = ({ isPC }) => {
    const [visible, setVisible] = useState(false);

    // 监听滚动事件，控制按钮显示/隐藏
    useEffect(() => {
        const handleScroll = () => {
            setVisible(window.scrollY > 300);
        };

        window.addEventListener('scroll', handleScroll);
        return () => window.removeEventListener('scroll', handleScroll);
    }, []);

    // 滚动到顶部
    const handleBackToTop = () => {
        window.scrollTo({
            top: 0,
            behavior: 'smooth',
        });
    };

    if (!visible) {
        return null;
    }

    return (
        <Button
            type="primary"
            icon={<VerticalAlignTopOutlined style={{ fontSize: '16px' }} />}
            onClick={handleBackToTop}
            style={{
                position: 'fixed',
                ...(isPC
                    ? {
                          bottom: '20px',
                          right: '20px',
                          transform: 'none',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                      }
                    : {
                          right: '16px',
                          top: 'calc(50% + 60px)',
                          transform: 'translateY(-50%)',
                          width: 40,
                          height: 40,
                          borderRadius: '50%',
                      }),
                zIndex: 100,
                minWidth: 'unset',
                padding: 0,
                boxShadow: '0 2px 8px rgba(0, 0, 0, 0.15)',
            }}
        />
    );
};

export default BackToTop;
