import { existsSync, readFileSync, readdirSync, statSync } from 'fs';
import { join } from 'path';
import { findRoot, readMeta } from '../util/project.js';

const BATON_VERSION = '0.1.0';

export async function status(args = []) {
  const jsonMode = args.includes('--json');
  const root = findRoot();
  const meta = readMeta(root);

  // Task title
  const taskFile = join(root, 'inbox', 'task.md');
  let taskTitle = '(없음)';
  if (existsSync(taskFile)) {
    const firstLine = readFileSync(taskFile, 'utf8')
      .split('\n')
      .find(l => l.trim().length > 0) || '';
    taskTitle = firstLine.replace(/^#+\s*/, '').trim() || '(없음)';
  }

  // Outbox count + latest
  const outboxDir = join(root, 'outbox');
  const htmlFiles = readdirSync(outboxDir)
    .filter(f => f.endsWith('.html'))
    .sort((a, b) => {
      return statSync(join(outboxDir, b)).mtimeMs - statSync(join(outboxDir, a)).mtimeMs;
    });

  const outboxCount = htmlFiles.length;
  const latestHtml = htmlFiles[0] || null;

  // Open questions
  const oqFile = join(root, 'memory', 'open-questions.md');
  let openQCount = 0;
  if (existsSync(oqFile)) {
    openQCount = readFileSync(oqFile, 'utf8')
      .split('\n')
      .filter(l => {
        const t = l.trim();
        return t.length > 0 && !t.startsWith('#') && !t.startsWith('<!--') && !l.includes('[resolved]');
      })
      .length;
  }

  if (jsonMode) {
    process.stdout.write(JSON.stringify({
      projectName: meta.name,
      task: taskTitle,
      outboxCount,
      latestOutbox: latestHtml,
      openQuestionsCount: openQCount,
      batonVersion: {
        file: meta.batonVersion || null,
        running: BATON_VERSION,
      },
    }, null, 2) + '\n');
    return;
  }

  const outboxStr = latestHtml
    ? `${outboxCount}개 (최신: ${latestHtml})`
    : `${outboxCount}개`;

  process.stdout.write(
    `baton: ${meta.name}\n` +
    `  task    : ${taskTitle}\n` +
    `  outbox  : ${outboxStr}\n` +
    `  open Q  : ${openQCount}개\n`
  );

  if (meta.batonVersion && meta.batonVersion !== BATON_VERSION) {
    process.stdout.write(`! 버전 불일치: file=${meta.batonVersion} running=${BATON_VERSION}\n`);
  }
}
