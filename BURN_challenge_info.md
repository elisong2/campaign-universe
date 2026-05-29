Campaign Universe Builder

Time: 3 hours Tools: Codex + Claude Design

Stack: Next.js + Tailwind + TypeScript (must match our existing tools)

## THE BRIEF

Build a web tool called Campaign Universe that visualizes how a brand campaign extends across platforms.

Input: A brand name and a one-sentence creative concept.

Output: An interactive visual map showing the campaign ecosystem — a hero asset at the center with satellite content extending outward. Each node should be clickable and show: platform, format, estimated duration, and a one-line description.

## Example input:

Brand: Purina Pro Plan

Concept: "Fueled By" — a cinematic hero film following tennis champion Danielle Collins and her dog Quincy, showing how elite performance is fueled by the bond between athlete and animal.

Example output should show something like:

- Center: Hero Film (:60 cinematic, broadcast + YouTube)

- Orbiting: Training Day BTS (:15 Instagram Reels)

- Orbiting: Athlete x Dog Social Series (6x :30 TikTok)

- Orbiting: Product Launch Event (live activation)

- Orbiting: Behind the Craft (long-form YouTube)

- Orbiting: Podcast Interview (Spotify/Apple)

You decide how to visualize this. There is no wireframe. The visual metaphor — constellation, orbit, flow, network, something we haven't seen — is part of what we're evaluating.

## DESIGN SYSTEM

Your build must follow the Burn Studio design system. A DESIGN.md file will be provided that defines colors, typography, spacing, components, animation, and voice.

Non-negotiable brand rules:

- black, white or grey background

- Only one accent color per layout (Blue #1E5C8C, Rust #BF4723, or Sage #7C876F)

- ABC Camera Plain Medium for headings, Regular for body

- SimpsonCW Medium (ALL CAPS, wide tracking) for labels and metadata only

- No rounded corners on primary containers

- Cross-hatch texture on dark surfaces (subtle, barely visible)

- Logo placement follows the six-position rule (four corners + two centered anchors)

If something isn't specified in DESIGN.md, make a judgment call that feels consistent with the system.

## WHAT WE'RE LOOKING FOR

## 1. Brand fidelity (30%)

Does it look like it belongs in the Burn Studio product ecosystem? Would it sit naturally alongside our other internal tools? We'll compare your output against DESIGN.md point by point.

## 2. Product decisions (25%)

Where the brief is vague, you have to decide. How does the user add satellite nodes? Can they drag things? Is there a default layout that auto-populates from the concept? Every decision reveals taste.

## 3. Visual design (20%)

The campaign map visualization itself. Is it beautiful? Is it clear? Does it communicate hierarchy (hero vs. satellites) at a glance? Does it feel like a creative agency's tool or a generic dashboard?

## 4. Agentic engineering (15%)

We'll ask you to walk through how you used Codex. Did you write specs for it? Did you iterate on prompts? Did you catch and fix things it got wrong? Did you use it as leverage or generate spaghetti?

## 5. Code quality (10%)

Clean TypeScript, proper component structure, no build errors. npm run build must pass. We're not looking for perfect architecture — we're looking for evidence you'd maintain this code next week.

## DELIVERABLES

1. Product package file that we will push to Github and deploy in Railway.

## SEED DATA

Use these campaigns to pre-populate or demo the tool:

Campaign 1: Jim Beam x US Soccer — "Home Field Advantage"

Hero: :60 cinematic film following a superfan's journey from backyard to stadium, directed by Coming of Age. Kentucky roots meets global game.

Campaign 2: Circle x Arc — "Bored Room" Hero: 12-hour livestream inside a corporate boardroom as five characters discover Arc changes everything about how they work. Comedy meets crypto infrastructure.

Campaign 3: Purina Pro Plan

Hero: :1:30 broadcast, 5 x :15 social

## WHAT NOT TO DO

- Don't ignore DESIGN.md. If your output uses Helvetica, has rounded cards, or introduces colors outside the palette, that's a fail.

- Don't over-build. We'd rather see a polished single view than a half-broken multi-page app.
