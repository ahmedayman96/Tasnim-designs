/**
 * Copywriting for new catalogue entries.
 *
 * Speaks the OpenAI chat-completions dialect, which OpenRouter, OpenAI, Together,
 * Groq and most local servers all accept — so the model is a config value, not an
 * architectural commitment. Set:
 *
 *   CURATOR_API_URL   default https://openrouter.ai/api/v1/chat/completions
 *   CURATOR_API_KEY
 *   CURATOR_MODEL     e.g. z-ai/glm-4.6
 *
 * The model only ever returns text. It does not touch the filesystem, git, or the
 * catalogue — the caller does all of that.
 */

import sharp from "sharp";

const DEFAULT_URL = "https://openrouter.ai/api/v1/chat/completions";

/**
 * Incoming photos are whatever her phone produced — JPEG, HEIC-derived PNG, 12MP.
 * Normalise to a small WebP before sending: the declared mime type then matches
 * the bytes, and a 900px edge is plenty for describing a painting while keeping
 * the request small enough for rate-limited free endpoints.
 */
async function toPromptImage(buffer) {
    return sharp(buffer)
        .rotate()
        .resize({ width: 900, height: 900, fit: "inside", withoutEnlargement: true })
        .webp({ quality: 80 })
        .toBuffer();
}

const SYSTEM = `You are an editor for the website of Tasnim Elyamani, a mixed-media artist.
You do not write about her work from your own imagination. You rewrite what SHE
tells you about it, in the house voice.

You return exactly two things:
- "description": ONE sentence. What the work is and what it physically looks like.
- "story": 2-4 sentences, first person, in her voice. Why she made it, where it came from.

THE RULE THAT MATTERS MOST — never invent facts about her life.
Do not invent relatives, names, places, dates, journeys, illnesses, losses, or
memories. Do not invent what a painting depicts. If her notes are brief, write
something brief. A short, true sentence is correct; an invented paragraph is a
serious failure, because this is published as her own words under her own name.

Use ONLY: the notes she gives you, the title, the medium, and the image if you
are shown one. Nothing else.

House style:
- Warm, unhurried, a little literary. Never markety. Never use "stunning",
  "captivating", "masterpiece", "journey" or "evoke".
- Prefer her own concrete details over abstraction.
- Do not mention price, size, or that it is for sale.
- English only. She writes her own Arabic.

Reply with a JSON object and nothing else: {"description": "...", "story": "..."}`;

function examplesFrom(catalogue) {
    // Two existing entries carry the voice better than any amount of description.
    return catalogue.slice(0, 2).flatMap((a) => [
        {
            role: "user",
            content:
                `Title: ${a.title}\nMedium: ${a.medium}\nYear: ${a.year}\n\n` +
                `Tasnim's notes on this piece — rewrite these, invent nothing beyond them:\n${a.story}`,
        },
        {
            role: "assistant",
            content: JSON.stringify({ description: a.description, story: a.story }),
        },
    ]);
}

function parseReply(text) {
    // Models wrap JSON in prose or fences often enough to be worth handling.
    const fenced = text.match(/```(?:json)?\s*([\s\S]*?)```/);
    const candidate = fenced ? fenced[1] : text;
    const start = candidate.indexOf("{");
    const end = candidate.lastIndexOf("}");
    if (start === -1 || end === -1) {
        throw new Error(`model did not return JSON: ${text.slice(0, 200)}`);
    }

    const parsed = JSON.parse(candidate.slice(start, end + 1));
    if (!parsed.description || !parsed.story) {
        throw new Error("model reply missing description or story");
    }
    return {
        description: String(parsed.description).trim(),
        story: String(parsed.story).trim(),
    };
}

const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

/**
 * Free endpoints rate-limit hard and intermittently — in testing the same model
 * refused twice and then answered immediately. Retry transient failures (429, 5xx,
 * empty replies) rather than making the artist retype her message.
 */
async function callOnce(messages, { url, key, model }) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 700 }),
    });

    if (!res.ok) {
        const body = (await res.text()).slice(0, 300);
        const err = new Error(`${model} returned ${res.status}: ${body}`);
        err.retryable = res.status === 429 || res.status >= 500;
        throw err;
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) {
        const err = new Error("model returned an empty reply");
        err.retryable = true;
        throw err;
    }
    return parseReply(text);
}

async function call(messages, config, attempts = 4) {
    let last;
    for (let attempt = 1; attempt <= attempts; attempt += 1) {
        try {
            return await callOnce(messages, config);
        } catch (err) {
            last = err;
            if (!err.retryable || attempt === attempts) throw err;
            await sleep(attempt * 6000);
        }
    }
    throw last;
}

export function copyConfigured() {
    return Boolean(process.env.CURATOR_API_KEY && process.env.CURATOR_MODEL);
}

/**
 * @param facts   {title, medium, size, year, notes}
 *                `notes` is the artist's own account of the piece, in any form.
 *                Without it the model has nothing true to work from and will
 *                invent a biography — so it is required.
 * @param options {catalogue, imageBuffer}
 */
export async function generateCopy(facts, { catalogue = [], imageBuffer } = {}) {
    if (!facts.notes || !String(facts.notes).trim()) {
        throw new Error(
            "notes are required — the model rewrites the artist's own words and " +
            "must not invent them"
        );
    }

    const config = {
        url: process.env.CURATOR_API_URL || DEFAULT_URL,
        key: process.env.CURATOR_API_KEY,
        model: process.env.CURATOR_MODEL,
    };
    if (!config.key || !config.model) {
        throw new Error("CURATOR_API_KEY and CURATOR_MODEL must be set to generate copy");
    }

    const facts_text =
        `Title: ${facts.title}\nMedium: ${facts.medium}\nYear: ${facts.year}\n\n` +
        `Tasnim's notes on this piece — rewrite these, invent nothing beyond them:\n${facts.notes}`;
    const base = [{ role: "system", content: SYSTEM }, ...examplesFrom(catalogue)];

    // Showing the model the actual artwork gives far better copy — but not every
    // model accepts images, so fall back to the facts alone rather than failing.
    if (imageBuffer) {
        try {
            const prompt_image = await toPromptImage(imageBuffer);
            return await call(
                [
                    ...base,
                    {
                        role: "user",
                        content: [
                            { type: "text", text: facts_text },
                            {
                                type: "image_url",
                                image_url: {
                                    url: `data:image/webp;base64,${prompt_image.toString("base64")}`,
                                },
                            },
                        ],
                    },
                ],
                config
            );
        } catch (err) {
            console.warn(`  image prompt failed (${err.message.slice(0, 80)}); retrying text-only`);
        }
    }

    return call([...base, { role: "user", content: facts_text }], config);
}
