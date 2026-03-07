import { describe, expect, it } from '@jest/globals';
import { buildCsvContent, ensureCsvExtension } from '@common/utils/csvExport';

describe('csvExport util', () => {
    it('ensures csv extension', () => {
        expect(ensureCsvExtension('report.xlsx')).toBe('report.csv');
        expect(ensureCsvExtension('report.xls')).toBe('report.csv');
        expect(ensureCsvExtension('report')).toBe('report.csv');
        expect(ensureCsvExtension('report.csv')).toBe('report.csv');
    });

    it('escapes comma quote and newline', () => {
        const csv = buildCsvContent(['name', 'note'], [['a,b', 'line1\n"line2"']]);
        expect(csv).toContain('"a,b"');
        expect(csv).toContain('"line1\n""line2"""');
    });

    it('guards formula-like values', () => {
        const csv = buildCsvContent(['payload'], [['=1+1'], ['+cmd'], ['-x'], ['@x']]);
        expect(csv).toContain("'=1+1");
        expect(csv).toContain("'+cmd");
        expect(csv).toContain("'-x");
        expect(csv).toContain("'@x");
    });
});
