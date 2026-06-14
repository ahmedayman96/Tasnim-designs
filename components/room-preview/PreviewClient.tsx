"use client";

import { useState } from "react";
import Link from "next/link";
import { artworks, type Artwork } from "@/lib/artworks";
import RoomPreview from "./RoomPreview";

export default function PreviewClient() {
    const [selected, setSelected] = useState<Artwork | null>(null);

    return (
        <section className="mx-auto max-w-4xl px-6 pb-24 pt-32 md:px-12">
            <div className="text-center">
                <p className="text-sm uppercase tracking-[0.3em] text-gold">See It In Your Space</p>
                <h1 className="mt-3 font-serif text-4xl font-bold text-cream md:text-5xl">
                    Preview a Piece on Your Wall
                </h1>
                <p className="mx-auto mt-4 max-w-xl text-cream-muted">
                    Pick an artwork, upload a photo of your room, and our AI will show you how it
                    would look hanging in your space.
                </p>
            </div>

            {!selected ? (
                /* Step 1 — choose a piece */
                <div className="mt-12">
                    <p className="mb-5 text-center text-xs uppercase tracking-[0.2em] text-cream-muted">
                        Step 1 — Choose an artwork
                    </p>
                    <div className="grid grid-cols-2 gap-5 sm:grid-cols-4">
                        {artworks.map((a) => (
                            <button
                                key={a.slug}
                                onClick={() => setSelected(a)}
                                className="group overflow-hidden rounded-xl border border-gold/15 bg-charcoal/40 text-left transition-colors hover:border-gold/50"
                            >
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img
                                    src={a.image}
                                    alt={a.title}
                                    className="aspect-square w-full object-cover transition-transform duration-500 group-hover:scale-105"
                                />
                                <div className="p-3">
                                    <p className="truncate font-serif text-sm text-cream">{a.title}</p>
                                    <p className="text-xs text-gold">${a.price.toLocaleString()}</p>
                                </div>
                            </button>
                        ))}
                    </div>
                </div>
            ) : (
                /* Step 2 — upload room + generate */
                <div className="mt-12">
                    <div className="mb-6 flex items-center justify-between">
                        <div className="flex items-center gap-3">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img
                                src={selected.image}
                                alt={selected.title}
                                className="h-14 w-14 rounded-lg object-cover"
                            />
                            <div>
                                <p className="font-serif text-cream">{selected.title}</p>
                                <p className="text-xs text-gold">${selected.price.toLocaleString()}</p>
                            </div>
                        </div>
                        <button
                            onClick={() => setSelected(null)}
                            className="text-xs uppercase tracking-[0.15em] text-cream-muted transition-colors hover:text-gold"
                        >
                            ← Choose another
                        </button>
                    </div>

                    <p className="mb-4 text-center text-xs uppercase tracking-[0.2em] text-cream-muted">
                        Step 2 — Upload your room
                    </p>
                    <RoomPreview artwork={selected} />
                </div>
            )}

            <p className="mt-16 text-center text-xs text-warm-gray/50">
                Previews are AI-generated approximations.{" "}
                <Link href="/#gallery" className="text-gold/70 hover:text-gold">
                    Browse the full collection
                </Link>
            </p>
        </section>
    );
}
