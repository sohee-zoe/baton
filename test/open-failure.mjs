#!/usr/bin/env node
// open-failure.mjs — baton open 실패 시 fallback URL 출력 테스트

import { chmodSync, mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'fs';
import { delimiter, join } from 'path';
import { tmpdir } from 'os';
import { spawnSync } from 'child_process';

const BATON = new URL('../bin/baton.js', import.meta.url).pathname;
const NODE = process.execPath;

function ok(cond, msg) {
  if (!cond) throw new Error(msg);
}

function openerCommand() {
  switch (process.platform) {
    case 'darwin':
      return 'open';
    case 'win32':
      return null;
    default:
      return 'xdg-open';
  }
}

const cmd = openerCommand();
if (!cmd) {
  console.log('✓ open failure test skipped on win32');
  process.exit(0);
}

const dir = mkdtempSync(join(tmpdir(), 'baton open 한글 '));

try {
  const binDir = join(dir, 'bin');
  const outboxDir = join(dir, 'outbox');
  mkdirSync(binDir);
  mkdirSync(outboxDir);
  writeFileSync(join(dir, 'baton.json'), JSON.stringify({ name: 'OpenFailure', batonVersion: '0.1.1' }));
  writeFileSync(join(outboxDir, '001-결과 파일.html'), '<!doctype html><title>test</title>');

  const fakeOpener = join(binDir, cmd);
  writeFileSync(fakeOpener, '#!/bin/sh\nexit 7\n');
  chmodSync(fakeOpener, 0o755);

  const result = spawnSync(NODE, [BATON, 'open'], {
    cwd: dir,
    encoding: 'utf8',
    env: {
      ...process.env,
      PATH: `${binDir}${delimiter}${process.env.PATH || ''}`,
    },
  });

  ok(result.status === 1, `open 실패 exit code가 1이 아님: ${result.status}`);
  ok(result.stdout.includes('001-결과 파일.html'), `stdout에 대상 파일 안내 없음\n${result.stdout}`);
  ok(result.stderr.includes('브라우저 자동 실행 실패'), `stderr에 실패 안내 없음\n${result.stderr}`);
  ok(result.stderr.includes('file://'), `stderr에 file URL 없음\n${result.stderr}`);
  ok(result.stderr.includes('%20'), `file URL이 공백을 encode하지 않음\n${result.stderr}`);

  console.log('✓ open failure test 통과');
} catch (e) {
  console.error(`✗ open failure test 실패: ${e.message}`);
  process.exit(1);
} finally {
  rmSync(dir, { recursive: true, force: true });
}
