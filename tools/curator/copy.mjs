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

const DEFAULT_URL = "https://openrouter.ai/api/v1/chat/completions";

const SYSTEM = `You write catalogue copy for the website of Tasnim Elyamani, a mixed-media artist.

You return exactly two things for a piece of art:
- "description": ONE sentence. What the work is and what it looks like. Concrete and visual.
- "story": 2-4 sentences, first person, as the artist. Why she made it, what it comes from. Personal and specific, never generic.

House style:
- Warm, unhurried, a little literary. Never markety. Never use the words "stunning", "captivating", "masterpiece", "journey" or "evoke".
- Specific over abstract: name real things — a balcony, newspaper fragments, the last light on a minaret.
- Do not mention price, size, or that it is for sale.
- Write in English only. Do not produce Arabic; the artist writes her own.

Reply with a JSON object and nothing else: {"description": "...", "story": "..."}`;

function examplesFrom(catalogue) {
    // Two existing entries carry the voice better than any amount of description.
    return catalogue.slice(0, 2).flatMap((a) => [
        {
            role: "user",
            content: `Title: ${a.title}\nMedium: ${a.medium}\nYear: ${a.year}`,
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

async function call(messages, { url, key, model }) {
    const res = await fetch(url, {
        method: "POST",
        headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({ model, messages, temperature: 0.8, max_tokens: 700 }),
    });

    if (!res.ok) {
        throw new Error(`${model} returned ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const data = await res.json();
    const text = data.choices?.[0]?.message?.content;
    if (!text) throw new Error("model returned an empty reply");
    return parseReply(text);
}

export function copyConfigured() {
    return Boolean(process.env.CURATOR_API_KEY && process.env.CURATOR_MODEL);
}

/**
 * @param facts   {title, medium, size, year}
 * @param options {catalogue, imageBuffer}
 */
export async function generateCopy(facts, { catalogue = [], imageBuffer } = {}) {
    const config = {
        url: process.env.CURATOR_API_URL || DEFAULT_URL,
        key: process.env.CURATOR_API_KEY,
        model: process.env.CURATOR_MODEL,
    };
    if (!config.key || !config.model) {
        throw new Error("CURATOR_API_KEY and CURATOR_MODEL must be set to generate copy");
    }

    const facts_text = `Title: ${facts.title}\nMedium: ${facts.medium}\nYear: ${facts.year}`;
    const base = [{ role: "system", content: SYSTEM }, ...examplesFrom(catalogue)];

    // Showing the model the actual artwork gives far better copy — but not every
    // model accepts images, so fall back to the facts alone rather than failing.
    if (imageBuffer) {
        try {
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
                                    url: `data:image/webp;base64,${imageBuffer.toString("base64")}`,
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
