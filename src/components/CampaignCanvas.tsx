import { useEffect, useRef, useState } from "react";
import type { Campaign } from "@/lib/types";
import { HeroCard } from "./HeroCard";
import { SatelliteCard } from "./SatelliteCard";
import { ConnectionLines } from "./ConnectionLines";
import {
  CANVAS,
  getDefaultFormationPosition,
  SATELLITE_CARD,
} from "@/lib/layout";

interface CampaignCanvasProps {
  campaign: Campaign;
  canvasRef: React.RefObject<HTMLDivElement | null>;
  selectedAssetId: string | null;
  draggingId: string | null;
  onSelect: (id: string) => void;
  onSatellitePointerDown: (id: string, e: React.PointerEvent) => void;
}

/**
 * The main visualization surface. Holds the SVG connection layer
 * (behind) and the absolutely-positioned cards (in front).
 *
 * Cards grow vertically with description length — to keep the
 * connection lines terminating cleanly at the actual card edge (and
 * not somewhere in the middle of a tall card), we measure each card
 * with ResizeObserver and pass per-satellite halfHeight values into
 * ConnectionLines. Before a card is measured, the static
 * SATELLITE_CARD.halfHeight fallback is used.
 */
export function CampaignCanvas({
  campaign,
  canvasRef,
  selectedAssetId,
  draggingId,
  onSelect,
  onSatellitePointerDown,
}: CampaignCanvasProps) {
  const observerRef = useRef<ResizeObserver | null>(null);
  const trackedRef = useRef<Map<string, HTMLDivElement>>(new Map());
  const [cardHeights, setCardHeights] = useState<Record<string, number>>({});

  // One ResizeObserver shared across all satellite wrappers. Each card
  // gets observed via a callback ref; when the wrapper's height
  // changes (description edited, font loaded, etc.), we update
  // cardHeights, which triggers ConnectionLines to recompute geometry.
  useEffect(() => {
    if (typeof ResizeObserver === "undefined") return;
    const obs = new ResizeObserver((entries) => {
      setCardHeights((prev) => {
        const next = { ...prev };
        let changed = false;
        for (const entry of entries) {
          const id = (entry.target as HTMLElement).dataset.satId;
          if (!id) continue;
          const h = entry.contentRect.height;
          if (Math.abs((next[id] ?? 0) - h) > 1) {
            next[id] = h;
            changed = true;
          }
        }
        return changed ? next : prev;
      });
    });
    observerRef.current = obs;
    return () => {
      obs.disconnect();
      observerRef.current = null;
    };
  }, []);

  const attachCardRef = (id: string) => (el: HTMLDivElement | null) => {
    const obs = observerRef.current;
    if (!obs) return;
    const prev = trackedRef.current.get(id);
    if (prev && prev !== el) {
      obs.unobserve(prev);
      trackedRef.current.delete(id);
    }
    if (el) {
      el.dataset.satId = id;
      obs.observe(el);
      trackedRef.current.set(id, el);
    }
  };

  const isEmpty =
    campaign.satellites.length === 0 && !campaign.hero.title.trim();

  if (isEmpty) {
    return (
      <section className="flex-1 flex items-center justify-center relative overflow-hidden">
        <div
          ref={canvasRef}
          className="relative flex flex-col items-center gap-5 text-center"
          style={{ width: CANVAS.width, height: CANVAS.height }}
        >
          <div className="flex-1" />
          {/* <div className="w-12 h-px bg-surface-border" /> */}
          <div className="font-label text-text-muted">EMPTY SYSTEM</div>
          <h2 className="text-[26px] text-text font-medium">
            Nothing in orbit yet...
          </h2>
          <p className="text-text-secondary text-[14px] max-w-[320px] leading-relaxed">
            Type a brand and concept above, then hit{" "}
            <span className="text-text font-medium">Generate</span> to populate
            the universe. Hit{" "}
            <span className="text-text font-medium">Add satellite</span> to
            brainstorm from scratch.
          </p>
          <div className="flex-1" />
        </div>
      </section>
    );
  }

  // Resolve each satellite's effective position and measured halfHeight.
  const positions = campaign.satellites.map((sat, i) => {
    const pos = sat.position ?? getDefaultFormationPosition(i);
    const measured = cardHeights[sat.id];
    const halfHeight = measured ? measured / 2 : SATELLITE_CARD.halfHeight;
    return { x: pos.x, y: pos.y, halfHeight };
  });
  const selectedSatelliteIndex = campaign.satellites.findIndex(
    (s) => s.id === selectedAssetId,
  );

  return (
    <section className="flex-1 flex items-center justify-center relative overflow-hidden">
      <div
        ref={canvasRef}
        className="relative"
        style={{ width: CANVAS.width, height: CANVAS.height }}
      >
        <ConnectionLines
          positions={positions}
          selectedIndex={selectedSatelliteIndex}
        />

        {/* Hero — anchored at canvas center; not draggable */}
        <div
          className="absolute"
          style={{
            left: CANVAS.heroX,
            top: CANVAS.heroY,
            transform: "translate(-50%, -50%)",
          }}
        >
          <HeroCard
            asset={campaign.hero}
            selected={selectedAssetId === campaign.hero.id}
            onClick={() => onSelect(campaign.hero.id)}
          />
        </div>

        {/* Satellites — observed for size changes via ResizeObserver */}
        {campaign.satellites.map((sat, i) => {
          const pos = positions[i];
          const isDragging = draggingId === sat.id;
          return (
            <div
              key={sat.id}
              ref={attachCardRef(sat.id)}
              className={`absolute ${
                isDragging ? "" : "transition-all duration-200 ease-out"
              }`}
              style={{
                left: pos.x,
                top: pos.y,
                transform: "translate(-50%, -50%)",
              }}
            >
              <SatelliteCard
                asset={sat}
                selected={selectedAssetId === sat.id}
                dragging={isDragging}
                onPointerDown={onSatellitePointerDown}
              />
            </div>
          );
        })}
      </div>
    </section>
  );
}
