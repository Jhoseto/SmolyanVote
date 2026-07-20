import type { BackendEventType } from "../types";

const DETAIL_PATH: Record<BackendEventType, string> = {
  SIMPLEEVENT: "event",
  REFERENDUM: "referendum",
  MULTI_POLL: "multipoll",
};

/** Native Next.js detail route for the 3 event types (`/event/:id`, `/referendum/:id`, `/multipoll/:id`). */
export function eventDetailUrl(eventType: BackendEventType, id: number): string {
  return `/${DETAIL_PATH[eventType]}/${id}`;
}

export const EVENT_TYPE_LABEL: Record<BackendEventType, string> = {
  SIMPLEEVENT: "Събитие",
  REFERENDUM: "Референдум",
  MULTI_POLL: "Анкета",
};

export const EVENT_TYPE_ICON: Record<BackendEventType, string> = {
  SIMPLEEVENT: "bi-calendar-event",
  REFERENDUM: "bi-check2-square",
  MULTI_POLL: "bi-bar-chart-steps",
};
