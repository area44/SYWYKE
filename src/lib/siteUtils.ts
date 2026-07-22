import { getDbBookmarks } from "./schema";

// Sort all sites alphabetically from the database
export async function getSortedSites() {
  const bookmarks = await getDbBookmarks();
  return bookmarks.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
}

// Extract unique tags from database sites
export function extractUniqueTags(
  bookmarks: Awaited<ReturnType<typeof getSortedSites>>
) {
  const tagSet = new Set<string>();
  for (const bookmark of bookmarks) {
    for (const tag of bookmark.tags ?? []) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet);
}
