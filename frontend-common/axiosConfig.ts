// axiosConfig.ts
import axios from 'axios';
import { getGlobalMessageApi } from './utils/messageApiHolder';
import { gLang } from './language';
import { BACKEND_DOMAIN } from './global';

interface FetchDataParams {
    url: string;
    method: 'GET' | 'POST' | 'PUT';
    data: any;
    setData: (data: any) => void;
    setSpin?: ((data: any) => void) | (() => void);
    callback?: () => void;
}

export const fetchData = async ({
    url,
    method,
    data,
    setData,
    setSpin = () => {},
    callback,
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
            if (api) {
                api.error(
                    response.data.message ? response.data.message : response.data.EPF_description
                );
            }
        } else {
            setData(response.data);
        }
    } catch (error: any) {
        if (error.response?.data && error.response.data.EPF_description) {
            if (error.response?.data.EPF_code === 8003) {
                const currentUrl = window.location.href;
                window.location.href = '/login?return_to=' + encodeURIComponent(currentUrl);
            }
        }
        throw error;
    } finally {
        setSpin(false);
        // 执行回调函数
        if (callback) {
            callback();
        }
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
            if (api) {
                api.error(
                    response.data.message ? response.data.message : response.data.EPF_description
                );
            }
        } else {
            const api = messageApi || getGlobalMessageApi();
            if (api) {
                api.success(gLang(successMessage));
            }
            // wait for 1 second
            await new Promise(resolve => setTimeout(resolve, 1000));
            setIsModalOpen(false); // 关闭模态窗口
            if (redirectTo) {
                window.location.href = redirectTo; // 重定向到指定页面
            }
        }
        // 返回响应数据
        return response.data;
    } catch (error: any) {
        if (error.response?.data?.EPF_code && error.response?.data?.EPF_code !== 200) {
            const api = messageApi || getGlobalMessageApi();
            if (api) {
                api.error(
                    error.response.data.message
                        ? error.response.data.message
                        : error.response.data.EPF_description
                );
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

let isRefreshing = false;
let refreshSubscribers: Array<{ resolve: (token: string) => void; reject: (error: any) => void }> =
    [];

const onTokenRefreshed = (newToken: string) => {
    refreshSubscribers.forEach(({ resolve }) => resolve(newToken));
    refreshSubscribers = [];
};

const onRefreshFailed = (error: any) => {
    refreshSubscribers.forEach(({ reject }) => reject(error));
    refreshSubscribers = [];
};

const addRefreshSubscriber = (resolve: (token: string) => void, reject: (error: any) => void) => {
    refreshSubscribers.push({ resolve, reject });
};

const clearAuthAndRedirect = () => {
    localStorage.removeItem('jwt');
    localStorage.removeItem('jwt_refresh');
    const currentUrl = window.location.href;
    window.location.href = '/login?return_to=' + encodeURIComponent(currentUrl);
};

// Response interceptor：401/8003 时自动刷新 token，并保留原有 403 提示逻辑
axiosInstance.interceptors.response.use(
    response => response,
    async error => {
        const status = error.response?.status;
        const epfCode = error.response?.data?.EPF_code;
        const originalRequest = error.config || {};
        const shouldTryRefresh = status === 401 || (status === 403 && epfCode === 8003);

        if (shouldTryRefresh) {
            const requestUrl = originalRequest?.url || '';
            if (
                requestUrl.includes('/user/refresh') ||
                requestUrl.includes('/user/logout') ||
                originalRequest._retried
            ) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            const refreshToken = localStorage.getItem('jwt_refresh');
            if (!refreshToken) {
                clearAuthAndRedirect();
                return Promise.reject(error);
            }

            if (isRefreshing) {
                return new Promise((resolve, reject) => {
                    addRefreshSubscriber((newToken: string) => {
                        originalRequest.headers = originalRequest.headers || {};
                        originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                        resolve(axiosInstance(originalRequest));
                    }, reject);
                });
            }

            isRefreshing = true;
            originalRequest._retried = true;

            try {
                const refreshResp = await axiosInstance.post('/user/refresh', {
                    refresh_token: refreshToken,
                });
                const newToken = refreshResp.data?.token || refreshResp.data?.data?.token;

                if (!newToken || typeof newToken !== 'string') {
                    throw new Error('No token in refresh response');
                }

                localStorage.setItem('jwt', newToken);
                axiosInstance.defaults.headers.common['Authorization'] = `Bearer ${newToken}`;
                onTokenRefreshed(newToken);

                originalRequest.headers = originalRequest.headers || {};
                originalRequest.headers['Authorization'] = `Bearer ${newToken}`;
                return axiosInstance(originalRequest);
            } catch (_refreshError) {
                onRefreshFailed(_refreshError);
                clearAuthAndRedirect();
                return Promise.reject(error);
            } finally {
                isRefreshing = false;
            }
        }

        // 保留原有 /admin/ticket/assign* 的 403 特殊提示
        if (status === 403) {
            const currentPath = window.location.pathname;
            const requestUrl = originalRequest?.url || '';
            const errorMessage = error.response?.data?.message;

            // 检查是否是冻结错误消息
            if (errorMessage === gLang('axios.accountFrozen')) {
                const messageApi = getGlobalMessageApi();
                if (messageApi) {
                    messageApi.error(errorMessage);
                }
                return Promise.reject(error);
            }

            // Check if current page is /admin/ticket/assign* or request URL is /ticket/assign
            if (
                currentPath.startsWith('/admin/ticket/assign') ||
                requestUrl.includes('/ticket/assign')
            ) {
                const messageApi = getGlobalMessageApi();
                if (messageApi) {
                    messageApi.warning(gLang('adminPermission.insufficient'));
                }
                // Navigate back to previous page after a short delay
                setTimeout(() => {
                    window.history.back();
                }, 500);
                return Promise.reject(error);
            }
        }
        return Promise.reject(error);
    }
);

export default axiosInstance;
