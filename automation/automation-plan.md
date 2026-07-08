# Automation Plan

## Jobs OpenClaw Can Run Later

Daily:
- Generate `reports/block-odds-growth-YYYY-MM-DD.md` from Cloudflare and Google Search Console.
- Summarize traffic, indexed URLs, pending indexing issues, query data, and next growth action in the evening report.
- Check Bitcoin difficulty and estimated next adjustment.
- Check selected miner vendor pages for stock and price changes.
- Check firmware/project release pages for Bitaxe/axeOS updates.
- Save notable changes into `data/watchlist.json`.

Weekly:
- Generate a newsletter draft from the watchlist.
- Suggest article updates based on stale prices, difficulty changes, or new product releases.
- Produce a short social post draft that points back to the calculator.

Monthly:
- Refresh comparison tables.
- Audit affiliate disclosures and link health.
- Review analytics: traffic, calculator usage, Search Console queries, indexing status, signup conversion, clicks.

## Approval Boundaries

OpenClaw can:
- Research, summarize, draft, and update local files.
- Monitor public pages.
- Prepare publish-ready content.

User approval required:
- Publishing to the web.
- Sending newsletters.
- Applying to affiliate programs.
- Contacting vendors or sponsors.
- Spending money.

## Free Sources To Start

- Bitcoin network data APIs.
- Public GitHub release pages.
- Vendor storefront pages manually selected by the user.
- Free static hosting after launch approval.
- Free analytics or self-hosted log review if hosting supports it.
