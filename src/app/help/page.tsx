import Link from "next/link";
import { ChevronLeft, Info, HelpCircle, Package, Send, AlertTriangle } from "lucide-react";

export default function HelpPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-surface-hover rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">ヘルプ・ガイド</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-8 space-y-6">

                <h2 className="text-xl font-black mb-4 flex items-center gap-2">
                    <HelpCircle className="h-6 w-6 text-primary" /> よくある質問
                </h2>

                <div className="space-y-4">
                    <div className="collapse collapse-arrow bg-surface border border-border">
                        <input type="radio" name="my-accordion-2" defaultChecked />
                        <div className="collapse-title text-sm font-medium flex items-center gap-2">
                            <Package className="h-4 w-4 text-accent" />
                            取引の流れについて知りたい
                        </div>
                        <div className="collapse-content text-sm text-muted">
                            <p>1. 欲しいアイテムを見つけたら、自分が持っている交換用アイテムを選んで「提案」を送ります。</p>
                            <p className="mt-2">2. 相手が承諾すると「取引成立」となります。</p>
                            <p className="mt-2">3. 取引画面から自分の住所を登録します。双方が登録を完了すると相手の住所が見えるようになります。</p>
                            <p className="mt-2">4. 発送手配を行い、「発送した」ボタンを押します。</p>
                            <p className="mt-2">5. お互いに商品が届き、「受取確認」を行うと取引完了です。</p>
                        </div>
                    </div>

                    <div className="collapse collapse-arrow bg-surface border border-border">
                        <input type="radio" name="my-accordion-2" />
                        <div className="collapse-title text-sm font-medium flex items-center gap-2">
                            <Send className="h-4 w-4 text-secondary" />
                            送料はどうなりますか？
                        </div>
                        <div className="collapse-content text-sm text-muted">
                            <p>基本的には「お互いが自分の発送元払い」で相手に送ることを前提とした物々交換サービスです。双方が同じくらいの送料負担になるよう、事前にメッセージで発送方法（定形外など）を相談することをお勧めします。</p>
                        </div>
                    </div>

                    <div className="collapse collapse-arrow bg-surface border border-border">
                        <input type="radio" name="my-accordion-2" />
                        <div className="collapse-title text-sm font-medium flex items-center gap-2">
                            <AlertTriangle className="h-4 w-4 text-warning" />
                            商品が届きません / トラブルがありました
                        </div>
                        <div className="collapse-content text-sm text-muted">
                            <p>発送通知から10日経過しても商品が届かない場合や、中身が違うなどのトラブルがあった場合は、取引画面から「紛争を提起する」か、運営サポートまでご連絡ください。悪質なユーザーはアカウント停止等の措置を取る場合があります。</p>
                        </div>
                    </div>
                </div>

                <div className="card p-6 mt-8 bg-primary/5 text-center border-primary/20">
                    <h3 className="font-bold mb-2 text-primary">解決しない場合は</h3>
                    <p className="text-sm text-muted mb-4">運営サポートまで直接お問い合わせください。</p>
                    <button className="btn btn-primary px-8">お問い合わせフォーム</button>
                </div>
            </div>
        </div>
    );
}
