#!/usr/bin/env node
/**
 * Unified frontend i18n quality check:
 * 1) i18n key usage validation (gLang key exists)
 * 2) hardcoded Chinese scan (strict JSX text mode on by default)
 */

import path from 'path';
import { spawnSync } from 'child_process';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const checks = [
    {
        name: 'i18n key usage',
        script: path.join(ROOT, 'scripts', 'check-i18n.mjs'),
        env: {},
    },
    {
        name: 'hardcoded Chinese scan (strict JSX text)',
        script: path.join(ROOT, 'scripts', 'check-no-hardcoded-zh.mjs'),
        env: {
            CHECK_NO_HARDCODED_ZH_SCAN_JSX_TEXT:
                process.env.CHECK_NO_HARDCODED_ZH_SCAN_JSX_TEXT ?? '1',
        },
    },
];

const failed = [];

for (const check of checks) {
    console.log(`\n=== ${check.name} ===`);
    const result = spawnSync(process.execPath, [check.script], {
        cwd: ROOT,
        stdio: 'inherit',
        env: {
            ...process.env,
            ...check.env,
        },
    });

    if (result.error) {
        console.error(`Failed to run ${path.basename(check.script)}:`, result.error.message);
        failed.push(check.name);
        continue;
    }

    if (result.status !== 0) {
        failed.push(check.name);
    }
}

if (failed.length > 0) {
    console.error('\ncheck:i18n failed in:');
    for (const name of failed) {
        console.error(`- ${name}`);
    }
    process.exit(1);
}

console.log('\ncheck:i18n OK (i18n keys + hardcoded zh strict).');
