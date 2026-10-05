#!/usr/bin/env bash
# Claude 총괄 → Codex 구현 → Claude 검수 흐름의 ‘Codex 구현’ 단계.
#
# 사용:  tools/ai/codex_task.sh docs/ai/tasks/TASK-0001-recruitment-engine.md
#
# - 지시서 머리말의 `codex_model`, `reasoning_effort`, `web_search` 줄을 읽어 모델을 고른다.
# - 로컬 작업 브랜치 `codex/<작업 ID>`에서 실행한다. Codex는 커밋·푸시하지 않는다(CODEX_PREAMBLE.md).
# - 인증: 환경 변수 CODEX_API_KEY(OpenAI API 키). 키는 codex 실행에만 넘기고 화면에 찍지 않는다.
# - 샌드박스: 기본 workspace-write. 컨테이너가 Codex 샌드박스를 지원하지 않으면
#   CODEX_SANDBOX=danger-full-access 로 다시 실행한다(이 클라우드 컨테이너 자체가 격리 환경일 때만).
set -euo pipefail

task="${1:?지시서 경로를 주세요 (예: docs/ai/tasks/TASK-0001-...md)}"
root="$(git rev-parse --show-toplevel)"
cd "$root"
[ -f "$task" ] || { echo "지시서가 없습니다: $task" >&2; exit 2; }

field() { sed -n "s/^- $1: *\`\{0,1\}\([^\`]*\)\`\{0,1\}.*/\1/p" "$task" | head -1; }
id="$(basename "$task" .md | cut -d- -f1-2)"
model="$(field codex_model)"
effort="$(field reasoning_effort)"
search="$(field web_search)"
[ -n "$model" ] || { echo "지시서에 codex_model 줄이 없습니다." >&2; exit 2; }
effort="${effort:-medium}"

if ! git diff --quiet || ! git diff --cached --quiet; then
  echo "작업 트리에 커밋하지 않은 변경이 있습니다. 검수 대상과 섞이지 않도록 먼저 정리하세요." >&2
  exit 2
fi
if [ -z "${CODEX_API_KEY:-}" ]; then
  echo "CODEX_API_KEY가 없습니다. 클라우드 환경 설정의 환경 변수에 등록한 뒤 새 세션에서 실행하세요." >&2
  exit 3
fi
command -v codex >/dev/null || npm i -g @openai/codex@0.160.0 >/dev/null

base="$(git rev-parse --abbrev-ref HEAD)"
branch="codex/${id}"
if git show-ref --verify --quiet "refs/heads/$branch"; then git switch "$branch"; else git switch -c "$branch"; fi
echo "기준 브랜치: $base → 작업 브랜치: $branch (모델 $model, 추론 $effort${search:+, 웹 검색 $search})"

log_dir="${CODEX_LOG_DIR:-${TMPDIR:-/tmp}/scitrade-codex}"
mkdir -p "$log_dir"
prompt="$(cat docs/ai/tasks/CODEX_PREAMBLE.md)

---

작업 ID: ${id}

$(cat "$task")"

args=(exec -m "$model" -c "model_reasoning_effort=\"$effort\"" --sandbox "${CODEX_SANDBOX:-workspace-write}" -C "$root" -o "$log_dir/$id.last.md" --json)
[ "$search" = "on" ] && args+=(--search)

set +e
codex "${args[@]}" "$prompt" >"$log_dir/$id.jsonl" 2>"$log_dir/$id.stderr.log"
status=$?
set -e

echo "Codex 종료 코드: $status"
echo "마지막 메시지: $log_dir/$id.last.md · 이벤트: $log_dir/$id.jsonl · 오류: $log_dir/$id.stderr.log"
git status --short
echo "다음: Claude가 tools/ai/review_checks.sh 로 검수한다. 기준 브랜치로 돌아가려면 git switch $base"
exit "$status"
