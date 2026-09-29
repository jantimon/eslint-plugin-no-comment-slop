#!/usr/bin/env node
// @ts-check
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, readFileSync, realpathSync, rmSync, statSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join, relative, resolve } from "node:path";
import { parseArgs, styleText } from "node:util";
import { meta, rules } from "../dist/index.js";

const pluginPath = join(import.meta.dirname, "..", "dist", "index.js");
const packageJson = JSON.parse(readFileSync(join(import.meta.dirname, "..", "package.json"), "utf8"));
const maxBuffer = 256 * 1024 * 1024;
const sourceExtension = /\.(?:[cm]?[jt]s|[jt]sx)$/;

const help = `Usage: no-comment-slop [path] [options]

Lint comments with the no-comment-slop recommended rules and report only
findings on changed lines. Runs oxlint through npx.

Arguments:
  path            Directory or file to lint (default: current directory)

Options:
  --since <rev>   Report changes since the merge base of <rev> and HEAD,
                  including uncommitted and untracked files (default: HEAD)
  --all           Report every finding, not only those on changed lines
  -h, --help      Show this help
  -v, --version   Show the version

Examples:
  npx eslint-plugin-no-comment-slop                  uncommitted changes
  npx eslint-plugin-no-comment-slop --since main     changes on this branch
  npx eslint-plugin-no-comment-slop src --all        every file in src

Exit codes: 0 no findings, 1 findings, 2 usage or git error`;

/**
 * An error that ends the run with exit code 2 and prints only its message
 */
class CliError extends Error {}

/**
 * @typedef {{ file: string, line: number, endLine: number, column: number, rule: string, message: string }} Finding
 * @typedef {Map<string, Set<number> | true>} ChangedLines true marks a file whose every line counts as changed
 */

/**
 * @param {string} cwd
 * @param {string[]} args
 */
function git(cwd, args) {
  try {
    return execFileSync("git", ["--literal-pathspecs", ...args], { cwd, encoding: "utf8", stdio: ["ignore", "pipe", "pipe"], maxBuffer });
  } catch (error) {
    const stderr = error instanceof Error && "stderr" in error ? String(error.stderr).trim() : "";
    throw new CliError(`git ${args[0]} failed${stderr ? `: ${stderr}` : ""}`);
  }
}

/**
 * @param {string} output NUL-separated file names from git
 */
function sourceFiles(output) {
  return output.split("\0").filter((file) => sourceExtension.test(file));
}

/**
 * Collects the lines each changed source file adds or modifies relative to the merge base
 *
 * @param {string} target absolute path to lint
 * @param {string} since
 * @returns {{ root: string, changed: ChangedLines }}
 */
function changedLines(target, since) {
  const cwd = statSync(target).isDirectory() ? target : dirname(target);
  const root = git(cwd, ["rev-parse", "--show-toplevel"]).trim();
  const base = git(root, ["merge-base", since, "HEAD"]).trim();

  /** @type {ChangedLines} */
  const changed = new Map();
  for (const file of sourceFiles(git(root, ["ls-files", "-z", "--others", "--exclude-standard", "--", target]))) {
    changed.set(file, true);
  }
  for (const file of sourceFiles(git(root, ["diff", "-z", "--name-only", "--diff-filter=ACMR", base, "--", target]))) {
    const diff = git(root, ["diff", "-U0", "--no-color", "--no-ext-diff", base, "--", file]);
    /** @type {Set<number>} */
    const lines = new Set();
    for (const [, start, count = "1"] of diff.matchAll(/^@@ -\S+ \+(\d+)(?:,(\d+))? @@/gm)) {
      for (let line = Number(start); line < Number(start) + Number(count); line++) lines.add(line);
    }
    if (lines.size > 0) changed.set(file, lines);
  }
  return { root, changed };
}

/**
 * @param {string} cwd
 * @param {string[]} targets
 * @returns {Finding[]}
 */
function runOxlint(cwd, targets) {
  const recommended = Object.fromEntries(
    Object.entries(rules)
      .filter(([, rule]) => rule.meta?.docs?.recommended)
      .map(([name]) => [`${meta.namespace}/${name}`, "error"]),
  );
  const configDir = mkdtempSync(join(tmpdir(), "no-comment-slop-"));
  try {
    const configPath = join(configDir, "oxlintrc.json");
    writeFileSync(
      configPath,
      JSON.stringify({ jsPlugins: [pluginPath], categories: { correctness: "off" }, plugins: [], rules: recommended }),
    );
    const args = ["--yes", `--package=oxlint@${packageJson.devDependencies.oxlint}`, "--", "oxlint", "-c", configPath, "-f", "json", ...targets];
    /** @type {import("node:child_process").SpawnSyncOptionsWithStringEncoding} */
    const options = { cwd, encoding: "utf8", maxBuffer };
    // Windows only spawns the npx.cmd shim through a shell. Windows paths cannot contain quotes, so quoting every argument is safe
    const result =
      process.platform === "win32"
        ? spawnSync(["npx", ...args].map((arg) => `"${arg}"`).join(" "), { ...options, shell: true })
        : spawnSync("npx", args, options);
    if (result.error) throw new CliError(`oxlint failed to start: ${result.error.message}`);
    /** @type {{ diagnostics: { message: string, code: string, filename: string, labels: { span: { offset: number, length: number, line: number, column: number } }[] }[] }} */
    let report;
    try {
      report = JSON.parse(result.stdout);
    } catch {
      throw new CliError(`oxlint produced no report (exit ${result.status})\n${result.stderr.trim()}`);
    }
    /** @type {Map<string, Buffer>} */
    const sources = new Map();
    return report.diagnostics.map((diagnostic) => {
      const file = resolve(cwd, diagnostic.filename);
      const span = diagnostic.labels[0]?.span ?? { offset: 0, length: 0, line: 1, column: 1 };
      let source = sources.get(file);
      if (!source) {
        source = readFileSync(file);
        sources.set(file, source);
      }
      // oxlint reports offsets in UTF-8 bytes
      const newlines = source.subarray(span.offset, span.offset + span.length).toString("utf8").split("\n").length - 1;
      return {
        file,
        line: span.line,
        endLine: span.line + newlines,
        column: span.column,
        rule: /\(([^)]+)\)/.exec(diagnostic.code)?.[1] ?? diagnostic.code,
        message: diagnostic.message,
      };
    });
  } finally {
    rmSync(configDir, { recursive: true, force: true });
  }
}

/**
 * @param {Finding[]} findings
 */
function print(findings) {
  /** @type {Map<string, Finding[]>} */
  const byFile = Map.groupBy(findings, (finding) => finding.file);
  for (const [file, group] of [...byFile].sort(([a], [b]) => a.localeCompare(b))) {
    console.log(styleText("underline", relative(process.cwd(), file) || file));
    for (const finding of group.sort((a, b) => a.line - b.line || a.column - b.column)) {
      const position = styleText("dim", `${finding.line}:${finding.column}`.padEnd(8));
      console.log(`  ${position}${styleText("red", finding.rule.padEnd(26))}${finding.message}`);
    }
    console.log();
  }
  const count = `${findings.length} finding${findings.length === 1 ? "" : "s"}`;
  console.log(findings.length === 0 ? "No findings" : styleText("bold", `${count} in ${byFile.size} file${byFile.size === 1 ? "" : "s"}`));
}

/**
 * @param {string[]} argv
 */
function main(argv) {
  const { values, positionals } = parseArgs({
    args: argv,
    allowPositionals: true,
    options: {
      since: { type: "string" },
      all: { type: "boolean" },
      help: { type: "boolean", short: "h" },
      version: { type: "boolean", short: "v" },
    },
  });
  if (values.help) {
    console.log(help);
    return 0;
  }
  if (values.version) {
    console.log(packageJson.version);
    return 0;
  }
  if (positionals.length > 1) throw new CliError("Pass at most one path");
  if (values.all && values.since) throw new CliError("--all and --since exclude each other");

  /** @type {string} */
  let target;
  try {
    target = realpathSync(resolve(positionals[0] ?? "."));
  } catch {
    throw new CliError(`No such file or directory: ${positionals[0]}`);
  }

  if (values.all) {
    const findings = runOxlint(process.cwd(), [target]);
    print(findings);
    return findings.length > 0 ? 1 : 0;
  }

  const { root, changed } = changedLines(target, values.since ?? "HEAD");
  if (changed.size === 0) {
    console.log("No changed files to lint");
    return 0;
  }
  const findings = runOxlint(root, [...changed.keys()]).filter((finding) => {
    const lines = changed.get(relative(root, finding.file));
    if (lines === true) return true;
    for (let line = finding.line; line <= finding.endLine; line++) {
      if (lines?.has(line)) return true;
    }
    return false;
  });
  print(findings);
  return findings.length > 0 ? 1 : 0;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (error) {
  if (!(error instanceof CliError) && !(error instanceof TypeError && "code" in error && String(error.code).startsWith("ERR_PARSE_ARGS"))) throw error;
  console.error(styleText("red", error.message));
  console.error("Run with --help for usage");
  process.exitCode = 2;
}
