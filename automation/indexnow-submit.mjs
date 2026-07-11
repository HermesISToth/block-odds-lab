const key = "326136afe7f26330c8d025c5d9b71111";
const host = "blockoddslabs.com";
const keyLocation = `https://${host}/${key}.txt`;
const endpoint = "https://api.indexnow.org/indexnow";

const urls = process.argv.slice(2);

if (!urls.length) {
  console.error("Usage: node automation/indexnow-submit.mjs https://blockoddslabs.com/page.html [...]");
  process.exit(1);
}

const body = {
  host,
  key,
  keyLocation,
  urlList: urls
};

const response = await fetch(endpoint, {
  method: "POST",
  headers: {
    "content-type": "application/json; charset=utf-8"
  },
  body: JSON.stringify(body)
});

const text = await response.text();

if (!response.ok && response.status !== 202) {
  throw new Error(`IndexNow returned ${response.status}: ${text}`);
}

console.log(`IndexNow accepted ${urls.length} URL(s) with HTTP ${response.status}.`);
