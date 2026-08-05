/**
 * Hero shell layout inlined in <head> — must NOT depend on Tailwind.
 * Until the ~31 KB globals chunk loads, Tailwind utilities such as
 * `min-h-[85vh]`, `absolute`, and `md:hidden` are inert, so the LCP
 * `<img>` can finish downloading yet not paint for >1 s (Lighthouse
 * "element render delay"). These few rules guarantee a sized, visible
 * hero on first paint for both viewports.
 */
export const HERO_CRITICAL_CSS = `
.sv-hero-shell{position:relative;min-height:85vh;overflow:hidden;display:flex;align-items:center}
.sv-hero-bg{position:absolute;inset:0}
.sv-hero-bg img{width:100%;height:100%;object-fit:cover;object-position:center top;display:block}
@media(max-width:767px){.sv-hero-bg--desktop{display:none!important}}
@media(min-width:768px){.sv-hero-bg--mobile{display:none!important}}
.sv-hero-title{font-family:Manrope,system-ui,sans-serif;font-weight:500;line-height:1;letter-spacing:-0.02em;font-size:clamp(2.6rem,6.5vw,4.5rem);background:linear-gradient(135deg,#19861c 0%,#48a24c 100%);-webkit-background-clip:text;background-clip:text;-webkit-text-fill-color:transparent;color:transparent}
`.trim();
