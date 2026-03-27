# SYWYKE - Developer & Agent Instructions

## Architectural Decisions

- **Minimalist Dashboard UI:** The dashboard follows a minimalist design.
  - Header: No sorting, filtering, or 'Add Site' buttons.
  - Sidebar: No brand text or footer ('SYWYKE'). Uses an empty `AvatarFallback`.
  - Bookmark Cards: Exclude management actions (Favorite, Archive, Delete, Edit, Add Tags).
  - Collections and account settings are disabled.

- **State Management:** Uses Zustand (v5) located in `src/store/bookmarks-store.ts` for managing bookmarks, collections, and tags.

- **Astro Content Collections:** Site content is stored in `src/content/sites/` as Markdown files and managed via Astro's content collection system.

## Technical Notes

- **Vite 7 Override:** A Vite 7 override (`"overrides": { "vite": "^7" }`) is defined in `package.json` to ensure compatibility with Astro 6.
- **Icon Workaround:** The 'Github' icon is implemented as an inline SVG in `src/components/dashboard/header.tsx` due to export issues in the `lucide-react` version used.
- **Search:** Pagefind is used for search. The index is generated during the `postbuild` script.
- **Linting & Formatting:** Biome is the tool of choice. Use `npm run check` for verification.

## Conventions

- Do not add `package-lock.json` as the user prefers maintaining the repo without it (pnpm is preferred).
- All new components should follow the minimalist design language.
