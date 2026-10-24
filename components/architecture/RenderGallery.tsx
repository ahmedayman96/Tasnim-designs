"use client";

import Image from "next/image";
import { useRef } from "react";
import { motion, useScroll, useTransform } from "framer-motion";
import type { ArchitectureWork } from "@/lib/architecture";

/**
 * A rendered room, shown as a set rather than a single hero.
 *
 * The first render runs large; the rest sit beneath it at varying widths and
 * drift at different rates, so a scheme reads as a body of views of one room
 * instead of a row of thumbnails.
 */
function Plate({ src, alt, index }: { src: string; alt: string; index: number }) {
    const ref = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({ target: ref, offset: ["start end", "end start"] });
    const drift = index % 2 === 0 ? 34 : -26;
    const y = useTransform(scrollYProgress, [0, 1], [drift, -drift]);

    return (
        <motion.div ref={ref} style={{ y }} className="group relative overflow-hidden">
            <div className="relative aspect-[4/3] bg-charcoal overflow-hidden">
                <Image
                    src={src}
                    alt={alt}
                    fill
                    sizes="(max-width: 768px) 100vw, 45vw"
                    className="object-cover transition-transform duration-[1400ms] ease-out group-hover:scale-[1.03]"
                />
                <span className="pointer-events-none absolute inset-0 border border-gold/0 group-hover:border-gold/25 transition-colors duration-700" />
            </div>
        </motion.div>
    );
}

export default function RenderGallery({ work, index }: { work: ArchitectureWork; index: number }) {
    const [hero, ...rest] = work.images;

    return (
        <section className="relative">
            {/* Room title, set against the first view */}
            <div className="grid md:grid-cols-12 gap-x-10 gap-y-10 items-end">
                <div className="md:col-span-4">
                    <div className="flex items-baseline gap-4">
                        <span className="font-serif text-gold/50 text-sm tabular-nums tracking-widest">
                            {String(index + 1).padStart(2, "0")}
                        </span>
                        <div>
                            <h3 className="font-serif text-3xl md:text-4xl text-cream leading-tight">
                                {work.title}
                            </h3>
                            {work.titleAr && (
                                <p className="font-arabic text-gold/50 text-xl mt-1.5" dir="rtl">
                                    {work.titleAr}
                                </p>
                            )}
                        </div>
                    </div>
                    <p className="text-cream-muted/80 text-sm font-light leading-relaxed mt-7">
                        {work.description}
                    </p>
                    <p className="text-warm-gray text-[0.6rem] uppercase tracking-[0.3em] mt-7">
                        {work.images.length} views
                    </p>
                </div>

                <div className="md:col-span-8">
                    {hero && <Plate src={hero} alt={work.title} index={0} />}
                </div>
            </div>

            {/* The remaining views */}
            {rest.length > 0 && (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 md:gap-8 mt-10 md:mt-14">
                    {rest.map((src, i) => (
                        <Plate key={src} src={src} alt={`${work.title} — view ${i + 2}`} index={i + 1} />
                    ))}
                </div>
            )}
        </section>
    );
}
