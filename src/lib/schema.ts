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

export async function initDatabase() {
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
}

export async function getDbBookmarks() {
  await initDatabase();

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
  await initDatabase();

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
  await initDatabase();

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
