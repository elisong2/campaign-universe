"use client";

import { useEffect, useRef, useState } from "react";
import type { Campaign } from "@/lib/types";

interface CampaignSwitcherProps {
  campaigns: Campaign[];
  activeId: string;
  onSelect: (id: string) => void;
  onCreateNew: () => void;
  /**
   * Delete handler. Disabled UX-wise (button hidden) when only one
   * campaign remains, since the app needs at least one to render.
   */
  onDelete?: (id: string) => void;
}

/**
 * Dropdown that replaces the static "CAMPAIGN · {id}" label in the
 * header. Lists every campaign in the workspace (seeds + user-created),
 * offers a per-campaign DELETE (revealed on hover) and a "+ NEW CAMPAIGN"
 * affordance at the bottom.
 *
 * Closes on outside click and Escape. Open/closed indicator uses a
 * small caret rendered to flip with state.
 */
export function CampaignSwitcher({
  campaigns,
  activeId,
  onSelect,
  onCreateNew,
  onDelete,
}: CampaignSwitcherProps) {
  const [open, setOpen] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);

  // Close on outside click
  useEffect(() => {
    if (!open) return;
    const onClick = (e: MouseEvent) => {
      if (
        containerRef.current &&
        !containerRef.current.contains(e.target as Node)
      ) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", onClick);
    return () => document.removeEventListener("mousedown", onClick);
  }, [open]);

  // Close on Escape
  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  const canDelete = campaigns.length > 1 && !!onDelete;

  return (
    <div ref={containerRef} className="relative">
      <button
        type="button"
        onClick={() => setOpen((o) => !o)}
        className="font-label text-text-muted hover:text-text transition-colors cursor-pointer flex items-center gap-2"
      >
        {/* <span>CAMPAIGN · {activeId}</span> */}
        <span> · {activeId}</span>
        <span className="text-[9px] inline-block">{open ? "▴" : "▾"}</span>
      </button>

      {open && (
        <div className="absolute top-full right-0 mt-2 min-w-[300px] bg-surface shadow-[0_8px_32px_rgba(0,0,0,0.6)] z-40 rounded-card overflow-hidden">
          {campaigns.map((c) => (
            <div
              key={c.id}
              className={`group flex items-stretch transition-colors ${
                c.id === activeId
                  ? "bg-surface-border"
                  : "hover:bg-surface-border/50"
              }`}
            >
              <button
                type="button"
                onClick={() => {
                  onSelect(c.id);
                  setOpen(false);
                }}
                className={`flex-1 text-left px-4 py-3 flex flex-col gap-1 cursor-pointer ${
                  c.id === activeId
                    ? "text-text"
                    : "text-text-muted hover:text-text"
                } transition-colors`}
              >
                <span className="font-label">{c.id}</span>
                <span className="text-[13px] truncate">
                  {c.brand || "Untitled"}
                </span>
              </button>
              {canDelete && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onDelete?.(c.id);
                  }}
                  aria-label={`Delete campaign ${c.id}`}
                  className="opacity-0 group-hover:opacity-100 text-[12px] text-text-muted hover:text-accent px-4 transition-opacity cursor-pointer"
                >
                  Delete
                </button>
              )}
            </div>
          ))}
          <div className="h-px bg-bg" />
          <button
            type="button"
            onClick={() => {
              onCreateNew();
              setOpen(false);
            }}
            className="w-full text-left px-4 py-3 text-[13px] text-text-muted hover:text-accent hover:bg-surface-border/50 transition-colors cursor-pointer"
          >
            + New campaign
          </button>
        </div>
      )}
    </div>
  );
}
