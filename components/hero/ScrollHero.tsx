"use client";

import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import { useRef } from "react";

export default function ScrollHero() {
    const containerRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: containerRef,
        offset: ["start start", "end start"],
    });

    // Artwork reveal: goes from blurry/desaturated to full vivid
    const blur = useTransform(scrollYProgress, [0, 0.4], [20, 0]);
    const saturation = useTransform(scrollYProgress, [0, 0.5], [0, 1.2]);
    const scale = useTransform(scrollYProgress, [0, 0.5], [1.15, 1]);
    const imageOpacity = useTransform(scrollYProgress, [0, 0.3], [0.3, 1]);

    // Overlay "canvas" texture fades out
    const canvasOpacity = useTransform(scrollYProgress, [0, 0.4], [0.7, 0]);

    // Text animations
    const textY = useTransform(scrollYProgress, [0, 0.3], [0, -60]);
    const textOpacity = useTransform(scrollYProgress, [0.25, 0.45], [1, 0]);

    // Arabic name floats from right
    const arabicX = useTransform(scrollYProgress, [0, 0.3], [40, 0]);
    const arabicOpacity = useTransform(scrollYProgress, [0, 0.15], [0, 1]);

    return (
        <section
            ref={containerRef}
            className="relative h-[200vh]"
        >
            <div className="sticky top-0 h-screen w-full overflow-hidden">
                {/* Background Artwork Image */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        filter: useTransform(
                            [blur, saturation],
                            ([b, s]) => `blur(${b}px) saturate(${s})`
                        ),
                        scale,
                        opacity: imageOpacity,
                    }}
                >
                    <Image
                        src="/images/artwork-1.png"
                        alt="Cubist Portrait by Tasnim Elyamani"
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                </motion.div>

                {/* Canvas texture overlay — fades as you scroll */}
                <motion.div
                    className="absolute inset-0 bg-[#1a1815]"
                    style={{ opacity: canvasOpacity }}
                >
                    {/* Canvas grain texture */}
                    <div
                        className="absolute inset-0 opacity-30"
                        style={{
                            backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.65' numOctaves='3' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E")`,
                            backgroundSize: "200px 200px",
                        }}
                    />
                    {/* Subtle cross-hatch pattern (canvas weave) */}
                    <div
                        className="absolute inset-0 opacity-10"
                        style={{
                            backgroundImage: `repeating-linear-gradient(
                0deg, transparent, transparent 3px, rgba(160,140,100,0.1) 3px, rgba(160,140,100,0.1) 4px
              ), repeating-linear-gradient(
                90deg, transparent, transparent 3px, rgba(160,140,100,0.1) 3px, rgba(160,140,100,0.1) 4px
              )`,
                        }}
                    />
                </motion.div>

                {/* Dark vignette */}
                <div className="absolute inset-0 bg-gradient-to-t from-midnight via-midnight/40 to-transparent" />
                <div className="absolute inset-0 bg-gradient-to-r from-midnight/60 via-transparent to-midnight/60" />

                {/* Text Overlay — Anti-Contrast with Reveal */}
                <motion.div
                    className="absolute inset-0 flex flex-col items-center justify-center z-10 px-8"
                    style={{ y: textY, opacity: textOpacity }}
                >
                    {/* Arabic Name */}
                    <motion.p
                        className="font-arabic text-gold/60 text-2xl md:text-4xl mb-4 tracking-wider"
                        style={{ x: arabicX, opacity: arabicOpacity }}
                        dir="rtl"
                    >
                        تسنيم اليماني
                    </motion.p>

                    {/* Main Hook */}
                    <h1 className="text-center max-w-4xl">
                        <motion.span
                            className="block font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-[1.05] tracking-tight"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.3, ease: [0.25, 0.1, 0, 1] }}
                        >
                            Designs as{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold via-gold-light to-gold">
                                Unique
                            </span>
                        </motion.span>
                        <motion.span
                            className="block font-serif text-5xl md:text-7xl lg:text-8xl font-bold text-cream leading-[1.05] tracking-tight mt-2"
                            initial={{ opacity: 0, y: 40 }}
                            animate={{ opacity: 1, y: 0 }}
                            transition={{ duration: 1, delay: 0.5, ease: [0.25, 0.1, 0, 1] }}
                        >
                            as{" "}
                            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gold-light via-gold to-gold-dark italic">
                                You Are
                            </span>
                        </motion.span>
                    </h1>

                    {/* Subtitle */}
                    <motion.p
                        className="text-cream-muted text-lg md:text-xl mt-8 max-w-xl text-center font-light tracking-wide"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.9 }}
                    >
                        Original art, portraits & handcrafted designs by Tasnim Elyamani
                    </motion.p>

                    {/* Scroll indicator */}
                    <motion.div
                        className="absolute bottom-12 flex flex-col items-center gap-3"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ delay: 2 }}
                    >
                        <span className="text-warm-gray text-xs uppercase tracking-[0.3em]">
                            Scroll to reveal
                        </span>
                        <motion.div
                            className="w-px h-12 bg-gradient-to-b from-gold to-transparent"
                            animate={{ scaleY: [0, 1, 0] }}
                            transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                            style={{ transformOrigin: "top" }}
                        />
                    </motion.div>
                </motion.div>
            </div>
        </section>
    );
}
