# Shit Dragonmere Says

Searchable fan archive for public dragonmere / CORNDOWN prank-call content, built as a redaction-first transcript, quote, and audio index.

Technical implementation details live in [docs/TECHNICAL.md](docs/TECHNICAL.md).

## Guardrails

- Public sources only. Do not ingest private, paywalled, or unauthorized material.
- Sensitive details such as private phone numbers, addresses, and identifiable target info should be redacted before publication.
- This project is for parody, archival, and search use. It is not a harassment, calling, or targeting tool.

## Stack

- Next.js 15 App Router
- TypeScript
- Tailwind CSS
- Prisma
- PostgreSQL
- Meilisearch
- Vitest
- Playwright

## Local setup

1. Copy `.env.example` to `.env`.
2. Start local services with `docker compose up -d`.
3. Install dependencies with `npm install`.
4. Run `npm run db:generate`.
5. Create the database schema with `npm run db:push`.
6. Seed placeholder data with `npm run db:seed`.
7. Start the app with `npm run dev`.

## Scripts

- `npm run dev` starts Next.js.
- `npm run lint` runs ESLint.
- `npm run test` runs Vitest.
- `npm run test:e2e` runs Playwright.
- `npm run db:seed` loads safe placeholder data.
- `npm run search:index` pushes episodes, transcript segments, and quotes into Meilisearch.
- `npm run import:rss -- <feed-url>` imports podcast or RSS metadata.
- `npm run import:youtube -- <playlist-url>` imports public YouTube playlist metadata when `YOUTUBE_API_KEY` is configured.
- `npm run import:youtube-transcripts -- <playlist-url>` imports public YouTube transcripts for matching database episodes when captions are available.
- `npm run import:youtube-transcripts -- <playlist-url> --force` reimports captions even when transcript segments already exist.
- `npm run import:transcript -- <episode-id> <file-path>` imports local JSON, VTT, or SRT transcript files.

Notes for YouTube playlist imports:
- The API importer paginates through the full playlist when `YOUTUBE_API_KEY` is available.
- `Private video` and `Deleted video` placeholders are skipped instead of becoming archive episodes.
- Transcript import only succeeds where YouTube captions are publicly available for that video.
- Transcript re-runs skip episodes that already have transcript segments unless `--force` is supplied.

## Current scope

- Search-first homepage
- Episode directory
- Episode detail pages with transcript rows and timestamp deep links
- Persistent bottom audio player
- Quote browsing and permalinks
- Admin import page
- Admin transcript correction and redaction controls
- Search API and Prisma-backed search page

## Notes

- Transcript search currently has a Prisma fallback so the app works locally before Meilisearch is wired into live queries.
- Import jobs are tracked in `AdminImportJob`.
- Seed data is intentionally fictionalized and redaction-safe.
