# baton

> 사람과 Claude가 같은 프로젝트에서 작업을 주고받기 위한 폴더 컨벤션 + 얇은 CLI.

## 한 줄 컨셉

Markdown은 사람→Claude 방향에, HTML은 Claude→사람 방향에 쓴다. 폴더 이름으로 인터페이스를 표준화한다.

## 현재 단계

- ✅ PRD: [docs/prd.md](./docs/prd.md)
- ✅ 설계: [docs/design.md](./docs/design.md)
- ✅ CLI 스펙: [docs/cli-spec.md](./docs/cli-spec.md)
- ✅ 시각 요약: [docs/architecture.html](./docs/architecture.html)
- ✅ MVP CLI 구현: `bin/baton.js`, `lib/` — 4개 명령 기본 동작 확인
- 🔄 **지금**: 문서↔코드 정합성 확인, 엣지 케이스 하드닝, 스모크 테스트

## Claude 컨텍스트 로드 순서

**기본 로드 (항상):**
1. 이 파일 (`CLAUDE.md`)
2. `inbox/task.md`
3. `memory/decisions.md`
4. `memory/summary.md` (있으면)

**온디맨드 (명시 요청 시에만):**
- `docs/*` (설계·스펙·PRD)
- `inbox/context/*` (참조 자료)
- `docs/history/*` (이전 세션 로그)

**읽지 말 것:**
- `outbox/*.html` — 사람이 보는 산출물. 사용자가 명시 요청하지 않으면 읽지 않는다.

## 토큰 예산 규칙

| 파일 | 한도 |
|------|------|
| 이 `CLAUDE.md` | 100줄 이내 |
| `inbox/task.md` | 40줄 이내 |
| `memory/decisions.md` | 누적 50줄 초과 시 월별 archive 권장 |
| `memory/open-questions.md` | resolved 항목 70% 초과 시 archive 검토 |
| `memory/summary.md` | 20줄 이내 |

## 폴더 컨벤션

| 폴더 | 방향 | 규칙 |
|------|------|------|
| `inbox/task.md` | 사람 → Claude | 40줄 이내. |
| `inbox/context/` | 사람 → Claude | 온디맨드 로드. |
| `outbox/` | Claude → 사람 | `NNN-slug.html` 단일 파일. No CDN. |
| `memory/decisions.md` | 양방향 | Append-only. 삭제 금지. |
| `memory/open-questions.md` | 양방향 | resolved 시 같은 줄에 표시. |
| `memory/summary.md` | 양방향 | 세션 부트스트랩용 20줄 요약. |

## Claude가 해야 할 것

1. **산출물**: `outbox/NNN-slug.html`. 번호는 현재 최대 + 1 (3자리 zero-pad). 파일 첫 줄에 메타 주석.
2. **결정 기록**: 새 결정 → `memory/decisions.md` append. 형식: `YYYY-MM-DD: <결정> [근거: <짧게>]`
3. **문서 수정 시**: PRD ↔ design ↔ cli-spec ↔ architecture 일관성 유지.

## 주의 (Pitfalls)

- 외부 npm 패키지 추가 금지 (zero-deps). 필요하면 PRD/design 수정 + 사람 승인.
- `docs/history/` 이전 코드 재사용 금지. 컨벤션·이름만 참고.
- 마크다운 파일 200줄 초과 시 분할 여부 질문.
- `bin/`, `lib/` 이외 경로에 구현 코드 두지 말 것.

## 다음 할 일

1. 문서↔코드 정합성 확인 (design.md ↔ 실제 코드 동작)
2. 엣지 케이스 하드닝 (init 충돌 정책, archive 동작 등)
3. `npm run smoke` 스모크 테스트 작성 및 통과 확인
4. 사용 가이드: `outbox/001-usage-guide.html` 참고
