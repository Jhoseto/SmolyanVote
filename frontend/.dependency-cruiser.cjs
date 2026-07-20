/** Dependency-cruiser — visualize/enforce layer boundaries (periodic audit). */
module.exports = {
  forbidden: [
    {
      name: "no-cross-feature",
      comment: "features/* must not import another features/* directly",
      severity: "error",
      from: { path: "^src/features/([^/]+)/" },
      to: {
        path: "^src/features/([^/]+)/",
        pathNot: [
          "^src/features/$1/",
          "^src/features/[^/]+/index\\.ts$",
        ],
      },
    },
    {
      name: "shared-no-features",
      comment: "shared/* is domain-agnostic",
      severity: "error",
      from: { path: "^src/shared/" },
      to: { path: "^src/features/" },
    },
    {
      name: "lib-no-features",
      comment: "lib/* is infrastructure only",
      severity: "error",
      from: { path: "^src/lib/" },
      to: { path: "^src/(features|shared)/" },
    },
  ],
  options: {
    doNotFollow: { path: "node_modules" },
    tsConfig: { fileName: "tsconfig.json" },
    tsPreCompilationDeps: true,
  },
};
