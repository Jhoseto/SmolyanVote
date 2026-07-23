import type { Metadata } from "next";
import { CreateEventShell, CreateSimpleEventForm } from "@/features/events";

export const metadata: Metadata = {
  title: "Ново опростено събитие",
  description:
    "Създайте опростено гласуване със ЗА, ПРОТИВ и неутрален етикет. Измерете гражданското мнение в Смолянска област.",
  alternates: { canonical: "/event/new" },
};

export default function NewSimpleEventPage() {
  return (
    <CreateEventShell type="simple">
      <CreateSimpleEventForm />
    </CreateEventShell>
  );
}
