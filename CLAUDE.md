# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

VerifiCARLO is a Next.js 14 (App Router) vehicle inspection service landing page, migrated from vanilla JavaScript. The site is in Spanish (es-PE) and targets the Lima, Peru market for used car inspections.

## Commands

### Development
```bash
npm run dev    # Start development server on http://localhost:3000
npm run build  # Build for production
npm start      # Start production server
npm run lint   # Run ESLint
```

## Architecture

### Component Structure

This project follows a **folder-based component organization** where each component lives in its own directory with co-located styles:

```
app/components/
├── ComponentName/
│   ├── ComponentName.tsx
│   └── ComponentName.module.css
```

All components are imported into `app/page.tsx`, which serves as the main **single-page layout router**. The home page (`app/page.tsx`) orchestrates the display of all sections in order:

1. PromotionalBanner
2. NavBar
3. Hero
4. ProcessSection
5. ServicesSection
6. BenefitsSection
7. EligeTranquiloSection
8. CentroInspeccionSection
9. FAQ
10. Footer
11. WhatsappFlotante (floating WhatsApp button)

### Shared Logic

- **`app/services/Slider.tsx`**: Reusable Splide.js slider wrapper component
  - Accepts `metodoSlider` prop: `"proceso-inspeccion"` or `"servicios"`
  - Configured with different responsive breakpoints per slider type
  - Used by ServicesSection and ProcessSection

- **`app/hooks/useEscape.ts`**: Custom hook for ESC key handling
  - Takes a callback function to execute on Escape key press
  - Used in FAQ component to close open answers

### Styling Approach

- **Tailwind CSS** for utility classes
- **Global styles** in `app/globals.css`
- **Module CSS** files co-located with components
- **External stylesheet** `/styles1.css` (legacy from vanilla JS migration)

### Key Technologies

- **Next.js 14** with App Router
- **TypeScript** with strict mode enabled
- **Splide.js** (`@splidejs/splide`) for carousels
- **React hooks** for state and side effects
- **"use client"** directive on interactive components (FAQ, page.tsx, Slider)

### Analytics & Tracking

The `app/layout.tsx` includes tracking scripts loaded via `next/script`:
- Google Tag Manager (GTM-N74TS6ZF)
- Meta Pixel / Facebook (ID: 1381587826730443)
- TikTok Pixel (ID: D4928FBC77U6O1UKRBG0)

### Path Aliases

- `@/*` maps to project root (configured in `tsconfig.json`)

## Migration Context

This codebase is being migrated from vanilla JavaScript to Next.js/React. The git history shows:

- Old component files at root level have been deleted (e.g., `app/components/Hero.tsx`)
- New structure uses folders (e.g., `app/components/Hero/Hero.tsx`)
- Legacy CSS and JS files (`/styles1.css`, `/script1.js`, `main.js`) are still referenced in layout.tsx

When working on components, be aware that some styling may come from the legacy `/styles1.css` file rather than module CSS.
