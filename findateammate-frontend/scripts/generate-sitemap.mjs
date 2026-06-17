import fs from "node:fs";
import path from "node:path";

const siteUrl = "https://findateammate.online";
const now = new Date().toISOString().slice(0, 10);

const routes = [
  { path: "/", changefreq: "daily", priority: "1.0" },
  { path: "/browse", changefreq: "hourly", priority: "0.9" },
  { path: "/events", changefreq: "hourly", priority: "0.9" },
  { path: "/about", changefreq: "monthly", priority: "0.7" },
  { path: "/faq", changefreq: "monthly", priority: "0.6" },
  { path: "/guidelines", changefreq: "monthly", priority: "0.6" },
  { path: "/safety", changefreq: "monthly", priority: "0.6" },
  { path: "/privacy", changefreq: "monthly", priority: "0.5" },
  { path: "/terms", changefreq: "monthly", priority: "0.5" },
  { path: "/contact", changefreq: "monthly", priority: "0.5" },
];

const urls = routes
  .map(({ path: routePath, changefreq, priority }) => {
    return [
      "  <url>",
      `    <loc>${siteUrl}${routePath}</loc>`,
      `    <lastmod>${now}</lastmod>`,
      `    <changefreq>${changefreq}</changefreq>`,
      `    <priority>${priority}</priority>`,
      "  </url>",
    ].join("\n");
  })
  .join("\n");

const xml = [
  '<?xml version="1.0" encoding="UTF-8"?>',
  '<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">',
  urls,
  '</urlset>',
  '',
].join("\n");

const outputPath = path.resolve(process.cwd(), "public", "sitemap.xml");
fs.writeFileSync(outputPath, xml, "utf8");
console.log(`Sitemap generated at ${outputPath}`);
