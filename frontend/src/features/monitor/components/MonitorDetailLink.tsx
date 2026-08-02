"use client";

import Link from "next/link";
import type { ComponentProps } from "react";

/** Open monitor entity pages (contract / document / company) in a new tab. */
export const monitorDetailTabProps = {
  target: "_blank" as const,
  rel: "noopener noreferrer" as const,
};

type MonitorDetailLinkProps = ComponentProps<typeof Link>;

export function MonitorDetailLink({ target, rel, ...props }: MonitorDetailLinkProps) {
  return <Link {...monitorDetailTabProps} target={target} rel={rel} {...props} />;
}

export function openMonitorDetail(href: string) {
  window.open(href, "_blank", "noopener,noreferrer");
}
