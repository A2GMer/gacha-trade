import Link from "next/link";
import {
    ChevronLeft,
    HelpCircle,
    Package,
    Send,
    AlertTriangle,
    ShieldCheck,
    ArrowRightLeft,
    MessageSquare,
    ChevronRight,
} from "lucide-react";

const FAQ_SECTIONS = [
    {
        title: "よくある質問",
        icon: HelpCircle,
        color: "text-primary",
        items: [
            {
                icon: ArrowRightLeft,
                iconColor: "text-accent",
                q: "交換の仕組みは？",
                a: "カプセルトイのダブり同士を、金銭なしで物々交換できるサービスです。お互いのアイテムを選んで提案し、相手が承諾すれば取引成立です。",
            },
            {
                icon: Package,
                iconColor: "text-accent",
                q: "取引の流れを教えてください",
                steps: [
                    "欲しいアイテムを見つけたら、自分が持っている交換用アイテムを選んで「提案」を送ります。",
                    "相手が承諾すると「取引成立」となります。",
                    "取引画面から自分の住所を登録します。双方が登録を完了すると相手の住所が見えるようになります。",
                    "発送手配を行い、「発送した」ボタンを押します。",
                    "お互いに商品が届き、「受取確認」を行うと取引完了です。",
                ],
            },
            {
                icon: Send,
                iconColor: "text-secondary",
                q: "送料はどうなりますか？",
                a: "「お互いが自分の発送元払い」で相手に送ることを前提とした物々交換サービスです。事前にメッセージで発送方法（定形外など）を相談することをお勧めします。",
            },
            {
                icon: ShieldCheck,
                iconColor: "text-accent",
                q: "住所は安全ですか？",
                a: "住所は暗号化されて保存され、取引の当事者のみが閲覧できます。取引完了後7日以内に自動削除されます。",
            },
        ],
    },
    {
        title: "困ったとき",
        icon: AlertTriangle,
        color: "text-warning",
        items: [
            {
                icon: AlertTriangle,
                iconColor: "text-warning",
                q: "商品が届きません / 中身が違いました",
                a: "発送通知から10日経過しても届かない場合や、説明と異なる商品が届いた場合は、取引画面から「問題報告」を行ってください。運営が調査し、対処いたします。",
            },
            {
                icon: AlertTriangle,
                iconColor: "text-danger",
                q: "相手が発送してくれません",
                a: "発送期限（住所確定から5日）を超過した場合、紛争を提起できます。取引画面の「問題を報告する」ボタンからご連絡ください。",
            },
            {
                icon: MessageSquare,
                iconColor: "text-muted",
                q: "相手がメッセージに返信しません",
                a: "取引中の相手が長期間応答しない場合は、期限超過を待って紛争を提起していただくか、運営サポートまでお問い合わせください。",
            },
        ],
    },
];

export default function HelpPage() {
    return (
        <div className="bg-background min-h-screen pb-24">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link
                    href="/mypage"
                    className="p-1 -ml-1 hover:bg-background rounded-full transition-colors"
                >
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">ヘルプ・ガイド</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-6 space-y-8">
                {/* Trade Flow Visual */}
                <div className="card p-5 animate-fade-in-up">
                    <h2 className="text-sm font-black mb-4 flex items-center gap-2">
                        <ArrowRightLeft className="h-4 w-4 text-primary" />
                        交換の流れ
                    </h2>
                    <div className="step-indicator">
                        {["探す", "提案", "住所入力", "発送", "受取"].map((step, i) => (
                            <div key={step} className="contents">
                                {i > 0 && <div className="step-line completed" />}
                                <div className="step-dot completed">
                                    <span className="text-[10px]">{i + 1}</span>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 px-1">
                        {["探す", "提案", "住所入力", "発送", "受取"].map((step) => (
                            <span key={step} className="text-[9px] text-muted font-bold text-center" style={{ width: "3rem" }}>
                                {step}
                            </span>
                        ))}
                    </div>
                </div>

                {/* FAQ sections */}
                {FAQ_SECTIONS.map((section, si) => (
                    <section key={si} className={`animate-fade-in-up delay-${si + 1}`}>
                        <h2 className={`text-base font-black mb-4 flex items-center gap-2 ${section.color}`}>
                            <section.icon className="h-5 w-5" />
                            {section.title}
                        </h2>
                        <div className="space-y-3">
                            {section.items.map((item, i) => (
                                <details key={i} className="card group">
                                    <summary className="px-4 py-3.5 flex items-center gap-3 cursor-pointer list-none">
                                        <item.icon className={`h-4 w-4 ${item.iconColor} shrink-0`} />
                                        <span className="flex-1 text-sm font-bold">{item.q}</span>
                                        <ChevronRight className="h-4 w-4 text-muted group-open:rotate-90 transition-transform" />
                                    </summary>
                                    <div className="px-4 pb-4 ml-7">
                                        {item.a && (
                                            <p className="text-sm text-muted leading-relaxed">{item.a}</p>
                                        )}
                                        {"steps" in item && item.steps && (
                                            <ol className="space-y-2">
                                                {item.steps.map((step, j) => (
                                                    <li key={j} className="text-sm text-muted flex gap-2">
                                                        <span className="bg-primary text-white text-[10px] font-bold w-5 h-5 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                                                            {j + 1}
                                                        </span>
                                                        <span className="leading-relaxed">{step}</span>
                                                    </li>
                                                ))}
                                            </ol>
                                        )}
                                    </div>
                                </details>
                            ))}
                        </div>
                    </section>
                ))}

                {/* Contact */}
                <div className="card p-6 text-center bg-primary/5 border border-primary/10 animate-fade-in-up delay-3">
                    <h3 className="font-black mb-2 text-primary">解決しない場合は</h3>
                    <p className="text-sm text-muted mb-4">
                        運営サポートまで直接お問い合わせください
                    </p>
                    <button className="btn btn-primary px-8">お問い合わせフォーム</button>
                </div>
            </div>
        </div>
    );
}
