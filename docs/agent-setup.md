# Agent Setup — Re-establish Environment After a Reset

> Read this FIRST at the start of every new session (Rule 6). The sandbox wipes
> `node_modules` and local git metadata between sessions; the remote
> `origin/ai/autonomous` is the only durable state. Re-run the commands below
> before doing any work.

## Session Start — Context Recovery

At the very start of a session, BEFORE doing anything else, recover context
in this exact order:

1. **Read `repomix-src.md` first** (primary context: `src/**` in one file).
   If a different area matters, read `repomix-docs.md`, `repomix-harness.md`,
   or `repomix-root.md` as needed. Regenerate all four with the commands in
   §3 ("repomix") — each stays under 100k tokens so it fits a context window.
2. **Then read `docs/agent-setup.md`** (this file) for environment re-establish
   and the current cycle rules.

## 0. Baseline state (re-verify every session)

| Thing | Expected |
|---|---|
| Repo | `https://github.com/kbanana10/kurd4ever.git` |
| Branch | `ai/autonomous` (`origin/ai/autonomous` tracks it) |
| Old branch | `arena/01a0c86c-kurd4ever` — leave alone |
| Protected | NEVER touch `main`/`master` |
| Node | v22.22.3 (project engine `>=20 <21` — npm warns, works) |
| Python | 3.11.2 (⚠ no 3.12 → do NOT install `basic-memory` here) |

## 1. Re-create the workspace

```bash
cd /home/user
# If the repo folder is missing entirely after a reset:
git clone -b ai/autonomous https://github.com/kbanana10/kurd4ever.git
cd kurd4ever
# If the folder exists but git state is gone / wrong branch:
git status            # expect clean after a fresh clone, or list of changes
git branch --show-current   # expect ai/autonomous
git remote -v         # expect origin = kbanana10/kurd4ever
```

If the local branch is not `ai/autonomous`:

```bash
git fetch origin
git checkout ai/autonomous        # creates local tracking branch
git pull --ff-only origin ai/autonomous
```

## 2. Re-install dependencies

```bash
npm ci
```

Do NOT commit `package.json`/`package-lock.json` changes for tooling. Tool
dependencies are installed `--no-save` or via `npx` ONLY (per approved plan).

## 3. Adopted agent tools (all npx / --no-save — no package.json changes)

```bash
# ast-grep — structural search + repo guard rules (integrated Cycle 2).
# The binary is `sg` (older name; ast-grep 0.45.3 warns it's deprecated).
npm exec --yes --package=@ast-grep/cli -- sg --version

# Repo guard rules — run/verify:
npm exec --yes --package=@ast-grep/cli -- sg test   -c audit/ast-grep/sgconfig.yml
npm exec --yes --package=@ast-grep/cli -- sg scan   -c audit/ast-grep/sgconfig.yml src
# Rule files: audit/ast-grep/rules/*.yml ; tests: audit/ast-grep/rule-tests/*.yml
# NOTE: run `sg test` AFTER adding a new rule/test to (re)generate snapshots, then drop --update-all.

# Browser verification pair (Cycle 3) — NOT YET COMMITTED AS RULES
npm install --no-save puppeteer-core @sparticuz/chromium

# Handwriting guide libraries (Cycle 9 / C9) — evaluate BEFORE wiring in; --no-save only.
npm install --no-save tegaki@0.22.2       # MIT; per-stroke handwriting animation for any font
npm install --no-save letterpaths@1.0.2   # MIT fallback; UK-curriculum stroke geometry
# C9 DECISION (verified): BOTH libraries fail the Kurdish requirement. tegaki
# renders pre-baked stroke data (glyphData.json) only for its 10 bundled fonts;
# NONE of them covers ç ê î ş û (CLI probe of every bundled font → 0 paths for
# "çêîşû"). Custom bundles are generated ONLY via the hosted browser studio
# (gkurt.com/tegaki/studio) — no local generator, no npm generator package —
# and its "stroke order" is a skeleton heuristic (connected components sorted
# top-to-bottom/left-to-right), so diacritic crowns would draw BEFORE the base
# letter (wrong for teaching). letterpaths covers A–Z a–z + digits only (UK
# print/cursive, lowercase); has NO Kurdish diacritics and does not match the
# app's 900-weight uppercase Noto guide. Full evidence: audit/proof/cyc9-lib-evidence.txt

# repomix — one-file context pack (Cycle 4 / 4.5: verified resolving, attempt 1)
# Default output is repomix-output.xml in v1.18.1; we use --compress (tree-sitter
# structure extraction) and split by area so every pack stays under ~100k tokens:
#   whole repo --compress = 154,371 tokens (too big) → SPLIT:
npx --yes repomix --include "src/**"             --compress --style markdown --output repomix-src.md     # 76,031 tk
npx --yes repomix --include "docs/**"            --compress --style markdown --output repomix-docs.md    # 12,530 tk
npx --yes repomix --include "audit/**,tools/**"  --compress --style markdown --output repomix-harness.md # 17,912 tk
npx --yes repomix --ignore "src/**,docs/**,audit/**,tools/**,node_modules/**,build/**,dist/**" \
         --compress --style markdown --output repomix-root.md                                          # 22,724 tk
# Ignore rules: .gitignore `repomix-*.md`; .repomixignore excludes proof dirs,
# result JSONs, and the packs themselves. All packs are GENERATED artifacts:
# never commit them. Intended use: read at start of session to re-establish
# project context (see "Session Start" above); read src first, then docs/harness/root.
```

## 4. Browser (headless Chromium) workaround — used Cycle 3

Playwright/puppeteer CDN downloads are network-blocked here
(`ECONNRESET`). `@sparticuz/chromium` ships a Chromium binary inside its npm
tarball (no CDN). On Debian 12 it additionally needs 3 NSS libs extracted
from the package's own `al2023.tar.br`:

```bash
node -e "
const {createReadStream, createWriteStream} = await import('node:fs');
const {createBrotliDecompress} = await import('node:zlib');
const {pipeline} = await import('node:stream/promises');
const {execSync} = await import('node:child_process');
await pipeline(createReadStream('node_modules/@sparticuz/chromium/bin/al2023.tar.br'), createBrotliDecompress(), createWriteStream('/tmp/al2023.tar'));
execSync('mkdir -p /tmp/nsslibs && tar -xf /tmp/al2023.tar -C /tmp/nsslibs');
"
# Launch with:
LD_LIBRARY_PATH=/tmp/nsslibs/lib node your-script.mjs
```

Proven minimal launch probe (Cycle 3, passed attempt 1 of 3):

```bash
# from repo root, after npm ci + npm install --no-save puppeteer-core @sparticuz/chromium
# and the NSS extraction one-liner above:
node -e "import('@sparticuz/chromium').then(async c=>{const e=await c.default.executablePath();const p=(await import('puppeteer-core')).default;const b=await p.launch({args:c.default.args,defaultViewport:{width:390,height:844},executablePath:e,headless:'shell',env:{...process.env,LD_LIBRARY_PATH:'/tmp/nsslibs/lib'}});const pg=await b.newPage();await pg.setContent('<h1>hello</h1>');console.log('H1:',await pg.\$eval('h1',el=>el.textContent));await b.close();});"
# expected: H1: hello
```

Re-run the one-liner after every reset (tarball + extracted libs live in `/tmp`,
which is also wiped).

### Generalized UI measurement tool (Cycle 3)

```bash
node audit/tools/measure-ui.mjs                     # measures /grammar/pronouns (3 port sizes incl. RTL)
ROUTE=/grammar/sentence-structure node audit/tools/measure-ui.mjs
# Env overrides: ROUTE, ROW_SELECTOR, KU_SELECTOR, AUDIO_SELECTOR, RIGHT_SELECTOR, TOLERANCE_PX, BASE
# Screenshots land in measure-ui-proof/ (gitignored via its nested .gitignore).
```

### Writing-tracing self-test runner (Cycle 5)

```bash
node audit/tools/selftest-tolerance.mjs   # headless runTraceSelfTest; prints coverage/minZone/missPixels
# Measures the tolerance CURRENTLY compiled into src/lib/traceLetters.ts.
# Evidence reference (track B): COVERAGE_TOLERANCE_PX = 4 → I 72.7 / E 72.7 /
# O 83.7 / M 77.3 / W 77.6, all pass; 3 → M fails (min-zone 36.1% < 40% floor).
```

## 5. Before/after every app change (Rule 4)

```bash
npm test            # vitest, 200+ tests
npx tsc --noEmit    # == npm run lint
npm run lint:slop
npm run build
```

## 6. Commit rhythm (Rule 5)

- Branch: `ai/autonomous` ONLY.
- After each successful cycle: one descriptive commit (what + why), `git push origin ai/autonomous`.
- Never `git checkout`/`reset`/`rebase` other branches.

## 6b. Pre-commit checklist (Rule 13 — MANDATORY before every commit)

Sandbox resets can delete the local branch, causing `git commit` to fall back
to whatever HEAD is (this nearly leaked a commit to arena once). The push then
refuses, but the local commit must not land on the wrong branch.

Before ANY `git commit`:

1. Run `git branch --show-current`.
2. If it is NOT `ai/autonomous`, STOP — do NOT commit. Re-establish the branch
   per §1 (fetch + `git branch -f ai/autonomous origin/ai/autonomous` +
   `git symbolic-ref HEAD refs/heads/ai/autonomous`) first.
3. Only after confirming the branch, run the commit.

Rule 14: if a sandbox reset occurs mid-cycle, PAUSE and post a one-line alert
(SANDBOX RESET — investigating), complete the recovery, then resume. Do not
silently recover and continue.

## 6c. Agent skills (Mission 2) — user-level skills under ~/.agents/skills/

Eight third-party agent skills adopted via `npx`/manual copy only (nothing in
`package.json`). Installed user-level into the Agent Standard dir
`~/.agents/skills/`; see `docs/skills.md` for per-skill status, licenses and
verification output. **These live in $HOME, not the repo** — a sandbox reset
may wipe them; re-run the commands below to restore.

```bash
mkdir -p ~/.agents/skills

# Skills CLI (vercel-labs/agent-skills) installs, all global:
npx --yes skills add blader/humanizer --global --yes
npx --yes skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend" --global --yes
npx --yes skills add https://github.com/cathrynlavery/diagram-design --global --yes
npx --yes skills add https://github.com/hardikpandya/stop-slop --global --yes
npx --yes skills add https://github.com/zarazhangrui/frontend-slides --global --yes
npx --yes skills add https://github.com/Egonex-AI/Understand-Anything --skill "understand" --global --yes

# UI/UX Pro Max — own CLI; universal = Agent Standard .agents/skills/
npx --yes ui-ux-pro-max-cli init --ai universal --global --offline --force

# Impeccable — bundled downloader unreachable from sandbox (TLS fail on
# impeccable.style); use the repo's shipped payload instead:
git clone --depth 1 https://github.com/pbakaus/impeccable.git /tmp/impeccable
cp -r /tmp/impeccable/.agents/skills/impeccable ~/.agents/skills/
```

## 7. Session-doc conventions

- `docs/agent-setup.md` — this file (re-establish commands).
- `docs/agent-capability-tools.md`, `-pass2.md` — research (read-only).
- `audit/ast-grep/` — repo guard rules (Cycle 2).
