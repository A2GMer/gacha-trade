/**
 * X (Twitter) 共有ユーティリティ
 * X上の交換文化（譲：/求：フォーマット）に準拠
 */

const BASE_URL = process.env.NEXT_PUBLIC_BASE_URL || "https://swacole.vercel.app";

interface ShareItemParams {
    itemName: string;
    condition: string;
    series?: string;
    manufacturer?: string;
    itemId: string;
    wantItem?: string; // 欲しいアイテム名
}

/**
 * アイテム共有用のツイートテキストを生成
 * X上の「譲：◯◯ 求：△△」文化に合わせたフォーマット
 */
export function generateItemShareText(params: ShareItemParams): string {
    const { itemName, condition, series, wantItem } = params;

    let text = `譲）${itemName}（${condition}）\n`;

    if (wantItem) {
        text += `求）${wantItem}\n`;
    } else {
        text += `求）お気軽にご提案ください\n`;
    }

    if (series) {
        text += `\n📦 ${series}\n`;
    }

    text += `\nスワコレで安全に交換できます 👇`;

    return text;
}

/**
 * コレクション共有用のツイートテキスト
 */
export function generateCollectionShareText(userName: string, itemCount: number): string {
    return `${userName}のコレクション（${itemCount}個）を公開中！\n交換できるアイテムがあるかチェックしてみてください👀\n\nスワコレで安全に交換 👇`;
}

/**
 * 取引完了共有テキスト
 */
export function generateTradeCompleteText(myItem: string, partnerItem: string): string {
    return `スワコレで交換が成立しました！\n\n譲）${myItem}\n求）${partnerItem}\n\nDM不要で安全に交換できるサービスです 👇`;
}

/**
 * WANTリスト共有テキスト
 */
export function generateWantShareText(wantItemName: string, series?: string): string {
    let text = `求）${wantItemName}\n`;
    if (series) {
        text += `📦 ${series}\n`;
    }
    text += `\n交換してくれる方いませんか？\nスワコレで安全に交換 👇`;
    return text;
}

/**
 * X Intent URL を生成（ハッシュタグなし）
 */
export function buildXShareUrl(text: string, url?: string): string {
    const params = new URLSearchParams();
    params.set("text", text);
    if (url) params.set("url", url);
    return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * アイテムの共有URLを生成（UTMパラメータ付き）
 */
export function getItemShareUrl(itemId: string): string {
    return `${BASE_URL}/item/${itemId}?utm_source=x&utm_medium=share&utm_campaign=item`;
}

/**
 * ユーザーページの共有URLを生成
 */
export function getUserShareUrl(userId: string): string {
    return `${BASE_URL}/user/${userId}?utm_source=x&utm_medium=share&utm_campaign=collection`;
}

/**
 * WANTリストの共有URLを生成
 */
export function getWantShareUrl(userId: string): string {
    return `${BASE_URL}/user/${userId}?tab=wants&utm_source=x&utm_medium=share&utm_campaign=want`;
}

/**
 * ワンクリックでX共有を開く（アイテム用）
 */
export function shareOnX(params: ShareItemParams): void {
    const text = generateItemShareText(params);
    const url = getItemShareUrl(params.itemId);
    const shareUrl = buildXShareUrl(text, url);
    window.open(shareUrl, "_blank", "width=550,height=420");
}

/**
 * ワンクリックでX共有を開く（取引完了用）
 */
export function shareTradeCompleteOnX(myItem: string, partnerItem: string, tradeId: string): void {
    const text = generateTradeCompleteText(myItem, partnerItem);
    const url = `${BASE_URL}/trade/${tradeId}?utm_source=x&utm_medium=share&utm_campaign=trade_complete`;
    const shareUrl = buildXShareUrl(text, url);
    window.open(shareUrl, "_blank", "width=550,height=420");
}

/**
 * ワンクリックでX共有を開く（WANTリスト用）
 */
export function shareWantOnX(wantItemName: string, series: string | undefined, userId: string): void {
    const text = generateWantShareText(wantItemName, series);
    const url = getWantShareUrl(userId);
    const shareUrl = buildXShareUrl(text, url);
    window.open(shareUrl, "_blank", "width=550,height=420");
}
