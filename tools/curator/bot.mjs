#!/usr/bin/env node
/**
 * "الأسطى" — Telegram bot for the gallery.
 *
 *   node --env-file=.env.local tools/curator/bot.mjs
 *
 * Send a photo; it goes up. No questions asked — the model titles and describes
 * the piece from the image itself, and everything it cannot see (why she made it,
 * what it is worth) is left blank rather than invented. She fills those in by
 * replying in plain Arabic afterwards.
 *
 * Raw Bot API over long polling: no dependencies, no webhook, no public IP.
 */
import { addArtwork, removeArtwork, updateArtwork, repo } from "./index.mjs";
import { readCatalogue } from "./catalogue.mjs";
import { generateCopy } from "./copy.mjs";
import { transcribe } from "./transcribe.mjs";
import { promises as fs } from "node:fs";
import path from "node:path";

const TOKEN = process.env.TELEGRAM_BOT_TOKEN;
const API = `https://api.telegram.org/bot${TOKEN}`;
const FILE_API = `https://api.telegram.org/file/bot${TOKEN}`;
const SITE = process.env.SITE_URL || "https://tasnimelyamani.com";

const ALLOWED = (process.env.TELEGRAM_ALLOWED_IDS || "")
    .split(",").map((s) => s.trim()).filter(Boolean);

if (!TOKEN) {
    console.error("TELEGRAM_BOT_TOKEN is not set");
    process.exit(1);
}

// ---------------------------------------------------------------- Telegram ---

async function tg(method, payload) {
    const res = await fetch(`${API}/${method}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
    });
    const data = await res.json();
    if (!data.ok) throw new Error(`${method}: ${data.description}`);
    return data.result;
}

const say = (chat, text) =>
    tg("sendMessage", { chat_id: chat, text, parse_mode: "HTML", disable_web_page_preview: false });

async function download(fileId) {
    const file = await tg("getFile", { file_id: fileId });
    const res = await fetch(`${FILE_API}/${file.file_path}`);
    if (!res.ok) throw new Error(`could not download file (${res.status})`);
    return {
        buffer: Buffer.from(await res.arrayBuffer()),
        name: file.file_path.split("/").pop(),
    };
}

/** Telegram sends several resolutions; the last is the largest. */
async function downloadPhoto(photoSizes) {
    return (await download(photoSizes[photoSizes.length - 1].file_id)).buffer;
}

// ------------------------------------------------------------------- State ---

/** The piece each chat is currently talking about — edits apply to it. */
const focus = new Map();

const money = (n) => (typeof n === "number" ? `$${n.toLocaleString("en-US")}` : "من غير سعر");

/**
 * The site rebuilds after a push, so only claim it's live once the page serves.
 */
async function waitForLive(slug, timeoutMs = 240000) {
    const url = `${SITE}/artwork/${slug}`;
    const deadline = Date.now() + timeoutMs;
    while (Date.now() < deadline) {
        try {
            if ((await fetch(url, { method: "HEAD", redirect: "follow" })).ok) return url;
        } catch { /* still building */ }
        await new Promise((r) => setTimeout(r, 10000));
    }
    return null;
}

function card(artwork, live) {
    const missing = [];
    if (!artwork.titleAr) missing.push("«بالعربي ...» للاسم العربي");
    if (artwork.price === null) missing.push("«السعر ١٤٠٠» عشان تتباع");
    if (!artwork.story) missing.push("«احكي ...» بكلامك انتي عن اللوحة");

    return (
        `🖼 <b>${artwork.title}</b>${artwork.titleAr ? ` — ${artwork.titleAr}` : ""}\n` +
        `${money(artwork.price)}\n\n` +
        `<i>${artwork.description}</i>\n` +
        (artwork.story ? `\n${artwork.story}\n` : "") +
        (live ? `\n${live}\n` : "") +
        (missing.length ? `\nناقص لسه:\n• ${missing.join("\n• ")}\n` : "") +
        `\n«تراجع» لو عايزة تشيليها`
    );
}

async function publishAndReport(chat, artwork, prefix) {
    await repo.push();
    focus.set(chat, artwork.slug);
    const live = await waitForLive(artwork.slug);
    await say(chat, (prefix ? `${prefix}\n\n` : "") + card(artwork, live));
}

// -------------------------------------------------------------- Edit rules ---

/**
 * Plain-Arabic edits. Order matters: the Arabic-title rule has to be tested
 * before the title rule, since it also begins with a name-ish word.
 */
const EDITS = [
    { re: /^(?:بالعربي|عربي)\s+(.+)$/is, field: "titleAr" },
    { re: /^(?:الاسم|اسمها|سميها|title)\s+(.+)$/is, field: "title" },
    { re: /^(?:السعر|سعرها|price)\s+([\d.,]+)$/i, field: "price" },
    { re: /^(?:الخامة|الخامات|medium)\s+(.+)$/is, field: "medium" },
    { re: /^(?:المقاس|الحجم|size)\s+(.+)$/is, field: "size" },
    { re: /^(?:احكي|اكتب|القصة|story|notes)\s+(.+)$/is, field: "__notes" },
];

async function applyEdit(chat, slug, field, raw) {
    const catalogue = await readCatalogue();
    const artwork = catalogue.find((a) => a.slug === slug);
    if (!artwork) throw new Error("مش لاقي اللوحة دي");

    // Notes aren't stored — they're rewritten into the story, in her voice.
    if (field === "__notes") {
        await say(chat, "✍️ ثانية…");
        const image = await fs.readFile(path.join(process.cwd(), "public", artwork.image));
        const written = await generateCopy(
            { title: artwork.title, medium: artwork.medium, size: artwork.size, year: artwork.year, notes: raw },
            { catalogue: catalogue.filter((a) => a.slug !== slug), imageBuffer: image }
        );
        const { artwork: updated } = await updateArtwork(
            slug,
            { story: written.story, description: written.description },
            { commit: true }
        );
        await publishAndReport(chat, updated, "✅ اتكتبت");
        return;
    }

    const value = field === "price" ? Number(String(raw).replace(/[^0-9.]/g, "")) : raw.trim();
    if (field === "price" && (!Number.isFinite(value) || value <= 0)) {
        await say(chat, "اكتبي رقم، زي «السعر 1400»");
        return;
    }

    const { artwork: updated } = await updateArtwork(slug, { [field]: value }, { commit: true });
    await publishAndReport(chat, updated, "✅ اتظبطت");
}

// ---------------------------------------------------------------- Commands ---

async function handleCommand(chat, text) {
    const c = text.trim().toLowerCase();

    if (c === "/start" || c === "/help") {
        await say(chat,
            "أهلاً يا فنانة 👋 أنا <b>الأسطى</b>.\n\n" +
            "ابعتيلي <b>صورة</b> اللوحة وهي هتتنشر على الموقع على طول، " +
            "وهبعتلك اللينك.\n\n" +
            "وبعدين لو حابة تغيري حاجة اكتبيلي عادي:\n" +
            "• «الاسم Golden Hour»\n" +
            "• «بالعربي ساعة الذهب»\n" +
            "• «السعر 1400»\n" +
            "• «احكي رسمتها بالليل والضوء كان...»\n" +
            "• «تراجع» — تشيل آخر لوحة\n\n" +
            "/list — كل اللوحات");
        return true;
    }

    if (c === "/list") {
        const catalogue = await readCatalogue();
        await say(chat, `🖼 <b>${catalogue.length} لوحات</b>\n\n` + catalogue
            .map((a) => `• ${a.title} — ${a.sold ? "اتباعت" : money(a.price)}`).join("\n"));
        return true;
    }

    if (text.trim() === "تراجع" || c === "/undo") {
        const slug = focus.get(chat);
        if (!slug) { await say(chat, "مفيش حاجة أشيلها."); return true; }
        await say(chat, "⏪ بشيلها…");
        const { artwork } = await removeArtwork(slug, { commit: true, push: true });
        focus.delete(chat);
        await say(chat, `اتشالت «${artwork.title}». هتختفي من الموقع خلال دقيقتين.`);
        return true;
    }

    return false;
}

// ----------------------------------------------------------------- Router ---

async function handleMessage(message) {
    const chat = message.chat.id;
    const from = message.from;

    if (!ALLOWED.length) {
        console.log(`[id] ${from.id}  ${from.first_name ?? ""} @${from.username ?? "-"}`);
        await say(chat, `👋 Your Telegram ID is <code>${from.id}</code>\n\nAdd it to TELEGRAM_ALLOWED_IDS and restart me.`);
        return;
    }
    if (!ALLOWED.includes(String(from.id))) {
        console.log(`[denied] ${from.id} @${from.username ?? "-"}`);
        return;
    }

    let text = (message.text ?? message.caption ?? "").trim();

    // A voice note becomes text and then follows exactly the same path as typing,
    // so she can speak any instruction, not just the story.
    const audio = message.voice ?? message.audio;
    if (audio) {
        await say(chat, "🎧 بسمع…");
        const { buffer, name } = await download(audio.file_id);
        text = await transcribe(buffer, name || "voice.ogg");
        // Always show it back — a mis-heard word would otherwise be published in
        // her voice without her ever seeing it.
        await say(chat, `سمعت:\n<i>«${text}»</i>`);
    }

    if (text.startsWith("/") || text === "تراجع") {
        if (await handleCommand(chat, text)) return;
    }

    // A photo publishes immediately. Anything she typed with it becomes her notes.
    if (message.photo) {
        await say(chat, "📸 وصلتني… بجهزها");
        const imageBuffer = await downloadPhoto(message.photo);
        const { artwork } = await addArtwork(
            { imageBuffer, notes: text || undefined },
            { commit: true }
        );
        await publishAndReport(chat, artwork, "🚀 نزلت");
        return;
    }

    if (!text) return;

    const slug = focus.get(chat);
    if (!slug) {
        await say(chat, "ابعتيلي صورة الأول 📸");
        return;
    }

    for (const { re, field } of EDITS) {
        const match = text.match(re);
        if (match) {
            await applyEdit(chat, slug, field, match[1]);
            return;
        }
    }

    // Anything else that isn't a command is taken as her describing the piece.
    await applyEdit(chat, slug, "__notes", text);
}

// --------------------------------------------------------------- Long poll ---

async function main() {
    const me = await tg("getMe", {});
    console.log(`الأسطى running as @${me.username}`);
    console.log(ALLOWED.length
        ? `allowed ids: ${ALLOWED.join(", ")}`
        : "no allow-list yet — message the bot and it will report your id");

    let offset = 0;
    for (;;) {
        try {
            const updates = await tg("getUpdates", { offset, timeout: 30, allowed_updates: ["message"] });
            for (const update of updates) {
                offset = update.update_id + 1;
                if (!update.message) continue;
                try {
                    await handleMessage(update.message);
                } catch (err) {
                    console.error("handler:", err.message);
                    await say(update.message.chat.id, `❌ ${err.message.slice(0, 200)}`).catch(() => { });
                }
            }
        } catch (err) {
            console.error("poll:", err.message);
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
