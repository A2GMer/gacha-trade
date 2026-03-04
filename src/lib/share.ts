/**
 * X (Twitter) 共有ユーティリティ
 * ハッシュタグ・テキストテンプレートの管理
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
 */
export function generateItemShareText(params: ShareItemParams): string {
    const { itemName, condition, series, manufacturer, wantItem } = params;

    let text = `🎯【交換募集中】\n`;
    text += `「${itemName}」(${condition})\n`;

    if (wantItem) {
        text += `↔️ ${wantItem} と交換したい！\n`;
    } else {
        text += `交換してくれる方いませんか？\n`;
    }

    if (series) {
        text += `📦 ${series}`;
        if (manufacturer) text += ` / ${manufacturer}`;
        text += `\n`;
    }

    text += `\n`;

    return text;
}

/**
 * コレクション共有用のツイートテキスト
 */
export function generateCollectionShareText(userName: string, itemCount: number): string {
    return `🎰 ${userName}のスワコレコレクション（${itemCount}個）を公開中！\n交換できるアイテムがあるかチェックしてみて👀\n\n`;
}

/**
 * 取引完了共有テキスト
 */
export function generateTradeCompleteText(myItem: string, partnerItem: string): string {
    return `✅ スワコレで交換成立！\n「${myItem}」↔️「${partnerItem}」\nダブったアイテム、ここなら交換できるよ🎯\n\n`;
}

/**
 * 標準ハッシュタグ
 */
export function getHashtags(): string[] {
    return ["スワコレ", "アイテム交換", "推し活", "ダブり交換"];
}

/**
 * X Intent URL を生成
 */
export function buildXShareUrl(text: string, url?: string, hashtags?: string[]): string {
    const params = new URLSearchParams();
    params.set("text", text);
    if (url) params.set("url", url);
    if (hashtags && hashtags.length > 0) {
        params.set("hashtags", hashtags.join(","));
    }
    return `https://twitter.com/intent/tweet?${params.toString()}`;
}

/**
 * アイテムの共有URLを生成
 */
export function getItemShareUrl(itemId: string): string {
    return `${BASE_URL}/item/${itemId}`;
}

/**
 * ワンクリックでX共有を開く
 */
export function shareOnX(params: ShareItemParams): void {
    const text = generateItemShareText(params);
    const url = getItemShareUrl(params.itemId);
    const hashtags = getHashtags();
    const shareUrl = buildXShareUrl(text, url, hashtags);
    window.open(shareUrl, "_blank", "width=550,height=420");
}
