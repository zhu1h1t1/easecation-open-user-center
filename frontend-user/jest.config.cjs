/** Jest config for frontend-user. All test files must live under src/specs (see UNIT_TESTING_STANDARD.md). */
module.exports = {
    preset: 'ts-jest',
    testEnvironment: 'node',
    roots: ['<rootDir>/src'],
    testMatch: ['**/specs/**/*.spec.ts', '**/specs/**/*.spec.tsx'],
    moduleNameMapper: {
        '^@common/(.*)$': '<rootDir>/../frontend-common/$1',
        '^@shared/(.*)$': '<rootDir>/../shared/$1',
        '^@ecuc/shared$': '<rootDir>/../shared',
        '^@ecuc/shared/(.*)$': '<rootDir>/../shared/$1',
    },
};
