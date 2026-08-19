"""
ux_agent.py — browser-use powered "human end-user" exploratory test driver.

Runs an LLM-driven browser agent (https://github.com/browser-use/browser-use)
against the local Kurdish Quest dev server and asks it to behave like a
first-time human user: complete onboarding, follow the guided tour, claim the
reward, then explore Dashboard / Roadmap / Profile / Leaderboard and report
UX friction.

Usage:
    # dev server must be running on :3000 first (npm run dev)
    GEMINI_API_KEY=... python3 scripts/ux_agent.py
    # or OPENAI_API_KEY=... / ANTHROPIC_API_KEY=...
    # optional: UX_AGENT_MODEL=<model-id>, UX_AGENT_MAX_STEPS=<n>

Notes:
    * Requires: pip install browser-use playwright && python -m playwright install chromium
    * All artifacts (history, screenshots) are written to /tmp/ux-agent-run/,
      NEVER into the repo (screenshot policy).
    * The final agent answer is printed to stdout and saved to
      /tmp/ux-agent-run/ux_agent_report.md for manual review.
"""

import asyncio
import os
import sys
from pathlib import Path

ARTIFACT_DIR = Path('/tmp/ux-agent-run')
BASE_URL = os.environ.get('UX_AGENT_BASE_URL', 'http://localhost:3000')
MAX_STEPS = int(os.environ.get('UX_AGENT_MAX_STEPS', '60'))

TASK = f"""
You are a curious first-time human user testing the "Kurdish Quest" language
learning web app at {BASE_URL}. Act naturally, like a real person on a phone.

Do ALL of the following, in order:

1. Open {BASE_URL}. You will land on a welcome/login screen. Accept the legal
   checkbox, enter the name "Alex QA" and start as a guest.
2. Complete the 4-step onboarding wizard (pick any reason, level, daily goal
   and avatar, then finish).
3. A guided tour will start automatically on the dashboard. Read every step,
   press "Next" through the informational steps, and when a step highlights
   the Roadmap tab in the bottom navigation, TAP THAT TAB (the tour requires
   the real action). On the roadmap, continue the tour and tap the glowing
   first lesson node to finish the tour and claim the gem reward. Confirm the
   reward toast appears and the gem balance in the header increased.
4. Close the lesson sheet (or start and then exit the quiz), then explore the
   app like a skeptical human tester, spending a few actions in each area:
   - Dashboard (/): open and close the "Adjust Goal" sheet, try tapping cards.
   - Roadmap: scroll the map, open a locked node, open an unlocked node.
   - Profile: switch between Progress and Settings tabs, toggle dark mode on
     and off, look at the daily missions and achievements.
   - Leaderboard: navigate to /leaderboard and inspect it.
5. While exploring, note anything that is broken, visually glitchy, confusing,
   mistranslated, unresponsive, or annoying.

FINAL ANSWER FORMAT: a markdown UX feedback report with sections:
"What worked well", "Broken interactions", "Visual glitches",
"UX friction points", "Suggestions". Be specific (page, element, what
happened vs what you expected).
"""


def build_llm():
    """Pick an LLM provider from whatever API key is available."""
    model_override = os.environ.get('UX_AGENT_MODEL')
    if os.environ.get('GEMINI_API_KEY'):
        from browser_use.llm.google.chat import ChatGoogle
        return ChatGoogle(model=model_override or 'gemini-2.0-flash')
    if os.environ.get('OPENAI_API_KEY'):
        from browser_use.llm.openai.chat import ChatOpenAI
        return ChatOpenAI(model=model_override or 'gpt-4o-mini')
    if os.environ.get('ANTHROPIC_API_KEY'):
        from browser_use.llm.anthropic.chat import ChatAnthropic
        return ChatAnthropic(model=model_override or 'claude-sonnet-4-20250514')
    return None


async def main() -> int:
    ARTIFACT_DIR.mkdir(parents=True, exist_ok=True)

    llm = build_llm()
    if llm is None:
        print(
            'ux_agent: no LLM API key found.\n'
            'Set GEMINI_API_KEY, OPENAI_API_KEY or ANTHROPIC_API_KEY and re-run:\n'
            '    GEMINI_API_KEY=... python3 scripts/ux_agent.py',
            file=sys.stderr,
        )
        return 2

    from browser_use.agent.service import Agent, BrowserProfile, BrowserSession

    session = BrowserSession(
        browser_profile=BrowserProfile(
            headless=True,
            viewport={'width': 390, 'height': 844},
            args=['--no-sandbox', '--disable-dev-shm-usage'],
        ),
    )

    agent = Agent(
        task=TASK,
        llm=llm,
        browser_session=session,
        generate_gif=str(ARTIFACT_DIR / 'ux_agent_run.gif'),
    )

    history = await agent.run(max_steps=MAX_STEPS)

    report = history.final_result() or '(agent produced no final answer)'
    out = ARTIFACT_DIR / 'ux_agent_report.md'
    out.write_text(report)
    print('\n===== UX AGENT REPORT =====\n')
    print(report)
    print(f'\n(saved to {out}; run artifacts in {ARTIFACT_DIR})')
    return 0


if __name__ == '__main__':
    raise SystemExit(asyncio.run(main()))
