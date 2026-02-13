"use client";

import { useCart } from "@/lib/cart-context";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { useState } from "react";

export default function CartPanel() {
    const { items, removeFromCart, totalPrice, isOpen, setIsOpen } = useCart();
    const [isLoading, setIsLoading] = useState(false);

    const handleCheckout = async () => {
        setIsLoading(true);
        try {
            const res = await fetch("/api/checkout", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    items: items.map((item) => ({
                        title: item.artwork.title,
                        price: item.artwork.price,
                        image: item.artwork.image,
                        slug: item.artwork.slug,
                    })),
                }),
            });

            const data = await res.json();

            if (data.url) {
                window.location.href = data.url;
            } else {
                console.error("No checkout URL returned");
            }
        } catch (error) {
            console.error("Checkout error:", error);
        } finally {
            setIsLoading(false);
        }
    };

    return (
        <>
            {/* Cart Icon Button (fixed) */}
            <button
                onClick={() => setIsOpen(!isOpen)}
                className="fixed top-6 right-6 z-50 flex items-center gap-2 px-4 py-2.5 rounded-full bg-charcoal/80 backdrop-blur-md border border-gold/10 text-cream hover:border-gold/30 transition-all"
            >
                <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                    <path d="M6 2L3 6v14a2 2 0 002 2h14a2 2 0 002-2V6l-3-4z" />
                    <line x1="3" y1="6" x2="21" y2="6" />
                    <path d="M16 10a4 4 0 01-8 0" />
                </svg>
                {items.length > 0 && (
                    <span className="text-xs font-bold bg-gold text-midnight w-5 h-5 rounded-full flex items-center justify-center">
                        {items.length}
                    </span>
                )}
            </button>

            {/* Slide-out Panel */}
            <AnimatePresence>
                {isOpen && (
                    <>
                        {/* Backdrop */}
                        <motion.div
                            className="fixed inset-0 bg-midnight/60 backdrop-blur-sm z-50"
                            initial={{ opacity: 0 }}
                            animate={{ opacity: 1 }}
                            exit={{ opacity: 0 }}
                            onClick={() => setIsOpen(false)}
                        />

                        {/* Panel */}
                        <motion.div
                            className="fixed top-0 right-0 h-full w-full max-w-md bg-charcoal border-l border-gold/10 z-50 flex flex-col"
                            initial={{ x: "100%" }}
                            animate={{ x: 0 }}
                            exit={{ x: "100%" }}
                            transition={{ type: "spring", damping: 25, stiffness: 200 }}
                        >
                            {/* Header */}
                            <div className="flex items-center justify-between p-6 border-b border-gold/10">
                                <h2 className="font-serif text-xl font-bold text-cream">
                                    Your Collection
                                </h2>
                                <button
                                    onClick={() => setIsOpen(false)}
                                    className="text-warm-gray hover:text-cream transition-colors p-1"
                                >
                                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                        <path d="M18 6L6 18M6 6l12 12" />
                                    </svg>
                                </button>
                            </div>

                            {/* Items */}
                            <div className="flex-1 overflow-y-auto p-6 space-y-4">
                                {items.length === 0 ? (
                                    <div className="flex flex-col items-center justify-center h-full text-center">
                                        <p className="text-warm-gray text-lg mb-2">Your collection is empty</p>
                                        <p className="text-warm-gray/60 text-sm">
                                            Browse the gallery and add pieces you love
                                        </p>
                                    </div>
                                ) : (
                                    items.map((item) => (
                                        <motion.div
                                            key={item.artwork.slug}
                                            layout
                                            initial={{ opacity: 0, y: 20 }}
                                            animate={{ opacity: 1, y: 0 }}
                                            exit={{ opacity: 0, x: 100 }}
                                            className="flex gap-4 p-3 rounded-xl bg-charcoal-light/50 border border-gold/5 group"
                                        >
                                            <div className="relative w-20 h-20 rounded-lg overflow-hidden flex-shrink-0">
                                                <Image
                                                    src={item.artwork.image}
                                                    alt={item.artwork.title}
                                                    fill
                                                    className="object-cover"
                                                    sizes="80px"
                                                />
                                            </div>
                                            <div className="flex-1 min-w-0">
                                                <h3 className="font-serif text-sm font-bold text-cream truncate">
                                                    {item.artwork.title}
                                                </h3>
                                                <p className="font-arabic text-gold/50 text-xs" dir="rtl">
                                                    {item.artwork.titleAr}
                                                </p>
                                                <p className="text-warm-gray text-xs mt-1">
                                                    {item.artwork.medium}
                                                </p>
                                                <p className="text-gold font-serif font-bold mt-1">
                                                    ${item.artwork.price}
                                                </p>
                                            </div>
                                            <button
                                                onClick={() => removeFromCart(item.artwork.slug)}
                                                className="text-warm-gray/40 hover:text-red-400 transition-colors self-center opacity-0 group-hover:opacity-100"
                                            >
                                                <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                                    <path d="M3 6h18M19 6v14a2 2 0 01-2 2H7a2 2 0 01-2-2V6m3 0V4a2 2 0 012-2h4a2 2 0 012 2v2" />
                                                </svg>
                                            </button>
                                        </motion.div>
                                    ))
                                )}
                            </div>

                            {/* Footer / Checkout */}
                            {items.length > 0 && (
                                <div className="p-6 border-t border-gold/10 space-y-4">
                                    <div className="flex justify-between items-center">
                                        <span className="text-warm-gray text-sm">Total</span>
                                        <span className="font-serif text-2xl font-bold text-gold">
                                            ${totalPrice}
                                        </span>
                                    </div>
                                    <button
                                        onClick={handleCheckout}
                                        disabled={isLoading}
                                        className="w-full py-3.5 rounded-xl bg-gradient-to-r from-gold via-gold-light to-gold text-midnight font-bold text-sm uppercase tracking-[0.15em] hover:shadow-[0_0_30px_rgba(201,165,90,0.3)] transition-all disabled:opacity-50 disabled:cursor-wait"
                                    >
                                        {isLoading ? (
                                            <span className="flex items-center justify-center gap-2">
                                                <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24">
                                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" fill="none" />
                                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
                                                </svg>
                                                Processing...
                                            </span>
                                        ) : (
                                            "Secure Checkout"
                                        )}
                                    </button>
                                    <p className="text-warm-gray/40 text-xs text-center flex items-center justify-center gap-1.5">
                                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                                            <rect x="3" y="11" width="18" height="11" rx="2" ry="2" />
                                            <path d="M7 11V7a5 5 0 0110 0v4" />
                                        </svg>
                                        Secured by Stripe · 256-bit SSL encryption
                                    </p>
                                </div>
                            )}
                        </motion.div>
                    </>
                )}
            </AnimatePresence>
        </>
    );
}
