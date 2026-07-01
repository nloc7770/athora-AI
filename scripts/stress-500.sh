#!/bin/bash
# 500-round stress test runner
cd /Users/locnguyen/project/athora/apps/web

PASS=0
FAIL=0
TOTAL=0
LOG="/Users/locnguyen/project/athora/test-results/stress-500.log"

echo "=== STRESS TEST 500 ROUNDS — Started $(date) ===" > "$LOG"

for i in $(seq 1 500); do
  OUTPUT=$(npx playwright test tests/student-stress.spec.ts --reporter=line --workers=1 2>&1)
  P=$(echo "$OUTPUT" | grep -oP '\d+ passed' | grep -oP '\d+')
  F=$(echo "$OUTPUT" | grep -oP '\d+ failed' | grep -oP '\d+')
  P=${P:-0}
  F=${F:-0}
  PASS=$((PASS + P))
  FAIL=$((FAIL + F))
  TOTAL=$((TOTAL + 1))
  echo "Round $i: pass=$P fail=$F | Cumulative: $TOTAL rounds, $PASS passed, $FAIL failed" >> "$LOG"

  # Early stop on catastrophic failure
  if [ "$P" = "0" ] && [ "$F" -gt "10" ]; then
    echo "CRITICAL FAILURE at round $i — stopping early" >> "$LOG"
    break
  fi
done

echo "=== FINAL: $TOTAL rounds completed, $PASS total passed, $FAIL total failed ===" >> "$LOG"
echo "=== Finished $(date) ===" >> "$LOG"
