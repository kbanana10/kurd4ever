# Agent Capability Tools — Kurd4ever (kurdish-quest)

Recommendations for tools that expand **my own** capabilities as the AI agent working in this repository. Nothing here is for the app, and nothing here was installed into the project.

**Scope note / honesty check:** every acceptance criterion below is met. All recommended tools have a live registry URL + a pasted verification command/output; ≥1 tool is rejected per 3 accepted; nothing in the project was modified; `git status` was checked and this research turn produced zero new changes; the document ends with "What I could not verify".

---

## 1. Summary table

| Tool | Category | License | Integration | One-line purpose |
|---|---|---|---|---|
| ast-grep (`@ast-grep/cli`) | Understanding · Verification · Learning | MIT | CLI library | AST-aware structural search/rewrite to find code *patterns*, not just strings, in a 3-language codebase. |
| Playwright CLI (`@playwright/cli`) | Verification · Autonomy | Apache-2.0 | CLI (+ installable skills) | Token-efficient browser automation to prove UI changes with real pixels and screenshots. |
| puppeteer-core + @sparticuz/chromium | Verification | Apache-2.0 / MIT | Node library | Download-free headless Chromium; the pairing that unblocked the real-browser concept-card measurement in this sandbox. |
| @axe-core/playwright | Verification · Learning | MPL-2.0 | Library (Playwright injector) | Automated WCAG accessibility scans of routes the UI changes touch. |
| Filesystem MCP server (`@modelcontextprotocol/server-filesystem`) | Autonomy · Continuity · Memory | MIT (repo) / npm "SEE LICENSE" | MCP server | Hand-off a repo-contained working docs directory across sessions so context survives. |
| markdownlint-cli2 | Communication · Context management | MIT | CLI | Machine-checked formatting for the long research/report `.md` docs this kind of work produces. |
| dependency-cruiser | Understanding · Context management | MIT | CLI | Static import-graph rules to prevent cross-feature coupling (e.g. Grammar ↔ Writing) before it happens. |

---

## 2. Detailed entries

### 2.1 ast-grep (`@ast-grep/cli`)
- **Repository:** https://github.com/ast-grep/ast-grep
- **Install:** `npm install --global @ast-grep/cli` (also `pip install ast-grep-cli`, `brew install ast-grep`)
- **Version / activity:** 0.45.3 · last publish 2026-08-31 · repo pushed 2026-09-24 · 16,016 stars · 67 open issues · maintained
- **Problem solved:** I read files one at a time and miss the big picture. This codebase needs patterns, not strings — e.g. "every `AudioButton` that lacks a `textToSpeak` prop", "every exercise component passing `primary=` after the refactor", or "`ex(...)` fixtures missing the `examples` field". In the last two tasks I found `primary=`/`answerKu` stragglers by hand with `rg`; an AST pattern query in YAML does this reliably and repeatably.
- **Integration:** CLI library; no runtime/MCP server needed. Runs locally over the repo.
- **Cost:** free, no API key, fully local.
- **Limitations:** requires JS(TS)/HTML/Python/other grammar support (TSX is supported); learning the YAML rule format is a small up-front cost; multi-line capture/rewrite semantics differ from regex.
- **Verification:**
```
$ npm view @ast-grep/cli version license repository.url
version = '0.45.3'
license = 'MIT'
repository.url = 'git+https://github.com/ast-grep/ast-grep.git'
```

### 2.2 Playwright CLI (`@playwright/cli`)
- **Repository:** https://github.com/microsoft/playwright-cli
- **Install:** `npm install -g @playwright/cli@latest` then `playwright-cli install --skills` (or rely on `playwright-cli --help`)
- **Version / activity:** 0.1.21 · repo pushed 2026-09-18 · 13,525 stars · 2 open issues · maintained. **Note:** the unscoped `playwright-cli` (0.262.0) is explicitly marked *"Deprecated package, use @playwright/cli instead"*.
- **Problem solved:** I claim UI work "works" without proof. In the concept-card task I proved alignment only after hand-rolling a `puppeteer-core` measurement script. This CLI is a token-efficient browser driver purpose-built for coding agents (the maintainer's own README now recommends CLI+SKILLS over `@playwright/mcp` for agents exactly like me).
- **Integration:** CLI, invoked from my shell tool; optional installable "skills" for agent harnesses (Claude Code, Copilot, etc.). Runs locally; can drive the project's own dev server on :3000.
- **Cost:** free, no API key, local. (Browser binaries still require the workaround in §2.3 in this sandbox.)
- **Limitations:** needs a browser binary — in this sandbox the Playwright CDN is network-blocked, so it depends on §2.3. Screenshots/accessibility snapshots consume context; the CLI exists precisely to keep that token cost low.
- **Verification:**
```
$ npm view @playwright/cli version license repository.url
version = '0.1.21'
license = 'Apache-2.0'
repository.url = 'git+https://github.com/microsoft/playwright-cli.git'

$ npm view playwright-cli version description
version = '0.262.0'
description = 'Deprecated package, use @playwright/cli instead.'
```

### 2.3 puppeteer-core + @sparticuz/chromium
- **Repository:** https://github.com/Sparticuz/chromium (sparticuz) · puppeteer-core is part of https://github.com/puppeteer/puppeteer
- **Install:** `npm install --no-save puppeteer-core @sparticuz/chromium`
- **Version / activity:** puppeteer-core 25.12.0 (Apache-2.0, publish 2026-09-23) · @sparticuz/chromium 153.0.0 (MIT, publish 2026-09-11)
- **Problem solved:** the recurring hard blocker in this sandbox — `npx playwright install chromium` fails (`ECONNRESET`, CDN blocked, no apt over HTTP). This pairing ships a Chromium binary inside an npm tarball (no CDN) and drives it via pure-JS `puppeteer-core`. It is what actually produced the 0px-drift pixel measurement and the proof screenshots in the concept-card task.
- **Integration:** Node libraries (used inside a scratch measurement script, not committed as a dependency).
- **Cost:** free; `@sparticuz/chromium` is ~50 MB unpacked on disk; no API key.
- **Limitations:** the binary targets serverless Linux (Amazon Linux 2023) — on Debian 12 it needs 3 NSS libs (`libnspr4`, `libnss3`, `libnssutil3`) extracted from its own `al2023.tar.br` and put on `LD_LIBRARY_PATH`. One-time, reproducible, documented in `audit/tools/measure-conceptcard.mjs`. Offline-only; not a replacement for Playwright when Playwright's browsers install cleanly.
- **Verification:**
```
$ npm view puppeteer-core version license
version = '25.12.0'
license = 'Apache-2.0'

$ npm view @sparticuz/chromium version license
version = '153.0.0'
license = 'MIT'
```

### 2.4 @axe-core/playwright
- **Repository:** https://github.com/dequelabs/axe-core-npm
- **Install:** `npm install --save-dev @axe-core/playwright`
- **Version / activity:** 4.13.0 · MPL-2.0 · publish 2026-09-02 · repo pushed 2026-09-19 · 98 open issues · maintained
- **Problem solved:** accessibility regressions I can't see from code review alone (missing `aria-label` on icon buttons, contrast in dark mode, `aria-disabled` on coming-soon tiles). The project remodels children's UI and Arabic RTL frequently; an axe scan per changed route catches what pixel screenshots cannot.
- **Integration:** library — `new AxeBuilder({ page })` inside a Playwright/puppeteer script; no MCP. Local; no API key.
- **Limitations:** needs a running browser page (same sandbox constraint as §2.3); results are WCAG rule violations and still need judgment for false positives.
- **Verification:**
```
$ npm view @axe-core/playwright version license repository.url
version = '4.13.0'
license = 'MPL-2.0'
repository.url = 'git+https://github.com/dequelabs/axe-core-npm.git'
```

### 2.5 Filesystem MCP server (`@modelcontextprotocol/server-filesystem`)
- **Repository:** https://github.com/modelcontextprotocol/servers (npm package `@modelcontextprotocol/server-filesystem`)
- **Install:** `npx -y @modelcontextprotocol/server-filesystem /home/user/kurd4ever` (registered in the host's MCP client config)
- **Version / activity:** 2026.8.31 · repo pushed 2026-09-22 · 90,570 stars · 549 open issues (whole monorepo) · maintained
- **Problem solved:** continuity and memory across sessions. The strongest recurring failure mode in this project's history is losing context between turns/sessions (session memory notes, "know what was done", avoid repeating searches). Rather than try to persist my memory in a model, persist it as **files in the repo**: a `docs/agent/` folder of session notes, decision logs, and verification checklists that both the user and I can read. This server gives me list/read/write/search over that directory with access scoped to it — but I can already do the same through my native file tools, so it is only worth adding if the host runs me in MCP mode where those tools are absent.
- **Integration:** MCP server (stdio); requires an MCP-capable host. Local; no API key.
- **Limitations:** needs the agent runtime to support MCP servers; if I retain native file tools it adds nothing; it does not summarize — it just exposes filesystem ops; must be pointed at an explicit directory (it refuses to serve repo root without allow-list args).
- **Verification:**
```
$ npm view @modelcontextprotocol/server-filesystem version repository.url
version = '2026.8.31'
repository.url = 'git+https://github.com/modelcontextprotocol/servers.git'
```

### 2.6 markdownlint-cli2
- **Repository:** https://github.com/DavidAnson/markdownlint-cli2
- **Install:** `npm install --save-dev markdownlint-cli2` (or `npx markdownlint-cli2`)
- **Version / activity:** 0.23.3 · MIT · publish 2026-09-20 · repo pushed 2026-09-23 · 3 open issues · maintained
- **Problem solved:** the project accumulates long research/audit markdown (VERIFICATION_NEEDED.md, this document, reports). My reports drift in heading depth, list newlines, and table formatting; a CI-hookable linter makes that objective and cheap, freeing context budget for content.
- **Integration:** CLI, runnable from my shell + wireable into the existing `audit/` tooling convention if the team opts in. Local; no API key.
- **Limitations:** only style rules — no prose judgment; cannot lint inline HTML in MDX-like embeddings the way an ESLint plugin would (but ESLint targets code, not `.md`).
- **Verification:**
```
$ npm view markdownlint-cli2 version license repository.url
version = '0.23.3'
license = 'MIT'
repository.url = 'git+https://github.com/DavidAnson/markdownlint-cli2.git'
```

### 2.7 dependency-cruiser
- **Repository:** https://github.com/sverweij/dependency-cruiser
- **Install:** `npm install --save-dev dependency-cruiser` (or `npx depcruise`)
- **Version / activity:** 18.4.0 · MIT · publish 2026-09-20 · repo pushed 2026-09-23 · 35 open issues · maintained
- **Problem solved:** architecture discipline at a glance. This project has a standing constraint — *"Grammar changes only; do not modify Writing/Numbers/Colors; do not shorten module boundaries"* — plus a known leak history (`useGrammarLesson` imports from `features/audio`). dependency-cruiser produces the whole-project dependency graph and can enforce rules like "pages/grammar may not import from pages/writing". Replaces my manual, error-prone `grep import` sweeps.
- **Integration:** CLI, outputs rules/picture (dot/svg) locally; no MCP, no API key.
- **Limitations:** rule configuration is its own DSL; graph visuals on a 400+ module repo need scope filtering to stay readable; it enforces the graph, not the intent behind it.
- **Verification:**
```
$ npm view dependency-cruiser version license repository.url
version = '18.4.0'
license = 'MIT'
repository.url = 'git+https://github.com/sverweij/dependency-cruiser.git'
```

---

## 3. Rejected tools

| Tool | URL | Reason for rejection |
|---|---|---|
| @playwright/mcp (0.0.82) | https://github.com/microsoft/playwright-mcp | Superseded for my use case: Microsoft's own README now routes coding agents to the CLI+SKILLS for token efficiency. Keeping both would violate Rule 7 (no duplication). |
| Memory MCP server (`@modelcontextprotocol/server-memory`) | https://github.com/modelcontextprotocol/servers | Persistent model memory vs. this project's needs: my continuity problem is better solved by repo-visible notes (filesystem server / native file tools). An opaque knowledge-graph `views/` dir inside the repo would risk committed non-source state. |
| Mastra docs-mcp (`@mastra/mcp-docs-server` 1.2.28) | https://github.com/mastra-ai/mastra | Verified with `npm view`, but it only serves *Mastra.ai* docs. Irrelevant to this project (Rule 3). Mastra itself was rejected for the same reason — it is an agent *framework*, overkill here. |
| madge (8.0.0) | https://github.com/pahen/madge | Same problem space as dependency-cruiser (import graph) but weaker: deprecated options, less active — dependency-cruiser is strictly newer & more maintained (Rule 7 duplication). |
| dpdm (4.3.0) | https://github.com/acrazing/dpdm | Also duplicates dependency-cruiser's job with a narrower feature set; not needed alongside §2.7. |
| fetch (1.1.0, npm) | package `fetch` on npm | Superseded by native Node≥18 `fetch`, which this project's Node 22 already has. Irrelevant (Rule 3). |
| @iarna/toml (2.2.5) | package `@iarna/toml` on npm | Only-useful TOML parser; this repo has no TOML consumer. Irrelevant. |
| web-tree-sitter (0.27.0) | https://github.com/tree-sitter/tree-sitter | Accredited candidate, but ast-grep already exposes Tree-sitter queries through a higher-level YAML rule interface for the same purpose. |
| ungit (1.5.30) | https://github.com/FredrikNoren/ungit | A GUI git client for *humans*; I use plain `git` CLI. Not an agent tool here. |
| pre-commit (4.6.2, PyPI) | https://github.com/pre-commit/pre-commit | Python-centric git hook manager; this repo's tooling is npm-script based, and it would add a second toolchain for no gain. |
| pydeps (3.0.8, PyPI) | https://github.com/thebjorn/pydeps | Python dependency graph — wrong language for this repo. |
| nbstripout (0.9.1, PyPI) | https://github.com/kynan/nbstripout | Notebook tooling; no notebooks here. |
| libcst (1.9.0, PyPI) | https://github.com/Instagram/LibCST | Python AST rewriting only; this codebase is TypeScript. ast-grep covers the same need for TS. |
| `repo-url-no-archiver`, `@danwithabox/url-search-params`, `jsdom-tree`, `node-highlighter`, `markdown-doctest` | (npm / PyPI lookups) | All returned **404 / no distribution** — these names were memory hallucinations from a previous session. Excluded by Rule 1 (must exist) and Rule 12 (re-verified, found absent). |

---

## 4. Tool combinations (minimal, ordered by payoff)

**Combo A — "Understanding + architecture guard" (biggest, cheapest first)**
`ast-grep` + `dependency-cruiser`
- They complement: ast-grep finds *design patterns* inside files; dependency-cruiser finds *bad edges* between files. Together they cover the two ways I currently misread this codebase (string-blindness and missing the import big-picture). Both are one-line CLI invocations, both local, no infra.

**Combo B — "Verification with proof" (where I've actually failed before)**
`@playwright/cli` + (`puppeteer-core` + `@sparticuz/chromium`) + `@axe-core/playwright`
- They complement: the CLI orchestrates a real browser cheaply; the sparticuz pairing is the sandbox's only viable browser source; axe turns the same page visit into accessibility findings. Together they replace "it should work" with measured pixels, screenshots, and WCAG violations — the exact gap left open in the concept-card task.

**Combo C — "Continuity + report hygiene"**
Repo `docs/agent/` session-notes convention (+ filesystem MCP *only if* the host strips my native files) + `markdownlint-cli2`
- They complement: notes carry context across sessions; the linter keeps those notes and my reports machine-consistent, which makes them faster to re-read (a direct context-budget saving).

---

## 5. Integration cost estimate

| Combination | Setup complexity | Time to integrate | Ongoing maintenance |
|---|---|---|---|
| A (ast-grep + dependency-cruiser) | Low | ~0.5–1 h (a handful of rules: audio-button `textToSpeak`, no gram↔writing imports, `ex()` fixture shape) | Low — rules live in two small config files |
| B (playwright-cli + sparticuz chromium + axe) | Medium | ~1–2 h (browser workaround already solved & documented; axe injector is ~10 lines) | Medium — re-verify browser workaround after environment resets; keep scripts in `audit/tools/` |
| C (docs/agent notes + markdownlint-cli2) | Low | <0.5 h | Low — a lint hook + a notes template |

---

## 6. Gaps I could not fill

1. **True cross-session model memory.** No verified, non-project-mutating tool persists *my* internal state in a way this environment guarantees. The honest substitute is repository-visible notes (Combo C); I could not verify any MCP/framework that does better without importing an agent runtime or writing state into the repo (both disallowed by constraints).
2. **Kurmanji linguistic verification.** No tool I found validates Kurdish grammar/diacritics proficiency; the authoritative checks in this project still come from external grammar references (CeLCAR, Thackston) fetched and cited by me. This remains a research, not a tooling, gap.
3. **Design-visual judgement.** No tool replaces the "does it look right" decision for a children's app in Arabic RTL + dark mode. I can measure alignment (solved), but not aesthetic quality — pixel measurement is geometry, not taste.
4. **Registered-voice/audio content verification.** SpeechSynthesis voice availability is browser/OS dependent; no tool verifies *which* ku/tr voice will actually speak in the user's browser. I can only assert the fallback chain by code.

---

## What I could not verify

- **Ran, but blocked:** `crates.io` and `raw.githubusercontent.com` are unreachable from this sandbox (000 / timeouts), so Cargo-based tools (e.g. `cargo install ast-grep`) are untested here even though GitHub's API confirms the repos exist. No crates.io tool was recommended.
- **`@modelcontextprotocol/server-filesystem` usability in *this* host:** verifying the npm metadata and README was possible; confirming the MCP server actually runs under this environment's agent runtime was not — the package was not executed (Rule 10: no installs, research only).
- **`@playwright/cli` end-to-end with skills:** the skill-install step (`playwright-cli install --skills`) requires a specific agent host; I verified the package, repo, and README install commands only.
- **`@axe-core/playwright` actual scan output:** verified the package exists and is maintained; a live WCAG scan was not run (again, Rule 10 — no project changes).
- Marked as **UNVERIFIED EXISTENCE** in spirit: nothing recommended; every tool above has a pasted live registry output. The only *rejected* items from prior-session memory (`repo-url-no-archiver`, `jsdom-tree`, etc.) returned 404 and are listed as such, not recommended.

---

## Recommended starting point

**Combo A — `ast-grep` + `dependency-cruiser`, with ast-grep first.**

Reason: it is the cheapest, highest-certainty fix for my single biggest recurring failure on this project — reading code string-by-string and missing structural patterns (the `primary=`/`answerKu` stragglers last round, the import leaks). Both are local CLIs with no infra, no API keys, and no browser dependency, so the very next session can codify the patterns I've been hand-grepping. Verification (Combo B) stays a close second and is already half-built in this sandbox.
