import type { Metadata } from "next";
import { CreateEventShell, CreateSimpleEventForm } from "@/features/events";
import { NOINDEX_ROBOTS } from "@/lib/seo/buildSocialMetadata";

export const metadata: Metadata = {
  title: "Ново опростено събитие",
  description:
    "Създайте опростено гласуване със ЗА, ПРОТИВ и неутрален етикет. Измерете гражданското мнение в Смолянска област.",
  alternates: { canonical: "/event/new" },
  robots: NOINDEX_ROBOTS,
};

export default function NewSimpleEventPage() {
  return (
    <CreateEventShell type="simple">
      <CreateSimpleEventForm />
    </CreateEventShell>
  );
}
