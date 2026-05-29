import type { Asset } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";

interface SatelliteCardProps {
  asset: Asset;
  selected?: boolean;
  dragging?: boolean;
  /**
   * Called on pointerdown. The parent decides — based on subsequent
   * pointermove distance — whether to treat this as a click (open
   * the detail panel) or a drag (reorder satellites around the orbit).
   */
  onPointerDown?: (id: string, e: React.PointerEvent) => void;
}

/**
 * Smaller orbital card. Same shape vocabulary as HeroCard so cards
 * can be promoted/demoted between hero and satellite without redesign.
 *
 * Shows ID, title, format, duration, platforms, and the full
 * description — nothing is truncated. Cards grow vertically with
 * description length; orbit radius (CANVAS.innerRadius in lib/layout)
 * is sized to give them room.
 */
export function SatelliteCard({
  asset,
  selected = false,
  dragging = false,
  onPointerDown,
}: SatelliteCardProps) {
  const platforms = asset.platforms.map((p) => PLATFORM_LABELS[p]).join(" · ");

  return (
    <article
      onPointerDown={(e) => {
        e.preventDefault(); // suppress text-selection on drag
        onPointerDown?.(asset.id, e);
      }}
      onClick={(e) => e.stopPropagation()} // don't bubble to canvas
      className={`relative w-[220px] bg-surface text-text transition-all duration-200 select-none rounded-card overflow-hidden ${
        dragging
          ? "scale-105 shadow-[0_12px_36px_rgba(191,71,35,0.42)] cursor-grabbing"
          : selected
            ? "shadow-[0_6px_28px_rgba(191,71,35,0.32)] cursor-grab"
            : "shadow-[0_2px_16px_rgba(0,0,0,0.5)] cursor-grab"
      }`}
    >
      <div className="px-4 py-2.5 flex flex-col gap-1">
        <div className="font-label text-text-muted">
          <span>{asset.id}</span>
        </div>
        <h3 className="text-[15px] leading-tight font-medium">{asset.title}</h3>
        {asset.format && (
          <div className="text-[12px] text-text-secondary">{asset.format}</div>
        )}
        <div className="text-[12px] text-text-secondary">
          {asset.duration || "—"}
        </div>
        <div className="text-[12px] text-text-secondary">{platforms || "—"}</div>
        {asset.description && (
          <p className="text-[13px] text-text-muted leading-snug">
            {asset.description}
          </p>
        )}
      </div>
    </article>
  );
}
