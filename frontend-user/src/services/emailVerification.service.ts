import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';
import { EmailVerificationActionType } from '../../../shared/types/user.types';

/** 发送邮件验证结果，失败时 message 含后端提示（如限流） */
export type SendEmailVerificationResult = { success: true } | { success: false; message: string };

/**
 * 发送邮件验证
 * @param ecid ECID
 * @param actionType 操作类型
 * @param actionData 操作数据（可选）
 * @returns Promise<SendEmailVerificationResult>
 */
export const sendEmailVerification = async (
    ecid: string,
    actionType: EmailVerificationActionType,
    actionData?: any
): Promise<SendEmailVerificationResult> => {
    try {
        const response = await axiosInstance.post('/email-verification/send', {
            ecid,
            action_type: actionType,
            action_data: actionData,
        });

        if (response.data.EPF_code === 200) return { success: true };
        return {
            success: false,
            message: response.data.message || gLang('emailVerificationService.sendFailedRetry'),
        };
    } catch (error: any) {
        console.error(gLang('emailVerificationService.sendVerifyFailed'), error);
        const msg = error.response?.data?.message;
        return {
            success: false,
            message:
                typeof msg === 'string' ? msg : gLang('emailVerificationService.sendFailedRetry'),
        };
    }
};

/**
 * 验证邮件token
 * @param token JWT token
 * @param newPasswordHash 新密码哈希（可选，网易账号不需要）
 * @returns Promise<any>
 */
export const verifyEmailToken = async (token: string, newPasswordHash?: string): Promise<any> => {
    try {
        const data: any = {};

        // 只有非网易账号才传递密码哈希
        if (newPasswordHash) {
            data.newPasswordHash = newPasswordHash;
        }

        // 通过请求头传递 token（后端会优先从 referer 读取，如果没有则从请求头读取）
        const response = await axiosInstance.post('/email-verification/verify', data, {
            headers: {
                'x-email-verification-token': token,
            },
        });

        return response.data;
    } catch (error) {
        console.error(gLang('emailVerificationService.verifyTokenFailed'), error);
        throw error;
    }
};
