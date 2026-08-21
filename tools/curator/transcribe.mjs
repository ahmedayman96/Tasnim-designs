/**
 * Voice notes → text.
 *
 * Tasnim talking about a painting is the best possible source for its story:
 * they're her own words, and a transcript cannot contain anything she didn't say.
 * The transcript is always shown back to her, because a mis-heard word would
 * otherwise end up published in her voice without her ever seeing it.
 *
 *   CURATOR_TRANSCRIBE_MODEL   default gpt-4o-transcribe
 */

const DEFAULT_MODEL = "gpt-4o-transcribe";

/**
 * The API picks the decoder from the filename extension, not from the bytes, and
 * the gpt-4o transcribe models reject "oga" while accepting the identical file as
 * "ogg". Telegram names every voice note .oga, so the extension is normalised
 * here. (whisper-1 accepts .oga, but transcribes her dialect noticeably worse —
 * "الحاطة قداني" where gpt-4o-transcribe gets "الحيطة قدامي".)
 */
function sendableName(filename) {
    const ext = (filename.split(".").pop() || "").toLowerCase();
    const SUPPORTED = ["flac", "m4a", "mp3", "mp4", "mpeg", "mpga", "ogg", "wav", "webm"];
    if (ext === "oga" || !SUPPORTED.includes(ext)) return "voice.ogg";
    return filename;
}

/**
 * @param {Buffer} audio    Telegram voice notes are Ogg/Opus
 * @param {string} filename as Telegram named it; normalised before sending
 */
export async function transcribe(audio, filename = "voice.ogg") {
    const key = process.env.CURATOR_API_KEY;
    if (!key) throw new Error("CURATOR_API_KEY must be set to transcribe voice notes");

    const model = process.env.CURATOR_TRANSCRIBE_MODEL || DEFAULT_MODEL;

    const form = new FormData();
    form.append("file", new Blob([audio]), sendableName(filename));
    form.append("model", model);
    // She speaks Arabic; naming it stops the model hedging between languages on
    // short or noisy clips.
    form.append("language", "ar");

    const res = await fetch("https://api.openai.com/v1/audio/transcriptions", {
        method: "POST",
        headers: { Authorization: `Bearer ${key}` },
        body: form,
    });

    if (!res.ok) {
        throw new Error(
            `transcription failed (${res.status}): ${(await res.text()).slice(0, 200)}`
        );
    }

    const { text } = await res.json();
    if (!text || !text.trim()) throw new Error("لم أسمع شيئًا في الرسالة الصوتية");
    return text.trim();
}
