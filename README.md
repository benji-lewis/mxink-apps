# MX Ink compatible apps

Source for <https://mxink.benjilewis.dev> – a list of Meta Quest apps that work with the Logitech MX Ink stylus, with links to each app's Meta Horizon Store page and website.

## Update the list

1. Edit `data/apps.json`. Each app needs `name`, `developer`, `description`, `category`, `platform`, `confidence` (`official` | `confirmed` | `reported`) and at least one of `storeUrl` / `websiteUrl` / `steamUrl`. Add `mxInkEvidence` (a link that proves MX Ink support).
2. Set `generatedAt` to today's date.
3. Run `node build.mjs` and open `dist/index.html` to check.
4. Push to `main`. Cloudflare Pages builds and deploys it (`node build.mjs`, output `dist`).

No dependencies. Node 18+.
