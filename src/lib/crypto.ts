/**
 * 住所情報の暗号化ユーティリティ (AES-256-GCM)
 * Web Crypto API を使用
 * 
 * [SECURITY WARNING] 
 * 必ずサーバーサイド（Server Actions, API Routes, SSR）でのみ実行してください。
 * クライアントサイドのコンポーネントでインポートしないでください。
 */

// NEXT_PUBLIC_ を外し、サーバーサイドのみで参照可能な環境変数に変更
const ENCRYPTION_KEY = process.env.ENCRYPTION_KEY || "dummy-key-for-development-32bytes-long!!";

// 文字列をUint8Arrayに変換
const textEncoder = new TextEncoder();
const textDecoder = new TextDecoder();

/**
 * 鍵のインポート
 */
async function getCryptoKey(key: string) {
    const hash = await crypto.subtle.digest("SHA-256", textEncoder.encode(key));
    return crypto.subtle.importKey(
        "raw",
        hash,
        { name: "AES-GCM" },
        false,
        ["encrypt", "decrypt"]
    );
}

/**
 * 暗号化
 */
export async function encryptAddress(address: string) {
    const cryptoKey = await getCryptoKey(ENCRYPTION_KEY);
    const iv = crypto.getRandomValues(new Uint8Array(12)); // GCM推奨の12バイト

    const encrypted = await crypto.subtle.encrypt(
        { name: "AES-GCM", iv },
        cryptoKey,
        textEncoder.encode(address)
    );

    return {
        encryptedText: Buffer.from(encrypted).toString("base64"),
        iv: Buffer.from(iv).toString("base64"),
    };
}

/**
 * 復号化
 */
export async function decryptAddress(encryptedBase64: string, ivBase64: string) {
    try {
        const cryptoKey = await getCryptoKey(ENCRYPTION_KEY);
        const iv = Buffer.from(ivBase64, "base64");
        const encrypted = Buffer.from(encryptedBase64, "base64");

        const decrypted = await crypto.subtle.decrypt(
            { name: "AES-GCM", iv },
            cryptoKey,
            encrypted
        );

        return textDecoder.decode(decrypted);
    } catch (error) {
        console.error("Decryption failed:", error);
        return "復号エラー: 権限がないか鍵が正しくありません";
    }
}
