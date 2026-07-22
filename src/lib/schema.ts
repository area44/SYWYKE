import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";
import { db } from "./db";

export interface DbBookmark {
  id: string;
  title: string;
  url: string;
  description: string;
  favicon: string;
  collection_id: string;
  is_favorite: number;
  has_dark_icon: number;
  created_at: string;
}

export interface DbCollection {
  id: string;
  name: string;
  icon: string;
  color: string;
}

export interface DbTag {
  id: string;
  name: string;
  color: string;
}

let isDatabaseInitialized = false;

export async function initDatabase() {
  if (isDatabaseInitialized) return;

  await db.executeMultiple(`
    CREATE TABLE IF NOT EXISTS collections (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL,
      icon TEXT NOT NULL,
      color TEXT NOT NULL DEFAULT 'neutral'
    );

    CREATE TABLE IF NOT EXISTS bookmarks (
      id TEXT PRIMARY KEY,
      title TEXT NOT NULL,
      url TEXT NOT NULL UNIQUE,
      description TEXT NOT NULL,
      favicon TEXT NOT NULL,
      collection_id TEXT NOT NULL DEFAULT 'all',
      is_favorite INTEGER NOT NULL DEFAULT 0,
      has_dark_icon INTEGER NOT NULL DEFAULT 0,
      created_at TEXT NOT NULL DEFAULT (datetime('now'))
    );

    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY,
      name TEXT NOT NULL UNIQUE,
      color TEXT NOT NULL DEFAULT 'bg-muted text-muted-foreground'
    );

    CREATE TABLE IF NOT EXISTS bookmark_tags (
      bookmark_id TEXT NOT NULL,
      tag_id TEXT NOT NULL,
      PRIMARY KEY (bookmark_id, tag_id),
      FOREIGN KEY (bookmark_id) REFERENCES bookmarks(id) ON DELETE CASCADE,
      FOREIGN KEY (tag_id) REFERENCES tags(id) ON DELETE CASCADE
    );
  `);

  isDatabaseInitialized = true;
}

export async function autoSeedIfEmpty() {
  await initDatabase();

  try {
    const countResult = await db.execute(
      "SELECT COUNT(*) as count FROM bookmarks"
    );
    const count = Number(countResult.rows[0]?.count || 0);

    if (count > 0) return;
  } catch (err) {
    // If table doesn't exist, initDatabase already handled it, but let's be safe
    console.warn("Table count check failed, proceeding to seed anyway:", err);
  }

  console.log("Database is empty. Auto-seeding from seed-data.json...");

  const jsonPath = join(process.cwd(), "src/lib/seed-data.json");
  if (!existsSync(jsonPath)) {
    console.error("Seed data file not found at:", jsonPath);
    return;
  }

  try {
    const rawData = readFileSync(jsonPath, "utf-8");
    const sites = JSON.parse(rawData);

    const collections = [
      { id: "all", name: "All Sites", icon: "bookmark", color: "neutral" },
      { id: "design", name: "Design", icon: "palette", color: "neutral" },
      { id: "dev", name: "Development", icon: "code", color: "neutral" },
    ];

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

    // Insert collections
    for (const col of collections) {
      batchQueries.push({
        sql: "INSERT OR IGNORE INTO collections (id, name, icon, color) VALUES (?, ?, ?, ?)",
        args: [col.id, col.name, col.icon, col.color],
      });
    }

    // Insert all valid tags
    for (const t of validTags) {
      batchQueries.push({
        sql: "INSERT OR IGNORE INTO tags (id, name, color) VALUES (?, ?, ?)",
        args: [t, t, "bg-muted text-muted-foreground"],
      });
    }

    // Insert bookmarks and relations
    for (const site of sites) {
      let collectionId = "all";
      if (site.tags?.includes("design")) {
        collectionId = "design";
      } else if (site.tags?.includes("develop")) {
        collectionId = "dev";
      }

      const favicon = `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`;

      batchQueries.push({
        sql: `INSERT OR IGNORE INTO bookmarks (id, title, url, description, favicon, collection_id, is_favorite, has_dark_icon, created_at)
              VALUES (?, ?, ?, ?, ?, ?, 0, 0, datetime('now'))`,
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
              sql: "INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)",
              args: [site.id, tag],
            });
          }
        }
      }
    }

    await db.batch(batchQueries, "write");
    console.log("Database auto-seeded successfully with 120 items!");
  } catch (err) {
    console.error("Failed to auto-seed database:", err);
  }
}

export async function getDbBookmarks() {
  await autoSeedIfEmpty();

  // Fetch bookmarks
  const bookmarksResult = await db.execute(
    "SELECT * FROM bookmarks ORDER BY title ASC"
  );
  const dbBookmarks = bookmarksResult.rows as unknown as DbBookmark[];

  // Fetch tag relations
  const tagsResult = await db.execute(
    "SELECT bookmark_id, tag_id FROM bookmark_tags"
  );
  const relations = tagsResult.rows as unknown as {
    bookmark_id: string;
    tag_id: string;
  }[];

  // Map tags to bookmark ID
  const tagsMap = new Map<string, string[]>();
  for (const rel of relations) {
    if (!tagsMap.has(rel.bookmark_id)) {
      tagsMap.set(rel.bookmark_id, []);
    }
    tagsMap.get(rel.bookmark_id)?.push(rel.tag_id);
  }

  return dbBookmarks.map((b) => ({
    id: b.id,
    title: b.title,
    url: b.url,
    description: b.description,
    favicon: b.favicon,
    collectionId: b.collection_id,
    tags: tagsMap.get(b.id) || [],
    createdAt: b.created_at,
    isFavorite: Boolean(b.is_favorite),
    hasDarkIcon: Boolean(b.has_dark_icon),
  }));
}

export async function getDbCollections() {
  await autoSeedIfEmpty();

  const collectionsResult = await db.execute("SELECT * FROM collections");
  const dbCollections = collectionsResult.rows as unknown as DbCollection[];

  // Get count per collection
  const countsResult = await db.execute(
    "SELECT collection_id, COUNT(*) as count FROM bookmarks GROUP BY collection_id"
  );
  const countsMap = new Map<string, number>();
  for (const row of countsResult.rows) {
    countsMap.set(String(row.collection_id), Number(row.count));
  }

  // Also calculate total bookmark count
  const totalResult = await db.execute(
    "SELECT COUNT(*) as count FROM bookmarks"
  );
  const totalCount = Number(totalResult.rows[0]?.count || 0);

  return dbCollections.map((c) => ({
    id: c.id,
    name: c.name,
    icon: c.icon,
    color: c.color,
    count: c.id === "all" ? totalCount : countsMap.get(c.id) || 0,
  }));
}

export async function getDbTags() {
  await autoSeedIfEmpty();

  const tagsResult = await db.execute("SELECT * FROM tags ORDER BY id ASC");
  const dbTags = tagsResult.rows as unknown as DbTag[];

  const countsResult = await db.execute(
    "SELECT tag_id, COUNT(*) as count FROM bookmark_tags GROUP BY tag_id"
  );
  const countsMap = new Map<string, number>();
  for (const row of countsResult.rows) {
    countsMap.set(String(row.tag_id), Number(row.count));
  }

  return dbTags.map((t) => ({
    id: t.id,
    name: t.name,
    color: t.color,
    count: countsMap.get(t.id) || 0,
  }));
}
