import Link from "next/link";
import { ChevronLeft, FileText } from "lucide-react";

export default function TermsPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-surface-hover rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">利用規約</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="card p-6 space-y-6 text-sm text-foreground/80 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 pb-4 border-b border-border">
                        <FileText className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-bold text-foreground">ガチャトレード 利用規約</h2>
                    </div>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第1条（適用および免責事項）</h3>
                        <p>1. 本利用規約（以下「本規約」といいます。）は、ユーザーと当プラットフォーム（以下「当サービス」といいます。）との間の、当サービスの利用に関わる一切の関係に適用されます。</p>
                        <p>2. 当サービスは、ユーザー間の交換の機会（場）を提供するものであり、ユーザー間の交換契約自体には一切関与しません。</p>
                        <p>3. 商品の未発送、状態の相違、破損など、当事者間で生じたトラブルについては当事者間で解決するものとし、当サービスは運営の故意または重過失による場合を除き、一切の責任を負いません。</p>
                        <p>4. 当サービスは本規約のほか、各種のルール、ガイドライン等を定めることがあります。これらは本規約の一部を構成するものとします。</p>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第2条（ユーザー登録）</h3>
                        <p>1. 登録希望者が当サービスの定める方法によって利用登録を申請し、当サービスがこれを承認することによって利用登録が完了するものとします。</p>
                        <p>2. 登録に際して虚偽の事項があった場合、当サービスは利用登録を承認しないか、または事後に登録を抹消することがあります。</p>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第3条（禁止事項）</h3>
                        <p>ユーザーは、当サービスの利用にあたり、以下の行為をしてはなりません。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>法令または公序良俗に違反する行為</li>
                            <li>犯罪行為に関連する行為</li>
                            <li>当サービスの内容等、当サービスに含まれる著作権、商標権ほか知的財産権を侵害する行為</li>
                            <li>当サービス、他のユーザー、またはその他第三者のサーバーまたはネットワークの機能を破壊したり、妨害したりする行為</li>
                            <li>その他、当サービスが不適切と判断する行為</li>
                        </ul>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第4条（安全な取引のためのルール）</h3>
                        <p>ユーザーが安全に取引を行うため、以下のプロセスとルールに同意するものとします。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li><strong>追跡番号の必須化</strong>: 発送時に追跡番号の入力を必須とします。適当または虚偽の番号の入力は禁止されます。</li>
                            <li><strong>デポジット（預り金）制度</strong>: 取引成立時、双方は所定のデポジット（与信枠の確保）を行います。正当な理由なく発送しない場合、または悪質な行為が認められた場合、違約金としてデポジットを没収する場合があります。</li>
                            <li><strong>虚偽の申告に対するペナルティ</strong>: 「届いた商品が違う」「破損している」といった虚偽の申告を行い、不当にデポジットの返還を受けようとする、または相手のデポジットを没収させようとする行為は固く禁じます。発覚した場合は、アカウントの永久停止および損害賠償請求の対象となります。</li>
                        </ul>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第4条（自己責任の原則等）</h3>
                        <p>1. ユーザーは、本サービスを利用して行う取引やメッセージの交換等において、自己の責任においてこれを行うものとします。</p>
                        <p>2. 取引に関する紛争等が発生した場合、原則として当事者間で解決するものとし、当サービスは運営上必要な限度でのみ介入するものとします。</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
