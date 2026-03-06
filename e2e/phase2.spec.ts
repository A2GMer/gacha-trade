import { test, expect } from '@playwright/test';

test.describe('Phase 2: Login Page', () => {
    test('2-1 Login page structure', async ({ page }) => {
        await page.goto('/login');

        // ロゴが表示される（ページ本体のロゴを対象にする）
        const logo = page.getByRole('main').getByRole('img', { name: 'スワコレ' });
        await expect(logo).toBeVisible();

        // ログイン/新規登録タブが表示される
        await expect(page.getByText('ログイン').first()).toBeVisible();
        await expect(page.getByText('新規登録').first()).toBeVisible();

        // メールアドレスとパスワードの入力欄が表示される
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // ログインsubmitボタンが表示される
        await expect(page.locator('button[type="submit"]')).toBeVisible();
    });

    test('2-2 New registration tab', async ({ page }) => {
        await page.goto('/login');

        // 新規登録タブをクリック
        await page.getByText('新規登録').first().click();

        // 表示名フィールドが表示される
        await expect(page.locator('input[placeholder="ニックネーム"]')).toBeVisible();

        // メールアドレスとパスワードの入力欄が表示される
        await expect(page.locator('input[type="email"]')).toBeVisible();
        await expect(page.locator('input[type="password"]')).toBeVisible();

        // アカウント作成ボタンが表示される
        await expect(page.getByRole('button', { name: 'アカウントを作成' })).toBeVisible();
    });

    test('2-3 Login validation - empty fields', async ({ page }) => {
        await page.goto('/login');

        // 空の状態でログインsubmitボタンを押すとHTML5バリデーションが発動する
        await page.locator('button[type="submit"]').click();

        // ページが遷移していないことを確認
        await expect(page).toHaveURL(/\/login/);
    });

    test('2-4 Registration validation - missing display name', async ({ page }) => {
        await page.goto('/login');

        // 新規登録タブをクリック
        await page.getByText('新規登録').first().click();

        // メールとパスワードだけ入力
        await page.locator('input[type="email"]').fill('test@example.com');
        await page.locator('input[type="password"]').fill('password123');

        // アカウント作成を押す
        await page.getByRole('button', { name: 'アカウントを作成' }).click();

        // 「表示名を入力してください」エラーが表示される
        await expect(page.getByText('表示名を入力してください')).toBeVisible();
    });

    test('2-5 Password visibility toggle', async ({ page }) => {
        await page.goto('/login');

        const passwordInput = page.locator('input[placeholder="8文字以上"]');
        await passwordInput.fill('mypassword');

        // 初期状態はtype=password
        await expect(passwordInput).toHaveAttribute('type', 'password');

        // パスワード表示トグルボタン（パスワード入力欄の親divの中にあるbutton）
        const toggleBtn = page.locator('input[placeholder="8文字以上"]').locator('..').locator('button');
        await toggleBtn.click();

        // type=textに変わること
        await expect(passwordInput).toHaveAttribute('type', 'text');
    });

    test('2-6 Trust message visible', async ({ page }) => {
        await page.goto('/login');

        // 安心・安全メッセージが表示される
        await expect(page.getByText('安心・安全な交換のために')).toBeVisible();
    });
});
