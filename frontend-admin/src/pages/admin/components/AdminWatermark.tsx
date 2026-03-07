// 管理页面水印

import { Watermark } from 'antd';
import { useAuth } from '@common/contexts/AuthContext';
import { Outlet } from 'react-router-dom';

const AdminWatermark = () => {
    const { user } = useAuth();
    return (
        <Watermark
            content={user?.openid}
            font={{ color: 'rgba(100,100,0,0.05)' }}
            gap={[10, 10]}
            style={{
                display: 'flex',
                flex: 1,
                overflow: 'visible',
                width: '100%',
            }}
        >
            <Outlet />
        </Watermark>
    );
};

export default AdminWatermark;
