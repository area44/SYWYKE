import { defineCollection, z } from "astro:content";
import { glob } from "astro/loaders";

const sites = defineCollection({
  loader: glob({ pattern: "**/*.md", base: "./src/content/sites" }),
  schema: z.object({
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  sites,
};
