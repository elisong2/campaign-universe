import type { Campaign } from "@/lib/types";
import { CampaignSwitcher } from "./CampaignSwitcher";

interface HeaderBarProps {
  campaign: Campaign;
  campaigns: Campaign[];
  onSelectCampaign: (id: string) => void;
  onCreateNewCampaign: () => void;
  onDeleteCampaign: (id: string) => void;
  onUpdateCampaign: (
    updates: Partial<Pick<Campaign, "brand" | "concept">>,
  ) => void;
  onGenerate: () => void;
  onAddSatellite: () => void;
  /** Disable GENERATE when at the 12-satellite cap or mid-API call. */
  generateDisabled?: boolean;
  /** Disable + ADD SATELLITE when at the 12-satellite cap. */
  addSatelliteDisabled?: boolean;
  /** True while an API generation is in flight — show GENERATING… */
  isGenerating?: boolean;
}

/**
 * Top bar — two rows.
 *
 * Row 1: BURN logo (left, six-position rule anchor #1) and Burn's
 * tagline (right, matching their site).
 *
 * Row 2: BRAND + CONCEPT inputs (left, editable inline) and a stacked
 * action column (right) containing the CampaignSwitcher dropdown,
 * GENERATE, and + ADD SATELLITE. Placing the actions in line with the
 * brand/concept editor (instead of with the logo) groups all the
 * "things you do to a campaign" together visually.
 */
export function HeaderBar({
  campaign,
  campaigns,
  onSelectCampaign,
  onCreateNewCampaign,
  onDeleteCampaign,
  onUpdateCampaign,
  onGenerate,
  onAddSatellite,
  generateDisabled = false,
  addSatelliteDisabled = false,
  isGenerating = false,
}: HeaderBarProps) {
  return (
    <header className="px-10 pt-7 pb-6 flex flex-col gap-5">
      {/* Row 1 — logo + tagline */}
      <div className="flex items-center justify-between">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src="/Hero%20Logo%20-%20Off-White.png"
          alt="BURN"
          className="h-9 w-auto select-none"
          draggable={false}
        />
        <div className="font-label text-text">CAMPAIGN UNIVERSE</div>
      </div>

      {/* Row 2 — brand/concept inputs (left) + action stack (right) */}
      <div className="flex items-start justify-between gap-8">
        <div className="flex-1 flex flex-col gap-2 min-w-0">
          <div className="flex items-baseline gap-4">
            <label
              htmlFor="campaign-brand"
              className="text-[12px] text-text-muted w-16 shrink-0"
            >
              Brand
            </label>
            <input
              id="campaign-brand"
              value={campaign.brand}
              onChange={(e) => onUpdateCampaign({ brand: e.target.value })}
              placeholder="Enter brand…"
              className="text-text text-[14px] bg-transparent border-0 border-b border-transparent hover:border-surface-border focus:outline-none flex-1 pb-0.5 transition-colors min-w-0"
            />
          </div>
          <div className="flex items-start gap-4">
            <label
              htmlFor="campaign-concept"
              className="text-[12px] text-text-muted w-16 shrink-0 pt-1"
            >
              Concept
            </label>
            <textarea
              id="campaign-concept"
              value={campaign.concept}
              onChange={(e) => onUpdateCampaign({ concept: e.target.value })}
              placeholder="One-sentence creative concept…"
              rows={2}
              className="text-text-secondary text-[13px] leading-relaxed bg-transparent border-0 border-b border-transparent hover:border-surface-border focus:outline-none flex-1 pb-0.5 resize-none transition-colors max-w-3xl min-w-0"
            />
          </div>
        </div>

        <div className="flex items-center gap-0.5 shrink-0">
          <CampaignSwitcher
            campaigns={campaigns}
            activeId={campaign.id}
            onSelect={onSelectCampaign}
            onCreateNew={onCreateNewCampaign}
            onDelete={onDeleteCampaign}
          />
          <button
            type="button"
            onClick={onGenerate}
            disabled={generateDisabled}
            className="text-[13px] text-center bg-surface-border rounded-badge px-2.5 py-1 min-w-[100px] text-text-secondary hover:text-accent transition-colors cursor-pointer disabled:text-text-muted disabled:bg-surface-border/40 disabled:cursor-default disabled:hover:text-text-muted"
          >
            {isGenerating ? "Generating…" : "Generate"}
          </button>
          <button
            type="button"
            onClick={onAddSatellite}
            disabled={addSatelliteDisabled}
            className="text-[13px] bg-surface-border rounded-badge px-2.5 py-1 text-text-secondary hover:text-accent transition-colors cursor-pointer disabled:text-text-muted disabled:bg-surface-border/40 disabled:cursor-default disabled:hover:text-text-muted"
          >
            + Add satellite
          </button>
        </div>
      </div>
    </header>
  );
}
