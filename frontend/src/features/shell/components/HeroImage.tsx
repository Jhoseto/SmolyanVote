const HERO_MOBILE_JPG = "/images/web/hero3-mobile.jpg";
const HERO_MOBILE_WEBP = "/images/web/hero3-mobile.webp";
const HERO_MOBILE_AVIF = "/images/web/hero3-mobile.avif";
const HERO_DESKTOP_JPG = "/images/web/hero3-desktop.jpg";
const HERO_DESKTOP_WEBP = "/images/web/hero3-desktop.webp";
const HERO_DESKTOP_AVIF = "/images/web/hero3-desktop.avif";

/** Intrinsic size of hero3-mobile.jpg — reserves space before CSS paints. */
const HERO_MOBILE_W = 828;
const HERO_MOBILE_H = 331;

/**
 * LCP hero — split by viewport so each side only ever fetches its own asset.
 * Layout classes `sv-hero-*` are defined in inline critical CSS (see
 * `heroCriticalCss.ts`) so the image can paint before the Tailwind bundle
 * loads. Tailwind utilities on `<picture>` are progressive enhancement only.
 */
export function HeroImage() {
  return (
    <>
      {/* Mobile LCP — static asset in HTML (AVIF/WebP + JPG fallback) */}
      <picture className="sv-hero-bg sv-hero-bg--mobile absolute inset-0 md:hidden">
        <source srcSet={HERO_MOBILE_AVIF} type="image/avif" />
        <source srcSet={HERO_MOBILE_WEBP} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_MOBILE_JPG}
          alt="Смолян"
          width={HERO_MOBILE_W}
          height={HERO_MOBILE_H}
          decoding="sync"
          fetchPriority="high"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center top" }}
        />
      </picture>
      {/* Desktop LCP — static asset, hidden on mobile via CSS only */}
      <picture className="sv-hero-bg sv-hero-bg--desktop absolute inset-0 max-md:hidden">
        <source srcSet={HERO_DESKTOP_AVIF} type="image/avif" />
        <source srcSet={HERO_DESKTOP_WEBP} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_DESKTOP_JPG}
          alt="Смолян"
          decoding="sync"
          fetchPriority="high"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center top" }}
        />
      </picture>
      <div
        className="absolute inset-0 z-0"
        style={{
          background:
            "linear-gradient(105deg, rgba(255,255,255,0.55) 0%, rgba(255,255,255,0.25) 45%, rgba(76,175,80,0.12) 100%)",
        }}
      />
    </>
  );
}

/** Preload hints for both hero viewports — each strictly media-guarded. */
export function HeroImagePreloads() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={HERO_MOBILE_AVIF}
        type="image/avif"
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_DESKTOP_AVIF}
        type="image/avif"
        media="(min-width: 768px)"
        fetchPriority="high"
      />
    </>
  );
}
