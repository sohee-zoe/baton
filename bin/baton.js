#!/usr/bin/env node

import { init }   from '../lib/commands/init.js';
import { newTask } from '../lib/commands/new.js';
import { open }   from '../lib/commands/open.js';
import { status } from '../lib/commands/status.js';

const [,, cmd, ...args] = process.argv;

function usage() {
  process.stdout.write(`baton — 사람↔Claude 협업 폴더 컨벤션

  baton init [name]      현재 디렉토리에 baton 프로젝트 생성
  baton new "<task>"     inbox/task.md 갱신 (이전 본 archive)
  baton open             outbox/ 최신 html을 브라우저로 열기
  baton status           현재 task / outbox / open Q 요약
  baton --version        버전 출력
`);
}

try {
  switch (cmd) {
    case 'init':    await init(args[0]);   break;
    case 'new':     await newTask(args[0]); break;
    case 'open':    await open();          break;
    case 'status':  await status(args);    break;
    case '--version':
    case '-v':
      process.stdout.write('baton 0.1.1\n');
      break;
    case '--help':
    case '-h':
    case undefined:
      usage();
      break;
    default:
      process.stderr.write(`알 수 없는 명령: ${cmd}\n`);
      usage();
      process.exit(2);
  }
} catch (err) {
  process.stderr.write(`오류: ${err.message}\n`);
  process.exit(1);
}
