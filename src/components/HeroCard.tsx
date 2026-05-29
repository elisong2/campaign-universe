import type { Asset } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";

interface HeroCardProps {
  asset: Asset;
  selected?: boolean;
  onClick?: () => void;
}

/**
 * The centered hero asset. Sized larger than satellites and marked
 * with the layout's single Rust accent stripe on the left edge.
 *
 * Shows ID, title, format, duration · platforms, and a 2-line description
 * preview. Full description (untruncated) lives in the detail panel.
 */
export function HeroCard({ asset, selected = false, onClick }: HeroCardProps) {
  const platforms = asset.platforms.map((p) => PLATFORM_LABELS[p]).join(" · ");
  return (
    <article
      onClick={(e) => {
        e.stopPropagation(); // don't bubble to canvas (which closes the panel)
        onClick?.();
      }}
      className={`relative w-[300px] bg-surface text-text cursor-pointer transition-shadow duration-200 rounded-card overflow-hidden ${
        selected
          ? "shadow-[0_8px_40px_rgba(191,71,35,0.28)]"
          : "shadow-[0_4px_24px_rgba(0,0,0,0.5)]"
      }`}
    >
      {/* Rust accent — the single accent allowed on this layout */}
      <div className="absolute left-0 top-0 bottom-0 w-[3px] bg-accent" />

      <div className="pl-6 pr-5 py-5 flex flex-col gap-3">
        <div className="font-label text-text-muted">
          <span>{asset.id}</span>
        </div>
        <h2 className="text-[26px] leading-tight font-medium">{asset.title}</h2>
        {asset.format && (
          <div className="text-[13px] text-text-secondary">{asset.format}</div>
        )}
        <div className="text-[13px] text-text-secondary">
          {asset.duration || "—"} · {platforms || "—"}
        </div>
        {asset.description && (
          <p className="text-[13px] text-text-muted leading-snug line-clamp-2">
            {asset.description}
          </p>
        )}
      </div>
    </article>
  );
}
