import { FaqPage } from "@/features/faq";
import { JsonLd } from "@/lib/seo/components/JsonLd";
import { buildFaqJsonLd } from "@/lib/seo/jsonLd/faqJsonLd";
import { buildListingMetadata } from "@/lib/seo/buildSocialMetadata";

export const metadata = buildListingMetadata({
  title: "Често задавани въпроси",
  description:
    "Отговори на най-често задаваните въпроси за SmolyanVote — платформата за гражданско участие в Смолян.",
  path: "/faq",
});

export default function Faq() {
  return (
    <>
      <JsonLd data={buildFaqJsonLd()} />
      <FaqPage />
    </>
  );
}
