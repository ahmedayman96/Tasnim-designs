"use client";

import { MagicCard } from "@/components/ui/magic-card";
import { artworks } from "@/lib/artworks";
import { motion, useInView } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { useRef } from "react";

export default function BentoGallery() {
    const ref = useRef<HTMLDivElement>(null);
    const isInView = useInView(ref, { once: true, margin: "-100px" });

    return (
        <section className="relative py-24 md:py-32 px-6 md:px-12" id="gallery">
            {/* Background glow */}
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[600px] bg-gold/[0.02] rounded-full blur-[150px] pointer-events-none" />

            <div className="max-w-7xl mx-auto">
                {/* Section Header */}
                <motion.div
                    className="text-center mb-16"
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ duration: 0.8 }}
                >
                    <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4 font-medium">
                        Selected Works · أعمال مختارة
                    </p>
                    <h2 className="font-serif text-4xl md:text-6xl font-bold text-cream mb-4">
                        The Collection
                    </h2>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto" />
                </motion.div>

                {/* Bento Grid */}
                <div
                    ref={ref}
                    className="grid grid-cols-1 md:grid-cols-3 auto-rows-[280px] md:auto-rows-[320px] gap-4"
                >
                    {artworks.map((artwork, i) => (
                        <motion.div
                            key={artwork.slug}
                            className={`${artwork.gridSpan || ""} relative`}
                            initial={{ opacity: 0, y: 40, scale: 0.95 }}
                            animate={isInView ? { opacity: 1, y: 0, scale: 1 } : {}}
                            transition={{ duration: 0.7, delay: i * 0.15, ease: [0.25, 0.1, 0, 1] }}
                        >
                            <Link href={`/artwork/${artwork.slug}`} className="block h-full">
                                <MagicCard
                                    className="h-full cursor-pointer overflow-hidden rounded-xl border-0 bg-charcoal group"
                                    gradientColor="rgba(201, 165, 90, 0.15)"
                                    gradientOpacity={0.15}
                                >
                                    {/* Image */}
                                    <div className="absolute inset-0">
                                        <Image
                                            src={artwork.image}
                                            alt={artwork.title}
                                            fill
                                            className="object-cover transition-transform duration-700 ease-out group-hover:scale-110"
                                            sizes="(max-width: 768px) 100vw, (max-width: 1200px) 50vw, 33vw"
                                        />
                                    </div>

                                    {/* Default overlay gradient */}
                                    <div className="absolute inset-0 bg-gradient-to-t from-midnight/90 via-midnight/20 to-transparent transition-all duration-500" />

                                    {/* Hover overlay with story */}
                                    <div className="absolute inset-0 bg-midnight/80 backdrop-blur-sm opacity-0 group-hover:opacity-100 transition-all duration-500 flex flex-col justify-center items-center p-6 md:p-8 text-center">
                                        <p
                                            className="font-arabic text-gold/70 text-lg mb-2"
                                            dir="rtl"
                                        >
                                            {artwork.titleAr}
                                        </p>
                                        <h3 className="font-serif text-2xl md:text-3xl font-bold text-cream mb-2">
                                            {artwork.title}
                                        </h3>
                                        <p className="text-cream-muted text-sm mb-4 max-w-xs">
                                            {artwork.description}
                                        </p>
                                        <span className="text-gold text-sm font-medium tracking-wider uppercase">
                                            {artwork.medium} · {artwork.size}
                                        </span>
                                    </div>

                                    {/* Bottom label (default state) */}
                                    <div className="absolute bottom-0 left-0 right-0 p-4 md:p-6 transition-opacity duration-500 group-hover:opacity-0">
                                        <div className="flex items-end justify-between">
                                            <div>
                                                <h3 className="font-serif text-xl md:text-2xl font-bold text-cream">
                                                    {artwork.title}
                                                </h3>
                                                <p className="text-cream-muted/60 text-sm mt-1">
                                                    {artwork.medium}
                                                </p>
                                            </div>
                                            <span className="text-gold font-serif text-lg font-bold">
                                                ${artwork.price}
                                            </span>
                                        </div>
                                    </div>
                                </MagicCard>
                            </Link>
                        </motion.div>
                    ))}
                </div>
            </div>
        </section>
    );
}
