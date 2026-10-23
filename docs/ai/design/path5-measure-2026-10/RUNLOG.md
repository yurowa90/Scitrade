# 경로 5 측정 실행 기록

- 계획서: `PLAN.md`(허브 승인 `e8ee6b1`). 측정 커밋 `e8ee6b1`(0회차). 세션 A 컨테이너, 작업 트리는 `e8ee6b1`을 분리 체크아웃한 별도 작업 트리(`node_modules` 심볼릭 링크 하나만 추적 밖)다.
- JSON·표는 저장소 밖(세션 A scratchpad `measure/r<회차>/`)에 두고 여기에는 sha256만 적는다. 시각은 KST다.

## 0회차

### G0 측정 전 확인(2026-10-23)

| 항목 | 결과 |
|---|---|
| 측정 커밋 | `e8ee6b19b45e4023540fe8e2f8ea8ef73cf87a5d` |
| `data/market_rules.json` sha256 | `a9a3eb45f395222613b6fca9893146863a99c6644fb00fa9cbc1bbc82c48b742` = 고정 기록 |
| 골든 검사기 | 종료 0(rules-2 105회, rules-1 400회 일치) |
| 프로필 대조(`check_profile_vs_design.py DESIGN.md data/market_rules.json data/goods.json`) | `DIFF 0`, 출력 sha256 `8fab8fe27b51bccfa4e450908fd9c1117a965779a1755b9e14acccf6242689e8` = 고정 기록 |
| `validate_data.py` | 통과 |

G0 통과.

### 단계

| 단계 | 명령 | 시각(소요) | 종료 | 출력 sha256 |
|---|---|---|---|---|
