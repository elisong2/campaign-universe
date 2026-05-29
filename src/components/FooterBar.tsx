import { useEffect, useState } from "react";
import type { Campaign } from "@/lib/types";

interface FooterBarProps {
  campaign: Campaign;
}

const pad = (n: number) => String(n).padStart(2, "0");

function formatLocalOffset(date: Date): string {
  const totalMinutes = -date.getTimezoneOffset();
  const sign = totalMinutes >= 0 ? "+" : "-";
  const abs = Math.abs(totalMinutes);
  const hours = Math.floor(abs / 60);
  const minutes = abs % 60;
  return minutes === 0
    ? `GMT${sign}${hours}`
    : `GMT${sign}${hours}:${pad(minutes)}`;
}

export function FooterBar({ campaign }: FooterBarProps) {
  const totalAssets = campaign.satellites.length + 1; // +1 for hero
  const [clock, setClock] = useState("");

  useEffect(() => {
    const tick = () => {
      const online = typeof navigator === "undefined" ? true : navigator.onLine;
      const now = new Date();
      if (online) {
        setClock(
          `${formatLocalOffset(now)} ${pad(now.getHours())}:${pad(now.getMinutes())}:${pad(now.getSeconds())}`,
        );
      } else {
        const gmt1 = new Date(
          now.getTime() + (now.getTimezoneOffset() + 60) * 60_000,
        );
        setClock(
          `GMT+1 ${pad(gmt1.getHours())}:${pad(gmt1.getMinutes())}:${pad(gmt1.getSeconds())}`,
        );
      }
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, []);

  return (
    <footer className="px-10 py-4 flex items-center justify-between">
      <div className="font-label text-text-muted flex gap-2">
        <span> {campaign.id}</span>
        <span>·</span>
        <span>{String(totalAssets).padStart(2, "0")} ASSETS</span>
        <span>·</span>
        <span>HERO{campaign.hero.duration}</span>
      </div>
      <div className="font-label text-text-muted tracking-[0.2em] tabular-nums">
        {clock}
      </div>
    </footer>
  );
}
