import { existsSync, readFileSync } from 'fs';
import { join, dirname } from 'path';

const MARKER = 'baton.json';

/**
 * Walk up from cwd until baton.json is found. Returns the directory path.
 * Throws if not found.
 */
export function findRoot(from = process.cwd()) {
  let dir = from;
  while (true) {
    if (existsSync(join(dir, MARKER))) return dir;
    const parent = dirname(dir);
    if (parent === dir) throw new Error('baton 프로젝트가 아닙니다. `baton init`을 먼저 실행하세요.');
    dir = parent;
  }
}

export function readMeta(root) {
  return JSON.parse(readFileSync(join(root, MARKER), 'utf8'));
}
