import { config } from 'dotenv';
import { existsSync } from 'fs';
import { resolve } from 'path';

/** Caminhos estáveis (independem de process.cwd()). */
const rootEnv = resolve(__dirname, '../../../.env');
const localEnv = resolve(__dirname, '../../.env');

export function loadEnvFiles(override = false): void {
  if (existsSync(rootEnv)) {
    config({ path: rootEnv, override });
  }
  if (existsSync(localEnv)) {
    config({ path: localEnv, override });
  }
}
