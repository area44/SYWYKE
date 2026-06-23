import { defineCollection, z } from "astro:content";

const sites = defineCollection({
  type: "content",
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
