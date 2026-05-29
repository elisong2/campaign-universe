import type { Asset, Campaign } from "./types";
import { MAX_SATELLITES } from "./types";
import { nextSatelliteId } from "./asset-defaults";
import {
  getDefaultFormationPosition,
  type Point,
} from "./layout";

/**
 * Derive a short campaign-id code from a brand string.
 *
 *   "Jim Beam × US Soccer" → "JBUS.01"
 *   "Acme"                 → "A.01"
 *   ""                     → "NEW.01"
 */
export function deriveCampaignId(brand: string): string {
  if (!brand.trim()) return "NEW.01";
  const code =
    brand
      .replace(/[^A-Za-z\s×x&]/g, "")
      .split(/[\s×&]+/)
      .filter(Boolean)
      .map((word) => word[0]?.toUpperCase() ?? "")
      .join("")
      .slice(0, 4) || "NEW";
  return `${code}.01`;
}

/**
 * Same as deriveCampaignId, but increments the trailing `.NN` counter
 * if the base id is already in use by another campaign. Used when the
 * brand input changes and we want to re-derive the active campaign's
 * id without colliding with siblings.
 *
 *   brand="Jim Beam", existingIds=[] → "JB.01"
 *   brand="Jim Beam", existingIds=["JB.01"] → "JB.02"
 *   brand="Jim Beam", existingIds=["JB.01","JB.02"] → "JB.03"
 */
export function deriveUniqueCampaignId(
  brand: string,
  existingIds: string[],
): string {
  const base = deriveCampaignId(brand);
  const match = base.match(/^(.*)\.\d+$/);
  const code = match ? match[1] : base;

  let n = 1;
  let candidate = `${code}.${String(n).padStart(2, "0")}`;
  while (existingIds.includes(candidate)) {
    n++;
    candidate = `${code}.${String(n).padStart(2, "0")}`;
  }
  return candidate;
}

/**
 * Template hero used as the OFFLINE FALLBACK when the API doesn't
 * return a hero (deterministic generator path). When the API is
 * reachable, it produces an actual brand- and concept-specific title.
 *
 * "Anthem" lives in the format (not the title) because "anthem" is the
 * ad-industry term for a flagship hero spot — and the format is the
 * type slot. The title is reserved for the unique campaign name. Per
 * the prompt rules, only the hero ever uses an "Anthem" format;
 * satellites are forbidden from it.
 */
function makeTemplateHero(brand: string): Asset {
  const trimmed = brand.trim();
  return {
    id: "HERO.01",
    title: trimmed ? `Untitled ${trimmed} anthem` : "Untitled anthem",
    platforms: ["BROADCAST", "YOUTUBE_LONGFORM"],
    format: "Anthem film",
    duration: ":60",
    description:
      "Flagship anthem anchoring the campaign across broadcast and YouTube.",
  };
}

/**
 * Ordered list of fallback satellite templates, used by the
 * deterministic fallback when the Anthropic API is unavailable.
 * Each entry's `format` doubles as its dedupe key — the fallback skips
 * a template whose format already appears (case-insensitively) on an
 * existing satellite.
 */
const FALLBACK_TEMPLATES: Omit<Asset, "id">[] = [
  {
    title: "Social Series",
    platforms: ["INSTAGRAM", "TIKTOK"],
    format: "Episodic short-form",
    duration: "6× :15",
    description:
      "Recurring social-first cuts that extend the hero narrative across Instagram and TikTok.",
  },
  {
    title: "Behind the Scenes",
    platforms: ["INSTAGRAM", "YOUTUBE_SHORTS"],
    format: "Behind the scenes",
    duration: "3× :30",
    description: "Director and crew BTS on the making of the hero film.",
  },
  {
    title: "Long-form Companion",
    platforms: ["YOUTUBE_LONGFORM", "BURN_SITE"],
    format: "Mini documentary",
    duration: "5:00",
    description:
      "Extended documentary deepening the themes set up by the hero.",
  },
  {
    title: "Live Activation",
    platforms: ["LIVE_EVENT"],
    format: "Live activation",
    duration: "EVENT",
    description: "On-the-ground activation tied to a key campaign moment.",
  },
  {
    title: "Podcast",
    platforms: ["SPOTIFY", "APPLE_PODCASTS"],
    format: "Podcast",
    duration: "ONGOING",
    description:
      "Audio companion series running alongside the campaign roll-out.",
  },
];

/**
 * Pick a position for a NEW satellite based on its index in the
 * satellites array (= current count). Uses fixed formation slots,
 * not a gap-fill heuristic, so adds always snap to 60° intervals
 * on the inner ring and to the named outer rect slots in order.
 *
 *   - count 0–5: inner ring slot at (60° × count)
 *   - count 6–11: outer rect slot at (count − 6) — UR, R, LR, LL, L, UL
 *
 * Existing satellite positions are never modified.
 */
export function pickNewSatellitePosition(existingSatellites: Asset[]): Point {
  return getDefaultFormationPosition(existingSatellites.length);
}

/**
 * Deterministic version — extends with template satellites whose
 * formats are not yet present on the campaign. Used as the fallback
 * when the API isn't available.
 */
export function extendCampaignDeterministic(campaign: Campaign): Campaign {
  const room = MAX_SATELLITES - campaign.satellites.length;
  if (room <= 0) return campaign;

  const existingFormats = new Set(
    campaign.satellites.map((s) => s.format.trim().toLowerCase()),
  );
  const existingIds = [
    campaign.hero.id,
    ...campaign.satellites.map((s) => s.id),
  ];
  const additions: Asset[] = [];

  for (const template of FALLBACK_TEMPLATES) {
    if (additions.length >= room) break;
    if (existingFormats.has(template.format.trim().toLowerCase())) continue;

    const allSoFar = [...campaign.satellites, ...additions];
    const position = pickNewSatellitePosition(allSoFar);
    const newId = nextSatelliteId([
      ...existingIds,
      ...additions.map((a) => a.id),
    ]);
    additions.push({
      ...template,
      id: newId,
      position,
    });
  }

  const baseHero = campaign.hero.title.trim()
    ? campaign.hero
    : makeTemplateHero(campaign.brand);
  return {
    ...campaign,
    hero: baseHero,
    satellites: [...campaign.satellites, ...additions],
  };
}

/**
 * Async extendCampaign — calls the Anthropic API via `/api/generate`
 * for concept-aware suggestions, then falls back to the deterministic
 * generator on any failure.
 *
 * New satellites get positions assigned via pickNewSatellitePosition
 * so they land in sensible spots without disturbing existing positions.
 */
export async function extendCampaign(campaign: Campaign): Promise<Campaign> {
  const room = MAX_SATELLITES - campaign.satellites.length;
  if (room <= 0) return campaign;

  // Hand the cap to the model and let it pick a count it considers
  // appropriate. The response is still clamped to `room` below so the
  // 12-satellite total cap is enforced no matter what the model returns.
  const limit = room;

  try {
    const response = await fetch("/api/generate", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        brand: campaign.brand,
        concept: campaign.concept,
        hero: campaign.hero,
        existingSatellites: campaign.satellites,
        limit,
      }),
    });

    if (!response.ok) {
      throw new Error(`API responded ${response.status}`);
    }

    const data = (await response.json()) as {
      hero?: Omit<Asset, "id" | "position">;
      satellites: Omit<Asset, "id" | "position">[];
    };

    if (!Array.isArray(data.satellites) || data.satellites.length === 0) {
      throw new Error("API returned empty satellite list");
    }

    // Prefer existing hero. If untitled, take the API-generated one;
    // fall back to the offline template only if the API didn't return
    // one (older response shape or missing field).
    let baseHero: Asset;
    if (campaign.hero.title.trim()) {
      baseHero = campaign.hero;
    } else if (data.hero) {
      baseHero = { ...data.hero, id: campaign.hero.id || "HERO.01" };
    } else {
      baseHero = makeTemplateHero(campaign.brand);
    }
    const existingIds = [baseHero.id, ...campaign.satellites.map((s) => s.id)];
    const additions: Asset[] = [];

    for (const sat of data.satellites.slice(0, room)) {
      const allSoFar = [...campaign.satellites, ...additions];
      const position = pickNewSatellitePosition(allSoFar);
      const id = nextSatelliteId([
        ...existingIds,
        ...additions.map((a) => a.id),
      ]);
      additions.push({ ...sat, id, position });
    }

    return {
      ...campaign,
      hero: baseHero,
      satellites: [...campaign.satellites, ...additions],
    };
  } catch (e) {
    console.warn("[Campaign Universe] AI generate failed; falling back:", e);
    return extendCampaignDeterministic(campaign);
  }
}

/**
 * Create a fully blank campaign with the given id. Used by the
 * "+ NEW CAMPAIGN" flow.
 */
export function createBlankCampaign(id: string): Campaign {
  return {
    id,
    brand: "",
    concept: "",
    hero: {
      id: "HERO.01",
      title: "",
      platforms: [],
      format: "",
      duration: "",
      description: "",
    },
    satellites: [],
  };
}
