/** Stylesheet loaded without blocking first paint (print → target media via inline script). */
export function NonBlockingStylesheet({
  href,
  media = "all",
}: {
  href: string;
  /** Applied after fetch; use viewport queries for mobile-only sheets. */
  media?: string;
}) {
  const id = `nbs-${href.replace(/\W/g, "").slice(-28)}`;
  const escapedMedia = media.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return (
    <>
      <link rel="preload" href={href} as="style" media={media} />
      <link rel="stylesheet" href={href} media="print" id={id} precedence="default" />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var e=document.getElementById("${id}");if(e&&matchMedia("${escapedMedia}").matches)e.media="${escapedMedia}";})();`,
        }}
      />
    </>
  );
}
