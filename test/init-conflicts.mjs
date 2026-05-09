#!/usr/bin/env node
// init-conflicts.mjs — baton init 충돌 정책 테스트

import { mkdtempSync, mkdirSync, writeFileSync, existsSync, rmSync, readFileSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const BATON = new URL('../bin/baton.js', import.meta.url).pathname;
const NODE  = process.execPath;

function run(args, cwd) {
  const r = spawnSync(NODE, [BATON, ...args], { cwd, encoding: 'utf8' });
  if (r.error) throw new Error(`spawn 실패: ${r.error.message}`);
  return r;
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

const dirs = [];
let passed = 0;

try {
  // ── Case A: lenient — inbox/ 이미 존재 ───────────────────────────────
  const dirA = mkdtempSync(join(tmpdir(), 'baton-ci-a-'));
  dirs.push(dirA);

  mkdirSync(join(dirA, 'inbox'), { recursive: true });
  writeFileSync(join(dirA, 'inbox', 'my-notes.txt'), 'keep me');

  const rA = run(['init', 'LenientTest'], dirA);
  ok(rA.status === 0, `[A] exit ${rA.status} (expected 0)\n${rA.stderr}`);
  ok(existsSync(join(dirA, 'inbox', 'my-notes.txt')), '[A] 기존 파일이 지워짐');
  ok(existsSync(join(dirA, 'inbox', 'task.md')),      '[A] task.md 생성 실패');
  ok(existsSync(join(dirA, 'baton.json')),            '[A] baton.json 생성 실패');
  console.log('[A] lenient (dir already exists) ✓');
  passed++;

  // ── Case A2: lenient — 기존 파일 덮어쓰지 않음 ───────────────────────
  const dirA2 = mkdtempSync(join(tmpdir(), 'baton-ci-a2-'));
  dirs.push(dirA2);

  mkdirSync(join(dirA2, 'inbox'), { recursive: true });
  writeFileSync(join(dirA2, 'inbox', 'task.md'), '# my existing task\n');

  run(['init', 'NoOverwrite'], dirA2);
  const content = readFileSync(join(dirA2, 'inbox', 'task.md'), 'utf8');
  ok(content.includes('my existing task'), '[A2] 기존 task.md를 덮어씀');
  console.log('[A2] no overwrite of existing files ✓');
  passed++;

  // ── Case B: 충돌 — inbox 위치에 파일 존재 ────────────────────────────
  const dirB = mkdtempSync(join(tmpdir(), 'baton-ci-b-'));
  dirs.push(dirB);

  writeFileSync(join(dirB, 'inbox'), 'i am a file, not a dir');

  const rB = run(['init', 'ConflictTest'], dirB);
  ok(rB.status === 1, `[B] exit ${rB.status} (expected 1)`);
  ok(rB.stderr.includes('충돌'), `[B] 충돌 메시지 없음\n${rB.stderr}`);
  console.log('[B] conflict — file where inbox/ expected ✓');
  passed++;

  // ── Case C: 충돌 — outbox 위치에 파일 존재 ───────────────────────────
  const dirC = mkdtempSync(join(tmpdir(), 'baton-ci-c-'));
  dirs.push(dirC);

  writeFileSync(join(dirC, 'outbox'), 'i am a file');

  const rC = run(['init', 'ConflictTestC'], dirC);
  ok(rC.status === 1, `[C] exit ${rC.status} (expected 1)`);
  ok(rC.stderr.includes('충돌'), `[C] 충돌 메시지 없음\n${rC.stderr}`);
  console.log('[C] conflict — file where outbox/ expected ✓');
  passed++;

  console.log(`\n✓ 충돌 정책 테스트 통과 (${passed}/4)`);
  process.exit(0);

} catch (e) {
  console.error(`\n✗ 충돌 테스트 실패 [${passed}/4 통과]: ${e.message}`);
  process.exit(1);

} finally {
  for (const d of dirs) rmSync(d, { recursive: true, force: true });
}
