"use client";

import Link from "next/link";

export default function Footer() {
    return (
        <footer className="relative border-t border-gold/5 bg-midnight">
            <div className="max-w-7xl mx-auto px-6 md:px-12 py-16">
                <div className="grid grid-cols-1 md:grid-cols-4 gap-12 md:gap-8">
                    {/* Brand */}
                    <div className="md:col-span-2">
                        <div className="flex items-center gap-3 mb-4">
                            <span className="font-serif text-2xl font-bold text-cream">
                                Tasnim Elyamani
                            </span>
                        </div>
                        <p
                            className="font-arabic text-gold/50 text-xl mb-4"
                            dir="rtl"
                        >
                            تسنيم اليماني — فن أصلي
                        </p>
                        <p className="text-warm-gray text-sm max-w-sm leading-relaxed">
                            Original art and portraits crafted with passion. Each piece tells a
                            unique story, bringing beauty and emotion into your space.
                        </p>
                    </div>

                    {/* Links */}
                    <div>
                        <h4 className="text-cream font-medium text-sm uppercase tracking-[0.2em] mb-4">
                            Explore
                        </h4>
                        <div className="flex flex-col gap-3">
                            {["Gallery", "About", "Contact"].map((link) => (
                                <Link
                                    key={link}
                                    href={`/#${link.toLowerCase()}`}
                                    className="text-warm-gray hover:text-gold text-sm transition-colors"
                                >
                                    {link}
                                </Link>
                            ))}
                        </div>
                    </div>

                    {/* Social */}
                    <div>
                        <h4 className="text-cream font-medium text-sm uppercase tracking-[0.2em] mb-4">
                            Connect
                        </h4>
                        <div className="flex flex-col gap-3">
                            {[
                                { label: "Instagram", href: "#" },
                                { label: "Pinterest", href: "#" },
                                { label: "TikTok", href: "#" },
                            ].map((s) => (
                                <a
                                    key={s.label}
                                    href={s.href}
                                    className="text-warm-gray hover:text-gold text-sm transition-colors"
                                    target="_blank"
                                    rel="noopener noreferrer"
                                >
                                    {s.label}
                                </a>
                            ))}
                        </div>
                    </div>
                </div>

                {/* Bottom */}
                <div className="mt-16 pt-8 border-t border-gold/5 flex flex-col md:flex-row justify-between items-center gap-4">
                    <span className="text-warm-gray/60 text-xs">
                        © 2026 Tasnim Elyamani. All rights reserved.
                    </span>
                    <span className="text-warm-gray/40 text-xs font-arabic" dir="rtl">
                        صُنع بحب وكثير من الألوان ♥
                    </span>
                </div>
            </div>
        </footer>
    );
}
