#!/usr/bin/env node
/**
 * CI script: detect Ant Design message/Modal static API in frontend (not dark-mode safe).
 * - Forbidden: message.success|error|info|warning|loading → use message.useMessage() + messageApi
 * - Forbidden: Modal.confirm|info|success|error|warning → use controlled <Modal open={} /> or App.useApp().modal
 * Scans .ts/.tsx under frontend-user/src, frontend-admin/src, frontend-common.
 * Usage: node scripts/check-dark-mode-api.mjs
 * Exit: 0 if no violations, 1 otherwise.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MESSAGE_STATIC_RE = /\bmessage\.(success|error|info|warning|loading)\s*\(/;
const MODAL_STATIC_RE = /\bModal\.(confirm|info|success|error|warning)\s*\(/;

const SCAN_DIRS = [
    path.join(ROOT, 'frontend-user', 'src'),
    path.join(ROOT, 'frontend-admin', 'src'),
    path.join(ROOT, 'frontend-common'),
].filter(p => fs.existsSync(p));

function* walk(dir, ext) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name !== 'node_modules' && e.name !== 'dist') yield* walk(full, ext);
        } else if (ext.some(s => e.name.endsWith(s))) {
            yield full;
        }
    }
}

/** Strip // comment (to EOL) when not inside string. */
function stripLineComment(line) {
    let inDouble = false;
    let inSingle = false;
    let inTemplate = false;
    let i = 0;
    while (i < line.length) {
        const c = line[i];
        const next = line[i + 1];
        if (!inDouble && !inSingle && !inTemplate) {
            if (c === '/' && next === '/') return line.slice(0, i).trimEnd();
            if (c === '"') inDouble = true;
            else if (c === "'") inSingle = true;
            else if (c === '`') inTemplate = true;
        } else if (inDouble) {
            if (c === '\\') i += 1;
            else if (c === '"') inDouble = false;
        } else if (inSingle) {
            if (c === '\\') i += 1;
            else if (c === "'") inSingle = false;
        } else if (inTemplate) {
            if (c === '\\') i += 1;
            else if (c === '`') inTemplate = false;
        }
        i += 1;
    }
    return line;
}

function collectViolations(filePath) {
    const rel = path.relative(ROOT, filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const lines = content.split(/\r?\n/);
    const violations = [];

    for (let i = 0; i < lines.length; i++) {
        const line = stripLineComment(lines[i]);
        const lineNum = i + 1;

        if (MESSAGE_STATIC_RE.test(line)) {
            violations.push({
                file: rel,
                line: lineNum,
                type: 'message',
                hint: 'Use message.useMessage() and messageApi.success/error/... (dark mode).',
            });
        }
        if (MODAL_STATIC_RE.test(line)) {
            violations.push({
                file: rel,
                line: lineNum,
                type: 'modal',
                hint: 'Use controlled <Modal open={} /> or App.useApp().modal (dark mode).',
            });
        }
    }

    return violations;
}

function main() {
    const exts = ['.ts', '.tsx'];
    const all = [];

    for (const dir of SCAN_DIRS) {
        for (const file of walk(dir, exts)) {
            const v = collectViolations(file);
            all.push(...v);
        }
    }

    const byMessage = all.filter(x => x.type === 'message');
    const byModal = all.filter(x => x.type === 'modal');

    if (byMessage.length === 0 && byModal.length === 0) {
        console.log('check-dark-mode-api: OK, no forbidden message/Modal static API in frontend.');
        process.exit(0);
        return;
    }

    console.error('check-dark-mode-api: Found Ant Design static API not adapted for dark mode:\n');

    if (byMessage.length > 0) {
        console.error(
            '  [message] Use message.useMessage() + messageApi instead of message.success/error/...\n'
        );
        for (const v of byMessage) {
            console.error(`    ${v.file}:${v.line}`);
        }
        console.error('');
    }

    if (byModal.length > 0) {
        console.error(
            '  [modal] Use controlled <Modal open={} /> or App.useApp().modal instead of Modal.confirm/info/...\n'
        );
        for (const v of byModal) {
            console.error(`    ${v.file}:${v.line}`);
        }
    }

    console.error(
        '\nSee .agents/frontend-components.instructions.md and docs/DEVELOPMENT_STANDARDS.md for correct usage.'
    );
    process.exit(1);
}

main();
