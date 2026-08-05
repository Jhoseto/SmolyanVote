import type { Metadata } from "next";
import { CreateEventShell, CreateReferendumForm } from "@/features/events";
import { NOINDEX_ROBOTS } from "@/lib/seo/buildSocialMetadata";

export const metadata: Metadata = {
  title: "Нов референдум",
  description:
    "Създайте граждански референдум с до 10 опции и един избор. Представете важни обществени въпроси пред общността.",
  alternates: { canonical: "/referendum/new" },
  robots: NOINDEX_ROBOTS,
};

export default function NewReferendumPage() {
  return (
    <CreateEventShell type="referendum">
      <CreateReferendumForm />
    </CreateEventShell>
  );
}
