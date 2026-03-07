import { languageConfig as commonLanguageConfig } from '../../../frontend-common/language';
import { adminLanguageConfig } from './language.js';

type LanguageConfig = { [key: string]: string | string[] | LanguageConfig };

const privateLanguageModules = import.meta.glob('./language.private.ts', { eager: true }) as Record<
    string,
    { adminPrivateLanguageConfig?: LanguageConfig }
>;

const adminPrivateLanguageConfig =
    Object.values(privateLanguageModules)[0]?.adminPrivateLanguageConfig ?? {};

function deepMerge(base: LanguageConfig, override: LanguageConfig): LanguageConfig {
    const result = { ...base };
    for (const key of Object.keys(override)) {
        const baseVal = result[key];
        const overrideVal = override[key];
        if (
            overrideVal !== null &&
            typeof overrideVal === 'object' &&
            !Array.isArray(overrideVal) &&
            baseVal !== null &&
            typeof baseVal === 'object' &&
            !Array.isArray(baseVal)
        ) {
            (result as any)[key] = deepMerge(
                baseVal as LanguageConfig,
                overrideVal as LanguageConfig
            );
        } else {
            (result as any)[key] = overrideVal;
        }
    }
    return result;
}

const merged = deepMerge(
    deepMerge({ ...commonLanguageConfig } as LanguageConfig, adminLanguageConfig as LanguageConfig),
    adminPrivateLanguageConfig as LanguageConfig
);
// Promote adminMain to root so gLang('adminMain.*') resolves (adminMain lives under ticketMyAdmin in language.ts)
if ((merged as any).ticketMyAdmin?.adminMain) {
    (merged as any).adminMain = (merged as any).ticketMyAdmin.adminMain;
    delete (merged as any).ticketMyAdmin.adminMain;
}
const languageConfig = merged as Readonly<typeof commonLanguageConfig>;

export { languageConfig };

export const gLang = (path: string, params?: { [key: string]: string | number }): string => {
    const keys = path.split('.');
    let result: any = languageConfig;
    // Resolve adminMain from ticketMyAdmin.adminMain when not at root (language.ts nests it there)
    if (
        keys[0] === 'adminMain' &&
        result &&
        !(keys[0] in result) &&
        (result as any).ticketMyAdmin?.adminMain
    ) {
        result = (result as any).ticketMyAdmin.adminMain;
        keys.shift();
    }

    for (const key of keys) {
        if (result && typeof result === 'object' && key in result) {
            result = result[key];
        } else {
            return path;
        }
    }

    if (typeof result === 'string' && params) {
        for (const [paramKey, paramValue] of Object.entries(params)) {
            result = result.replace(new RegExp(`{${paramKey}}`, 'g'), String(paramValue));
        }
    }

    return typeof result === 'string' ? result : path;
};

export const getErrorMessage = (errorCode: number, defaultMessage?: string): string => {
    const staffAliasConfig = (languageConfig as any).staffAlias;
    const errorCodeMap = staffAliasConfig?.errorCode;
    if (errorCodeMap && typeof errorCodeMap === 'object' && errorCode in errorCodeMap) {
        const errorKey = errorCodeMap[errorCode];
        if (typeof errorKey === 'string') {
            const path = `staffAlias.message.${errorKey}`;
            const msg = gLang(path);
            return msg === path ? defaultMessage || String(errorCode) : msg;
        }
    }
    return defaultMessage || String(errorCode);
};
