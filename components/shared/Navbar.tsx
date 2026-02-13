"use client";

import Link from "next/link";
import { motion, useScroll, useTransform } from "framer-motion";
import { useState } from "react";

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    const { scrollY } = useScroll();
    const bgOpacity = useTransform(scrollY, [0, 200], [0, 0.9]);
    const blur = useTransform(scrollY, [0, 200], [0, 20]);

    const links = [
        { href: "/#gallery", label: "Gallery" },
        { href: "/#about", label: "About" },
        { href: "/book", label: "Book a Call" },
        { href: "/#contact", label: "Contact" },
    ];

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12"
            style={{
                backgroundColor: useTransform(bgOpacity, (v) => `rgba(10, 10, 12, ${v})`),
                backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
            }}
        >
            <div className="max-w-7xl mx-auto flex items-center justify-between h-20">
                {/* Logo */}
                <Link href="/" className="flex items-center gap-3 group">
                    <span className="font-serif text-xl font-bold text-cream group-hover:text-gold transition-colors">
                        Tasnim
                    </span>
                    <span className="text-gold/40 font-light">|</span>
                    <span
                        className="font-arabic text-gold/70 text-lg group-hover:text-gold transition-colors"
                        dir="rtl"
                    >
                        تسنيم
                    </span>
                </Link>

                {/* Desktop Links */}
                <div className="hidden md:flex items-center gap-10">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            className="text-cream-muted hover:text-gold text-sm uppercase tracking-[0.2em] transition-colors duration-300 relative group"
                        >
                            {link.label}
                            <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
                        </Link>
                    ))}
                </div>

                {/* Mobile Toggle */}
                <button
                    className="md:hidden flex flex-col gap-1.5 p-2"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                >
                    <motion.span
                        className="block w-6 h-px bg-cream"
                        animate={isOpen ? { rotate: 45, y: 5 } : { rotate: 0, y: 0 }}
                    />
                    <motion.span
                        className="block w-6 h-px bg-cream"
                        animate={isOpen ? { opacity: 0 } : { opacity: 1 }}
                    />
                    <motion.span
                        className="block w-6 h-px bg-cream"
                        animate={isOpen ? { rotate: -45, y: -5 } : { rotate: 0, y: 0 }}
                    />
                </button>
            </div>

            {/* Mobile Menu */}
            <motion.div
                className="md:hidden overflow-hidden"
                initial={false}
                animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
                transition={{ duration: 0.3, ease: "easeInOut" }}
            >
                <div className="py-6 flex flex-col gap-6 border-t border-gold/10">
                    {links.map((link) => (
                        <Link
                            key={link.href}
                            href={link.href}
                            onClick={() => setIsOpen(false)}
                            className="text-cream-muted hover:text-gold text-lg tracking-wider transition-colors"
                        >
                            {link.label}
                        </Link>
                    ))}
                </div>
            </motion.div>
        </motion.nav>
    );
}
