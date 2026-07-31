import { spawnSync } from "node:child_process";
import { readFileSync } from "node:fs";
import { basename, dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

const here = dirname(fileURLToPath(import.meta.url));
const root = join(here, "..", "..");
const fixtures = ["tests/integration/fixture/slop.js", "tests/integration/fixture/slop.ts"];

const expected = JSON.parse(readFileSync(join(here, "expected.json"), "utf8"));

const linters = {
  eslint: {
    command: [
      join(root, "node_modules", ".bin", "eslint"),
      "--no-config-lookup",
      "--config",
      "tests/integration/eslint.fixture.config.mjs",
      "--format",
      "json",
      ...fixtures,
    ],
    parse: parseEslintJson,
  },
  eslint9: {
    command: [
      "npx",
      "--yes",
      "eslint@9",
      "--no-config-lookup",
      "--config",
      "tests/integration/eslint.fixture.config.mjs",
      "--format",
      "json",
      ...fixtures,
    ],
    parse: parseEslintJson,
  },
  oxlint: {
    command: [
      join(root, "node_modules", ".bin", "oxlint"),
      "--config",
      "tests/integration/oxlintrc.json",
      "--format",
      "json",
      ...fixtures,
    ],
    parse(stdout) {
      const report = JSON.parse(stdout);
      return report.diagnostics.map((diagnostic) => ({
        file: basename(diagnostic.filename),
        rule: /\(([^)]+)\)/.exec(diagnostic.code)?.[1] ?? diagnostic.code,
        line: diagnostic.labels[0].span.line,
      }));
    },
  },
  rslint: {
    command: [
      join(root, "node_modules", ".bin", "rslint"),
      "--config",
      "tests/integration/rslint.config.mjs",
      "--format",
      "jsonline",
      ...fixtures,
    ],
    parse(stdout) {
      return stdout
        .split("\n")
        .filter((line) => line.trim().startsWith("{"))
        .map((line) => JSON.parse(line))
        .map((diagnostic) => ({
          file: basename(diagnostic.filePath),
          rule: diagnostic.ruleName.split("/")[1],
          line: diagnostic.range.start.line,
        }));
    },
  },
};

function parseEslintJson(stdout) {
  const report = JSON.parse(stdout);
  return report.flatMap((result) =>
    (result.messages ?? []).map((message) => ({
      file: basename(result.filePath),
      rule: message.ruleId.split("/")[1],
      line: message.line,
    })),
  );
}

const normalize = (diagnostics) =>
  diagnostics.map(({ file, rule, line }) => `${file}:${String(line).padStart(3)}  ${rule}`).sort();

const name = process.argv[2];
const linter = linters[name];
if (!linter) {
  console.error(`Usage: node tests/integration/run.mjs <${Object.keys(linters).join("|")}>`);
  process.exit(2);
}

const [command, ...args] = linter.command;
const result = spawnSync(command, args, { cwd: root, encoding: "utf8" });
if (result.error) {
  console.error(`${name} failed to start`, result.error);
  process.exit(1);
}

let actual;
try {
  actual = normalize(linter.parse(result.stdout));
} catch (parseError) {
  console.error(`${name} produced unparseable output (exit ${result.status})`);
  console.error("stdout:", result.stdout.slice(0, 2000));
  console.error("stderr:", result.stderr.slice(0, 2000));
  throw parseError;
}

const wanted = normalize(expected);
const missing = wanted.filter((entry) => !actual.includes(entry));
const surplus = actual.filter((entry) => !wanted.includes(entry));

if (missing.length > 0 || surplus.length > 0) {
  console.error(`${name}: diagnostics differ from expected.json`);
  for (const entry of missing) console.error(`  missing    ${entry}`);
  for (const entry of surplus) console.error(`  unexpected ${entry}`);
  process.exit(1);
}

console.log(`${name}: ${actual.length} diagnostics match expected.json`);
