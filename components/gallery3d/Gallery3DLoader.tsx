"use client";

import dynamic from "next/dynamic";

const Gallery3D = dynamic(() => import("./Gallery3D"), {
    ssr: false,
    loading: () => (
        <div className="flex h-[100svh] w-full flex-col items-center justify-center bg-midnight">
            <div className="h-10 w-10 animate-spin rounded-full border-2 border-gold/20 border-t-gold" />
            <p className="mt-5 text-xs uppercase tracking-[0.3em] text-cream-muted">
                Entering the gallery…
            </p>
        </div>
    ),
});

export default function Gallery3DLoader() {
    return <Gallery3D />;
}
