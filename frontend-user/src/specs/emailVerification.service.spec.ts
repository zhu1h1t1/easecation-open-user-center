/**
 * Unit tests for emailVerification.service (sendEmailVerification, verifyEmailToken).
 */
import { afterEach, beforeEach, describe, expect, it, jest } from '@jest/globals';
import { gLang } from '@common/language';
import { EmailVerificationActionType } from '@ecuc/shared/types/user.types';
import { sendEmailVerification, verifyEmailToken } from '../services/emailVerification.service';

const mockPost = jest.fn();

jest.mock('@common/axiosConfig', () => ({
    __esModule: true,
    default: {
        post: (...args: unknown[]) => mockPost(...args),
    },
}));

describe('emailVerification.service', () => {
    let consoleErrorSpy: ReturnType<typeof jest.spyOn>;

    beforeEach(() => {
        jest.clearAllMocks();
        consoleErrorSpy = jest.spyOn(console, 'error').mockImplementation(() => {});
    });

    afterEach(() => {
        consoleErrorSpy?.mockRestore();
    });

    describe('sendEmailVerification', () => {
        it(gLang('spec.emailVerifySuccess'), async () => {
            (mockPost as any).mockResolvedValue({ data: { EPF_code: 200 } });
            const result = await sendEmailVerification(
                'ecid-1',
                EmailVerificationActionType.ResetPassword
            );
            expect(mockPost).toHaveBeenCalledWith('/email-verification/send', {
                ecid: 'ecid-1',
                action_type: EmailVerificationActionType.ResetPassword,
                action_data: undefined,
            });
            expect(result).toEqual({ success: true });
        });

        it(gLang('spec.emailVerifyEpfNon200'), async () => {
            (mockPost as any).mockResolvedValue({ data: { EPF_code: 4001, message: 'bad' } });
            const result = await sendEmailVerification(
                'ecid-1',
                EmailVerificationActionType.SetSecurity
            );
            expect(result).toEqual({ success: false, message: 'bad' });
        });

        it(gLang('spec.emailVerifyThrow'), async () => {
            (mockPost as any).mockRejectedValue(new Error('network error'));
            const result = await sendEmailVerification(
                'ecid-1',
                EmailVerificationActionType.ClearSecurity
            );
            expect(result.success).toBe(false);
            expect((result as any).message).toBe(gLang('spec.emailVerifyMessage'));
        });
    });

    describe('verifyEmailToken', () => {
        it(gLang('spec.emailVerifyResponse'), async () => {
            const data = { token: 'x', EPF_code: 200 };
            (mockPost as any).mockResolvedValue({ data });
            const result = await verifyEmailToken('token-abc');
            expect(mockPost).toHaveBeenCalledWith(
                '/email-verification/verify',
                {},
                { headers: { 'x-email-verification-token': 'token-abc' } }
            );
            expect(result).toEqual(data);
        });

        it(gLang('spec.emailVerifyWithPassword'), async () => {
            (mockPost as any).mockResolvedValue({ data: {} });
            await verifyEmailToken('t', 'hash123');
            expect(mockPost).toHaveBeenCalledWith(
                '/email-verification/verify',
                { newPasswordHash: 'hash123' },
                expect.any(Object)
            );
        });

        it(gLang('spec.emailVerifyRequestFail'), async () => {
            (mockPost as any).mockRejectedValue(new Error('verify failed'));
            await expect(verifyEmailToken('bad')).rejects.toThrow('verify failed');
        });
    });
});
