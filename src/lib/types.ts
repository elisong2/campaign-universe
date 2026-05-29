/**
 * Core data model for Campaign Universe.
 *
 * A Campaign has one hero Asset (centered in the visualization)
 * and N satellite Assets. Every Asset carries the same shape so
 * hero and satellites can be promoted/demoted freely.
 */

export type Platform =
  | "BROADCAST"
  | "YOUTUBE_LONGFORM"
  | "YOUTUBE_SHORTS"
  | "INSTAGRAM"
  | "TIKTOK"
  | "REDNOTE"
  | "SPOTIFY"
  | "APPLE_MUSIC"
  | "APPLE_PODCASTS"
  | "LIVE_EVENT"
  | "OUT_OF_HOME"
  | "BRAND_SITE"
  | "BURN_SITE";

export type Asset = {
  /** Stable identifier shown in the UI, e.g. "HERO.01", "SAT.04". */
  id: string;
  title: string;
  platforms: Platform[];
  /**
   * Open-ended descriptive format string that captures both the asset's
   * production format and its editorial type — e.g. "Cinematic film",
   * "Behind-the-scenes Reels", "Episodic short-form", "Mini documentary",
   * "Live activation", "Podcast". Replaces the old fixed-kind enum.
   */
  format: string;
  /** Free-text duration label, e.g. ":60", "6× :30", "12HR", "ONGOING". */
  duration: string;
  description: string;
  /**
   * Optional cartesian position in canvas coordinates. If absent, the
   * canvas places this asset using a default formation slot (inner ring
   * for index 0–7, outer rect for 8–11) based on its array index.
   * Set by free-drag and by handleAddSatellite's gap-fill logic.
   */
  position?: { x: number; y: number };
};

export type Campaign = {
  /** Stable identifier shown in the footer, e.g. "JB.USS.01". */
  id: string;
  brand: string;
  concept: string;
  hero: Asset;
  satellites: Asset[];
};

/** Human-readable platform labels. */
export const PLATFORM_LABELS: Record<Platform, string> = {
  BROADCAST: "Broadcast",
  YOUTUBE_LONGFORM: "YouTube",
  YOUTUBE_SHORTS: "YouTube Shorts",
  INSTAGRAM: "Instagram",
  TIKTOK: "TikTok",
  REDNOTE: "RedNote",
  SPOTIFY: "Spotify",
  APPLE_MUSIC: "Apple Music",
  APPLE_PODCASTS: "Apple Podcasts",
  LIVE_EVENT: "Live Event",
  OUT_OF_HOME: "Out of Home",
  BRAND_SITE: "Brand Site",
  BURN_SITE: "burnstudio.co",
};

/** Maximum satellites per campaign (inner ring 8 + outer rect 4). */
export const MAX_SATELLITES = 12;
