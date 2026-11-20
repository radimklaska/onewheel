#!/usr/bin/env bash
# Regenerate stars.svg in the current checkout from the repository's star
# history. Used by both jobs of .github/workflows/stars.yml.
# Env: GH_TOKEN, GITHUB_REPOSITORY.
#
# Since July 2026 GitHub limits the stargazer listing (/stargazers) to
# admins and collaborators, so the workflow's GITHUB_TOKEN gets a 403
# there. /stargazers/history is public: weekly totals with a per-day split,
# from which we emit one YYYY-MM-DD line per star. GitHub buckets those
# days in a timezone behind UTC, so a star can land a day earlier than its
# UTC timestamp; months are affected only for stars near a month's start.
set -euo pipefail

# Download everything first: a failed download stops here and never
# reaches the renderer, so an existing stars.svg is left as it was.
# shellcheck disable=SC2016  # $w and $d are jq variables
dates="$(gh api --paginate "repos/${GITHUB_REPOSITORY}/stargazers/history?per_page=100" \
  --jq '.[] | .week as $w | .days | to_entries[] | select(.value > 0)
        | (($w + .key * 86400) | strftime("%Y-%m-%d")) as $d
        | range(.value) | $d')"

printf '%s\n' "$dates" | python3 -I .github/scripts/stars-svg.py stars.svg
