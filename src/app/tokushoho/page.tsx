import { ChevronLeft } from "lucide-react";
import Link from "next/link";
import type { Metadata } from "next";

const SITE_NAME = process.env.NEXT_PUBLIC_APP_NAME || "スワコレ";

export const metadata: Metadata = {
    title: `特定商取引法に基づく表記 | ${SITE_NAME}`,
    description: `${SITE_NAME}（スワコレ）の特定商取引に関する法律に基づく表記です。`,
};

export default function TokushohoPage() {
    return (
        <div className="bg-background min-h-screen">
            <div className="bg-white/80 backdrop-blur-md sticky top-0 z-40 px-4 py-3 flex items-center border-b border-border shadow-small">
                <Link href="/" className="p-1 hover:bg-primary-light rounded-lg transition-colors absolute">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm w-full text-center">特定商取引法に基づく表記</h1>
            </div>

            <div className="container mx-auto max-w-3xl px-4 py-8 space-y-8">
                <div className="card p-6 sm:p-8 space-y-6">
                    <p className="text-sm text-muted leading-relaxed">
                        「特定商取引に関する法律」第11条（通信販売についての広告）に基づき、以下のとおり明示します。<br />
                        ※本サービスはユーザー間取引の場を提供するものであり、実際の商品の取引に関する責任は出品者および購入者に帰属します。
                    </p>

                    <div className="space-y-4">
                        <div className="border border-border rounded-xl divide-y divide-border overflow-hidden">
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">販売事業者名</dt>
                                <dd className="bg-background p-4 sm:col-span-2">事業者名（または個人名）を記載</dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">運営責任者名</dt>
                                <dd className="bg-background p-4 sm:col-span-2">代表者名または責任者名を記載</dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">所在地</dt>
                                <dd className="bg-background p-4 sm:col-span-2">
                                    〒000-0000<br />
                                    東京都〇〇区〇〇 1-2-3 〇〇ビル1F<br />
                                    <span className="text-xs text-muted block mt-1">※ご請求があった場合、遅滞なく開示いたします。</span>
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">連絡先</dt>
                                <dd className="bg-background p-4 sm:col-span-2">
                                    メール: support@gacha-trade.example.com<br />
                                    電話番号: 03-0000-0000<br />
                                    <span className="text-xs text-muted block mt-1">※原則としてサービスの「お問い合わせ」よりご連絡ください。</span>
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">販売価格・手数料</dt>
                                <dd className="bg-background p-4 sm:col-span-2 space-y-2">
                                    <p>・基本利用料：無料</p>
                                    <p>・デポジット：取引1回につき〇〇円</p>
                                    <p className="text-xs text-muted">※デポジットは正常に取引が完了した際に全額返還（または決済枠の解除）されます。</p>
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">支払い方法</dt>
                                <dd className="bg-background p-4 sm:col-span-2">
                                    クレジットカード決済（Stripeを利用）
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">支払い時期</dt>
                                <dd className="bg-background p-4 sm:col-span-2">
                                    <p>取引が提案から成立（ACCEPTED）に遷移するタイミングでクレジットカードの与信枠を確保（オーソリ）します。</p>
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">サービスの提供時期</dt>
                                <dd className="bg-background p-4 sm:col-span-2">
                                    本サービスのご登録完了後、すぐにご利用いただけます。
                                </dd>
                            </dl>
                            <dl className="grid grid-cols-1 sm:grid-cols-3 text-sm">
                                <dt className="bg-surface font-bold p-4 text-muted">キャンセル・返金について</dt>
                                <dd className="bg-background p-4 sm:col-span-2 space-y-3">
                                    <div>
                                        <p className="font-bold mb-1">■ ユーザー間取引におけるキャンセル</p>
                                        <p>商品の発送前に双方が合意した場合は、無償でキャンセルおよびデポジットの返還が行われます。発送後のキャンセル・返品は、当事者間での協議によって決定されます。</p>
                                    </div>
                                    <div>
                                        <p className="font-bold mb-1">■ プラットフォームの利用キャンセル（退会）</p>
                                        <p>マイページからいつでも退会手続きが可能です。退会に伴う返金事項はありません。</p>
                                    </div>
                                    <div className="bg-danger/5 p-3 rounded-lg border border-danger/20">
                                        <p className="font-bold text-danger mb-1">■ デポジットの没収について</p>
                                        <p className="text-xs">利用規約に違反する行為（無断での発送放棄、虚偽の申告など）が運営により確認された場合、違約金としてデポジットを没収することがあります。この場合、返金には一切応じられません。</p>
                                    </div>
                                </dd>
                            </dl>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
}
