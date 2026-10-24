"use client";

import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { Walkthrough } from "@/lib/architecture";

/**
 * How each room sits in the composition.
 *
 * Deliberately not a grid: a uniform row of equal cards reads like a listings
 * page. The rooms are offset against each other with generous space between
 * them, and drift at slightly different rates as the page scrolls, so the
 * arrangement feels composed rather than tabulated.
 */
const PLACEMENT = [
    { col: "md:col-start-1 md:col-span-6", drift: -60, scale: "md:aspect-[3/4]" },
    { col: "md:col-start-8 md:col-span-5 md:mt-32", drift: 40, scale: "md:aspect-[2/3]" },
    { col: "md:col-start-2 md:col-span-5 md:-mt-16", drift: -30, scale: "md:aspect-[2/3]" },
    { col: "md:col-start-8 md:col-span-5 md:mt-8", drift: 55, scale: "md:aspect-[3/4]" },
    { col: "md:col-start-1 md:col-span-5 md:mt-10", drift: -45, scale: "md:aspect-[2/3]" },
    { col: "md:col-start-7 md:col-span-6 md:-mt-8", drift: 30, scale: "md:aspect-[3/4]" },
];

function Room({ room, index }: { room: Walkthrough; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const place = PLACEMENT[index % PLACEMENT.length];

    const { scrollYProgress } = useScroll({
        target: ref,
        offset: ["start end", "end start"],
    });
    // Decorative only — if the animation loop is throttled the layout still stands.
    const y = useTransform(scrollYProgress, [0, 1], [place.drift, -place.drift]);

    return (
        <motion.div ref={ref} style={{ y }} className={`${place.col} group`}>
            <Link href={`/architecture/walkthrough/${room.slug}`} className="block">
                <div
                    className={`relative aspect-[4/5] ${place.scale} overflow-hidden bg-charcoal`}
                >
                    <Image
                        src={`${room.frames.dir}/f0001.webp`}
                        alt={room.title}
                        fill
                        sizes="(max-width: 768px) 100vw, 45vw"
                        className="object-cover transition-transform duration-[1200ms] ease-out group-hover:scale-[1.04]"
                    />
                    {/* A hairline that draws itself in on hover, instead of a card border */}
                    <span className="pointer-events-none absolute inset-0 border border-gold/0 group-hover:border-gold/30 transition-colors duration-700" />
                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/70 via-transparent to-transparent opacity-80" />
                </div>

                <div className="flex items-baseline gap-5 pt-6">
                    <span className="font-serif text-gold/50 text-sm tabular-nums tracking-widest">
                        {String(index + 1).padStart(2, "0")}
                    </span>
                    <div className="min-w-0">
                        <h3 className="font-serif text-2xl md:text-3xl text-cream group-hover:text-gold transition-colors duration-500">
                            {room.title}
                        </h3>
                        {room.titleAr && (
                            <p
                                className="font-arabic text-gold/40 text-lg mt-1 group-hover:text-gold/70 transition-colors duration-500"
                                dir="rtl"
                            >
                                {room.titleAr}
                            </p>
                        )}
                    </div>
                </div>
            </Link>
        </motion.div>
    );
}

export default function ProjectRooms({
    project,
    location,
    year,
    scope,
    rooms,
}: {
    project: string;
    location?: string;
    year?: number;
    scope?: string;
    rooms: Walkthrough[];
}) {
    return (
        <section className="relative px-6 md:px-12 py-20 md:py-28">
            <div className="max-w-6xl mx-auto">
                {/* The project, named once — the rooms belong to it rather than
                    standing alone under the service. */}
                <div className="max-w-2xl">
                    <div className="flex items-center gap-4 mb-7">
                        <span className="h-px w-12 bg-gold/50" />
                        <span className="text-gold/80 text-[0.6rem] uppercase tracking-[0.35em]">
                            Project
                        </span>
                    </div>

                    <h2 className="font-serif text-4xl md:text-5xl font-bold text-cream leading-[1.1]">
                        {project}
                    </h2>

                    <p className="text-warm-gray text-[0.65rem] uppercase tracking-[0.3em] mt-6">
                        {[location, year, scope].filter(Boolean).join("  ·  ")}
                    </p>

                    <p className="text-cream-muted/80 text-base font-light leading-relaxed mt-8">
                        {rooms.length} rooms, each walked end to end. Scroll any one of them
                        and the camera moves at your pace.
                    </p>
                </div>

                {/* The rooms */}
                <div className="grid grid-cols-1 md:grid-cols-12 gap-x-8 gap-y-20 md:gap-y-28 mt-20 md:mt-28">
                    {rooms.map((room, i) => (
                        <Room key={room.slug} room={room} index={i} />
                    ))}
                </div>
            </div>
        </section>
    );
}
