/**
 * 郵便番号から住所を自動取得（zipcloud API）
 * https://zipcloud.ibsnet.co.jp/doc/api
 */
export interface PostalResult {
    prefecture: string;
    city: string;
    town: string;
}

export async function lookupPostalCode(postalCode: string): Promise<PostalResult | null> {
    const cleaned = postalCode.replace(/[^0-9]/g, "");
    if (cleaned.length !== 7) return null;

    try {
        const res = await fetch(`https://zipcloud.ibsnet.co.jp/api/search?zipcode=${cleaned}`);
        const data = await res.json();

        if (data.results && data.results.length > 0) {
            const r = data.results[0];
            return {
                prefecture: r.address1,
                city: r.address2,
                town: r.address3,
            };
        }
        return null;
    } catch {
        return null;
    }
}
