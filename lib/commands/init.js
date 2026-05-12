import { existsSync, mkdirSync, readFileSync, writeFileSync, statSync } from 'fs';
import { join, basename, dirname } from 'path';
import { fileURLToPath } from 'url';

const __dir = join(fileURLToPath(import.meta.url), '..', '..', 'templates');

function tpl(name, vars = {}) {
  let src = readFileSync(join(__dir, name), 'utf8');
  for (const [k, v] of Object.entries(vars)) src = src.replaceAll(`{{${k}}}`, v);
  return src;
}

function ensureDir(p) {
  if (existsSync(p)) {
    if (!statSync(p).isDirectory())
      throw new Error(`충돌: ${p}는 이미 파일로 존재합니다.`);
  } else {
    try {
      mkdirSync(p, { recursive: true });
    } catch (e) {
      if (e.code === 'ENOTDIR') throw new Error(`충돌: ${p} 경로에 파일이 있어 디렉토리를 만들 수 없습니다.`);
      throw e;
    }
  }
}

function writeIfAbsent(p, content) {
  if (!existsSync(p)) writeFileSync(p, content, 'utf8');
}

export async function init(nameArg) {
  const cwd = process.cwd();
  const batonFile = join(cwd, 'baton.json');

  if (existsSync(batonFile)) {
    const meta = JSON.parse(readFileSync(batonFile, 'utf8'));
    process.stdout.write(`이미 baton 프로젝트입니다: ${meta.name}\n`);
    return;
  }

  const name = nameArg || basename(cwd);
  const createdAt = new Date().toISOString();
  const batonVersion = '0.1.1';

  // Dirs
  for (const rel of ['inbox/.archive', 'inbox/context', 'outbox', 'memory']) {
    ensureDir(join(cwd, rel));
  }

  // baton.json
  writeFileSync(batonFile, JSON.stringify({ name, createdAt, batonVersion }, null, 2) + '\n', 'utf8');

  // Templates
  const vars = { name, createdAt };
  writeIfAbsent(join(cwd, 'CLAUDE.md'),                     tpl('CLAUDE.md', vars));
  writeIfAbsent(join(cwd, 'inbox', 'task.md'),              tpl('task.md', vars));
  writeIfAbsent(join(cwd, 'memory', 'decisions.md'),        tpl('decisions.md', vars));
  writeIfAbsent(join(cwd, 'memory', 'open-questions.md'),   tpl('open-questions.md', vars));
  writeIfAbsent(join(cwd, 'memory', 'summary.md'),          tpl('summary.md', vars));

  // .gitkeep placeholders
  writeIfAbsent(join(cwd, 'inbox', '.archive', '.gitkeep'), '');
  writeIfAbsent(join(cwd, 'inbox', 'context', '.gitkeep'),  '');
  writeIfAbsent(join(cwd, 'outbox', '.gitkeep'),            '');

  process.stdout.write(
    `✓ baton 프로젝트 생성: ${name}\n` +
    `  CLAUDE.md, inbox/, outbox/, memory/ 준비됨.\n` +
    `  다음: inbox/task.md를 편집하거나 \`baton new "..."\` 실행.\n`
  );
}
