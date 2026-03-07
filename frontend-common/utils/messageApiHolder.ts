import type { MessageInstance } from 'antd/es/message/interface';

let globalMessageApi: MessageInstance | null = null;

export const setGlobalMessageApi = (api: MessageInstance) => {
    globalMessageApi = api;
};

export const getGlobalMessageApi = (): MessageInstance | null => globalMessageApi;
