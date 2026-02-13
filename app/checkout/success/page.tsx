"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { useEffect, useState } from "react";

export default function CheckoutSuccess() {
    const [sessionId, setSessionId] = useState<string | null>(null);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        setSessionId(params.get("session_id"));
        // Clear the cart
        localStorage.removeItem("tasneem-cart");
    }, []);

    return (
        <div className="min-h-screen bg-midnight flex items-center justify-center px-6">
            <motion.div
                className="text-center max-w-lg"
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ duration: 0.8, ease: [0.25, 0.1, 0, 1] }}
            >
                {/* Success Icon */}
                <motion.div
                    className="w-20 h-20 rounded-full bg-green-500/10 border border-green-500/30 flex items-center justify-center mx-auto mb-8"
                    initial={{ scale: 0 }}
                    animate={{ scale: 1 }}
                    transition={{ delay: 0.3, type: "spring", damping: 12 }}
                >
                    <svg width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="#22c55e" strokeWidth="2">
                        <path d="M20 6L9 17l-5-5" />
                    </svg>
                </motion.div>

                <p className="font-arabic text-gold/50 text-lg mb-2" dir="rtl">
                    شكراً لك ♥
                </p>
                <h1 className="font-serif text-4xl md:text-5xl font-bold text-cream mb-4">
                    Thank You!
                </h1>
                <p className="text-cream-muted text-lg leading-relaxed mb-8">
                    Your order has been placed successfully. Tasnim will hand-prepare your artwork
                    with love and care. You&apos;ll receive a confirmation email shortly.
                </p>

                {sessionId && (
                    <p className="text-warm-gray/40 text-xs mb-8 font-mono">
                        Order ref: {sessionId.slice(0, 20)}...
                    </p>
                )}

                <Link
                    href="/"
                    className="inline-block px-8 py-3 rounded-xl bg-charcoal border border-gold/10 text-cream hover:border-gold/30 transition-all font-medium"
                >
                    ← Back to Gallery
                </Link>
            </motion.div>
        </div>
    );
}
