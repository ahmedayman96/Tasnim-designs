"use client";

import { motion } from "framer-motion";
import Link from "next/link";

export default function CheckoutCancel() {
    return (
        <div className="min-h-screen bg-midnight flex items-center justify-center px-6">
            <motion.div
                className="text-center max-w-lg"
                initial={{ opacity: 0, y: 30 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ duration: 0.8 }}
            >
                <div className="w-20 h-20 rounded-full bg-warm-gray/10 border border-warm-gray/20 flex items-center justify-center mx-auto mb-8">
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#8a8578" strokeWidth="2">
                        <circle cx="12" cy="12" r="10" />
                        <path d="M15 9l-6 6M9 9l6 6" />
                    </svg>
                </div>

                <h1 className="font-serif text-4xl font-bold text-cream mb-4">
                    Checkout Cancelled
                </h1>
                <p className="text-cream-muted text-lg leading-relaxed mb-8">
                    No worries — your items are still in your collection.
                    Come back whenever you&apos;re ready.
                </p>

                <Link
                    href="/"
                    className="inline-block px-8 py-3 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold text-sm uppercase tracking-[0.15em] hover:shadow-[0_0_30px_rgba(201,165,90,0.3)] transition-all"
                >
                    Return to Gallery
                </Link>
            </motion.div>
        </div>
    );
}
