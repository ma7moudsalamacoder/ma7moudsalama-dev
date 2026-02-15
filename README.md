# MA7MOUD SALAMA Portfolio

Personal portfolio website for **Mahmoud Salama** built with Vue 3 + Vite.
The site highlights backend and full-stack expertise, selected projects, and contact channels in a modern light/dark themed UI.

## What The Site Includes

- Sticky top navigation with theme toggle
- Hero section with intro and primary CTAs
- About section with professional summary and stats
- Skills section (Backend, Frontend, DevOps, Databases, Mobile Apps)
- Projects section for featured deployments
- Contact section with key profile links
- Footer and floating availability status

## Tech Stack

- Vue 3 (Composition API)
- Vite
- TypeScript
- Tailwind CSS
- Pinia
- Vue Router

## Theme Support

- Dark mode is default
- Light mode is supported with dedicated class styling
- Theme preference is persisted in `localStorage`

## Project Structure

- `src/views/HomeView.vue` : page composition
- `src/components/portfolio/*` : portfolio sections/components
- `src/assets/portfolio.css` : shared UI classes/effects
- `src/composables/useTheme.ts` : theme state and persistence

## Scripts

```sh
npm run dev
```
Runs the app in development mode.

```sh
npm run build
```
Builds the production bundle.

```sh
npm run preview
```
Previews the production build locally.

```sh
npm run lint
```
Runs ESLint.
