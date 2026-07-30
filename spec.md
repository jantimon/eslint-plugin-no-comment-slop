# eslint-plugin-no-comment-slop — spec

Flag AI-generated comment slop in JavaScript and TypeScript: inflated wording, over-long comments, banner art, trailing comments, and syntax habits carried over from other languages. One plugin that runs unchanged in ESLint, oxlint, and rslint.

## Identity

| | |
|---|---|
| npm package | `eslint-plugin-no-comment-slop` (verified free on npm, 2026-07-30) |
| GitHub | `jantimon/eslint-plugin-no-comment-slop` (repo created locally, user pushes) |
| Rule prefix | `no-comment-slop/` via `meta.namespace` |
| First version | 0.1.0 |
| License | MIT |
| Runtime deps | none. No peerDependencies either — oxlint/rslint users must not be forced to install eslint |
| engines | `node >= 24` |

### Why this niche is open (research summary)

- The "AI slop" tools with traction (aislop, vibecheck, karpeslop, slop-scan) are standalone CLIs, not ESLint plugins. They get no editor squiggles, no `--fix`, no existing-pipeline integration.
- The only real ESLint plugin in the lane, `eslint-plugin-deslop`, ships a single rule (~1k downloads/week).
- ESLint deprecated its stylistic comment rules (`no-inline-comments`, `multiline-comment-style`, `line-comment-position`, …) into `@stylistic`; nobody owns comment hygiene as a focused plugin.
- Nobody covers: banner comments, em dashes in comments, trailing periods, foreign comment syntax (`///`, `<summary>`, `#region`), comment length budgets.

## Cross-linter support (the headline feature)

Write the plugin as one standard flat-config plugin object. That same module runs in:

- **ESLint 9 and 10** — flat config, `configs.recommended` via the self-reference pattern (build the plugin object, then `Object.assign(plugin.configs, …)` so the config can carry `plugins: { "no-comment-slop": plugin }` inline). `meta.name`, `meta.version`, `meta.namespace` all set.
- **oxlint** — `jsPlugins` (alpha since 2026-03). Loaded by npm package name in `.oxlintrc.json`. "no-comment-slop" is not an oxlint reserved plugin name.
- **rslint** (`@rslint/core`, web-infra) — runs community ESLint plugins with the ESLint v10 API surface via `plugins: { "no-comment-slop": plugin }` in its flat config.

Portability rules for the implementation:

- Use only `sourceCode.getAllComments()`, `sourceCode.text`, raw ranges, and a `Program` visitor (plus export-declaration visitors for `prefer-jsdoc-for-exports`). No `parserServices`, no code-path analysis, no custom parsers, no v9-removed APIs.
- v10-safe from the start: `context.sourceCode` with `context.getSourceCode()` fallback, `messageId`s everywhere.

## Rules (8)

Names follow ESLint conventions (`no-` disallows, `prefer-` demands a form, `max-` bounds) and collide with no existing rule in core, @stylistic, jsdoc, or unicorn.

All rules skip directive comments. Shared directive detection covers: `@ts-*`, `eslint-*`/`oxlint-*`/`biome-*` enable/disable lines, `tslint:`, `prettier-ignore`, `deno-lint-ignore`, coverage ignores (istanbul/c8/v8/node/jest/vitest), `globals`/`exported`, TS triple-slash directives, webpack magic comments, `@license`/`@preserve`, `#__PURE__`/`#__NO_SIDE_EFFECTS__`.

Runs of `//` lines on consecutive lines at the same indentation count as one comment block.

### 1. `max-comment-lines`

Limit how many lines a comment block may span.

- Options: `{ max: 3, headerMax: 5, jsdocSectionMax: 5 }`.
- A file header (only whitespace or a shebang before it) gets `headerMax`.
- JSDoc blocks are budgeted per section: a blank line ends a section, a line opening with `@tag` starts one. Decoration lines (`/**`, `*/`, bare `*` gutters) never count.
- No fix.

### 2. `no-banner-comment`

Disallow ASCII rulers (`// =========`) and fenced titles (`// --- helpers ---`).

- Options: `{ flagTitled: true, minLength: 3 }`.
- Fix: delete the line, only in the safe case (a `//` comment alone on its line). Titled banners report without fix — the heading text may be worth keeping.

### 3. `no-trailing-comment`

Disallow comments on the same line as code (`const foo = 1 // like this`).

- Message tells the user to move the comment above the line.
- No fix (moving text changes layout; not mechanically safe).

### 4. `prefer-jsdoc-for-exports`

When a `//` run documents an `export`, require a `/** */` block instead — editors only surface JSDoc in hover tooltips.

- Applies to `ExportNamedDeclaration` and `ExportDefaultDeclaration` with a `//` run ending on the line directly above.
- Fix: convert the run to a `/** */` block, preserving indentation.

### 5. `no-trailing-period`

Disallow a period at the end of a comment.

- Skips ellipses (`...`) and abbreviation endings (`e.g.`, `etc.`, `vs.`, …).
- Option: `{ includeJsdoc: true }`.
- Fix: remove the period.

### 6. `no-em-dash`

Disallow em dashes in comments. Scope stays the em dash only — no curly quotes, ellipsis chars, or emoji in v1.

- Options: `{ includeEnDash: false, replacement: "-" }`.
- Fix: replace with the configured replacement.

### 7. `no-jargon`

Disallow inflated vocabulary in comments.

- Default list stays short: only the undeniable tells, roughly 12 words. Proposal (drawn from the research tier-1 list and the no-ai-slop skill's banned list): `utilize`, `utilise`, `leverage`, `delve`, `facilitate`, `streamline`, `seamless`, `seamlessly`, `robust`, `comprehensive`, `meticulous`, `meticulously`, `crucial`, `pivotal`, `myriad`, `plethora`.
- Matching covers simple inflections (`utilizes`, `utilized`, `utilizing`, `leveraging`, `delves`, …) via suffix-tolerant word-boundary regex.
- The default list is a named export so users can extend or slice it.
- Options: `{ words, extraWords, allow, includeJsdoc }`. `words` replaces the list; `extraWords` adds; `allow` removes.
- Fires per word occurrence. Replacements (`utilize` → `use`) ship as editor suggestions, never as `--fix` — wording changes need a human.
- No phrases, tutorial-voice, or connective detection in v1. Candidates for later, kept out to hold precision.

### 8. `no-foreign-syntax`

Disallow comment syntax imported from other languages:

- `///` prose doc comments (Rust/C# habit). Valid TS triple-slash directives stay allowed: `/// <reference …>`, `/// <amd-module …>`, `/// <amd-dependency …>`.
- C# XML doc tags: `<summary>`, `<param>`, `<returns>`, `<remarks>`, `<see cref>` (never `<reference>`).
- `#region` / `#endregion` folding markers.
- Markdown headers/bold are out of scope (JSDoc renders markdown; too many legit uses).
- No fix for v1 (converting `///` docs to JSDoc is a candidate for later).

## Preset

One aggressive `recommended` config. Every rule at `"error"`, including `no-jargon`. The plugin is the opinion; users who disagree with a rule turn it off or allow-list words.

No `all` config, no legacy (`.eslintrc`) support.

## Messages

Opinionated with guidance: every message says what to do instead, in one sentence. Examples of the register:

- "Comment is {{lines}} lines (max {{max}}). If it needs this much explaining, put it in the docs and leave a link."
- "Use a /** */ block here — editors only show JSDoc in hover tooltips, not // comments."
- "“{{word}}” reads like generated prose. Say it plainly."

(Exception to the plugin's own no-em-dash rule inside message strings: don't use one. Messages must pass the plugin's own rules.)

## Implementation shape

- **One TypeScript source file** (`src/index.ts`) containing helpers, all 8 rules, and the plugin object. Readability of that single file is a feature.
- **One test file** (`src/index.test.ts`).
- Compiled with `tsc` to ESM JS + `.d.ts` in `dist/`. `type: "module"`, `exports` map, `files: ["dist"]`.
- Typecheck (`tsc --noEmit`) as its own script.
- Types via `@types/eslint` / `eslint` types (devDependency only).

## Testing

- **Unit**: `node:test` (built-in, zero framework deps) + ESLint `RuleTester`, which supports node:test. Valid/invalid cases per rule, fixture-style, including the landmine cases: TS triple-slash directives not flagged by `no-foreign-syntax`, directive comments skipped everywhere, abbreviations not flagged by `no-trailing-period`.
- **Integration matrix** (the proof of the headline claim): shared fixture files linted by real CLIs —
  - `eslint@9` and `eslint@10` (flat config)
  - `oxlint` via `jsPlugins`
  - `@rslint/core`
  - Each produces JSON diagnostics; the test asserts rule/line agreement across linters.
- **CI (GitHub Actions)**: PR CI runs pinned linter versions on Node 24. A weekly scheduled job runs latest eslint/oxlint/rslint and opens an issue on failure (oxlint jsPlugins is alpha, rslint is experimental — both can break under us). Renovate keeps pins fresh.

## README

Short: about one screen of prose plus a generated table.

1. One-line description.
2. **Before/after hook**: a compact AI-commented snippet next to the cleaned version. Sells the plugin in five seconds.
3. Install.
4. Usage: flat-config snippet (ESLint), then `.oxlintrc.json` snippet, then rslint snippet.
5. Rules table generated by `eslint-doc-generator` with the emoji legend (✅ recommended, 🔧 fixable, 💡 suggestions), linking to `docs/rules/<rule>.md`.
6. One `docs/rules/<rule>.md` per rule: short description, ❌/✅ examples, options. The opinionated voice lives here.

CI runs `eslint-doc-generator --check` so the table can't drift.

## Repo tooling

- pnpm.
- `changesets` + GitHub Actions release: release PR, `npm publish` with provenance via npm trusted publishing (OIDC).
- **Dogfooding**: the repo's own eslint config runs `no-comment-slop` recommended (all error) on its own source, plus `eslint-plugin-eslint-plugin` to lint the rule implementations. The repo is its own demo.
- Before the first release: run the `/no-ai-slop` skill over the README and every code comment in the plugin.

## Out of scope for v1

- Curly quotes / unicode ellipsis / emoji detection (research says these are the highest-precision tells; strongest candidate for 0.2).
- Redundant-comment detection (comment restates the code) — `eslint-plugin-deslop` territory.
- Phrase/tutorial-voice jargon tiers.
- Biome (needs a separate GritQL port, not a JS plugin).
- Markdown-in-comment rules.

## Build order

1. Scaffold repo (package.json, tsconfig, license, pnpm, changesets, CI skeleton).
2. Port the draft into `src/index.ts`: rename rules, drop the dropped scope, add `no-foreign-syntax`, shorten the jargon list, adjust fixers/suggestions per this spec.
3. Unit tests until every rule's edge cases are covered.
4. Integration fixtures + the four-linter matrix.
5. Docs: `docs/rules/*.md`, README with before/after, generated table.
6. Dogfood pass, then `/no-ai-slop` pass on README and comments.
7. Tag 0.1.0, user pushes and publishes.
