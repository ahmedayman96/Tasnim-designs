#!/usr/bin/env node
/**
 * "الأسطى" — Telegram bot for the gallery.
 *
 *   node --env-file=.env.local tools/curator/bot.mjs
 *
 * Send a photo and it goes up. Everything else is a conversation — she just says
 * what she wants, typed or spoken, in Arabic or English, and the agent in
 * agent.mjs decides what to do. This file only carries messages between Telegram
 * and the agent; it makes no decisions of its own.
 *
 * Raw Bot API over long polling: no dependencies, no webhook, no public IP.
 */
import { addArtwork, repo } from "./index.mjs";
import { respond } from "./agent.mjs";
import { transcribe } from "./transcribe.mjs";
import sharp from "sharp";

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

// ------------------------------------------------------------------- State ---

/**
 * The piece each chat is currently talking about — edits apply to it.
 * Keeps the original uncropped photo so "actually, just the left one" still works
 * after the piece has already gone up.
 */
const focus = new Map();
const focusSlug = (chat) => focus.get(chat)?.slug;

/**
 * She switches between Arabic and English freely, so the bot's own lines follow
 * whichever she last used rather than being fixed in one language.
 */
const lastLang = new Map();
const isArabic = (text) => /[؀-ۿ]/.test(text ?? "");
const langFor = (chat) => lastLang.get(chat) ?? "ar";

const SAY = {
    ar: {
        gotPhoto: "📸 وصلتني… بجهزها",
        listening: "🎧 بسمع…",
        heard: "سمعت",
        published: "🚀 نزلت",
        noPrice: "من غير سعر",
        missing: "ناقص لسه",
        needAr: "الاسم بالعربي",
        needPrice: "السعر، عشان تتباع",
        needStory: "احكيلي عنها بكلامك",
    },
    en: {
        gotPhoto: "📸 Got it — one moment",
        listening: "🎧 Listening…",
        heard: "Heard",
        published: "🚀 It's up",
        noPrice: "no price yet",
        missing: "Still missing",
        needAr: "the Arabic title",
        needPrice: "a price, so it can sell",
        needStory: "a few words from you about it",
    },
};

const t = (chat) => SAY[langFor(chat)];

const money = (n, chat) =>
    typeof n === "number" ? `$${n.toLocaleString("en-US")}` : t(chat).noPrice;

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

function card(artwork, live, chat) {
    const L = t(chat);
    const missing = [];
    if (!artwork.titleAr) missing.push(L.needAr);
    if (artwork.price === null) missing.push(L.needPrice);
    if (!artwork.story) missing.push(L.needStory);

    return (
        `🖼 <b>${artwork.title}</b>${artwork.titleAr ? ` — ${artwork.titleAr}` : ""}\n` +
        `${money(artwork.price, chat)}\n\n` +
        `<i>${artwork.description}</i>\n` +
        (artwork.story ? `\n${artwork.story}\n` : "") +
        (live ? `\n${live}\n` : "") +
        (missing.length ? `\n${L.missing}:\n• ${missing.join("\n• ")}\n` : "")
    );
}

async function publishAndReport(chat, artwork, prefix, original) {
    await repo.push();
    const previous = focus.get(chat);
    focus.set(chat, {
        slug: artwork.slug,
        original: original ?? (previous?.slug === artwork.slug ? previous.original : undefined),
    });
    const live = await waitForLive(artwork.slug);
    await say(chat, (prefix ? `${prefix}\n\n` : "") + card(artwork, live, chat));
}

// ---------------------------------------------------------- Conversation ---

/** Recent turns per chat, so she can say "and that one too". */
const conversations = new Map();

function historyFor(chat) {
    if (!conversations.has(chat)) conversations.set(chat, []);
    const history = conversations.get(chat);
    // Keep it bounded; older turns stop being useful and cost tokens.
    if (history.length > 24) history.splice(0, history.length - 24);
    return history;
}

async function converse(chat, text) {
    const history = historyFor(chat);
    history.push({ role: "user", content: text });

    const reply = await respond(history, {
        focusSlug: focusSlug(chat),
        originalPhoto: () => focus.get(chat)?.original,
        notify: (t) => say(chat, t),
    });

    if (reply) await say(chat, reply);
}

/**
 * Pull an image out of whatever she sent. Returns a Buffer, null if the message
 * carries no image at all, or "unusable" when it holds something image-shaped that
 * cannot be used (an animated sticker, a HEIC the decoder can't read) — in which
 * case she has already been told why.
 */
async function incomingImage(message, chat) {
    let fileId = null;

    if (message.photo) {
        fileId = message.photo[message.photo.length - 1].file_id;
    } else if (message.sticker) {
        // Static stickers are WebP and decode fine. Animated ones are Lottie JSON
        // or WebM video and have no single frame to hang on a wall.
        if (message.sticker.is_animated || message.sticker.is_video) {
            await say(chat, langFor(chat) === "ar"
                ? "الاستيكر ده متحرك، مش هينفع كلوحة. ابعتيهالي صورة."
                : "That sticker is animated, so I can't use it as artwork. Send it as an image instead.");
            return "unusable";
        }
        fileId = message.sticker.file_id;
    } else if (message.document && (message.document.mime_type || "").startsWith("image/")) {
        fileId = message.document.file_id;
    }

    if (!fileId) return null;

    const { buffer } = await download(fileId);

    // Confirm it actually decodes before it reaches the catalogue, so an
    // unsupported format fails here with an explanation rather than deep inside
    // the publishing path.
    try {
        await sharp(buffer).metadata();
    } catch {
        await say(chat, langFor(chat) === "ar"
            ? "مش قادر أفتح الصورة دي. جربي تبعتيها JPG أو PNG."
            : "I couldn't open that image. Try sending it as a JPG or PNG.");
        return "unusable";
    }

    return buffer;
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
    if (text) lastLang.set(chat, isArabic(text) ? "ar" : "en");

    // A voice note becomes text and then follows exactly the same path as typing,
    // so she can speak any instruction, not just the story.
    const audio = message.voice ?? message.audio;
    if (audio) {
        await say(chat, t(chat).listening);
        const { buffer, name } = await download(audio.file_id);
        text = await transcribe(buffer, name || "voice.ogg");
        lastLang.set(chat, isArabic(text) ? "ar" : "en");
        // Always show it back — a mis-heard word would otherwise be published in
        // her voice without her ever seeing it.
        await say(chat, `${t(chat).heard}:\n<i>“${text}”</i>`);
    }

    // Any incoming image starts a new piece — sent as a photo, as a file, or as a
    // sticker. Telegram recompresses "photo" uploads hard, so a document is
    // actually the better way to send artwork and is worth accepting.
    const incoming = await incomingImage(message, chat);
    if (incoming === "unusable") return;
    if (incoming) {
        await say(chat, t(chat).gotPhoto);
        const { artwork } = await addArtwork(
            { imageBuffer: incoming, notes: text || undefined },
            { commit: true }
        );
        await publishAndReport(chat, artwork, t(chat).published, incoming);

        // Let the agent know, so "make it 1400" next message has something to act on.
        historyFor(chat).push({
            role: "user",
            content:
                `[she sent an image of a new piece; it is now on the site as ` +
                `slug "${artwork.slug}", titled "${artwork.title}", no price set` +
                `${text ? `. She said: ${text}` : ""}]`,
        });
        return;
    }

    if (!text) return;

    // Everything else is just conversation.
    await tg("sendChatAction", { chat_id: chat, action: "typing" }).catch(() => { });
    await converse(chat, text);
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
            // Two instances polling means one silently steals every message and
            // the other looks alive while doing nothing — which cost us an
            // afternoon of "the voice notes don't work". Fail loudly instead.
            if (/Conflict/i.test(err.message)) {
                console.error(
                    "\nAnother الأسطى is already running and is receiving the messages.\n" +
                    "Stop it before starting this one:\n" +
                    "  Get-CimInstance Win32_Process -Filter \"Name='node.exe'\" |\n" +
                    "    Where-Object { $_.CommandLine -like '*curator*bot.mjs*' } |\n" +
                    "    ForEach-Object { Stop-Process -Id $_.ProcessId -Force }\n"
                );
                process.exit(1);
            }
            console.error("poll:", err.message);
            await new Promise((r) => setTimeout(r, 5000));
        }
    }
}

main().catch((err) => { console.error(err); process.exit(1); });
