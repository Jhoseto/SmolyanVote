# SmolyanVote — Design Brief & Token System

> Документ описва **текущия визуален език** на SmolyanVote (v1) и дефинира **canonical design tokens** за пренос в v2 (Next.js + Tailwind + shadcn).
>
> **Свързани планове:** [`GREENFIELD_FULL_STACK_PLAN.md`](GREENFIELD_FULL_STACK_PLAN.md), [`MODERN_FRONTEND_PLAN.md`](MODERN_FRONTEND_PLAN.md)

---

## 1. Design Vision

### Brand personality

| Атрибут | Описание |
|---------|----------|
| **Civic & trustworthy** | Платформа за гражданско участие — сериозна, но достъпна |
| **Modern & premium** | Glassmorphism, фини градиенти, underline hover — не „enterprise сив“ |
| **Green identity** | Smolyan / природа / растеж — зелена палитра като primary |
| **Light-first** | Принудителен light mode на web (`color-scheme: light`) |
| **Bulgarian-first** | Typography оптимизирана за кирилица; source content на BG |

### Visual keywords

`glass`, `soft gradient`, `pill navigation`, `premium underline`, `hero photography`, `green civic`, `gold accent (mobile messenger)`, `rounded cards`, `subtle depth`

### Quality reference (direction, not copy)

Linear-level clarity + civic warmth — по-чист от типичен Bootstrap сайт, по-топъл от pure SaaS gray.

---

## 2. Design Principles (v1 → v2)

1. **Icon + label always visible** — navbar показва и икона, и текст (не icon-only desktop nav).
2. **Hover = underline, not button fill** — premium nav links use gradient underline (`::before`), not heavy background blocks.
3. **Green gradient for brand moments** — logo text, CTAs, active states use `#19861c → #48a24c` gradient.
4. **Glass without clutter** — navbar: top-to-bottom fade + `backdrop-filter: blur(5px)`.
5. **Photography-led hero** — full-width hero image with light overlay; typography over image.
6. **Consistent Cyrillic typography** — Inter/Manrope/Source Sans 3 stack from `fonts.css`.
7. **Mobile messenger adds gold** — premium metallic gold accents in chat UI (mobile app).

---

## 3. Canonical Color Tokens

> v1 има **няколко `:root` блока** с леко различни green стойности. По-долу е **canonical** set за v2; legacy стойности са в §10.

### 3.1 Brand — Green (primary)

| Token | Hex | Usage |
|-------|-----|--------|
| `--color-primary-900` | `#14532d` | Dark accents, mobile green.900 |
| `--color-primary-800` | `#166534` | Badge text, deep accents |
| `--color-primary-700` | `#15803d` | Hover dark |
| `--color-primary-600` | `#16a34a` | — |
| `--color-primary-500` | `#19861c` | **Main brand green** (index, buttons) |
| `--color-primary-400` | `#4cb15c` | Navbar `--primary-color` |
| `--color-primary-300` | `#48a24c` | **Accent green** (gradients) |
| `--color-primary-200` | `#86efac` | Light tints |
| `--color-primary-100` | `#dcfce7` | Background tints |
| `--color-primary-50` | `#f0fdf4` | Subtle surfaces |

**Primary gradient (most used):**
```css
linear-gradient(135deg, #19861c 0%, #48a24c 100%)
```

**Alternate hero gradient:**
```css
linear-gradient(135deg, #0F7B59 0%, #4CAF50 100%)
```

### 3.2 Neutral — Text & surfaces

| Token | Hex | Usage |
|-------|-----|--------|
| `--color-text-primary` | `#2C3E50` | Body headings (index) |
| `--color-text-heading` | `#1a202c` | H1–H6 (fonts.css) |
| `--color-text-secondary` | `#5A6C7D` | Secondary copy |
| `--color-text-muted` | `#6C757D` | Meta, captions |
| `--color-text-nav` | `#1c1e21` | Navbar FB-style text |
| `--color-text-nav-muted` | `#65676b` | Navbar secondary |
| `--color-surface-white` | `#ffffff` | Cards, modals |
| `--color-surface-light` | `#F8F9FA` | Page background |
| `--color-surface-muted` | `#f0f2f5` | Hover, FB-style bg |
| `--color-border-default` | `#e4e6ea` | Borders |
| `--color-border-subtle` | `rgba(255,255,255,0.2)` | Glass borders |

### 3.3 Semantic

| Token | Hex | Usage |
|-------|-----|--------|
| `--color-success` | `#22c55e` | Success states |
| `--color-error` | `#ef4444` / `#e74c3c` | Errors, logout |
| `--color-warning` | `#f59e0b` | Warnings |
| `--color-info` | `#3b82f6` | Info |

### 3.4 Gold accent (SVMessenger mobile — premium)

| Token | Hex | Usage |
|-------|-----|--------|
| `--color-gold-500` | `#c9a961` | Main premium gold |
| `--color-gold-400` | `#d4b973` | Light metallic |
| `--color-gold-600` | `#b8954d` | Rich gold |
| `--color-gold-800` | `#7d6028` | Dark accent |

Used for: settings icons, chevrons, premium chat chrome — **not** primary web navbar.

### 3.5 Event-type theme colors (particles / carousel)

| Event type | Theme | Particle accent |
|------------|-------|-----------------|
| Simple Event | Green (default) | green particles |
| Referendum | Orange | `.orange-theme` |
| Multi-poll | Blue/purple variants | per `particles-background.css` |

---

## 4. Typography Tokens

### 4.1 Font families (web — `fonts.css`)

| Role | Font stack | CSS variable |
|------|------------|--------------|
| **Headings** | Inter | `--font-primary` |
| **Subtitles / lead** | Manrope | `--font-secondary` |
| **Body** | Source Sans 3 | `--font-body` |
| **UI / nav / buttons** | IBM Plex Sans | `--font-ui` |
| **Monospace** | SF Mono, Cascadia Code | `--font-mono` |

**Google Fonts imports:** Inter, Manrope, Source Sans 3, IBM Plex Sans (Cyrillic subsets).

**Index.html also loads:** Poppins, Inter, Noto Serif Display — hero/marketing pages may use Poppins in places; canonical body remains Inter/Source Sans 3 per global theme.

### 4.2 Type scale

| Element | Size | Weight | Letter-spacing |
|---------|------|--------|----------------|
| H1 | `clamp(2rem, 5vw, 3.5rem)` | 800 | -0.03em |
| H2 | `clamp(1.75rem, 4vw, 2.5rem)` | 700 | -0.02em |
| H3 | `clamp(1.5rem, 3.5vw, 2rem)` | 600 | -0.02em |
| Body | 16px (15px mobile) | 400 | -0.01em |
| Lead / subtitle | `clamp(1.125rem, 2.5vw, 1.375rem)` | 400 | -0.01em |
| Nav link (glass) | 0.8rem | **300** (thin) | 0.3px |
| Nav brand | 1.2rem | 700 | — |
| Button | 0.9rem | 600 | 0.01em |
| Badge | 0.75rem | 600 | 0.025em, uppercase |
| Caption | 0.8rem | 400 | 0.01em |

### 4.3 Typography rules

- `-webkit-font-smoothing: antialiased` on body
- Headings: tight line-height `1.2`
- Body: line-height `1.6` (1.65 mobile)
- **Navbar exception:** ultra-light weight 300 for elegant civic nav

---

## 5. Spacing & Layout Tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--space-1` | 4px | Tight gaps |
| `--space-2` | 8px | Icon gaps |
| `--space-3` | 12px | Nav text margin |
| `--space-4` | 16px | Standard padding |
| `--space-5` | 20px | — |
| `--space-6` | 24px | Section gaps |
| `--space-8` | 32px | — |
| `--space-10` | 40px | — |
| `--space-12` | 48px | Section padding |
| `--container-max` | `min(1200px, calc(100vw - 2rem))` | Content width |
| `--navbar-height` | ~56px (0.75rem padding) | Fixed top offset |

### Breakpoints (observed)

| Name | Width | Behavior |
|------|-------|----------|
| Mobile | `< 768px` | Mobile navbar CSS overrides |
| Tablet | `768px – 1024px` | Transitional |
| Desktop | `≥ 769px` | Full glass navbar, nav links visible |

---

## 6. Border Radius Tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--radius-sm` | 6px – 8px | Inputs, small chips |
| `--radius-md` | 12px | Cards, dropdowns |
| `--radius-lg` | 16px – 20px | Feature cards, carousel |
| `--radius-xl` | 28px | App promo card |
| `--radius-pill` | 999px | Nav links, badges, language options |

---

## 7. Shadow & Elevation Tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--shadow-sm` | `0 1px 2px rgba(0,0,0,0.1)` | Subtle |
| `--shadow-md` | `0 4px 6px rgba(0,0,0,0.1)` | Cards |
| `--shadow-lg` | `0 10px 15px – 25px rgba(0,0,0,0.15)` | Modals, hero buttons |
| `--shadow-navbar` | `0 2px 15px rgba(0,0,0,0.08)` | Fixed navbar |
| `--shadow-promo` | `0 18px 45px rgba(15,118,110,0.18)` | SVMessenger promo card |
| `--shadow-dropdown` | `0 8px 32px rgba(0,0,0,0.15)` | Language dropdown |

---

## 8. Glass & Surface Effects

### 8.1 Navbar glassmorphism

```css
background: linear-gradient(180deg,
  rgba(248, 249, 250, 0.95) 0%,
  rgba(248, 249, 250, 0.85) 40%,
  rgba(255, 255, 255, 0.6) 70%,
  rgba(255, 255, 255, 0.3) 100%);
backdrop-filter: blur(5px);
border-bottom: 1px solid rgba(255, 255, 255, 0.2);
```

### 8.2 Glass gradient utility

```css
--gradient-glass: linear-gradient(135deg,
  rgba(255,255,255,0.2) 0%,
  rgba(255,255,255,0.1) 100%);
```

### 8.3 Language dropdown glass

```css
background: rgba(255, 255, 255, 0.95);
backdrop-filter: blur(10px);
border-radius: 12px;
```

### 8.4 Profile dropdown (Apple-style)

Frosted glass panel with soft shadow — see `.dropdown-menu-glass` in navbar.css.

---

## 9. Motion & Animation Tokens

| Token | Value | Usage |
|-------|-------|--------|
| `--duration-fast` | 150ms – 200ms | Micro-interactions |
| `--duration-normal` | 250ms – 400ms | Nav hover, dropdowns |
| `--duration-slow` | 1.2s – 1.8s | Hero entrance |
| `--ease-default` | `cubic-bezier(0.4, 0, 0.2, 1)` | Nav links |
| `--ease-out-quart` | `cubic-bezier(0.25, 1, 0.5, 1)` | Hero |
| `--ease-out-expo` | `cubic-bezier(0.19, 1, 0.22, 1)` | Premium feel |

### Signature animations

- **Hero content:** `heroContentSlideIn` 1.2s on load
- **Nav hover:** underline width 0 → 70%, color shift to primary green
- **Hero CTA buttons:** 3D depth + glass reflection on hover (`glassReflection`)
- **Particles background:** slow ambient motion (35–40s cycles)
- **Reduced motion:** respect `prefers-reduced-motion: reduce`

---

## 10. Component Patterns (v1 inventory)

### 10.1 Navbar (`.navbar-glassmorphism`)

| Property | Value |
|----------|-------|
| Position | Fixed top, z-index 1030 |
| Layout | Brand left; nav links + auth **right-aligned** |
| Link style | Icon (1.3rem) + label always visible |
| Link gap | `0.35rem` between items |
| Hover | Gradient underline 2px, text/icon → primary green |
| Auth buttons | Pill outline + gradient CTA for register |
| Language | Custom dropdown with flag-icons (fi fi-xx) |

**Source:** `templates/fragments/navbar.html`, `css/navBar/navbar.css`, `js/navbar.js`

### 10.2 Hero section (index)

| Property | Value |
|----------|-------|
| Background | `/images/web/hero3.jpg` |
| Overlay | White gradient, opacity ~0.1 |
| Title | Large display, green gradient text option |
| CTA buttons | 3D glass reflection effect, deep shadow |
| Animation | Slide-in on load |

**Source:** `css/index.css` — `.hero`, `.hero .btn`

### 10.3 Feature cards / carousel

| Property | Value |
|----------|-------|
| Style | White cards, 20px radius, deep shadow |
| Carousel | 3D perspective rotate |
| Particles | Optional `.particles-background` overlay |

**Source:** `css/features.css`, `css/particles-background.css`

### 10.4 SVMessenger app promo (index)

| Property | Value |
|----------|-------|
| Layout | Two columns: text left, image right (~50% width, max ~260px) |
| Card | 28px radius, green radial wash, teal shadow |
| Badge | “NEW” pill — green tint bg |
| Image | `/svmessenger/img/svapp_promo_premium.jpg` |

**Source:** `css/index.css` — `.app-promo-*`, `templates/index.html`

### 10.5 Buttons

| Variant | Style |
|---------|-------|
| Primary | Green gradient fill, white text, rounded |
| Hero primary | 3D depth + shimmer on hover |
| Auth login | Outline / light |
| Auth register | Green gradient pill |
| Nav | Transparent; underline on hover only |

### 10.6 Forms & modals

- Bootstrap 5.3 base + custom `loginModal.css`, `oauth-buttons.css`
- Rounded inputs, green focus ring aligned with brand
- OAuth: branded Google button styling

### 10.7 SVMessenger chat (mobile)

| Element | Style |
|---------|-------|
| Sent bubble | Deep emerald gradient `#064e3b → #022c22`, shine overlay |
| Received bubble | Light surface (theme Colors) |
| Settings accent | Gold icons/chevrons |
| Translate menu | Long-press on received messages |

**Source:** `SVMessengerMobile/src/components/chat/MessageBubble.tsx`, `theme/colors.ts`

### 10.8 Icons

- **Web:** Bootstrap Icons (`bi bi-*`)
- **Flags:** flag-icons CDN (`fi fi-bg`, etc.)
- **Mobile:** Heroicons-style custom icon components

---

## 11. Layout & Page Structure

```
┌─────────────────────────────────────────────┐
│  Fixed Navbar (glass)                       │
├─────────────────────────────────────────────┤
│  Hero (full-bleed photo + overlay)          │
├─────────────────────────────────────────────┤
│  Stats / features (container max 1200px)      │
├─────────────────────────────────────────────┤
│  Carousel / event types                     │
├─────────────────────────────────────────────┤
│  SVMessenger promo card                     │
├─────────────────────────────────────────────┤
│  Footer                                     │
└─────────────────────────────────────────────┘
```

- Main content offset for fixed navbar (~padding-top on body or hero)
- No horizontal scroll (`overflow-x: hidden` on html/body)

---

## 12. Accessibility & UX

| Rule | Implementation |
|------|----------------|
| Color scheme | Light only on web (global-theme.css) |
| Focus | Visible focus on hero buttons |
| Motion | Reduced motion media query in fonts.css |
| Contrast | Primary green on white meets AA for large text; verify small text |
| Touch targets | Mobile CSS overrides in `css/mobile/*` |
| Cookie consent | GDPR Google Consent Mode v2 before analytics |

---

## 13. v2 Token Export (Tailwind / shadcn)

Recommended `packages/ui/tokens.ts` + `tailwind.config.ts` extension:

```typescript
export const smolyanVoteTokens = {
  colors: {
    primary: {
      DEFAULT: '#19861c',
      foreground: '#ffffff',
      50: '#f0fdf4',
      100: '#dcfce7',
      300: '#48a24c',
      500: '#19861c',
      700: '#15803d',
      900: '#14532d',
    },
    gold: {
      400: '#d4b973',
      500: '#c9a961',
      600: '#b8954d',
    },
    text: {
      primary: '#2C3E50',
      secondary: '#5A6C7D',
      muted: '#6C757D',
    },
  },
  fontFamily: {
    sans: ['Inter', 'system-ui', 'sans-serif'],
    body: ['Source Sans 3', 'system-ui', 'sans-serif'],
    ui: ['IBM Plex Sans', 'system-ui', 'sans-serif'],
    display: ['Manrope', 'Inter', 'sans-serif'],
  },
  borderRadius: {
    sm: '8px',
    md: '12px',
    lg: '20px',
    xl: '28px',
  },
  boxShadow: {
    navbar: '0 2px 15px rgba(0,0,0,0.08)',
    promo: '0 18px 45px rgba(15,118,110,0.18)',
  },
};
```

### shadcn theme mapping

| shadcn variable | SmolyanVote token |
|-----------------|-------------------|
| `--primary` | `#19861c` |
| `--primary-foreground` | `#ffffff` |
| `--accent` | `#48a24c` |
| `--background` | `#F8F9FA` |
| `--foreground` | `#2C3E50` |
| `--muted` | `#f0f2f5` |
| `--border` | `#e4e6ea` |
| `--radius` | `12px` |

---

## 14. Do's and Don'ts

### Do

- Use green gradient for brand logo text and primary CTAs
- Keep nav labels visible alongside icons
- Use underline hover for nav (not filled pill hover)
- Use glass surfaces sparingly (navbar, dropdowns, promo cards)
- Maintain light, airy whitespace
- Use photography in hero/marketing sections
- Use gold accents only in messenger/premium contexts

### Don't

- Switch web to dark mode by default (v1 is light-forced)
- Use heavy solid navbar background ( loses glass fade)
- Hide nav text on desktop (current design shows both)
- Mix random greens — use canonical tokens §3
- Use gold as primary web brand color
- Show Google Translate widget UI (hidden in v1 — see GREENFIELD §27)

---

## 15. Legacy inconsistencies (v1 audit)

Document for migration cleanup:

| Issue | Locations | Canonical resolution |
|-------|-----------|---------------------|
| Multiple `--primary-green` | index.css `#19861c`, navbar `#4cb15c` | Use `#19861c` as DEFAULT |
| Multiple `--accent-green` | `#48a24c`, `#4CAF50`, `#228e55` | Use `#48a24c` |
| Index uses Poppins in HTML; fonts.css uses Inter | index.html vs fonts.css | v2: Inter + Manrope only |
| Mobile green scale vs web hex | colors.ts Tailwind scale vs CSS vars | Map mobile scale to same primary.500 |
| `--font-primary` differs index vs fonts.css | index.css includes Playfair | Unify on fonts.css stack |

---

## 16. Source File Index

| Area | Files |
|------|-------|
| Global theme | `static/css/global-theme.css` |
| Typography | `static/css/fonts.css` |
| Navbar | `static/css/navBar/navbar.css`, `templates/fragments/navbar.html` |
| Index / hero | `static/css/index.css`, `templates/index.html` |
| Features | `static/css/features.css` |
| Particles | `static/css/particles-background.css` |
| Mobile web | `static/css/mobile/*.css` |
| Footer | `static/css/footer.css` |
| Auth | `static/css/loginModal.css`, `static/css/oauth-buttons.css` |
| Mobile app theme | `SVMessengerMobile/src/theme/colors.ts` |
| Messenger web | `svmessenger-frontend/src/styles/svmessenger.css` |
| Fragment loader | `templates/fragments/topHtmlStyles.html` |

---

## 17. v2 Implementation Checklist

- [ ] Create `packages/ui/tokens.ts` from §13
- [ ] Configure Tailwind theme extension
- [ ] Map shadcn CSS variables (§13 table)
- [ ] Build `Navbar` component matching §10.1 (glass + underline hover)
- [ ] Build `Hero` component matching §10.2
- [ ] Build `AppPromoCard` matching §10.4
- [ ] Port gold palette for messenger module only
- [ ] Document component Storybook stories per pattern
- [ ] Resolve legacy inconsistencies (§15) during v2 — do not copy blindly

---

*Document version: 1.0 — SmolyanVote Design Brief & Token System (audited from v1 codebase)*
