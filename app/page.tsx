"use client";

import Navbar from "@/components/shared/Navbar";
import ScrollHero from "@/components/hero/ScrollHero";
import BentoGallery from "@/components/gallery/BentoGallery";
import TextReveal from "@/components/shared/TextReveal";
import Footer from "@/components/shared/Footer";
import { RainbowButton } from "@/components/ui/rainbow-button";
import {
  ScrollVelocityContainer,
  ScrollVelocityRow,
} from "@/components/ui/scroll-based-velocity";
import { motion } from "framer-motion";
import Image from "next/image";

export default function Home() {
  return (
    <main className="bg-midnight min-h-screen">
      <Navbar />

      {/* ---- Hero: Scroll-driven canvas → masterpiece ---- */}
      <ScrollHero />

      {/* ---- Velocity Scroll Marquee ---- */}
      <section className="py-8 border-y border-gold/5 overflow-hidden bg-charcoal/30">
        <ScrollVelocityContainer className="text-3xl md:text-5xl font-serif font-bold">
          <ScrollVelocityRow baseVelocity={15} direction={1}>
            <span className="text-cream/10 mx-8">Mixed Media</span>
            <span className="text-gold/20 mx-8">✦</span>
            <span className="text-cream/10 mx-8">Portraits</span>
            <span className="text-gold/20 mx-8">✦</span>
            <span className="text-cream/10 mx-8">Collage</span>
            <span className="text-gold/20 mx-8">✦</span>
            <span className="text-cream/10 font-arabic mx-8" dir="rtl">فن أصلي</span>
            <span className="text-gold/20 mx-8">✦</span>
            <span className="text-cream/10 mx-8">Oil on Canvas</span>
            <span className="text-gold/20 mx-8">✦</span>
          </ScrollVelocityRow>
        </ScrollVelocityContainer>
      </section>

      {/* ---- Bento Grid Gallery ---- */}
      <BentoGallery />

      {/* ---- About Section ---- */}
      <section className="relative py-24 md:py-32 px-6 md:px-12" id="about">
        <div className="absolute top-0 right-0 w-[500px] h-[500px] bg-gold/[0.015] rounded-full blur-[200px] pointer-events-none" />

        <div className="max-w-7xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-16 items-center">
            {/* Image side */}
            <motion.div
              className="relative aspect-[4/5] rounded-2xl overflow-hidden"
              initial={{ opacity: 0, x: -40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8 }}
            >
              <Image
                src="/images/artwork-3.png"
                alt="Tasnim Elyamani — Artist"
                fill
                className="object-cover"
                sizes="(max-width: 768px) 100vw, 50vw"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-midnight/60 to-transparent" />

              {/* Floating label */}
              <div className="absolute bottom-6 left-6 right-6">
                <div className="bg-charcoal/80 backdrop-blur-md rounded-lg p-4 border border-gold/10">
                  <p className="font-arabic text-gold text-lg" dir="rtl">
                    الفن لغتي
                  </p>
                  <p className="text-cream-muted text-sm">Art is my language</p>
                </div>
              </div>
            </motion.div>

            {/* Text side */}
            <motion.div
              initial={{ opacity: 0, x: 40 }}
              whileInView={{ opacity: 1, x: 0 }}
              viewport={{ once: true }}
              transition={{ duration: 0.8, delay: 0.2 }}
            >
              <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">
                The Artist
              </p>
              <h2 className="font-serif text-4xl md:text-5xl font-bold text-cream mb-2">
                Tasnim Elyamani
              </h2>
              <p className="font-arabic text-gold/50 text-xl mb-8" dir="rtl">
                تسنيم اليماني
              </p>

              <TextReveal
                className="text-cream-muted text-lg leading-relaxed"
                delay={0.3}
              >
                Art has always been my language — a way to express what words cannot capture. Every stroke, every shade, every composition is a piece of my heart translated onto canvas.
              </TextReveal>

              <div className="mt-6">
                <TextReveal
                  className="text-cream-muted text-lg leading-relaxed"
                  delay={0.8}
                >
                  From delicate pencil portraits to bold mixed-media collages, I create art that resonates with emotion. Each piece carries a story — of heritage, of love, of the beauty I see in everyday moments.
                </TextReveal>
              </div>

              {/* Stats */}
              <div className="grid grid-cols-3 gap-6 mt-12">
                {[
                  { value: "150+", label: "Artworks" },
                  { value: "80+", label: "Collectors" },
                  { value: "5+", label: "Years" },
                ].map((stat, i) => (
                  <motion.div
                    key={stat.label}
                    className="text-center p-4 rounded-xl border border-gold/5 bg-charcoal/30"
                    initial={{ opacity: 0, y: 20 }}
                    whileInView={{ opacity: 1, y: 0 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.5 + i * 0.15 }}
                    whileHover={{
                      borderColor: "rgba(201, 165, 90, 0.2)",
                      y: -4,
                    }}
                  >
                    <div className="font-serif text-3xl font-bold text-gold">
                      {stat.value}
                    </div>
                    <div className="text-warm-gray text-xs uppercase tracking-[0.2em] mt-1">
                      {stat.label}
                    </div>
                  </motion.div>
                ))}
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* ---- CTA Section ---- */}
      <section className="relative py-24 md:py-32 px-6 md:px-12" id="contact">
        <div className="absolute inset-0 bg-gradient-to-b from-charcoal/50 to-midnight" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[400px] bg-gold/[0.03] rounded-full blur-[180px] pointer-events-none" />

        <motion.div
          className="relative max-w-3xl mx-auto text-center"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.8 }}
        >
          <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4">
            Commissions Open
          </p>
          <h2 className="font-serif text-4xl md:text-6xl font-bold text-cream mb-4">
            Let&apos;s Create Together
          </h2>
          <p
            className="font-arabic text-gold/40 text-xl mb-6"
            dir="rtl"
          >
            لنبدع معاً
          </p>
          <p className="text-cream-muted text-lg max-w-lg mx-auto mb-10 leading-relaxed">
            Have a vision for a custom piece? I&apos;d love to hear about it.
            From personal portraits to unique art gifts, every commission is a
            collaboration.
          </p>

          <RainbowButton className="text-lg px-10 py-4 font-medium">
            Inquire for a Commission
          </RainbowButton>

          <p className="text-warm-gray/40 text-xs mt-6 tracking-wider">
            Response within 24 hours · Custom quotes · Worldwide shipping
          </p>
        </motion.div>
      </section>

      <Footer />
    </main>
  );
}
