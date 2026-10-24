"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

/**
 * A room preview that moves.
 *
 * A still frame tells you nothing about a walkthrough. As the card travels up
 * through the viewport it scrubs a sampled set of its own frames and grows
 * slightly, so the room opens toward you as you scroll onto it — a preview of the
 * walkthrough, performed by the walkthrough itself.
 *
 * Only a sample of frames is loaded (SAMPLES across the whole sequence), so six of
 * these on one page cost a couple of megabytes rather than twenty.
 */
const SAMPLES = 14;

export default function RoomPreview({
    slug,
    title,
    titleAr,
    dir,
    frameCount,
    index,
}: {
    slug: string;
    title: string;
    titleAr?: string;
    dir: string;
    frameCount: number;
    index: number;
}) {
    const wrapRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    const paintedRef = useRef(-1);
    const [ready, setReady] = useState(false);

    useEffect(() => {
        let cancelled = false;
        const picks = Array.from({ length: SAMPLES }, (_, i) =>
            Math.min(frameCount - 1, Math.round((i / (SAMPLES - 1)) * (frameCount - 1)))
        );
        const images: HTMLImageElement[] = [];
        framesRef.current = images;

        Promise.all(
            picks.map(
                (n, i) =>
                    new Promise<void>((resolve) => {
                        const img = new Image();
                        img.decoding = "async";
                        img.onload = () => { images[i] = img; resolve(); };
                        img.onerror = () => resolve();
                        img.src = `${dir}/f${String(n + 1).padStart(4, "0")}.webp`;
                    })
            )
        ).then(() => { if (!cancelled) setReady(true); });

        return () => { cancelled = true; };
    }, [dir, frameCount]);

    useEffect(() => {
        if (!ready) return;

        const paint = () => {
            const wrap = wrapRef.current;
            const canvas = canvasRef.current;
            if (!wrap || !canvas) return;

            const rect = wrap.getBoundingClientRect();
            // 0 as the card enters from the bottom, 1 as it leaves at the top.
            const travel = window.innerHeight + rect.height;
            const progress = Math.min(1, Math.max(0, (window.innerHeight - rect.top) / travel));

            const i = Math.min(SAMPLES - 1, Math.max(0, Math.round(progress * (SAMPLES - 1))));
            if (i !== paintedRef.current && framesRef.current[i]) {
                const ctx = canvas.getContext("2d");
                if (ctx) {
                    ctx.drawImage(framesRef.current[i], 0, 0, canvas.width, canvas.height);
                    paintedRef.current = i;
                }
            }

            // Nearest the middle of the screen the room is largest — it comes toward
            // you on the way in and settles back on the way out.
            const centred = 1 - Math.abs(progress - 0.5) * 2;
            wrap.style.setProperty("--near", String(0.94 + centred * 0.06));
            wrap.style.setProperty("--lift", `${(1 - centred) * 14}px`);
        };

        let looping = false;
        let inView = true;
        const loop = () => {
            if (!inView) { looping = false; return; }
            paint();
            requestAnimationFrame(loop);
        };
        const start = () => {
            if (looping || typeof requestAnimationFrame !== "function") return;
            looping = true;
            requestAnimationFrame(loop);
        };

        const observer = new IntersectionObserver(
            ([entry]) => { inView = entry.isIntersecting; if (inView) start(); },
            { rootMargin: "200px" }
        );
        if (wrapRef.current) observer.observe(wrapRef.current);

        paint();
        start();
        // Scroll events cover the case where the animation loop is throttled.
        window.addEventListener("scroll", paint, { passive: true });
        window.addEventListener("resize", paint);
        return () => {
            inView = false;
            observer.disconnect();
            window.removeEventListener("scroll", paint);
            window.removeEventListener("resize", paint);
        };
    }, [ready]);

    return (
        <Link href={`/architecture/walkthrough/${slug}`} className="group block">
            <div
                ref={wrapRef}
                className="relative overflow-hidden will-change-transform"
                style={{
                    transform: "scale(var(--near, 1)) translateY(var(--lift, 0px))",
                    transition: "none",
                }}
            >
                <div className="relative aspect-[3/4] md:aspect-[4/5] bg-charcoal overflow-hidden">
                    <canvas
                        ref={canvasRef}
                        width={540}
                        height={960}
                        className="absolute inset-0 h-full w-full object-cover"
                    />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-transparent" />
                    <span className="pointer-events-none absolute inset-0 border border-gold/0 group-hover:border-gold/40 transition-colors duration-700" />

                    {/* Number, set into the image like a plate caption */}
                    <span className="absolute top-5 left-5 font-serif text-gold/70 text-sm tabular-nums tracking-[0.25em]">
                        {String(index + 1).padStart(2, "0")}
                    </span>

                    <div className="absolute inset-x-0 bottom-0 p-6">
                        <h3 className="font-serif text-2xl md:text-3xl text-cream group-hover:text-gold transition-colors duration-500">
                            {title}
                        </h3>
                        {titleAr && (
                            <p className="font-arabic text-gold/50 text-lg mt-1" dir="rtl">
                                {titleAr}
                            </p>
                        )}
                    </div>
                </div>
            </div>
        </Link>
    );
}
