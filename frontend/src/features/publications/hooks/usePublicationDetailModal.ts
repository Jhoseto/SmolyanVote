"use client";

import { parseAsInteger, parseAsStringLiteral, useQueryStates } from "nuqs";

const focusParser = parseAsStringLiteral(["comments"] as const);

/**
 * `?openModal={id}` deep-link + optional `?focus=comments`.
 * Independent from `usePublicationsFilters`.
 */
export function usePublicationDetailModal() {
  const [state, setState] = useQueryStates({
    openModal: parseAsInteger,
    focus: focusParser,
  });

  return {
    openId: state.openModal,
    focusComments: state.focus === "comments",
    open: (id: number, opts?: { focusComments?: boolean }) =>
      void setState({
        openModal: id,
        focus: opts?.focusComments ? "comments" : null,
      }),
    close: () => void setState({ openModal: null, focus: null }),
  };
}
