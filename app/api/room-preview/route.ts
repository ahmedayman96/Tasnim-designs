import { NextRequest, NextResponse } from "next/server";
import { promises as fs } from "fs";
import path from "path";
import OpenAI, { toFile } from "openai";
import { getArtworkBySlug } from "@/lib/artworks";

// gpt-image-1 generations can take a while — give the function room to run.
export const runtime = "nodejs";
export const maxDuration = 60;

// ---- Cost protection: best-effort in-memory rate limit (per IP) ---------
// NOTE: this resets on cold starts and is per-instance, so the real backstop
// is the hard monthly spend cap set on the OpenAI account. This just stops
// casual hammering.
const WINDOW_MS = 60 * 60 * 1000; // 1 hour
const MAX_PER_WINDOW = 5;
const hits = new Map<string, number[]>();

function rateLimited(ip: string): boolean {
    const now = Date.now();
    const recent = (hits.get(ip) ?? []).filter((t) => now - t < WINDOW_MS);
    if (recent.length >= MAX_PER_WINDOW) {
        hits.set(ip, recent);
        return true;
    }
    recent.push(now);
    hits.set(ip, recent);
    return false;
}

export async function POST(req: NextRequest) {
    // 1) Same-origin check — block other sites from scripting this endpoint
    //    through a browser.
    const origin = req.headers.get("origin");
    const host = req.headers.get("host");
    if (origin) {
        try {
            if (new URL(origin).host !== host) {
                return NextResponse.json({ error: "Forbidden" }, { status: 403 });
            }
        } catch {
            return NextResponse.json({ error: "Forbidden" }, { status: 403 });
        }
    }

    // 2) Rate limit
    const ip =
        req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || "unknown";
    if (rateLimited(ip)) {
        return NextResponse.json(
            { error: "You've reached the preview limit. Please try again later." },
            { status: 429 },
        );
    }

    // 3) Key present?
    if (!process.env.OPENAI_API_KEY) {
        return NextResponse.json(
            { error: "Room preview is not configured yet." },
            { status: 503 },
        );
    }

    // 4) Parse input
    let form: FormData;
    try {
        form = await req.formData();
    } catch {
        return NextResponse.json({ error: "Invalid request" }, { status: 400 });
    }
    const slug = String(form.get("slug") || "");
    const room = form.get("room");
    const artwork = getArtworkBySlug(slug);

    if (!artwork) {
        return NextResponse.json({ error: "Unknown artwork" }, { status: 400 });
    }
    if (!(room instanceof File)) {
        return NextResponse.json({ error: "No room photo provided" }, { status: 400 });
    }
    if (room.size > 12 * 1024 * 1024) {
        return NextResponse.json({ error: "Room photo is too large" }, { status: 400 });
    }

    try {
        // Room photo (uploaded) and the artwork (from /public/images)
        const roomBuf = Buffer.from(await room.arrayBuffer());
        const artPath = path.join(process.cwd(), "public", artwork.image);
        const artBuf = await fs.readFile(artPath);

        const roomType = room.type || "image/png";

        const prompt =
            `The FIRST image is a photo of a real interior room. The SECOND image is a ` +
            `piece of framed artwork titled "${artwork.title}" (${artwork.medium}, ${artwork.size}). ` +
            `Edit the FIRST image so this artwork hangs on the most suitable empty wall, ` +
            `as a single framed piece at a believable size for a ${artwork.size} artwork. ` +
            `Match the room's perspective, lighting, color temperature and add a soft, ` +
            `realistic drop shadow so it looks genuinely hung on the wall. Keep the rest of ` +
            `the room photo unchanged and photorealistic. Do NOT restyle, recolor or distort ` +
            `the artwork itself — keep its content faithful to the SECOND image.`;

        const client = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

        // Fresh file handles per attempt (the SDK consumes the streams).
        const runEdit = async (model: string) => {
            const roomFile = await toFile(roomBuf, "room.png", { type: roomType });
            const artFile = await toFile(artBuf, "artwork.png", { type: "image/png" });
            return client.images.edit({
                model,
                image: [roomFile, artFile],
                prompt,
                size: "auto",
                quality:
                    (process.env.OPENAI_IMAGE_QUALITY as "low" | "medium" | "high") || "low",
            });
        };

        const primaryModel = process.env.OPENAI_IMAGE_MODEL || "gpt-image-2";
        let result;
        try {
            result = await runEdit(primaryModel);
        } catch (e) {
            const msg = e instanceof Error ? e.message : String(e);
            // If the configured model isn't available to this account, fall back.
            if (
                primaryModel !== "gpt-image-1" &&
                /model|not found|does not exist|unsupported|invalid/i.test(msg)
            ) {
                console.warn(`Model "${primaryModel}" unavailable (${msg}); retrying gpt-image-1`);
                result = await runEdit("gpt-image-1");
            } else {
                throw e;
            }
        }

        const b64 = result.data?.[0]?.b64_json;
        if (!b64) {
            return NextResponse.json(
                { error: "The preview could not be generated. Please try again." },
                { status: 502 },
            );
        }

        return NextResponse.json({ image: `data:image/png;base64,${b64}` });
    } catch (err) {
        console.error("room-preview error:", err);
        return NextResponse.json(
            { error: "Something went wrong generating your preview." },
            { status: 500 },
        );
    }
}
