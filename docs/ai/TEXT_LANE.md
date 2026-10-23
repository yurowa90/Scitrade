# 문구 담당 줄(세션 T · Antigravity CLI)

게임 속 문구·대사는 사용자 Mac의 Antigravity CLI(`agy`)로 만든다. 사용자의 구글 AI 울트라 구독 로그인을 쓰므로 API 키를 쓰지 않는다(2026-10-23 사용자 결정). Codex 줄(구현)과 같은 꼴로 운영한다.

## 역할

| 누구 | 하는 일 |
|---|---|
| 허브 | 문구 지시서(`docs/ai/tasks/TEXT-xxxx.md`) 작성·승인, 결과 검수, 개발 브랜치 병합 |
| 세션 T(사용자 Mac, 터미널 `claude`) | 지시서를 받아 `tools/ai/agy_task.sh`로 `agy`를 한 번에 하나씩 실행하고, 결과를 `claude/text-lane` 브랜치에 커밋·push |
| `agy`(Gemini 4 Argon, 추론 보통) | 지시서가 정한 결과 파일을 쓴다 |
| 세션 B | 화면에 들어가는 문구의 배치·길이 실측 |

## 실행

- 확인된 비대화식 꼴(세션 T, 2026-10-23): `agy -p '<프롬프트>' --model gemini-4-argon-medium --print-timeout <시간> < /dev/null`. 짧은 시험이 20초 안에 끝나고 종료 코드 0이었다.
- `tools/ai/agy_task.sh <지시서>`가 지시서 전문을 프롬프트로 넘기고, 로그를 `$AGY_LOG_DIR/<ID>.*`에 남긴다. 동시에 두 개를 돌리지 않는다(잠금 파일).
- 로그인 정보·토큰은 출력하거나 저장소에 넣지 않는다.

## 검수 기준

실명 기업·선박 금지, KOTRA·KITA 흉내 금지, 민감 소재 금지, 사실 섞임 검사(`check_fact_mixing`), 학생 어휘 수준, 교육 내용 정확성, 사용자 승인 문장(`docs/ai/design/BUSAN-approved-texts.md`) 보존. 자료 문구를 바꾸면 `python3 tools/validate_data.py`를 통과해야 한다.
