# BOL Substack Day 2 Ready-to-Post Packet - 2026-07-19

Status: ready to post. Public Substack UI posting was blocked during the 09:30 ET cron run because the signed-in `profile="user"` browser bridge passed doctor but timed out on tab/open actions, and direct CDP on port 9222 timed out retrieving the websocket URL. Do not count this as public until verified on `https://substack.com/@blockoddslabs`.

Primary routes:

- NerdMiner odds: https://blockoddslabs.com/nerdminer-bitcoin-odds.html
- Gamma odds: https://blockoddslabs.com/bitaxe-gamma-odds.html
- Direct Gamma product video: https://www.tiktok.com/@donkey.digital/video/7661637482294824223

## Day 2 Note

A NerdMiner can technically find a Bitcoin block. That sentence is true and still wildly misleading without the odds. Run the math before treating "possible" like "probable."

NerdMiner Bitcoin odds: https://blockoddslabs.com/nerdminer-bitcoin-odds.html

## Reply 1 - NerdMiner / Tiny Miner Thread

I think the best NerdMiner framing is "possible, but base-rate first." It can technically find a block, but the expected time is the point.

The hobby can still be fun. The odds just need to be visible before anyone treats the screenshot like a plan.

NerdMiner odds: https://blockoddslabs.com/nerdminer-bitcoin-odds.html

## Reply 2 - Beginner Solo Mining Thread

Expected time is not a countdown, and "can happen" is not the same as "likely enough to plan around."

For tiny solo miners, I would run hashrate against current difficulty first, then decide whether the setup is for learning, collecting, content, or a very honest lottery ticket.

Calculator: https://blockoddslabs.com/block-odds-calculator.html

## Reply 3 - Bitaxe / Gamma Buyer Thread

The same base-rate lesson applies when someone moves from NerdMiner curiosity to a Bitaxe Gamma. More hashrate helps, but it does not turn lottery mining into predictable income.

For a Gamma, compare stable hashrate, watts at the wall, current difficulty, and one-board versus two-board yearly odds before buying more hardware.

Gamma odds: https://blockoddslabs.com/bitaxe-gamma-odds.html

Gamma product video: https://www.tiktok.com/@donkey.digital/video/7661637482294824223

## Restack Comment

Good thread for the "possible vs. probable" distinction. Tiny miners are great for learning the system, but the base rate has to be part of the conversation. Once the odds are visible, the hobby gets more honest instead of less fun.

NerdMiner odds: https://blockoddslabs.com/nerdminer-bitcoin-odds.html

## 24-Hour Metrics Checked

- July 19 at 09:35 ET: 76 uniques / 100 page views / 216 requests.
- Useful top paths: homepage 30 visits, `/bitaxe-gamma-odds.html` 26, `/bitaxe-jackpot-odds.html` 8, `/bitaxe-odds-calculator.html` 7, `/notes.html` 5.
- Search Console still had no query rows.
- Sitemap health: 0 warnings / 0 errors.
- URL inspection still showed 12 URLs unknown to Google, including the Gamma, NerdMiner, calculator, notes, share-kit, and jackpot routes.

## Blocker

Substack public posting/replies/restack were not performed in this run. `openclaw.browser doctor profile="user"` passed, but `tabs` and `open` timed out through the existing-session bridge, and direct `playwright.connectOverCDP("http://127.0.0.1:9222")` timed out while retrieving the websocket URL. Avoid restarting Logan's browser during the cron unless explicitly approved.
