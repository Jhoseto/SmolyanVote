import Image from "next/image";

const HERO_DESKTOP = "/images/web/hero3.jpg";
const HERO_MOBILE = "/images/web/hero3-mobile.jpg";

/**
 * LCP hero — split by viewport so mobile never downloads the desktop asset.
 * Mobile uses a pre-sized static JPEG (~32 KiB); desktop keeps Next/image pipeline.
 */
export function HeroImage() {
  return (
    <>
      {/* Mobile LCP — in HTML immediately, no /_next/image round-trip on Slow 4G */}
      {/* eslint-disable-next-line @next/next/no-img-element */}
      <img
        src={HERO_MOBILE}
        alt="Смолян"
        decoding="async"
        fetchPriority="high"
        className="absolute inset-0 h-full w-full object-cover md:hidden"
        style={{ objectPosition: "center top" }}
      />
      {/* Desktop LCP — unchanged; hidden on mobile so it is not fetched there */}
      <Image
        src={HERO_DESKTOP}
        alt="Смолян"
        fill
        loading="eager"
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

/** Preload hints for home — media-scoped so each viewport loads one hero only. */
export function HeroImagePreloads() {
  return (
    <>
      <link
        rel="preload"
        as="image"
        href={HERO_MOBILE}
        media="(max-width: 767px)"
        fetchPriority="high"
      />
      <link
        rel="preload"
        as="image"
        href={HERO_DESKTOP}
        media="(min-width: 768px)"
        fetchPriority="high"
      />
    </>
  );
}
