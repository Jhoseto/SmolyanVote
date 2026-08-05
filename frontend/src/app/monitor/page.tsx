import { Suspense } from "react";
import { MonitorHomePage } from "@/features/monitor";
import { MonitorSeoIntro } from "@/lib/seo/components/MonitorSeoIntro";
import { buildMonitorTabMetadata, getMonitorTabSeo } from "@/lib/seo/monitorTabSeo";

const tab = getMonitorTabSeo("/monitor")!;

export const metadata = buildMonitorTabMetadata(tab);

export default function MonitorPage() {
  return (
    <>
      <MonitorSeoIntro title={tab.title} answerFirst={tab.answerFirst} />
      <Suspense>
        <MonitorHomePage />
      </Suspense>
    </>
  );
}
