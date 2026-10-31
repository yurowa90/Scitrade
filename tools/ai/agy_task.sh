#!/usr/bin/env bash
# 문구 담당 줄(세션 T)의 ‘agy 작업’ 단계. 운영 규칙은 docs/ai/TEXT_LANE.md.
#
# 사용:  tools/ai/agy_task.sh docs/ai/tasks/TEXT-0001-copy-audit.md
#
# - 지시서 전문을 프롬프트로 넘겨 Antigravity CLI(agy)를 비대화식으로 한 번 실행한다.
# - 모델: Gemini 4 Argon, 추론 보통(gemini-4-argon-medium). 바꿀 때는 AGY_MODEL을 준다.
# - 인증: 사용자의 구글 AI 울트라 구독 로그인. API 키는 쓰지 않는다(2026-10-23 사용자 결정).
#   로그인 정보·토큰은 출력하지 않는다. 로그인이 풀렸으면 사용자가 직접 다시 로그인한다.
# - agy는 커밋·푸시하지 않는다. 결과 파일 검수·커밋·push는 세션 T(Claude)가 한다.
# - 작업 폴더 옵션이 없어 저장소 최상위에서 실행한다(agy는 현재 폴더를 작업 범위로 잡는다).
# - 표준 입력을 /dev/null로 막는다. 막지 않으면 agy가 입력을 기다리며 멈춘다(2026-10-23 확인).
set -euo pipefail

task="${1:?지시서 경로를 주세요 (예: docs/ai/tasks/TEXT-0001-...md)}"
root="$(git rev-parse --show-toplevel)"
cd "$root"
[ -f "$task" ] || { echo "지시서가 없습니다: $task" >&2; exit 2; }
command -v agy >/dev/null || { echo "agy가 없습니다. 이 줄은 사용자 Mac의 세션 T에서만 돕니다." >&2; exit 3; }

id="$(basename "$task" .md | cut -d- -f1-2)"
model="${AGY_MODEL:-gemini-4-argon-medium}"
timeout="${AGY_PRINT_TIMEOUT:-1800s}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "작업 트리에 커밋하지 않은 변경이 있습니다. 결과와 섞이지 않도록 먼저 정리하세요." >&2
  exit 2
fi

log_dir="${AGY_LOG_DIR:-$HOME/scitrade-agy-logs}"
mkdir -p "$log_dir"

# 동시에 두 개를 돌리지 않는다. mkdir는 원자적이라 잠금으로 쓴다.
lock="$log_dir/.agy_task.lock"
if ! mkdir "$lock" 2>/dev/null; then
  echo "다른 agy 작업이 돌고 있습니다(잠금: $lock, 내용: $(cat "$lock/info" 2>/dev/null))." >&2
  echo "돌고 있는 작업이 없으면 잠금 폴더를 지우고 다시 실행하세요." >&2
  exit 5
fi
echo "$id pid=$$ $(date '+%F %T')" >"$lock/info"
trap 'rm -rf "$lock"' EXIT

prompt_file="$log_dir/$id.prompt.md"
{
  printf '너는 Scitrade 저장소(현재 폴더)의 문구 담당이다. 아래 지시서 하나만 수행한다.\n'
  printf '지시서가 정한 결과 파일 말고는 어떤 파일도 만들거나 고치지 않는다. git 명령(커밋·브랜치 전환·push)을 쓰지 않는다.\n'
  # 비대화식 실행에서는 셸 명령 승인을 물을 수 없어 거부되고, agy가 시간 제한까지 멈춘다(2026-10-23 TEXT-0001 첫 실행).
  printf '셸·터미널 명령(find, grep, ls, cat 등)은 쓰지 않는다. 파일 목록 보기·파일 읽기·검색·파일 쓰기는 내장 도구로만 한다.\n'
  printf '\n---\n\n작업 ID: %s\n\n' "$id"
  cat "$task"
} >"$prompt_file"

# 프롬프트는 명령 인수 하나로 넘기므로 macOS의 인수 길이 한계(약 1 MiB, 인수 하나는 더 짧을 수 있다)에 걸린다.
size="$(wc -c <"$prompt_file" | tr -d ' ')"
[ "$size" -le 120000 ] || { echo "프롬프트가 너무 깁니다($size 바이트). 지시서를 나누세요." >&2; exit 2; }

# 결과 파일을 써야 하므로 편집만 자동 승인한다(accept-edits). 명령 실행 전부를 승인하는
# --dangerously-skip-permissions는 쓰지 않는다.
args=(-p "$(cat "$prompt_file")" --model "$model" --mode accept-edits
      --print-timeout "$timeout" --log-file "$log_dir/$id.agy.log")

echo "agy 실행: $id (모델 $model, 시간 제한 $timeout, 폴더 $root)"
start="$(date +%s)"
set +e
agy "${args[@]}" >"$log_dir/$id.out.md" 2>"$log_dir/$id.stderr.log" </dev/null
status=$?
set -e
elapsed=$(( $(date +%s) - start ))
# agy는 도구 거부로 멈춘 뒤 시간 제한에 걸려도 종료 코드 0을 돌려준다. 출력이 비면 실패로 본다.
if [ "$status" -eq 0 ] && [ ! -s "$log_dir/$id.out.md" ]; then
  echo "agy가 0으로 끝났지만 출력이 비어 있습니다. 오류 로그를 보세요: $(head -c 400 "$log_dir/$id.stderr.log")" >&2
  status=6
fi

echo "agy 종료 코드: $status · 걸린 시간: ${elapsed}초 · 출력 $(wc -c <"$log_dir/$id.out.md" | tr -d ' ')바이트"
echo "프롬프트: $log_dir/$id.prompt.md · 출력: $log_dir/$id.out.md · 오류: $log_dir/$id.stderr.log · CLI 로그: $log_dir/$id.agy.log"
git status --short
exit "$status"
