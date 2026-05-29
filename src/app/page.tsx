"use client";

import { useMemo, useRef, useState } from "react";
import { HeaderBar } from "@/components/HeaderBar";
import { FooterBar } from "@/components/FooterBar";
import { CampaignCanvas } from "@/components/CampaignCanvas";
import { DetailPanel } from "@/components/DetailPanel";
import { seeds } from "@/lib/seeds";
import {
  createBlankSatellite,
  nextNewCampaignId,
} from "@/lib/asset-defaults";
import {
  createBlankCampaign,
  deriveUniqueCampaignId,
  extendCampaign,
  pickNewSatellitePosition,
} from "@/lib/generate";
import {
  clampPositionToCanvas,
  getDefaultFormationPosition,
} from "@/lib/layout";
import { MAX_SATELLITES } from "@/lib/types";
import { usePersistedState } from "@/lib/use-persisted-state";
import type { Asset, Campaign } from "@/lib/types";

/** Type guard for the persisted campaigns array. */
function isCampaignArray(val: unknown): val is Campaign[] {
  if (!Array.isArray(val)) return false;
  if (val.length === 0) return false;
  return val.every(
    (c) =>
      typeof c === "object" &&
      c !== null &&
      typeof (c as Campaign).id === "string" &&
      Array.isArray((c as Campaign).satellites),
  );
}

/** Movement threshold (in px) below which a pointerdown counts as a click, not a drag. */
const CLICK_VS_DRAG_THRESHOLD = 5;

/**
 * Storage version. Bumped to v3 because:
 *   - Asset.position type changed to {x, y} cartesian
 *   - MAX_SATELLITES dropped from 16 to 12 (outer ring is now 4 corners)
 *   - Seeds now ship with explicit positions
 * Previous v2 data is abandoned cleanly.
 */
const STORAGE_VERSION = 4;

export default function Home() {
  // On first ever load: workspace starts as [NEW.01 blank, ...3 seeds]
  // with the blank one active so the user lands in the empty state.
  const initialCampaigns = useMemo<Campaign[]>(() => {
    const blank = createBlankCampaign("NEW.01");
    return [blank, ...seeds];
  }, []);

  const [campaigns, setCampaigns] = usePersistedState<Campaign[]>(
    `burn:campaigns:v${STORAGE_VERSION}`,
    initialCampaigns,
    isCampaignArray,
  );
  const [activeCampaignId, setActiveCampaignId] = usePersistedState<string>(
    `burn:activeCampaignId:v${STORAGE_VERSION}`,
    "NEW.01",
    (val): val is string => typeof val === "string",
  );
  const [selectedAssetId, setSelectedAssetId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [isGenerating, setIsGenerating] = useState(false);

  const canvasRef = useRef<HTMLDivElement>(null);

  const activeCampaign =
    campaigns.find((c) => c.id === activeCampaignId) ?? campaigns[0];

  const selectedAsset: Asset | null = (() => {
    if (!selectedAssetId) return null;
    if (activeCampaign.hero.id === selectedAssetId) return activeCampaign.hero;
    return (
      activeCampaign.satellites.find((s) => s.id === selectedAssetId) ?? null
    );
  })();

  const updateActiveCampaign = (updater: (c: Campaign) => Campaign) => {
    setCampaigns((prev) =>
      prev.map((c) => (c.id === activeCampaignId ? updater(c) : c)),
    );
  };

  // --- Campaign-level handlers ---

  const handleSelectCampaign = (id: string) => {
    setActiveCampaignId(id);
    setSelectedAssetId(null);
    setIsEditing(false);
  };

  const handleCreateNewCampaign = () => {
    const newId = nextNewCampaignId(campaigns.map((c) => c.id));
    const newCampaign = createBlankCampaign(newId);
    setCampaigns((prev) => [...prev, newCampaign]);
    setActiveCampaignId(newId);
    setSelectedAssetId(null);
    setIsEditing(false);
  };

  const handleDeleteCampaign = (id: string) => {
    setCampaigns((prev) => {
      if (prev.length <= 1) return prev;
      return prev.filter((c) => c.id !== id);
    });
    if (id === activeCampaignId) {
      const next = campaigns.find((c) => c.id !== id);
      if (next) {
        setActiveCampaignId(next.id);
      }
      setSelectedAssetId(null);
      setIsEditing(false);
    }
  };

  const handleUpdateCampaign = (
    updates: Partial<Pick<Campaign, "brand" | "concept">>,
  ) => {
    // If brand changed, re-derive the campaign id from the new brand
    // (e.g. "Jim Beam" → "JB.01"), with a uniqueness counter against
    // sibling campaigns so we never collide. activeCampaignId is also
    // updated so the switcher and selection stay pointed at the right
    // campaign once the rename lands.
    let nextId = activeCampaignId;
    if (
      updates.brand !== undefined &&
      updates.brand !== activeCampaign.brand
    ) {
      const otherIds = campaigns
        .filter((c) => c.id !== activeCampaignId)
        .map((c) => c.id);
      nextId = deriveUniqueCampaignId(updates.brand, otherIds);
    }

    setCampaigns((prev) =>
      prev.map((c) =>
        c.id === activeCampaignId ? { ...c, ...updates, id: nextId } : c,
      ),
    );

    if (nextId !== activeCampaignId) {
      setActiveCampaignId(nextId);
    }
  };

  const handleGenerate = async () => {
    if (isGenerating) return;
    const current = campaigns.find((c) => c.id === activeCampaignId);
    if (!current) return;
    setIsGenerating(true);
    try {
      const updated = await extendCampaign(current);
      setCampaigns((prev) =>
        prev.map((c) => (c.id === activeCampaignId ? updated : c)),
      );
      setSelectedAssetId(null);
      setIsEditing(false);
    } finally {
      setIsGenerating(false);
    }
  };

  // --- Asset-level handlers ---

  const handleSelect = (id: string) => {
    setSelectedAssetId((prev) => {
      const next = prev === id ? null : id;
      if (next !== prev) setIsEditing(false);
      return next;
    });
  };

  const handleClose = () => {
    setSelectedAssetId(null);
    setIsEditing(false);
  };

  const handleToggleEdit = () => {
    setIsEditing((prev) => !prev);
  };

  const handleUpdateAsset = (id: string, updates: Partial<Asset>) => {
    updateActiveCampaign((c) => {
      if (c.hero.id === id) {
        return { ...c, hero: { ...c.hero, ...updates } };
      }
      return {
        ...c,
        satellites: c.satellites.map((s) =>
          s.id === id ? { ...s, ...updates } : s,
        ),
      };
    });
  };

  const handleAddSatellite = () => {
    if (activeCampaign.satellites.length >= MAX_SATELLITES) return;
    const existingIds = [
      activeCampaign.hero.id,
      ...activeCampaign.satellites.map((s) => s.id),
    ];
    const newSat = createBlankSatellite(existingIds);
    newSat.position = pickNewSatellitePosition(activeCampaign.satellites);
    updateActiveCampaign((c) => ({
      ...c,
      satellites: [...c.satellites, newSat],
    }));
    setSelectedAssetId(newSat.id);
    setIsEditing(true);
  };

  const handleDeleteSatellite = (id: string) => {
    updateActiveCampaign((c) => ({
      ...c,
      satellites: c.satellites.filter((s) => s.id !== id),
    }));
    setSelectedAssetId(null);
    setIsEditing(false);
  };

  /**
   * Pointerdown handler for satellites. Distinguishes click vs drag by
   * a 5px movement threshold. Drag is FREE-positioning — the satellite
   * follows the cursor, with offset preservation (cursor stays where
   * it grabbed the card) and bounds-clamping. The dragged satellite's
   * position is written to its `position` field, persisting across
   * future renders and refreshes.
   */
  const handleSatellitePointerDown = (id: string, e: React.PointerEvent) => {
    if (!canvasRef.current) return;
    const rect0 = canvasRef.current.getBoundingClientRect();
    const startX = e.clientX;
    const startY = e.clientY;

    // Compute the offset between cursor and card center at grab time, so
    // the cursor's relative position within the card is preserved while
    // dragging (instead of the card snapping its center under the cursor).
    const sat = activeCampaign.satellites.find((s) => s.id === id);
    if (!sat) return;
    const idx = activeCampaign.satellites.findIndex((s) => s.id === id);
    const initialPos = sat.position ?? getDefaultFormationPosition(idx);
    const startCanvasX = startX - rect0.left;
    const startCanvasY = startY - rect0.top;
    const grabOffsetX = startCanvasX - initialPos.x;
    const grabOffsetY = startCanvasY - initialPos.y;

    let isDragging = false;

    const onMove = (mv: PointerEvent) => {
      if (!isDragging) {
        const dist = Math.hypot(mv.clientX - startX, mv.clientY - startY);
        if (dist < CLICK_VS_DRAG_THRESHOLD) return;
        isDragging = true;
        setDraggingId(id);
      }

      if (!canvasRef.current) return;
      const r = canvasRef.current.getBoundingClientRect();
      const newPos = clampPositionToCanvas({
        x: mv.clientX - r.left - grabOffsetX,
        y: mv.clientY - r.top - grabOffsetY,
      });

      updateActiveCampaign((prev) => ({
        ...prev,
        satellites: prev.satellites.map((s) =>
          s.id === id ? { ...s, position: newPos } : s,
        ),
      }));
    };

    const onUp = () => {
      if (!isDragging) {
        handleSelect(id);
      }
      setDraggingId(null);
      window.removeEventListener("pointermove", onMove);
      window.removeEventListener("pointerup", onUp);
    };

    window.addEventListener("pointermove", onMove);
    window.addEventListener("pointerup", onUp);
  };

  const atSatelliteCap = activeCampaign.satellites.length >= MAX_SATELLITES;

  return (
    <>
      <HeaderBar
        campaign={activeCampaign}
        campaigns={campaigns}
        onSelectCampaign={handleSelectCampaign}
        onCreateNewCampaign={handleCreateNewCampaign}
        onDeleteCampaign={handleDeleteCampaign}
        onUpdateCampaign={handleUpdateCampaign}
        onGenerate={handleGenerate}
        onAddSatellite={handleAddSatellite}
        addSatelliteDisabled={atSatelliteCap}
        generateDisabled={atSatelliteCap || isGenerating}
        isGenerating={isGenerating}
      />
      <CampaignCanvas
        campaign={activeCampaign}
        canvasRef={canvasRef}
        selectedAssetId={selectedAssetId}
        draggingId={draggingId}
        onSelect={handleSelect}
        onSatellitePointerDown={handleSatellitePointerDown}
      />
      <FooterBar campaign={activeCampaign} />
      <DetailPanel
        asset={selectedAsset}
        isEditing={isEditing}
        onClose={handleClose}
        onToggleEdit={handleToggleEdit}
        onUpdate={handleUpdateAsset}
        onDelete={handleDeleteSatellite}
      />
    </>
  );
}
