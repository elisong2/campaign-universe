import { NextResponse } from "next/server";
import Anthropic from "@anthropic-ai/sdk";
import type { Asset } from "@/lib/types";

/**
 * Server-side route handler that calls the Anthropic API to suggest
 * complementary satellites for an existing campaign. Reads the API key
 * from `process.env.ANTHROPIC_API_KEY` (configured in `.env.local`).
 *
 * The route returns either:
 *   - 200 with `{ satellites: Array<Omit<Asset, "id">> }` on success
 *   - 500 with `{ error: string }` on any failure (missing key, model
 *     error, malformed JSON in the response, etc.)
 *
 * The frontend treats any non-200 as a signal to fall back to the
 * deterministic generator.
 */

// As of May 2026 this is the practical model for creative gen. Update
// to a newer Sonnet (4.6, 4.7…) if/when available.
// const MODEL = "claude-sonnet-4-5-20250929"; 
const MODEL = "claude-sonnet-4-6";

const SYSTEM_PROMPT = `You are a creative strategist at Burn Studio, a production company that makes campaigns for premium brands.

Given a brand, a creative concept, the current state of the hero asset, and the satellites that already exist in the campaign, your job is to suggest:
  1. (Conditionally) A HERO asset — the flagship anchor of the campaign — when the user prompt explicitly says the hero needs generation.
  2. SATELLITE content assets that complement the hero — assets the brand will produce as PART of this campaign.

Each asset (hero or satellite) lists 1–3 platforms, using EXACTLY these codes:
  BROADCAST, YOUTUBE_LONGFORM, YOUTUBE_SHORTS, INSTAGRAM, TIKTOK, REDNOTE,
  SPOTIFY, APPLE_MUSIC, APPLE_PODCASTS, LIVE_EVENT, OUT_OF_HOME,
  BRAND_SITE, BURN_SITE

Each asset has a "format" — an open-ended descriptive label that
captures BOTH the production format AND the editorial type of the asset.
Pick whatever phrasing best fits the asset. Good examples (not an exhaustive list):
  "Cinematic film", "Behind-the-scenes Reels", "Episodic short-form",
  "Mini documentary", "Long-form interview", "Live activation",
  "Pop-up event", "Podcast series", "Audio companion", "OOH takeover",
  "Brand-site microsite", "Director's cut", "Recap edit".
Be specific — "Athlete-narrated training doc" is better than "Documentary".

ANTHEM is RESERVED for the hero. The hero's format must contain
"Anthem" (e.g. "Anthem film", "Cinematic anthem", "Brand anthem",
"Anthem livestream") because "anthem" is the ad-industry term for a
flagship hero spot. Satellites MUST NOT use "Anthem" in their format
under any circumstances — pick a different production label.

Output rules — STRICT:
  - Return ONLY a valid JSON OBJECT with this shape:
      {
        "hero":       { title, platforms, format, duration, description },  // OMIT entirely when the user prompt says the hero is already set
        "satellites": [ { title, platforms, format, duration, description }, ... ]
      }
  - No prose, no markdown fences, no comments.
  - HERO fields (only when generating a hero):
      title       — short evocative campaign-defining name (2–5 words).
                    Real campaign titles, e.g. "Home Field Advantage",
                    "Bored Room", "Fueled By". Do NOT just append the
                    brand name to "Anthem" — pick an actual creative title.
      platforms   — array of platform codes (typically BROADCAST + YOUTUBE_LONGFORM,
                    but match the concept — a livestream-hero would use LIVE_EVENT etc.)
      format      — open-ended label CONTAINING "Anthem" (see rule above)
      duration    — production-shorthand string (typically ":60" or ":90")
      description — one-sentence description of the hero asset
  - SATELLITE fields:
      title       — short evocative title (2–6 words)
      platforms   — array of platform codes
      format      — open-ended descriptive label (3–8 words is typical;
                    longer is fine if it adds clarity). Never "Anthem".
      duration    — production-shorthand string (e.g. ":15", "6× :30",
                    "12HR", "ONGOING", "EVENT")
      description — one-sentence description of the asset
  - Do NOT include an "id" or "kind" field — the system assigns ids,
    and "kind" no longer exists (it's been folded into "format").
  - Do NOT suggest a second hero among the satellites.
  - Avoid producing two satellites with substantially the same format
    (e.g. don't propose two "Podcast" satellites) unless there's a
    deliberate creative reason.
  - Be SPECIFIC and ON-BRAND. Reference the brand or concept by name.
    Avoid generic placeholder titles like "Social Series" or "Podcast".
  - The satellite LIMIT in the user message applies to SATELLITES only;
    a hero, when requested, is in addition. Output between 2 and LIMIT satellites.

Count guidance — IMPORTANT: actively vary the satellite count based on
the campaign's actual scope. Don't default to the same number every time.
Signals to weigh:
  - A simple single-channel brand moment → 2–3 satellites is enough.
  - A typical multi-platform brand campaign → 4–6 satellites.
  - A major flagship rollout spanning broadcast, social, audio, live,
    and out-of-home → 7+ satellites.
  - Already-populated campaigns may need fewer additions than empty ones.
  - The LIMIT is a hard ceiling, NOT a target. Don't pad toward it.

Read the brand + concept carefully and pick a count that genuinely
matches that specific campaign's ambition. Different inputs should
produce different counts.`;

interface GenerateRequestBody {
  brand: string;
  concept: string;
  hero: Asset;
  existingSatellites: Asset[];
  /**
   * Maximum number of new satellites to suggest. The model picks any
   * count it deems appropriate (2 to `limit`), so we get a natural
   * count rather than a fixed batch.
   */
  limit?: number;
}

export async function POST(req: Request) {
  const apiKey = process.env.ANTHROPIC_API_KEY;
  if (!apiKey) {
    return NextResponse.json(
      { error: "ANTHROPIC_API_KEY not set in .env.local" },
      { status: 500 },
    );
  }

  let body: GenerateRequestBody;
  try {
    body = (await req.json()) as GenerateRequestBody;
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { brand, concept, hero, existingSatellites, limit = 5 } = body;

  // Compact summaries — avoid sending the full description text of every
  // existing satellite (saves tokens, and the model doesn't need it).
  const needsHero = !hero.title.trim();
  const heroSection = needsHero
    ? `Hero asset: NEEDS GENERATION — produce a "hero" field in the response. Pick an evocative campaign title rooted in the brand + concept (NOT a generic "{Brand} Anthem" stub). Format must contain "Anthem".`
    : `Hero asset (already set, do NOT regenerate; OMIT the "hero" field): "${hero.title}" (${hero.format || "hero"}, ${hero.duration})`;
  const existingSummary =
    existingSatellites.length > 0
      ? existingSatellites
          .map((s) => `- "${s.title}" (${s.format || "—"}, ${s.duration})`)
          .join("\n")
      : "(none yet)";

  const userPrompt = `Brand: ${brand || "(unspecified)"}
Concept: ${concept || "(unspecified)"}

${heroSection}

Existing satellites:
${existingSummary}

SATELLITE LIMIT (hard ceiling, NOT a target): ${limit}

Suggest new satellites that complement what's above. Apply the count
guidance from the system prompt — vary the number based on this
specific campaign's scope. Don't default to a fixed count.`;

  const client = new Anthropic({ apiKey });

  let responseText: string;
  try {
    const response = await client.messages.create({
      model: MODEL,
      max_tokens: 2000,
      system: SYSTEM_PROMPT,
      messages: [{ role: "user", content: userPrompt }],
    });
    const textBlock = response.content.find((c) => c.type === "text");
    if (!textBlock || textBlock.type !== "text") {
      return NextResponse.json(
        { error: "Model returned no text content" },
        { status: 500 },
      );
    }
    responseText = textBlock.text;
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `API call failed: ${msg}` },
      { status: 500 },
    );
  }

  // Parse the model's JSON. Robust to occasional markdown fences or
  // leading/trailing whitespace. Accepts either the new object shape
  // `{ hero?, satellites }` or the legacy bare array (for safety).
  let parsed: unknown;
  try {
    parsed = extractJson(responseText);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return NextResponse.json(
      { error: `JSON parse failed: ${msg}` },
      { status: 500 },
    );
  }

  let satellites: unknown[];
  let heroOut: Omit<Asset, "id" | "position"> | undefined;

  if (Array.isArray(parsed)) {
    // Legacy shape — bare satellites array.
    satellites = parsed;
  } else if (parsed && typeof parsed === "object") {
    const obj = parsed as { hero?: unknown; satellites?: unknown };
    if (obj.hero && typeof obj.hero === "object") {
      heroOut = obj.hero as Omit<Asset, "id" | "position">;
    }
    if (!Array.isArray(obj.satellites)) {
      return NextResponse.json(
        { error: "Model output object missing 'satellites' array" },
        { status: 500 },
      );
    }
    satellites = obj.satellites;
  } else {
    return NextResponse.json(
      { error: "Model output was not a JSON object or array" },
      { status: 500 },
    );
  }

  return NextResponse.json({ hero: heroOut, satellites });
}

/** Extract a JSON value (object or array) from a string that may have extra prose or fences. */
function extractJson(text: string): unknown {
  const trimmed = text.trim();

  // 1. Direct parse.
  try {
    return JSON.parse(trimmed);
  } catch {
    /* fall through */
  }

  // 2. Markdown code fence (```json ... ``` or ``` ... ```).
  const fenceMatch = trimmed.match(/```(?:json)?\s*([\s\S]+?)\s*```/);
  if (fenceMatch) {
    try {
      return JSON.parse(fenceMatch[1]);
    } catch {
      /* fall through */
    }
  }

  // 3. Find the first balanced object {...} (preferred — new shape).
  const objStart = trimmed.indexOf("{");
  const objEnd = trimmed.lastIndexOf("}");
  if (objStart >= 0 && objEnd > objStart) {
    try {
      return JSON.parse(trimmed.slice(objStart, objEnd + 1));
    } catch {
      /* fall through */
    }
  }

  // 4. Fall back to a balanced array [...] (legacy shape).
  const arrStart = trimmed.indexOf("[");
  const arrEnd = trimmed.lastIndexOf("]");
  if (arrStart >= 0 && arrEnd > arrStart) {
    try {
      return JSON.parse(trimmed.slice(arrStart, arrEnd + 1));
    } catch {
      /* fall through */
    }
  }

  throw new Error("No JSON found in model output");
}
