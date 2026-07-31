/** Docker health probe — no shell escaping, no curl required. */
import http from "node:http";

const port = process.env.PORT || "3099";

http
  .get(`http://127.0.0.1:${port}/health`, (res) => {
    process.exit(res.statusCode === 200 ? 0 : 1);
  })
  .on("error", () => process.exit(1));
