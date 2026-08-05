const HERO_MOBILE_JPG = "/images/web/hero3-mobile.jpg";
const HERO_MOBILE_WEBP = "/images/web/hero3-mobile.webp";
const HERO_MOBILE_AVIF = "/images/web/hero3-mobile.avif";
const HERO_DESKTOP_JPG = "/images/web/hero3-desktop.jpg";
const HERO_DESKTOP_WEBP = "/images/web/hero3-desktop.webp";
const HERO_DESKTOP_AVIF = "/images/web/hero3-desktop.avif";

/**
 * LCP hero — split by viewport so each side only ever fetches its own asset.
 * Both are plain pre-sized static images (AVIF/WebP + JPG fallback), not
 * `next/image`: that component still emits an *unconditional*
 * `<link rel="preload">` for whichever Image has `priority`/`fetchPriority`
 * set, with no way to media-guard it — on mobile that preload fired anyway,
 * at the very front of <head>, competing at high priority against the real
 * mobile hero for bandwidth (measured contributor to a 4.6s mobile LCP).
 * Plain `<picture>` + a manually media-guarded preload link gives full
 * control with zero risk of the two viewports' preloads colliding.
 */
export function HeroImage() {
  return (
    <>
      {/* Mobile LCP — static asset in HTML (AVIF/WebP + JPG fallback) */}
      <picture className="absolute inset-0 md:hidden">
        <source srcSet={HERO_MOBILE_AVIF} type="image/avif" />
        <source srcSet={HERO_MOBILE_WEBP} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_MOBILE_JPG}
          alt="Смолян"
          decoding="async"
          fetchPriority="high"
          className="h-full w-full object-cover"
          style={{ objectPosition: "center top" }}
        />
      </picture>
      {/* Desktop LCP — static asset, hidden on mobile via CSS only (no
          `<img>` swap based on viewport, so nothing here can leak a
          cross-viewport network request). */}
      <picture className="absolute inset-0 max-md:hidden">
        <source srcSet={HERO_DESKTOP_AVIF} type="image/avif" />
        <source srcSet={HERO_DESKTOP_WEBP} type="image/webp" />
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={HERO_DESKTOP_JPG}
          alt="Смолян"
          decoding="async"
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

/** Preload hints for both hero viewports — each strictly media-guarded so
 *  only the one that will actually paint is ever requested. */
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
