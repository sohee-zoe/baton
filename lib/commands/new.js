import { existsSync, writeFileSync, renameSync } from 'fs';
import { basename, join } from 'path';
import { findRoot } from '../util/project.js';

function isoTimestamp() {
  return new Date().toISOString().replace(/:/g, '-').replace(/\..+$/, '');
}

function archivePath(archiveDir, timestamp) {
  let candidate = join(archiveDir, `${timestamp}.md`);
  let suffix = 2;

  while (existsSync(candidate)) {
    candidate = join(archiveDir, `${timestamp}-${suffix}.md`);
    suffix++;
  }

  return candidate;
}

export async function newTask(taskArg) {
  if (!taskArg || !taskArg.trim()) {
    process.stderr.write('사용법: baton new "<task>"\n');
    process.exit(2);
  }

  const root = findRoot();
  const taskFile = join(root, 'inbox', 'task.md');
  const archiveDir = join(root, 'inbox', '.archive');

  let archived = null;
  if (existsSync(taskFile)) {
    const ts = isoTimestamp();
    const dest = archivePath(archiveDir, ts);
    renameSync(taskFile, dest);
    archived = dest;
  }

  const content =
    `# ${taskArg.trim()}\n\n` +
    `## Goal\n\n\n` +
    `## Constraints\n\n\n` +
    `## Output\n\n` +
    `- outbox/에 single-file html로 결과를 남길 것.\n`;

  writeFileSync(taskFile, content, 'utf8');

  const archivedMsg = archived
    ? `  이전 task → inbox/.archive/${basename(archived)}\n`
    : '';
  process.stdout.write(
    `✓ inbox/task.md 갱신: ${taskArg.trim()}\n` + archivedMsg
  );
}
