import type { Metadata } from "next";
import Navbar from "@/components/shared/Navbar";
import Footer from "@/components/shared/Footer";
import BentoGallery from "@/components/gallery/BentoGallery";
import { objects } from "@/lib/artworks";

export const metadata: Metadata = {
    title: "Art Pieces — Tasnim Elyamani",
    description:
        "Handmade objects by Tasnim Elyamani — resin and mixed media pieces made to be used as well as looked at.",
};

export default function PiecesPage() {
    return (
        <main className="bg-midnight min-h-screen">
            <Navbar />

            <section className="relative px-6 md:px-12 pt-36 pb-4">
                <div className="max-w-7xl mx-auto text-center">
                    <p className="text-gold text-sm uppercase tracking-[0.3em] mb-4 font-medium">
                        Art Pieces · قطع فنية
                    </p>
                    <h1 className="font-serif text-4xl md:text-6xl font-bold text-cream mb-6">
                        Made to be Used
                    </h1>
                    <p className="text-cream-muted/90 font-light leading-relaxed max-w-2xl mx-auto">
                        Objects rather than pictures — cast in resin, stone and pigment,
                        each one finished by hand and made only once.
                    </p>
                    <div className="w-16 h-px bg-gradient-to-r from-transparent via-gold to-transparent mx-auto mt-8" />
                </div>
            </section>

            {objects.length > 0 ? (
                <BentoGallery
                    items={objects}
                    id="pieces"
                    eyebrow="The Pieces · القطع"
                    heading="Available Now"
                />
            ) : (
                <section className="px-6 md:px-12 py-32">
                    <p className="text-warm-gray text-center font-light">
                        New pieces are on their way.
                    </p>
                </section>
            )}

            <Footer />
        </main>
    );
}
