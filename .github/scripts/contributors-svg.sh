#!/usr/bin/env bash
# Build contributors.svg from the commit history of a GitHub repository.
# Needs only gh, jq, curl and base64 (all on GitHub-hosted runners).
# Usage: contributors-svg.sh owner/repo output.svg [ref]
#   ref: branch or commit SHA to read history from (default: default branch)
# Auth: GH_TOKEN (in Actions: secrets.GITHUB_TOKEN).
#
# Reads the commits API rather than /contributors, because GitHub caches
# /contributors and it "may return information that is a few hours old",
# so a run triggered by a merge could miss the contributor it added.
set -euo pipefail

repo="${1:?owner/repo}"
out="${2:?output path}"
ref="${3:-}"

cols=10        # avatars per row
cell_w=74      # 64px avatar + 10px gap
cell_h=88      # 64px avatar + name line + gap
pad=5
avatar=64

# Commit authors linked to a GitHub account, bots excluded, most commits
# first, ties alphabetical. --paginate prints one JSON array per page.
mapfile -t rows < <(gh api --paginate "repos/${repo}/commits?per_page=100${ref:+&sha=${ref}}" \
  | jq -rs '[.[][] | .author | select(. != null and .type != "Bot")]
    | group_by(.login)
    | map(.[0] + {commits: length})
    | sort_by(-.commits, (.login | ascii_downcase))
    | .[] | [.login, .avatar_url, .html_url] | @tsv')

n=${#rows[@]}
(( n > 0 )) || { echo "no contributors returned for ${repo}" >&2; exit 1; }
per_row=$(( n < cols ? n : cols ))
width=$(( pad * 2 + per_row * cell_w - (cell_w - avatar) ))
height=$(( pad * 2 + ( (n + cols - 1) / cols ) * cell_h - (cell_h - avatar - 19) ))

esc() { sed -e 's/&/\&amp;/g' -e 's/</\&lt;/g' -e 's/>/\&gt;/g' -e 's/"/\&quot;/g' <<<"$1"; }

tmp="$(mktemp)"
trap 'rm -f "$tmp"' EXIT
{
  printf '<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" version="1.1" width="%d" height="%d">\n' "$width" "$height"
  printf '  <style>.contributor-link { cursor: pointer; } text { font-family: sans-serif; }</style>\n'
  i=0
  for row in "${rows[@]}"; do
    IFS=$'\t' read -r login avatar_url html_url <<<"$row"
    x=$(( pad + (i % cols) * cell_w ))
    y=$(( pad + (i / cols) * cell_h ))
    label="$login"
    (( ${#label} > 12 )) && label="${label:0:12}..."
    # An SVG shown through <img> cannot load external images, so embed them.
    sep='&'; [[ "$avatar_url" == *\?* ]] || sep='?'
    mime="image/png"
    data="$(curl -fsSL --retry 3 "${avatar_url}${sep}s=$(( avatar * 2 ))" | base64 -w0)"
    [[ "$data" == /9j/* ]] && mime="image/jpeg"
    printf '  <g transform="translate(%d, %d)">\n' "$x" "$y"
    printf '    <a xlink:href="%s" class="contributor-link" target="_blank" rel="nofollow" title="%s">\n' "$(esc "$html_url")" "$(esc "$login")"
    printf '      <image width="%d" height="%d" xlink:href="data:%s;base64,%s" />\n' "$avatar" "$avatar" "$mime" "$data"
    printf '      <text x="%d" y="%d" text-anchor="middle" font-size="10">%s</text>\n' $(( avatar / 2 )) $(( avatar + 13 )) "$(esc "$label")"
    printf '    </a>\n  </g>\n'
    i=$(( i + 1 ))
  done
  printf '</svg>\n'
} >"$tmp"
mv "$tmp" "$out"
echo "wrote ${out}: ${n} contributors, $(wc -c <"$out") bytes"
