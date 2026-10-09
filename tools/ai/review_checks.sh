#!/usr/bin/env bash
# Claude 검수 단계의 자동 검사. Codex 작업 브랜치에서 실행한다.
# API 키가 테스트·빌드 과정(의존성 스크립트 포함)에 넘어가지 않도록 키 변수를 지운 환경에서 돌린다.
# 화면 확인(Playwright)과 diff 읽기는 Claude가 따로 한다.
# 사용법: tools/ai/review_checks.sh [--check] [기준]
# --check: MANIFEST.json을 다시 쓰지 않고 확인만 한다. 검사 전후 작업 트리 상태가 같은지도 본다.
set -uo pipefail
usage() { echo '사용법: tools/ai/review_checks.sh [--check] [기준]'; }
mode=수정
base=HEAD
positions=0
for arg in "$@"; do
  case "$arg" in
    --check) mode=확인 ;;
    -h|--help) usage; exit 0 ;;
    -*) echo "알 수 없는 옵션: $arg"; usage; exit 2 ;;
    *) positions=$((positions+1)); base="$arg" ;;
  esac
done
if ((positions>1)); then usage; exit 2; fi
root="$(git rev-parse --show-toplevel)"
cd "$root"
run() {
  total=$((total+1))
  echo "▶ $*"
  if env -u CODEX_API_KEY -u OPENAI_API_KEY "$@"; then echo '  통과'; else echo "  실패 ($*)"; fails=$((fails+1)); fi
}
tree_state() {
  git status --porcelain=v1 --untracked-files=all
  git diff --binary HEAD | sha256sum
  git ls-files --others --exclude-standard -z | xargs -0 -r sha256sum
}
total=0
fails=0
if [[ "$mode" == 확인 ]]; then before="$(tree_state)"; run python3 tools/build_package.py --check
else run python3 tools/build_package.py --manifest-only; fi
run python3 tools/validate_data.py
run npm run --silent typecheck
run npx vitest run
run npm run --silent build
# 그림 도구와 지도 생성 시험. 지도 원본 재생성 시험은 원본 폴더(SCITRADE_MAP_SOURCES, 없으면 저장소 옆 map/)가 있을 때만 돈다.
run python3 tools/art/test_pixel_tools.py
run python3 -m unittest discover -s scripts -p 'test_*.py'
run python3 tools/test_validate_data.py
run python3 tools/check_fact_mixing.py
run python3 tools/test_check_fact_mixing.py
run node --test tools/browser/lib.test.mjs
if [[ "$mode" == 확인 ]]; then
  after="$(tree_state)"
  total=$((total+1))
  echo '▶ 작업 트리 변화 없음'
  if [[ "$before" == "$after" ]]; then echo '  통과'
  else
    echo '  실패 (검사가 작업 트리를 바꿨다)'
    diff <(printf '%s\n' "$before") <(printf '%s\n' "$after") || true
    fails=$((fails+1))
  fi
fi
echo "검사 $total종, 실패 $fails종 (모드: $mode)"
echo
echo "변경 요약 (기준: $base):"
git diff --stat "$base"
git status --short --untracked-files=all | grep '^??' || true
if ((fails)); then exit 1; fi
