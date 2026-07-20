import { defineConfig, globalIgnores } from "eslint/config";
import nextVitals from "eslint-config-next/core-web-vitals";
import nextTs from "eslint-config-next/typescript";
import boundaries from "eslint-plugin-boundaries";

/**
 * Architecture enforcement (MODERN_FRONTEND_PLAN §Frontend architecture rules).
 * Layer graph: app → feature → shared → lib. features never import features.
 */
const boundariesConfig = {
  files: ["src/**/*.{ts,tsx}"],
  plugins: { boundaries },
  settings: {
    "boundaries/include": ["src/**/*"],
    "boundaries/elements": [
      { type: "app", pattern: "src/app/**" },
      { type: "feature", pattern: "src/features/*/**", capture: ["featureName"] },
      { type: "providers", pattern: "src/providers/**" },
      { type: "shared", pattern: "src/shared/**" },
      { type: "lib", pattern: "src/lib/**" },
      { type: "config", pattern: "src/config/**" },
      { type: "types", pattern: "src/types/**" },
    ],
  },
  rules: {
    "boundaries/element-types": [
      "error",
      {
        default: "disallow",
        rules: [
          {
            from: "app",
            allow: [
              "app",
              "feature",
              "providers",
              "shared",
              "lib",
              "config",
              "types",
            ],
          },
          {
            from: "providers",
            allow: ["providers", "feature", "shared", "lib", "config", "types"],
          },
          {
            from: "feature",
            allow: [
              ["feature", { featureName: "${from.featureName}" }],
              "shared",
              "lib",
              "config",
              "types",
            ],
          },
          { from: "shared", allow: ["shared", "lib", "config", "types"] },
          { from: "lib", allow: ["lib", "config", "types"] },
          { from: "config", allow: ["config", "types"] },
          { from: "types", allow: ["types"] },
        ],
      },
    ],
  },
};

const eslintConfig = defineConfig([
  ...nextVitals,
  ...nextTs,
  boundariesConfig,
  globalIgnores([".next/**", "out/**", "build/**", "next-env.d.ts"]),
]);

export default eslintConfig;
