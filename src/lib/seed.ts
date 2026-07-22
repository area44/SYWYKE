import { readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "./db";
import { initDatabase } from "./schema";

interface RawSite {
  id: string;
  title: string;
  url: string;
  description: string;
  tags?: string[];
}

async function runSeed() {
  console.log("Initializing database and tables...");
  await initDatabase();

  console.log("Reading existing sites from seed-data.json...");
  const jsonPath = join(process.cwd(), "src/lib/seed-data.json");
  const rawData = readFileSync(jsonPath, "utf-8");
  const sites: RawSite[] = JSON.parse(rawData);

  console.log(`Found ${sites.length} sites. Preparing seeding transactions...`);

  // Define predefined collections
  const collections = [
    { id: "all", name: "All Sites", icon: "bookmark", color: "neutral" },
    { id: "design", name: "Design", icon: "palette", color: "neutral" },
    { id: "dev", name: "Development", icon: "code", color: "neutral" },
  ];

  // Define predefined/unique tags
  const validTags = [
    "ai",
    "design",
    "develop",
    "download",
    "explore",
    "language",
    "learn",
    "opensource",
    "photo",
    "share",
    "tool",
    "ui",
    "video",
  ];

  const batchQueries: { sql: string; args: unknown[] }[] = [];

  // Clear existing records to ensure clean state
  batchQueries.push({ sql: "DELETE FROM bookmark_tags", args: [] });
  batchQueries.push({ sql: "DELETE FROM tags", args: [] });
  batchQueries.push({ sql: "DELETE FROM bookmarks", args: [] });
  batchQueries.push({ sql: "DELETE FROM collections", args: [] });

  // Insert collections
  for (const col of collections) {
    batchQueries.push({
      sql: "INSERT INTO collections (id, name, icon, color) VALUES (?, ?, ?, ?)",
      args: [col.id, col.name, col.icon, col.color],
    });
  }

  // Insert all valid tags
  for (const t of validTags) {
    batchQueries.push({
      sql: "INSERT INTO tags (id, name, color) VALUES (?, ?, ?)",
      args: [t, t, "bg-muted text-muted-foreground"],
    });
  }

  // Insert bookmarks and map bookmark_tags relations
  for (const site of sites) {
    // Determine primary collection based on tags (same logic as before)
    let collectionId = "all";
    if (site.tags?.includes("design")) {
      collectionId = "design";
    } else if (site.tags?.includes("develop")) {
      collectionId = "dev";
    }

    const favicon = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`;

    batchQueries.push({
      sql: `INSERT INTO bookmarks (id, title, url, description, favicon, collection_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
      args: [
        site.id,
        site.title,
        site.url,
        site.description,
        favicon,
        collectionId,
      ],
    });

    if (site.tags) {
      for (const tag of site.tags) {
        if (validTags.includes(tag)) {
          batchQueries.push({
            sql: "INSERT INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)",
            args: [site.id, tag],
          });
        }
      }
    }
  }

  console.log(
    `Executing ${batchQueries.length} transactional insert queries...`
  );
  await db.batch(batchQueries, "write");

  console.log("Database seeded successfully!");
}

runSeed().catch((err) => {
  console.error("Failed to seed database:", err);
  process.exit(1);
});
