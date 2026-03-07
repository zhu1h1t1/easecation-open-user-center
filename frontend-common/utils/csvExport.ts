type CsvCell = string | number | boolean | null | undefined;

const CSV_FORMULA_PREFIX = /^[=+\-@]/;

function normalizeCell(value: CsvCell): string {
    if (value === null || value === undefined) return '';
    const raw = String(value);
    if (CSV_FORMULA_PREFIX.test(raw)) {
        return `'${raw}`;
    }
    return raw;
}

function escapeCell(value: CsvCell): string {
    const normalized = normalizeCell(value);
    if (/[",\n\r]/.test(normalized)) {
        return `"${normalized.replace(/"/g, '""')}"`;
    }
    return normalized;
}

export function buildCsvContent(headers: string[], rows: CsvCell[][]): string {
    const lines = [
        headers.map(escapeCell).join(','),
        ...rows.map(row => row.map(escapeCell).join(',')),
    ];
    return `\uFEFF${lines.join('\r\n')}`;
}

export function ensureCsvExtension(fileName: string): string {
    if (/\.csv$/i.test(fileName)) return fileName;
    if (/\.(xlsx|xls)$/i.test(fileName)) return fileName.replace(/\.(xlsx|xls)$/i, '.csv');
    return `${fileName}.csv`;
}
