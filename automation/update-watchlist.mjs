import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const dataUrl = new URL("data/watchlist.json", root);
const reportsUrl = new URL("reports/", root);

async function fetchText(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "BlockOddsLab/0.1 local research" }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.text();
}

async function fetchJson(url) {
  const response = await fetch(url, {
    headers: { "user-agent": "BlockOddsLab/0.1 local research" }
  });
  if (!response.ok) throw new Error(`${url} returned ${response.status}`);
  return response.json();
}

function expectedYears(hashrateThs, difficulty) {
  const seconds = difficulty * 2 ** 32 / (hashrateThs * 1e12);
  return seconds / 86400 / 365.25;
}

function today() {
  return new Date().toISOString().slice(0, 10);
}

async function main() {
  const watchlist = JSON.parse(await readFile(dataUrl, "utf8"));
  const notes = [];

  let difficulty = watchlist.latestDefaults?.difficulty;
  let btcPriceUsd = watchlist.latestDefaults?.btcPriceUsd;

  try {
    difficulty = Number((await fetchText("https://blockchain.info/q/getdifficulty")).trim());
    notes.push("Difficulty refreshed from blockchain.info.");
  } catch (error) {
    notes.push(`Difficulty refresh failed: ${error.message}`);
  }

  try {
    const price = await fetchJson("https://api.coingecko.com/api/v3/simple/price?ids=bitcoin&vs_currencies=usd");
    btcPriceUsd = Number(price.bitcoin.usd);
    notes.push("BTC price refreshed from CoinGecko.");
  } catch (error) {
    notes.push(`BTC price refresh failed: ${error.message}`);
  }

  watchlist.latestDefaults = {
    difficulty,
    btcPriceUsd,
    sourceNotes: notes.join(" ")
  };
  watchlist.updated = new Date().toISOString();

  await writeFile(dataUrl, `${JSON.stringify(watchlist, null, 2)}\n`);
  await mkdir(reportsUrl, { recursive: true });

  const oneThYears = expectedYears(1, difficulty);
  const gammaYears = expectedYears(1.2, difficulty);
  const pushedGammaYears = expectedYears(1.8, difficulty);

  const report = `# Lottery Mining Watchlist - ${today()}

## Network Snapshot

- Difficulty: ${Math.round(difficulty).toLocaleString()}
- BTC price used: $${Math.round(btcPriceUsd).toLocaleString()}
- 1 TH/s expected block time: ${Math.round(oneThYears).toLocaleString()} years
- 1.2 TH/s expected block time: ${Math.round(gammaYears).toLocaleString()} years
- 1.8 TH/s expected block time: ${Math.round(pushedGammaYears).toLocaleString()} years

## Notes

${notes.map((note) => `- ${note}`).join("\n")}

## Next Human Picks Needed

- Choose 5-10 vendor/product URLs for miner stock and gear price monitoring.
- Choose whether the first public brand remains "Block Odds Lab."
- Choose the free publishing target when funding/approval is available.
`;

  await writeFile(new URL(`reports/watchlist-${today()}.md`, root), report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

