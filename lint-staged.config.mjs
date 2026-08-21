/**
 * Windows hits "The command line is too long" when lint-staged passes
 * hundreds of paths to a single eslint invocation. Chunk into batches.
 */
const ESLINT =
  "eslint --fix --max-warnings=0 --no-warn-ignored";

/** Keep each argv under Windows' ~8191 char limit (with headroom). */
const MAX_BATCH_CHARS = 6000;

/**
 * @param {string[]} files
 * @returns {string[]}
 */
function eslintCommands(files) {
  if (files.length === 0) {
    return [];
  }

  /** @type {string[][]} */
  const batches = [];
  /** @type {string[]} */
  let current = [];
  let currentLen = ESLINT.length;

  for (const file of files) {
    const quoted = `"${file.replaceAll('"', '\\"')}"`;
    const add = quoted.length + 1;
    if (current.length > 0 && currentLen + add > MAX_BATCH_CHARS) {
      batches.push(current);
      current = [];
      currentLen = ESLINT.length;
    }
    current.push(quoted);
    currentLen += add;
  }
  if (current.length) {
    batches.push(current);
  }

  return batches.map((batch) => `${ESLINT} ${batch.join(" ")}`);
}

const lintStagedConfig = {
  "*.{js,jsx,mjs,ts,tsx}": eslintCommands,
};

export default lintStagedConfig;
