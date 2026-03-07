#!/usr/bin/env bash

set -euo pipefail

BASE_SHA="${1:-}"
HEAD_SHA="${2:-HEAD}"

# Push 首次提交可能没有 before sha，回退到上一提交
if [[ -z "${BASE_SHA}" || "${BASE_SHA}" == "0000000000000000000000000000000000000000" ]]; then
  if git rev-parse --verify HEAD^ >/dev/null 2>&1; then
    BASE_SHA="$(git rev-parse HEAD^)"
  else
    echo "未找到可对比基线，跳过 secrets 检查。"
    exit 0
  fi
fi

# 仅扫描新增行，避免历史噪音
DIFF_ADDED="$(git diff --unified=0 --no-color "${BASE_SHA}" "${HEAD_SHA}" | grep -E '^\+' | grep -vE '^\+\+\+' || true)"

if [[ -z "${DIFF_ADDED}" ]]; then
  echo "没有新增内容，secrets 检查通过。"
  exit 0
fi

# 常见泄漏模式（适度保守，减少误报）
PATTERNS=(
  'AKIA[0-9A-Z]{16}'
  'ASIA[0-9A-Z]{16}'
  'ghp_[A-Za-z0-9]{36}'
  'github_pat_[A-Za-z0-9_]{20,}'
  'xox[baprs]-[A-Za-z0-9-]{10,}'
  'AIza[0-9A-Za-z_-]{35}'
  '-----BEGIN (RSA|OPENSSH|EC|DSA|PGP) PRIVATE KEY-----'
  '(?i)(api[_-]?key|secret|access[_-]?key|private[_-]?key|token|password)\s*[:=]\s*["'\''`][^"'\''`]{12,}["'\''`]'
)

FAILED=0

for pattern in "${PATTERNS[@]}"; do
  if echo "${DIFF_ADDED}" | grep -nE "${pattern}" >/tmp/secret_matches.txt 2>/dev/null; then
    echo "检测到潜在敏感信息（pattern: ${pattern}）:"
    sed -n '1,20p' /tmp/secret_matches.txt
    FAILED=1
  fi
done

if [[ ${FAILED} -eq 1 ]]; then
  echo "secrets 检查失败：请移除或改为从环境变量/密钥管理系统注入。"
  exit 1
fi

echo "check:secrets 通过，未检测到新增敏感信息。"
