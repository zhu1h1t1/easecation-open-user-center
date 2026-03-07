import { Card, Layout } from 'antd';
import { Content } from 'antd/es/layout/layout';
import { Outlet } from 'react-router-dom';

const CardOnlyLayoutComponent = () => {
    return (
        <>
            <Layout style={{ minHeight: '100vh', background: 'transparent' }}>
                <Content
                    style={{
                        minHeight: '100vh',
                        padding: 0,
                        margin: 0,
                        background: 'transparent',
                    }}
                >
                    <Card
                        variant={'borderless'}
                        hoverable={false}
                        style={{
                            width: '100%',
                            height: '100vh',
                            padding: 0,
                            margin: 0,
                            borderRadius: 0,
                            backgroundColor: 'transparent',
                            boxShadow: 'none',
                        }}
                        styles={{
                            body: {
                                padding: 0,
                                margin: 0,
                                height: '100%',
                                width: '100%',
                            },
                        }}
                    >
                        <Outlet />
                    </Card>
                </Content>
            </Layout>
        </>
    );
};

export default CardOnlyLayoutComponent;
