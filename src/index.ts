/**
 * Flags AI comment slop in JavaScript and TypeScript comments
 *
 * Rules use only `sourceCode.getAllComments()`, `sourceCode.text` and raw
 * ranges, so the same module runs in ESLint 9 and 10, oxlint (jsPlugins)
 * and rslint
 */
import type { Rule } from "eslint";
import type { SourceLocation, Position } from "estree";

interface CommentToken {
  type: string;
  value: string;
  range: [number, number];
  loc: SourceLocation;
}

interface PortableSourceCode {
  text?: string;
  getText(): string;
  getAllComments(): CommentToken[];
}

/**
 * Machine-readable instruction comments, skipped by every rule. Only the
 * TypeScript directives start with `@`; eslint, tslint and oxlint directives
 * do not, so matching on `@` alone would miss most of them
 */
const DIRECTIVE = new RegExp(
  [
    /^\s*@ts-(?:ignore|expect-error|nocheck|check)/,
    /^\s*@(?:type|typedef|satisfies|license|preserve|jsx|jsxImportSource|vite-ignore|vue-ignore|__PURE__)\b/,
    /^\s*#__(?:PURE|NO_SIDE_EFFECTS)__/,
    /^\s*(?:eslint|oxlint|biome)-(?:disable|enable)/,
    /^\s*eslint(?:\s|-env\b|$)/,
    /^\s*tslint:/,
    /^\s*biome-ignore/,
    /^\s*(?:prettier|deno-lint|deno-fmt)-ignore/,
    /^\s*(?:istanbul|c8|v8|node|jest|vitest)\s+ignore/,
    /^\s*(?:globals?|exported)\s/,
    /^\s*\/\s*<(?:reference|amd-module|amd-dependency)\b/,
    /^\s*webpack[A-Z]/,
  ]
    .map((r) => `(?:${r.source})`)
    .join("|"),
  "i",
);

const isDirective = (comment: CommentToken): boolean => DIRECTIVE.test(comment.value);

const isJsdoc = (comment: CommentToken): boolean =>
  comment.type === "Block" && comment.value.startsWith("*");

function getSource(context: Rule.RuleContext): PortableSourceCode {
  const anyContext = context as unknown as {
    sourceCode?: PortableSourceCode;
    getSourceCode(): PortableSourceCode;
  };
  return anyContext.sourceCode ?? anyContext.getSourceCode();
}

const sourceText = (sourceCode: PortableSourceCode): string =>
  typeof sourceCode.text === "string" ? sourceCode.text : sourceCode.getText();

function getComments(sourceCode: PortableSourceCode): CommentToken[] {
  return sourceCode
    .getAllComments()
    .filter((comment) => comment.type === "Line" || comment.type === "Block");
}

/** Offset of the start of the line containing `index` */
function lineStart(text: string, index: number): number {
  const nl = text.lastIndexOf("\n", index - 1);
  return nl === -1 ? 0 : nl + 1;
}

/** True when there is code on the same line before the comment */
function isTrailing(text: string, comment: CommentToken): boolean {
  return text.slice(lineStart(text, comment.range[0]), comment.range[0]).trim() !== "";
}

/** `comment.value` starts 2 chars after the comment token (`//` or the block opener) */
const VALUE_OFFSET = 2;

/** Map an index inside `comment.value` to a `{ line, column }` loc */
function locAt(comment: CommentToken, index: number): Position {
  const before = comment.value.slice(0, index);
  const nl = before.lastIndexOf("\n");
  if (nl === -1) {
    return {
      line: comment.loc.start.line,
      column: comment.loc.start.column + VALUE_OFFSET + index,
    };
  }
  let line = comment.loc.start.line;
  for (const ch of before) if (ch === "\n") line++;
  return { line, column: index - nl - 1 };
}

const spanAt = (comment: CommentToken, index: number, length: number): SourceLocation => ({
  start: locAt(comment, index),
  end: locAt(comment, index + length),
});

const rangeAt = (comment: CommentToken, index: number, length: number): [number, number] => [
  comment.range[0] + VALUE_OFFSET + index,
  comment.range[0] + VALUE_OFFSET + index + length,
];

/**
 * Group comments into blocks: a run of `//` lines at the same indentation on
 * consecutive lines is one block. Block comments and trailing comments stand
 * alone
 */
function commentBlocks(text: string, comments: CommentToken[]): CommentToken[][] {
  const blocks: CommentToken[][] = [];
  let run: CommentToken[] | null = null;
  for (const comment of comments) {
    if (comment.type === "Block" || isTrailing(text, comment)) {
      blocks.push([comment]);
      run = null;
      continue;
    }
    const prev = run && run[run.length - 1];
    if (
      prev &&
      prev.loc.end.line + 1 === comment.loc.start.line &&
      prev.loc.start.column === comment.loc.start.column
    ) {
      (run as CommentToken[]).push(comment);
    } else {
      run = [comment];
      blocks.push(run);
    }
  }
  return blocks;
}

const blockLoc = (block: CommentToken[]): SourceLocation => ({
  start: block[0]!.loc.start,
  end: block[block.length - 1]!.loc.end,
});

interface CommentLine {
  text: string;
  blank: boolean;
  line: number;
  column: number;
  endColumn: number;
}

/**
 * Split a comment into physical lines, stripping comment markers and `*`
 * gutters. Decoration-only lines come back blank, so JSDoc fence lines never
 * count toward a budget
 */
function commentLines(comment: CommentToken): CommentLine[] {
  return comment.value.split("\n").map((raw, index) => {
    const text = raw.replace(/^\s*\*+/, "").trim();
    const first = index === 0;
    return {
      text,
      blank: text === "",
      line: comment.loc.start.line + index,
      column: first ? comment.loc.start.column : 0,
      endColumn: first ? comment.loc.start.column + VALUE_OFFSET + raw.length : raw.length,
    };
  });
}

/**
 * Group comment lines into sections: a blank line ends a section and a line
 * opening with an `@tag` starts a new one, so a description and its tags get
 * separate budgets
 */
function splitSections(lines: CommentLine[]): CommentLine[][] {
  const sections: CommentLine[][] = [];
  let current: CommentLine[] | null = null;
  for (const line of lines) {
    if (line.blank) {
      current = null;
      continue;
    }
    if (!current || /^@\w/.test(line.text)) {
      current = [];
      sections.push(current);
    }
    current.push(line);
  }
  return sections;
}

/** Drop fence delimiters and everything between them, so code samples never count */
function withoutFencedCode(lines: CommentLine[]): CommentLine[] {
  const kept: CommentLine[] = [];
  let inFence = false;
  for (const line of lines) {
    if (line.text.startsWith("```")) {
      inFence = !inFence;
      continue;
    }
    if (!inFence) kept.push(line);
  }
  return kept;
}

const isExampleSection = (section: CommentLine[]): boolean =>
  /^@example\b/.test(section[0]!.text);

const sectionLoc = (section: CommentLine[]): SourceLocation => ({
  start: { line: section[0]!.line, column: section[0]!.column },
  end: {
    line: section[section.length - 1]!.line,
    column: section[section.length - 1]!.endColumn,
  },
});

/** True when nothing but whitespace and an optional shebang precedes the comment */
function isFileHeader(text: string, comment: CommentToken): boolean {
  return /^\s*(?:#![^\n]*\n\s*)?$/.test(text.slice(0, comment.range[0]));
}

const docsUrl = (name: string): string =>
  `https://github.com/jantimon/eslint-plugin-no-comment-slop/blob/main/docs/rules/${name}.md`;

interface MaxCommentLinesOptions {
  max?: number;
  headerMax?: number;
  jsdocSectionMax?: number;
  exportDescriptionMax?: number;
  exportTagMax?: number;
}

const maxCommentLines: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Limit how many lines a comment may span",
      recommended: true,
      url: docsUrl("max-comment-lines"),
    },
    schema: [
      {
        type: "object",
        properties: {
          max: { type: "integer", minimum: 1 },
          headerMax: { type: "integer", minimum: 1 },
          jsdocSectionMax: { type: "integer", minimum: 1 },
          exportDescriptionMax: { type: "integer", minimum: 1 },
          exportTagMax: { type: "integer", minimum: 1 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      tooLong:
        "Comment is {{lines}} lines (max {{max}}). If it needs this much explaining, put it in the docs and leave a link",
      sectionTooLong:
        "This JSDoc section is {{lines}} lines (max {{max}}). Break it up with a blank line or move it to the docs",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as MaxCommentLinesOptions;
    const max = options.max ?? 3;
    const headerMax = options.headerMax ?? 5;
    const jsdocSectionMax = options.jsdocSectionMax ?? 5;
    const exportDescriptionMax = options.exportDescriptionMax ?? 10;
    const exportTagMax = options.exportTagMax ?? 7;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const exportLines = new Set<number>();

    const collect = (node: { loc?: SourceLocation | null | undefined }): void => {
      if (node.loc) exportLines.add(node.loc.start.line);
    };

    return {
      ExportNamedDeclaration: collect,
      ExportDefaultDeclaration: collect,

      "Program:exit"() {
        for (const block of commentBlocks(text, getComments(sourceCode))) {
          if (block.some(isDirective)) continue;
          const limit = isFileHeader(text, block[0]!) ? headerMax : max;

          if (isJsdoc(block[0]!)) {
            const comment = block[0]!;
            const documentsExport = exportLines.has(comment.loc.end.line + 1);
            const lines = withoutFencedCode(commentLines(comment));
            for (const section of splitSections(lines)) {
              if (isExampleSection(section)) continue;
              const isTag = /^@\w/.test(section[0]!.text);
              const sectionMax = documentsExport
                ? isTag
                  ? exportTagMax
                  : exportDescriptionMax
                : jsdocSectionMax;
              if (section.length > sectionMax) {
                context.report({
                  loc: sectionLoc(section),
                  messageId: "sectionTooLong",
                  data: { lines: String(section.length), max: String(sectionMax) },
                });
              }
            }
            continue;
          }

          const lines = withoutFencedCode(block.flatMap(commentLines)).filter(
            (line) => !line.blank,
          );
          if (lines.length > limit) {
            context.report({
              loc: blockLoc(block),
              messageId: "tooLong",
              data: { lines: String(lines.length), max: String(limit) },
            });
          }
        }
      },
    };
  },
};

/** Three or more of the same punctuation character, alone on the line */
const RULER = /^([-=*_~#+/\\.<>|:•])\1{2,}$/;

/** A title fenced by punctuation, like `--- helpers ---` or `=== SECTION ===` */
const TITLED = /^([-=*_~#+/\\|<>]){3,}[^\n]*?\1{3,}$/;

interface BannerOptions {
  flagTitled?: boolean;
  minLength?: number;
}

const noBannerComment: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Disallow ASCII separator and banner comments",
      recommended: true,
      url: docsUrl("no-banner-comment"),
    },
    schema: [
      {
        type: "object",
        properties: {
          flagTitled: { type: "boolean" },
          minLength: { type: "integer", minimum: 2 },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      ruler: "No separator comments. Use a blank line, or split the file",
      titled: "No banner comments. Write the heading without the ASCII fencing",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as BannerOptions;
    const flagTitled = options.flagTitled ?? true;
    const minLength = options.minLength ?? 3;
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);

    const ruler =
      minLength === 3
        ? RULER
        : new RegExp(`^([-=*_~#+/\\\\.<>|•])\\1{${minLength - 1},}$`);

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;

          for (const line of commentLines(comment)) {
            if (line.blank) continue;

            const isRuler = ruler.test(line.text);
            if (!isRuler && !(flagTitled && TITLED.test(line.text))) continue;

            const report: Parameters<typeof context.report>[0] = {
              loc: {
                start: { line: line.line, column: line.column },
                end: { line: line.line, column: line.endColumn },
              },
              messageId: isRuler ? "ruler" : "titled",
            };

            const solo =
              comment.type === "Line" &&
              !isTrailing(text, comment) &&
              /^[ \t]*(\r?\n|$)/.exec(text.slice(comment.range[1]));
            if (solo) {
              const start = lineStart(text, comment.range[0]);
              const end = comment.range[1] + solo[0].length;
              report.fix = (fixer) => fixer.removeRange([start, end]);
            }

            context.report(report);
          }
        }
      },
    };
  },
};

const noTrailingComment: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comments on the same line as code",
      recommended: true,
      url: docsUrl("no-trailing-comment"),
    },
    schema: [],
    messages: {
      trailing: "Move this comment onto its own line above the code",
    },
  },
  create(context) {
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;
          if (isTrailing(text, comment)) {
            context.report({ loc: comment.loc, messageId: "trailing" });
          }
        }
      },
    };
  },
};

const preferJsdocForExports: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Require /** */ rather than // for the comment documenting an export",
      recommended: true,
      url: docsUrl("prefer-jsdoc-for-exports"),
    },
    schema: [],
    messages: {
      useJsdoc:
        "Use a /** */ block here: editors only show JSDoc in hover tooltips, not // comments",
    },
  },
  create(context) {
    const sourceCode = getSource(context);
    const text = sourceText(sourceCode);
    const exports: { loc: SourceLocation }[] = [];

    const collect = (node: { loc?: SourceLocation | null | undefined }): void => {
      if (node.loc) exports.push({ loc: node.loc });
    };

    return {
      ExportNamedDeclaration: collect,
      ExportDefaultDeclaration: collect,

      "Program:exit"() {
        if (exports.length === 0) return;

        const lineRuns = commentBlocks(text, getComments(sourceCode)).filter(
          (block) => block[0]!.type === "Line" && !isTrailing(text, block[0]!),
        );

        for (const node of exports) {
          const run = lineRuns.find(
            (block) => block[block.length - 1]!.loc.end.line === node.loc.start.line - 1,
          );
          if (!run || run.some(isDirective)) continue;

          const first = run[0]!;
          const last = run[run.length - 1]!;
          const indent = text.slice(lineStart(text, first.range[0]), first.range[0]);
          const body = run
            .map((comment) => `${indent} * ${comment.value.trim()}`.trimEnd())
            .join("\n");

          context.report({
            loc: blockLoc(run),
            messageId: "useJsdoc",
            fix: (fixer) =>
              fixer.replaceTextRange(
                [first.range[0], last.range[1]],
                `/**\n${body}\n${indent} */`,
              ),
          });
        }
      },
    };
  },
};

/** Endings where the final `.` is part of the token, not sentence punctuation */
const ABBREVIATION =
  /(?:\be\.g|\bi\.e|\betc|\bvs|\bapprox|\bapp|\bmax|\bmin|\bInc|\bLtd|\bal|\bAve|\bcf|\bfig|\bref)\.$/i;

interface TrailingPeriodOptions {
  includeJsdoc?: boolean;
}

const noTrailingPeriod: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    fixable: "whitespace",
    docs: {
      description: "Disallow a trailing period at the end of a comment",
      recommended: true,
      url: docsUrl("no-trailing-period"),
    },
    schema: [
      {
        type: "object",
        properties: { includeJsdoc: { type: "boolean" } },
        additionalProperties: false,
      },
    ],
    messages: { period: "Drop the trailing period" },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as TrailingPeriodOptions;
    const includeJsdoc = options.includeJsdoc ?? true;
    const sourceCode = getSource(context);

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;
          if (!includeJsdoc && isJsdoc(comment)) continue;

          const value = comment.value;
          let i = value.length - 1;
          while (i >= 0 && (value[i] === "*" || /\s/.test(value[i]!))) i--;
          if (i < 0 || value[i] !== ".") continue;

          const upTo = value.slice(0, i + 1);
          if (upTo.endsWith("..")) continue;
          if (ABBREVIATION.test(upTo)) continue;

          context.report({
            loc: spanAt(comment, i, 1),
            messageId: "period",
            fix: (fixer) => fixer.removeRange(rangeAt(comment, i, 1)),
          });
        }
      },
    };
  },
};

interface EmDashOptions {
  includeEnDash?: boolean;
  replacement?: string;
}

const noEmDash: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    fixable: "code",
    docs: {
      description: "Disallow em dashes (and optionally en dashes) in comments",
      recommended: true,
      url: docsUrl("no-em-dash"),
    },
    schema: [
      {
        type: "object",
        properties: {
          includeEnDash: { type: "boolean" },
          replacement: { type: "string" },
        },
        additionalProperties: false,
      },
    ],
    messages: { dash: "Use a plain hyphen instead of {{name}}" },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as EmDashOptions;
    const includeEnDash = options.includeEnDash ?? false;
    const replacement = options.replacement ?? "-";
    const sourceCode = getSource(context);
    const chars = includeEnDash ? /[—–]/g : /—/g;

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;

          chars.lastIndex = 0;
          let match;
          while ((match = chars.exec(comment.value)) !== null) {
            const index = match.index;
            context.report({
              loc: spanAt(comment, index, 1),
              messageId: "dash",
              data: { name: match[0] === "—" ? "an em dash" : "an en dash" },
              fix: (fixer) =>
                fixer.replaceTextRange(rangeAt(comment, index, 1), replacement),
            });
          }
        }
      },
    };
  },
};

/** The undeniable tells only; anything debatable stays out of the default list */
export const defaultJargonWords = [
  "utilize",
  "utilise",
  "leverage",
  "delve",
  "facilitate",
  "streamline",
  "seamless",
  "seamlessly",
  "robust",
  "comprehensive",
  "meticulous",
  "meticulously",
  "crucial",
  "pivotal",
  "myriad",
  "plethora",
];

const SUGGESTIONS: Record<string, string> = {
  utilize: "use",
  utilise: "use",
  leverage: "use",
  facilitate: "help",
};

const escapeRe = (s: string): string => s.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");

/** Also match simple inflections (s, es, ed, ing) of each listed word */
function wordPattern(word: string): string {
  const escaped = escapeRe(word);
  if (/e$/i.test(word)) return `${escaped.slice(0, -1)}(?:e|es|ed|ing)`;
  return `${escaped}(?:s|es|ed|ing)?`;
}

function jargonRegex(words: string[]): RegExp {
  const alternatives = words
    .slice()
    .sort((a, b) => b.length - a.length)
    .map(wordPattern);
  return new RegExp(`(?<![\\w-])(?:${alternatives.join("|")})(?![\\w-])`, "giu");
}

interface JargonOptions {
  words?: string[];
  extraWords?: string[];
  allow?: string[];
  includeJsdoc?: boolean;
}

const noJargon: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    hasSuggestions: true,
    docs: {
      description: "Disallow inflated vocabulary in comments",
      recommended: true,
      url: docsUrl("no-jargon"),
    },
    schema: [
      {
        type: "object",
        properties: {
          words: { type: "array", items: { type: "string" } },
          extraWords: { type: "array", items: { type: "string" } },
          allow: { type: "array", items: { type: "string" } },
          includeJsdoc: { type: "boolean" },
        },
        additionalProperties: false,
      },
    ],
    messages: {
      jargon: "“{{word}}” reads like generated prose. Say it plainly",
      replaceWith: "Replace with “{{with}}”",
    },
  },
  create(context) {
    const options = (context.options[0] ?? {}) as JargonOptions;
    const words = options.words ?? defaultJargonWords;
    const extraWords = options.extraWords ?? [];
    const allow = options.allow ?? [];
    const includeJsdoc = options.includeJsdoc ?? true;

    const denied = [...words, ...extraWords].filter(
      (word) => !allow.some((a) => a.toLowerCase() === word.toLowerCase()),
    );
    if (denied.length === 0) return {};

    const pattern = jargonRegex(denied);
    const sourceCode = getSource(context);

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;
          if (!includeJsdoc && isJsdoc(comment)) continue;

          pattern.lastIndex = 0;
          let match;
          while ((match = pattern.exec(comment.value)) !== null) {
            const word = match[0];
            const index = match.index;
            const replacement = SUGGESTIONS[word.toLowerCase()];

            const report: Parameters<typeof context.report>[0] = {
              loc: spanAt(comment, index, word.length),
              messageId: "jargon",
              data: { word },
            };

            if (replacement !== undefined) {
              const range = rangeAt(comment, index, word.length);
              report.suggest = [
                {
                  messageId: "replaceWith",
                  data: { with: replacement },
                  fix: (fixer) => fixer.replaceTextRange(range, replacement),
                },
              ];
            }

            context.report(report);
          }
        }
      },
    };
  },
};

const XML_DOC_TAG =
  /<\/?summary>|<\/?remarks>|<param\s+name=|<\/?returns>|<typeparam\b|<inheritdoc\b|<see\s+cref\b/i;

const REGION = /^\s*#\s*(?:end)?region\b/;

const noForeignSyntax: Rule.RuleModule = {
  meta: {
    type: "suggestion",
    docs: {
      description: "Disallow comment syntax imported from other languages",
      recommended: true,
      url: docsUrl("no-foreign-syntax"),
    },
    schema: [],
    messages: {
      tripleSlash:
        "Use /** */ for doc comments: /// is Rust and C# syntax and JS tooling ignores it",
      xmlDoc: "Use JSDoc tags instead of C# XML doc tags",
      region: "Drop the {{marker}} marker: split the file instead of folding it",
    },
  },
  create(context) {
    const sourceCode = getSource(context);

    return {
      Program() {
        for (const comment of getComments(sourceCode)) {
          if (isDirective(comment)) continue;

          if (comment.type === "Line" && comment.value.startsWith("/")) {
            context.report({ loc: comment.loc, messageId: "tripleSlash" });
            continue;
          }

          if (comment.type === "Line") {
            const region = REGION.exec(comment.value);
            if (region) {
              context.report({
                loc: comment.loc,
                messageId: "region",
                data: { marker: region[0].trim() },
              });
              continue;
            }
          }

          const match = XML_DOC_TAG.exec(comment.value);
          if (match) {
            context.report({
              loc: spanAt(comment, match.index, match[0].length),
              messageId: "xmlDoc",
            });
          }
        }
      },
    };
  },
};

const plugin = {
  meta: {
    name: "eslint-plugin-no-comment-slop",
    version: "0.1.0",
    namespace: "no-comment-slop",
  },
  rules: {
    "max-comment-lines": maxCommentLines,
    "no-banner-comment": noBannerComment,
    "no-trailing-comment": noTrailingComment,
    "prefer-jsdoc-for-exports": preferJsdocForExports,
    "no-trailing-period": noTrailingPeriod,
    "no-em-dash": noEmDash,
    "no-jargon": noJargon,
    "no-foreign-syntax": noForeignSyntax,
  },
  configs: {} as Record<string, unknown>,
};

Object.assign(plugin.configs, {
  recommended: {
    name: "no-comment-slop/recommended",
    plugins: { "no-comment-slop": plugin },
    rules: {
      "no-comment-slop/max-comment-lines": "error",
      "no-comment-slop/no-banner-comment": "error",
      "no-comment-slop/no-trailing-comment": "error",
      "no-comment-slop/prefer-jsdoc-for-exports": "error",
      "no-comment-slop/no-trailing-period": "error",
      "no-comment-slop/no-em-dash": "error",
      "no-comment-slop/no-jargon": "error",
      "no-comment-slop/no-foreign-syntax": "error",
    },
  },
});

export const { meta, rules, configs } = plugin;

export default plugin;
