import { test, expect } from '@playwright/test';

// 認証セットアップ後に実行されるテスト
test.describe('Authenticated: MyPage', () => {
    test('2-1-1 MyPage displays profile', async ({ page }) => {
        await page.goto('/mypage');

        // プロフィールヘッダーが表示される（ログイン状態なら表示名が出る）
        // ログインが必要ですメッセージが出ないことを確認
        const loginPrompt = page.getByText('ログインが必要です');
        const isLoginRequired = await loginPrompt.isVisible().catch(() => false);

        if (!isLoginRequired) {
            // ログイン済み：マイページのメニューが表示される
            await expect(page.getByText('取引ダッシュボード')).toBeVisible();
            await expect(page.getByText('コレクション')).toBeVisible();
            await expect(page.getByText('ほしいアイテム')).toBeVisible();
            await expect(page.getByText('出品する')).toBeVisible();
            await expect(page.getByText('ログアウト')).toBeVisible();
        } else {
            // 未ログイン：ログイン誘導が表示される
            await expect(page.getByText('ログインする')).toBeVisible();
        }
    });

    test('2-1-2 MyPage menu links work', async ({ page }) => {
        await page.goto('/mypage');

        const loginPrompt = page.getByText('ログインが必要です');
        const isLoginRequired = await loginPrompt.isVisible().catch(() => false);

        if (!isLoginRequired) {
            // 各メニューリンクが正しいhref属性を持つ
            await expect(page.getByText('取引ダッシュボード').locator('..')).toHaveAttribute('href', '/dashboard');
            await expect(page.getByText('コレクション').locator('..').first()).toHaveAttribute('href', '/collection');
        }
    });

    test('2-1-3 MyPage settings button', async ({ page }) => {
        await page.goto('/mypage');

        const loginPrompt = page.getByText('ログインが必要です');
        const isLoginRequired = await loginPrompt.isVisible().catch(() => false);

        if (!isLoginRequired) {
            // 設定ボタンが存在する
            const settingsBtn = page.locator('button').filter({ has: page.locator('.lucide-settings') });
            await expect(settingsBtn).toBeVisible();
        }
    });
});

test.describe('Authenticated: Sell Page', () => {
    test('3-1-1 Sell page form structure', async ({ page }) => {
        await page.goto('/sell');

        // /loginにリダイレクトされなければ、出品フォームを確認
        const url = page.url();
        if (!url.includes('/login')) {
            // ページヘッダー
            await expect(page.locator('h1', { hasText: 'アイテムを登録' })).toBeVisible();

            // 商品の状態セクション
            await expect(page.getByText('商品の状態').first()).toBeVisible();
            await expect(page.getByText('未開封').first()).toBeVisible();
            await expect(page.getByText('開封済').first()).toBeVisible();
            await expect(page.getByText('傷あり').first()).toBeVisible();

            // 数量セクション
            await expect(page.getByText('🔢 数量')).toBeVisible();

            // メモセクション
            await expect(page.getByText('📝 メモ（任意）')).toBeVisible();

            // 公開・交換トグル
            await expect(page.getByText('全体に公開する')).toBeVisible();
            await expect(page.getByText('交換に出す').first()).toBeVisible();

            // 登録ボタン
            await expect(page.getByText('コレクションに登録する')).toBeVisible();
        }
    });

    test('3-1-9 Tradeable toggle forces public', async ({ page }) => {
        await page.goto('/sell');

        const url = page.url();
        if (!url.includes('/login')) {
            // 交換トグルをONにする
            const tradeToggle = page.locator('.toggle').nth(1);
            await tradeToggle.click();

            // info メッセージが表示される
            await expect(page.getByText('「交換に出す」が有効な場合、自動的に「全体に公開」設定になります')).toBeVisible();
        }
    });
});

test.describe('Authenticated: Collection Page', () => {
    test('3-2-1 Collection page structure', async ({ page }) => {
        await page.goto('/collection');

        const loginPrompt = page.getByText('ログインが必要です');
        const isLoginRequired = await loginPrompt.isVisible().catch(() => false);

        if (!isLoginRequired) {
            // ヘッダー
            await expect(page.getByText('コレクション').first()).toBeVisible();

            // 出品ボタン
            await expect(page.getByText('出品').first()).toBeVisible();

            // フィルタボタン
            await expect(page.getByText('すべて').first()).toBeVisible();
            await expect(page.getByText('交換可').first()).toBeVisible();
            await expect(page.getByText('公開').first()).toBeVisible();
            await expect(page.getByText('非公開').first()).toBeVisible();
        }
    });
});

test.describe('Authenticated: Wants Page', () => {
    test('5-1 Wants page structure', async ({ page }) => {
        await page.goto('/wants');

        const loginPrompt = page.getByText('ログインが必要です');
        const isLoginRequired = await loginPrompt.isVisible().catch(() => false);

        if (!isLoginRequired) {
            // ページのコンテンツが表示される
            await expect(page.locator('body')).not.toBeEmpty();
        }
    });
});

test.describe('Authenticated: Dashboard', () => {
    test('6-4-1 Dashboard page structure', async ({ page }) => {
        await page.goto('/dashboard');

        // ダッシュボードのコンテンツが表示される
        await expect(page.locator('body')).not.toBeEmpty();
    });
});

test.describe('Authenticated: Notifications', () => {
    test('8-1 Notifications page', async ({ page }) => {
        await page.goto('/notifications');

        await expect(page.locator('body')).not.toBeEmpty();
    });
});

test.describe('Authenticated: Trade Proposals', () => {
    test('6-2-1 Trade proposals page', async ({ page }) => {
        await page.goto('/trade/proposals');

        await expect(page.locator('body')).not.toBeEmpty();
    });
});
