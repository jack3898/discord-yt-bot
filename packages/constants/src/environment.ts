import { resolve } from 'path';

export const ROOT = resolve(__dirname, '..', '..', '..');
export const ROOT_NODE_MODULES = resolve(ROOT, 'node_modules');
export const ROOT_ENV_FILE = resolve(ROOT, '.env');
