# baton

사람↔Claude 협업 폴더 컨벤션 + 얇은 CLI.
Markdown으로 지시하고(`inbox/`), HTML로 결과를 받는다(`outbox/`). 폴더 이름이 곧 인터페이스.

## Prerequisites

Node.js 18+

## Install

```sh
# 글로벌 설치 (배포 후)
npm install -g baton

# 로컬 개발
git clone https://github.com/sohee-zoe/baton.git && cd baton
npm link
```

## Quickstart

```sh
mkdir my-project && cd my-project

baton init               # 폴더 스켈레톤 + CLAUDE.md 생성
baton new "첫 번째 task" # inbox/task.md 갱신 (이전 본 자동 archive)
baton status             # task · outbox 수 · 미결 질문 수 요약
baton status --json      # 동일 정보를 JSON으로 출력
baton open               # 최신 outbox/*.html 브라우저로 열기
```

## Commands

| 명령 | 설명 |
|------|------|
| `baton init [name]` | 현재 디렉토리에 baton 프로젝트 생성 (idempotent) |
| `baton new "<task>"` | `inbox/task.md` 갱신, 이전 본 자동 archive |
| `baton status` | 현재 task · outbox 수 · 미결 질문 수 |
| `baton status --json` | 위 정보를 JSON으로 출력 (tooling용, stdout only) |
| `baton open` | `outbox/` 최신 HTML을 OS 기본 브라우저로 열기 |
| `baton --version` | 버전 출력 |

### `status --json` output

```json
{
  "projectName": "my-project",
  "task": "첫 번째 task",
  "outboxCount": 1,
  "latestOutbox": "001-usage-guide.html",
  "openQuestionsCount": 0,
  "batonVersion": {
    "file": "0.1.0",
    "running": "0.1.0"
  }
}
```

## Folder Convention

```
project/
  CLAUDE.md              Claude 컨텍스트 진입점 (< 100줄)
  baton.json             프로젝트 메타 (이름, 생성일, baton 버전)
  inbox/
    task.md              현재 할 일 — 사람이 작성 (40줄 이내)
    .archive/            이전 task.md 자동 보관
    context/             참조 자료 (Claude가 명시 요청 시에만 로드)
  outbox/
    001-slug.html        Claude 산출물 — 브라우저로 열어볼 것
  memory/
    decisions.md         결정 누적 (append-only)
    open-questions.md    미결 질문 (해결 시 [resolved] 추가)
    summary.md           세션 부트스트랩 요약 (20줄 이내)
```

## Tests

```sh
npm run smoke           # 전체 워크플로 통합 테스트 (7단계)
npm run test:conflicts  # init 충돌 정책 테스트 (4케이스)
```

## Design Notes

- **Zero external deps** — Node.js 내장 모듈만 사용
- **Markdown in, HTML out** — 짧은 마크다운으로 지시, 풍부한 HTML로 결과 수신
- **Append-only memory** — `decisions.md` / `open-questions.md` 줄 삭제 금지
- **Version mismatch** — `baton status` 경고 표시, `--json`에서 양쪽 버전 노출, 자동 마이그레이션 없음

상세 설계: [docs/design.md](./docs/design.md) · CLI 스펙: [docs/cli-spec.md](./docs/cli-spec.md)

## Documentation

브라우저에서 직접 열 수 있는 HTML 문서 (빌드 불필요):

- [docs/index.html](./docs/index.html) — 문서 목록 인덱스
- [docs/usage-guide.html](./docs/usage-guide.html) — 설치·명령·Claude 협업 가이드
- [docs/architecture.html](./docs/architecture.html) — 데이터 플로우·디렉토리 다이어그램

## GitHub Pages

**Live docs:** https://sohee-zoe.github.io/baton/

### Pages 설정 방법

1. GitHub repo → **Settings** → **Pages**
2. Source: **Deploy from a branch**
3. Branch: `main` / Folder: `/docs`
4. Save

`docs/` 아래 HTML이 그대로 서빙됨. 별도 빌드 단계 없음.
