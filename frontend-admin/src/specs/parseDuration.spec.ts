/**
 * Unit tests for parseDuration util (duration string to hours).
 */
import { describe, expect, it } from '@jest/globals';
import { gLang } from '@common/language';
import { parseDuration } from '@common/utils/parseDuration';

describe('parseDuration', () => {
    it(gLang('spec.parseDurationEmpty'), () => {
        expect(parseDuration('')).toBe(0);
    });

    it(gLang('spec.parseDuration1h'), () => {
        expect(parseDuration('1h')).toBe(1);
    });

    it(gLang('spec.parseDuration2d'), () => {
        expect(parseDuration('2d')).toBe(48);
    });

    it(gLang('spec.parseDuration1m'), () => {
        expect(parseDuration('1m')).toBe(720);
    });

    it(gLang('spec.parseDuration1y'), () => {
        expect(parseDuration('1y')).toBe(8760);
    });

    it(gLang('spec.parseDurationHalfYear'), () => {
        expect(parseDuration(gLang('spec.parseDurationHalfYearLabel'))).toBe(180 * 24);
    });

    it(gLang('spec.parseDurationCombo'), () => {
        expect(parseDuration('1d2h')).toBe(26);
    });

    it(gLang('spec.parseDurationNumber'), () => {
        expect(parseDuration('24')).toBe(24);
    });
});
