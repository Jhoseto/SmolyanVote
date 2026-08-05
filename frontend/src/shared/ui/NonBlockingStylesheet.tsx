/**
 * Stylesheet that does NOT block first paint.
 *
 * Starts as `media="print"` (non-blocking download), then switches to the
 * real media query in the link's `load` handler. Switching media *before*
 * the sheet finishes downloading would re-introduce render-blocking — so
 * we never do that.
 */
export function NonBlockingStylesheet({
  href,
  media = "all",
}: {
  href: string;
  /** Applied after the sheet finishes loading. */
  media?: string;
}) {
  const id = `nbs-${href.replace(/\W/g, "").slice(-28)}`;
  const escapedMedia = media.replace(/\\/g, "\\\\").replace(/"/g, '\\"');

  return (
    <>
      {/* No <noscript> fallback: React 19 hoists nested <link> out of noscript
          into <head>, which re-introduces a render-blocking stylesheet. */}
      <link rel="stylesheet" href={href} media="print" id={id} />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(){var e=document.getElementById("${id}");if(!e)return;var a=function(){e.media="${escapedMedia}"};if(e.sheet)a();else e.addEventListener("load",a);})();`,
        }}
      />
    </>
  );
}
