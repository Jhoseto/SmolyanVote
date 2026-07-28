"use client";

import { Toaster as SonnerToaster } from "sonner";
import { toastClassNames } from "@/shared/lib/toastPresentation";

/**
 * Single global toast host (Sonner). Mounted once in `AppProviders`.
 */
export function Toaster() {
  return (
    <SonnerToaster
      position="top-right"
      offset={{ top: 20, right: 20, left: 20 }}
      gap={10}
      visibleToasts={4}
      expand={false}
      richColors={false}
      closeButton
      swipeToClose
      style={{ zIndex: 1200 }}
      toastOptions={{
        duration: 4800,
        classNames: toastClassNames,
      }}
    />
  );
}
