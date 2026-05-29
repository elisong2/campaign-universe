import type { Campaign, Asset } from "./types";
import { getDefaultFormationPosition } from "./layout";

/**
 * Seed campaigns — the three the brief calls out. Each satellite
 * gets an explicit position at one of the fixed 60°-interval inner
 * ring slots. Five satellites fill slots 0–4 (0°, 60°, 120°, 180°,
 * 240°) leaving slot 5 (300°) empty so adding a 6th satellite
 * completes a perfectly even 6-around layout.
 */

/** Place each satellite at the inner-ring slot matching its index. */
function placeOnInnerSlots(count: number) {
  return Array.from({ length: count }, (_, i) => getDefaultFormationPosition(i));
}

const JIM_BEAM_SATS: Asset[] = [
  {
    id: "SAT.01",
    title: "Backyard to Box Seats",
    platforms: ["INSTAGRAM", "TIKTOK"],
    format: "Episodic short-form",
    duration: "6× :15",
    description:
      "Daily superfan moments from prep to gameday — handheld, lo-fi, fan POV.",
  },
  {
    id: "SAT.02",
    title: "Inside Coming of Age",
    platforms: ["INSTAGRAM", "YOUTUBE_SHORTS"],
    format: "Behind the scenes",
    duration: "3× :30",
    description:
      "Director-side BTS on how the hero film came together — Kentucky bourbon country to stadium tunnels.",
  },
  {
    id: "SAT.03",
    title: "Kentucky Roots, Global Game",
    platforms: ["YOUTUBE_LONGFORM", "BURN_SITE"],
    format: "Long-form mini-doc",
    duration: "5:00",
    description:
      "Mini documentary pairing Jim Beam's American craft heritage with the global ritual of football fandom.",
  },
  {
    id: "SAT.04",
    title: "Home Field Bar Takeover",
    platforms: ["LIVE_EVENT"],
    format: "Live activation",
    duration: "EVENT",
    description:
      "On-site watch parties at partner bars on match nights, branded as the Jim Beam home field.",
  },
  {
    id: "SAT.05",
    title: "Bourbon & Ball",
    platforms: ["SPOTIFY", "APPLE_PODCASTS"],
    format: "Podcast",
    duration: "ONGOING",
    description:
      "Limited-run podcast pairing a USMNT player with a bourbon expert each episode.",
  },
];

export const jimBeam: Campaign = {
  id: "JB.USS.01",
  brand: "Jim Beam × US Soccer",
  concept:
    "Home Field Advantage — a superfan's journey from backyard to stadium, directed by Coming of Age. Kentucky roots meets global game.",
  hero: {
    id: "HERO.01",
    title: "Home Field Advantage",
    platforms: ["BROADCAST", "YOUTUBE_LONGFORM"],
    format: "Cinematic film",
    duration: ":60",
    description:
      "Hero cinematic following one superfan from his Kentucky backyard to the stands at a US national-team match.",
  },
  satellites: (() => {
    const positions = placeOnInnerSlots(JIM_BEAM_SATS.length);
    return JIM_BEAM_SATS.map((s, i) => ({ ...s, position: positions[i] }));
  })(),
};

const CIRCLE_ARC_SATS: Asset[] = [
  {
    id: "SAT.01",
    title: "Meet the Five",
    platforms: ["INSTAGRAM", "TIKTOK"],
    format: "Character recap shorts",
    duration: "5× :30",
    description:
      "Cold-open style intros for each of the five boardroom characters, posted leading up to the livestream.",
  },
  {
    id: "SAT.02",
    title: "Building the Boardroom",
    platforms: ["YOUTUBE_LONGFORM", "INSTAGRAM"],
    format: "Behind the scenes",
    duration: "3× :60",
    description:
      "Set build, casting, and rehearsal footage from the days leading up to the 12-hour stream.",
  },
  {
    id: "SAT.03",
    title: "Best Of: The 12 Hours",
    platforms: ["YOUTUBE_LONGFORM"],
    format: "Recap cut",
    duration: "8:00",
    description:
      "Director's cut of the funniest, most unhinged moments from the livestream — the best of the unwatchable.",
  },
  {
    id: "SAT.04",
    title: "Bored Room: NYC Pop-Up",
    platforms: ["LIVE_EVENT"],
    format: "Activation",
    duration: "EVENT",
    description:
      "A physical Bored Room you can sit in for an hour in downtown Manhattan, with Arc + Circle terminals running.",
  },
  {
    id: "SAT.05",
    title: "What We Learned in 12 Hours",
    platforms: ["SPOTIFY", "APPLE_PODCASTS"],
    format: "Podcast",
    duration: "6× :30",
    description:
      "Cast and crew unpacking what the boardroom experiment actually revealed about how work works.",
  },
];

export const circleArc: Campaign = {
  id: "CR.ARC.01",
  brand: "Circle × Arc",
  concept:
    "Bored Room — a 12-hour livestream inside a corporate boardroom as five characters discover Arc changes everything about how they work. Comedy meets crypto infrastructure.",
  hero: {
    id: "HERO.01",
    title: "Bored Room",
    platforms: ["LIVE_EVENT", "YOUTUBE_LONGFORM"],
    format: "Livestream",
    duration: "12HR",
    description:
      "Twelve uninterrupted hours of five characters trapped in a corporate boardroom — discovering Arc and Circle in real time, in front of the camera.",
  },
  satellites: (() => {
    const positions = placeOnInnerSlots(CIRCLE_ARC_SATS.length);
    return CIRCLE_ARC_SATS.map((s, i) => ({ ...s, position: positions[i] }));
  })(),
};

const PURINA_SATS: Asset[] = [
  {
    id: "SAT.01",
    title: "Training Day",
    platforms: ["INSTAGRAM"],
    format: "Reels",
    duration: ":15",
    description:
      "On-court training morning, Quincy on the sideline — short cuts surfacing on her grid the week of launch.",
  },
  {
    id: "SAT.02",
    title: "Athlete × Dog",
    platforms: ["TIKTOK"],
    format: "Episodic short-form",
    duration: "6× :30",
    description:
      "Recurring moments of Danielle and Quincy on the road — TikTok-native, low-fi, fan-engagement-first.",
  },
  {
    id: "SAT.03",
    title: "Behind the Craft",
    platforms: ["YOUTUBE_LONGFORM"],
    format: "Mini documentary",
    duration: "6:30",
    description:
      "A longer cut on what fuels elite performance — diet, training, recovery, and the dog who shows up to all of it.",
  },
  {
    id: "SAT.04",
    title: "Product Launch Activation",
    platforms: ["LIVE_EVENT"],
    format: "Live activation",
    duration: "EVENT",
    description:
      "On-site at a US Open week event with sample stations, photo ops with Danielle and Quincy, and a Pro Plan retail tie-in.",
  },
  {
    id: "SAT.05",
    title: "Athlete Interview",
    platforms: ["SPOTIFY", "APPLE_PODCASTS"],
    format: "Podcast",
    duration: "ONGOING",
    description:
      "Sit-down interview with Danielle on the discipline of pairing high-performance training with high-quality pet care.",
  },
];

export const purina: Campaign = {
  id: "PPP.01",
  brand: "Purina Pro Plan",
  concept:
    "Fueled By — a cinematic hero film following tennis champion Danielle Collins and her dog Quincy, showing how elite performance is fueled by the bond between athlete and animal.",
  hero: {
    id: "HERO.01",
    title: "Fueled By",
    platforms: ["BROADCAST", "YOUTUBE_LONGFORM"],
    format: "Cinematic film",
    duration: ":60",
    description:
      "Cinematic hero film following Danielle Collins and her dog Quincy through training mornings, road days, and quiet recovery — the bond beneath the championship.",
  },
  satellites: (() => {
    const positions = placeOnInnerSlots(PURINA_SATS.length);
    return PURINA_SATS.map((s, i) => ({ ...s, position: positions[i] }));
  })(),
};

export const seeds: Campaign[] = [jimBeam, circleArc, purina];
