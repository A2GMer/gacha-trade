import Link from "next/link";
import { ChevronLeft, ShieldCheck } from "lucide-react";

export default function PrivacyPolicyPage() {
    return (
        <div className="bg-background min-h-screen">
            {/* Header */}
            <div className="bg-surface sticky top-0 z-40 px-4 py-3 border-b border-border flex items-center gap-3">
                <Link href="/mypage" className="p-1 -ml-1 hover:bg-surface-hover rounded-full transition-colors">
                    <ChevronLeft className="h-6 w-6" />
                </Link>
                <h1 className="font-bold text-sm">プライバシーポリシー</h1>
            </div>

            <div className="container mx-auto max-w-2xl px-4 py-8">
                <div className="card p-6 space-y-6 text-sm text-foreground/80 leading-relaxed">
                    <div className="flex items-center gap-2 mb-2 pb-4 border-b border-border">
                        <ShieldCheck className="h-5 w-5 text-primary" />
                        <h2 className="text-lg font-black text-foreground">プライバシーポリシー</h2>
                    </div>

                    <section className="space-y-2 text-justify">
                        <p>プラットフォーム「ガチャトレード」（以下、「当サービス」といいます。）は、ユーザーの個人情報の取扱いについて、以下のとおりプライバシーポリシー（以下、「本ポリシー」といいます。）を定めます。</p>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第1条（個人情報）</h3>
                        <p>「個人情報」とは、個人情報保護法にいう「個人情報」を指すものとし、生存する個人に関する情報であって、当該情報に含まれる氏名、生年月日、住所、電話番号、連絡先その他の記述等により特定の個人を識別できる情報、および生体情報などの個人識別符号が含まれる情報を指します。</p>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第2条（個人情報の収集方法）</h3>
                        <p>当サービスは、ユーザーが利用登録をする際に氏名、生年月日、住所、電話番号、メールアドレスなどの個人情報をお尋ねすることがあります。また、取引の際に住所等の必要な情報を収集します。これらは行レベルセキュリティ(RLS)等を用いて高度に保護されます。</p>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第3条（個人情報を収集・利用する目的）</h3>
                        <p>当サービスが個人情報を収集・利用する目的は、以下のとおりです。</p>
                        <ul className="list-disc pl-5 mt-2 space-y-1">
                            <li>当サービスの提供・運営のため</li>
                            <li>ユーザーからのお問い合わせに回答するため（本人確認を行うことを含む）</li>
                            <li>商品の発送、受取に必要な取引情報を関係するユーザー間で開示するため（取引成立時のみ）</li>
                            <li>不正・不当な目的でサービスを利用しようとするユーザーを特定し、ご利用をお断りするため</li>
                        </ul>
                    </section>

                    <section className="space-y-2 text-justify">
                        <h3 className="font-bold text-base text-foreground">第4条（第三者への提供）</h3>
                        <p>当サービスは、ユーザーの同意がない限り、事前に第三者に個人情報を提供することはありません。ただし、取引が成立した場合に限り、商品の発送目的において、当該取引の相手方に住所・氏名等を開示します。</p>
                    </section>
                </div>
            </div>
        </div>
    );
}
