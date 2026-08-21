# Tasnim Elyamani — site notes

Portfolio **and storefront** for Tasnim Elyamani: a mixed-media artist who is also
an architect and interior designer. Live at **tasnimelyamani.com**. Real money moves
through this site — treat checkout as production.

Next.js 16 (App Router) · React 19 · Tailwind v4 · shadcn/ui · framer-motion ·
three.js / react-three-fiber · Stripe · OpenAI (room preview).

## Rules that matter

**Prices are server-side. Always.** The browser once sent `price` and the checkout
route passed it to Stripe as `unit_amount`, so anyone could buy the $2,000 piece for
$1 and the payment was valid. Fixed in `e022d0b`: `app/api/checkout/route.ts`
resolves every item by `slug` against the catalogue and ignores anything else the
client claims. Never reintroduce a client-supplied price, quantity or discount.

**`price: null` means "not for sale yet."** It renders as "Price on request" and
`isPurchasable()` makes checkout refuse it. This is how newly added work goes up
without a price a human hasn't typed. Never default a missing price to a number.

**Never write Tasnim's story for her.** The `story` field is first-person
biography. A model given only a title invented an aunt by name, a border crossing
in 1972, and two dead sons — fluent, in her voice, ready to publish under her name.
Models may describe what is *visible in the image*; they may rewrite notes she has
actually given. They may not supply the reason a piece was made. If there are no
notes, leave `story` empty.

**Bilingual EN/AR.** Every artwork carries `titleAr`; Arabic display fonts (Aref
Ruqaa, Amiri) load in `app/layout.tsx`. Arabic prose is written by Tasnim, never
generated — she is a native speaker and the models are not good enough at it.

## Content

Artworks live in `content/artworks.json`, typed and re-exported by
`lib/artworks.ts` (nine files import from there — keep its exports stable). There
is no CMS. Adding a piece = an entry in the JSON plus an image in `public/images/`.

Helpers: `getArtworkBySlug`, `isPurchasable`, `priceLabel`. Use `priceLabel()`
anywhere a price is shown — `price` is `number | null`, and interpolating it into
JSX silently renders a bare `$` rather than failing.

## tools/curator — "الأسطى"

A Telegram bot (`tools/curator/bot.mjs`) that lets Tasnim publish from her phone:
send a photo, it goes live, then she corrects it by typing or **speaking** plain
Arabic («الاسم ...» «بالعربي ...» «السعر ١٤٠٠» «احكي ...» «تراجع»).

Design rules, all deliberate:

- **The model returns text, nothing else.** Code does every file write, image
  operation and git action. The model has no filesystem or shell access.
- **`repo.mjs` will only stage `content/artworks.json` and `public/images/*`.**
  Payment routes and config are out of reach by construction, not by instruction.
  Do not widen that allowlist.
- **Theme colours are arithmetic, not generated** (`media.mjs`): dominant hue from
  the artwork's own pixels → near-black background, mid accent, pale text tint, and
  the nearest Tailwind families for the gradient string. A model looking at a JPEG
  only guesses at colour.
- Model is a config value (`CURATOR_MODEL`), OpenAI chat-completions dialect, so
  OpenRouter/local/anything works. Currently `gpt-4.1-mini`: chosen by measurement
  at ~$0.0008 per artwork. Beware `gpt-4o-mini` — it billed 25,913 input tokens for
  a photo where 4.1-mini billed 1,774.
- Voice notes via `gpt-4o-transcribe`, language pinned to `ar`. The transcript is
  always echoed back before being acted on.

Everything is exercisable without Telegram: `node tools/curator/cli.mjs list|add|
remove|update|undo`.

Secrets live in `.env.local` (gitignored): `CURATOR_API_KEY`, `CURATOR_MODEL`,
`TELEGRAM_BOT_TOKEN`, `TELEGRAM_ALLOWED_IDS`, `SITE_URL`.

## /architecture

A scroll-driven cinematic for her architecture work
(`components/architecture/ProjectSequence.tsx`), built on the same
sticky-viewport + `scrollYProgress` pattern as `ScrollHero`.

Four exterior renders of the El Shorouk villa crossfade while the camera pushes
into each. It moves through **time of day** — midday, afternoon, dusk, night —
rather than through space, because the four images are separate faces of the
building rather than a walk toward it. It ends on the lit entrance rotunda, which
is where an interior sequence attaches when interior renders exist.

**Scroll-linked `useTransform` input ranges must be clamped to [0, 1]** — see
`within()`. Framer Motion hands them to the native WAAPI scroll timeline, which
throws *"Offsets must be monotonically non-decreasing"* on out-of-range offsets.

**The copy on this page is placeholder** — the project name "Rotunda Villa" and
every caption were drafted, not written by Tasnim. Location and area are `"TBC"`
and deliberately hidden from the page until known. Replace with her words before
treating this page as finished.

## Building

`npm run build` needs `STRIPE_SECRET_KEY` — `lib/stripe.ts` throws at *import*,
and the build imports every route. A fresh clone or cloud sandbox with no
`.env.local` fails at "collect page data for /api/checkout". Placeholder values are
enough to get a build through.

`npm run lint` has 5 pre-existing errors in `Gallery3D.tsx`, `cart-context.tsx` and
`checkout/success/page.tsx`. They predate this work; don't be alarmed, don't count
them as yours.

## Still open

- Interior renders of the villa reception — the missing half of `/architecture`.
  Ask for a **camera walkthrough** rendered from 3ds Max (~150 frames, 1600×900,
  Corona GI in animation/fly-through mode, motion blur off) and the scroll sequence
  becomes a real moving camera rather than crossfades.
- The bot needs an always-on host; it currently runs from a terminal.
- Original-resolution elevation renders — the ones in `public/images/architecture/`
  came via WhatsApp at 1024–1600px, already recompressed.
