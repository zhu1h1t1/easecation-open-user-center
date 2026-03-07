// axiosConfig.ts
import axios from 'axios';
import { getGlobalMessageApi } from '@common/utils/messageApiHolder';
import { gLang } from '@common/language';
import { BACKEND_DOMAIN } from '@common/global';

interface FetchDataParams {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    data: any;
    setData: (data: any) => void;
    setSpin?: ((data: any) => void) | (() => void);
}

export const fetchData = async ({
    url,
    method,
    data,
    setData,
    setSpin = () => {},
}: FetchDataParams) => {
    try {
        let response;
        if (method === 'GET') {
            response = await axiosInstance.get(url, { params: data });
        } else if (method === 'POST') {
            response = await axiosInstance.post(url, data);
        } else if (method === 'PUT') {
            response = await axiosInstance.put(url, data);
        } else {
            throw new Error(`Unsupported method: ${method}`);
        }

        if (response.data.EPF_code && response.data.EPF_code !== 200) {
            const api = getGlobalMessageApi();
            const errorMsg = response.data.message
                ? response.data.message
                : response.data.EPF_description;
            if (api) {
                api.error(errorMsg);
            } else {
                console.error(errorMsg);
            }
        } else {
            setData(response.data);
        }
    } catch (error: any) {
        console.error('Request failed:', error);
        if (error.response?.data && error.response.data.EPF_description) {
            console.error(error.response.data.EPF_description);
            if (error.response?.data.EPF_code === 8003) {
                console.log('!!!!!!');
                const currentUrl = window.location.href;
                window.location.href = '/login?return_to=' + encodeURIComponent(currentUrl);
            }
        }
        throw error;
    } finally {
        setSpin(false);
    }
};

interface SubmitDataParams {
    data: any;
    url: string;
    successMessage: string;
    method: 'GET' | 'POST' | 'PUT' | 'DELETE';
    redirectTo?: string;
    setIsFormDisabled: (isDisabled: boolean) => void;
    setIsModalOpen: (isOpen: boolean) => void;
}

export const submitData = async ({
    data,
    url,
    successMessage,
    method,
    redirectTo,
    setIsFormDisabled,
    setIsModalOpen,
    messageApi,
}: SubmitDataParams & { messageApi?: any }) => {
    if (messageApi) {
        messageApi.loading(gLang('inProgress'), 0.5);
    } else {
        const api = getGlobalMessageApi();
        if (api) {
            api.loading(gLang('inProgress'), 0.5);
        }
    }
    setIsFormDisabled(true); // 禁用表单

    // 转换data中的每一项为中文UTF8编码，注意不是URI编码
    // for (let key in data) {
    //   if (data[key] !== null && data[key] !== undefined && typeof data[key] === 'string') {
    //     data[key] = encodeURIComponent(data[key]);
    //   }
    // }

    try {
        let response;

        if (method === 'GET') {
            response = await axiosInstance.get(url, { params: data });
        } else if (method === 'PUT') {
            response = await axiosInstance.put(url, data);
        } else if (method === 'DELETE') {
            response = await axiosInstance.delete(url, { data });
        } else {
            // 默认为POST
            response = await axiosInstance.post(url, data);
        }

        if (response.data.EPF_code && response.data.EPF_code !== 200) {
            const api = messageApi || getGlobalMessageApi();
            const errorMsg = response.data.message
                ? response.data.message
                : response.data.EPF_description;
            if (api) {
                api.error(errorMsg);
            } else {
                console.error(errorMsg);
            }
        } else {
            const api = messageApi || getGlobalMessageApi();
            if (api) {
                api.success(gLang(successMessage));
            } else {
                console.log(gLang(successMessage));
            }
            // wait for 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsModalOpen(false); // 关闭模态窗口
            if (redirectTo) {
                window.location.href = redirectTo; // 重定向到指定页面
            }
        }
    } catch (error: any) {
        console.error('Request failed:', error);
        if (error.response?.data?.EPF_code && error.response?.data?.EPF_code !== 200) {
            const api = messageApi || getGlobalMessageApi();
            const errorMsg = error.response.data.message
                ? error.response.data.message
                : error.response.data.EPF_description;
            if (api) {
                api.error(errorMsg);
            } else {
                console.error(errorMsg);
            }
        }
        throw error;
    } finally {
        setIsFormDisabled(false); // 重新启用表单
    }
};

const axiosInstance = axios.create({
    baseURL: BACKEND_DOMAIN,
});

axiosInstance.interceptors.request.use(
    config => {
        const token = localStorage.getItem('jwt'); // 从 localStorage 获取 JWT 令牌
        if (token) {
            config.headers['Authorization'] = `Bearer ${token}`;
        }
        return config;
    },
    error => {
        return Promise.reject(error);
    }
);

export default axiosInstance;
