"use client";

import { createContext, useCallback, useContext, useEffect, useMemo, useState } from "react";
import { usePathname, useRouter, useSearchParams } from "next/navigation";
import { monitorApi } from "../api";
import type { MonitorMunicipality } from "../types";

/** Kept in the URL so a filtered view can be shared, bookmarked and reloaded. */
export const MONITOR_AUTHORITY_PARAM = "authority";

export const MONITOR_OBLAST_LABEL = "Област Смолян";

interface MonitorAuthorityValue {
  /** EIK of the selected municipality, or null for the whole oblast. */
  authority: string | null;
  municipality: MonitorMunicipality | null;
  municipalities: MonitorMunicipality[];
  label: string;
  /**
   * Whether council decisions, consultations and deadlines are collected for the selection.
   * Only Община Смолян has a scraped source, so the other municipalities show an
   * explanation instead of Smolyan's paperwork.
   */
  hasScrapedDocuments: boolean;
  setAuthority: (eik: string | null) => void;
  /** Adds the current selection to an internal link so tabs keep the filter. */
  withAuthority: (href: string) => string;
}

const FALLBACK: MonitorAuthorityValue = {
  authority: null,
  municipality: null,
  municipalities: [],
  label: MONITOR_OBLAST_LABEL,
  hasScrapedDocuments: true,
  setAuthority: () => {},
  withAuthority: (href) => href,
};

const MonitorAuthorityContext = createContext<MonitorAuthorityValue | null>(null);

export function MonitorAuthorityProvider({ children }: { children: React.ReactNode }) {
  const searchParams = useSearchParams();
  const pathname = usePathname();
  const router = useRouter();
  const [municipalities, setMunicipalities] = useState<MonitorMunicipality[]>([]);

  useEffect(() => {
    let cancelled = false;
    monitorApi
      .municipalities()
      .then((list) => {
        if (!cancelled) setMunicipalities(list);
      })
      .catch(() => {
        // Without the list the filter simply stays on the whole oblast.
      });
    return () => {
      cancelled = true;
    };
  }, []);

  const raw = searchParams.get(MONITOR_AUTHORITY_PARAM)?.trim();
  const authority = raw ? raw : null;
  const municipality = municipalities.find((m) => m.eik === authority) ?? null;
  const unknownAuthority = authority !== null && municipalities.length > 0 && municipality === null;
  const currentQuery = searchParams.toString();

  const navigate = useCallback(
    (params: URLSearchParams) => {
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
    },
    [pathname, router],
  );

  // A stale or hand-edited EIK widens the view to the oblast, so drop it from the URL
  // instead of leaving an address that no longer describes what is on screen.
  useEffect(() => {
    if (!unknownAuthority) return;
    const params = new URLSearchParams(currentQuery);
    params.delete(MONITOR_AUTHORITY_PARAM);
    navigate(params);
  }, [unknownAuthority, currentQuery, navigate]);

  const value = useMemo<MonitorAuthorityValue>(() => {
    const setAuthority = (eik: string | null) => {
      const params = new URLSearchParams(currentQuery);
      if (eik) {
        params.set(MONITOR_AUTHORITY_PARAM, eik);
      } else {
        params.delete(MONITOR_AUTHORITY_PARAM);
      }
      navigate(params);
    };

    const withAuthority = (href: string) => {
      if (!authority) return href;
      const [path, existing] = href.split("?");
      const params = new URLSearchParams(existing);
      params.set(MONITOR_AUTHORITY_PARAM, authority);
      return `${path}?${params.toString()}`;
    };

    return {
      authority: unknownAuthority ? null : authority,
      municipality,
      municipalities,
      label: municipality?.name ?? MONITOR_OBLAST_LABEL,
      // While the list is still loading an unrecognised EIK is assumed valid, so the
      // "no data for this municipality" notice never flashes on Смолян.
      hasScrapedDocuments: !authority || (municipality ? municipality.hasScrapedDocuments : true),
      setAuthority,
      withAuthority,
    };
  }, [authority, unknownAuthority, municipality, municipalities, currentQuery, navigate]);

  return (
    <MonitorAuthorityContext.Provider value={value}>{children}</MonitorAuthorityContext.Provider>
  );
}

/**
 * Reads the municipality filter. Outside the provider it degrades to the oblast view, so
 * monitor components can also be embedded elsewhere.
 */
export function useMonitorAuthority(): MonitorAuthorityValue {
  return useContext(MonitorAuthorityContext) ?? FALLBACK;
}
