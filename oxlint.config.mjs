import { defineConfig } from "oxlint";

/**
 * Kurdish Quest lint configuration — Oxlint + vendored anti-slop plugin.
 *
 * anti-slop (https://github.com/dmmulroy/anti-slop, MIT) is VENDORED at
 * tools/oxlint/anti-slop per its own guidance: the rules are ours to tune.
 * Project-specific divergences from the upstream defaults are documented
 * inline below — every softened rule has a reason and a burn-down owner
 * (see TODO.md).
 */
export default defineConfig({
  ignorePatterns: [
    "dist/**",
    "android/**",
    "app/**",
    "scripts/**",
    "services/**",
    "public/**",
    // Vendored plugin lints itself upstream; excluded here by convention.
    "tools/oxlint/anti-slop/**",
    // Test harness: mocks browser-only seams (audio, firebase SDK) — see
    // the no-module-mocking note below.
    "audit/**",
  ],
  jsPlugins: [
    { name: "anti-slop", specifier: "./tools/oxlint/anti-slop/index.mjs" },
  ],
  rules: {
    // ── Enforced as errors (clean today, stays clean) ────────────────────
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
    "anti-slop/no-known-value-widening": "error",

    // ── Project divergences (documented, deliberate) ─────────────────────
    // A browser PWA legitimately probes its environment
    // (`typeof window !== "undefined"`, feature detection for
    // speechSynthesis/AudioContext). We allow typeof inside type guards and
    // keep the rest at "warn" while ad hoc checks are burned down.
    "anti-slop/no-runtime-typeof": ["warn", { allowInTypeGuards: true }],
    // 30+ legacy assertion sites predate this rule (audit F023 tracks the
    // burn-down). New code should write the safety comment; existing debt
    // surfaces as warnings, not a broken build.
    "anti-slop/require-safety-comment-for-type-assertion": "warn",
  },
});
