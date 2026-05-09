# baton — Design

> PRD([prd.md](./prd.md))의 컨셉을 구현 가능한 수준의 폴더·파일·CLI 동작으로 풀어낸 문서. CLI 명령별 인자/에러는 [cli-spec.md](./cli-spec.md), 시각 다이어그램은 [architecture.html](./architecture.html).

## 1. 설계 원칙 (Design Principles)

1. **컨벤션 > 코드.** 기능을 추가하기 전에 항상 “컨벤션으로 풀 수 없나?”를 먼저 묻는다.
2. **Zero deps.** 외부 npm 패키지 금지. Node.js 내장(`fs`, `path`, `child_process`, `os`)만 사용.
3. **Single source of truth per concern.** 한 정보는 한 파일에만 둔다. 동기화 로직 없음.
4. **Fail loud, recover manual.** 깨졌을 때 자동 복구 시도하지 않는다. 무엇이 어디서 깨졌는지 사람이 즉시 알 수 있게 한다.
5. **Append > overwrite.** `memory/`는 누적, `inbox/task.md`는 덮어쓰되 이전 본은 자동 archive.
6. **Idempotent.** 같은 명령 두 번 호출해도 안전.

## 2. 폴더 구조 (Directory Layout)

`baton init` 직후 모습:

```
project-root/
  CLAUDE.md                    프로젝트 컨텍스트, 항상 자동 로드, < 100줄
  baton.json                   메타(이름, 생성일, baton 버전). 사람이 수정 가능.
  
  inbox/                       사람 → Claude
    task.md                    "지금" 할 일. 한 화면 분량.
    .archive/                  과거 task의 timestamp별 백업
      2026-05-09T12-30-00.md
    context/                   참조 자료. Claude는 명시 요청 시에만 로드.
      .gitkeep
  
  outbox/                      Claude → 사람
    001-initial-spec.html      NNN(3자리) - kebab-slug.html
    002-data-flow.html
    .gitkeep
  
  memory/                      양방향 공유, append-only
    decisions.md               결정한 것들. 한 결정 한 줄.
    open-questions.md          미결 질문. 해결되면 같은 줄에 [resolved] 표시.
    summary.md                 세션 부트스트랩 요약. ~20줄 이내. 세션 끝날 때 갱신.
```

`bin/`, `package.json`은 `baton` 자체의 소스이며, **타깃 프로젝트에는 들어가지 않는다.** 사용자는 글로벌 설치(`npm i -g .` from baton repo) 후 임의 폴더에서 `baton init` 호출.

## 3. 파일 컨벤션 (File Conventions)

### 3.1 `CLAUDE.md`

- 줄 수 < 100. 긴 내용은 `docs/`로 분리해 링크.
- 기본 로드: `inbox/task.md` → `memory/decisions.md` → `memory/summary.md`. `outbox/`는 명시 요청 시에만.
- `inbox/task.md`는 40줄 이내 권장.
- 반드시 포함하는 섹션:
  - 프로젝트 한 줄 소개
  - 폴더 컨벤션 (이 문서로 링크)
  - "지금 할 일은 `inbox/task.md`를 읽어라" 명시
  - 산출물은 `outbox/`에 single-file html로 작성하라는 규약
  - 결정은 `memory/decisions.md`에 한 줄 추가하라는 규약
- 템플릿은 `baton init`이 생성.

### 3.2 `inbox/task.md`

- 자유 형식 markdown. 다만 권장 헤더:
  - `# Task` — 한 줄 제목
  - `## Goal` — 무엇을 달성하면 끝인가
  - `## Constraints` — 하면 안 되는 것
  - `## Output` — 어떤 형식의 산출물을 원하는가 (예: "outbox에 다이어그램 포함 html")
- `baton new "<task>"` 호출 시 기존 본은 `inbox/.archive/<ISO-timestamp>.md`로 이동, 새 task는 한 줄 제목으로만 채워진 템플릿으로 초기화.

### 3.3 `outbox/<NNN>-<slug>.html`

- 파일명: 3자리 zero-padded 일련번호 + `-` + kebab-case slug + `.html`
  - 예: `007-payment-flow-explainer.html`
- 일련번호는 *현재 outbox에 있는 최대 번호 + 1*. 번호는 재사용하지 않는다.
- **Single-file self-contained.** 외부 CDN, 외부 이미지 사용 금지. SVG·CSS·JS 인라인. *(이 규칙은 `outbox/`에만 적용. `docs/`의 시각자료 HTML은 웹폰트 CDN 허용, 단 주석에 "requires network" 명시)*
- 파일 첫 부분에 메타 주석:
  ```html
  <!--
    title: <한 줄 제목>
    task: <원본 inbox/task.md 첫 줄>
    created: <ISO timestamp>
  -->
  ```
- 일반 사용자 PC에서 더블클릭만으로 의도대로 렌더되어야 한다.

### 3.4 `memory/decisions.md`

- 한 결정 한 줄. 형식: `YYYY-MM-DD: <결정 내용> [근거: <짧게>]`
- 예: `2026-05-09: outbox는 single-file html로 통일 [근거: 공유·재현성]`
- Claude는 새 결정을 발견할 때마다 *덮어쓰지 말고 append*.

### 3.5 `memory/open-questions.md`

- 한 질문 한 줄. 답이 정해지면 같은 줄에 ` [resolved: <YYYY-MM-DD> 결정 내용]` 추가, 줄을 지우지 않는다.

### 3.6 `baton.json`

```json
{
  "name": "<project-name>",
  "createdAt": "<ISO>",
  "batonVersion": "0.1.0"
}
```

`baton` 명령들이 `baton.json` 존재 여부로 "여기는 baton 프로젝트인가"를 판정. 없으면 명령 실패.

## 4. 통신 프로토콜 (Communication Protocol)

루프는 6 단계, 모두 동기적·명시적이다.

| # | 행위자 | 동작 | 흔적 |
|---|--------|------|------|
| 1 | 사람 | `baton new "..."` 또는 직접 `inbox/task.md` 편집 | `inbox/task.md` 갱신, 이전 본 archive |
| 2 | Claude (세션 시작) | `CLAUDE.md` 자동 로드 → `inbox/task.md` 명시 읽기 | (없음) |
| 3 | Claude | 작업 수행 (코드 수정, 분석 등) | 코드/리포 변경 |
| 4 | Claude | `outbox/NNN-slug.html` 작성 | outbox에 새 파일 |
| 5 | Claude | 결정사항 `memory/decisions.md`에 append | decisions.md 한 줄 추가 |
| 6 | 사람 | `baton open` → 검토 → 피드백을 1번으로 다시 | `inbox/task.md` 갱신 |

세션 간 컨텍스트 전달은 **`memory/decisions.md`만**으로 이뤄진다. Claude는 새 세션 시작 시 `CLAUDE.md` → `inbox/task.md` → `memory/decisions.md` 순으로 읽는다.

## 5. CLI 동작 요약 (Behavior summary)

상세 입출력은 [cli-spec.md](./cli-spec.md). 여기서는 행동만.

- `baton init [name]` — 현재 디렉토리에 `baton.json` 없으면 위 폴더 트리 + 템플릿 생성. 있으면 “이미 baton 프로젝트”라고 알리고 종료(0).
- `baton new "<text>"` — `inbox/task.md` 첫 줄을 `# <text>`로, 나머지는 표준 템플릿으로 초기화. 이전 본은 archive.
- `baton open` — `outbox/`에서 mtime 최신인 `*.html`을 OS 기본 브라우저로 오픈. 비어있으면 friendly 메시지.
- `baton status` — 현재 task 첫 줄, outbox 파일 수, open-questions에서 `[resolved]` 없는 줄 수를 출력.

## 6. 에러·엣지 케이스 정책

- **`baton.json` 없음 + `init` 외 명령** → exit 1, “여기는 baton 프로젝트가 아닙니다. `baton init`을 먼저 실행하세요.”
- **`outbox/`에 html 0개 + `open`** → exit 0, “outbox가 비어있습니다.”
- **OS 기본 브라우저 오픈 실패** → 절대경로 file:// URL을 stdout에 출력 (사람이 직접 복붙 가능).
- **충돌 정책 (init, lenient)**: 디렉토리가 이미 있으면 누락 파일만 생성, 기존 파일 덮어쓰지 않음. 디렉토리 위치에 *파일*이 있으면 exit 1.
- **번호 충돌 (외부에서 같은 NNN을 만든 경우)** → Claude가 직접 outbox를 만들 때의 책임. CLI는 번호를 만들지 않는다 (현재 MVP에서 자동 생성 명령 없음).

## 7. 구현 노트 (Implementation Notes)

- 단일 진입점 `bin/baton.js`. shebang `#!/usr/bin/env node`.
- argv 파싱은 수제 switch — yargs/commander 도입 금지.
- 브라우저 오픈은 플랫폼별 `child_process.spawn`:
  - darwin: `open <path>`
  - win32: `cmd /c start "" <path>`
  - linux: `xdg-open <path>`
- 줄바꿈은 LF 고정. 모든 템플릿 파일을 `lib/templates/`에 두고 `fs.readFileSync`로 로드 (베이크인하지 말 것 — 사용자가 변경하면 즉시 반영되도록).
- 에러는 `console.error` + `process.exit(1)`. throw로 흐르지 않도록 top-level에서 try/catch.

## 8. 디렉토리 구조 (baton 자체 소스)

```
baton/                  ← 이 리포 자체
  bin/
    baton.js            진입점
  lib/
    commands/
      init.js
      new.js
      open.js
      status.js
    templates/
      CLAUDE.md
      task.md
      decisions.md
      open-questions.md
    util/
      project.js        baton.json 탐색·검증
      slug.js
      browser.js        OS별 open
  package.json          name=baton, bin={baton: "./bin/baton.js"}
```

## 9. 버전 정책

- semver. MVP는 `0.1.0`.
- breaking convention 변경 시 minor bump (예: 폴더 이름 변경 → `0.2.0`).
- **버전 불일치 정책**:
  - `baton status` (human): 끝에 `! 버전 불일치: file=<x> running=<y>` 경고 출력.
  - `baton status --json`: `batonVersion.file` + `batonVersion.running` 양쪽 노출, tooling이 판단.
  - 자동 마이그레이션 없음. 사람이 직접 `baton.json`을 수정하거나 재init.
