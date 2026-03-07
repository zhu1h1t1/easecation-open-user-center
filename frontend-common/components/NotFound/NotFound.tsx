import React from 'react';
import { gLang } from '../../language';
import { Button, Space, Typography } from 'antd';
import Wrapper from '../Wrapper/Wrapper';
import PageTitle from '../PageTitle/PageTitle';

const NotFound = () => {
    return (
        <Wrapper>
            <Space
                direction="vertical"
                align="center"
                style={{
                    padding: '56px 0',
                    width: '100%',
                }}
            >
                <img
                    src="/image/notFound.png"
                    alt="404"
                    style={{
                        width: 160,
                        height: 160,
                        objectFit: 'contain',
                        userSelect: 'none',
                    }}
                />
                <PageTitle title={gLang('notFound.title')} />
                <Typography.Text
                    style={{
                        color: '#7a869a',
                        fontSize: 20,
                        textAlign: 'center',
                        wordBreak: 'break-all',
                    }}
                >
                    {gLang('notFound.currentPath', { path: window.location.pathname })}
                </Typography.Text>
                <Button
                    type="default"
                    size="large"
                    href="/"
                    style={{
                        marginTop: 24,
                        borderRadius: 24,
                        minWidth: 140,
                        fontSize: 18,
                        height: 48,
                        fontWeight: 500,
                        letterSpacing: 1,
                    }}
                >
                    {gLang('notFound.goHome')}
                </Button>
            </Space>
        </Wrapper>
    );
};

export default NotFound;
