# SYWYKE - Database Design for Scaling (1,000+ Sites)

## Introduction

As SYWYKE scales from a few dozen static bookmarks to **1,000+ sites**, maintaining a flat JSON file (`sites.json`) in content collections becomes highly challenging. While Astro handles 1,000 static items during a build perfectly, dynamic collection-based management, interactive user actions (like favorites, sorting, filtering), and high-frequency content additions are much better served by a dedicated database.

This document outlines robust database architectures (SQL vs NoSQL), complete schemas, indexing strategies, seeding/migration procedures, and Astro server-side/client-side integration patterns to support 1,000+ bookmarks with high performance.

---

## 1. Architecture Choices & Recommendations

Depending on the deployment strategy and product requirements, three major options are recommended:

### Option A: SQLite / Turso (Highly Recommended)
* **Why**: Turso is an edge-replicated database based on libsql (SQLite fork). It is extremely cost-effective, has a tiny memory footprint, and fits serverless/Astro environments perfectly via HTTP requests.
* **Pros**: Simple schema, sub-millisecond edge read latency, local development using standard SQLite, easy database branching.
* **Cons**: No native JSON column types (though SQLite provides JSON1 extension).

### Option B: PostgreSQL / Supabase
* **Why**: Supabase provides a hosted Postgres instance with native Row Level Security (RLS), real-time capabilities, and powerful indexing.
* **Pros**: Standard relational database, native arrays/JSONB, built-in Auth, rich ecosystem, and high scalability (easily scaling to 100k+ records).
* **Cons**: Slightly higher cold start latency in serverless environments if using direct TCP poolers instead of HTTP API or Prisma accelerate.

### Option C: MongoDB / Atlas
* **Why**: A document-store fits the polymorphic nature of web bookmarks/sites perfectly.
* **Pros**: Highly flexible schema, native document nesting (e.g. embedding arrays of tags), fast writes.
* **Cons**: Relational queries (like joins between collections and bookmarks) can be less performant without proper indexing or lookup pipeline optimization.

---

## 2. SQL Schema Design (SQLite/PostgreSQL)

Below is the complete relational schema optimized for relational database engines.

### Entity Relationship Diagram (ERD) Overview

```
 [Collections] (1) <---------- (0..N) [Bookmarks]
                                           | (1)
                                           |
                                           | (0..N)
                                    [BookmarkTags]
                                           | (0..N)
                                           |
                                           | (1)
                                        [Tags]
```

### SQL DDL (PostgreSQL & SQLite Compatible)

```sql
-- 1. Collections Table
-- Groups bookmarks into logical categories (e.g. Design, Develop)
CREATE TABLE collections (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(100) NOT NULL,
    icon VARCHAR(50) NOT NULL,
    color VARCHAR(30) DEFAULT 'neutral',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 2. Bookmarks Table
-- Stores details about each bookmarked site
CREATE TABLE bookmarks (
    id VARCHAR(100) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    url TEXT NOT NULL UNIQUE,
    description TEXT,
    favicon TEXT,
    collection_id VARCHAR(50) NOT NULL DEFAULT 'all',
    is_favorite BOOLEAN DEFAULT FALSE,
    has_dark_icon BOOLEAN DEFAULT FALSE,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT fk_collection FOREIGN KEY (collection_id)
        REFERENCES collections(id) ON DELETE SET DEFAULT
);

-- 3. Tags Table
-- Holds the strictly validated tag list
CREATE TABLE tags (
    id VARCHAR(50) PRIMARY KEY,
    name VARCHAR(50) NOT NULL UNIQUE,
    color VARCHAR(100) DEFAULT 'bg-muted text-muted-foreground',
    created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
);

-- 4. BookmarkTags Junction Table (Many-to-Many Relationship)
-- Links Bookmarks and Tags efficiently
CREATE TABLE bookmark_tags (
    bookmark_id VARCHAR(100) NOT NULL,
    tag_id VARCHAR(50) NOT NULL,
    PRIMARY KEY (bookmark_id, tag_id),
    CONSTRAINT fk_bookmark FOREIGN KEY (bookmark_id)
        REFERENCES bookmarks(id) ON DELETE CASCADE,
    CONSTRAINT fk_tag FOREIGN KEY (tag_id)
        REFERENCES tags(id) ON DELETE CASCADE
);
```

### Essential Indexes for Query Performance (1,000+ Items)

To ensure sub-millisecond retrieval speeds, sorting, and filtering:

```sql
-- Index for quick favorites filtering & collection-based views
CREATE INDEX idx_bookmarks_is_favorite ON bookmarks(is_favorite);
CREATE INDEX idx_bookmarks_collection_id ON bookmarks(collection_id);

-- Case-insensitive search optimization on Title & Description
CREATE INDEX idx_bookmarks_title_lower ON bookmarks(LOWER(title));
CREATE INDEX idx_bookmarks_url ON bookmarks(url);

-- Junction table indexes to optimize many-to-many lookup joins
CREATE INDEX idx_bookmark_tags_tag_id ON bookmark_tags(tag_id);
```

---

## 3. NoSQL Schema Design (MongoDB)

For MongoDB, we leverage dynamic nested arrays to represent the many-to-many relationship without expensive joint lookups, ensuring high retrieval performance.

### Bookmarks Collection Schema
```json
{
  "_id": { "$oid": "603fcd393849c256a4cf8e30" },
  "id": "animated-backgrounds",
  "title": "Animated Backgrounds",
  "url": "https://animatedbackgrounds.me",
  "description": "A Collection of 30+ animated backgrounds for websites and blogs.",
  "favicon": "https://www.google.com/s2/favicons?domain=animatedbackgrounds.me&sz=64",
  "collectionId": "develop",
  "tags": ["design", "develop", "ui"],
  "isFavorite": false,
  "hasDarkIcon": false,
  "createdAt": { "$date": "2025-02-14T00:00:00.000Z" }
}
```

### Tags Collection Schema
```json
{
  "_id": "design",
  "name": "design",
  "color": "bg-muted text-muted-foreground",
  "count": 42
}
```

### Indexes (MongoDB)
```javascript
db.bookmarks.createIndex({ id: 1 }, { unique: true });
db.bookmarks.createIndex({ tags: 1 }); // Multikey index for fast filtering by tag
db.bookmarks.createIndex({ collectionId: 1 });
db.bookmarks.createIndex({ isFavorite: 1 });
db.bookmarks.createIndex({ title: "text", description: "text" }); // Text index for search
```

---

## 4. Bulk Loading & Seeding (1,000+ Sites)

When seeding 1,000 sites, a naive row-by-row insert will incur high overhead and network roundtrips. The following migration script demonstrates how to bulk-load sites efficiently using PostgreSQL or SQLite with transaction batching.

### Seeding Script (TypeScript + Drizzle ORM example)

```typescript
import { db } from "./db"; // Your drizzle/db client
import { bookmarks, tags, bookmark_tags } from "./schema";
import rawSites from "../content/sites.json"; // 1000+ sites array

async function seedDatabase() {
  console.log("Seeding started...");

  // 1. Prepare unique tags mapping
  const uniqueTags = Array.from(
    new Set(rawSites.flatMap((site) => site.tags || []))
  );

  // 2. Bulk Insert Tags
  const tagsPayload = uniqueTags.map((tag) => ({
    id: tag,
    name: tag,
    color: "bg-muted text-muted-foreground",
  }));

  await db.insert(tags).values(tagsPayload).onConflictDoNothing();
  console.log(`Inserted ${uniqueTags.length} tags.`);

  // 3. Batch insert bookmarks to prevent memory/payload limit issues (Chunks of 200)
  const chunkSize = 200;
  const bookmarkTagsPayload: { bookmarkId: string; tagId: string }[] = [];

  for (let i = 0; i < rawSites.length; i += chunkSize) {
    const chunk = rawSites.slice(i, i + chunkSize);

    const bookmarksPayload = chunk.map((site) => {
      // Map tags into junction payloads
      if (site.tags) {
        for (const tag of site.tags) {
          bookmarkTagsPayload.push({
            bookmarkId: site.id,
            tagId: tag,
          });
        }
      }

      return {
        id: site.id,
        title: site.title,
        url: site.url,
        description: site.description,
        favicon: `https://www.google.com/s2/favicons?domain=${new URL(site.url).hostname}&sz=64`,
        collectionId: "all",
        isFavorite: false,
        createdAt: new Date(),
      };
    });

    // Run within a transaction for speed and safety
    await db.transaction(async (tx) => {
      await tx.insert(bookmarks).values(bookmarksPayload).onConflictDoNothing();
    });
  }
  console.log(`Successfully inserted ${rawSites.length} bookmarks.`);

  // 4. Populate Junction Table in Batches
  for (let i = 0; i < bookmarkTagsPayload.length; i += chunkSize) {
    const chunk = bookmarkTagsPayload.slice(i, i + chunkSize);
    await db.insert(bookmark_tags).values(chunk).onConflictDoNothing();
  }
  console.log("Junction table populated.");
}

seedDatabase().catch(console.error);
```

---

## 5. Integrating with Astro 7 & Zustand 5

With 1,000+ sites, fetching all data at runtime and sending it directly to a client component can lead to high hydration times and page bloat. Below is the optimized server-to-client fetching pattern.

### Optimized Server-Side Fetching (`src/pages/index.astro`)

Utilize SSR (Server-Side Rendering) or static/hybrid generation to query only metadata, while offloading search query processing, pagination, and heavy operations.

```astro
---
import { DashboardMain } from "@/components/dashboard/main";
import Layout from "@/layouts/DashboardLayout.astro";
import { getDbBookmarks, getDbCollections, getDbTags } from "@/lib/dbQueries";

// Fetch initial metadata and bookmarks on the server
// Can be statically generated (SSG) or Server-Side Rendered (SSR)
const [bookmarks, collections, tags] = await Promise.all([
  getDbBookmarks({ limit: 50, offset: 0 }), // Limit initial payload size
  getDbCollections(),
  getDbTags(),
]);

const initialData = {
  bookmarks,
  collections,
  tags,
};
---

<Layout title="SYWYKE" description="Sites You Wish You Knew Earlier!">
  <DashboardMain initialData={initialData} client:load />
</Layout>
```

### Pagination and Lazy Loading in Bookmarks Content
To prevent rendering 1,000 DOM nodes at once, implement virtual list rendering or infinite scrolling.

```typescript
// src/components/dashboard/content.tsx (Example addition)
import { useInView } from "react-intersection-observer";

export function BookmarksContent() {
  const { filteredBookmarks } = useFilteredAndSortedBookmarks();
  const [visibleCount, setVisibleCount] = React.useState(30);
  const { ref, inView } = useInView();

  React.useEffect(() => {
    if (inView && visibleCount < filteredBookmarks.length) {
      setVisibleCount((prev) => Math.min(prev + 30, filteredBookmarks.length));
    }
  }, [inView, filteredBookmarks, visibleCount]);

  const displayedBookmarks = filteredBookmarks.slice(0, visibleCount);

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {displayedBookmarks.map((bookmark) => (
        <BookmarkCard key={bookmark.id} bookmark={bookmark} />
      ))}
      {visibleCount < filteredBookmarks.length && (
        <div ref={ref} className="col-span-full h-10 flex items-center justify-center">
          Loading more awesome sites...
        </div>
      )}
    </div>
  );
}
```

---

## Conclusion

By adopting SQLite/Turso or PostgreSQL/Supabase, creating an optimized relational model with proper indexes, bulk-loading data, and loading bookmarks progressively (via pagination or lazy loading), SYWYKE can scale to support 1,000+ sites with instantaneous loading speeds and seamless user interactions.
