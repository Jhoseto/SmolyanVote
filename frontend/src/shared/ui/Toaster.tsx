"use client";

import { Toaster as SonnerToaster } from "sonner";
import { toastClassNames } from "@/shared/lib/toastPresentation";

/**
 * Single global toast host (Sonner). Mounted once in `AppProviders`.
 * Premium glass cards — styling in `globals.css` + `toastPresentation.tsx`.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      offset={18}
      gap={14}
      visibleToasts={4}
      expand={false}
      richColors={false}
      closeButton
      style={{ zIndex: 1200 }}
      toastOptions={{
        duration: 4500,
        classNames: toastClassNames,
      }}
    />
  );
}
