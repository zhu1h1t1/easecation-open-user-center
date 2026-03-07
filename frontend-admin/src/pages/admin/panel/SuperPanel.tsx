// ECID超级面板（独立页面，也可以在ticketOperate中以Modal形式使用）

import { useParams, Navigate } from 'react-router-dom';
import SuperPanelPlayerComponent from './components/SuperPanelPlayerComponent';

const SuperPanel = () => {
    const { ecid, tid } = useParams();

    // 如果没有 ecid，重定向到主页
    if (!ecid) {
        return <Navigate to="/" replace />;
    }

    return (
        <div style={{ height: '100%', overflow: 'auto', width: '100%' }}>
            <SuperPanelPlayerComponent key={ecid} ecid={ecid} tid={tid ? parseInt(tid) : null} />
        </div>
    );
};

export default SuperPanel;
