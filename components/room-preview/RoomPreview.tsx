"use client";

import { useCallback, useRef, useState } from "react";
import Link from "next/link";
import type { Artwork } from "@/lib/artworks";

/** Downscale a user photo to <= maxDim on its longest side to cut upload size,
 *  latency and AI cost. Returns a JPEG blob. */
async function downscale(file: File, maxDim = 1280): Promise<Blob> {
    const url = URL.createObjectURL(file);
    try {
        const img = await new Promise<HTMLImageElement>((resolve, reject) => {
            const i = new Image();
            i.onload = () => resolve(i);
            i.onerror = reject;
            i.src = url;
        });
        const scale = Math.min(1, maxDim / Math.max(img.width, img.height));
        const w = Math.round(img.width * scale);
        const h = Math.round(img.height * scale);
        const canvas = document.createElement("canvas");
        canvas.width = w;
        canvas.height = h;
        canvas.getContext("2d")!.drawImage(img, 0, 0, w, h);
        return await new Promise<Blob>((resolve) =>
            canvas.toBlob((b) => resolve(b!), "image/jpeg", 0.9),
        );
    } finally {
        URL.revokeObjectURL(url);
    }
}

export default function RoomPreview({ artwork }: { artwork: Artwork }) {
    const [roomUrl, setRoomUrl] = useState<string | null>(null);
    const [roomBlob, setRoomBlob] = useState<Blob | null>(null);
    const [result, setResult] = useState<string | null>(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const inputRef = useRef<HTMLInputElement>(null);

    const pickPhoto = useCallback(async (file: File | undefined) => {
        if (!file) return;
        setError(null);
        setResult(null);
        try {
            const blob = await downscale(file);
            setRoomBlob(blob);
            setRoomUrl(URL.createObjectURL(blob));
        } catch {
            setError("Couldn't read that image. Try a different photo.");
        }
    }, []);

    const generate = useCallback(async () => {
        if (!roomBlob) return;
        setLoading(true);
        setError(null);
        try {
            const fd = new FormData();
            fd.append("slug", artwork.slug);
            fd.append("room", roomBlob, "room.jpg");
            const res = await fetch("/api/room-preview", { method: "POST", body: fd });
            const data = await res.json();
            if (!res.ok) throw new Error(data.error || "Failed to generate preview");
            setResult(data.image);
        } catch (e) {
            setError(e instanceof Error ? e.message : "Something went wrong.");
        } finally {
            setLoading(false);
        }
    }, [roomBlob, artwork.slug]);

    const reset = () => {
        setResult(null);
        setError(null);
    };

    return (
        <div className="w-full">
            {/* Result view */}
            {result ? (
                <div className="flex flex-col gap-4">
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                        src={result}
                        alt={`${artwork.title} in your room`}
                        className="w-full rounded-xl border border-gold/15"
                    />
                    <div className="flex flex-wrap gap-3">
                        <a
                            href={result}
                            download={`${artwork.slug}-in-my-room.png`}
                            className="rounded-full bg-gold px-5 py-2.5 text-sm font-medium uppercase tracking-[0.12em] text-midnight transition-colors hover:bg-gold-light"
                        >
                            Download
                        </a>
                        <button
                            onClick={reset}
                            className="rounded-full border border-gold/25 px-5 py-2.5 text-sm uppercase tracking-[0.12em] text-cream-muted transition-colors hover:text-gold"
                        >
                            Try another photo
                        </button>
                        <Link
                            href={`/artwork/${artwork.slug}`}
                            className="rounded-full border border-gold/25 px-5 py-2.5 text-sm uppercase tracking-[0.12em] text-cream-muted transition-colors hover:text-gold"
                        >
                            View &amp; purchase
                        </Link>
                    </div>
                </div>
            ) : (
                <div className="flex flex-col gap-4">
                    {/* Upload / preview area */}
                    <div
                        onClick={() => inputRef.current?.click()}
                        onDragOver={(e) => e.preventDefault()}
                        onDrop={(e) => {
                            e.preventDefault();
                            pickPhoto(e.dataTransfer.files?.[0]);
                        }}
                        className="relative flex min-h-[220px] cursor-pointer items-center justify-center overflow-hidden rounded-xl border border-dashed border-gold/30 bg-charcoal/40 text-center transition-colors hover:border-gold/60"
                    >
                        {roomUrl ? (
                            // eslint-disable-next-line @next/next/no-img-element
                            <img src={roomUrl} alt="Your room" className="max-h-[340px] w-full object-contain" />
                        ) : (
                            <div className="px-6 py-10">
                                <p className="font-serif text-lg text-cream">Upload a photo of your room</p>
                                <p className="mt-2 text-sm text-cream-muted">
                                    Tap to choose a photo (or drag one here). A clear shot of the wall
                                    works best.
                                </p>
                            </div>
                        )}
                        <input
                            ref={inputRef}
                            type="file"
                            accept="image/*"
                            className="hidden"
                            onChange={(e) => pickPhoto(e.target.files?.[0])}
                        />
                    </div>

                    {error && <p className="text-sm text-red-400">{error}</p>}

                    <button
                        onClick={generate}
                        disabled={!roomBlob || loading}
                        className="flex items-center justify-center gap-3 rounded-full bg-gold py-3 text-sm font-medium uppercase tracking-[0.15em] text-midnight transition-all hover:bg-gold-light disabled:cursor-not-allowed disabled:opacity-40"
                    >
                        {loading ? (
                            <>
                                <span className="h-4 w-4 animate-spin rounded-full border-2 border-midnight/30 border-t-midnight" />
                                Placing it on your wall…
                            </>
                        ) : (
                            `See "${artwork.title}" in your room`
                        )}
                    </button>
                    {loading && (
                        <p className="text-center text-xs text-cream-muted">
                            This usually takes 10–20 seconds.
                        </p>
                    )}
                    {roomUrl && !loading && (
                        <button
                            onClick={() => inputRef.current?.click()}
                            className="text-center text-xs uppercase tracking-[0.15em] text-cream-muted transition-colors hover:text-gold"
                        >
                            Choose a different photo
                        </button>
                    )}
                </div>
            )}
        </div>
    );
}
