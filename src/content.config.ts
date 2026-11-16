import { defineCollection } from 'astro:content';
import { docsLoader } from '@astrojs/starlight/loaders';
import { docsSchema } from '@astrojs/starlight/schema';

// The docs (Starlight): src/content/docs/docs/… is served at /docs/….
export const collections = { docs: defineCollection({ loader: docsLoader(), schema: docsSchema() }) };
