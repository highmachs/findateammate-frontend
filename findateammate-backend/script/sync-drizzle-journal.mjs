import fs from "node:fs";
import path from "node:path";

const migrationsDir = path.join(process.cwd(), "migrations");
const metaDir = path.join(migrationsDir, "meta");
const journalPath = path.join(metaDir, "_journal.json");

function getSqlTags() {
  const files = fs.readdirSync(migrationsDir, { withFileTypes: true });
  return files
    .filter((f) => f.isFile() && f.name.endsWith(".sql"))
    .map((f) => f.name.replace(/\.sql$/, ""))
    .sort((a, b) => a.localeCompare(b));
}

function main() {
  const journalRaw = fs.readFileSync(journalPath, "utf8");
  const journal = JSON.parse(journalRaw);

  const tagsInJournal = new Set((journal.entries || []).map((e) => e.tag));
  const sqlTags = getSqlTags();
  const missingTags = sqlTags.filter((tag) => !tagsInJournal.has(tag));

  if (missingTags.length === 0) {
    console.log("[journal-sync] Journal is up to date");
    return;
  }

  let lastIdx = journal.entries.length > 0 ? Number(journal.entries[journal.entries.length - 1].idx) : -1;
  let nextWhen = Date.now();

  for (const tag of missingTags) {
    lastIdx += 1;
    nextWhen += 1;
    journal.entries.push({
      idx: lastIdx,
      version: String(journal.version || "7"),
      when: nextWhen,
      tag,
      breakpoints: true,
    });
    console.log(`[journal-sync] Added missing entry for ${tag}`);
  }

  fs.writeFileSync(journalPath, `${JSON.stringify(journal, null, 2)}\n`, "utf8");
  console.log(`[journal-sync] Added ${missingTags.length} missing entries`);
}

try {
  main();
} catch (error) {
  console.error("[journal-sync] Failed:", error);
  process.exit(1);
}
