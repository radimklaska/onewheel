# Markdown summary of a Lighthouse JSON report, for the job summary of the
# `lighthouse` job in workflows/deploy.yml: category scores, the Core Web Vitals
# style metrics, and every scored audit below 90 per category.
#   jq -r --arg url <audited URL> -f .github/lighthouse-summary.jq report.json
# 🟢 90-100, 🟠 50-89, 🔴 0-49: Lighthouse's own colour bands.

def pct: ((. // 0) * 100 | round);
def badge: if . >= 90 then "🟢" elif . >= 50 then "🟠" else "🔴" end;

. as $r
| "## Lighthouse: \($url)\n\nMobile, Lighthouse \(.lighthouseVersion); the run with the median performance score of 3.\n\n"
+ "| Category | Score |\n|---|--:|\n"
+ ([.categories[] | (.score | pct) as $s | "| \($s | badge) \(.title) | \($s) |"] | join("\n"))
+ "\n\n### Metrics\n\n| Metric | Value | Score |\n|---|--:|--:|\n"
+ ([("first-contentful-paint", "largest-contentful-paint", "total-blocking-time",
     "cumulative-layout-shift", "speed-index")
    | $r.audits[.] | select(. != null) | (.score | pct) as $s
    | "| \(.title) | \(.displayValue // "") | \($s | badge) \($s) |"] | join("\n"))
+ "\n\n### Audits below 90\n"
+ ([.categories[] | .title as $t
    | [.auditRefs[] | select(.weight > 0) | $r.audits[.id]
       | select(.score != null and .score < 0.9)] as $failed
    | if ($failed | length) == 0 then "\n**\($t)**: none\n"
      else "\n**\($t)**\n\n" + ([$failed[] | (.score | pct) as $s
        | "- \($s | badge) \(.title) (`\(.id)`)\(if .displayValue then ": \(.displayValue)" else "" end)"]
        | join("\n")) + "\n"
      end] | join(""))
