import { artworks, getArtworkBySlug } from "@/lib/artworks";
import ArtworkPage from "./ArtworkPage";
import { notFound } from "next/navigation";
import type { Metadata } from "next";

// Generate static params for all artworks
export function generateStaticParams() {
    return artworks.map((artwork) => ({
        slug: artwork.slug,
    }));
}

// Dynamic metadata per artwork
export async function generateMetadata({
    params,
}: {
    params: Promise<{ slug: string }>;
}): Promise<Metadata> {
    const { slug } = await params;
    const artwork = getArtworkBySlug(slug);
    if (!artwork) return { title: "Not Found" };

    return {
        title: `${artwork.title} — ${artwork.titleAr} | Tasnim Elyamani`,
        description: artwork.description,
    };
}

export default async function Page({
    params,
}: {
    params: Promise<{ slug: string }>;
}) {
    const { slug } = await params;
    const artwork = getArtworkBySlug(slug);
    if (!artwork) notFound();

    // Get related artworks (all except current)
    const related = artworks.filter((a) => a.slug !== artwork.slug);

    return <ArtworkPage artwork={artwork} related={related} />;
}
