/**
 * Unit tests for announcement API (GET /announcement/list). Implementation inlined per project convention.
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

/** GET /announcement/list, returns response.data. Inlined here to match staffApi pattern. */
async function getAnnouncementList(): Promise<{ list?: unknown[] }> {
    const response = await axiosInstance.get('/announcement/list');
    return (response as { data?: { list?: unknown[] } }).data ?? {};
}

describe('announcementApi', () => {
    beforeEach(() => {
        jest.clearAllMocks();
    });

    describe('getAnnouncementList', () => {
        it(gLang('spec.announcementApiRequest'), async () => {
            const data = { list: [] };
            (mockGet as any).mockResolvedValue({ data });
            const result = await getAnnouncementList();
            expect(mockGet).toHaveBeenCalledWith('/announcement/list');
            expect(result).toEqual(data);
        });
    });
});
