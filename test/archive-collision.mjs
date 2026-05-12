#!/usr/bin/env node
// archive-collision.mjs — baton new archive 파일명 충돌 방지 테스트

import { mkdirSync, mkdtempSync, readFileSync, rmSync, writeFileSync, existsSync } from 'fs';
import { join } from 'path';
import { tmpdir } from 'os';
import { newTask } from '../lib/commands/new.js';

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

const RealDate = Date;
const dir = mkdtempSync(join(tmpdir(), 'baton-archive-'));
const originalCwd = process.cwd();
const timestamp = '2026-05-12T08-44-16';

try {
  mkdirSync(join(dir, 'inbox', '.archive'), { recursive: true });
  writeFileSync(join(dir, 'baton.json'), JSON.stringify({ name: 'ArchiveTest', batonVersion: '0.1.1' }));
  writeFileSync(join(dir, 'inbox', 'task.md'), '# old task\n');
  writeFileSync(join(dir, 'inbox', '.archive', `${timestamp}.md`), '# existing archive\n');

  globalThis.Date = class extends RealDate {
    constructor(...args) {
      return args.length === 0 ? new RealDate('2026-05-12T08:44:16.123Z') : new RealDate(...args);
    }

    static now() {
      return new RealDate('2026-05-12T08:44:16.123Z').getTime();
    }
  };

  process.chdir(dir);
  await newTask('new task');

  ok(readFileSync(join(dir, 'inbox', '.archive', `${timestamp}.md`), 'utf8').includes('existing archive'), '기존 archive를 덮어씀');
  ok(existsSync(join(dir, 'inbox', '.archive', `${timestamp}-2.md`)), '충돌 회피 archive가 생성되지 않음');
  ok(readFileSync(join(dir, 'inbox', '.archive', `${timestamp}-2.md`), 'utf8').includes('old task'), '이전 task가 archive되지 않음');
  ok(readFileSync(join(dir, 'inbox', 'task.md'), 'utf8').includes('new task'), '새 task가 생성되지 않음');

  console.log('✓ archive collision test 통과');
} catch (e) {
  console.error(`✗ archive collision test 실패: ${e.message}`);
  process.exit(1);
} finally {
  globalThis.Date = RealDate;
  process.chdir(originalCwd);
  rmSync(dir, { recursive: true, force: true });
}
