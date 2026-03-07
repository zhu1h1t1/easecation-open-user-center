import React from 'react';
import { Button } from 'antd';
import { ReloadOutlined } from '@ant-design/icons';
import { gLang } from '@common/language';
import { GiWaterBottle } from 'react-icons/gi';
import useDarkMode from '@common/hooks/useDarkMode';

interface ErrorDisplayProps {
    onRetry?: () => void;
    title?: string;
    description?: string;
}

const ErrorDisplay: React.FC<ErrorDisplayProps> = ({
    onRetry,
    title = gLang('error.backendCrashed'),
    description = gLang('error.activelyFixing'),
}) => {
    const isDark = useDarkMode();

    const cardStyle = {
        maxWidth: '500px',
        width: '100%',
        padding: '24px',
        borderRadius: '8px',
        backgroundColor: isDark ? '#1e293b' : '#f0f9ff',
        border: `1px solid ${isDark ? '#475569' : '#bae6fd'}`,
        textAlign: 'center' as const,
    };

    const titleStyle = {
        fontSize: '18px',
        fontWeight: 600,
        color: isDark ? '#e2e8f0' : '#0c4a6e',
        marginBottom: '12px',
    };

    const descriptionStyle = {
        fontSize: '14px',
        color: isDark ? '#94a3b8' : '#0369a1',
        marginBottom: '20px',
        lineHeight: '1.5',
    };

    const iconColor = isDark ? '#60a5fa' : '#0ea5e9';

    return (
        <div
            style={{
                display: 'flex',
                justifyContent: 'center',
                alignItems: 'center',
                minHeight: '200px',
                padding: '20px',
            }}
        >
            <div style={cardStyle}>
                <div style={{ marginBottom: '16px' }}>
                    <GiWaterBottle size={48} color={iconColor} />
                </div>
                <div style={titleStyle}>{title}</div>
                <div style={descriptionStyle}>{description}</div>
                {onRetry && (
                    <Button
                        type="primary"
                        icon={<ReloadOutlined />}
                        onClick={onRetry}
                        style={{
                            borderRadius: '6px',
                            height: '40px',
                            fontWeight: 500,
                        }}
                    >
                        {gLang('retry')}
                    </Button>
                )}
            </div>
        </div>
    );
};

export default ErrorDisplay;
