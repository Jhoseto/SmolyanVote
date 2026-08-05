import Image from "next/image";

const HERO_DESKTOP = "/images/web/hero3.jpg";
const HERO_MOBILE_JPG = "/images/web/hero3-mobile.jpg";
const HERO_MOBILE_WEBP = "/images/web/hero3-mobile.webp";
const HERO_MOBILE_AVIF = "/images/web/hero3-mobile.avif";

/**
 * LCP hero — split by viewport so mobile never downloads the desktop asset.
 * Mobile uses a pre-sized static JPEG (~32 KiB); desktop keeps Next/image pipeline.
 */
export function HeroImage() {
  return (
    <>
      {/* Mobile LCP — static asset in HTML (WebP + JPG fallback), no /_next/image on Slow 4G */}
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
      {/* Desktop LCP — hidden on mobile so it is not fetched there.
          `priority` makes next/image emit a matching preload (correct srcset/sizes)
          instead of the old hand-rolled preload that pointed at a different
          (unoptimized) URL. `fetchPriority` isn't implied by `priority` in this
          Next version — it must be passed explicitly to reach the <img> and preload. */}
      <Image
        src={HERO_DESKTOP}
        alt="Смолян"
        fill
        priority
        fetchPriority="high"
        quality={75}
        sizes="2000px"
        className="object-cover max-md:hidden"
        style={{ objectPosition: "center top" }}
      />
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

/**
 * Preload hint for the mobile hero only — desktop's next/image `priority` already
 * emits its own correctly-sized preload (see HeroImage above), so a second manual
 * one here would just fetch an extra, unused copy of the unoptimized source file.
 */
export function HeroImagePreloads() {
  return (
    <link
      rel="preload"
      as="image"
      href={HERO_MOBILE_AVIF}
      type="image/avif"
      media="(max-width: 767px)"
      fetchPriority="high"
    />
  );
}
