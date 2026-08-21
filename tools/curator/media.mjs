import sharp from "sharp";
import path from "node:path";
import { promises as fs } from "node:fs";

const PUBLIC_IMAGES = path.join(process.cwd(), "public", "images");

/**
 * Tailwind colour families, by hue, so a derived palette can be expressed as the
 * `gradient` utility string the artwork pages expect. Hue is degrees on the wheel;
 * each entry claims everything up to the next one.
 */
const HUE_FAMILIES = [
    { upTo: 15, name: "rose" },
    { upTo: 40, name: "amber" },
    { upTo: 65, name: "yellow" },
    { upTo: 150, name: "emerald" },
    { upTo: 190, name: "teal" },
    { upTo: 240, name: "blue" },
    { upTo: 270, name: "indigo" },
    { upTo: 300, name: "purple" },
    { upTo: 330, name: "fuchsia" },
    { upTo: 360, name: "rose" },
];

function familyForHue(hue) {
    return HUE_FAMILIES.find((f) => hue <= f.upTo)?.name ?? "amber";
}

function rgbToHsl({ r, g, b }) {
    const rn = r / 255;
    const gn = g / 255;
    const bn = b / 255;
    const max = Math.max(rn, gn, bn);
    const min = Math.min(rn, gn, bn);
    const delta = max - min;

    let h = 0;
    if (delta !== 0) {
        if (max === rn) h = ((gn - bn) / delta) % 6;
        else if (max === gn) h = (bn - rn) / delta + 2;
        else h = (rn - gn) / delta + 4;
    }
    h = Math.round(h * 60);
    if (h < 0) h += 360;

    const l = (max + min) / 2;
    const s = delta === 0 ? 0 : delta / (1 - Math.abs(2 * l - 1));
    return { h, s, l };
}

function hslToHex(h, s, l) {
    const c = (1 - Math.abs(2 * l - 1)) * s;
    const x = c * (1 - Math.abs(((h / 60) % 2) - 1));
    const m = l - c / 2;
    const [r, g, b] =
        h < 60 ? [c, x, 0] :
            h < 120 ? [x, c, 0] :
                h < 180 ? [0, c, x] :
                    h < 240 ? [0, x, c] :
                        h < 300 ? [x, 0, c] : [c, 0, x];
    const to255 = (v) =>
        Math.round((v + m) * 255).toString(16).padStart(2, "0");
    return `#${to255(r)}${to255(g)}${to255(b)}`;
}

/**
 * Derive the four-part theme each artwork page is styled with, from the artwork
 * itself. Deliberately arithmetic rather than model-generated: the palette has to
 * be consistent with the image, and a model looking at a JPEG only guesses.
 *
 * The site is dark, so the dominant hue is pushed to a near-black background, a
 * mid-saturation accent, and a pale text tint — the same relationship the existing
 * four entries use.
 */
export async function themeFromImage(buffer) {
    const { dominant } = await sharp(buffer).stats();
    const { h, s } = rgbToHsl(dominant);

    // Muted artwork shouldn't produce a grey theme; give it a floor.
    const sat = Math.max(s, 0.25);
    const family = familyForHue(h);
    const secondary = familyForHue((h + 60) % 360);

    return {
        bg: hslToHex(h, Math.min(sat * 0.35, 0.2), 0.06),
        accent: hslToHex(h, Math.min(sat * 0.9, 0.45), 0.6),
        gradient: `from-${family}-900/20 via-transparent to-${secondary}-900/10`,
        textColor: hslToHex(h, Math.min(sat * 0.5, 0.3), 0.86),
    };
}

/**
 * Normalise an incoming photo into something the gallery can serve: capped at
 * 2000px on the long edge, stripped of EXIF (which carries camera and often GPS
 * data), and written as WebP.
 */
export async function writeArtworkImage(buffer, slug) {
    const filename = `${slug}.webp`;
    const target = path.join(PUBLIC_IMAGES, filename);

    await fs.mkdir(PUBLIC_IMAGES, { recursive: true });
    const info = await sharp(buffer)
        .rotate() // honour EXIF orientation before we discard the metadata
        .resize({ width: 2000, height: 2000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 90 })
        .toFile(target);

    return {
        path: `/images/${filename}`,
        width: info.width,
        height: info.height,
        bytes: info.size,
    };
}

/**
 * Bento tiles are sized by aspect ratio so the grid stays visually balanced —
 * landscape pieces run wide, portraits run tall, squares get the feature slot.
 */
export function gridSpanFor(width, height) {
    const ratio = width / height;
    if (ratio > 1.25) return "md:col-span-2 md:row-span-1";
    if (ratio < 0.8) return "md:col-span-1 md:row-span-2";
    return "md:col-span-1 md:row-span-1";
}
