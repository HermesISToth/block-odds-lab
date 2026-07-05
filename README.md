# Lottery Mining Stack

Zero-cost launch kit for a Bitcoin lottery mining niche site.

## Current Shape

- Static public site in `site/`
- Odds calculator with shareable presets
- Draft content briefs in `content/`
- Automation plan and starter data in `automation/` and `data/`

## Local Preview

Open `site/index.html` in a browser, or run a local static server:

```bash
cd lottery-mining-stack/site
python3 -m http.server 4177
```

Then visit `http://127.0.0.1:4177`.

## Refresh Local Watchlist

```bash
node automation/update-watchlist.mjs
```

This updates `data/watchlist.json` and writes a dated Markdown report in `reports/`.

## No-Spend Launch Path

1. Finish the first five article drafts.
2. Publish to free static hosting later: GitHub Pages, Cloudflare Pages, or Netlify free tier.
3. Use a free newsletter tool only after the landing page has real copy and a reason to subscribe.
4. Add affiliate links only after accounts are approved and disclosures are added.

## Monetization Roadmap

- Phase 1: Free calculator and guides to prove search demand.
- Phase 2: Email alert digest for gear, difficulty, firmware, and tuning updates.
- Phase 3: Affiliate comparison pages for power supplies, fans, cables, solo pool tools, and lottery miner vendors.
- Phase 4: Paid tuning dashboard/logbook template.
- Phase 5: Sponsor slots only after the audience exists.
