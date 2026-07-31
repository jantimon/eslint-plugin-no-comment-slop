import { test } from "node:test";
import assert from "node:assert/strict";
import { RuleTester } from "eslint";
import plugin, { defaultJargonWords } from "./index.ts";

const ruleTester = new RuleTester({
  languageOptions: { ecmaVersion: 2024, sourceType: "module" },
});

const rule = (name: string) => {
  const found = plugin.rules[name as keyof typeof plugin.rules];
  assert.ok(found, `rule ${name} exists`);
  return found;
};

test("plugin shape", () => {
  assert.equal(plugin.meta.name, "eslint-plugin-no-comment-slop");
  assert.equal(plugin.meta.namespace, "no-comment-slop");
  assert.equal(Object.keys(plugin.rules).length, 8);
  const recommended = (plugin.configs as Record<string, { rules: Record<string, string> }>)
    .recommended;
  assert.ok(recommended);
  assert.equal(Object.keys(recommended.rules).length, 8);
  assert.ok(defaultJargonWords.includes("utilize"));
});

test("max-comment-lines", () => {
  ruleTester.run("max-comment-lines", rule("max-comment-lines"), {
    valid: [
      "// one\n// two\n// three\nconst a = 1;",
      "/** short */\nconst a = 1;",
      "// header line one\n// header line two\n// header line three\n// header line four\n// header line five\nconst a = 1;",
      "/**\n * one\n * two\n * three\n *\n * @param x four\n * five\n */\nfunction f(x) { return x; }",
      "// eslint-disable-next-line no-console\n// oxlint-disable-next-line foo\n// prettier-ignore\n// @ts-expect-error\nconst a = 1;",
      "/**\n * one\n * two\n * three\n * four\n * five\n * six\n * seven\n * eight\n */\nexport const a = 1;",
      "const b = 2;\n/**\n * one\n * two\n * three\n * four\n * five\n * six\n * seven\n * eight\n */\n\nexport const a = 1;",
      "/**\n * short\n *\n * @param x one\n * two\n * three\n * four\n * five\n * six\n */\nexport function f(x) { return x; }",
      "/**\n * short\n *\n * @example\n * a\n * b\n * c\n * d\n * e\n * f\n * g\n * h\n */\nconst a = 1;",
      "/**\n * short\n *\n * ```js\n * a\n * b\n * c\n * d\n * e\n * f\n * ```\n */\nconst a = 1;",
      "// one\n// ```\n// a\n// b\n// c\n// d\n// ```\n// two\nconst a = 1;",
    ],
    invalid: [
      {
        code: "const a = 1;\n// one\n// two\n// three\n// four\nconst b = 2;",
        errors: [{ messageId: "tooLong", data: { lines: "4", max: "3" } }],
      },
      {
        code: "const a = 1;\n/* one\ntwo\nthree\nfour */\nconst b = 2;",
        errors: [{ messageId: "tooLong" }],
      },
      {
        code: "/**\n * one\n * two\n * three\n * four\n * five\n * six\n */\nconst a = 1;",
        errors: [{ messageId: "sectionTooLong", data: { lines: "6", max: "5" } }],
      },
      {
        code: "const a = 1;\n// one\n// two\nconst b = 2;",
        options: [{ max: 1 }],
        errors: [{ messageId: "tooLong" }],
      },
      {
        code: "/**\n * 1\n * 2\n * 3\n * 4\n * 5\n * 6\n * 7\n * 8\n * 9\n * 10\n * 11\n */\nexport const a = 1;",
        errors: [{ messageId: "sectionTooLong", data: { lines: "11", max: "10" } }],
      },
      {
        code: "/**\n * short\n *\n * @param x 1\n * 2\n * 3\n * 4\n * 5\n * 6\n * 7\n * 8\n */\nexport function f(x) { return x; }",
        errors: [{ messageId: "sectionTooLong", data: { lines: "8", max: "7" } }],
      },
    ],
  });
});

test("no-banner-comment", () => {
  ruleTester.run("no-banner-comment", rule("no-banner-comment"), {
    valid: [
      "// a normal comment\nconst a = 1;",
      "// -- two dashes are fine\nconst a = 1;",
      "/** normal jsdoc */\nconst a = 1;",
    ],
    invalid: [
      {
        code: "// ==========\nconst a = 1;",
        errors: [{ messageId: "ruler" }],
        output: "const a = 1;",
      },
      {
        code: "// --- helpers ---\nconst a = 1;",
        errors: [{ messageId: "titled" }],
        output: "// helpers\nconst a = 1;",
      },
      {
        code: "// ==== DOM setup (one-time geometry) ====\nconst a = 1;",
        errors: [{ messageId: "titled" }],
        output: "// DOM setup (one-time geometry)\nconst a = 1;",
      },
      {
        code: "/* ========== */\nconst a = 1;",
        errors: [{ messageId: "ruler" }],
      },
      {
        code: "// ----------\nconst a = 1;",
        options: [{ flagTitled: false }],
        errors: [{ messageId: "ruler" }],
        output: "const a = 1;",
      },
    ],
  });
});

test("no-trailing-comment", () => {
  ruleTester.run("no-trailing-comment", rule("no-trailing-comment"), {
    valid: [
      "// above the code\nconst a = 1;",
      "const a = 1; // eslint-disable-line no-console",
      "const a = 1;\n/* standalone */",
      'const QUOTE = 0x22; // "',
      "const COMMA = 0x2c; // ,",
    ],
    invalid: [
      {
        code: "const a = 1; // trailing",
        errors: [{ messageId: "trailing" }],
      },
      {
        code: 'const QUOTE = 0x22; // "',
        options: [{ allowShort: 0 }],
        errors: [{ messageId: "trailing" }],
      },
      {
        code: "const a = 1; /* trailing block */",
        errors: [{ messageId: "trailing" }],
      },
    ],
  });
});

test("prefer-jsdoc-for-exports", () => {
  ruleTester.run("prefer-jsdoc-for-exports", rule("prefer-jsdoc-for-exports"), {
    valid: [
      "/** documented */\nexport const a = 1;",
      "export const a = 1;",
      "// eslint-disable-next-line no-console\nexport const a = 1;",
      "// Copyright 2026 Jan Nicklas\n\nexport const a = 1;",
      "// SPDX-License-Identifier: MIT\nexport const a = 1;",
      "// note\n\n/** documented */\nexport const a = 1;",
      "// about b\nconst b = 2;\n\nexport const a = 1;",
      "// module header describing the file\n\nexport const a = 1;",
    ],
    invalid: [
      {
        code: "// docs for a\nexport const a = 1;",
        errors: [{ messageId: "useJsdoc" }],
        output: "/**\n * docs for a\n */\nexport const a = 1;",
      },
      {
        code: "// line one\n// line two\nexport default function f() {}",
        errors: [{ messageId: "useJsdoc" }],
        output: "/**\n * line one\n * line two\n */\nexport default function f() {}",
      },
      {
        code: "const b = 2;\n\n// docs with a gap\n\nexport const a = 1;",
        errors: [{ messageId: "useJsdoc" }],
        output: "const b = 2;\n\n/**\n * docs with a gap\n */\nexport const a = 1;",
      },
      {
        code: "function wrap() {}\n\n  // indented docs\n\n  export const a = 1;",
        errors: [{ messageId: "useJsdoc" }],
        output: "function wrap() {}\n\n  /**\n   * indented docs\n   */\n  export const a = 1;",
      },
    ],
  });
});

test("no-trailing-period", () => {
  ruleTester.run("no-trailing-period", rule("no-trailing-period"), {
    valid: [
      "// no period\nconst a = 1;",
      "// trailing ellipsis...\nconst a = 1;",
      "// see e.g.\nconst a = 1;",
      "// retries etc.\nconst a = 1;",
      "// First sentence here. Second sentence here.\nconst a = 1;",
      {
        code: "/** jsdoc sentence. */\nconst a = 1;",
        options: [{ includeJsdoc: false }],
      },
    ],
    invalid: [
      {
        code: "// ends with a period.\nconst a = 1;",
        errors: [{ messageId: "period" }],
        output: "// ends with a period\nconst a = 1;",
      },
      {
        code: "/** jsdoc sentence. */\nconst a = 1;",
        errors: [{ messageId: "period" }],
        output: "/** jsdoc sentence */\nconst a = 1;",
      },
      {
        code: "// First sentence here. Second sentence here.\nconst a = 1;",
        options: [{ ignoreMultiSentence: false }],
        errors: [{ messageId: "period" }],
        output: "// First sentence here. Second sentence here\nconst a = 1;",
      },
    ],
  });
});

test("no-em-dash", () => {
  ruleTester.run("no-em-dash", rule("no-em-dash"), {
    valid: [
      "// plain hyphen - fine\nconst a = 1;",
      "// en dash – allowed by default\nconst a = 1;",
      "// prints `—` when a value is not measured\nconst a = 1;",
      '// shows "—" for gaps in the table\nconst a = 1;',
    ],
    invalid: [
      {
        code: "// em dash — not fine\nconst a = 1;",
        errors: [{ messageId: "dash", data: { name: "an em dash" } }],
      },
      {
        code: "// en dash – flagged now\nconst a = 1;",
        options: [{ includeEnDash: true }],
        errors: [{ messageId: "dash", data: { name: "an en dash" } }],
      },
      {
        code: "// two — dashes — here\nconst a = 1;",
        errors: [{ messageId: "dash" }, { messageId: "dash" }],
      },
    ],
  });
});

test("no-jargon", () => {
  ruleTester.run("no-jargon", rule("no-jargon"), {
    valid: [
      "// use the helper\nconst a = 1;",
      "// the leverageRatio field stays untouched\nconst leverageRatio = 1;",
      "// the word `robust` appears quoted here\nconst a = 1;",
      {
        code: "// robust is allowed here\nconst a = 1;",
        options: [{ allow: ["robust"] }],
      },
      {
        code: "// utilize is fine with a custom list\nconst a = 1;",
        options: [{ words: ["synergy"] }],
      },
    ],
    invalid: [
      {
        code: "// utilize the helper\nconst a = 1;",
        errors: [
          {
            messageId: "jargonSuggest",
            data: { word: "utilize", with: "use" },
            suggestions: [
              {
                messageId: "replaceWith",
                data: { with: "use" },
                output: "// use the helper\nconst a = 1;",
              },
            ],
          },
        ],
      },
      {
        code: "// utilizes the helper\nconst a = 1;",
        errors: [{ messageId: "jargon", data: { word: "utilizes" }, suggestions: [] }],
      },
      {
        code: "// delving into robust seams\nconst a = 1;",
        errors: [
          { messageId: "jargon", data: { word: "delving" } },
          { messageId: "jargon", data: { word: "robust" } },
        ],
      },
      {
        code: "// synergy everywhere\nconst a = 1;",
        options: [{ words: [], extraWords: ["synergy"] }],
        errors: [{ messageId: "jargon", data: { word: "synergy" } }],
      },
    ],
  });
});

test("no-foreign-syntax", () => {
  ruleTester.run("no-foreign-syntax", rule("no-foreign-syntax"), {
    valid: [
      '/// <reference path="./globals.d.ts" />\nconst a = 1;',
      '/// <amd-module name="foo" />\nconst a = 1;',
      "// a normal comment\nconst a = 1;",
      "/** @param x the input */\nfunction f(x) { return x; }",
    ],
    invalid: [
      {
        code: "/// Returns the answer\nconst a = 1;",
        errors: [{ messageId: "tripleSlash" }],
      },
      {
        code: "//#region helpers\nconst a = 1;\n//#endregion",
        errors: [{ messageId: "region" }, { messageId: "region" }],
      },
      {
        code: "// <summary>Gets the id</summary>\nconst a = 1;",
        errors: [{ messageId: "xmlDoc" }],
      },
      {
        code: '/* <param name="x">the input</param> */\nconst a = 1;',
        errors: [{ messageId: "xmlDoc" }],
      },
    ],
  });
});
