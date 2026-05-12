import { readdirSync, statSync } from 'fs';
import { join } from 'path';
import { pathToFileURL } from 'url';
import { findRoot } from '../util/project.js';
import { openInBrowser } from '../util/browser.js';

export async function open() {
  const root = findRoot();
  const outboxDir = join(root, 'outbox');

  const htmlFiles = readdirSync(outboxDir)
    .filter(f => f.endsWith('.html'))
    .map(f => ({ name: f, mtime: statSync(join(outboxDir, f)).mtimeMs }))
    .sort((a, b) => b.mtime - a.mtime);

  if (htmlFiles.length === 0) {
    process.stdout.write('outbox/가 비어있습니다. Claude에게 결과를 outbox/에 남기도록 요청하세요.\n');
    return;
  }

  const target = join(outboxDir, htmlFiles[0].name);
  process.stdout.write(`→ 열기: outbox/${htmlFiles[0].name}\n`);

  try {
    await openInBrowser(target);
  } catch {
    process.stderr.write(
      `! 브라우저 자동 실행 실패. 다음 URL을 직접 여세요:\n` +
      `  ${pathToFileURL(target).href}\n`
    );
    process.exit(1);
  }
}
