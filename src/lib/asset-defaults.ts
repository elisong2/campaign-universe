import type { Asset } from "./types";

/**
 * Generate the next available SAT.NN id given the IDs already in use.
 * Pads to two digits ("SAT.06"). Falls back to "SAT.01" if no existing
 * satellite IDs are found. Hero IDs (e.g. "HERO.01") are ignored.
 */
export function nextSatelliteId(existingIds: string[]): string {
  const usedNumbers = existingIds
    .map((id) => {
      const match = id.match(/^SAT\.(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((n) => !Number.isNaN(n));
  const nextNum =
    usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `SAT.${String(nextNum).padStart(2, "0")}`;
}

/**
 * Create a new blank satellite Asset ready to be edited. Format is
 * left empty so the user fills it in (or the API populates it on
 * the next GENERATE pass).
 */
export function createBlankSatellite(existingIds: string[]): Asset {
  return {
    id: nextSatelliteId(existingIds),
    title: "Untitled satellite",
    platforms: [],
    format: "",
    duration: "",
    description: "",
  };
}

/**
 * Generate the next available NEW.NN id for a user-created campaign,
 * given the campaign ids already in use. Pads to two digits. Falls
 * back to "NEW.01" if no existing NEW ids are found. Seed campaigns
 * have brand-derived ids (JB.USS.01, CR.ARC.01, PPP.01) and are
 * intentionally ignored here.
 */
export function nextNewCampaignId(existingIds: string[]): string {
  const usedNumbers = existingIds
    .map((id) => {
      const match = id.match(/^NEW\.(\d+)$/);
      return match ? parseInt(match[1], 10) : NaN;
    })
    .filter((n) => !Number.isNaN(n));
  const next = usedNumbers.length > 0 ? Math.max(...usedNumbers) + 1 : 1;
  return `NEW.${String(next).padStart(2, "0")}`;
}
