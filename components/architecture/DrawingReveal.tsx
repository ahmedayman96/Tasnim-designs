"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

/**
 * Drawing to render, wiped by the cursor.
 *
 * The elevation and the render show the same wall. Rather than placing them side
 * by side and asking the viewer to compare, one is revealed through the other:
 * drag or move across and the drawing becomes the built thing. On touch, the wipe
 * follows the finger; with no pointer at all it settles at the midpoint, so both
 * halves are visible and the comparison still reads.
 */
export default function DrawingReveal({
    drawing,
    render,
    drawingLabel = "Elevation",
    renderLabel = "Render",
    alt,
}: {
    drawing: string;
    render: string;
    drawingLabel?: string;
    renderLabel?: string;
    alt: string;
}) {
    const ref = useRef<HTMLDivElement>(null);
    const [at, setAt] = useState(0.5);

    useEffect(() => {
        const el = ref.current;
        if (!el) return;

        const move = (clientX: number) => {
            const rect = el.getBoundingClientRect();
            setAt(Math.min(1, Math.max(0, (clientX - rect.left) / rect.width)));
        };
        const onPointer = (e: PointerEvent) => move(e.clientX);
        const onTouch = (e: TouchEvent) => {
            if (e.touches[0]) move(e.touches[0].clientX);
        };

        el.addEventListener("pointermove", onPointer);
        el.addEventListener("touchmove", onTouch, { passive: true });
        return () => {
            el.removeEventListener("pointermove", onPointer);
            el.removeEventListener("touchmove", onTouch);
        };
    }, []);

    return (
        <figure className="relative">
            <div
                ref={ref}
                className="relative aspect-[4/3] overflow-hidden bg-charcoal cursor-ew-resize select-none"
            >
                {/* the render sits underneath */}
                <Image src={render} alt={alt} fill sizes="100vw" className="object-cover" priority />

                {/* the drawing is clipped back to the wipe */}
                <div
                    className="absolute inset-0"
                    style={{ clipPath: `inset(0 ${(1 - at) * 100}% 0 0)` }}
                >
                    <Image
                        src={drawing}
                        alt={`${alt} — ${drawingLabel}`}
                        fill
                        sizes="100vw"
                        className="object-cover"
                    />
                    <div className="absolute inset-0 bg-midnight/20" />
                </div>

                {/* the seam */}
                <div
                    className="absolute inset-y-0 w-px bg-gold/80 pointer-events-none"
                    style={{ left: `${at * 100}%` }}
                >
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 h-9 w-9 rounded-full border border-gold/60 bg-midnight/70 backdrop-blur-sm" />
                    <span className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-gold text-[0.55rem] tracking-widest">
                        &#8596;
                    </span>
                </div>

                <span className="absolute top-4 left-4 text-gold/80 text-[0.55rem] uppercase tracking-[0.3em] bg-midnight/50 px-2.5 py-1">
                    {drawingLabel}
                </span>
                <span className="absolute top-4 right-4 text-cream/80 text-[0.55rem] uppercase tracking-[0.3em] bg-midnight/50 px-2.5 py-1">
                    {renderLabel}
                </span>
            </div>

            <figcaption className="text-warm-gray text-xs font-light mt-4 text-center">
                Move across the image — the drawing becomes the room.
            </figcaption>
        </figure>
    );
}
