// @ts-check
import assert from "node:assert/strict";
import { execFileSync, spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { after, before, test } from "node:test";

const cli = join(import.meta.dirname, "..", "..", "bin", "no-comment-slop.mjs");
const repo = mkdtempSync(join(tmpdir(), "no-comment-slop-cli-"));

/**
 * @param {string[]} args
 */
const git = (...args) => execFileSync("git", args, { cwd: repo, stdio: "ignore" });

/**
 * @param {string[]} args
 */
function run(...args) {
  const result = spawnSync(process.execPath, [cli, ...args], {
    cwd: repo,
    encoding: "utf8",
    env: { ...process.env, NO_COLOR: "1" },
  });
  const findings = result.stdout.split("\n").filter((line) => /^\s+\d+:\d+/.test(line));
  return { status: result.status, stdout: result.stdout, stderr: result.stderr, findings };
}

before(() => {
  git("init", "--quiet", "--initial-branch=main");
  git("config", "user.email", "test@example.com");
  git("config", "user.name", "test");
  git("config", "commit.gpgsign", "false");
  writeFileSync(join(repo, "a.js"), "// Utilize the cache\nconst a = 1;\n\nconst b = 2;\n");
  git("add", ".");
  git("commit", "--quiet", "-m", "initial");
  git("branch", "base");
  writeFileSync(join(repo, "a.js"), "// Utilize the cache\nconst a = 1;\n\n// Leverage the value\nconst b = 2;\n");
  git("commit", "--quiet", "-am", "second");
});

after(() => rmSync(repo, { recursive: true, force: true }));

test("reports nothing when the working tree is clean", () => {
  const result = run();
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /No changed files/);
});

test("--since reports only lines changed after the merge base", () => {
  const result = run("--since", "base");
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.findings.length, 1, result.stdout);
  assert.match(result.findings[0] ?? "", /^\s+4:\d+\s+no-jargon/);
});

test("--all reports every finding", () => {
  const result = run("--all");
  assert.equal(result.status, 1, result.stderr);
  assert.equal(result.findings.length, 2, result.stdout);
});

test("reports uncommitted and untracked changes by default", () => {
  writeFileSync(join(repo, "a.js"), "// Utilize the cache\nlet a = 1; // the value\n++ a;\n// Leverage the value\nconst b = 2;\n// Utilize b\n");
  writeFileSync(join(repo, "new file.ts"), "// Utilize this\nconst c = 3;\n");
  try {
    const result = run();
    assert.equal(result.status, 1, result.stderr);
    assert.match(result.stdout, /a\.js\n\s+2:\d+\s+no-trailing-comment/);
    assert.match(result.stdout, /a\.js\n(?:.*\n)*\s+6:\d+\s+no-jargon/);
    assert.match(result.stdout, /new file\.ts\n\s+1:\d+\s+no-jargon/);
    assert.equal(result.findings.length, 3, result.stdout);
  } finally {
    git("checkout", "--quiet", "a.js");
    rmSync(join(repo, "new file.ts"));
  }
});

test("exits 2 on an unknown revision", () => {
  const result = run("--since", "does-not-exist");
  assert.equal(result.status, 2);
  assert.match(result.stderr, /git merge-base failed/);
});
