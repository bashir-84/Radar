# Radar — USDT / Toman

A responsive Persian dashboard for comparing USDT rates across exchanges.

## Website
- GitHub Pages (after deployment is enabled): https://bashir-84.github.io/Radar/
- Existing Cloudflare Worker: https://usdt-price-radar.bashiramri84.workers.dev/
- Live JSON endpoint: https://usdt-price-radar.bashiramri84.workers.dev/api/prices

## Architecture

`index.html` runs directly on GitHub Pages. Clicking **دریافت قیمت‌ها** requests JSON from the existing Cloudflare Worker. Cloudflare obtains price data from its configured exchange APIs. GitHub Pages is static and does not itself fetch exchange APIs server-side.

No API keys or Telegram tokens are stored in GitHub.

## Files
- `index.html`: standalone mobile-friendly Persian frontend; edit for UI/UX changes.
- `.github/workflows/pages.yml`: deploys the static frontend when `main` changes.

## First-time GitHub Pages setup
In the repository: **Settings → Pages → Build and deployment → Source: GitHub Actions**. Once configured, push to `main` or run **Actions → Publish Radar website → Run workflow**. Deployment URL: https://bashir-84.github.io/Radar/

## Notes
- Frontend and Worker are two distinct deployments. Updating the GitHub UI will **not** change the existing Cloudflare website.
- Worker API responds on `/api/prices` and should include `Access-Control-Allow-Origin: *` for requests from GitHub Pages.
- Missing and invalid rates must remain missing, not be replaced with fabricated values.
- External exchange API connectivity and field schemas may vary. Verify quotes before acting on them.
