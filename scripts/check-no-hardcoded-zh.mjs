#!/usr/bin/env node
/**
 * CI script: detect hardcoded Chinese in frontend source (should use language.ts + gLang instead).
 * Uses TypeScript AST to avoid regex-based false positives/negatives.
 * Scans .ts/.tsx/.js/.jsx under frontend-user/src, frontend-admin/src, frontend-common.
 * Supports JSX text detection (strict mode enabled by default).
 * Usage: node scripts/check-no-hardcoded-zh.mjs
 * Exit: 0 if no violations, 1 otherwise (with message for modifier).
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const CHINESE_RE = /[\u4e00-\u9fff]/;
const EXTS = new Set(['.ts', '.tsx', '.js', '.jsx']);
const MAX_PRINT = Number(process.env.CHECK_NO_HARDCODED_ZH_MAX_PRINT || '200');
// Strict mode: also detect hardcoded Chinese in raw JSX text nodes.
// Default ON. Set CHECK_NO_HARDCODED_ZH_SCAN_JSX_TEXT=0 to disable.
const SCAN_JSX_TEXT = process.env.CHECK_NO_HARDCODED_ZH_SCAN_JSX_TEXT !== '0';

const SCAN_DIRS = [
    path.join(ROOT, 'frontend-user', 'src'),
    path.join(ROOT, 'frontend-admin', 'src'),
    path.join(ROOT, 'frontend-common'),
].filter(p => fs.existsSync(p));

// Use exact relative paths instead of filename-only exclusion.
const EXCLUDE_RELATIVE_FILES = new Set([
    'frontend-common/language.ts',
    'frontend-common/language.private.ts',
    'frontend-common/languageTrans.ts',
    'frontend-admin/src/language/language.ts',
    'frontend-admin/src/language/language.private.ts',
    'frontend-user/src/pages/annual-report/AnnualReport.tsx',
    'frontend-user/src/pages/annual-report/AnnualReportShare.tsx',
]);

function normalizeRel(filePath) {
    return path.relative(ROOT, filePath).split(path.sep).join('/');
}

function* walk(dir) {
    if (!fs.existsSync(dir)) return;
    const entries = fs.readdirSync(dir, { withFileTypes: true });
    for (const e of entries) {
        const full = path.join(dir, e.name);
        if (e.isDirectory()) {
            if (e.name !== 'node_modules' && e.name !== 'dist') yield* walk(full);
            continue;
        }

        const ext = path.extname(e.name);
        if (!EXTS.has(ext)) continue;

        const rel = normalizeRel(full);
        if (EXCLUDE_RELATIVE_FILES.has(rel)) continue;
        yield full;
    }
}

function cleanSnippet(text, max = 80) {
    const oneLine = text.replace(/\s+/g, ' ').trim();
    if (!oneLine) return '';
    return oneLine.length <= max ? oneLine : `${oneLine.slice(0, max)}...`;
}

function hasChinese(text) {
    return CHINESE_RE.test(text);
}

function getLine(sourceFile, node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function getScriptKind(filePath) {
    const ext = path.extname(filePath);
    if (ext === '.tsx') return ts.ScriptKind.TSX;
    if (ext === '.jsx') return ts.ScriptKind.JSX;
    if (ext === '.js') return ts.ScriptKind.JS;
    return ts.ScriptKind.TS;
}

function isImportLikeStringLiteral(node) {
    const p = node.parent;
    if (!p) return false;
    if (ts.isImportDeclaration(p) && p.moduleSpecifier === node) return true;
    if (ts.isExportDeclaration(p) && p.moduleSpecifier === node) return true;
    if (
        ts.isCallExpression(p) &&
        p.arguments.includes(node) &&
        ts.isIdentifier(p.expression) &&
        (p.expression.text === 'require' || p.expression.text === 'import')
    ) {
        return true;
    }
    return false;
}

function collectViolations(filePath) {
    const rel = normalizeRel(filePath);
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        getScriptKind(filePath)
    );
    const violations = [];

    function pushViolation(node, text) {
        if (!text || !hasChinese(text)) return;
        violations.push({
            file: rel,
            line: getLine(sourceFile, node),
            snippet: cleanSnippet(text),
            full: text,
        });
    }

    function visit(node) {
        // "中文"
        if (ts.isStringLiteral(node)) {
            if (!isImportLikeStringLiteral(node)) {
                pushViolation(node, node.text);
            }
            ts.forEachChild(node, visit);
            return;
        }

        // `中文`
        if (ts.isNoSubstitutionTemplateLiteral(node)) {
            pushViolation(node, node.text);
            ts.forEachChild(node, visit);
            return;
        }

        // `前缀${x}后缀`
        if (ts.isTemplateExpression(node)) {
            pushViolation(node, node.head.text);
            for (const span of node.templateSpans) {
                pushViolation(span.literal, span.literal.text);
            }
            ts.forEachChild(node, visit);
            return;
        }

        // <div>中文</div>
        if (SCAN_JSX_TEXT && ts.isJsxText(node)) {
            pushViolation(node, node.getText(sourceFile));
            ts.forEachChild(node, visit);
            return;
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return violations;
}

function main() {
    const all = [];

    for (const dir of SCAN_DIRS) {
        for (const file of walk(dir)) {
            const v = collectViolations(file);
            all.push(...v);
        }
    }

    all.sort((a, b) => {
        if (a.file !== b.file) return a.file.localeCompare(b.file);
        if (a.line !== b.line) return a.line - b.line;
        return a.snippet.localeCompare(b.snippet);
    });

    if (process.env.CHECK_NO_HARDCODED_ZH_JSON === '1') {
        console.log(JSON.stringify(all, null, 0));
        process.exit(all.length > 0 ? 1 : 0);
        return;
    }

    if (all.length === 0) {
        console.log('check-no-hardcoded-zh: OK, no hardcoded Chinese in frontend source.');
        process.exit(0);
        return;
    }

    console.error(
        'check-no-hardcoded-zh: Found hardcoded Chinese (use language.ts + gLang instead):\n'
    );
    const show = all.slice(0, Math.max(0, MAX_PRINT));
    for (const v of show) {
        console.error(`  ${v.file}:${v.line}`);
        console.error(`    snippet: ${v.snippet}\n`);
    }
    if (all.length > show.length) {
        console.error(
            `  ... and ${all.length - show.length} more violation(s) not shown (set CHECK_NO_HARDCODED_ZH_MAX_PRINT to adjust)\n`
        );
    }
    console.error(
        "Please move these strings to frontend-common/language.ts and use gLang('key') in code."
    );
    process.exit(1);
}

main();
