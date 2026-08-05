import { AboutHero, AboutSections } from "@/features/about";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { AnswerFirstBlock } from "@/lib/seo/components/AnswerFirstBlock";
import { buildAboutPageJsonLd } from "@/lib/seo/jsonLd/aboutJsonLd";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";

export const metadata = buildListingMetadata({
  title: "Философия - SmolyanVote | Платформа за гражданско участие в Смолян",
  description:
    "Философията на SmolyanVote — платформа за гражданско участие в Смолян. Мисия, визия и цели за по-активна местна демокрация.",
  path: "/about",
});

export default function AboutPage() {
  return (
    <>
      <JsonLd data={buildAboutPageJsonLd()} />
      <div className="sr-only">
        <AnswerFirstBlock>
          SmolyanVote е независима гражданска платформа за участие, прозрачност и общност в Смолян — без
          официален статут на държавен орган.
        </AnswerFirstBlock>
      </div>
      <AboutHero />
      <AboutSections />
    </>
  );
}
