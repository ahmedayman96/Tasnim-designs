"use client";

import Link from "next/link";
import { motion, AnimatePresence, useScroll, useTransform } from "framer-motion";
import { useState } from "react";

type NavLink = {
    href: string;
    label: string;
    children?: { href: string; label: string; hint?: string }[];
};

export default function Navbar() {
    const [isOpen, setIsOpen] = useState(false);
    /** Which desktop dropdown is showing, by label. */
    const [openMenu, setOpenMenu] = useState<string | null>(null);
    /** Which mobile group is expanded. */
    const [openGroup, setOpenGroup] = useState<string | null>(null);

    const { scrollY } = useScroll();
    const bgOpacity = useTransform(scrollY, [0, 200], [0, 0.9]);
    const blur = useTransform(scrollY, [0, 200], [0, 20]);

    const links: NavLink[] = [
        {
            href: "/#gallery",
            label: "Gallery",
            children: [
                { href: "/#gallery", label: "The Collection", hint: "Paintings & collages" },
                { href: "/gallery-3d", label: "3D Gallery", hint: "Walk through the room" },
            ],
        },
        { href: "/pieces", label: "Art Pieces" },
        { href: "/architecture", label: "Architecture" },
        { href: "/preview", label: "Room Preview" },
        { href: "/#about", label: "About" },
        { href: "/book", label: "Book a Call" },
        { href: "/#contact", label: "Contact" },
    ];

    const closeAll = () => {
        setIsOpen(false);
        setOpenMenu(null);
        setOpenGroup(null);
    };

    return (
        <motion.nav
            className="fixed top-0 left-0 right-0 z-50 px-6 md:px-12"
            style={{
                backgroundColor: useTransform(bgOpacity, (v) => `rgba(10, 10, 12, ${v})`),
                backdropFilter: useTransform(blur, (v) => `blur(${v}px)`),
            }}
            onKeyDown={(e) => {
                if (e.key === "Escape") closeAll();
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
                    {links.map((link) =>
                        link.children ? (
                            <div
                                key={link.label}
                                className="relative"
                                onMouseEnter={() => setOpenMenu(link.label)}
                                onMouseLeave={() => setOpenMenu(null)}
                                onFocus={() => setOpenMenu(link.label)}
                                onBlur={(e) => {
                                    // Only close once focus has left the whole group,
                                    // not when moving between items inside it.
                                    if (!e.currentTarget.contains(e.relatedTarget as Node)) {
                                        setOpenMenu(null);
                                    }
                                }}
                            >
                                <button
                                    type="button"
                                    aria-expanded={openMenu === link.label}
                                    aria-haspopup="true"
                                    onClick={() =>
                                        setOpenMenu(openMenu === link.label ? null : link.label)
                                    }
                                    className="relative flex items-center gap-1.5 text-cream-muted hover:text-gold text-sm uppercase tracking-[0.2em] transition-colors duration-300 group"
                                >
                                    {link.label}
                                    <motion.span
                                        className="text-gold/50 text-[0.6rem] leading-none"
                                        animate={{ rotate: openMenu === link.label ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        &#9662;
                                    </motion.span>
                                    <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
                                </button>

                                <AnimatePresence>
                                    {openMenu === link.label && (
                                        <motion.div
                                            // Padding rather than margin, so the cursor never
                                            // crosses a gap on its way down and closes the menu.
                                            className="absolute left-1/2 -translate-x-1/2 top-full pt-4 z-50"
                                            initial={{ opacity: 0, y: -8 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, y: -8 }}
                                            transition={{ duration: 0.2, ease: [0.25, 0.1, 0, 1] }}
                                        >
                                            <div className="min-w-[15rem] rounded-xl border border-gold/10 bg-charcoal/95 backdrop-blur-xl p-2 shadow-2xl shadow-black/50">
                                                {link.children.map((child) => (
                                                    <Link
                                                        key={child.href}
                                                        href={child.href}
                                                        onClick={closeAll}
                                                        className="block rounded-lg px-4 py-3 hover:bg-gold/5 transition-colors group/item"
                                                    >
                                                        <span className="block text-cream group-hover/item:text-gold text-sm tracking-wide transition-colors">
                                                            {child.label}
                                                        </span>
                                                        {child.hint && (
                                                            <span className="block text-warm-gray text-xs mt-0.5 font-light">
                                                                {child.hint}
                                                            </span>
                                                        )}
                                                    </Link>
                                                ))}
                                            </div>
                                        </motion.div>
                                    )}
                                </AnimatePresence>
                            </div>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                className="text-cream-muted hover:text-gold text-sm uppercase tracking-[0.2em] transition-colors duration-300 relative group"
                            >
                                {link.label}
                                <span className="absolute -bottom-1 left-0 w-0 h-px bg-gold transition-all duration-300 group-hover:w-full" />
                            </Link>
                        )
                    )}
                </div>

                {/* Mobile Toggle (offset left so it clears the fixed cart button) */}
                <button
                    className="md:hidden flex flex-col gap-1.5 p-2 mr-16"
                    onClick={() => setIsOpen(!isOpen)}
                    aria-label="Toggle menu"
                    aria-expanded={isOpen}
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
                    {links.map((link) =>
                        link.children ? (
                            <div key={link.label}>
                                <button
                                    type="button"
                                    onClick={() =>
                                        setOpenGroup(openGroup === link.label ? null : link.label)
                                    }
                                    aria-expanded={openGroup === link.label}
                                    className="flex items-center gap-2 text-cream-muted hover:text-gold text-lg tracking-wider transition-colors"
                                >
                                    {link.label}
                                    <motion.span
                                        className="text-gold/50 text-xs"
                                        animate={{ rotate: openGroup === link.label ? 180 : 0 }}
                                        transition={{ duration: 0.2 }}
                                    >
                                        &#9662;
                                    </motion.span>
                                </button>
                                <motion.div
                                    className="overflow-hidden"
                                    initial={false}
                                    animate={{
                                        height: openGroup === link.label ? "auto" : 0,
                                        opacity: openGroup === link.label ? 1 : 0,
                                    }}
                                    transition={{ duration: 0.25, ease: "easeInOut" }}
                                >
                                    <div className="flex flex-col gap-4 pt-4 pl-4 border-l border-gold/10 ml-1">
                                        {link.children.map((child) => (
                                            <Link
                                                key={child.href}
                                                href={child.href}
                                                onClick={closeAll}
                                                className="text-cream-muted hover:text-gold text-base tracking-wide transition-colors"
                                            >
                                                {child.label}
                                            </Link>
                                        ))}
                                    </div>
                                </motion.div>
                            </div>
                        ) : (
                            <Link
                                key={link.href}
                                href={link.href}
                                onClick={closeAll}
                                className="text-cream-muted hover:text-gold text-lg tracking-wider transition-colors"
                            >
                                {link.label}
                            </Link>
                        )
                    )}
                </div>
            </motion.div>
        </motion.nav>
    );
}
