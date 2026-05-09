# {{name}}

> 이 프로젝트는 baton 컨벤션으로 관리된다.
> baton = 사람↔Claude 협업 폴더 구조. Markdown으로 지시하고 HTML로 결과를 받는다.

## 지금 할 일

**`inbox/task.md`를 읽어라.** 거기에 현재 task가 있다.

## 컨텍스트 로드 순서

기본: 이 파일 → `inbox/task.md` → `memory/decisions.md` → `memory/summary.md` (있으면)
온디맨드: `inbox/context/*` (명시 요청 시에만)
**읽지 말 것**: `outbox/*.html` — 사용자가 명시 요청하지 않으면 읽지 않는다.

## 폴더 컨벤션

| 폴더 | 방향 | 형식 | 규칙 |
|------|------|------|------|
| `inbox/task.md` | 사람 → Claude | Markdown | 40줄 이내. |
| `inbox/context/` | 사람 → Claude | 임의 | 명시 요청 시만 로드. |
| `outbox/` | Claude → 사람 | HTML | `NNN-slug.html` 단일 파일, self-contained. |
| `memory/decisions.md` | 양방향 | Markdown | 결정 한 줄씩 누적. 덮어쓰기 금지. |
| `memory/open-questions.md` | 양방향 | Markdown | 미결 질문. 해결 시 `[resolved]` 추가. 줄 삭제 금지. |
| `memory/summary.md` | 양방향 | Markdown | 세션 부트스트랩 요약. 20줄 이내. |

## Claude가 해야 할 것

1. **산출물**: `outbox/NNN-slug.html` 형식으로. 외부 CDN 사용 금지, single-file self-contained.
   - 번호는 현재 outbox 최대값 + 1 (3자리 zero-pad).
   - 파일 첫 줄에 `<!-- title: ... task: ... created: ... -->` 메타 주석.
2. **결정 기록**: 새 결정 발생 시 `memory/decisions.md`에 한 줄 append.
   - 형식: `YYYY-MM-DD: <결정> [근거: <짧게>]`
3. **분량 원칙**: markdown 지시/결정 파일은 짧게 유지. 100줄 넘으면 분할 여부 질문.

