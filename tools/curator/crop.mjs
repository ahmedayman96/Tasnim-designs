import sharp from "sharp";

/**
 * Selecting part of a photo.
 *
 * She photographs several paintings at once — leaning against a wall, laid out on
 * a table — and says "the one on the left". Two ways to honour that:
 *
 *  1. Plain geometry for the words that have an exact meaning (left, right, top,
 *     bottom, middle). Instant, free, and it cannot be wrong.
 *  2. Vision for everything else ("the one with the flowers"), which returns an
 *     approximate box and is checked for sanity before use.
 *
 * Geometry is tried first because a model asked for coordinates will happily
 * return confident nonsense.
 */

/** Fractional boxes: [x, y, width, height], all 0–1. */
const REGIONS = [
    { re: /(?:الشمال|شمال|اليسار|يسار|left)/i, box: [0, 0, 0.5, 1] },
    { re: /(?:اليمين|يمين|right)/i, box: [0.5, 0, 0.5, 1] },
    { re: /(?:فوق|العلوي|الأعلى|top|upper)/i, box: [0, 0, 1, 0.5] },
    { re: /(?:تحت|السفلي|الأسفل|bottom|lower)/i, box: [0, 0.5, 1, 0.5] },
    { re: /(?:الوسط|النص|middle|centre|center)/i, box: [0.25, 0, 0.5, 1] },
];

/** Words that mean "use only part of this photo" rather than "here's the story". */
const SELECTION = /(?:اللوحة|الصورة|الرسمة|بس|فقط|خد|خدي|استخدم|اقص|قص|crop|only|just|use)/i;

export function looksLikeCropInstruction(text) {
    if (!text) return false;
    return SELECTION.test(text) && REGIONS.some((r) => r.re.test(text));
}

async function applyBox(buffer, [fx, fy, fw, fh]) {
    const image = sharp(buffer).rotate(); // settle EXIF before measuring
    const { width, height } = await image.metadata();

    const left = Math.max(0, Math.round(fx * width));
    const top = Math.max(0, Math.round(fy * height));
    const w = Math.min(width - left, Math.round(fw * width));
    const h = Math.min(height - top, Math.round(fh * height));

    if (w < 64 || h < 64) throw new Error("that crop would be too small");
    return image.extract({ left, top, width: w, height: h }).toBuffer();
}

/** Geometry only. Returns null when the instruction names no region. */
export async function cropByWords(buffer, text) {
    const region = REGIONS.find((r) => r.re.test(text ?? ""));
    if (!region) return null;
    return applyBox(buffer, region.box);
}

/**
 * Ask the model to locate what she described. Only used when the words carry no
 * geometric meaning of their own.
 */
export async function cropByVision(buffer, description) {
    const key = process.env.CURATOR_API_KEY;
    const model = process.env.CURATOR_MODEL;
    if (!key || !model) return null;

    const small = await sharp(buffer)
        .rotate()
        .resize({ width: 1000, height: 1000, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();

    const res = await fetch(
        process.env.CURATOR_API_URL || "https://api.openai.com/v1/chat/completions",
        {
            method: "POST",
            headers: { "Content-Type": "application/json", Authorization: `Bearer ${key}` },
            body: JSON.stringify({
                model,
                messages: [
                    {
                        role: "system",
                        content:
                            "You locate a region in an image. Reply with JSON only: " +
                            '{"x":0.0,"y":0.0,"w":1.0,"h":1.0} as fractions of the image ' +
                            "(x,y = top-left corner). Box the single artwork the user " +
                            'describes, tightly. If you cannot tell which they mean, reply {"x":0,"y":0,"w":1,"h":1}.',
                    },
                    {
                        role: "user",
                        content: [
                            { type: "text", text: `Which artwork: ${description}` },
                            {
                                type: "image_url",
                                image_url: { url: `data:image/webp;base64,${small.toString("base64")}` },
                            },
                        ],
                    },
                ],
                temperature: 0,
                max_tokens: 100,
            }),
        }
    );

    if (!res.ok) return null;
    const data = await res.json();
    const text = data.choices?.[0]?.message?.content ?? "";
    const start = text.indexOf("{");
    const end = text.lastIndexOf("}");
    if (start === -1) return null;

    let box;
    try {
        box = JSON.parse(text.slice(start, end + 1));
    } catch {
        return null;
    }

    const nums = [box.x, box.y, box.w, box.h];
    // Reject anything malformed, inverted, out of bounds, or that selects
    // essentially the whole image (which means it didn't actually find anything).
    if (!nums.every((n) => typeof n === "number" && n >= 0 && n <= 1)) return null;
    if (box.w <= 0.05 || box.h <= 0.05) return null;
    if (box.x + box.w > 1.001 || box.y + box.h > 1.001) return null;
    if (box.w > 0.95 && box.h > 0.95) return null;

    return applyBox(buffer, nums);
}

/** Geometry first, vision as fallback. Returns null if neither applies. */
export async function cropFromInstruction(buffer, text) {
    if (!text) return null;
    const byWords = await cropByWords(buffer, text);
    if (byWords) return byWords;
    if (SELECTION.test(text)) return cropByVision(buffer, text);
    return null;
}
