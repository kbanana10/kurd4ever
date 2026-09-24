# Agent Setup — Re-establish Environment After a Reset

> Read this FIRST at the start of every new session (Rule 6). The sandbox wipes
> `node_modules` and local git metadata between sessions; the remote
> `origin/ai/autonomous` is the only durable state. Re-run the commands below
> before doing any work.

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

# repomix — one-file context pack (later cycle)
npx repomix    # writes repomix-output.txt (keep out of git)
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

Re-run the one-liner after every reset (tarball + extracted libs live in `/tmp`,
which is also wiped).

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

## 7. Session-doc conventions

- `docs/agent-setup.md` — this file (re-establish commands).
- `docs/agent-capability-tools.md`, `-pass2.md` — research (read-only).
- `audit/ast-grep/` — repo guard rules (Cycle 2).
