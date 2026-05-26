#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/.." && pwd)"

cd "$ROOT/core"
docker compose build
docker compose up -d --remove-orphans

echo "Waiting for Keycloak..."
for i in $(seq 1 60); do
  if curl -sf http://localhost:8080/realms/shopflow/.well-known/openid-configuration >/dev/null; then
    break
  fi
  sleep 5
done

cd "$ROOT/security"
pwsh -NoProfile -ExecutionPolicy Bypass -File ./fetch-lab-tokens.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ./fetch-lab-s2s-token.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ./run-security-checks.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ./test-opa-policy.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ./test-s2s-client-credentials.ps1
pwsh -NoProfile -ExecutionPolicy Bypass -File ./test-redis-consistency.ps1

cd "$ROOT/metrics"
pwsh -NoProfile -ExecutionPolicy Bypass -File ./run-g3-benchmark.ps1 -Requests 20
pwsh -NoProfile -ExecutionPolicy Bypass -File ./run-incident-drill.ps1

echo "Security gate: PASS"
