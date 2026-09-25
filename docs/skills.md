# Agent Skills — Inventory & Install Status

> **Mission 2 deliverable.** Adds 8 third-party agent skills to the harness.
> Documentation/setup only — no app code was modified. All installs are
> user-level and live under the Agent Standard directory
> `~/.agents/skills/` (with the skills CLI's universal symlink fan-out to
> other agent homes where supported). Nothing was added to `package.json`
> (tooling rule: npx / manual copy only).

**Status legend:** WORKING = installed and verified on disk with a valid
`SKILL.md`; INCOMPATIBLE = attempted but cannot run in this harness;
DEFERRED = skipped with a reason and a path to re-enable.

## Summary

| # | Skill | Repo | License | Version (at install) | Installed as | Status |
|---|---|---|---|---|---|---|
| 1 | UI/UX Pro Max | [nextlevelbuilder/ui-ux-pro-max-skill](https://github.com/nextlevelbuilder/ui-ux-pro-max-skill) | MIT | 2.13.0 | `~/.agents/skills/` — `ui-ux-pro-max` **plus its skill family** (`banner-design`, `brand`, `design`, `design-system`, `slides`, `ui-styling`) | WORKING |
| 2 | Impeccable | [pbakaus/impeccable](https://github.com/pbakaus/impeccable) | Apache-2.0 | 4.4.0 | `~/.agents/skills/impeccable` | WORKING¹ |
| 3 | Taste Skill | [Leonxlnx/taste-skill](https://github.com/Leonxlnx/taste-skill) | MIT | v2 (experimental) | `~/.agents/skills/design-taste-frontend` | WORKING |
| 4 | Humanizer | [blader/humanizer](https://github.com/blader/humanizer) | MIT | 3.0.0 | `~/.agents/skills/humanizer` | WORKING |
| 5 | Stop Slop | [hardikpandya/stop-slop](https://github.com/hardikpandya/stop-slop) | MIT | — | `~/.agents/skills/stop-slop` | WORKING |
| 6 | Understand Anything | [Egonex-AI/Understand-Anything](https://github.com/Egonex-AI/Understand-Anything) | MIT | 2.9.7 | `~/.agents/skills/understand` | WORKING |
| 7 | Frontend Slides | [zarazhangrui/frontend-slides](https://github.com/zarazhangrui/frontend-slides) | MIT | — | `~/.agents/skills/frontend-slides` | WORKING |
| 8 | Diagram Design | [cathrynlavery/diagram-design](https://github.com/cathrynlavery/diagram-design) | MIT | 2.6 | `~/.agents/skills/diagram-design` | WORKING |

¹ Impeccable's CLI installer downloads a signed bundle from `impeccable.style`;
that endpoint was unreachable from this sandbox (TLS handshake failure on
`https://impeccable.style/api/download/bundle/universal`). Installed instead via
the repo's shipped compiled payload (`cp -r .agents/skills/impeccable/ → ~/.agents/skills/`),
which is the README-documented universal/Codex path. The skill itself (SKILL.md
v4.4.0 + `scripts/` launcher) is present and complete; only the CLI's
auto-updater cannot phone home from here.

## None require an account

All 8 install and run without an account or API key. The repos mention
optional integrations that are **not** install gates:

- UI/UX Pro Max: optional `GEMINI_API_KEY` / image-gen API keys for its
  *design* sub-skill (off by default).
- Taste Skill: optional ChatGPT-Images/Flux sponsorships for its image-gen
  skills (`brandkit`, `imagegen-*`) — not needed for the code skill.
- Understand Anything: the optional `understand-figma` skill needs a Figma
  REST API token; the core `understand` skill does not.

## Install commands (evidence — exact commands that ran, per skill)

| Skill | Command used | Notes |
|---|---|---|
| Humanizer | `npx skills add blader/humanizer --global --yes` | README canonical: `npx skills add blader/humanizer --global` |
| Taste Skill | `npx skills add https://github.com/Leonxlnx/taste-skill --skill "design-taste-frontend" --global --yes` | `--skill` value = frontmatter `name:` field |
| Diagram Design | `npx skills add https://github.com/cathrynlavery/diagram-design --global --yes` | Claude Code native path (`/plugin marketplace add …`) unavailable here; skills CLI reads its `skills/diagram-design/SKILL.md` |
| Stop Slop | `npx skills add https://github.com/hardikpandya/stop-slop --global --yes` | README canonical: copy folder as a skill |
| Frontend Slides | `npx skills add https://github.com/zarazhangrui/frontend-slides --global --yes` | README canonical: Claude plugin or manual copy of `SKILL.md` + support files |
| Understand Anything | `npx skills add https://github.com/Egonex-AI/Understand-Anything --skill "understand" --global --yes` | README canonical: `/plugin marketplace add Egonex-AI/Understand-Anything` + `/plugin install understand-anything` (Claude Code) or `curl …/install.sh \| bash` |
| UI/UX Pro Max | `npx ui-ux-pro-max-cli init --ai universal --global --offline --force` | README canonical: `npm install -g ui-ux-pro-max-cli` + `uipro init --ai <assistant>`; `universal` = Agent Standard `.agents/skills/` |
| Impeccable | manual copy `cp -r .agents/skills/impeccable ~/.agents/skills/` | README canonical: `npx impeccable install` (bundle CDN unreachable here) |

## Verification output (Rule 16)

Every skill was re-checked on disk after install: directory exists **and** a
valid `SKILL.md` with a `name:` frontmatter is present.

```
OK  ui-ux-pro-max          3.6M   name=ui-ux-pro-max
OK  impeccable (v4.4.0)    2.3M   name=impeccable
OK  design-taste-frontend   88K   name=design-taste-frontend
OK  humanizer (v3.0.0)      80K   name=humanizer
OK  stop-slop               32K   name=stop-slop
OK  understand             600K   name=understand
OK  frontend-slides        3.8M   name=frontend-slides
OK  diagram-design (v2.6)  3.6M   name=diagram-design
```

Licenses verified from each repo's `LICENSE` file at fetch time: seven MIT
(ui-ux-pro-max, taste-skill, humanizer, stop-slop, Understand-Anything,
frontend-slides, diagram-design) and one Apache-2.0 (impeccable). All
permissive; no AGPL concerns.

## Harness suitability notes

The canonical "Claude Code marketplace" `/plugin …` commands above are
Claude-Code-specific and were **not** attempted in this harness (no Claude Code
client is present; `~/.claude` does not exist here). Where a skill's canonical
path is Claude-CC-specific, the equivalent CLI/manual-copy path targeting the
Agent Standard `~/.agents/skills/` was used instead, per the constraint
"REQUIRES ACCOUNT or INCOMPATIBLE skills are skipped and noted" — none were
skipped; nine skill folders now exist (the 8 tracked skills; UI/UX Pro Max
ships its 7-folder family as a single `uipro` payload).

Invocation inside the harness: in this environment skills are loaded by the
agent's harness-specific skill directory; on a host with a compatible CLI the
skills answer to their documented names (`/humanizer`, `/impeccable`,
`/frontend-slides`, `/understand`, `/diagram-design`, `stop-slop` and
`design-taste-frontend` are plain SKILL.md skills picked up automatically).
