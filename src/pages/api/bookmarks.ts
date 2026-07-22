import { writeFileSync } from "node:fs";
import { join } from "node:path";
import type { APIRoute } from "astro";
import { db } from "@/lib/db";

interface BookmarkRow {
  id: string;
  title: string;
  url: string;
  description: string;
}

// Syncs SQLite state back to seed-data.json backup (ordered alphabetically by id)
async function syncDatabaseToSeedJson() {
  const bookmarksResult = await db.execute(
    "SELECT * FROM bookmarks ORDER BY id ASC"
  );
  const dbBookmarks = bookmarksResult.rows as unknown as BookmarkRow[];

  const tagsResult = await db.execute(
    "SELECT bookmark_id, tag_id FROM bookmark_tags"
  );
  const relations = tagsResult.rows;

  const tagsMap = new Map<string, string[]>();
  for (const rel of relations) {
    const bId = String(rel.bookmark_id);
    if (!tagsMap.has(bId)) {
      tagsMap.set(bId, []);
    }
    tagsMap.get(bId)?.push(String(rel.tag_id));
  }

  const payload = dbBookmarks.map((b) => ({
    id: b.id,
    title: b.title,
    url: b.url,
    description: b.description,
    tags: tagsMap.get(b.id) || [],
  }));

  const jsonPath = join(process.cwd(), "src/lib/seed-data.json");
  writeFileSync(jsonPath, JSON.stringify(payload, null, 2), "utf-8");
}

export const POST: APIRoute = async ({ request }) => {
  try {
    const { id, title, url, description, tags } = await request.json();

    if (!id || !title || !url || !description) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    // Determine collection id based on tags
    let collectionId = "all";
    if (tags?.includes("design")) {
      collectionId = "design";
    } else if (tags?.includes("develop")) {
      collectionId = "dev";
    }

    const favicon = `https://www.google.com/s2/favicons?domain=${new URL(url).hostname}&sz=64`;

    // Perform database insertions in a batch transaction
    const queries = [
      {
        sql: `INSERT INTO bookmarks (id, title, url, description, favicon, collection_id, created_at)
              VALUES (?, ?, ?, ?, ?, ?, datetime('now'))`,
        args: [id, title, url, description, favicon, collectionId],
      },
    ];

    if (tags && Array.isArray(tags)) {
      for (const tag of tags) {
        queries.push({
          sql: "INSERT OR IGNORE INTO bookmark_tags (bookmark_id, tag_id) VALUES (?, ?)",
          args: [id, tag],
        });
      }
    }

    await db.batch(queries, "write");
    await syncDatabaseToSeedJson();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to add bookmark";
    console.error("API error adding bookmark:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};

export const DELETE: APIRoute = async ({ request }) => {
  try {
    const url = new URL(request.url);
    const id = url.searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "Missing site ID" }), {
        status: 400,
        headers: { "Content-Type": "application/json" },
      });
    }

    const queries = [
      { sql: "DELETE FROM bookmark_tags WHERE bookmark_id = ?", args: [id] },
      { sql: "DELETE FROM bookmarks WHERE id = ?", args: [id] },
    ];

    await db.batch(queries, "write");
    await syncDatabaseToSeedJson();

    return new Response(JSON.stringify({ success: true }), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });
  } catch (err) {
    const errorMsg =
      err instanceof Error ? err.message : "Failed to delete bookmark";
    console.error("API error deleting bookmark:", err);
    return new Response(JSON.stringify({ error: errorMsg }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
};
