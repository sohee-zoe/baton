#!/usr/bin/env node
// smoke.mjs — baton 전체 워크플로 통합 테스트 (Node 내장 모듈만 사용)

import { mkdtempSync, existsSync, readdirSync, rmSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const BATON = new URL('../bin/baton.js', import.meta.url).pathname;
const NODE  = process.execPath;

function run(args, cwd) {
  const r = spawnSync(NODE, [BATON, ...args], { cwd, encoding: 'utf8' });
  if (r.error) throw new Error(`spawn 실패: ${r.error.message}`);
  return { stdout: r.stdout, stderr: r.stderr, status: r.status };
}

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

let dir;
let passed = 0;

try {
  dir = mkdtempSync(join(tmpdir(), 'baton-smoke-'));

  // 1. init
  const init1 = run(['init', 'SmokeTest'], dir);
  ok(init1.status === 0, `init exit ${init1.status}: ${init1.stderr}`);
  ok(init1.stdout.includes('baton 프로젝트 생성'), `init: 성공 메시지 없음\n${init1.stdout}`);
  console.log('[1/7] init ✓');
  passed++;

  // 2. file tree 확인
  const expected = [
    'baton.json',
    'CLAUDE.md',
    join('inbox', 'task.md'),
    join('inbox', '.archive', '.gitkeep'),
    join('inbox', 'context', '.gitkeep'),
    join('outbox', '.gitkeep'),
    join('memory', 'decisions.md'),
    join('memory', 'open-questions.md'),
    join('memory', 'summary.md'),
  ];
  for (const f of expected) {
    ok(existsSync(join(dir, f)), `누락 파일: ${f}`);
  }
  console.log('[2/7] file tree ✓');
  passed++;

  // 3. init idempotent
  const init2 = run(['init'], dir);
  ok(init2.status === 0, `init idempotent exit ${init2.status}`);
  ok(init2.stdout.includes('이미 baton 프로젝트'), `init idempotent: 잘못된 메시지\n${init2.stdout}`);
  console.log('[3/7] init idempotent ✓');
  passed++;

  // 4. new
  const newR = run(['new', 'smoke task title'], dir);
  ok(newR.status === 0, `new exit ${newR.status}: ${newR.stderr}`);
  ok(newR.stdout.includes('inbox/task.md 갱신'), `new: 성공 메시지 없음\n${newR.stdout}`);
  console.log('[4/7] new ✓');
  passed++;

  // 5. archive 생성 확인
  const archives = readdirSync(join(dir, 'inbox', '.archive')).filter(f => f.endsWith('.md'));
  ok(archives.length >= 1, `archive 파일 없음 (found: ${readdirSync(join(dir, 'inbox', '.archive'))})`);
  console.log(`[5/7] archive ✓  (${archives[0]})`);
  passed++;

  // 6. status
  const statusR = run(['status'], dir);
  ok(statusR.status === 0, `status exit ${statusR.status}: ${statusR.stderr}`);
  ok(statusR.stdout.includes('SmokeTest'), `status: 프로젝트명 없음\n${statusR.stdout}`);
  ok(statusR.stdout.includes('smoke task title'), `status: task 제목 없음\n${statusR.stdout}`);
  console.log('[6/7] status ✓');
  passed++;

  // 7. open — outbox 비어있을 때 exit 0 + 안내 메시지
  const openR = run(['open'], dir);
  ok(openR.status === 0, `open(empty) exit ${openR.status}: ${openR.stderr}`);
  ok(openR.stdout.includes('비어있'), `open empty: 안내 메시지 없음\n${openR.stdout}`);
  console.log('[7/7] open (empty outbox) ✓');
  passed++;

  console.log(`\n✓ 스모크 테스트 통과 (${passed}/7)`);
  process.exit(0);

} catch (e) {
  console.error(`\n✗ 스모크 실패 [${passed}/7 통과]: ${e.message}`);
  process.exit(1);

} finally {
  if (dir) rmSync(dir, { recursive: true, force: true });
}
