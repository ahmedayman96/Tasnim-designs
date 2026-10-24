"use client";

import { useEffect, useRef, useState } from "react";
import { motion, useScroll, useTransform, useReducedMotion } from "framer-motion";

export interface WalkthroughChapter {
    /** 0–1 along the sequence where this label takes over. */
    at: number;
    label: string;
    labelAr?: string;
}

/**
 * A walkthrough the viewer scrolls through rather than plays.
 *
 * The frames are pre-extracted and painted to a canvas, which is what makes this
 * work on a phone — seeking a real <video> per scroll event stutters badly on
 * mobile Safari, and swapping <img> src at scroll speed thrashes layout. Frames
 * are decoded once into Image objects and drawn with drawImage.
 */
export default function ScrollWalkthrough({
    dir,
    frameCount,
    width,
    height,
    chapters = [],
    title,
    titleAr,
}: {
    /** Public path holding f0001.webp … */
    dir: string;
    frameCount: number;
    width: number;
    height: number;
    chapters?: WalkthroughChapter[];
    title: string;
    titleAr?: string;
}) {
    const sectionRef = useRef<HTMLDivElement>(null);
    const canvasRef = useRef<HTMLCanvasElement>(null);
    const backdropRef = useRef<HTMLCanvasElement>(null);
    const framesRef = useRef<HTMLImageElement[]>([]);
    /** Last frame actually painted, so we don't redraw the same one. */
    const paintedRef = useRef(-1);

    const [ready, setReady] = useState(false);
    const [progress, setProgress] = useState(0);
    const [loaded, setLoaded] = useState(0);
    const still = useReducedMotion() ?? false;

    const { scrollYProgress } = useScroll({
        target: sectionRef,
        offset: ["start start", "end end"],
    });

    // ---- load -------------------------------------------------------------
    useEffect(() => {
        let cancelled = false;
        const frameSrc = (i: number) =>
            `${dir}/f${String(i + 1).padStart(4, "0")}.webp`;
        const images: HTMLImageElement[] = new Array(frameCount);
        framesRef.current = images;

        const load = (i: number) =>
            new Promise<void>((resolve) => {
                const img = new Image();
                img.decoding = "async";
                img.onload = () => {
                    images[i] = img;
                    if (!cancelled) setLoaded((n) => n + 1);
                    resolve();
                };
                img.onerror = () => resolve(); // a missing frame just repeats the last one
                img.src = frameSrc(i);
            });

        (async () => {
            // A spread first, so scrubbing anywhere shows something immediately
            // instead of only the opening seconds being usable.
            const stride = 8;
            const firstPass: number[] = [];
            for (let i = 0; i < frameCount; i += stride) firstPass.push(i);
            await Promise.all(firstPass.map(load));
            if (cancelled) return;
            setReady(true);
            paintedRef.current = -1;

            // Then fill in the gaps, a few at a time so the main thread stays free.
            const rest = Array.from({ length: frameCount }, (_, i) => i).filter(
                (i) => i % stride !== 0
            );
            const BATCH = 6;
            for (let i = 0; i < rest.length; i += BATCH) {
                if (cancelled) return;
                await Promise.all(rest.slice(i, i + BATCH).map(load));
            }
        })();

        return () => {
            cancelled = true;
        };
    }, [dir, frameCount]);

    // ---- paint ------------------------------------------------------------
    /**
     * Progress is computed here from the section's own rect on a scroll event,
     * rather than read from framer-motion's scroll motion value. Framer drives its
     * values from a requestAnimationFrame loop, which browsers suspend in a
     * background or non-compositing tab — the frames then stop advancing while
     * the page is plainly still scrolling. A scroll listener fires regardless, so
     * the walkthrough itself never depends on the animation loop. Framer is still
     * used below for the progress rail and the scroll hint, which are decorative.
     */
    useEffect(() => {
        if (!ready) return;

        let queued = false;

        const progressNow = () => {
            const section = sectionRef.current;
            if (!section) return 0;
            const rect = section.getBoundingClientRect();
            const travel = rect.height - window.innerHeight;
            if (travel <= 0) return 0;
            return Math.min(1, Math.max(0, -rect.top / travel));
        };

        const paint = () => {
            queued = false;
            const canvas = canvasRef.current;
            if (!canvas) return;

            const target = Math.min(
                frameCount - 1,
                Math.max(0, Math.round(progressNow() * (frameCount - 1)))
            );

            // Fall back to the nearest decoded frame, so scrubbing ahead of the
            // loader shows a near neighbour rather than a blank canvas.
            let index = target;
            if (!framesRef.current[index]) {
                for (let d = 1; d < frameCount; d += 1) {
                    if (framesRef.current[target - d]) { index = target - d; break; }
                    if (framesRef.current[target + d]) { index = target + d; break; }
                }
            }
            if (index === paintedRef.current) return;

            const img = framesRef.current[index];
            if (!img) return;
            const ctx = canvas.getContext("2d");
            if (!ctx) return;
            ctx.drawImage(img, 0, 0, canvas.width, canvas.height);

            // The footage is 9:16, so on a wide screen the sharp frame can only
            // ever occupy the middle. Rather than letterbox it against empty black,
            // the same frame is painted across the full viewport behind it and
            // blurred in CSS — the screen fills edge to edge and nothing is
            // cropped away. Painted small, since it is about to be blurred anyway.
            const backdrop = backdropRef.current;
            if (backdrop) {
                const bctx = backdrop.getContext("2d");
                if (bctx) {
                    const scale = Math.max(
                        backdrop.width / img.width,
                        backdrop.height / img.height
                    );
                    const w = img.width * scale;
                    const h = img.height * scale;
                    bctx.drawImage(
                        img,
                        (backdrop.width - w) / 2,
                        (backdrop.height - h) / 2,
                        w,
                        h
                    );
                }
            }

            paintedRef.current = index;
            // Exposed so the painted frame can be inspected from the console when
            // something looks out of step with the scroll position.
            canvas.dataset.frame = String(index + 1);
            canvas.dataset.target = String(target + 1);
            setProgress(progressNow());
        };

        // Paint on the event, and again on the next frame. Scroll events can be
        // coalesced or dropped, and a dropped one would otherwise leave the canvas
        // a step behind the page until the next scroll arrived.
        const onScroll = () => {
            paint();
            if (!queued && typeof requestAnimationFrame === "function") {
                queued = true;
                requestAnimationFrame(paint);
            }
        };

        // While the section is on screen, also poll on the animation loop. This is
        // what makes scrubbing smooth at 60fps, and it self-corrects any scroll
        // event that never arrived. It stops entirely once the section is out of
        // view so it isn't burning a frame budget on the rest of the page.
        let inView = true;
        let looping = false;
        const loop = () => {
            if (!inView) { looping = false; return; }
            paint();
            requestAnimationFrame(loop);
        };
        const startLoop = () => {
            if (looping || typeof requestAnimationFrame !== "function") return;
            looping = true;
            requestAnimationFrame(loop);
        };

        const observer = new IntersectionObserver(
            ([entry]) => {
                inView = entry.isIntersecting;
                if (inView) startLoop();
            },
            { threshold: 0 }
        );
        if (sectionRef.current) observer.observe(sectionRef.current);

        paint();
        startLoop();
        window.addEventListener("scroll", onScroll, { passive: true });
        window.addEventListener("resize", onScroll);
        return () => {
            inView = false;
            observer.disconnect();
            window.removeEventListener("scroll", onScroll);
            window.removeEventListener("resize", onScroll);
        };
    }, [ready, frameCount]);

    // ---- chapter label ----------------------------------------------------
    const chapter = chapters.length
        ? chapters.reduce((current, c) => (progress >= c.at ? c : current), chapters[0])
        : undefined;

    const hintOpacity = useTransform(scrollYProgress, [0, 0.05], [1, 0]);

    return (
        <section
            ref={sectionRef}
            // Scroll distance sets the pace: ~5px of scroll per frame feels like
            // walking rather than scrubbing.
            style={{ height: `${Math.round(frameCount * 5)}vh` }}
            className="relative"
            aria-label={`${title} — scroll walkthrough`}
        >
            <div className="sticky top-0 h-screen w-full flex items-center justify-center overflow-hidden bg-midnight">
                {/* Blurred full-bleed backdrop, so the frame reads as immersive on a
                    wide screen instead of sitting in letterbox bars. */}
                <canvas
                    ref={backdropRef}
                    width={192}
                    height={108}
                    aria-hidden="true"
                    className="absolute inset-0 h-full w-full object-cover scale-110 blur-3xl brightness-[0.4] saturate-150 pointer-events-none"
                />
                <div className="absolute inset-0 bg-midnight/30 pointer-events-none" />
                {/* The frame */}
                <div className="relative z-10 h-full aspect-[9/16] max-w-full overflow-hidden shadow-[0_0_120px_rgba(0,0,0,0.8)]">
                    <canvas
                        ref={canvasRef}
                        width={width}
                        height={height}
                        className="h-full w-full object-cover block"
                    />

                    {!ready && (
                        <div className="absolute inset-0 grid place-items-center bg-charcoal">
                            <div className="text-center">
                                <p className="text-gold/70 text-xs uppercase tracking-[0.3em]">
                                    Loading walkthrough
                                </p>
                                <p className="text-warm-gray text-xs mt-3 tabular-nums">
                                    {Math.round((loaded / frameCount) * 100)}%
                                </p>
                            </div>
                        </div>
                    )}

                    {/* Chapter label, bottom-left like a plan annotation */}
                    {chapter && ready && (
                        <div className="absolute inset-x-0 bottom-0 p-5 bg-gradient-to-t from-midnight/90 to-transparent pointer-events-none">
                            <div className="flex items-center gap-3">
                                <span className="h-px w-6 bg-gold/60" />
                                <span className="text-gold text-[0.6rem] uppercase tracking-[0.3em]">
                                    {chapter.label}
                                </span>
                            </div>
                            {chapter.labelAr && (
                                <p className="font-arabic text-cream/70 text-base mt-1.5" dir="rtl">
                                    {chapter.labelAr}
                                </p>
                            )}
                        </div>
                    )}
                </div>

                {/* Title, set in the margin */}
                <div className="absolute top-24 left-6 md:left-12 z-10 hidden md:block">
                    <p className="text-warm-gray text-[0.6rem] uppercase tracking-[0.35em]">
                        Finishing Services
                    </p>
                    <h2 className="font-serif text-2xl text-cream mt-2">{title}</h2>
                    {titleAr && (
                        <p className="font-arabic text-gold/50 text-lg mt-1" dir="rtl">
                            {titleAr}
                        </p>
                    )}
                </div>

                {/* Progress rail */}
                <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 h-40 w-px bg-gold/15 overflow-hidden hidden sm:block">
                    <div
                        className="w-full bg-gold origin-top transition-transform duration-100"
                        style={{ height: "100%", transform: `scaleY(${progress})` }}
                    />
                </div>

                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-2"
                    style={{ opacity: hintOpacity }}
                >
                    <span className="text-warm-gray text-[0.6rem] uppercase tracking-[0.3em]">
                        {still ? "Scroll" : "Scroll to walk through"}
                    </span>
                    <motion.span
                        className="w-px h-8 bg-gradient-to-b from-gold to-transparent block"
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ transformOrigin: "top" }}
                    />
                </motion.div>
            </div>
        </section>
    );
}
