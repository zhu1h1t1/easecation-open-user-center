import { Card, Flex, Layout } from 'antd';
import { greyDark } from '@ant-design/colors';
import { Content } from 'antd/es/layout/layout';
import { Outlet } from 'react-router-dom';
import { useTheme } from '@common/contexts/ThemeContext';

const SimpleLayoutComponent = () => {
    const { isDark } = useTheme();

    return (
        <>
            <Layout>
                <Content style={{ minHeight: '100vh' }}>
                    <Flex gap="middle" vertical={false} style={{ padding: 8 }}>
                        <Card
                            variant={'borderless'}
                            hoverable={false}
                            style={{
                                width: '100%',
                                height: '100%',
                                backgroundColor: isDark ? greyDark[0] : '#ffffff',
                            }}
                        >
                            <Outlet />
                        </Card>
                    </Flex>
                </Content>
            </Layout>
        </>
    );
};

export default SimpleLayoutComponent;
