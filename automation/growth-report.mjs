import { createSign } from "node:crypto";
import { mkdir, readFile, writeFile } from "node:fs/promises";

const root = new URL("../", import.meta.url);
const envUrl = new URL(".env", root);
const serviceAccountUrl = new URL("secrets/google-search-console-service-account.json", root);
const sitemapUrl = "https://blockoddslabs.com/sitemap.xml";
const siteUrl = "https://blockoddslabs.com/";

function todayLocal() {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: "America/New_York",
    year: "numeric",
    month: "2-digit",
    day: "2-digit"
  }).format(new Date());
}

function isoDateDaysAgo(daysAgo) {
  const date = new Date();
  date.setUTCDate(date.getUTCDate() - daysAgo);
  return date.toISOString().slice(0, 10);
}

function utcStart(date = new Date()) {
  return `${date.toISOString().slice(0, 10)}T00:00:00Z`;
}

function parseEnv(text) {
  const values = {};
  for (const rawLine of text.split(/\r?\n/)) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq === -1) continue;
    values[line.slice(0, eq)] = line.slice(eq + 1);
  }
  return values;
}

function b64url(input) {
  return Buffer.from(input)
    .toString("base64")
    .replaceAll("+", "-")
    .replaceAll("/", "_")
    .replaceAll("=", "");
}

function jsonB64url(value) {
  return b64url(JSON.stringify(value));
}

async function fetchJson(url, options = {}) {
  const response = await fetch(url, options);
  const text = await response.text();
  let json;
  try {
    json = text ? JSON.parse(text) : {};
  } catch {
    throw new Error(`${url} returned non-JSON response: ${text.slice(0, 300)}`);
  }
  if (!response.ok) {
    throw new Error(`${url} returned ${response.status}: ${JSON.stringify(json).slice(0, 700)}`);
  }
  return json;
}

async function cloudflareGraphql(env, query, variables) {
  const body = await fetchJson("https://api.cloudflare.com/client/v4/graphql", {
    method: "POST",
    headers: {
      authorization: `Bearer ${env.CLOUDFLARE_API_TOKEN}`,
      "content-type": "application/json"
    },
    body: JSON.stringify({ query, variables })
  });
  if (body.errors?.length) {
    throw new Error(`Cloudflare GraphQL error: ${JSON.stringify(body.errors).slice(0, 1200)}`);
  }
  return body.data.viewer.zones[0];
}

async function googleAccessToken(serviceAccount) {
  const now = Math.floor(Date.now() / 1000);
  const header = { alg: "RS256", typ: "JWT" };
  const claim = {
    iss: serviceAccount.client_email,
    scope: "https://www.googleapis.com/auth/webmasters.readonly",
    aud: serviceAccount.token_uri,
    iat: now,
    exp: now + 3600
  };
  const unsigned = `${jsonB64url(header)}.${jsonB64url(claim)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsigned);
  signer.end();
  const signature = signer.sign(serviceAccount.private_key, "base64url");
  const token = await fetchJson(serviceAccount.token_uri, {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion: `${unsigned}.${signature}`
    })
  });
  return token.access_token;
}

function searchConsoleHeaders(accessToken) {
  return {
    authorization: `Bearer ${accessToken}`,
    "content-type": "application/json"
  };
}

async function gscGet(accessToken, path) {
  return fetchJson(`https://www.googleapis.com/webmasters/v3/${path}`, {
    headers: searchConsoleHeaders(accessToken)
  });
}

async function gscPost(accessToken, url, body) {
  return fetchJson(url, {
    method: "POST",
    headers: searchConsoleHeaders(accessToken),
    body: JSON.stringify(body)
  });
}

async function sitemapUrls() {
  const response = await fetch(sitemapUrl);
  if (!response.ok) throw new Error(`Sitemap returned ${response.status}`);
  const xml = await response.text();
  return [...xml.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => match[1]);
}

function table(headers, rows) {
  if (!rows.length) return "_No rows yet._";
  const escape = (value) => String(value ?? "").replaceAll("|", "\\|");
  return [
    `| ${headers.join(" | ")} |`,
    `| ${headers.map(() => "---").join(" | ")} |`,
    ...rows.map((row) => `| ${row.map(escape).join(" | ")} |`)
  ].join("\n");
}

function fmtNumber(value) {
  return Number(value ?? 0).toLocaleString();
}

function bytesMb(value) {
  return `${(Number(value ?? 0) / 1024 / 1024).toFixed(1)} MB`;
}

function pageName(url) {
  return url.replace("https://blockoddslabs.com", "") || "/";
}

function summarizeIndex(inspections) {
  const groups = new Map();
  for (const item of inspections) {
    groups.set(item.coverage, (groups.get(item.coverage) ?? 0) + 1);
  }
  return [...groups.entries()].sort((a, b) => b[1] - a[1]);
}

function recommendationText({ daily, paths, agents, inspections, queries }) {
  const notes = [];
  const today = daily.at(-1);
  const homepage = paths.find((row) => row.dimensions.clientRequestPath === "/");
  const pending = inspections.filter((item) => item.coverage && item.coverage !== "Submitted and indexed");
  const queryRows = queries.rows ?? [];

  if (today) {
    notes.push(`Today is at ${fmtNumber(today.uniq.uniques)} unique visitors and ${fmtNumber(today.sum.pageViews)} page views so far.`);
  }
  if (homepage && Number(homepage.sum.visits) > 0) {
    notes.push(`Homepage remains the main landing surface with ${fmtNumber(homepage.sum.visits)} visits today; keep improving calculator/article pathways from there.`);
  }
  if (pending.length) {
    notes.push(`Indexing follow-up: ${pending.map((item) => `${pageName(item.url)} (${item.coverage})`).join(", ")}.`);
  }
  const crawlerVisits = agents
    .filter((row) => row.dimensions.verifiedBotCategory || ["ChromeHeadless", "Curl"].includes(row.dimensions.userAgentBrowser))
    .reduce((sum, row) => sum + Number(row.sum.visits ?? 0), 0);
  if (crawlerVisits) {
    notes.push(`Crawler/tool traffic is present (${fmtNumber(crawlerVisits)} visits in the top user-agent groups), so judge growth by page visits and Search Console queries, not raw requests alone.`);
  }
  if (!queryRows.length) {
    notes.push("Search Console has no query rows yet; wait for Google to accumulate impressions before making query-led changes.");
  }
  return notes.map((note) => `- ${note}`).join("\n");
}

async function main() {
  const env = parseEnv(await readFile(envUrl, "utf8"));
  const serviceAccount = JSON.parse(await readFile(serviceAccountUrl, "utf8"));
  for (const key of ["CLOUDFLARE_API_TOKEN", "CLOUDFLARE_ZONE_ID"]) {
    if (!env[key]) throw new Error(`Missing ${key} in .env`);
  }

  const sinceDate = isoDateDaysAgo(7);
  const todayStart = utcStart();
  const dailyQuery = `query($zoneTag: string, $sinceDate: Date) {
    viewer {
      zones(filter: {zoneTag: $zoneTag}) {
        httpRequests1dGroups(limit: 10, filter: {date_geq: $sinceDate}, orderBy: [date_ASC]) {
          dimensions { date }
          sum { requests pageViews bytes cachedBytes }
          uniq { uniques }
        }
      }
    }
  }`;
  const detailQuery = `query($zoneTag: string, $since: Time) {
    viewer {
      zones(filter: {zoneTag: $zoneTag}) {
        paths: httpRequestsAdaptiveGroups(limit: 12, filter: {datetime_geq: $since}, orderBy: [count_DESC]) {
          dimensions { clientRequestPath }
          count
          sum { visits }
        }
        countries: httpRequestsAdaptiveGroups(limit: 12, filter: {datetime_geq: $since}, orderBy: [count_DESC]) {
          dimensions { clientCountryName }
          count
          sum { visits }
        }
        agents: httpRequestsAdaptiveGroups(limit: 12, filter: {datetime_geq: $since}, orderBy: [count_DESC]) {
          dimensions { verifiedBotCategory userAgentBrowser userAgentOS }
          count
          sum { visits }
        }
      }
    }
  }`;

  const [dailyData, detailData] = await Promise.all([
    cloudflareGraphql(env, dailyQuery, { zoneTag: env.CLOUDFLARE_ZONE_ID, sinceDate }),
    cloudflareGraphql(env, detailQuery, { zoneTag: env.CLOUDFLARE_ZONE_ID, since: todayStart })
  ]);

  const accessToken = await googleAccessToken(serviceAccount);
  const encodedSite = encodeURIComponent(siteUrl);
  const [sites, sitemaps, urls] = await Promise.all([
    gscGet(accessToken, "sites"),
    gscGet(accessToken, `sites/${encodedSite}/sitemaps`),
    sitemapUrls()
  ]);
  const queryEndDate = isoDateDaysAgo(0);
  const queryStartDate = isoDateDaysAgo(28);
  const queries = await gscPost(
    accessToken,
    `https://www.googleapis.com/webmasters/v3/sites/${encodedSite}/searchAnalytics/query`,
    {
      startDate: queryStartDate,
      endDate: queryEndDate,
      dimensions: ["query", "page"],
      rowLimit: 25
    }
  );

  const inspections = [];
  for (const url of urls) {
    const result = await gscPost(
      accessToken,
      "https://searchconsole.googleapis.com/v1/urlInspection/index:inspect",
      { inspectionUrl: url, siteUrl }
    );
    const status = result.inspectionResult?.indexStatusResult ?? {};
    inspections.push({
      url,
      coverage: status.coverageState ?? "Unknown",
      indexing: status.indexingState ?? "Unknown",
      robots: status.robotsTxtState ?? "Unknown",
      fetch: status.pageFetchState ?? "Unknown",
      lastCrawl: status.lastCrawlTime ?? "",
      canonical: status.googleCanonical ?? ""
    });
    await new Promise((resolve) => setTimeout(resolve, 350));
  }

  const daily = dailyData.httpRequests1dGroups ?? [];
  const paths = detailData.paths ?? [];
  const countries = detailData.countries ?? [];
  const agents = detailData.agents ?? [];
  const sitemap = sitemaps.sitemap?.[0];
  const site = sites.siteEntry?.find((entry) => entry.siteUrl === siteUrl);
  const reportDate = todayLocal();
  const generatedAt = new Date().toISOString();

  const report = `# Block Odds Labs Growth Report - ${reportDate}

Generated: ${generatedAt}

## Access Health

- Cloudflare GraphQL: OK
- Search Console property: ${site?.siteUrl ?? "missing"}
- Search Console permission: ${site?.permissionLevel ?? "missing"}
- Sitemap: ${sitemap?.path ?? "missing"}
- Sitemap warnings/errors: ${sitemap?.warnings ?? "n/a"} warnings, ${sitemap?.errors ?? "n/a"} errors
- Sitemap submitted/indexed: ${sitemap?.contents?.[0]?.submitted ?? "n/a"} submitted, ${sitemap?.contents?.[0]?.indexed ?? "n/a"} indexed

## Cloudflare Daily Totals

${table(
  ["Date", "Uniques", "Page Views", "Requests", "Bytes", "Cached"],
  daily.map((row) => [
    row.dimensions.date,
    fmtNumber(row.uniq.uniques),
    fmtNumber(row.sum.pageViews),
    fmtNumber(row.sum.requests),
    bytesMb(row.sum.bytes),
    bytesMb(row.sum.cachedBytes)
  ])
)}

## Today's Top Paths

${table(
  ["Path", "Visits", "Requests"],
  paths.map((row) => [
    row.dimensions.clientRequestPath,
    fmtNumber(row.sum.visits),
    fmtNumber(row.count)
  ])
)}

## Today's Top Countries

${table(
  ["Country", "Visits", "Requests"],
  countries.map((row) => [
    row.dimensions.clientCountryName,
    fmtNumber(row.sum.visits),
    fmtNumber(row.count)
  ])
)}

## Today's User-Agent / Bot Signals

${table(
  ["Browser", "OS", "Verified Bot Category", "Visits", "Requests"],
  agents.map((row) => [
    row.dimensions.userAgentBrowser || "Unknown",
    row.dimensions.userAgentOS || "Unknown",
    row.dimensions.verifiedBotCategory || "Human/Unverified",
    fmtNumber(row.sum.visits),
    fmtNumber(row.count)
  ])
)}

## Search Console Queries

${table(
  ["Query", "Page", "Clicks", "Impressions", "CTR", "Position"],
  (queries.rows ?? []).map((row) => [
    row.keys?.[0] ?? "",
    pageName(row.keys?.[1] ?? ""),
    fmtNumber(row.clicks),
    fmtNumber(row.impressions),
    `${((row.ctr ?? 0) * 100).toFixed(1)}%`,
    Number(row.position ?? 0).toFixed(1)
  ])
)}

## URL Inspection Baseline

${table(
  ["URL", "Coverage", "Indexing", "Robots", "Fetch", "Last Crawl"],
  inspections.map((row) => [
    pageName(row.url),
    row.coverage,
    row.indexing,
    row.robots,
    row.fetch,
    row.lastCrawl || "-"
  ])
)}

## Indexing Summary

${summarizeIndex(inspections).map(([coverage, count]) => `- ${coverage}: ${count}`).join("\n")}

## Recommendations

${recommendationText({ daily, paths, agents, inspections, queries })}
`;

  await mkdir(new URL("reports/", root), { recursive: true });
  const outputUrl = new URL(`reports/block-odds-growth-${reportDate}.md`, root);
  await writeFile(outputUrl, report);
  console.log(report);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
