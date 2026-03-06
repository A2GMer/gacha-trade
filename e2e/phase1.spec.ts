import { test, expect } from '@playwright/test';

test.describe('Phase 1: First Visit', () => {
    test('1-1 Top page', async ({ page }) => {
        await page.goto('/');

        // 1-1-1 トップページが正常に表示される
        // 1-1-2 サービス名が「スワコレ」と表示される
        await expect(page.getByText('スワコレ').first()).toBeVisible();

        // 1-1-3 ヘッダーのロゴが表示される
        const logo = page.locator('header img[alt*="スワコレ"]');
        await expect(logo).toBeVisible();

        // 1-1-4 「無料で始める」ボタンが表示され、クリックで遷移する
        const registerBtn = page.locator('main').locator('a', { hasText: '無料で始める' }).first();
        await expect(registerBtn).toBeVisible();
        await registerBtn.click();
        await expect(page).toHaveURL(/\/login\?tab=register/);
        await page.goBack();

        // 1-1-5 「探す」CTAが機能する
        const searchBtn = page.locator('main').locator('a', { hasText: '探す' }).first();
        await expect(searchBtn).toBeVisible();
        await searchBtn.click();
        await expect(page).toHaveURL(/\/search/);
        await page.goBack();

        // 1-1-6 フッターのリンクが全て遷移する
        const footerLinks = [
            { text: 'ヘルプ', url: '/help' },
            { text: '安全な取引ガイド', url: '/guide' },
            { text: '運営者情報', url: '/about' },
            { text: '利用規約', url: '/terms' },
            { text: 'プライバシーポリシー', url: '/privacy' },
            { text: '特定商取引法に基づく表記', url: '/tokushoho' },
        ];
        for (const link of footerLinks) {
            const el = page.locator('footer').locator('a', { hasText: link.text }).first();
            await expect(el).toBeVisible();
            await el.click();
            await expect(page).toHaveURL(new RegExp(link.url));
            await page.goBack();
        }
    });

    test('1-2 Static Pages', async ({ page }) => {
        // 1-2-5 ヘルプ
        await page.goto('/help');
        await expect(page.locator('h1', { hasText: 'ヘルプ・ガイド' })).toBeVisible();

        // 1-2-6 ガイド
        await page.goto('/guide');
        await expect(page.locator('h1', { hasText: '安全な取引ガイドライン' })).toBeVisible();
    });
});
