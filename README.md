# Tabwise

A student tablet finder for India. Tabwise asks a few questions about how you
study, your budget and whether you want a pen, then shortlists up to three
tablets from a curated, sourced catalog with dated INR prices.

Live at [tabwise.sahil.lol](https://tabwise.sahil.lol/).

## Stack

- [Astro](https://astro.build/) with React islands, built with Vite
- [shadcn/ui](https://ui.shadcn.com/) (Base UI primitives, `base-luma` style)
- [Hugeicons](https://hugeicons.com/)
- Public Sans and Roboto Slab via Fontsource
- Deployed to Cloudflare Workers as static assets

## Development

```sh
bun install
bun run dev
```

| Command             | Action                                    |
| ------------------- | ----------------------------------------- |
| `bun run dev`       | Start the local dev server                |
| `bun run build`     | Build the site to `./dist`                |
| `bun run preview`   | Preview the build locally                 |
| `bun run typecheck` | Run `astro check`                         |
| `bun run lint`      | Lint with ESLint                          |
| `bun run deploy`    | Build and deploy to Cloudflare Workers    |

## Catalog data

- `src/data/tablets.json` holds every model with a documented new-India
  purchase offer, its configurations, verified pen setups, tradeoffs and
  attributed review notes.
- `src/data/archive.json` lists researched models that are not currently
  purchase-ready.

The finder logic lives in `src/lib/finder.ts` and `src/lib/questions.ts`. It
runs entirely in the browser; answers are never sent anywhere.
