import { defineCollection, z } from "astro:content";
import { file } from "astro/loaders";

const sites = defineCollection({
  loader: file("src/content/sites.json"),
  schema: z.object({
    id: z.string(),
    title: z.string(),
    url: z.string().url(),
    description: z.string(),
    tags: z.array(z.string()).optional(),
  }),
});

export const collections = {
  sites,
};
