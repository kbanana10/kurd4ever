# Agent Capability Tools — Pass 2 (Memory · Mistake-Learning · Design · Research)

Second research pass. Scope is limited to four areas; the seven tools from pass 1 (ast-grep, @playwright/cli, puppeteer-core + @sparticuz/chromium, @axe-core/playwright, filesystem MCP, markdownlint-cli2, dependency-cruiser) are **not** repeated here.

Every entry has a live URL, an install command, a version, and a pasted verification output. No project files were modified (`git status` unchanged during this turn; only `docs/agent-capability-tools.md` from pass 1 exists). Rejected tools outnumber accepted across the document.

---

## 1. Summary table

| Tool | Category | License | Integration | One-line purpose |
|---|---|---|---|---|
| Basic Memory (`basic-memory` PyPI) | Memory · Learning | AGPL-3.0 | MCP server (local, Python) | Local-first knowledge graph + Markdown notes; AI and human write to the same files, so decisions/constraints survive sessions. |
| Repomix (`repomix` npm) | Memory · Understanding | MIT | CLI | Packs a whole repo (respecting `.gitignore`) into one context file so a new session regains the big picture in one read. |
| ADR CLI (`adr` npm) | Memory · Learning | MIT | CLI | Versioned "architecture decision records" — a `git`-friendly decision log the project can keep, and a constraint hook for me. |
| mem0 (`mem0ai` PyPI / npm) | Memory · Learning | Apache-2.0 | Library/HTTP/MCP | Cross-session agent memory (facts/facts + vector search) with pluggable backends; opt-in API-key path. |
| Chromatic CLI (`chromatic` npm) | Design (UI validation) | MIT (CLI) | CLI, Storybook-hosted | Visual regression by fingerprinting Storybook stories per commit — this project already runs Storybook. |
| Context7 (`@upstash/context7-mcp` npm) | Research (anti-hallucination) | MIT | MCP server or `ctx7` CLI | Pulls up-to-date, version-pinned docs for libraries into the prompt, replacing stale training-data APIs. |
| MarkItDown (`markitdown` + `markitdown-mcp` PyPI) | Research | MIT | CLI/library (+ optional MCP) | Converts doc/PDF/xlsx/docs into Markdown for citation-checking and factual grounding. |
| Style Dictionary (`style-dictionary` npm) | Design (tokens→code) | Apache-2.0 | CLI library | Single source of truth for design tokens → Tailwind-compatible CSS/JSON, sealing the "Warm Heritage" system. |
| FigmaContextMCP (`figma-developer-mcp` npm) | Design (Figma→code) | MIT | MCP server | Exposes Figma layout/variable metadata for design-to-code against real frames. |

---

## 2. Detailed entries

### 2.1 Basic Memory — `basic-memory`
- **Repository:** https://github.com/basicmachines-co/basic-memory
- **Install:** `pip install basic-memory` (Python ≥ 3.12), then register the MCP server (`mcp-server` config → command `basic-memory`, working dir scoped to a notes folder)
- **Version / activity:** PyPI 0.23.2 · repo pushed 2026-09-24 · 4,032 stars · 74 open issues · AGPL-3.0-or-later
- **Problem solved:** *Memory — I forget between sessions.* This project repeatedly loses context between sessions (session-memory notes carry it today). Basic Memory stores knowledge as Markdown files the user **and** the agent both read/write, with semantic search and wikilinks; because the files live outside the repo's source tree, memory no longer has to mutate the repo.
- **Integration:** MCP server, local-first (SQLite/plain files); works from Claude/Codex/Cursor/anything MCP.
- **Cost:** free OSS locally; an optional paid cloud tier exists (`basicmemory.com`, $15/mo). No API key required for local use.
- **Limitations:** needs Python ≥3.12 (this sandbox has 3.11 — check before use); MCP-hosted only, so it depends on the agent runtime exposing MCP; AGPL affects re-distribution, not usage.
- **Verification:**
```
$ curl -s https://pypi.org/pypi/basic-memory/json | jq -r '"version: \(.info.version) | license: \(.info.license) | requires_python: \(.info.requires_python)"'
version: 0.23.2 | license: AGPL-3.0-or-later | requires_python: >=3.12
```

### 2.2 Repomix — `repomix`
- **Repository:** https://github.com/yamadashy/repomix
- **Install:** `npm install -g repomix` or `npx repomix` (bin `repomix`)
- **Version / activity:** npm 1.18.1 · MIT · publish 2026-09-21 · repo pushed 2026-09-23 · 28,480 stars · 144 open issues
- **Problem solved:** *Memory + Understanding — context management across sessions.* Instead of me re-reading 200 files one-by-one, Repomix produces a single `repomix-output.txt` (structure + contents, respecting `.gitignore`) that re-establishes the whole-project picture in one read. Directly serves the "pick up where I left off" requirement.
- **Integration:** CLI, local, no key.
- **Cost:** free.
- **Limitations:** the packed file can be large; output should be regenerated per session and kept out of git (it is not source). It summarizes structure, not design intent.
- **Verification:**
```
$ npm view repomix version license repository.url
version = '1.18.1'
license = 'MIT'
repository.url = 'git://github.com/yamadashy/repomix.git'
```

### 2.3 ADR CLI — `adr`
- **Repository:** https://github.com/phodal/adr
- **Install:** `npm install -g adr` → `adr new "<decision>"`, `adr list`
- **Version / activity:** npm 1.5.2 · MIT · publish 2024-08-30 · repo pushed 2026-07-13 · 271 stars · 9 open issues
- **Problem solved:** *Learning from mistakes + Memory — decision logs.* The project already carries long-lived decisions (route table, SM-2 deck vs new tracking, "no new tracking", "Grammar-only" boundaries) that I currently re-derive each session. `adr` gives a numbered, git-committed decision record format and enforces statuses (proposed/accepted/superseded), so constraints become persistent and checkable instead of memory.
- **Integration:** CLI, local, no key.
- **Cost:** free.
- **Limitations:** it is a template/format tool — it cannot validate the *correctness* of a decision. Requires the team to adopt committing ADRs to the repo.
- **Verification:**
```
$ npm view adr version license repository.url
version = '1.5.2'
license = 'MIT'
repository.url = 'git+https://github.com/phodal/adr.git'
```

### 2.4 mem0 — `mem0ai`
- **Repository:** https://github.com/mem0ai/mem0
- **Install:** `pip install mem0ai` (Python ≥3.10) or `npm install mem0ai`
- **Version / activity:** PyPI 2.2.0 · Apache-2.0 · repo pushed 2026-09-23 · 65,934 stars · 755 open issues
- **Problem solved:** *Memory + Learning — failure memory / continuity.* Structured long-term memory for agents (facts, preferences, past failures) with retrieval (including vector search); supports HTTP/MCP and pluggable stores (sqlite, vector DBs, OpenAI/Qdrant).
- **Integration:** Python/TS library or HTTP service; MCP via community servers. Local default store; cloud providers optional.
- **Cost:** Apache-2.0; no key required for the built-in sqlite/vector store and default embeddings; OpenAI/provider modes need their keys.
- **Limitations:** heavier than the markdown approach (§2.1) and needs Python 3.10+; embeddings default assumes an OpenAI-compatible provider unless configured local — a real setup cost. Overkill if Basic Memory's files already suffice.
- **Verification:**
```
$ pip index versions mem0ai
mem0ai (2.2.0)

$ curl -s https://api.github.com/repos/mem0ai/mem0 | jq -r '"license: \(.license.spdx_id) | stars: \(.stargazers_count)"'
license: Apache-2.0 | stars: 65934
```

### 2.5 Chromatic — `chromatic` (Chromatic CLI)
- **Repository:** https://github.com/chromaui/chromatic-cli
- **Install:** `npm install --save-dev chromatic` (this repo already has Storybook 10.5.9)
- **Version / activity:** npm 18.9.5 · MIT · publish 2026-09-22
- **Problem solved:** *Design + Verification — UI validation.* Claims like "audio button stays centered across rows" were only provable ad-hoc last task. Chromatic's Storybook integration fingerprints components per commit and flags visual diffs (and interactions), turning UI changes into reviewable evidence. This project already runs Storybook, so the baseline cost is low.
- **Integration:** CLI, needs a Storybook build; snapshot storage is a Chromatic **cloud** service (hosted; free tier for OSS, paid for private/collaboration) with CI uploads. The CLI itself is MIT.
- **Cost:** MIT CLI, but the hosted snapshot/comparison is a commercial SaaS — an external service and account are required for the core value.
- **Limitations:** cloud-dependent for diffs (a deliberate constraint for this repo, which keeps artifacts out of git). Similar in spirit to Playwright/MCP pass-1 tools but a genuinely different problem (library-wide visual regression vs. one-off measurement).
- **Verification:**
```
$ npm view chromatic version license repository.url
version = '18.9.5'
license = 'MIT'
repository.url = 'git+https://github.com/chromaui/chromatic-cli.git'
```

### 2.6 Context7 — `@upstash/context7-mcp`
- **Repository:** https://github.com/upstash/context7
- **Install:** `npx ctx7 setup` (CLI + skill) or register MCP `@upstash/context7-mcp@latest`
- **Version / activity:** npm 4.1.1 · MIT · publish 2026-09-14 · repo pushed 2026-09-24 · 62,381 stars · 67 open issues
- **Problem solved:** *Research + anti-hallucination.* Twice this project I've generated code against library behavior I had to later re-check (TTS APIs, icon names, fuzzy matchers). Context7 fetches version-pinned docs and examples at generation time — the direct antidote to "hallucinated APIs from stale training data."
- **Integration:** MCP server **or** `ctx7` CLI with skill; both local installs. Optional free API key for higher rate limits.
- **Cost:** free; recommends a free API key (`context7.com/dashboard`) for rate limits; not required for basic use.
- **Limitations:** covers libraries/docs indexed by Context7 (good coverage for react/lucide/vite/etc.); needs outbound HTTPS to its service — reachability from this sandbox is unverified (see §7).
- **Verification:**
```
$ npm view @upstash/context7-mcp version license repository.url
version = '4.1.1'
license = 'MIT'
repository.url = 'git+https://github.com/upstash/context7.git'
```

### 2.7 MarkItDown — `markitdown` / `markitdown-mcp`
- **Repository:** https://github.com/microsoft/markitdown
- **Install:** `pip install 'markitdown[all]'` (CLI `markitdown file.pdf > out.md`); MCP via `markitdown-mcp` (PyPI 0.0.1a7)
- **Version / activity:** PyPI 0.1.8 · MIT · repo pushed 2026-09-21 · 186,715 stars · 696 open issues
- **Problem solved:** *Research + anti-hallucination.* Grounding: the Kurmanji grammar sources this project cites (CeLCAR/Thackston PDFs) are PDF; I currently fetch web text or paraphrase. MarkItDown converts those primary-source PDFs/DOCX to Markdown I can quote-verify instead of recalling.
- **Integration:** CLI/library; optional MCP server for agent hosts; local.
- **Cost:** free, MIT; no key (OCR extensions may need one, but base PDF/doc conversion does not).
- **Limitations:** conversion fidelity varies with the source format (scanned/no-text PDFs need OCR); it converts, it cannot judge content correctness.
- **Verification:**
```
$ pip index versions markitdown ; curl -s https://pypi.org/pypi/markitdown-mcp/json | jq -r '"version: \(.info.version) | summary: \(.info.summary)"'
markitdown (0.1.8)
version: 0.0.1a7 | summary: An MCP server for the "markitdown" library.
```

### 2.8 Style Dictionary — `style-dictionary`
- **Repository:** https://github.com/style-dictionary/style-dictionary
- **Install:** `npm install --save-dev style-dictionary`
- **Version / activity:** npm 5.5.5 · Apache-2.0 · publish 2026-09-20 · repo pushed 2026-09-20 · 4,826 stars · 236 open issues
- **Problem solved:** *Design — token-to-code consistency.* The project mandates "Keep Warm Heritage design system + dark mode." Today tokens live ad hoc in Tailwind utilities. Style Dictionary defines tokens once (colors, radii, spacing) and emits Tailwind-compatible config/CSS, so design changes are one edit, not a find-replace namespace hunt.
- **Integration:** CLI library (config-driven build); local; no key.
- **Cost:** free.
- **Limitations:** a pipeline you must adopt (tokens JSON → generated output); adopting it mid-project is a mild refactor of existing color/radius usage.
- **Verification:**
```
$ npm view style-dictionary version license repository.url
version = '5.5.5'
license = 'Apache-2.0'
repository.url = 'git://github.com/style-dictionary/style-dictionary.git'
```

### 2.9 FigmaContextMCP — `figma-developer-mcp`
- **Repository:** https://github.com/GLips/Figma-Context-MCP
- **Install:** `npm install -g figma-developer-mcp` (or `npx figma-developer-mcp`), then pass/select a Figma file link in the agent
- **Version / activity:** npm 0.13.2 · MIT · publish 2026-06-18 · repo pushed 2026-09-18 · 15,902 stars · 25 open issues
- **Problem solved:** *Design — design-to-code / UI validation.* I write UI with text prompts and pixel guesses, not a design reference. This exposes Figma file/frame metadata (layout, styles, variables) so an implementation can be checked against the real design instead of my interpretation.
- **Integration:** MCP server; needs the agent host to support MCP and (for sizable files) a Figma access token.
- **Cost:** MIT; free without the API for public/small files, larger/teams needs a Figma personal-access token.
- **Limitations:** only useful if the project maintains Figma files (uncertain — see §7); needs MCP hosting; remote Figma API required, unverified from this sandbox.
- **Verification:**
```
$ npm view figma-developer-mcp version license repository.url
version = '0.13.2'
license = 'MIT'
repository.url = 'git+https://github.com/GLips/Figma-Context-MCP.git'
```

---

## 3. Rejected tools

| Tool | URL / package | Reason for rejection (vs. accepted) |
|---|---|---|
| lost-pixel (`lost-pixel` npm 3.22.0) | https://github.com/lost-pixel/lost-pixel | **Archived** repo (archived=true, last push 2026-04). Out of maintenance → too risky to recommend. Chromatic covers visual regression in its place. |
| backstopjs (npm 6.3.25) | https://github.com/garris/backstopjs | Active (pushed 2026-09) but publish 2024-09; config-driven visual diffing with a heavier setup than Chromatic for a Storybook project. Rejected for overlap + staleness. |
| reg-suit (npm 0.14.5) | https://github.com/reg-viz/reg-suit | Last publish 2025-08; storage-plugin complexity (needs S3/GCS). Weaker fit than Chromatic for this repo. |
| figmagic (npm 4.6.0) | https://github.com/mikaelvesavuori/figmagic | Figma→tokens/code generator; last publish 2025-01. FigmaContextMCP covers design-to-code more directly and is more active. |
| @zeplin/cli (npm 2.1.1) | https://github.com/zeplin/cli | Publish 2025-06; Zeplin account required; FigmaContextMCP + tokens already cover the need. |
| `@claudememory/cli`, `@claudememory/claudememory`, `basic-memory` (npm), `mem0` (PyPI), `markitdown-mcp` (npm) | npm/PyPI lookups | **Do not exist** under these exact names (404s pasted in session log). The real packages are `basic-memory` (PyPI), `mem0ai` (PyPI/npm), `markitdown-mcp` (PyPI only). Corrected → these names were from previous-session memory and were wrong. |
| @figma/mcp-server, figma-dev-mode-mcp (npm) | npm | **404** — not published under these names; Figma's dev-mode MCP is distributed through the Figma app/plugin channel, not npm. Not recommended. |
| @modelcontextprotocol/server-context7 (npm) | npm | 404; Context7 is distributed as `@upstash/context7-mcp`. |
| mermaid-cli / mermaid-filter (npm) | github.com/mermaid-js/mermaid-cli | Diagram rendering; valuable but out of the requested four areas; pass-1 concentrates on code/verification. Reserved, not omitted — would be a candidate for a future "communication" pass. |
| docling (PyPI 2.130.0) | https://github.com/docling-project/docling | Real and active, but overlaps MarkItDown for PDF/DOCX→Markdown; MarkItDown chosen for lighter install + MCP availability. |

---

## 4. Tool combinations (minimal)

**Combo A — "Persistent memory + decision log" (memory + mistake-learning)**
`basic-memory` **or** `mem0` + `adr` + `repomix`
- `repomix` re-establishes the whole-project picture in one read at session start; `adr` turns constraints ("Grammar-only", "no new tracking") into committed records I can re-read; `basic-memory` (or `mem0`) holds session/failure notes outside the repo. Pick `basic-memory` if plain-files + human-visible notes fit; pick `mem0` if you want vector-search retrieval and pluggable backends. (They solve the same niche — the guidance recommends **one**, not both.)

**Combo B — "Design reference + UI evidence" (design)**
`FigmaContextMCP` (if Figma files exist) + `style-dictionary` + `chromatic`
- `style-dictionary` stabilizes the Warm Heritage tokens; `FigmaContextMCP` provides the actual design metadata when a design is referenced; `chromatic` turns each Storybook change into a visual regression gate.

**Combo C — "Anti-hallucination research" (research)**
`context7` + `markitdown`
- `context7` supplies current library APIs at generation time; `markitdown` converts the primary grammar PDFs for citation-backed verification. They target different sources (library docs vs. reference documents), so both are justified.

---

## 5. Integration cost estimate

| Combination | Setup complexity | Time to integrate | Ongoing maintenance |
|---|---|---|---|
| A (memory + ADR + repomix) | Medium | ~1–2 h (pick one memory store; adopt ADR under `docs/adr/`) | Medium — notes/ADRs grow and must stay accurate; repomix regen per session |
| B (design) | High | ~1–2 d (token migration + Storybook snapshot baseline + Figma access) | High-ish — pixel-diff review each commit, token source-of-truth discipline |
| C (research) | Low–Medium | ~0.5–1 h | Low — periodic re-fetch for version bumps |

*(Estimates are for me to adopt these practices inside this repo; they assume the team accepts the new committed files, e.g. `docs/adr/`.)*

---

## 6. Gaps I could not fill

1. **Failure/self-correction memory with true retrieval.** `mem0` and `basic-memory` persist facts; neither automatically detects *which* of my past actions were mistakes unless I explicitly record them. The "learn from mistakes" loop still needs me to write the lesson down — the tool only guarantees it is retained and retrievable.
2. **Constraint extraction from prose.** No tool I verified turns the user's natural-language instructions ("do not touch Writing", "keep thresholds as named constants") into enforceable rules on its own. The best I found is disciplined ADR authoring + static rules (pass 1's dependency-cruiser). The extraction step remains mine.
3. **Design aesthetic judgment.** Visual-regression tools prove *change*, not *quality*. "Does this look good/child-appropriate in Arabic RTL + dark mode?" remains a human/designer call.
4. **Kurmanji linguistic correctness.** No research tool validates Kurdish grammar; grounding tools (markitdown) only make the *sources* readable — proficiency still requires the external references (CeLCAR/Thackston).

---

## 7. What I could not verify

- **Outbound HTTPS to Context7 / Figma from this sandbox:** I verified the packages and repos, but this environment allowed `registry.npmjs.org`/`api.github.com` while matching `cdx`-style endpoints (`mcp.context7.com`, Figma API) were not reached. Runtime reachability is therefore **unverified here**; the CLIs may not function until the network allows their endpoints.
- **Basic Memory on this exact sandbox:** PyPI resolves, but `basic-memory` requires Python ≥3.12 — this sandbox runs 3.11.2, so its local install is unverified/incompatible **here** (not a fault of the tool; standalone-it would install elsewhere).
- **My own MCP client for `basic-memory`/`figma-developer-mcp`:** I could not confirm whether this environment's agent runtime hosts MCP servers. Both tools depend on that.
- **Chromatic hosted service behavior:** I verified the MIT CLI and its publish date; its cloud diff UI requires an account and was not exercised.
- **`markitdown-mcp` on npm:** correctly absent from npm; it is PyPI-only (`0.0.1a7`, verified). Reported to avoid confusion.

---

## Recommended starting point

**Context7, first (research), and `adr` + `repomix` (memory), by themselves to start.**

Reason: they are the only tools in this list with **identical effect whether or not the agent runtime exposes MCP**, they need no external service account, and they hit the two concrete failures this project actually exhibits: (a) I fumble/hallucinate on the exact current API behavior in a locked-down network, and (b) I keep re-deriving the project's long-lived decisions from scratch. Adopting those three is a low, reversible commitment (a CLI + a committed ADR directory). The MCP-dependent memory servers and the Figma→code pipeline come second and only after confirming this host runs MCP servers at all.
