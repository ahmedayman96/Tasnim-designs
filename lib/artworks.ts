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
}

export const artworks: Artwork[] = [
    {
        slug: "cubist-portrait",
        title: "Cubist Portrait",
        titleAr: "بورتريه تكعيبي",
        medium: "Mixed Media Collage",
        size: '24 × 24 in',
        year: 2024,
        price: 2000,
        image: "/images/artwork-1.png",
        description: "A bold cubist interpretation of the feminine form, layered with newspaper fragments and warm earth pigments.",
        story: "This piece was born from my fascination with how we see faces — not as flat images, but as shifting planes of light. Each fragment carries a different perspective, like memories stacked upon each other. The newspaper text whispers stories from another era, grounding the abstract forms in reality.",
        theme: {
            bg: "#1a1410",
            accent: "#c4956a",
            gradient: "from-amber-900/20 via-transparent to-sienna-900/10",
            textColor: "#e8d5c0",
        },
        gridSpan: "md:col-span-2 md:row-span-2",
    },
    {
        slug: "golden-minarets",
        title: "Golden Minarets",
        titleAr: "المآذن الذهبية",
        medium: "Mixed Media Collage",
        size: '24 × 24 in',
        year: 2024,
        price: 1200,
        image: "/images/artwork-2.png",
        description: "An architectural mosaic celebrating Islamic geometry, golden domes rising through tessellated desert light.",
        story: "Walking through the old city, the minarets catch the last golden hour light differently each evening. I wanted to capture not a single view, but the accumulated impression of thousands of glances upward — each tessera a snapshot of sky and stone and prayer.",
        theme: {
            bg: "#121510",
            accent: "#b8a04a",
            gradient: "from-emerald-900/20 via-transparent to-amber-900/10",
            textColor: "#d4c89e",
        },
        gridSpan: "md:col-span-1 md:row-span-1",
    },
    {
        slug: "spring-fragments",
        title: "Spring Fragments",
        titleAr: "شظايا الربيع",
        medium: "Mixed Media Collage",
        size: '20 × 24 in',
        year: 2024,
        price: 1000,
        image: "/images/artwork-3.png",
        description: "A delicate bouquet deconstructed and reassembled — roses and jasmine in tessellated pastels against iron filigree.",
        story: "My grandmother's balcony always overflowed with flowers in spring. The roses she tended had this quality of being both fragile and fierce. I collaged newspaper fragments as her words, the iron railing as her strength, and the flowers as the softness she showed only to those she loved.",
        theme: {
            bg: "#161214",
            accent: "#c4899e",
            gradient: "from-pink-900/20 via-transparent to-purple-900/10",
            textColor: "#e8d0d8",
        },
        gridSpan: "md:col-span-1 md:row-span-2",
    },
    {
        slug: "cosmic-metropolis",
        title: "Cosmic Metropolis",
        titleAr: "المدينة الكونية",
        medium: "Mixed Media Digital Collage",
        size: '24 × 24 in',
        year: 2024,
        price: 1500,
        image: "/images/artwork-4.png",
        description: "A nocturnal cityscape dissolving into constellations — silver towers, crescent moons, and the electric hum of a city dreaming.",
        story: "Cities at night have always felt like they exist in a different dimension. The silver frame mirrors the cold beauty of skyscrapers, while the deep navy reveals a cosmos hidden just above the rooftops. The crescent moon is both celestial and deeply personal — a symbol of home.",
        theme: {
            bg: "#0a0a14",
            accent: "#8b7ec8",
            gradient: "from-indigo-900/20 via-transparent to-purple-900/10",
            textColor: "#c8c0e8",
        },
        gridSpan: "md:col-span-2 md:row-span-1",
    },
];

export function getArtworkBySlug(slug: string): Artwork | undefined {
    return artworks.find((a) => a.slug === slug);
}
