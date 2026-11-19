// Builds dist/ from data/apps.json. No dependencies: `node build.mjs`.
import { readFileSync, writeFileSync, mkdirSync, cpSync, rmSync, existsSync } from "node:fs";

const SITE_URL = "https://mxink.benjilewis.dev";
const data = JSON.parse(readFileSync("data/apps.json", "utf8"));
const template = readFileSync("src/index.html", "utf8");

const CATEGORY_ORDER = [
  "Art & Design",
  "3D Modelling & CAD",
  "Collaboration & Productivity",
  "Education & Training",
  "Medical",
  "Games & Fun",
];

const esc = (s) =>
  String(s ?? "").replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]);

const slug = (s) => s.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");

const apps = [...data.apps].sort((a, b) => a.name.localeCompare(b.name));
const categories = CATEGORY_ORDER.filter((c) => apps.some((a) => a.category === c));
for (const a of apps) if (!categories.includes(a.category)) categories.push(a.category);

const BADGE = {
  official: ["Official", "Listed by Logitech or Meta"],
  confirmed: ["Developer confirmed", "The developer announced MX Ink support"],
  reported: ["Reported", "Reported by press; not on an official list"],
};

function card(a) {
  const links = [];
  if (a.storeUrl) links.push(`<a class="btn btn-primary" href="${esc(a.storeUrl)}" rel="noopener" target="_blank">Meta Store</a>`);
  if (a.steamUrl) links.push(`<a class="btn" href="${esc(a.steamUrl)}" rel="noopener" target="_blank">Steam</a>`);
  if (a.websiteUrl) links.push(`<a class="btn" href="${esc(a.websiteUrl)}" rel="noopener" target="_blank">Website</a>`);
  const [badge, badgeTitle] = BADGE[a.confidence] ?? BADGE.reported;
  const meta = [a.platform, a.price].filter(Boolean).map(esc).join(" · ");
  const search = [a.name, a.developer, a.description, a.category, a.platform].join(" ").toLowerCase();
  return `
      <li class="card" data-category="${esc(slug(a.category))}" data-search="${esc(search)}">
        <div class="card-head">
          <h3>${esc(a.name)}</h3>
          <span class="badge badge-${esc(a.confidence)}" title="${esc(badgeTitle)}">${esc(badge)}</span>
        </div>
        <p class="dev">${esc(a.developer)}</p>
        <p class="desc">${esc(a.description)}</p>
        <p class="meta">${meta}</p>${a.note ? `\n        <p class="note">${esc(a.note)}</p>` : ""}
        <div class="links">${links.join("")}${
          a.mxInkEvidence ? `<a class="src" href="${esc(a.mxInkEvidence)}" rel="noopener" target="_blank" title="Source for MX Ink support">source</a>` : ""
        }</div>
      </li>`;
}

const sections = categories
  .map((c) => {
    const list = apps.filter((a) => a.category === c);
    return `
    <section class="cat" id="${slug(c)}" data-category="${slug(c)}">
      <h2>${esc(c)} <span class="count">${list.length}</span></h2>
      <ul class="grid">${list.map(card).join("")}
      </ul>
    </section>`;
  })
  .join("");

const filters = [`<button class="chip active" data-filter="all" aria-pressed="true">All <span>${apps.length}</span></button>`]
  .concat(
    categories.map(
      (c) =>
        `<button class="chip" data-filter="${slug(c)}" aria-pressed="false">${esc(c)} <span>${apps.filter((a) => a.category === c).length}</span></button>`,
    ),
  )
  .join("");

const devTools = (data.developerTools ?? [])
  .map((t) => `<li><a href="${esc(t.url)}" rel="noopener" target="_blank">${esc(t.name)}</a>${t.note ? ` – ${esc(t.note)}` : ""}</li>`)
  .join("");

const jsonLd = {
  "@context": "https://schema.org",
  "@type": "ItemList",
  name: "Meta Quest apps compatible with Logitech MX Ink",
  numberOfItems: apps.length,
  itemListElement: apps.map((a, i) => ({
    "@type": "ListItem",
    position: i + 1,
    item: {
      "@type": "SoftwareApplication",
      name: a.name,
      author: a.developer,
      applicationCategory: a.category,
      operatingSystem: "Meta Horizon OS",
      url: a.storeUrl || a.websiteUrl || a.steamUrl,
    },
  })),
};

const updated = new Date(data.generatedAt ?? Date.now());
const updatedText = updated.toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" });

const html = template
  .replaceAll("{{SITE_URL}}", SITE_URL)
  .replaceAll("{{COUNT}}", String(apps.length))
  .replaceAll("{{UPDATED}}", esc(updatedText))
  .replaceAll("{{UPDATED_ISO}}", updated.toISOString().slice(0, 10))
  .replace("{{FILTERS}}", filters)
  .replace("{{SECTIONS}}", sections)
  .replace("{{DEV_TOOLS}}", devTools ? `<h2>For developers</h2><ul class="devtools">${devTools}</ul>` : "")
  .replace("{{JSON_LD}}", JSON.stringify(jsonLd).replace(/</g, "\\u003c"));

if (existsSync("dist")) rmSync("dist", { recursive: true });
mkdirSync("dist", { recursive: true });
cpSync("public", "dist", { recursive: true });
writeFileSync("dist/index.html", html);
writeFileSync("dist/apps.json", JSON.stringify({ generatedAt: data.generatedAt, apps }, null, 2));
writeFileSync(
  "dist/sitemap.xml",
  `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"><url><loc>${SITE_URL}/</loc><lastmod>${updated
    .toISOString()
    .slice(0, 10)}</lastmod></url></urlset>\n`,
);
console.log(`Built dist/ with ${apps.length} apps in ${categories.length} categories.`);
