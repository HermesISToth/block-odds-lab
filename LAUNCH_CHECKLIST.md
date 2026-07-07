# Block Odds Labs Launch Checklist

## Live Site

- Canonical domain: `https://blockoddslabs.com/`
- Hosting: GitHub Pages on `gh-pages`
- DNS/CDN: Cloudflare
- `www.blockoddslabs.com` redirects to apex

## Next Free Setup

- Retry GitHub Pages HTTPS enforcement after GitHub certificate issuance completes.
- Cloudflare Email Routing for `hello@blockoddslabs.com` is live and verified.
- Public contact email is published on the homepage, disclosure page, and white paper.
- Connect Cloudflare access for analytics reporting, or create a limited read-only API token for traffic analytics.
- Submit `https://blockoddslabs.com/sitemap.xml` in Google Search Console.
- Create a free newsletter/list account only after the contact email works.
- Keep `site/CNAME` tracked so full-site deploys preserve the custom domain.

## Cloudflare Email Routing Setup

Preferred address: `hello@blockoddslabs.com`.

1. Cloudflare dashboard -> `blockoddslabs.com` -> Email -> Email Routing.
2. Enable Email Routing if prompted.
3. Add destination address: Logan's preferred receiving inbox.
4. Confirm the verification email in that receiving inbox.
5. Add custom address:
   - Custom address: `hello`
   - Action: Send to the verified destination inbox.
6. Let Cloudflare add the required MX/TXT records automatically if prompted.
7. Send a test email to `hello@blockoddslabs.com`.
8. After the test arrives, update the public site with the contact address.

Status: complete. Test mail to `hello@blockoddslabs.com` reached the Proton destination, and the public site now links the address.

## Cloudflare Analytics Access

Goal: let OC read traffic without needing a dashboard security challenge.

Options:

1. Add Cloudflare Web Analytics and share the beacon token for the site.
2. Create a limited Cloudflare API token with read-only analytics access for `blockoddslabs.com`.
3. Send screenshots from Cloudflare Analytics until direct access is available.

Useful first metrics:

- Unique visitors
- Total requests versus page views
- Top paths
- Referrers
- Countries
- Bot versus human-looking traffic
- Cache hit ratio

## Google Search Console Setup

1. Open Google Search Console.
2. Add a Domain property for `blockoddslabs.com`.
3. Use DNS verification.
4. Add the TXT verification record in Cloudflare DNS.
5. After verification, submit `https://blockoddslabs.com/sitemap.xml`.
6. Check Indexing -> Pages after Google processes the sitemap.

## Hold Spending

- Do not buy ads yet.
- Do not buy Apple Developer Program yet.
- Do not buy a paid newsletter platform yet.
- Consider Google Play Console only after the PWA and domain are stable.
