# TASK-0077-R2 접은 견적 카드 높이와 대화상자 배치(세션 B 병합 전 실측 뒤)

- **지위: 승인(허브, 2026-10-31).** 근거: 세션 B 실측 `docs/ai/design/path11-ui-2026-10/impl-d594d19/README.md`(82fe1cb). 조건 하나가 실패했다. 접은 견적 카드 높이 증가가 **+209 px**로 기준 ≤ 160 px를 넘었다(1024·1180 터치, 1366 마우스 같음).
- codex_model: `gpt-6.1-sol`
- reasoning_effort: `medium`
- BASE: R1 결과 스냅숏 d594d19(이 지시서를 담은 커밋의 부모).
- **허용 파일은 `src/ui/path11-screens.ts`, `src/ui/path11.css`, 0077 시험 파일, 결과, MANIFEST뿐이다.** 둘 다 지연 청크라 첫 화면 바이트는 바뀌지 않아야 한다. 바뀌면 멈춘다.
- 결과는 `docs/ai/tasks/results/TASK-0077.md` 맨 위 ‘R2’ 절에 적는다.

## 고칠 것

1. **접은 카드 높이(필수).** 세션 B 분해: fieldset 67, 요약 p 23(여백 15/15), 등급 p 23(15/15), details 52.
   - 요약과 등급을 한 `<p>`로 합친다. 문구는 그대로 두고 구분점(`·`)으로 잇는다.
   - `path11.css`에 `.p11 > p { margin: .25rem 0 }`을 둔다.
   - 세션 B 계산상 약 158 px이다. 결과에 실제 높이를 적되, 측정 판정은 세션 B 재측정으로 한다.
   - 라디오 라벨의 44 px 터치 대상은 유지한다.
2. **대화상자 재무상태표 행이 늘어나는 것(경미).** `.p11-statements { align-items: start }`.
3. **400%에서 라디오 라벨이 180 px씩인 것(경미).** 좁은 폭(예: `max-width: 30rem` 이하)에서 라벨을 한 줄씩 쌓는다. 44 px은 유지한다.

## 하지 않는 것

- 대화상자 위로 머리 줄 단추·토스트가 겹치는 문제(쌓임 맥락)는 첫 화면 CSS를 건드려야 할 수 있다. 원인 조사만 하고 결과 보고 ‘범위 밖 발견’에 적는다. 고치지 않는다.
- 경영 보고 칸의 경로 11 블록 길이, ‘30일’과 ‘어제 마감(30일)’ 중복 문구는 알파 관찰 항목으로 남긴다.

## 검증

- 0077 새 시험 전체 통과. 1에 대한 원천 단언을 하나 더한다. 접은 카드에 요약·등급이 한 `<p>`로 나온다.
- 첫 화면 gzip이 R1(132,329 B, dev)과 같다. 다르면 멈춘다.
- `npx vitest run`, `npm run typecheck`, `npm run build`, `python3 tools/build_package.py --manifest-only`, `PYTHONDONTWRITEBYTECODE=1 bash tools/ai/review_checks.sh --check <BASE>` 18종 실패 0. review_checks는 다른 무거운 검사와 동시에 돌리지 않는다.
