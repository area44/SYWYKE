import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

export const VALID_TAGS = [
  "ai",
  "components",
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
] as const;

const sites = defineCollection({
  loader: file("src/content/sites.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
    tags: z.array(z.enum(VALID_TAGS)).optional(),
  }),
});

export const collections = {
  sites,
};
