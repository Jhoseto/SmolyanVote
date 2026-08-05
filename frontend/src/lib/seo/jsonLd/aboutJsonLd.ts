const SITE = "https://smolyanvote.com";

export function buildAboutPageJsonLd() {
  return {
    "@context": "https://schema.org",
    "@type": "AboutPage",
    name: "За SmolyanVote",
    url: `${SITE}/about`,
    description:
      "SmolyanVote е независима платформа за гражданско участие в Смолян — гласувания, сигнали, публикации и монитор на общинските разходи.",
    inLanguage: "bg-BG",
    mainEntity: {
      "@type": "Organization",
      name: "SmolyanVote",
      url: SITE,
      areaServed: {
        "@type": "Place",
        name: "Смолян",
        address: {
          "@type": "PostalAddress",
          addressLocality: "Смолян",
          addressRegion: "Област Смолян",
          addressCountry: "BG",
        },
      },
    },
  };
}
