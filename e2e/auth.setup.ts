import { test as setup, expect } from '@playwright/test';

const AUTH_FILE = 'e2e/.auth/user.json';

setup('authenticate', async ({ page }) => {
    // ログインページにアクセス
    await page.goto('/login');

    // メールアドレスとパスワードを入力
    await page.locator('input[type="email"]').fill(process.env.E2E_EMAIL || 'test@example.com');
    await page.locator('input[type="password"]').fill(process.env.E2E_PASSWORD || 'testpassword123');

    // ログインボタンを押す
    await page.locator('button[type="submit"]').click();

    // ダッシュボードへの遷移を待つ
    await page.waitForURL('**/dashboard', { timeout: 15000 });

    // セッション情報を保存
    await page.context().storageState({ path: AUTH_FILE });
});
