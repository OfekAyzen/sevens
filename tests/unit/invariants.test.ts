import { readFileSync, readdirSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { describe, expect, it } from 'vitest';

/**
 * Design guards.
 *
 * The product spec forbids specific strings and specific mechanics. Those rules
 * are easy to state and easy to erode six commits later, so they are asserted
 * here against the actual source tree rather than trusted to memory. A reviewer
 * who adds "Don't lose your streak!" to a component gets a red test, not a
 * polite comment.
 *
 * This is the file to read first if you want to understand what this app refuses
 * to do.
 */

function sourceFiles(dir = 'src'): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const path = join(dir, entry);
    if (statSync(path).isDirectory()) out.push(...sourceFiles(path));
    else if (/\.(ts|tsx|css)$/.test(entry) && !entry.endsWith('.test.ts')) out.push(path);
  }
  return out;
}

/**
 * Comments are stripped before scanning. Otherwise this file's own explanations
 * of what is banned — and the ADRs in the domain modules that say "currentRun
 * does not exist" — would trip their own guards. We police shipped code and
 * shipped strings, not the reasoning about them.
 */
function stripComments(source: string): string {
  return source
    .replace(/\/\*[\s\S]*?\*\//g, ' ')
    .replace(/(^|[^:\\])\/\/.*$/gm, '$1');
}

const files = sourceFiles();
const corpus = files.map((f) => ({
  file: f,
  text: stripComments(readFileSync(f, 'utf8')),
}));

/** Phrases that must never reach a user. Each maps to a rule in the spec. */
const BANNED_PHRASES: [RegExp, string][] = [
  [/streak/i, 'no streak framing at all — use "days practised" and "best run"'],
  [/don'?t lose/i, 'loss framing (rule 6)'],
  [/at risk/i, 'risk framing (rule 6)'],
  [/back to zero|start again/i, 'reset framing — nothing resets (rule 1)'],
  [/last place|you'?re behind|falling behind/i, 'rank shaming (rule 7)'],
  [/hours left|ends in \d|time'?s running out/i, 'countdown pressure (rule 6)'],
  [/we miss you|where have you been|come back/i, 're-engagement guilt (rule 6)'],
  [/are you sure you want to give up/i, 'confirmshaming (rule 10)'],
  [/build a lasting habit|form a habit in/i, 'false habit promise (rule 11)'],
  [/you failed|failed\b/i, 'failure framing (rule 8)'],
  [/nudge|poke them|remind them/i, 'peer-nudge weapon — forbidden mechanic'],
  [/mystery box|spin to win|surprise bonus/i, 'variable reward — forbidden mechanic'],
];

describe('banned copy', () => {
  for (const [pattern, why] of BANNED_PHRASES) {
    it(`never uses ${pattern} — ${why}`, () => {
      const hits = corpus
        .filter((c) => pattern.test(c.text))
        .map((c) => c.file);
      expect(hits, `${why}\nfound in: ${hits.join(', ')}`).toEqual([]);
    });
  }
});

describe('banned mechanics', () => {
  it('models no current-run or current-streak value anywhere', () => {
    // ADR-001. A value that can decrease will eventually be rendered.
    const hits = corpus.filter((c) => /current(Run|Streak)/.test(c.text)).map((c) => c.file);
    expect(hits).toEqual([]);
  });

  it('never aggregates minutes across people', () => {
    // The spec's rule: do not write the query. If it exists, a UI will surface it.
    const hits = corpus
      .filter((c) => /(total|sum|avg|average|rank|compare)[A-Za-z]*Minutes/i.test(c.text))
      .map((c) => c.file);
    expect(hits).toEqual([]);
  });

  it('exposes no sort of people by performance', () => {
    const hits = corpus
      .filter((c) => /sort[A-Za-z]*(?:By)?(?:Points|Score|Rank|Minutes|Days)/i.test(c.text))
      .map((c) => c.file);
    expect(hits).toEqual([]);
  });

  it('uses no flame or at-risk iconography', () => {
    const hits = corpus.filter((c) => /🔥|flame|fire-?icon/i.test(c.text)).map((c) => c.file);
    expect(hits).toEqual([]);
  });
});

describe('copy module', () => {
  it('holds at most one exclamation mark in the whole app (rule 9)', async () => {
    const { copy } = await import('../../src/domain/copy');
    const flat = JSON.stringify(copy);
    const bangs = (flat.match(/!/g) ?? []).length;
    expect(bangs, 'the single exclamation mark belongs to Day 7').toBeLessThanOrEqual(1);
  });

  it('centralises strings so this guard cannot be bypassed', () => {
    // Any component holding a long literal is a smell: the guard scans src/, but
    // reviewers should see strings in copy.ts. Flag literals over 60 chars in
    // components (paths under src/screens and src/ui).
    const offenders: string[] = [];
    for (const c of corpus) {
      if (!/^src\/(screens|ui)\//.test(c.file)) continue;
      const literals = c.text.match(/'[^'\n]{60,}'|"[^"\n]{60,}"/g) ?? [];
      const prose = literals.filter((l) => /[a-z] [a-z]+ [a-z]+ [a-z]/i.test(l));
      if (prose.length) offenders.push(`${c.file}: ${prose[0].slice(0, 50)}...`);
    }
    expect(offenders, 'move these into src/domain/copy.ts').toEqual([]);
  });
});
