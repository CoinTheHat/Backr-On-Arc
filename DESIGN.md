# Design System: Backr (Light & Interactive)
**Project ID:** 6595355317999266046

## 1. Visual Theme & Atmosphere
**Vibe:** Bright, Dynamic, "Alive".
A high-end, white-themed interface that feels alive. It moves away from static dark layouts to a breathable, light, and highly interactive experience.
*   **Base:** Clean White (#FFFFFF) & Soft Mist (#F8F9FC).
*   **Glassmorphism:** "Light Glass" (White/60% opacity + Blur 20px) for cards and overlays.
*   **Interactivity:**
    *   All cards *lift* and *glow* on hover.
    *   Buttons have *fluid* gradient transitions.
    *   Scroll animations (fade-in, slide-up) for all elements.

## 2. Color Palette
### Canvas
*   **Pure Light (#FFFFFF):** Main background.
*   **Soft Mist (#F8F9FC):** Section backgrounds/alternating panels.

### Accents (The "Cosmic" Touch)
*   **Violet Beam (#6366F1):** Primary Brand.
*   **Hot Pink (#EC4899):** Creative/Highlights.
*   **Sky Blue (#0EA5E9):** Trust/Info.
*   *Usage:* Use these as *gradients* on text, buttons, or subtle background blurred orbs, NOT as heavy solid blocks.

### Typography & Structure
*   **Headings:** `Playfair Display`, Deep Navy (#0F172A).
*   **Body:** `Inter`, Slate (#475569).
*   **Borders:** Ultra-subtle (#E2E8F0).

## 3. Component Stylings
*   **Buttons:**
    *   *Primary:* `bg-gradient-to-r from-violet-500 to-fuchsia-500`, rounded-full, shadow-lg, `hover:shadow-violet-500/30`.
    *   *Secondary:* White with subtle gray border, `hover:bg-gray-50`.
*   **Interactive Cards:**
    *   White background, `rounded-3xl`.
    *   **Default:** `shadow-sm`, border-transparent.
    *   **Hover:** `scale-[1.02]`, `shadow-xl`, `border-violet-100` (The "Lift" effect).
*   **Inputs:**
    *   `bg-gray-50`, `rounded-xl`, focus: `ring-2 ring-violet-100`.

## 4. Layout Principles
*   **Fluidity:** Use `max-w-screen-2xl` for a more expansive feel.
*   **Asymmetry:** Break the grid occasionally with overlapping elements to feel "dynamic".
*   **Whitespace:** Extremely generous (`py-32` for Hero).
