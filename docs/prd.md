# baton — PRD

> 사람과 Claude(Code)가 같은 프로젝트에서 작업을 주고받기 위한, **약속된 폴더 구조 + 컨벤션 + 얇은 CLI**.

## 1. 문제 (Problem)

CLI 환경에서 Claude Code와 협업해보면 세 가지 마찰이 반복된다.

1. **긴 마크다운은 읽히지 않는다.** 200줄을 넘기면 Claude는 뒷부분을 흘려읽거나 앞부분 지시를 잊고, 사람도 마찬가지다. 결과적으로 `CLAUDE.md`가 거대해질수록 효과가 떨어진다.
2. **사람이 읽기 좋은 산출물 형식이 없다.** 표·다이어그램·색·인터랙션이 필요한 스펙·리포트·계획서를 마크다운으로 받으면 ASCII 아트와 텍스트 나열이 되어 결국 안 읽는다 (`docs/article.md` 참고).
3. **인터페이스가 사람마다, 세션마다 다르다.** "내 task는 어디에 쓰지?", "Claude가 만든 결과물은 어디에서 보지?", "이전 세션의 결정은 어디에 누적되지?" 가 매번 즉흥적으로 정해진다. 다음 세션의 Claude는 그 즉흥성을 모른다.

## 2. 해결 컨셉 (Solution Concept)

마크다운과 HTML의 장단점을 받아들여 **방향에 따라 형식을 분리**한다.

| 방향 | 형식 | 이유 |
|------|------|------|
| 사람 → Claude (지시) | 짧은 markdown | Claude가 편집·치환하기 좋음, diff 명확 |
| Claude → 사람 (산출물) | HTML | 정보밀도, 다이어그램·색·인터랙션, 공유 용이 |
| 양방향 공유 메모리 | 짧은 markdown (append-only) | 누적·검색·Diff 용이 |

이 분리를 **고정된 폴더 이름**으로 강제하면, Claude는 매번 어디에 쓸지 헷갈리지 않고 사람도 어디서 볼지 헷갈리지 않는다. CLI는 폴더를 만들고 한두 개 흔한 동작(최신 산출물 열기, task 갱신)을 줄여주는 정도로만 얇게 둔다.

> "이 툴은 소프트웨어라기보다 약속된 폴더 구조 + 컨벤션이다." — 이전 세션의 결론을 그대로 채택.

## 3. 대상 사용자 (Target User)

- Claude Code(또는 동급 CLI 에이전트)와 매일 협업하는 개인 개발자
- 한 프로젝트 안에서 여러 Claude 세션을 도는 사람 — 세션 간 컨텍스트 전달 통로가 필요한 경우
- "Markdown만으로 충분치 않다"고 느끼지만 거대한 협업 SaaS는 과한 사람

비대상: 다중 사용자 동기화·권한·실시간 공동편집을 원하는 팀 (이는 `out of scope`).

## 4. 사용자 여정 (User Journey)

1. 새 프로젝트에서 `baton init` 실행 → 폴더 스켈레톤 + 템플릿 생성.
2. 사람이 `inbox/task.md`에 한 화면 분량의 지시를 쓴다 (또는 `baton new "<task>"`로 한 줄 입력).
3. Claude Code 세션 시작. `CLAUDE.md`가 자동 로드되어 폴더 컨벤션을 안다. `inbox/task.md`를 읽고 작업.
4. Claude는 결과를 `outbox/<NNN>-<slug>.html`로 단일 파일 self-contained로 쓴다. 결정사항은 `memory/decisions.md`에 한 줄 추가.
5. 사람이 `baton open` → 가장 최근 outbox html이 OS 기본 브라우저에서 열린다.
6. (선택) `baton status`로 현재 task / outbox 개수 / 미해결 질문 수를 한 줄 확인.
7. 검토 후 피드백을 다시 `inbox/task.md`로 적는다 → 루프.

## 5. 성공 기준 (Success Criteria)

다음을 모두 만족하면 MVP 성공:

- **Cold start.** 처음 보는 Claude 세션이 `CLAUDE.md`만 읽고도 *“task를 어디서 읽고, 결과를 어디에 무슨 형식으로 쓰고, 결정을 어디에 남기는가”*를 답할 수 있다.
- **Zero deps.** 외부 npm 패키지 0. Node.js 내장 모듈만 사용.
- **One-screen task.** `inbox/task.md` 템플릿이 한 화면(≈ 40줄) 안에 들어간다.
- **One-key review.** `baton open` 한 번으로 가장 최근 산출물이 브라우저에 뜬다.
- **Replayable.** `outbox/`의 번호 prefix만으로 Claude의 작업 순서를 재구성할 수 있다.
- **Portable.** 임의의 빈 폴더에서 `baton init`만 하면 어디서나 동일하게 동작.

## 6. Non-Goals

다음은 의도적으로 배제한다.

- **에디터·뷰어 통합 GUI.** 사람은 평소 쓰는 마크다운 에디터 + 브라우저로 충분.
- **HTML 빌드 파이프라인.** outbox html은 Claude가 매번 single-file로 직접 작성. webpack·번들러 없음.
- **실시간 watch / 자동 새로고침.** `baton open`을 사람이 명시적으로 호출.
- **다중 사용자·권한·동기화.** Git이 있으면 충분.
- **외부 시스템 연동 (Linear, Slack, Jira).** PRD 1.0 범위 외.
- **별도 task 데이터베이스.** task는 항상 `inbox/task.md` 한 파일. 과거는 `inbox/.archive/`로 이동.

## 7. 후속 (Follow-ups, not MVP)

다음 라운드 후보:

- `.claude/commands/` slash command 통합 — `/baton-new`, `/baton-status`
- `baton log` — outbox 목록을 한 줄씩 출력
- `baton archive` — outbox/inbox 정리 명령
- 기본 HTML 템플릿(스타일·다이어그램 도구) 묶음 — Claude가 일관된 스타일로 산출물을 쓰도록

## 8. 형식 선택의 근거 (Why this format split?)

`docs/article.md`(Thariq, "Unreasonable Effectiveness of HTML")의 핵심 주장:

- HTML은 정보 밀도가 높고, 다이어그램·인터랙션·CSS 스타일을 포함할 수 있다 → Claude → 사람 방향에 적합.
- Markdown은 편집·diff·자동화가 쉽다 → 사람 → Claude 방향에 적합.
- HTML은 생성 시간이 2–4배 길고 git diff가 지저분하다 → 자주 갱신되는 task/decisions에는 부적합.

baton은 이 트레이드오프를 *방향별로 다르게 해결*한 결과물이다.

## 9. 측정 가능한 성공 지표 (Optional, 사용자별)

엄격한 KPI보다는 자가 점검용:

- 한 주에 `baton open` 호출 횟수 ≥ 작업 사이클 횟수의 80%
- `CLAUDE.md` 줄 수 < 100 유지
- 새 Claude 세션에서 “이 프로젝트 구조 설명해줘” 질문 시 5초 안에 정확한 폴더 트리를 답함
