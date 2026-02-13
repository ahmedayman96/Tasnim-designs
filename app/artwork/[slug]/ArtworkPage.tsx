"use client";

import type { Artwork } from "@/lib/artworks";
import { useCart } from "@/lib/cart-context";
import { motion, useScroll, useTransform } from "framer-motion";
import Image from "next/image";
import Link from "next/link";
import { MagicCard } from "@/components/ui/magic-card";
import { RainbowButton } from "@/components/ui/rainbow-button";
import { useRef } from "react";

interface ArtworkPageProps {
    artwork: Artwork;
    related: Artwork[];
}

export default function ArtworkPage({ artwork, related }: ArtworkPageProps) {
    const { addToCart, items } = useCart();
    const isInCart = items.some((item) => item.artwork.slug === artwork.slug);
    const heroRef = useRef<HTMLDivElement>(null);
    const { scrollYProgress } = useScroll({
        target: heroRef,
        offset: ["start start", "end start"],
    });

    const imageScale = useTransform(scrollYProgress, [0, 1], [1, 1.15]);
    const imageY = useTransform(scrollYProgress, [0, 1], [0, 100]);
    const overlayOpacity = useTransform(scrollYProgress, [0, 0.5], [0.3, 0.7]);

    return (
        <div
            className="min-h-screen"
            style={{ backgroundColor: artwork.theme.bg }}
        >
            {/* Back button */}
            <motion.div
                className="fixed top-6 left-6 z-50"
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: 0.5 }}
            >
                <Link
                    href="/#gallery"
                    className="flex items-center gap-2 text-sm px-4 py-2 rounded-full border backdrop-blur-md transition-all hover:border-[var(--accent)] hover:text-[var(--accent)]"
                    style={{
                        borderColor: `${artwork.theme.accent}33`,
                        color: artwork.theme.textColor,
                        backgroundColor: `${artwork.theme.bg}cc`,
                        // @ts-expect-error CSS custom property
                        "--accent": artwork.theme.accent,
                    }}
                >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                        <path d="M19 12H5M12 19l-7-7 7-7" />
                    </svg>
                    Back
                </Link>
            </motion.div>

            {/* Hero — Full bleed artwork with parallax */}
            <section ref={heroRef} className="relative h-[80vh] overflow-hidden">
                <motion.div
                    className="absolute inset-0"
                    style={{ scale: imageScale, y: imageY }}
                >
                    <Image
                        src={artwork.image}
                        alt={artwork.title}
                        fill
                        className="object-cover"
                        priority
                        sizes="100vw"
                    />
                </motion.div>

                {/* Theme-colored overlay */}
                <motion.div
                    className="absolute inset-0"
                    style={{
                        background: `linear-gradient(to bottom, ${artwork.theme.bg}33, ${artwork.theme.bg})`,
                        opacity: overlayOpacity,
                    }}
                />

                {/* Bottom gradient */}
                <div
                    className="absolute bottom-0 left-0 right-0 h-48"
                    style={{
                        background: `linear-gradient(to top, ${artwork.theme.bg}, transparent)`,
                    }}
                />
            </section>

            {/* Content */}
            <section className="relative -mt-32 z-10 max-w-5xl mx-auto px-6 md:px-12 pb-24">
                {/* Title block */}
                <motion.div
                    initial={{ opacity: 0, y: 40 }}
                    animate={{ opacity: 1, y: 0 }}
                    transition={{ duration: 0.8, delay: 0.2 }}
                >
                    <p
                        className="font-arabic text-2xl md:text-3xl mb-2 opacity-60"
                        dir="rtl"
                        style={{ color: artwork.theme.accent }}
                    >
                        {artwork.titleAr}
                    </p>
                    <h1
                        className="font-serif text-5xl md:text-7xl font-bold mb-4"
                        style={{ color: artwork.theme.textColor }}
                    >
                        {artwork.title}
                    </h1>

                    <div className="flex flex-wrap items-center gap-4 mb-8">
                        <span
                            className="text-sm uppercase tracking-[0.2em] opacity-70"
                            style={{ color: artwork.theme.accent }}
                        >
                            {artwork.medium}
                        </span>
                        <span className="w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: artwork.theme.accent }} />
                        <span
                            className="text-sm opacity-50"
                            style={{ color: artwork.theme.textColor }}
                        >
                            {artwork.size}
                        </span>
                        <span className="w-1 h-1 rounded-full opacity-30" style={{ backgroundColor: artwork.theme.accent }} />
                        <span
                            className="text-sm opacity-50"
                            style={{ color: artwork.theme.textColor }}
                        >
                            {artwork.year}
                        </span>
                    </div>
                </motion.div>

                {/* Description + Story */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-12 mt-12">
                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6 }}
                    >
                        <h2
                            className="font-serif text-2xl font-bold mb-4"
                            style={{ color: artwork.theme.textColor }}
                        >
                            About This Piece
                        </h2>
                        <p
                            className="text-lg leading-relaxed opacity-70"
                            style={{ color: artwork.theme.textColor }}
                        >
                            {artwork.description}
                        </p>
                    </motion.div>

                    <motion.div
                        initial={{ opacity: 0, y: 30 }}
                        whileInView={{ opacity: 1, y: 0 }}
                        viewport={{ once: true }}
                        transition={{ duration: 0.6, delay: 0.2 }}
                    >
                        <h2
                            className="font-serif text-2xl font-bold mb-4"
                            style={{ color: artwork.theme.textColor }}
                        >
                            The Story
                        </h2>
                        <p
                            className="text-lg leading-relaxed opacity-70"
                            style={{ color: artwork.theme.textColor }}
                        >
                            {artwork.story}
                        </p>
                    </motion.div>
                </div>

                {/* Price + CTA */}
                <motion.div
                    className="mt-16 flex flex-col md:flex-row items-center justify-between gap-6 p-8 rounded-2xl border"
                    style={{
                        borderColor: `${artwork.theme.accent}15`,
                        backgroundColor: `${artwork.theme.accent}05`,
                    }}
                    initial={{ opacity: 0, y: 30 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                >
                    <div>
                        <p
                            className="text-sm uppercase tracking-[0.2em] opacity-50 mb-1"
                            style={{ color: artwork.theme.textColor }}
                        >
                            Price
                        </p>
                        <p
                            className="font-serif text-4xl font-bold"
                            style={{ color: artwork.theme.accent }}
                        >
                            ${artwork.price}
                        </p>
                    </div>
                    <div className="flex items-center gap-4">
                        <button
                            onClick={() => addToCart(artwork)}
                            disabled={isInCart}
                            className={`px-8 py-3 rounded-xl font-bold text-sm uppercase tracking-[0.15em] transition-all ${isInCart
                                    ? "bg-green-500/10 border border-green-500/30 text-green-400 cursor-default"
                                    : "bg-gradient-to-r from-gold via-gold-light to-gold text-midnight hover:shadow-[0_0_30px_rgba(201,165,90,0.3)]"
                                }`}
                        >
                            {isInCart ? "✓ In Collection" : "Add to Collection"}
                        </button>
                        <RainbowButton className="px-8 py-3">
                            Inquire
                        </RainbowButton>
                    </div>
                </motion.div>

                {/* Related Works */}
                {related.length > 0 && (
                    <div className="mt-24">
                        <h2
                            className="font-serif text-3xl font-bold mb-8"
                            style={{ color: artwork.theme.textColor }}
                        >
                            More Works
                        </h2>
                        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                            {related.map((r, i) => (
                                <motion.div
                                    key={r.slug}
                                    initial={{ opacity: 0, y: 20 }}
                                    whileInView={{ opacity: 1, y: 0 }}
                                    viewport={{ once: true }}
                                    transition={{ delay: i * 0.1 }}
                                >
                                    <Link href={`/artwork/${r.slug}`}>
                                        <MagicCard
                                            className="h-[300px] cursor-pointer overflow-hidden rounded-xl border-0 group"
                                            gradientColor={`${artwork.theme.accent}22`}
                                            gradientOpacity={0.15}
                                        >
                                            <div className="absolute inset-0">
                                                <Image
                                                    src={r.image}
                                                    alt={r.title}
                                                    fill
                                                    className="object-cover transition-transform duration-700 group-hover:scale-110"
                                                    sizes="33vw"
                                                />
                                            </div>
                                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent" />
                                            <div className="absolute bottom-4 left-4 right-4">
                                                <p
                                                    className="font-arabic text-sm opacity-50"
                                                    dir="rtl"
                                                    style={{ color: artwork.theme.accent }}
                                                >
                                                    {r.titleAr}
                                                </p>
                                                <p className="font-serif text-lg font-bold text-white">
                                                    {r.title}
                                                </p>
                                            </div>
                                        </MagicCard>
                                    </Link>
                                </motion.div>
                            ))}
                        </div>
                    </div>
                )}
            </section>
        </div>
    );
}
