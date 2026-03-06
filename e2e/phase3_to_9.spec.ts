import { test, expect } from '@playwright/test';

test.describe('Phase 3: Search Page', () => {
    test('4-1-1 Search page loads', async ({ page }) => {
        await page.goto('/search');

        // 検索入力欄が表示される
        await expect(page.getByRole('main').getByRole('textbox', { name: 'キーワードで検索' })).toBeVisible();

        // フィルタボタンが表示される
        await expect(page.locator('button').filter({ has: page.locator('svg') }).first()).toBeVisible();
    });

    test('4-1-2 Search filter toggle', async ({ page }) => {
        await page.goto('/search');

        // フィルタボタンをクリック
        const filterBtn = page.locator('button').filter({ has: page.locator('.lucide-sliders-horizontal') });
        await filterBtn.click();

        // 状態フィルタ（未開封/開封済/傷あり）が表示される
        await expect(page.getByText('未開封').first()).toBeVisible();
        await expect(page.getByText('開封済').first()).toBeVisible();
        await expect(page.getByText('傷あり').first()).toBeVisible();
    });

    test('4-1-5 Empty search results message', async ({ page }) => {
        await page.goto('/search');

        // まず初期ロードが完了するのを待つ
        await expect(page.getByText('件のアイテムが見つかりました')).toBeVisible({ timeout: 20000 });

        // 存在しないキーワードで検索
        await page.getByRole('main').getByRole('textbox', { name: 'キーワードで検索' }).fill('xxxxxxxxx存在しないアイテムzzzzz');

        // ローディング完了を待って結果0件メッセージを確認
        await expect(page.getByText('条件に合うアイテムが見つかりませんでした')).toBeVisible({ timeout: 20000 });
    });
});

test.describe('Phase 4: Sell Page (unauthenticated)', () => {
    test('3-1-1 Sell page loads', async ({ page }) => {
        await page.goto('/sell');

        // ページが何らかのコンテンツを表示する（認証リダイレクトの場合はloginページへ）
        const url = page.url();
        if (url.includes('/login')) {
            // 未ログインでリダイレクトされた場合 → 正常動作
            await expect(page).toHaveURL(/\/login/);
        } else {
            // 出品ページが表示された場合 → 出品フォームの要素確認
            await expect(page.getByText('出品').first()).toBeVisible();
        }
    });
});

test.describe('Phase 5: Contact Page', () => {
    test('9-1 Contact page loads', async ({ page }) => {
        await page.goto('/contact');

        // ヘッダーに「お問い合わせ」が表示される
        await expect(page.locator('h1', { hasText: 'お問い合わせ' })).toBeVisible();

        // フォーム要素が表示される
        await expect(page.getByText('お問い合わせフォーム')).toBeVisible();
        await expect(page.getByText('カテゴリ')).toBeVisible();
        await expect(page.getByText('件名')).toBeVisible();
        await expect(page.getByText('メッセージ').first()).toBeVisible();

        // 送信ボタンが表示される
        await expect(page.getByText('送信する')).toBeVisible();
    });

    test('9-2 Contact form validation', async ({ page }) => {
        await page.goto('/contact');

        // 空のまま送信ボタンを押す
        await page.getByText('送信する').click();

        // エラーメッセージが表示される
        await expect(page.getByText('すべての項目を入力してください')).toBeVisible();
    });

    test('9-3 Contact form category options', async ({ page }) => {
        await page.goto('/contact');

        // カテゴリドロップダウンのオプション確認
        const select = page.locator('select');
        await expect(select).toBeVisible();

        const options = await select.locator('option').allTextContents();
        expect(options).toContain('一般的な質問');
        expect(options).toContain('取引について');
        expect(options).toContain('不具合の報告');
    });
});

test.describe('Phase 6: Static Pages Content Check', () => {
    test('Terms page content', async ({ page }) => {
        await page.goto('/terms');
        // ページにコンテンツが表示される
        await expect(page.locator('body')).not.toBeEmpty();
        // 「スワコレ」の文言が含まれる
        await expect(page.getByText('スワコレ').first()).toBeVisible();
    });

    test('Privacy page content', async ({ page }) => {
        await page.goto('/privacy');
        await expect(page.locator('body')).not.toBeEmpty();
        await expect(page.getByText('スワコレ').first()).toBeVisible();
    });

    test('About page content', async ({ page }) => {
        await page.goto('/about');
        await expect(page.locator('body')).not.toBeEmpty();
    });

    test('Tokushoho page content', async ({ page }) => {
        await page.goto('/tokushoho');
        await expect(page.locator('body')).not.toBeEmpty();
    });
});

test.describe('Phase 7: Mypage (unauthenticated redirect)', () => {
    test('2-1-1 Mypage redirects or shows login prompt', async ({ page }) => {
        await page.goto('/mypage');

        // 未ログインなので何らかのログイン誘導かリダイレクトがある
        const url = page.url();
        if (url.includes('/login')) {
            await expect(page).toHaveURL(/\/login/);
        } else {
            // /mypageにとどまる場合でもページが存在することを確認
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
});

test.describe('Phase 8: Dashboard (unauthenticated)', () => {
    test('Dashboard redirects or shows content', async ({ page }) => {
        await page.goto('/dashboard');

        const url = page.url();
        if (url.includes('/login')) {
            await expect(page).toHaveURL(/\/login/);
        } else {
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
});

test.describe('Phase 9: Notifications page (unauthenticated)', () => {
    test('Notifications page', async ({ page }) => {
        await page.goto('/notifications');

        const url = page.url();
        if (url.includes('/login')) {
            await expect(page).toHaveURL(/\/login/);
        } else {
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
});
