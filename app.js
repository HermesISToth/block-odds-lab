const SECONDS_PER_DAY = 86400;
const DAYS_PER_MONTH = 30.4375;
const DAYS_PER_YEAR = 365.25;
const TWO_TO_32 = 4294967296;

const els = {
  hashrate: document.querySelector("#hashrate"),
  unit: document.querySelector("#hashrate-unit"),
  difficulty: document.querySelector("#difficulty"),
  reward: document.querySelector("#reward"),
  btcPrice: document.querySelector("#btc-price"),
  watts: document.querySelector("#watts"),
  kwh: document.querySelector("#kwh"),
  poolFee: document.querySelector("#pool-fee"),
  hardwareCost: document.querySelector("#hardware-cost"),
  upgradeHashrate: document.querySelector("#upgrade-hashrate"),
  upgradeUnit: document.querySelector("#upgrade-unit"),
  upgradeWatts: document.querySelector("#upgrade-watts"),
  upgradeCost: document.querySelector("#upgrade-cost"),
  upgradeYears: document.querySelector("#upgrade-years"),
  expectedTime: document.querySelector("#expected-time"),
  dailyOdds: document.querySelector("#daily-odds"),
  monthlyOdds: document.querySelector("#monthly-odds"),
  yearlyOdds: document.querySelector("#yearly-odds"),
  netExpected: document.querySelector("#net-expected"),
  profitPerWatt: document.querySelector("#profit-per-watt"),
  hardwarePayback: document.querySelector("#hardware-payback"),
  expectedBtc: document.querySelector("#expected-btc"),
  powerCost: document.querySelector("#power-cost"),
  shareSummary: document.querySelector("#share-summary"),
  shareUrl: document.querySelector("#share-url"),
  copyShare: document.querySelector("#copy-share"),
  nativeShare: document.querySelector("#native-share"),
  shareStatus: document.querySelector("#share-status"),
  oddsGain: document.querySelector("#odds-gain"),
  netGain: document.querySelector("#net-gain"),
  breakEvenBudget: document.querySelector("#break-even-budget"),
  upgradeVerdict: document.querySelector("#upgrade-verdict")
};

function numberValue(input, fallback = 0) {
  const value = Number(input.value);
  return Number.isFinite(value) ? value : fallback;
}

function chanceForPeriod(periodSeconds, expectedSeconds) {
  if (!Number.isFinite(expectedSeconds) || expectedSeconds <= 0) return 0;
  return 1 - Math.exp(-periodSeconds / expectedSeconds);
}

function formatChance(chance) {
  if (chance <= 0) return "0%";
  const oneIn = 1 / chance;
  if (oneIn >= 1000) return `1 in ${Math.round(oneIn).toLocaleString()}`;
  if (chance < 0.01) return `${(chance * 100).toFixed(4)}%`;
  if (chance < 0.1) return `${(chance * 100).toFixed(3)}%`;
  return `${(chance * 100).toFixed(2)}%`;
}

function formatDuration(seconds) {
  if (!Number.isFinite(seconds) || seconds <= 0) return "-";
  const years = seconds / (SECONDS_PER_DAY * DAYS_PER_YEAR);
  if (years >= 1000000) return `${(years / 1000000).toFixed(2)}M years`;
  if (years >= 1000) return `${Math.round(years).toLocaleString()} years`;
  if (years >= 1) return `${years.toFixed(1)} years`;
  const days = seconds / SECONDS_PER_DAY;
  if (days >= 1) return `${days.toFixed(1)} days`;
  const hours = seconds / 3600;
  if (hours >= 1) return `${hours.toFixed(1)} hours`;
  return `${Math.max(1, Math.round(seconds)).toLocaleString()} seconds`;
}

function yearlyStats(hashrate, difficulty, reward, btcPrice, watts, kwh, poolFee = 0) {
  const feeMultiplier = Math.max(0, 1 - Math.min(100, Math.max(0, poolFee)) / 100);
  const powerCost = watts / 1000 * 24 * DAYS_PER_YEAR * kwh;

  if (hashrate <= 0 || difficulty <= 0) {
    return {
      expectedSeconds: Infinity,
      yearlyChance: 0,
      expectedBtc: 0,
      expectedUsd: 0,
      powerCost,
      netExpectedUsd: -powerCost,
      profitPerWatt: watts > 0 ? -powerCost / DAYS_PER_YEAR / watts : 0
    };
  }

  const expectedSeconds = difficulty * TWO_TO_32 / hashrate;
  const yearlyChance = chanceForPeriod(SECONDS_PER_DAY * DAYS_PER_YEAR, expectedSeconds);
  const expectedBlocksPerYear = SECONDS_PER_DAY * DAYS_PER_YEAR / expectedSeconds;
  const expectedBtc = expectedBlocksPerYear * reward * feeMultiplier;
  const expectedUsd = expectedBtc * btcPrice;
  const netExpectedUsd = expectedUsd - powerCost;

  return {
    expectedSeconds,
    yearlyChance,
    expectedBtc,
    expectedUsd,
    powerCost,
    netExpectedUsd,
    profitPerWatt: watts > 0 ? netExpectedUsd / DAYS_PER_YEAR / watts : 0
  };
}

function formatUsd(value) {
  const sign = value < 0 ? "-" : "";
  return `${sign}$${Math.abs(value).toFixed(2)}`;
}

function formatPayback(years) {
  if (!Number.isFinite(years) || years <= 0) return "No payback";
  if (years >= 1000) return "No practical payback";
  if (years >= 10) return `${Math.round(years)} years`;
  if (years >= 1) return `${years.toFixed(1)} years`;
  return `${Math.max(1, Math.round(years * 12))} months`;
}

function unitLabel(multiplier) {
  if (multiplier === 1000000000) return "GH/s";
  if (multiplier === 1000000000000000) return "PH/s";
  return "TH/s";
}

function buildShareUrl() {
  const url = new URL(window.location.href);
  url.hash = "calculator";
  url.searchParams.set("h", numberValue(els.hashrate).toString());
  url.searchParams.set("u", els.unit.value);
  url.searchParams.set("d", numberValue(els.difficulty).toString());
  url.searchParams.set("r", numberValue(els.reward).toString());
  url.searchParams.set("p", numberValue(els.btcPrice).toString());
  url.searchParams.set("w", numberValue(els.watts).toString());
  url.searchParams.set("k", numberValue(els.kwh).toString());
  url.searchParams.set("f", numberValue(els.poolFee).toString());
  url.searchParams.set("c", numberValue(els.hardwareCost).toString());
  return url;
}

function hydrateFromUrl() {
  if (!els.hashrate) return;
  const params = new URLSearchParams(window.location.search);
  const mapping = [
    ["h", els.hashrate],
    ["u", els.unit],
    ["d", els.difficulty],
    ["r", els.reward],
    ["p", els.btcPrice],
    ["w", els.watts],
    ["k", els.kwh],
    ["f", els.poolFee],
    ["c", els.hardwareCost]
  ];

  mapping.forEach(([key, input]) => {
    const value = params.get(key);
    if (value !== null && input) input.value = value;
  });
}

function verdictFor(netGainPerYear, hardwareCost, years) {
  const totalNet = netGainPerYear * years - hardwareCost;
  if (netGainPerYear <= 0) return "Hobby only";
  if (totalNet >= hardwareCost * 0.25) return "Strong upgrade";
  if (totalNet >= 0) return "Math-positive";
  return "Weak payback";
}

function calculate() {
  if (!els.hashrate || !els.unit || !els.difficulty) return;
  const hashrate = numberValue(els.hashrate) * numberValue(els.unit, 1);
  const difficulty = numberValue(els.difficulty);
  const reward = numberValue(els.reward);
  const btcPrice = numberValue(els.btcPrice);
  const watts = numberValue(els.watts);
  const kwh = numberValue(els.kwh);
  const poolFee = numberValue(els.poolFee);
  const hardwareCostCurrent = numberValue(els.hardwareCost);

  const current = yearlyStats(hashrate, difficulty, reward, btcPrice, watts, kwh, poolFee);
  const dailyChance = chanceForPeriod(SECONDS_PER_DAY, current.expectedSeconds);
  const monthlyChance = chanceForPeriod(SECONDS_PER_DAY * DAYS_PER_MONTH, current.expectedSeconds);
  const paybackYears = current.netExpectedUsd > 0 && hardwareCostCurrent > 0
    ? hardwareCostCurrent / current.netExpectedUsd
    : Infinity;

  els.expectedTime.textContent = formatDuration(current.expectedSeconds);
  els.dailyOdds.textContent = formatChance(dailyChance);
  els.monthlyOdds.textContent = formatChance(monthlyChance);
  els.yearlyOdds.textContent = formatChance(current.yearlyChance);
  els.netExpected.textContent = `${formatUsd(current.netExpectedUsd)} / year`;
  els.profitPerWatt.textContent = `${formatUsd(current.profitPerWatt)} / W / day`;
  els.hardwarePayback.textContent = formatPayback(paybackYears);
  els.expectedBtc.textContent = `${current.expectedBtc.toFixed(8)} BTC / ${formatUsd(current.expectedUsd)}`;
  els.powerCost.textContent = formatUsd(current.powerCost);

  if (els.shareSummary && els.shareUrl) {
    const shareUrl = buildShareUrl();
    const hashrateLabel = `${numberValue(els.hashrate)} ${unitLabel(numberValue(els.unit, 1))}`;
    const summary = `I ran a ${hashrateLabel} Bitcoin lottery-mining setup through Block Odds Lab. Result: ${formatDuration(current.expectedSeconds)} expected time, ${formatChance(dailyChance)} daily chance, ${formatChance(current.yearlyChance)} yearly chance. EV after fee is ${current.expectedBtc.toFixed(8)} BTC / ${formatUsd(current.expectedUsd)} per year; net after power is ${formatUsd(current.netExpectedUsd)} per year. Run yours before buying the next miner.`;
    els.shareSummary.textContent = summary;
    els.shareUrl.value = shareUrl.toString();
    window.history.replaceState({}, "", shareUrl);
  }

  if (!els.upgradeHashrate || !els.upgradeUnit) return;

  const upgradeHashrate = numberValue(els.upgradeHashrate) * numberValue(els.upgradeUnit, 1);
  const upgradeWatts = numberValue(els.upgradeWatts);
  const hardwareCost = numberValue(els.upgradeCost);
  const years = Math.max(0.25, numberValue(els.upgradeYears, 1));
  const upgrade = yearlyStats(upgradeHashrate, difficulty, reward, btcPrice, upgradeWatts, kwh, poolFee);
  const oddsDelta = Math.max(0, upgrade.yearlyChance - current.yearlyChance);
  const netGainPerYear = upgrade.netExpectedUsd - current.netExpectedUsd;
  const breakEvenBudget = Math.max(0, netGainPerYear * years);

  els.oddsGain.textContent = `+${formatChance(oddsDelta)}`;
  els.netGain.textContent = `${formatUsd(netGainPerYear)} / year`;
  els.breakEvenBudget.textContent = `${formatUsd(breakEvenBudget)} over ${years}y`;
  els.upgradeVerdict.textContent = verdictFor(netGainPerYear, hardwareCost, years);
}

if (els.hashrate) {
  hydrateFromUrl();

  document.querySelectorAll("input, select").forEach((input) => {
    input.addEventListener("input", calculate);
  });

  document.querySelectorAll("[data-preset]").forEach((button) => {
    button.addEventListener("click", () => {
      els.hashrate.value = button.dataset.preset;
      els.unit.value = "1000000000000";
      calculate();
    });
  });

  if (els.copyShare) {
    els.copyShare.addEventListener("click", async () => {
      const text = `${els.shareSummary.textContent}\n${els.shareUrl.value}`;
      try {
        await navigator.clipboard.writeText(text);
        els.shareStatus.textContent = "Copied";
      } catch {
        els.shareUrl.select();
        els.shareStatus.textContent = "Select and copy";
      }
    });
  }

  if (els.nativeShare) {
    if (!navigator.share) {
      els.nativeShare.hidden = true;
    } else {
      els.nativeShare.addEventListener("click", async () => {
        try {
          await navigator.share({
            title: "My Block Odds Lab result",
            text: els.shareSummary.textContent,
            url: els.shareUrl.value
          });
          els.shareStatus.textContent = "Shared";
        } catch {
          els.shareStatus.textContent = "";
        }
      });
    }
  }

  calculate();
}

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    const manifestHref = document.querySelector("link[rel='manifest']")?.getAttribute("href") || "./manifest.webmanifest";
    const manifestUrl = new URL(manifestHref, window.location.href);
    const serviceWorkerUrl = new URL("service-worker.js", manifestUrl);
    navigator.serviceWorker.register(serviceWorkerUrl).catch(() => {
      // The calculator still works without offline caching.
    });
  });
}
