"use client";

import {
    motion,
    useScroll,
    useTransform,
    useReducedMotion,
    type MotionValue,
} from "framer-motion";
import Image from "next/image";
import { useRef } from "react";
import type { Chapter, Project } from "@/lib/projects";

/**
 * Scroll-linked input ranges have to stay inside [0, 1]. Framer Motion hands these
 * off to the browser's native scroll timeline, which rejects keyframe offsets
 * outside that window — the crossfade overlap would otherwise push the first and
 * last chapters past both ends.
 */
const within = (points: number[]) =>
    points.map((p) => Math.min(1, Math.max(0, p)));

/** Ambient wash laid over each frame so the sequence reads as one falling day. */
const HOUR_TINT: Record<Chapter["hour"], string> = {
    day: "rgba(120, 140, 170, 0.10)",
    afternoon: "rgba(180, 140, 90, 0.14)",
    dusk: "rgba(90, 70, 130, 0.22)",
    night: "rgba(20, 30, 70, 0.30)",
};

/**
 * One frame of the sequence. Owns its own scroll-derived transforms, which is why
 * it's a component rather than inlined — hooks can't run inside the chapters map.
 */
function ChapterFrame({
    chapter,
    index,
    count,
    progress,
    still,
}: {
    chapter: Chapter;
    index: number;
    count: number;
    progress: MotionValue<number>;
    still: boolean;
}) {
    const band = 1 / count;
    const start = index * band;
    const end = start + band;
    // Overlap between neighbouring frames. Must stay under half a band so the
    // useTransform input array remains strictly increasing.
    const fade = band * 0.35;

    const isFirst = index === 0;
    const isLast = index === count - 1;

    const range = within([start - fade, start + fade, end - fade, end + fade]);

    const opacity = useTransform(progress, range, [
        isFirst ? 1 : 0,
        1,
        1,
        isLast ? 1 : 0,
    ]);

    // The push. Held flat when the visitor has asked for reduced motion.
    const [from, to] = still ? [1, 1] : chapter.push;
    const scale = useTransform(
        progress,
        within([start - fade, end + fade]),
        [from, to]
    );

    return (
        <motion.div className="absolute inset-0" style={{ opacity }}>
            <motion.div
                className="absolute inset-0"
                style={{ scale, transformOrigin: chapter.origin }}
            >
                <Image
                    src={chapter.image}
                    alt={`${chapter.title} — ${chapter.label}`}
                    fill
                    priority={isFirst}
                    sizes="100vw"
                    className="object-cover"
                />
            </motion.div>

            {/* Time-of-day wash */}
            <div
                className="absolute inset-0 mix-blend-soft-light"
                style={{ backgroundColor: HOUR_TINT[chapter.hour] }}
            />
            {/* Hold the type legible against bright skies */}
            <div className="absolute inset-0 bg-gradient-to-r from-midnight/85 via-midnight/20 to-transparent" />
            <div className="absolute inset-0 bg-gradient-to-t from-midnight/80 via-transparent to-midnight/40" />
        </motion.div>
    );
}

/** The margin block: overline, title, caption. Drifts against the image. */
function ChapterCaption({
    chapter,
    index,
    count,
    progress,
    still,
}: {
    chapter: Chapter;
    index: number;
    count: number;
    progress: MotionValue<number>;
    still: boolean;
}) {
    const band = 1 / count;
    const start = index * band;
    const end = start + band;
    const pad = band * 0.22;

    const opacity = useTransform(
        progress,
        within([start - pad * 0.5, start + pad, end - pad * 1.4, end - pad * 0.2]),
        [0, 1, 1, 0]
    );
    const y = useTransform(
        progress,
        within([start - pad, end + pad]),
        still ? [0, 0] : [48, -48]
    );

    return (
        <motion.div
            className="absolute left-6 md:left-16 lg:left-24 bottom-24 md:bottom-auto md:top-1/2 md:-translate-y-1/2 max-w-[min(30rem,72vw)] z-20"
            style={{ opacity, y }}
        >
            <div className="flex items-center gap-4 mb-5">
                <span className="h-px w-10 bg-gold/60" />
                <span className="text-gold/90 text-[0.65rem] md:text-xs uppercase tracking-[0.32em]">
                    {chapter.label}
                </span>
            </div>

            <h2 className="font-serif text-4xl md:text-6xl font-bold text-cream leading-[1.05] tracking-tight">
                {chapter.title}
            </h2>

            {chapter.labelAr && (
                <p
                    className="font-arabic text-gold/50 text-lg md:text-2xl mt-3"
                    dir="rtl"
                >
                    {chapter.labelAr}
                </p>
            )}

            <p className="text-cream-muted/90 text-sm md:text-base font-light leading-relaxed mt-6 max-w-md">
                {chapter.caption}
            </p>
        </motion.div>
    );
}

/** Sheet-style tick rail, right margin. */
function ProgressRail({
    chapters,
    progress,
    count,
}: {
    chapters: Chapter[];
    progress: MotionValue<number>;
    count: number;
}) {
    return (
        <div className="absolute right-6 md:right-12 top-1/2 -translate-y-1/2 z-20 hidden sm:flex flex-col gap-5">
            {chapters.map((c, i) => {
                const band = 1 / count;
                return (
                    <Tick
                        key={c.label}
                        progress={progress}
                        start={i * band}
                        end={(i + 1) * band}
                        n={i + 1}
                    />
                );
            })}
        </div>
    );
}

function Tick({
    progress,
    start,
    end,
    n,
}: {
    progress: MotionValue<number>;
    start: number;
    end: number;
    n: number;
}) {
    const span = end - start;
    const active = useTransform(
        progress,
        within([
            start - span * 0.3,
            start + span * 0.2,
            end - span * 0.2,
            end + span * 0.3,
        ]),
        [0.25, 1, 1, 0.25]
    );
    const width = useTransform(active, [0.25, 1], [14, 34]);

    return (
        <div className="flex items-center gap-3 justify-end">
            <motion.span
                className="text-[0.6rem] text-gold tabular-nums tracking-widest"
                style={{ opacity: active }}
            >
                {String(n).padStart(2, "0")}
            </motion.span>
            <motion.span
                className="h-px bg-gold block"
                style={{ opacity: active, width }}
            />
        </div>
    );
}

export default function ProjectSequence({ project }: { project: Project }) {
    const ref = useRef<HTMLDivElement>(null);
    const still = useReducedMotion() ?? false;

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start start", "end end"],
    });

    const count = project.chapters.length;

    // The scroll hint only belongs on the first screen.
    const hintOpacity = useTransform(scrollYProgress, [0, 0.06], [1, 0]);

    return (
        <section
            ref={ref}
            className="relative"
            style={{ height: `${count * 100}vh` }}
            aria-label={`${project.title} — scroll sequence`}
        >
            <div className="sticky top-0 h-screen w-full overflow-hidden bg-midnight">
                {project.chapters.map((chapter, i) => (
                    <ChapterFrame
                        key={chapter.image}
                        chapter={chapter}
                        index={i}
                        count={count}
                        progress={scrollYProgress}
                        still={still}
                    />
                ))}

                {project.chapters.map((chapter, i) => (
                    <ChapterCaption
                        key={`cap-${chapter.image}`}
                        chapter={chapter}
                        index={i}
                        count={count}
                        progress={scrollYProgress}
                        still={still}
                    />
                ))}

                <ProgressRail
                    chapters={project.chapters}
                    progress={scrollYProgress}
                    count={count}
                />

                {/* Sheet header, fixed in the frame like a drawing title block */}
                <div className="absolute top-24 left-6 md:left-16 lg:left-24 z-20 hidden md:block">
                    <p className="text-warm-gray text-[0.6rem] uppercase tracking-[0.35em]">
                        {project.type} · {project.year}
                    </p>
                </div>

                <motion.div
                    className="absolute bottom-8 left-1/2 -translate-x-1/2 z-20 flex flex-col items-center gap-3"
                    style={{ opacity: hintOpacity }}
                >
                    <span className="text-warm-gray text-[0.6rem] uppercase tracking-[0.3em]">
                        Scroll
                    </span>
                    <motion.span
                        className="w-px h-10 bg-gradient-to-b from-gold to-transparent block"
                        animate={{ scaleY: [0, 1, 0] }}
                        transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                        style={{ transformOrigin: "top" }}
                    />
                </motion.div>
            </div>
        </section>
    );
}
