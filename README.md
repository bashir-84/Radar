# Radar — رادار رمزارز

Web UI: https://bashir-84.github.io/Radar/

Cloudflare price API: https://usdt-price-radar.bashiramri84.workers.dev/

## Supported assets
- USDT — Tether (main quote in toman)
- BTC — Bitcoin
- ETH — Ethereum
- PAXG — PAX Gold
- GRAM — Gram (the new name for Toncoin/TON in supported Iranian markets)
- XAUT — Tether Gold

Exactly six cryptocurrencies are configured: one featured asset and five clickable, horizontally scrollable asset tiles. There is no unused future-asset placeholder.

## How it works
- `index.html`: responsive Persian dashboard, Vazirmatn font, locally hosted brand-accurate SVG coin icons, a 10-second loading bar and auto-refresh.
- `assets/icons/*.svg`: six locally hosted cryptocurrency logos sourced from the Web3 Icons open-source curated brand icon library (https://github.com/0xa3k5/web3icons); official Gram branding matches https://ton.org/media/.
- Click a cryptocurrency tile: it replaces the main/featured asset, and the previously featured asset takes that tile's place.
- The URL uses `#coin/BTC`-style routes for linking to an asset view.
- For USDT, the main figure is a *toman* buy quote.
- For all other assets, the main figure is a *USDT* buy quote and the smaller figure is a *toman* quote.
- For prices sourced from order books, *buy* means the best ask available. Actual transaction costs/fees and order depth are not reflected.
- Derived toman values are explicitly marked as estimates (asset/USDT ask × USDT/toman ask at the **same exchange**), never displayed as executable direct toman prices.
- Missing API data are left blank, rather than invented.

## APIs
- `/api/prices` — existing USDT/toman feed across the previously configured exchanges; still running.
- `/api/markets` — new multi-asset feed aggregating public market data from **Nobitex, Wallex and Bitpin**; returns per-asset, per-exchange USDT and toman quotes if available.
- `api/markets.js` — source logic for the Cloudflare market API. This file has been embedded in the deployed Worker manually.

## Deployments
The static frontend publishes automatically via `.github/workflows/pages.yml` whenever `index.html` changes on `main`.

**Important:** GitHub Pages is the frontend, not the API server. Editing `api/markets.js` in GitHub does **not** automatically publish it to Cloudflare. Cloudflare backend changes must be deployed separately. No DNS configuration is involved.

The website does not store or need exchange login credentials. Public exchange API availability and pairs may vary by time and region. Use price quotes for information, not as guaranteed executable rates.
