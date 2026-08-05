import { MonitorAnomaliesPage } from "@/features/monitor";
import { MonitorSeoIntro } from "@/lib/seo/components/MonitorSeoIntro";
import { buildMonitorTabMetadata, getMonitorTabSeo } from "@/lib/seo/monitorTabSeo";

const tab = getMonitorTabSeo("/monitor/anomalies")!;

export const metadata = buildMonitorTabMetadata(tab);

export default function Page() {
  return (
    <>
      <MonitorSeoIntro title={tab.title} answerFirst={tab.answerFirst} />
      <MonitorAnomaliesPage />
    </>
  );
}
