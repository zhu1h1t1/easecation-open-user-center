/**
 * Unit tests for staff alias API (GET /staff/alias). Implementation inlined per project convention (no api/ folder).
 */
import { beforeEach, describe, expect, it, jest } from '@jest/globals';
import axiosInstance from '@common/axiosConfig';
import { gLang } from '@common/language';

const mockGet = jest.fn();

jest.mock('@common/axiosConfig', () => ({
    __esModule: true,
    default: {
        get: (...args: unknown[]) => mockGet(...args),
    },
}));

/** GET /staff/alias, returns response.data. Inlined here to avoid api/ folder. */
async function getStaffAliasList(): Promise<{ list?: unknown[]; aliases?: unknown[] }> {
    const response = await axiosInstance.get('/staff/alias');
    return (response as { data?: unknown }).data ?? {};
}

describe('staffApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getStaffAliasList', () => {
        it(gLang('spec.staffApiRequest'), async () => {
            const data = { aliases: [] };
            (mockGet as any).mockResolvedValue({ data });
            const result = await getStaffAliasList();
            expect(mockGet).toHaveBeenCalledWith('/staff/alias');
            expect(result).toEqual(data);
        });
    });
});
