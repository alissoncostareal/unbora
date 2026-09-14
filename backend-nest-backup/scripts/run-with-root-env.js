const { spawnSync } = require('node:child_process');
const { config } = require('dotenv');
const { existsSync } = require('node:fs');
const { resolve } = require('node:path');

const rootEnv = resolve(__dirname, '../../.env');
const localEnv = resolve(__dirname, '../.env');

if (existsSync(rootEnv)) config({ path: rootEnv });
if (existsSync(localEnv)) config({ path: localEnv, override: true });

const args = process.argv.slice(2);
if (args.length === 0) {
  console.error('Usage: node scripts/run-with-root-env.js <command> [...args]');
  process.exit(1);
}

const [command, ...commandArgs] = args;
const result = spawnSync(command, commandArgs, {
  stdio: 'inherit',
  env: process.env,
  shell: true,
});

process.exit(result.status ?? 1);
