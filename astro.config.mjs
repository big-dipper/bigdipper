import { defineConfig } from 'astro/config';
import starlight from '@astrojs/starlight';
import starlightOpenAPI, { openAPISidebarGroups } from 'starlight-openapi';

// Served from the root of its own address (Render now, Big Dipper's domain later).
// SITE is the public address, used for absolute links; set it in the host's environment.
// The docs live under /docs (Starlight); the rest of the site is plain Astro pages.
export default defineConfig({
  site: process.env.SITE || 'https://bigdipper.onrender.com',
  base: process.env.BASE || '/',
  trailingSlash: 'ignore',
  integrations: [
    starlight({
      title: 'Little Dipper docs',
      description: 'How Little Dipper works, and how to build on it: the API every Little Dipper serves, its data model, AI assistants, and connecting nodes and services.',
      // The site has its own pages everywhere else; the docs shouldn't claim the site's 404.
      disable404Route: true,
      favicon: '/favicon.svg',
      social: [{ icon: 'github', label: 'Source code', href: 'https://github.com/big-dipper/littledipper' }],
      customCss: [
        '@fontsource/caprasimo/400.css',
        '@fontsource/figtree/400.css',
        '@fontsource/figtree/600.css',
        '@fontsource/figtree/700.css',
        './src/styles/docs.css',
      ],
      components: { SiteTitle: './src/components/DocsSiteTitle.astro' },
      plugins: [
        starlightOpenAPI([
          {
            base: 'docs/api',
            schema: './openapi/little-dipper.json',
            sidebar: { label: 'API reference', collapsed: true, operations: { badges: true } },
          },
        ]),
      ],
      sidebar: [
        { label: 'Start here', items: ['docs', 'docs/your-little-dipper', 'docs/quickstart'] },
        {
          label: 'How it works',
          items: ['docs/concepts/records', 'docs/concepts/privacy', 'docs/concepts/people-and-sharing', 'docs/concepts/compatibility', 'docs/concepts/stack'],
        },
        {
          label: 'Build on it',
          items: ['docs/build/authentication', 'docs/build/ai-assistants', 'docs/build/node-to-node', 'docs/build/services'],
        },
        { label: 'Reference', items: ['docs/reference/categories'] },
        ...openAPISidebarGroups,
      ],
    }),
  ],
});
