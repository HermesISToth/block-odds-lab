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
  expectedTime: document.querySelector("#expected-time"),
  dailyOdds: document.querySelector("#daily-odds"),
  monthlyOdds: document.querySelector("#monthly-odds"),
  yearlyOdds: document.querySelector("#yearly-odds"),
  expectedBtc: document.querySelector("#expected-btc"),
  powerCost: document.querySelector("#power-cost")
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

function calculate() {
  const hashrate = numberValue(els.hashrate) * numberValue(els.unit, 1);
  const difficulty = numberValue(els.difficulty);
  const reward = numberValue(els.reward);
  const btcPrice = numberValue(els.btcPrice);
  const watts = numberValue(els.watts);
  const kwh = numberValue(els.kwh);

  const expectedSeconds = difficulty * TWO_TO_32 / hashrate;
  const dailyChance = chanceForPeriod(SECONDS_PER_DAY, expectedSeconds);
  const monthlyChance = chanceForPeriod(SECONDS_PER_DAY * DAYS_PER_MONTH, expectedSeconds);
  const yearlyChance = chanceForPeriod(SECONDS_PER_DAY * DAYS_PER_YEAR, expectedSeconds);
  const expectedBlocksPerYear = SECONDS_PER_DAY * DAYS_PER_YEAR / expectedSeconds;
  const expectedBtc = expectedBlocksPerYear * reward;
  const yearlyPowerCost = watts / 1000 * 24 * DAYS_PER_YEAR * kwh;
  const expectedUsd = expectedBtc * btcPrice;

  els.expectedTime.textContent = formatDuration(expectedSeconds);
  els.dailyOdds.textContent = formatChance(dailyChance);
  els.monthlyOdds.textContent = formatChance(monthlyChance);
  els.yearlyOdds.textContent = formatChance(yearlyChance);
  els.expectedBtc.textContent = `${expectedBtc.toFixed(8)} BTC / $${expectedUsd.toFixed(2)}`;
  els.powerCost.textContent = `$${yearlyPowerCost.toFixed(2)}`;
}

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

calculate();

if ("serviceWorker" in navigator) {
  window.addEventListener("load", () => {
    navigator.serviceWorker.register("./service-worker.js").catch(() => {
      // The calculator still works without offline caching.
    });
  });
}
