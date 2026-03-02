import Link from "next/link";
import { ChevronLeft, ShieldCheck, Camera, Package, AlertTriangle } from "lucide-react";

export default function GuidePage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-surface-hover rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">安全な取引ガイドライン</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-3">
                        <ShieldCheck className="h-8 w-8 text-primary" />
                    </div>
                    <h2 className="text-xl font-bold mb-2">トラブルを防ぐために</h2>
                    <p className="text-sm text-muted">安心して交換していただくための3つのルール</p>
                </div>

                <div className="space-y-6">
                    {/* Rule 1 */}
                    <div className="card p-5 border-l-4 border-l-primary">
                        <div className="flex items-start gap-4">
                            <div className="bg-primary/10 p-3 rounded-xl mt-1">
                                <Camera className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base mb-2">1. 発送前に「状態」を撮影する</h3>
                                <p className="text-sm text-foreground/80 leading-relaxed mb-3">
                                    万が一、相手から「違う商品が届いた」「壊れていた」と報告された場合に備え、<strong>箱に入れる前と梱包後の写真を撮影しておくこと</strong>を強く推奨します。
                                </p>
                                <div className="bg-surface p-3 rounded-lg text-xs text-muted">
                                    📸 撮っておくべき写真：<br />
                                    ・商品の全体や傷等の状態がわかる写真<br />
                                    ・商品を箱に入れ、封をする前の状態<br />
                                    ※取引完了まで削除せずに保管してください。
                                </div>
                            </div>
                        </div>
                    </div>

                    {/* Rule 2 */}
                    <div className="card p-5 border-l-4 border-l-success">
                        <div className="flex items-start gap-4">
                            <div className="bg-success/10 p-3 rounded-xl mt-1">
                                <Package className="h-6 w-6 text-success" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base mb-2">2. 中身を確認してから「受取完了」</h3>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    荷物が届いたら、必ず中身が交換相手と約束したアイテムと一致しているか確認してください。一度「受取完了」を押してしまうと、その後のキャンセルやサポートはできません。
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Rule 3 */}
                    <div className="card p-5 border-l-4 border-l-danger">
                        <div className="flex items-start gap-4">
                            <div className="bg-danger/10 p-3 rounded-xl mt-1">
                                <AlertTriangle className="h-6 w-6 text-danger" />
                            </div>
                            <div>
                                <h3 className="font-bold text-base mb-2">3. 虚偽の申告は厳罰の対象</h3>
                                <p className="text-sm text-foreground/80 leading-relaxed">
                                    正しいアイテムを受け取ったにも関わらず「中身が違う」と嘘の報告をして、アイテムとデポジットの両方を不当に得ようとする行為は詐欺です。発覚した場合、アカウントの永久停止および損害賠償請求の対象となります。
                                </p>
                            </div>
                        </div>
                    </div>

                    <div className="card p-5 bg-surface text-sm text-center">
                        <p className="font-bold mb-2">何か問題が起きたら？</p>
                        <p className="text-muted text-xs">
                            取引画面で「アイテムが一致しない」を選択すると、取引が一時停止し互いのデポジットが保留されます。その後、お互いに証拠（写真等）を提出し、運営が最終判断を行います。
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
