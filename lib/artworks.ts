import artworksData from "@/content/artworks.json";

export interface Artwork {
    slug: string;
    title: string;
    titleAr: string;
    medium: string;
    size: string;
    year: number;
    /**
     * null means "price on request" — the piece is on show but not for sale yet.
     * Newly added work starts this way until the artist sets a price, so that no
     * price a human didn't type can ever reach checkout.
     */
    price: number | null;
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

/** A piece can be bought only if it has a price and hasn't already sold. */
export function isPurchasable(artwork: Artwork): boolean {
    return typeof artwork.price === "number" && artwork.price > 0 && !artwork.sold;
}

/** What to show where a price would go. */
export function priceLabel(artwork: Artwork): string {
    if (artwork.sold) return "Sold";
    if (typeof artwork.price !== "number") return "Price on request";
    return `$${artwork.price.toLocaleString("en-US")}`;
}
