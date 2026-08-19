import tseslint from "typescript-eslint";
import antiSlop from "./tools/oxlint/anti-slop/index.mjs";

/**
 * Kurdish Quest — anti-slop enforcement via ESLint.
 *
 * The anti-slop rules (https://github.com/dmmulroy/anti-slop, MIT) are
 * VENDORED at tools/oxlint/anti-slop (TypeScript sources = the editable
 * truth; index.mjs is the esbuild bundle ESLint loads — rebuild with
 * `npm run build:antislop` after editing rules).
 *
 * Why ESLint and not Oxlint's JS-plugin runtime: upstream targets Oxlint,
 * and `oxlint.config.mjs` keeps that registration for environments where
 * the native plugin runtime works. In constrained sandboxes/containers the
 * runtime's fixed-size allocator cannot reserve its memory pool and
 * aborts, so the ENFORCED lane (npm script + CI) runs the same rules
 * through `eslintCompatPlugin`'s ESLint-compatible `create` methods —
 * identical rule behavior, runs everywhere. This also finally gives the
 * previously configless eslint dependency a job (audit F008).
 */
export default [
  {
    ignores: [
      "dist/**",
      // Storybook build output: minified vendor bundles carrying foreign
      // eslint directives — never a lint target (rebuildable artifact).
      "storybook-static/**",
      "node_modules/**",
      "android/**",
      "app/**",
      "public/**",
      "scripts/**",
      "services/**",
      // Vendored plugin is linted upstream, not by itself.
      "tools/**",
      // Test harness: module-mocks browser-only seams (audio element pool,
      // firebase SDK) — replacing those with dependency seams is tracked
      // separately; anti-slop governs product code first.
      "audit/**",
    ],
  },
  {
    files: ["src/**/*.{ts,tsx}", "server.ts"],
    languageOptions: {
      parser: tseslint.parser,
      parserOptions: { ecmaFeatures: { jsx: true } },
    },
    plugins: { "anti-slop": antiSlop },
    rules: {
      // ── Errors: violations fail the build ────────────────────────────
      "anti-slop/no-chained-type-assertions": "error",
      "anti-slop/no-conditional-empty-object-spread": "error",
      "anti-slop/no-module-mocking": "error",
      "anti-slop/no-object-parameters": "error",
      "anti-slop/no-reflect-apply": "error",
      "anti-slop/no-reflect-get": "error",
      "anti-slop/no-shape-in-symbol-names": "error",
      "anti-slop/no-unknown-parameters": "error",
      "anti-slop/no-unknown-returns": "error",
      "anti-slop/no-unknown-type-aliases": "error",
      "anti-slop/no-unsafe-dictionary-type": "error",
      "anti-slop/no-widen-then-assert": "error",

      // ── Documented project divergences ───────────────────────────────
      // 35 pre-existing lookup tables use the `const m: Record<string, T>`
      // idiom with dynamic-string keys (icon maps, category maps). The
      // `satisfies` conversion breaks dynamic indexing under strict TS, so
      // the migration needs a typed-lookup helper — tracked as a burn-down
      // (TODO.md); new code should preserve key inference.
      "anti-slop/no-known-value-widening": "warn",
      // A browser PWA legitimately probes its environment
      // (`typeof window !== "undefined"`, speechSynthesis feature checks).
      // Type-guard usage is allowed; remaining ad hoc checks surface as
      // warnings while the F023 burn-down converts them to boundaries.
      "anti-slop/no-runtime-typeof": ["warn", { allowInTypeGuards: true }],
      // 30+ legacy assertion sites predate this rule (audit F023). New
      // assertions should carry the safety comment; existing debt warns
      // instead of blocking the pipeline.
      "anti-slop/require-safety-comment-for-type-assertion": "warn",
    },
  },
];
