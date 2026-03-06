"use client";

import React, { useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import Autoplay from "embla-carousel-autoplay";
import Link from "next/link";
import { Search, ChevronLeft, ChevronRight } from "lucide-react";

function XLogo({ className = "h-4 w-4" }: { className?: string }) {
    return (
        <svg className={className} viewBox="0 0 24 24" fill="currentColor">
            <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z" />
        </svg>
    );
}

export function HeroCarousel() {
    const [emblaRef, emblaApi] = useEmblaCarousel(
        { loop: true, align: "center", containScroll: "trimSnaps" },
        [Autoplay({ delay: 5000, stopOnInteraction: false })]
    );
    const [selectedIndex, setSelectedIndex] = useState(0);
    const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);

    const scrollTo = useCallback(
        (index: number) => emblaApi && emblaApi.scrollTo(index),
        [emblaApi]
    );

    const scrollPrev = useCallback(
        () => emblaApi && emblaApi.scrollPrev(),
        [emblaApi]
    );

    const scrollNext = useCallback(
        () => emblaApi && emblaApi.scrollNext(),
        [emblaApi]
    );

    const onInit = useCallback((emblaApi: any) => {
        setScrollSnaps(emblaApi.scrollSnapList());
    }, []);

    const onSelect = useCallback((emblaApi: any) => {
        setSelectedIndex(emblaApi.selectedScrollSnap());
    }, []);

    useEffect(() => {
        if (!emblaApi) return;

        onInit(emblaApi);
        onSelect(emblaApi);
        emblaApi.on("reInit", onInit);
        emblaApi.on("reInit", onSelect);
        emblaApi.on("select", onSelect);
    }, [emblaApi, onInit, onSelect]);

    return (
        <div className="bg-background overflow-hidden pb-4 sm:pb-8 pt-2 sm:pt-4">
            <div className="relative group max-w-[100vw]">
                {/* Carousel Viewport - No padding here so slides can peek edge-to-edge */}
                <div className="overflow-hidden" ref={emblaRef}>
                    <div className="flex touch-pan-y items-center">
                        {/* 
                  Track:
                  - flex
                  - touch-pan-y
                  - -ml-4 : Compensate for the first slide's left margin so it can be centered if needed, 
                            or just use gap/margin strategy.
                */}

                        {/* Slide 1: Main Concept */}
                        {/* 
                      flex-[0_0_92%] or similar: Takes up 92% of the viewport width.
                      mx-2: Adds gap between slides.
                      ml-4 (on first only if needed, but embla handles alignment usually if aligned 'center')
                    */}
                        <div className="flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_80%] min-w-0 relative bg-gradient-to-r from-primary to-[#ff8a65] aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] flex items-center justify-between p-6 sm:p-10 overflow-hidden mx-1 sm:mx-2 rounded-xl sm:rounded-2xl shadow-sm">
                            <div className="relative z-10 w-full sm:w-1/2 flex flex-col items-center sm:items-start text-center sm:text-left">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/30 shadow-sm">
                                    ガチャ・くじ・推し活グッズ
                                </span>
                                <h2 className="text-3xl sm:text-4xl lg:text-5xl font-black text-white leading-tight mb-2 drop-shadow-md">
                                    ダブったアイテム、<br />
                                    <span className="text-yellow-300">ワクワクに交換！</span>
                                </h2>
                                <p className="text-sm sm:text-base text-white/95 mb-6 drop-shadow-sm font-medium hidden sm:block">
                                    手数料0円・送料だけで安全にスワップ
                                </p>
                                <Link
                                    href="/search"
                                    className="btn bg-white text-primary hover:bg-gray-50 hover:scale-105 transition-all text-sm px-6 py-3 font-bold shadow-lg rounded-full w-full sm:w-auto flex items-center justify-center gap-2"
                                >
                                    <Search className="h-4 w-4" />
                                    さっそく探す
                                </Link>
                            </div>
                            {/* Optional background decoration for Slide 1 */}
                            <div className="absolute right-0 top-0 w-1/2 h-full hidden sm:flex items-center justify-center pointer-events-none opacity-20 text-9xl">
                                🎰
                            </div>
                            {selectedIndex === 0 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-20">
                                    <div className="h-full bg-white origin-left animate-[progress_5s_linear_forwards]" />
                                </div>
                            )}
                        </div>

                        {/* Slide 2: How to Use */}
                        <div className="flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_80%] min-w-0 relative bg-gradient-to-r from-accent to-[#00b4d8] aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] flex items-center justify-between p-6 sm:p-10 overflow-hidden mx-1 sm:mx-2 rounded-xl sm:rounded-2xl shadow-sm">
                            <div className="relative z-10 w-full flex flex-col items-center text-center">
                                <span className="bg-white/20 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/30 shadow-sm">
                                    かんたん3ステップ
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-4 drop-shadow-md">
                                    お金のやり取りは一切なし！
                                </h2>
                                <div className="flex items-center justify-center gap-2 sm:gap-6 text-white text-sm sm:text-base font-bold w-full max-w-2xl">
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-accent rounded-full flex items-center justify-center text-lg sm:text-xl mb-2 shadow-md">1</div>
                                        <span>登録する</span>
                                    </div>
                                    <div className="w-8 h-[2px] bg-white/50"></div>
                                    <div className="flex flex-col items-center">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-accent rounded-full flex items-center justify-center text-lg sm:text-xl mb-2 shadow-md">2</div>
                                        <span>探して提案</span>
                                    </div>
                                    <div className="w-8 h-[2px] bg-white/50 hidden sm:block"></div>
                                    <div className="flex flex-col items-center hidden sm:flex">
                                        <div className="w-10 h-10 sm:w-12 sm:h-12 bg-white text-accent rounded-full flex items-center justify-center text-lg sm:text-xl mb-2 shadow-md">3</div>
                                        <span>送る・届く</span>
                                    </div>
                                </div>
                            </div>
                            {selectedIndex === 1 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-20">
                                    <div className="h-full bg-white origin-left animate-[progress_5s_linear_forwards]" />
                                </div>
                            )}
                        </div>

                        {/* Slide 3: Sell CTA */}
                        <div className="flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_80%] min-w-0 relative bg-gradient-to-r from-purple-500 to-indigo-500 aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] flex items-center justify-between p-6 sm:p-10 overflow-hidden mx-1 sm:mx-2 rounded-xl sm:rounded-2xl shadow-sm">
                            <div className="relative z-10 w-full sm:w-2/3 flex flex-col items-center sm:items-start text-center sm:text-left">
                                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3 drop-shadow-md">
                                    眠っているアイテムありませんか？
                                </h2>
                                <p className="text-sm sm:text-base text-white/90 mb-5 drop-shadow-sm font-medium">
                                    写真を撮ってタグをつけるだけで簡単出品
                                </p>
                                <Link
                                    href="/sell"
                                    className="btn bg-white text-purple-600 hover:bg-gray-50 hover:scale-105 transition-all text-sm px-8 py-3 font-bold shadow-lg rounded-full"
                                >
                                    出品してみる
                                </Link>
                            </div>
                            {selectedIndex === 2 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-20">
                                    <div className="h-full bg-white origin-left animate-[progress_5s_linear_forwards]" />
                                </div>
                            )}
                        </div>

                        {/* Slide 4: X Import CTA */}
                        <div className="flex-[0_0_90%] sm:flex-[0_0_85%] md:flex-[0_0_80%] min-w-0 relative bg-gradient-to-r from-gray-900 to-gray-700 aspect-[4/3] sm:aspect-[21/9] md:aspect-[3/1] flex items-center justify-between p-6 sm:p-10 overflow-hidden mx-1 sm:mx-2 rounded-xl sm:rounded-2xl shadow-sm">
                            <div className="relative z-10 w-full flex flex-col items-center sm:items-start text-center sm:text-left">
                                <span className="bg-white/10 backdrop-blur-sm text-white text-xs font-bold px-3 py-1 rounded-full mb-3 border border-white/20 shadow-sm flex items-center gap-1.5 w-fit">
                                    <XLogo className="h-3 w-3" />
                                    新機能
                                </span>
                                <h2 className="text-2xl sm:text-4xl font-black text-white leading-tight mb-3 drop-shadow-md">
                                    XのポストURLから<br />かんたん出品
                                </h2>
                                <p className="text-sm sm:text-base text-white/90 mb-5 drop-shadow-sm font-medium">
                                    Xでの募集内容をそのまま取り込めます
                                </p>
                                <Link
                                    href="/sell"
                                    className="btn bg-white text-gray-900 hover:bg-gray-50 hover:scale-105 transition-all text-sm px-8 py-3 font-bold shadow-lg rounded-full flex items-center gap-2 w-fit"
                                >
                                    <XLogo className="h-4 w-4" />
                                    試してみる
                                </Link>
                            </div>
                            {selectedIndex === 3 && (
                                <div className="absolute bottom-0 left-0 right-0 h-1 sm:h-1.5 bg-black/20 z-20">
                                    <div className="h-full bg-white origin-left animate-[progress_5s_linear_forwards]" />
                                </div>
                            )}
                        </div>

                    </div>
                </div>

                {/* Navigation Buttons */}
                <button
                    className="absolute left-2 sm:left-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/10 hover:bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-30 opacity-0 group-hover:opacity-100"
                    onClick={scrollPrev}
                    aria-label="Previous slide"
                >
                    <ChevronLeft className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
                <button
                    className="absolute right-2 sm:right-4 top-1/2 -translate-y-1/2 w-10 h-10 sm:w-12 sm:h-12 bg-black/10 hover:bg-black/30 backdrop-blur-sm text-white rounded-full flex items-center justify-center transition-all z-30 opacity-0 group-hover:opacity-100"
                    onClick={scrollNext}
                    aria-label="Next slide"
                >
                    <ChevronRight className="h-6 w-6 sm:h-8 sm:w-8" />
                </button>
            </div>

            {/* Pagination & Progress */}
            <div className="container mx-auto max-w-5xl px-4 mt-3 sm:mt-5 relative z-10 flex flex-col items-center gap-3">
                {/* Dots */}
                <div className="flex justify-center gap-2">
                    {scrollSnaps.map((_, index) => (
                        <button
                            key={index}
                            className={`w-2 h-2 rounded-full transition-all duration-300 ${index === selectedIndex
                                ? "bg-primary w-6"
                                : "bg-primary/30"
                                }`}
                            onClick={() => scrollTo(index)}
                            aria-label={`Go to slide ${index + 1}`}
                        />
                    ))}
                </div>
            </div>

            <style jsx>{`
                @keyframes progress {
                    from { transform: scaleX(0); }
                    to { transform: scaleX(1); }
                }
            `}</style>
        </div>
    );
}
