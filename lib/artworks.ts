import artworksData from "@/content/artworks.json";

export interface Artwork {
    slug: string;
    title: string;
    titleAr: string;
    medium: string;
    size: string;
    year: number;
    price: number;
    image: string;
    description: string;
    story: string;
    theme: {
        bg: string;
        accent: string;
        gradient: string;
        textColor: string;
    };
    gridSpan?: string; // Tailwind classes for bento grid
    /** Originals are one of a kind — a sold piece stays on show but can't be bought. */
    sold?: boolean;
}

/**
 * The catalogue lives in content/artworks.json rather than in this file so it can
 * be appended to by tooling (see tools/curator) without rewriting TypeScript.
 * This module stays the single import point for the rest of the app.
 */
export const artworks: Artwork[] = artworksData as Artwork[];

export function getArtworkBySlug(slug: string): Artwork | undefined {
    return artworks.find((a) => a.slug === slug);
}
