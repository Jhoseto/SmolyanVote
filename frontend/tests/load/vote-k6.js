/**
 * Optional k6 load script for vote endpoints (MODERN_FRONTEND_PLAN §Testing Strategy).
 *
 * Usage:
 *   k6 run -e BASE_URL=http://localhost:2662 -e ACCESS_TOKEN=... -e EVENT_ID=1 frontend/tests/load/vote-k6.js
 *
 * Requires a pre-issued JWT (Bearer) and a simple-event id the user has not voted on
 * (or rely on Idempotency-Key replay after first success).
 */
import http from "k6/http";
import { check, sleep } from "k6";
import { uuidv4 } from "https://jslib.k6.io/k6-utils/1.4.0/index.js";

export const options = {
  vus: 5,
  duration: "30s",
  thresholds: {
    http_req_failed: ["rate<0.1"],
    http_req_duration: ["p(95)<2000"],
  },
};

const BASE = __ENV.BASE_URL || "http://localhost:2662";
const TOKEN = __ENV.ACCESS_TOKEN || "";
const EVENT_ID = Number(__ENV.EVENT_ID || "1");

export default function () {
  if (!TOKEN) {
    throw new Error("ACCESS_TOKEN env required");
  }

  const key = uuidv4();
  const res = http.post(
    `${BASE}/api/v1/votes/simple`,
    JSON.stringify({ eventId: EVENT_ID, vote: "1" }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "Idempotency-Key": key,
      },
    },
  );

  check(res, {
    "status is 200 or 409": (r) => r.status === 200 || r.status === 409,
  });

  // Replay same key — should return 200 with cached ack when first was success
  const replay = http.post(
    `${BASE}/api/v1/votes/simple`,
    JSON.stringify({ eventId: EVENT_ID, vote: "1" }),
    {
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${TOKEN}`,
        "Idempotency-Key": key,
      },
    },
  );
  check(replay, {
    "idempotent replay ok or conflict": (r) => r.status === 200 || r.status === 409,
  });

  sleep(1);
}
