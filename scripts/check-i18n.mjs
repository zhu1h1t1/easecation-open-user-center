#!/usr/bin/env node
/**
 * CI script: check i18n key usage for gLang().
 * - Parse language objects via TypeScript AST (supports nested keys, e.g. a.b.c).
 * - Parse gLang(...) usages via TypeScript AST to avoid matching comments/strings.
 * - Validate:
 *   1) exact keys: gLang('x.y.z')
 *   2) dynamic patterns: gLang(`x.${id}.z`) / gLang('x.' + id)
 * - Exit 0 when no issues, otherwise 1.
 */

import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';
import ts from 'typescript';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const COMMON_LANGUAGE_FILE = path.join(ROOT, 'frontend-common', 'language.ts');
const COMMON_PRIVATE_LANGUAGE_FILE = path.join(ROOT, 'frontend-common', 'language.private.ts');
const ADMIN_LANGUAGE_FILE = path.join(ROOT, 'frontend-admin', 'src', 'language', 'language.ts');
const ADMIN_PRIVATE_LANGUAGE_FILE = path.join(
    ROOT,
    'frontend-admin',
    'src',
    'language',
    'language.private.ts'
);

const EXTENSIONS = new Set(['.ts', '.tsx', '.js', '.jsx']);

function exists(filePath) {
    return fs.existsSync(filePath);
}

function toRelative(filePath) {
    return path.relative(ROOT, filePath);
}

function escapeRegex(input) {
    return input.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function getPropertyName(node) {
    if (!node) return null;
    if (ts.isIdentifier(node) || ts.isStringLiteral(node) || ts.isNumericLiteral(node)) {
        return node.text;
    }
    if (ts.isComputedPropertyName(node)) {
        const expr = node.expression;
        if (
            ts.isStringLiteral(expr) ||
            ts.isNoSubstitutionTemplateLiteral(expr) ||
            ts.isNumericLiteral(expr)
        ) {
            return expr.text;
        }
    }
    return null;
}

function unwrapExpression(expr) {
    let current = expr;
    while (true) {
        if (ts.isParenthesizedExpression(current)) {
            current = current.expression;
            continue;
        }
        if (
            ts.isAsExpression(current) ||
            ts.isTypeAssertionExpression(current) ||
            ts.isSatisfiesExpression(current)
        ) {
            current = current.expression;
            continue;
        }
        return current;
    }
}

function looksLikeDynamicObject(expr) {
    return (
        ts.isIdentifier(expr) ||
        ts.isPropertyAccessExpression(expr) ||
        ts.isElementAccessExpression(expr) ||
        ts.isCallExpression(expr)
    );
}

function flattenObjectLiteral(node, prefix, exactKeys, wildcardPrefixes) {
    for (const prop of node.properties) {
        if (ts.isPropertyAssignment(prop)) {
            const name = getPropertyName(prop.name);
            if (!name) continue;
            const fullKey = prefix ? `${prefix}.${name}` : name;
            const initializer = unwrapExpression(prop.initializer);
            if (ts.isObjectLiteralExpression(initializer)) {
                flattenObjectLiteral(initializer, fullKey, exactKeys, wildcardPrefixes);
            } else if (looksLikeDynamicObject(initializer)) {
                wildcardPrefixes.add(fullKey);
            } else {
                exactKeys.add(fullKey);
            }
            continue;
        }

        if (ts.isShorthandPropertyAssignment(prop)) {
            const name = prop.name.text;
            const fullKey = prefix ? `${prefix}.${name}` : name;
            wildcardPrefixes.add(fullKey);
            continue;
        }
    }
}

function getExportedObjectLiteral(filePath, exportName) {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TS
    );

    for (const stmt of sourceFile.statements) {
        if (!ts.isVariableStatement(stmt)) continue;
        const isExported = stmt.modifiers?.some(m => m.kind === ts.SyntaxKind.ExportKeyword);
        if (!isExported) continue;

        for (const decl of stmt.declarationList.declarations) {
            if (!ts.isIdentifier(decl.name) || decl.name.text !== exportName || !decl.initializer)
                continue;
            const initializer = unwrapExpression(decl.initializer);
            if (ts.isObjectLiteralExpression(initializer)) {
                return initializer;
            }
        }
    }

    return null;
}

function extractLanguageKeys(filePath, exportName) {
    const exactKeys = new Set();
    const wildcardPrefixes = new Set();
    if (!exists(filePath)) return { exactKeys, wildcardPrefixes };

    const objectLiteral = getExportedObjectLiteral(filePath, exportName);
    if (!objectLiteral) return { exactKeys, wildcardPrefixes };

    flattenObjectLiteral(objectLiteral, '', exactKeys, wildcardPrefixes);
    return { exactKeys, wildcardPrefixes };
}

function mergeKeyCollections(collections) {
    return {
        exactKeys: new Set(collections.flatMap(item => Array.from(item.exactKeys))),
        wildcardPrefixes: new Set(collections.flatMap(item => Array.from(item.wildcardPrefixes))),
    };
}

function getAdminLanguageKeys() {
    const mergedKeys = mergeKeyCollections([
        extractLanguageKeys(COMMON_LANGUAGE_FILE, 'languageConfig'),
        extractLanguageKeys(COMMON_PRIVATE_LANGUAGE_FILE, 'languageConfig'),
        extractLanguageKeys(ADMIN_LANGUAGE_FILE, 'adminLanguageConfig'),
        extractLanguageKeys(ADMIN_PRIVATE_LANGUAGE_FILE, 'adminPrivateLanguageConfig'),
    ]);
    const exactKeys = new Set(mergedKeys.exactKeys);
    const wildcardPrefixes = new Set(mergedKeys.wildcardPrefixes);

    // frontend-admin/src/language/index.ts promotes ticketMyAdmin.adminMain.* -> adminMain.*
    for (const key of exactKeys) {
        const prefix = 'ticketMyAdmin.adminMain.';
        if (key.startsWith(prefix)) {
            exactKeys.add(`adminMain.${key.slice(prefix.length)}`);
        }
    }
    for (const prefix of wildcardPrefixes) {
        const sourcePrefix = 'ticketMyAdmin.adminMain.';
        if (prefix.startsWith(sourcePrefix)) {
            wildcardPrefixes.add(`adminMain.${prefix.slice(sourcePrefix.length)}`);
        }
    }

    return { exactKeys, wildcardPrefixes };
}

function getUserLanguageKeys() {
    return mergeKeyCollections([
        extractLanguageKeys(COMMON_LANGUAGE_FILE, 'languageConfig'),
        extractLanguageKeys(COMMON_PRIVATE_LANGUAGE_FILE, 'languageConfig'),
    ]);
}

function* walkFiles(dirPath) {
    if (!exists(dirPath)) return;

    const entries = fs.readdirSync(dirPath, { withFileTypes: true });
    for (const entry of entries) {
        const fullPath = path.join(dirPath, entry.name);
        if (entry.isDirectory()) {
            if (entry.name === 'node_modules' || entry.name === 'dist') continue;
            yield* walkFiles(fullPath);
            continue;
        }

        const ext = path.extname(entry.name);
        if (EXTENSIONS.has(ext)) {
            yield fullPath;
        }
    }
}

function expressionToTokens(expr) {
    if (ts.isParenthesizedExpression(expr)) {
        return expressionToTokens(expr.expression);
    }

    if (ts.isStringLiteral(expr) || ts.isNoSubstitutionTemplateLiteral(expr)) {
        return [{ kind: 'text', value: expr.text }];
    }

    if (ts.isTemplateExpression(expr)) {
        const tokens = [];
        if (expr.head.text) {
            tokens.push({ kind: 'text', value: expr.head.text });
        }
        for (const span of expr.templateSpans) {
            tokens.push({ kind: 'wildcard' });
            if (span.literal.text) {
                tokens.push({ kind: 'text', value: span.literal.text });
            }
        }
        return tokens;
    }

    if (ts.isBinaryExpression(expr) && expr.operatorToken.kind === ts.SyntaxKind.PlusToken) {
        const left = expressionToTokens(expr.left);
        const right = expressionToTokens(expr.right);
        if (!left || !right) return null;
        return [...left, ...right];
    }

    return null;
}

function tokensToMatcher(tokens) {
    if (!tokens || tokens.length === 0) return null;

    const merged = [];
    for (const token of tokens) {
        const last = merged[merged.length - 1];
        if (token.kind === 'text' && last?.kind === 'text') {
            last.value += token.value;
        } else {
            merged.push({ ...token });
        }
    }

    const hasWildcard = merged.some(t => t.kind === 'wildcard');
    const textOnly = merged.every(t => t.kind === 'text');

    if (textOnly) {
        const value = merged.map(t => t.value).join('');
        return { type: 'exact', value };
    }

    if (!hasWildcard) return null;

    let pattern = '^';
    let display = '';
    for (const token of merged) {
        if (token.kind === 'wildcard') {
            pattern += '.*';
            display += '*';
        } else {
            pattern += escapeRegex(token.value);
            display += token.value;
        }
    }
    pattern += '$';

    return {
        type: 'pattern',
        value: display || '*',
        regex: new RegExp(pattern),
    };
}

function getLineNumber(sourceFile, node) {
    return sourceFile.getLineAndCharacterOfPosition(node.getStart(sourceFile)).line + 1;
}

function collectGLangUsagesInFile(filePath) {
    const content = fs.readFileSync(filePath, 'utf8');
    const sourceFile = ts.createSourceFile(
        filePath,
        content,
        ts.ScriptTarget.Latest,
        true,
        ts.ScriptKind.TSX
    );

    const usages = [];

    function visit(node) {
        if (
            ts.isCallExpression(node) &&
            ts.isIdentifier(node.expression) &&
            node.expression.text === 'gLang' &&
            node.arguments.length > 0
        ) {
            const arg = node.arguments[0];
            const line = getLineNumber(sourceFile, arg);
            const tokens = expressionToTokens(arg);
            const matcher = tokensToMatcher(tokens);

            if (!matcher) {
                usages.push({
                    type: 'dynamic',
                    file: toRelative(filePath),
                    line,
                    text: arg.getText(sourceFile),
                });
            } else {
                usages.push({
                    ...matcher,
                    file: toRelative(filePath),
                    line,
                });
            }
        }

        ts.forEachChild(node, visit);
    }

    visit(sourceFile);
    return usages;
}

function collectGLangUsages(dirs) {
    const allUsages = [];
    for (const dirPath of dirs) {
        if (!exists(dirPath)) continue;
        for (const filePath of walkFiles(dirPath)) {
            allUsages.push(...collectGLangUsagesInFile(filePath));
        }
    }
    return allUsages;
}

function checkUsages(panelName, languageKeys, sourceDirs) {
    const usages = collectGLangUsages(sourceDirs);
    const exactKeyList = Array.from(languageKeys.exactKeys);
    const wildcardPrefixList = Array.from(languageKeys.wildcardPrefixes);

    function hasKey(key) {
        if (languageKeys.exactKeys.has(key)) return true;
        return wildcardPrefixList.some(prefix => key === prefix || key.startsWith(`${prefix}.`));
    }

    function matchesPattern(regex) {
        if (exactKeyList.some(key => regex.test(key))) return true;
        return wildcardPrefixList.some(
            prefix => regex.test(`${prefix}.__DYNAMIC__`) || regex.test(prefix)
        );
    }

    const missingExact = new Map();
    const missingPattern = new Map();
    const dynamicUnresolved = new Map();

    for (const usage of usages) {
        if (usage.type === 'exact') {
            if (!hasKey(usage.value) && !missingExact.has(usage.value)) {
                missingExact.set(usage.value, usage);
            }
            continue;
        }

        if (usage.type === 'pattern') {
            const matched = matchesPattern(usage.regex);
            if (!matched && !missingPattern.has(usage.value)) {
                missingPattern.set(usage.value, usage);
            }
            continue;
        }

        if (!dynamicUnresolved.has(usage.text)) {
            dynamicUnresolved.set(usage.text, usage);
        }
    }

    console.log(`Checking ${panelName}:`);

    if (missingExact.size === 0 && missingPattern.size === 0) {
        console.log('  OK: no undefined i18n keys found.');
    } else {
        if (missingExact.size > 0) {
            console.log(`  Undefined exact keys (${missingExact.size}):`);
            for (const [key, usage] of missingExact) {
                console.log(`    - ${key} (${usage.file}:${usage.line})`);
            }
        }

        if (missingPattern.size > 0) {
            console.log(`  Undefined dynamic key patterns (${missingPattern.size}):`);
            for (const [pattern, usage] of missingPattern) {
                console.log(`    - ${pattern} (${usage.file}:${usage.line})`);
            }
        }
    }

    if (dynamicUnresolved.size > 0) {
        console.log(
            `  Note: ${dynamicUnresolved.size} dynamic gLang(...) call(s) could not be statically validated.`
        );
    }

    return {
        missingExact,
        missingPattern,
        dynamicUnresolved,
    };
}

function main() {
    if (!exists(COMMON_LANGUAGE_FILE)) {
        console.error(`i18n check failed: missing file ${toRelative(COMMON_LANGUAGE_FILE)}`);
        process.exit(1);
    }
    if (!exists(ADMIN_LANGUAGE_FILE)) {
        console.error(`i18n check failed: missing file ${toRelative(ADMIN_LANGUAGE_FILE)}`);
        process.exit(1);
    }

    console.log('=== I18n Key Check ===\n');

    const adminKeys = getAdminLanguageKeys();
    const userKeys = getUserLanguageKeys();

    const adminResult = checkUsages('Admin Panel', adminKeys, [
        path.join(ROOT, 'frontend-admin', 'src'),
        path.join(ROOT, 'frontend-common'),
    ]);
    console.log('');
    const userResult = checkUsages('User Panel', userKeys, [
        path.join(ROOT, 'frontend-user', 'src'),
        path.join(ROOT, 'frontend-common'),
    ]);

    const issueCount =
        adminResult.missingExact.size +
        adminResult.missingPattern.size +
        userResult.missingExact.size +
        userResult.missingPattern.size;

    if (issueCount === 0) {
        console.log('\ncheck:i18n OK');
        process.exit(0);
    }

    console.error(`\ncheck:i18n failed: found ${issueCount} undefined i18n key issue(s).`);
    process.exit(1);
}

main();
