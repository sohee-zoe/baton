# baton — CLI Spec

> 명령별 인자, 표준 출력, 에러, exit code 명세. 동작 배경은 [design.md §5–6](./design.md), 컨셉은 [prd.md](./prd.md) 참고.

## 0. 공통 (Common)

- 실행 위치: 임의의 디렉토리. `init` 외의 모든 명령은 **현재 작업 디렉토리에서 위로 올라가며 가장 가까운 `baton.json`을 찾는다**.
- 그 `baton.json`이 위치한 디렉토리를 “프로젝트 루트”로 간주.
- 미발견 시 모든 명령(`init` 제외)은 exit 1.
- 정상 출력은 **stdout**, 에러 메시지는 **stderr**. 파이프라인이 정상 출력과 에러를 분리할 수 있어야 한다.
- 컬러 없이 ASCII 한 단락. 한국어 메시지.
- 종료 코드: `0` 성공, `1` 사용자 환경 오류(이미 존재/없음/spawn 실패), `2` 사용법 오류(인자 부족/형식).

## 1. `baton init [name]`

새 baton 프로젝트를 현재 디렉토리에 만든다.

### 인자
- `name` *(선택)*: 프로젝트 이름. 생략 시 `path.basename(process.cwd())`.

### 동작
1. 현재 디렉토리에 `baton.json`이 이미 있으면 → 출력 `이미 baton 프로젝트입니다: <name>` → exit 0 (idempotent).
2. 다음 디렉토리·파일을 생성:
   - `baton.json` (name, createdAt, batonVersion 채움)
   - `CLAUDE.md`, `inbox/task.md`, `inbox/.archive/.gitkeep`, `inbox/context/.gitkeep`, `outbox/.gitkeep`, `memory/decisions.md`, `memory/open-questions.md`
3. 각 파일 내용은 `lib/templates/`에서 로드. 템플릿에 `{{name}}`, `{{createdAt}}` placeholder 치환.
4. 출력 (정상):
   ```
   ✓ baton 프로젝트 생성: <name>
     CLAUDE.md, inbox/, outbox/, memory/ 준비됨.
     다음: inbox/task.md를 편집하거나 `baton new "..."` 실행.
   ```

### 에러
- `inbox/`, `outbox/`, `memory/` 위치에 *파일*이 존재 → exit 1, “충돌: <path>는 이미 파일로 존재합니다.”
- 해당 위치에 *디렉토리*가 이미 있으면 → 누락 하위 파일만 생성, 기존 파일 덮어쓰지 않음 (lenient). 내용 유무 무관.

## 2. `baton new "<task>"`

`inbox/task.md`를 새 task로 초기화. 이전 본은 archive.

### 인자
- `task` *(필수)*: 1줄 제목. argv[2]로 전달된 단일 인자. 빈 문자열은 인자 누락으로 간주. (shell quoting은 사용자 책임)

### 동작
1. 프로젝트 루트 탐색. 미발견 → exit 1.
2. 기존 `inbox/task.md`가 있으면 → `inbox/.archive/<ISO-timestamp>.md`로 이동 (mv).
   - timestamp 형식: `2026-05-09T12-30-45` (콜론은 파일시스템 호환을 위해 `-`로 치환).
3. 새 `inbox/task.md` 작성. 템플릿:
   ```markdown
   # <task>

   ## Goal


   ## Constraints


   ## Output

   - outbox/에 single-file html로 결과를 남길 것.
   ```
4. 출력:
   ```
   ✓ inbox/task.md 갱신: <task>
     이전 task → inbox/.archive/<timestamp>.md
   ```

### 에러
- 인자 누락 또는 빈 문자열 → exit 2, “사용법: baton new \"<task>\"”.
- archive 이동 실패(권한 등) → exit 1, 원본은 *건드리지 않은 채* 종료.

## 3. `baton open`

가장 최근 outbox HTML을 OS 기본 브라우저로 연다.

### 인자
없음.

### 동작
1. 프로젝트 루트 탐색.
2. `outbox/*.html` 목록 수집. mtime 내림차순 정렬, 첫 번째를 선택.
3. 플랫폼별 명령으로 오픈:
   - darwin: `open <abs-path>`
   - win32: `cmd /c start "" <abs-path>`
   - linux: `xdg-open <abs-path>`
4. 출력:
   ```
   → 열기: outbox/007-payment-flow-explainer.html
   ```

### 에러 / 엣지
- `outbox/`에 html 0개 → exit 0, `outbox/가 비어있습니다. Claude에게 결과를 outbox/에 남기도록 요청하세요.`
- 브라우저 spawn 실패 → exit 1 + stderr에 안내:
  ```
  ! 브라우저 자동 실행 실패. 다음 URL을 직접 여세요:
    file:///abs/path/to/outbox/007-payment-flow-explainer.html
  ```

## 4. `baton status`

현재 상태 한 화면 요약.

### 인자
없음.

### 동작
1. 프로젝트 루트 탐색.
2. `inbox/task.md` 첫 비어있지 않은 줄을 task 제목으로 추출.
3. `outbox/*.html` 개수.
4. `memory/open-questions.md`에서 `[resolved]`가 없는 줄 개수.
5. 출력:
   ```
   baton: <project-name>
     task    : <task 제목>
     outbox  : <N>개 (최신: <NNN-slug.html>)
     open Q  : <M>개
   ```

### 에러
- `inbox/task.md`가 비어있음 → task 줄에 `(없음)` 표시. 정상 종료.
- `baton.json.batonVersion`과 현재 실행 버전이 다르면 끝에 `! 버전 불일치: file=<x> running=<y>` 한 줄 추가 출력 (정상 종료).

## 5. `baton --version` / `-v`

설치된 baton 버전 한 줄 출력. exit 0.

## 6. `baton --help` / `-h` / 인자 없음

사용 가능 명령 목록 + 한 줄 설명. exit 0.

```
baton — 사람↔Claude 협업 폴더 컨벤션

  baton init [name]      현재 디렉토리에 baton 프로젝트 생성
  baton new "<task>"     inbox/task.md 갱신 (이전 본 archive)
  baton open             outbox/ 최신 html을 브라우저로 열기
  baton status           현재 task / outbox / open Q 요약
  baton --version        버전 출력
```

## 7. 알려진 한계 (Known limitations, MVP)

- 동시성 보장 없음. 두 프로세스가 동시에 `baton new`를 호출하면 archive 파일명 충돌 가능 (timestamp 1초 해상도).
- Windows 환경 path/encoding은 best-effort. UTF-8 기본.
- non-TTY 환경에서도 동일 출력. 색상·spinner 없음.
