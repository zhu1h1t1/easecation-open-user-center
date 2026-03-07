// Wrapper组件，把子组件居中
import React from 'react';

interface WrapperProps {
    children: React.ReactNode;
    maxWidth?: number;
    style?: React.CSSProperties;
}

const Wrapper: React.FC<WrapperProps> = ({ children, maxWidth = 800, style }) => {
    const wrapperStyle = {
        width: '100%',
        maxWidth: `${maxWidth}px`,
        margin: '10px auto',
        ...style,
    };
    return <div style={wrapperStyle}>{children}</div>;
};

export default Wrapper;
