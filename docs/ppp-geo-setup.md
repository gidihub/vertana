# Regional (PPP) pricing — geo detection setup

Prices are resolved **server-side** from the visitor's country. The country →
tier map lives in `lib/pricing/geo.ts`; the amounts live in
`lib/pricing/config.ts`. This document only covers **how the country reaches the
app** on each hosting setup.

Nothing here depends on a specific host. The app reads whichever header its
edge sets, verifies it, and forwards it internally as `x-vertana-geo-country`.

## The rule that matters

**Every failure resolves to anchor (t1, full price), never the cheapest tier.**
A missing header, an unmapped country, a failed lookup, or a rejected secret all
produce full-price output. Discounts are only ever granted from a trusted source.

## Setup by platform

### DigitalOcean behind Cloudflare (recommended)

Cloudflare sets `cf-ipcountry` on every proxied request.

1. In Cloudflare: **Network → IP Geolocation → On**. Without this, `cf-ipcountry`
   is never added and everyone sees anchor pricing.
2. Make sure the DNS record for your domain is **proxied** (orange cloud), not
   DNS-only.
3. Set `GEO_PROVIDER=cloudflare`.
4. **Do not** enable a Cache Rule with "Cache Everything" on `/` or `/pricing`.
   Cloudflare ignores `Vary` on HTML, so one cached copy would serve a single
   country's prices worldwide. The app already sends `Cache-Control: private,
   no-store` on those two routes; a "Cache Everything" rule would override it.
5. Close the direct-to-origin hole — see [Anti-spoofing](#anti-spoofing) below.

### DigitalOcean without a CDN

DigitalOcean does not add a geo header on App Platform or Droplets, so there is
nothing to read. Two options:

- **Terminate at nginx with the GeoIP module** and set your own header, then
  configure `GEO_PROVIDER=custom` and `GEO_COUNTRY_HEADERS=x-geo-country`.
- **Use the IP lookup fallback**: set `GEO_IP_LOOKUP_URL`. It runs only on `/`
  and `/pricing`, is cached in-process for 12 hours per IP, times out at 700ms,
  and falls back to anchor pricing on any error.

```bash
GEO_IP_LOOKUP_URL=https://ipapi.co/{ip}/country/
# If the endpoint returns JSON instead of a bare code:
# GEO_IP_LOOKUP_JSON_FIELD=country_code
```

The lookup needs a real client IP. On App Platform, `x-forwarded-for` is set for
you; behind your own nginx, make sure you forward it.

### Vercel

Set `GEO_PROVIDER=vercel` (or leave it on `auto`). `x-vercel-ip-country` is
added automatically on all deployments. No other configuration is required.

### Local development

No edge sets a geo header locally, so pricing shows anchor amounts. To preview a
region:

```bash
GEO_DEFAULT_COUNTRY=ZA   # South Africa → tier t3
```

## Anti-spoofing

The same headers that pick the displayed price also pick the **Stripe price at
checkout**, so a forged header is a real discount exploit.

The risk is direct-to-origin traffic. On DigitalOcean the app usually also
answers on `*.ondigitalocean.app` or the Droplet IP, bypassing Cloudflare
entirely — at which point anyone can send `cf-ipcountry: RW` and pay floor-tier
prices. Two defences, best used together:

**1. Shared secret (works everywhere)**

```bash
GEO_PROXY_SECRET=<long-random-string>
```

Then in Cloudflare: **Rules → Transform Rules → Modify Request Header → Set
static**, header `x-geo-proxy-secret`, value the same string. Once a secret is
set, any request that doesn't present a matching one is treated as untrusted: it
gets no geo from **either** the edge header or the IP-lookup fallback, so a
bypass attempt lands on anchor (full) price.

> **Caveat:** enabling the IP-lookup fallback (`GEO_IP_LOOKUP_URL`) *without* a
> secret re-opens this hole on a directly-reachable origin, because the client IP
> comes from `x-forwarded-for` / `cf-connecting-ip`, which the client controls.
> If you use the IP fallback, pair it with `GEO_PROXY_SECRET` or lock the origin
> to the edge (below).

**2. Lock the origin to the edge**

Restrict inbound traffic to [Cloudflare's IP ranges](https://www.cloudflare.com/ips/)
using a DigitalOcean Cloud Firewall (Droplets) or trusted sources (App
Platform). With the origin unreachable directly, the header alone is trustworthy.

## How it flows through the app

1. `middleware.ts` runs on the request, resolves the country via
   `lib/pricing/geo-source.ts`, and forwards it as `x-vertana-geo-country`. Any
   inbound copy of that header is deleted first, so a browser cannot set it.
2. Server Components and route handlers call `detectCountryFromHeaders`, which
   reads the internal header first and falls back to the raw edge header.
3. `pppTierForCountry` maps the country to a tier; `lib/pricing/config.ts`
   supplies the amounts.

Because step 1 is what strips the spoofable header, **any route that resolves a
price must stay in the middleware `matcher`** in `middleware.ts`. Today that is
`/`, `/pricing`, and the billing API routes.

## Verifying it works

```bash
# Should print the region's prices, not the anchor $19 / $39
curl -s -H 'cf-ipcountry: ZA' https://your-domain/pricing | grep -o 'South Africa pricing applied'
```

Expected South African (t3) monthly prices: Starter **$9**, Growth **$19**.
Anchor prices are Starter $19, Growth $39 — if you see those for a ZA request,
geo is not reaching the app.

Caching gotcha: if the first request from any country gets cached and replayed,
everyone sees that country's prices. Confirm with:

```bash
curl -sI https://your-domain/pricing | grep -i -E 'cache-control|cf-cache-status'
```

`cf-cache-status` should be `DYNAMIC` or `BYPASS`, never `HIT`.
