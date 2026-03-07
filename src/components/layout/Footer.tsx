import Link from "next/link";
import Image from "next/image";

export function Footer() {
    return (
        <footer className="bg-surface border-t border-border pt-10 pb-24 sm:pb-12 px-4 shadow-sm mt-auto">
            <div className="container mx-auto max-w-5xl">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-8">
                    <div>
                        <div className="flex items-center gap-2 mb-4">
                            <Image src="/logo.svg" alt="????" width={28} height={28} className="h-7 w-7 object-contain" />
                            <span className="font-bold text-base tracking-tight">スワコレ</span>
                        </div>
                        <p className="text-xs text-muted leading-relaxed max-w-xs">
                            ダブったカプセルトイを、欲しい誰かと交換しよう。<br />
                            日本最大級のガチャガチャ物々交換プラットフォーム。
                        </p>
                    </div>

                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <h3 className="font-bold text-xs text-foreground/50 uppercase tracking-widest mb-4">ガイド</h3>
                            <ul className="space-y-3">
                                <li><Link href="/help" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">ヘルプ</Link></li>
                                <li><Link href="/guide" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">安全な取引ガイド</Link></li>
                                <li><Link href="/about" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">運営者情報</Link></li>
                            </ul>
                        </div>
                        <div>
                            <h3 className="font-bold text-xs text-foreground/50 uppercase tracking-widest mb-4">規約・ポリシー</h3>
                            <ul className="space-y-3">
                                <li><Link href="/terms" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">利用規約</Link></li>
                                <li><Link href="/privacy" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">プライバシーポリシー</Link></li>
                                <li><Link href="/tokushoho" className="text-muted hover:text-primary transition-colors text-xs inline-block py-1">特定商取引法に基づく表記</Link></li>
                            </ul>
                        </div>
                    </div>
                </div>

                <div className="mt-12 pt-8 border-t border-border/50 text-center">
                    <p className="text-[10px] text-muted font-medium">
                        &copy; {new Date().getFullYear()} スワコレ. All rights reserved.
                    </p>
                </div>
            </div>
        </footer>
    );
}
