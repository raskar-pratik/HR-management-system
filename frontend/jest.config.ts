export default {
    preset: 'ts-jest',
    testEnvironment: 'jest-environment-jsdom',
    testPathIgnorePatterns: ['/node_modules/', 'renderHelpers'],
    transform: {
        "^.+\\.tsx?$": ["ts-jest", {
            tsconfig: 'tsconfig.test.json'
        }]
    },
    moduleNameMapper: {
        '\\.(css|less|sass|scss)$': 'identity-obj-proxy',
        '\\.(gif|ttf|eot|svg|png)$': '<rootDir>/src/__mocks__/fileMock.ts'
    },
    setupFilesAfterEnv: ['<rootDir>/src/setupTests.ts'],
    collectCoverageFrom: [
        'src/**/*.{ts,tsx}',
        '!src/**/*.d.ts',
        '!src/main.tsx',
        '!src/vite-env.d.ts',
        '!src/__mocks__/**',
    ],
    coverageThreshold: {
        global: {
            branches: 50,
            functions: 50,
            lines: 50,
            statements: 50,
        },
    },
    coverageReporters: ['text', 'lcov', 'clover'],
};
