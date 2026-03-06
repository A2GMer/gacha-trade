import { defineConfig, devices } from '@playwright/test';

export default defineConfig({
    testDir: './e2e',
    fullyParallel: true,
    forbidOnly: !!process.env.CI,
    retries: process.env.CI ? 2 : 0,
    workers: process.env.CI ? 1 : undefined,
    reporter: 'html',
    expect: {
        timeout: 15000,
    },
    use: {
        baseURL: 'http://localhost:3001',
        trace: 'on-first-retry',
    },
    projects: [
        // 認証セットアップ
        {
            name: 'setup',
            testMatch: /auth\.setup\.ts/,
        },
        // 未認証テスト（Phase1〜9）
        {
            name: 'chromium',
            use: { ...devices['Desktop Chrome'] },
            testIgnore: /auth\.setup\.ts|authenticated\.spec\.ts/,
        },
        // 認証済みテスト
        {
            name: 'authenticated',
            use: {
                ...devices['Desktop Chrome'],
                storageState: 'e2e/.auth/user.json',
            },
            testMatch: /authenticated\.spec\.ts/,
            dependencies: ['setup'],
        },
    ],
    webServer: {
        command: 'npm run dev -- -p 3001',
        url: 'http://localhost:3001',
        reuseExistingServer: !process.env.CI,
        timeout: 60000,
    },
});
