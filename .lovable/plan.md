## Plan: Add Prototype Notice, About Page & Contact

Make it clear what the app is, who's behind it, and how to get in touch.

### 1. Sitewide footer (every screen)
A compact footer visible on Monitoring, Exploration, and Construction tabs:
- **Prototype badge** — "Prototype" pill so visitors know it's a work-in-progress.
- **One-line description** — what the app does (portfolio analytics: monitoring, exploration, construction).
- **Contact link** — `teresa@blupointanalytics.co.nz` as a `mailto:` link.
- **About link** — opens the About page.

### 2. About page (`/about`)
A dedicated page explaining:
- **What this is** — a prototype portfolio analytics tool I've been playing with: monitor a portfolio's performance in NZD with FX impact, explore and compare individual assets, and construct what-if portfolios by tweaking weights against a baseline.
- **Who I am** — short intro for Teresa (you can refine the copy; I'll seed it with placeholder you can tweak).
- **Status** — explicitly labelled as an experimental prototype, not a production tool.
- **Contact** — email link to `teresa@blupointanalytics.co.nz`.

### Files to create
- `src/components/AppFooter.tsx` — footer with badge, description, contact, About link.
- `src/pages/About.tsx` — the About page content using existing Card/typography tokens.

### Files to edit
- `src/App.tsx` — add `<Route path="/about" element={<About />} />` and render `<AppFooter />` at the bottom of `MainApp` (so it shows on all three tabs).

### Styling
Uses existing semantic tokens (`text-muted-foreground`, `bg-muted`, `border-t`, `Badge`, `Card`) — no new colors or dependencies. About page uses the same container width as the rest of the app for consistency.

### Open question
Want me to draft the "Who I am" copy with a generic placeholder bio you edit later, or would you like to paste the exact text you want shown?