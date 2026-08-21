import { execFile } from "node:child_process";
import { promisify } from "node:util";

const run = promisify(execFile);

/**
 * Only these paths may ever be committed by the curator. The catalogue carries
 * prices that checkout trusts, and everything else in the repo — payment routes,
 * config, components — is out of bounds by construction rather than by policy.
 */
const ALLOWED = [/^content\/artworks\.json$/, /^public\/images\/[^/]+$/];

async function git(args) {
    const { stdout } = await run("git", args, { cwd: process.cwd() });
    return stdout.trim();
}

export async function currentBranch() {
    return git(["rev-parse", "--abbrev-ref", "HEAD"]);
}

/** Refuse to build on top of someone else's half-finished work. */
export async function assertCleanTree() {
    const dirty = await git(["status", "--porcelain", "--untracked-files=no"]);
    if (dirty) {
        throw new Error(
            `working tree has uncommitted changes:\n${dirty}\nCommit or stash them first.`
        );
    }
}

function assertAllowed(paths) {
    const forbidden = paths.filter(
        (p) => !ALLOWED.some((rule) => rule.test(p.replace(/\\/g, "/")))
    );
    if (forbidden.length) {
        throw new Error(`refusing to commit outside the catalogue: ${forbidden.join(", ")}`);
    }
}

export async function commit(paths, message) {
    assertAllowed(paths);
    await git(["add", "--", ...paths]);

    const staged = await git(["diff", "--cached", "--name-only"]);
    if (!staged) return null;
    assertAllowed(staged.split("\n").filter(Boolean));

    await git(["commit", "-m", message]);
    return git(["rev-parse", "HEAD"]);
}

export async function push(branch) {
    await git(["push", "origin", branch ?? (await currentBranch())]);
}

/** Undo: revert the given commit and push. Used by the bot's "تراجع" reply. */
export async function revert(sha) {
    await git(["revert", "--no-edit", sha]);
    return git(["rev-parse", "HEAD"]);
}

export async function lastCommitSha() {
    return git(["rev-parse", "HEAD"]);
}
