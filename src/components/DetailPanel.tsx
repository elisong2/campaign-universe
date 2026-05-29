"use client";

import { useEffect, useRef } from "react";
import type { Asset, Platform } from "@/lib/types";
import { PLATFORM_LABELS } from "@/lib/types";

interface DetailPanelProps {
  asset: Asset | null;
  isEditing: boolean;
  onClose: () => void;
  onToggleEdit: () => void;
  onUpdate: (id: string, updates: Partial<Asset>) => void;
  onDelete: (id: string) => void;
}

/** Platforms shown as toggle pills, grouped by category in display order. */
const ALL_PLATFORMS: Platform[] = [
  "BROADCAST",
  "YOUTUBE_LONGFORM",
  "YOUTUBE_SHORTS",
  "INSTAGRAM",
  "TIKTOK",
  "REDNOTE",
  "SPOTIFY",
  "APPLE_MUSIC",
  "APPLE_PODCASTS",
  "LIVE_EVENT",
  "OUT_OF_HOME",
  "BRAND_SITE",
  "BURN_SITE",
];

/**
 * Right-side slide-in panel showing the selected asset's metadata.
 *
 * Layout: header (pinned top), scrollable middle, DELETE footer (pinned
 * bottom — always visible for satellites, not gated on edit mode).
 *
 * Click-out behavior: document-level mousedown listener closes the
 * panel when the click is outside the panel AND not on a card / header
 * / footer. Works regardless of edit mode (this is what was missing
 * before — the section-level onClick approach didn't fire reliably
 * once an input inside the panel had focus).
 */
export function DetailPanel({
  asset,
  isEditing,
  onClose,
  onToggleEdit,
  onUpdate,
  onDelete,
}: DetailPanelProps) {
  const panelRef = useRef<HTMLElement>(null);

  // Close on Escape regardless of focus.
  useEffect(() => {
    if (!asset) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [asset, onClose]);

  // Close on click outside (excluding cards/header/footer).
  useEffect(() => {
    if (!asset) return;
    const onMouseDown = (e: MouseEvent) => {
      const target = e.target as HTMLElement | null;
      if (!target || !panelRef.current) return;
      // Click inside the panel — ignore.
      if (panelRef.current.contains(target)) return;
      // Click on a card — let the card's own onClick handle it (switch
      // selection, etc.). Don't close.
      if (target.closest("article")) return;
      // Click on header or footer — leave panel open so the user can
      // type into brand/concept inputs etc. without losing context.
      if (target.closest("header, footer")) return;
      onClose();
    };
    document.addEventListener("mousedown", onMouseDown);
    return () => document.removeEventListener("mousedown", onMouseDown);
  }, [asset, onClose]);

  const open = asset !== null;
  // Hero assets carry "HERO.NN" ids; satellites are "SAT.NN". This
  // replaces the previous `kind === "HERO"` check now that `kind`
  // has been folded into the open-ended `format` field.
  const isHero = asset?.id.startsWith("HERO.") ?? false;

  const togglePlatform = (platform: Platform) => {
    if (!asset) return;
    const next = asset.platforms.includes(platform)
      ? asset.platforms.filter((p) => p !== platform)
      : [...asset.platforms, platform];
    onUpdate(asset.id, { platforms: next });
  };

  return (
    <aside
      ref={panelRef}
      aria-hidden={!open}
      className={`fixed top-0 right-0 h-full w-[380px] bg-surface z-50 shadow-[0_0_60px_rgba(0,0,0,0.6)] transform transition-transform duration-300 ease-out ${
        open ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {asset && (
        <div className="flex flex-col h-full">
          {/* Header — fixed at top */}
          <div className="px-7 pt-7 pb-4 flex items-center justify-between shrink-0">
            <div className="font-label text-text-muted">{asset.id}</div>
            <div className="flex items-center gap-4">
              <button
                type="button"
                onClick={onToggleEdit}
                className="text-[13px] text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                {isEditing ? "Done" : "Edit"}
              </button>
              <button
                type="button"
                onClick={onClose}
                className="text-[13px] text-text-muted hover:text-text transition-colors cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>

          {/* Scrollable middle — title, metadata, description */}
          <div className="px-7 pb-6 flex-1 overflow-y-auto flex flex-col gap-6">
            {isEditing ? (
              <input
                value={asset.title}
                onChange={(e) =>
                  onUpdate(asset.id, { title: e.target.value })
                }
                className="text-[28px] leading-tight font-medium bg-transparent border-0 border-b border-surface-border focus:border-accent focus:outline-none w-full pb-1"
              />
            ) : (
              <h2 className="text-[28px] leading-tight font-medium">
                {asset.title || "—"}
              </h2>
            )}

            <dl className="flex flex-col gap-3">
              <Field label="PLATFORM">
                {isEditing ? (
                  <div className="flex flex-wrap gap-1">
                    {ALL_PLATFORMS.map((p) => (
                      <Pill
                        key={p}
                        active={asset.platforms.includes(p)}
                        onClick={() => togglePlatform(p)}
                      >
                        {PLATFORM_LABELS[p]}
                      </Pill>
                    ))}
                  </div>
                ) : (
                  <span className="text-text-secondary text-[14px]">
                    {asset.platforms.length > 0
                      ? asset.platforms
                          .map((p) => PLATFORM_LABELS[p])
                          .join(" · ")
                      : "—"}
                  </span>
                )}
              </Field>

              <Field label="FORMAT">
                {isEditing ? (
                  <input
                    value={asset.format}
                    onChange={(e) =>
                      onUpdate(asset.id, { format: e.target.value })
                    }
                    placeholder="—"
                    className="text-text-secondary text-[14px] bg-transparent border-0 border-b border-surface-border focus:border-accent focus:outline-none w-full pb-0.5"
                  />
                ) : (
                  <span className="text-text-secondary text-[14px]">
                    {asset.format || "—"}
                  </span>
                )}
              </Field>

              <Field label="DURATION">
                {isEditing ? (
                  <input
                    value={asset.duration}
                    onChange={(e) =>
                      onUpdate(asset.id, { duration: e.target.value })
                    }
                    placeholder="—"
                    className="text-text-secondary text-[14px] bg-transparent border-0 border-b border-surface-border focus:border-accent focus:outline-none w-full pb-0.5"
                  />
                ) : (
                  <span className="text-text-secondary text-[14px]">
                    {asset.duration || "—"}
                  </span>
                )}
              </Field>

              <Field label="ID">
                <span className="text-text-secondary text-[14px]">
                  {asset.id}
                </span>
              </Field>

            </dl>

            <div className="flex flex-col gap-2">
              <div className="font-label text-text-muted">DESCRIPTION</div>
              {isEditing ? (
                <textarea
                  value={asset.description}
                  onChange={(e) =>
                    onUpdate(asset.id, { description: e.target.value })
                  }
                  rows={6}
                  placeholder="Describe the asset…"
                  className="text-text-secondary text-[14px] leading-relaxed bg-transparent border border-surface-border focus:border-accent focus:outline-none w-full p-2 resize-none rounded-card"
                />
              ) : (
                <p className="text-text-secondary text-[14px] leading-relaxed">
                  {asset.description || "—"}
                </p>
              )}
            </div>
          </div>

          {/* Footer — DELETE always visible for satellites (no edit-mode gate) */}
          {!isHero && (
            <div className="px-7 py-4 shrink-0 border-t border-bg">
              <button
                type="button"
                onClick={() => onDelete(asset.id)}
                className="text-[13px] text-text-muted hover:text-accent transition-colors cursor-pointer"
              >
                Delete satellite
              </button>
            </div>
          )}
        </div>
      )}
    </aside>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-baseline gap-3">
      <dt className="font-label text-text-muted w-20 shrink-0">{label}</dt>
      <dd className="flex-1">{children}</dd>
    </div>
  );
}

function Pill({
  active,
  onClick,
  children,
}: {
  active: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`font-label px-2 py-1 cursor-pointer transition-colors rounded-card ${
        active
          ? "bg-surface-border text-text"
          : "text-text-muted hover:text-text-secondary"
      }`}
    >
      {children}
    </button>
  );
}
