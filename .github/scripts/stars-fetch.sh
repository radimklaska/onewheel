#!/usr/bin/env bash
# Regenerate stars.svg in the current checkout from the repository's
# stargazers. Used by both jobs of .github/workflows/stars.yml.
# Env: GH_TOKEN, GITHUB_REPOSITORY.
set -euo pipefail
gh api --paginate -H 'Accept: application/vnd.github.star+json' \
  "repos/${GITHUB_REPOSITORY}/stargazers?per_page=100" --jq '.[].starred_at' \
  | python3 -I .github/scripts/stars-svg.py stars.svg
