"use client";

import Cal, { getCalApi } from "@calcom/embed-react";
import { motion } from "framer-motion";
import { useEffect } from "react";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";

export default function BookPage() {
    useEffect(() => {
        (async function () {
            const cal = await getCalApi();
            cal("ui", {
                theme: "dark",
                hideEventTypeDetails: false,
                layout: "month_view",
                cssVarsPerTheme: {
                    light: {
                        "cal-bg": "#0a0a0c",
                        "cal-brand": "#c9a55a",
                    },
                    dark: {
                        "cal-bg": "#0a0a0c",
                        "cal-bg-emphasis": "#141418",
                        "cal-border-subtle": "rgba(201,165,90,0.15)",
                        "cal-text": "#f5f0e8",
                        "cal-text-emphasis": "#f5f0e8",
                        "cal-brand": "#c9a55a",
                        "cal-brand-accent": "#b8944a",
                        "cal-brand-text": "#0a0a0c",
                    },
                },
            });
        })();
    }, []);

    return (
        <>
            <Navbar />
            <main className="min-h-screen bg-midnight pt-24 pb-16 px-6">
                {/* Background glow */}
                <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/[0.03] rounded-full blur-[150px] pointer-events-none" />

                <div className="max-w-4xl mx-auto">
                    {/* Header */}
                    <motion.div
                        className="text-center mb-12"
                        initial={{ opacity: 0, y: 30 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8 }}
                    >
                        <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4 font-medium">
                            Let&apos;s Connect · تواصلي معنا
                        </p>
                        <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream mb-6">
                            Book a Consultation
                        </h1>
                        <p className="text-cream-muted text-lg max-w-2xl mx-auto leading-relaxed">
                            Have questions about a piece? Interested in a custom commission?
                            Book a free 30-minute video call with Tasnim to discuss your vision.
                        </p>
                        <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-6" />
                    </motion.div>

                    {/* Cal.com Embed */}
                    <motion.div
                        className="rounded-2xl overflow-hidden border border-gold/10 bg-charcoal/30"
                        initial={{ opacity: 0, y: 20 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ duration: 0.8, delay: 0.2 }}
                    >
                        <Cal
                            calLink="tasnim-alyamani-tissin/30min"
                            style={{ width: "100%", height: "100%", overflow: "scroll", minHeight: "600px" }}
                            config={{
                                layout: "month_view",
                                theme: "dark",
                            }}
                        />
                    </motion.div>

                    {/* Additional Info */}
                    <motion.div
                        className="mt-16 grid grid-cols-1 md:grid-cols-3 gap-6"
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        transition={{ duration: 0.8, delay: 0.4 }}
                    >
                        {[
                            {
                                icon: "🎨",
                                title: "Custom Commissions",
                                desc: "Discuss bespoke artwork tailored to your space and style.",
                            },
                            {
                                icon: "📦",
                                title: "Shipping & Framing",
                                desc: "Learn about international shipping and framing options.",
                            },
                            {
                                icon: "💬",
                                title: "Questions",
                                desc: "Ask about techniques, materials, or anything that inspires you.",
                            },
                        ].map((item) => (
                            <div
                                key={item.title}
                                className="text-center p-6 rounded-xl border border-gold/5 bg-charcoal/20"
                            >
                                <span className="text-3xl mb-3 block">{item.icon}</span>
                                <h3 className="font-serif text-lg font-bold text-cream mb-2">
                                    {item.title}
                                </h3>
                                <p className="text-cream-muted/60 text-sm">{item.desc}</p>
                            </div>
                        ))}
                    </motion.div>
                </div>
            </main>
            <Footer />
        </>
    );
}
