/**
 * Unit tests for announcementUtils (isAnnouncementActive, parseModalOpenCommand, hasModalOpenCommand).
 */
import { describe, expect, it, jest } from '@jest/globals';
import {
    isAnnouncementActive,
    parseModalOpenCommand,
    hasModalOpenCommand,
} from '@common/utils/announcementUtils';

import { gLang } from '@common/language';
jest.mock('@common/language', () => ({ gLang: jest.fn((key: string) => key) }));

describe('announcementUtils', () => {
    describe('parseModalOpenCommand', () => {
        it(gLang('spec.announcementParseOpen'), () => {
            expect(parseModalOpenCommand('$$$Open("myModal")$$$')).toBe('myModal');
        });
        it(gLang('spec.announcementNoMatch'), () => {
            expect(parseModalOpenCommand('no command')).toBeNull();
        });
    });

    describe('hasModalOpenCommand', () => {
        it(gLang('spec.announcementHasCommand'), () => {
            expect(hasModalOpenCommand('text $$$Open("x")$$$')).toBe(true);
        });
        it(gLang('spec.announcementNoCommand'), () => {
            expect(hasModalOpenCommand('plain text')).toBe(false);
        });
    });

    describe('isAnnouncementActive', () => {
        const now = Date.now();
        const past = new Date(now - 86400000).toISOString();
        const future = new Date(now + 86400000).toISOString();

        it(gLang('spec.announcementInRange'), () => {
            const ann = {
                id: 1,
                startTime: past,
                endTime: future,
                title: '',
                content: '',
                autoShow: false,
            };
            expect(isAnnouncementActive(ann as any)).toBe(true);
        });

        it(gLang('spec.announcementBeforeStart'), () => {
            const ann = {
                id: 1,
                startTime: future,
                endTime: new Date(now + 172800000).toISOString(),
                title: '',
                content: '',
                autoShow: false,
            };
            expect(isAnnouncementActive(ann as any)).toBe(false);
        });

        it(gLang('spec.announcementAfterEnd'), () => {
            const ann = {
                id: 1,
                startTime: new Date(now - 172800000).toISOString(),
                endTime: past,
                title: '',
                content: '',
                autoShow: false,
            };
            expect(isAnnouncementActive(ann as any)).toBe(false);
        });
    });
});
