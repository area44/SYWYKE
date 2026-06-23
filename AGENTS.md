# Project Overview
Sywyke (Sites You Wish You Knew Earlier) is a curated collection of underrated websites. It's built as a highly interactive, single-page dashboard experience.

## Major Directories
- `src/content/sites/`: Markdown files containing the curated websites data.
- `src/components/`: React components for the dashboard UI (sidebar, header, bookmark cards).
- `src/store/`: Zustand store for state management.
- `src/lib/`: Utility functions for data fetching and processing.
- `public/`: Static assets like icons and manifest.

# Tech Stack
- **Astro 7**: Framework for building the site.
- **TypeScript**: Strictly used for type safety.
- **React 19**: For building interactive UI components.
- **Tailwind CSS v4**: For styling.
- **Zustand v5**: For client-side state management.
- **Biome**: For linting, formatting, and static analysis.

# Development Commands
- `pnpm install`: Install dependencies.
- `pnpm dev`: Start the development server at http://localhost:4321/.
- `pnpm build`: Build the production-ready site.
- `pnpm preview`: Preview the production build locally.
- `pnpm check`: Run Biome linting, formatting, and static analysis.

# Coding Standards
- **Strict TypeScript**: Use strict types; avoid `any`.
- **Minimal Dashboard UI**: Follow the strictly minimal design (exclude unnecessary sorting, filtering, or management actions).
- **React 19 Hooks**: Prefer the `use()` hook for context.
- **Explicit Button Types**: Always provide a `type` attribute for `<button>` elements.
- **One Component per File**: Split complex components into smaller files.
- **Zustand State**: Perform initialization directly during render or use stable reference checks to avoid unnecessary re-renders.

# Astro Guidelines
- **Server-First Rendering**: Prefer server-side data fetching and rendering.
- **Islands Architecture**: Use `client:load` or `client:visible` only where necessary for interactivity.
- **Content Collections**: All website data is managed via Astro Content Collections (`src/content/sites/`).
- **Astro 7 APIs Only**: Do not use deprecated features.

# File Organization
- **Pages**: Located in `src/pages/` (primary entry point is `index.astro`).
- **Layouts**: Base templates in `src/layouts/`.
- **Components**: Reusable UI elements in `src/components/`.
- **Assets**: Shared assets in `public/` or `src/assets/`.
