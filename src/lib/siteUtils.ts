import { getCollection } from "astro:content";

// Sort all sites alphabetically
export async function getSortedSites() {
  const sites = await getCollection("sites");
  return sites.sort((a, b) =>
    (a.data.title || "").localeCompare(b.data.title || "")
  );
}

// Extract unique tags from sites
export function extractUniqueTags(
  sites: Awaited<ReturnType<typeof getSortedSites>>
) {
  const tagSet = new Set<string>();
  for (const site of sites) {
    for (const tag of site.data.tags ?? []) {
      tagSet.add(tag);
    }
  }
  return Array.from(tagSet);
}
