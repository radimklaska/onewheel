#!/usr/bin/env python3
"""Render a cumulative "GitHub stars over time" chart as a static SVG.

Reads one date per star on stdin (YYYY-MM-DD, or a full ISO-8601 starred_at
timestamp; only the year and month are used) and writes the SVG. One point per complete month: the current, unfinished month is left
out, so runs within a month produce the same file and the end label is the
last complete month's total, not the live count.

Usage: see stars-fetch.sh, which feeds it from /stargazers/history.

Python standard library only. GitHub only reports current stargazers, so a
removed star also disappears from past months.
"""
import datetime as dt
import math
import sys

W, H = 740, 220
LEFT, RIGHT, TOP, BOTTOM = 40, 64, 16, 28   # plot margins
BLUE_LIGHT, BLUE_DARK = "#2a78d6", "#3987e5"
STYLE = (
    "text{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;"
    "font-size:11px;fill:#898781}"
    ".value{font-size:13px;font-weight:600;fill:#0b0b0b}"
    ".grid{stroke:#e1e0d9;stroke-width:1}"
    ".axis{stroke:#c3c2b7;stroke-width:1}"
    f".line{{fill:none;stroke:{BLUE_LIGHT};stroke-width:2;stroke-linejoin:round;stroke-linecap:round}}"
    f".area{{fill:{BLUE_LIGHT};fill-opacity:.1}}"
    f".dot{{fill:{BLUE_LIGHT}}}"
    "@media (prefers-color-scheme:dark){"
    ".value{fill:#f0efec}.grid{stroke:#2c2c2a}.axis{stroke:#383835}"
    f".line{{stroke:{BLUE_DARK}}}.area{{fill:{BLUE_DARK}}}.dot{{fill:{BLUE_DARK}}}}}"
)


def month_index(year, month):
    """Months since year 0: year*12 + month-1."""
    return year * 12 + (month - 1)


def month_label(index):
    year, month0 = divmod(index, 12)
    return dt.date(year, month0 + 1, 1).strftime("%b %Y")


def monthly_cumulative(stamps, today):
    """Return (first_month_index, totals) for every complete month.

    totals[k] is the number of stars at the end of month first+k. The last
    entry is the month before `today` (UTC). Raises ValueError when there is
    no star in any complete month.
    """
    last = month_index(today.year, today.month) - 1
    months = sorted(m for m in (month_index(int(s[:4]), int(s[5:7])) for s in stamps)
                    if m <= last)
    if not months:
        raise ValueError("no stars in any complete month yet")
    first = months[0]
    totals, total, i = [], 0, 0
    for m in range(first, last + 1):
        while i < len(months) and months[i] <= m:
            total += 1
            i += 1
        totals.append(total)
    return first, totals


def nice_step(max_value, target_ticks=4):
    raw = max(max_value, 1) / target_ticks
    mag = 10 ** math.floor(math.log10(raw))
    for m in (1, 2, 2.5, 5, 10):
        if raw <= m * mag:
            return m * mag
    return 10 * mag


def render(first, totals):
    """Return the SVG text for cumulative `totals` starting at month `first`."""
    n = len(totals)
    last = first + n - 1
    top = totals[-1]
    step = nice_step(top)
    y_max = max(step, math.ceil(top / step) * step)
    pw, ph = W - LEFT - RIGHT, H - TOP - BOTTOM

    def x(k):
        return LEFT + (pw * k / (n - 1) if n > 1 else pw / 2)

    def y(v):
        return TOP + ph - ph * v / y_max

    pts = [(x(k), y(v)) for k, v in enumerate(totals)]
    base = y(0)
    line = " ".join(f"{px:.1f},{py:.1f}" for px, py in pts)
    area = (f"M{pts[0][0]:.1f},{base:.1f} L"
            + " L".join(f"{px:.1f},{py:.1f}" for px, py in pts)
            + f" L{pts[-1][0]:.1f},{base:.1f} Z")

    o = [f'<svg xmlns="http://www.w3.org/2000/svg" width="{W}" height="{H}" '
         f'viewBox="0 0 {W} {H}" role="img" aria-labelledby="t d">',
         '<title id="t">GitHub stars over time</title>',
         f'<desc id="d">{top} stars at the end of {month_label(last)}, counted monthly '
         f'since {month_label(first)}.</desc>',
         f"<style>{STYLE}</style>"]

    # Horizontal gridlines with y labels; 0 sits on the baseline.
    v = step
    while v <= y_max + 1e-9:
        gy = y(v)
        o.append(f'<line class="grid" x1="{LEFT}" x2="{W - RIGHT}" y1="{gy:.1f}" y2="{gy:.1f}"/>')
        o.append(f'<text x="{LEFT - 8}" y="{gy + 4:.1f}" text-anchor="end">{v:g}</text>')
        v += step
    o.append(f'<line class="axis" x1="{LEFT}" x2="{W - RIGHT}" y1="{base:.1f}" y2="{base:.1f}"/>')
    o.append(f'<text x="{LEFT - 8}" y="{base + 4:.1f}" text-anchor="end">0</text>')

    # Year labels at each January in range, plus the first month's year.
    for m in range(first, last + 1):
        year, month0 = divmod(m, 12)
        if month0 == 0 or m == first:
            tx = x(m - first)
            o.append(f'<line class="axis" x1="{tx:.1f}" x2="{tx:.1f}" y1="{base:.1f}" y2="{base + 4:.1f}"/>')
            o.append(f'<text x="{tx:.1f}" y="{base + 17:.1f}" text-anchor="middle">{year}</text>')

    o.append(f'<path class="area" d="{area}"/>')
    o.append(f'<polyline class="line" points="{line}"/>')
    ex, ey = pts[-1]
    o.append(f'<circle class="dot" cx="{ex:.1f}" cy="{ey:.1f}" r="4"/>')
    o.append(f'<text class="value" x="{ex + 9:.1f}" y="{ey + 4.5:.1f}">{top}</text>')
    o.append("</svg>")
    return "\n".join(o) + "\n"


def main(argv):
    if len(argv) != 2:
        sys.exit("usage: stars-svg.py OUTPUT.svg < starred_at-lines")
    stamps = [line.strip() for line in sys.stdin if line.strip()]
    try:
        first, totals = monthly_cumulative(stamps, dt.datetime.now(dt.timezone.utc))
    except ValueError as e:
        sys.exit(f"stars-svg.py: {e}")
    with open(argv[1], "w", encoding="utf-8") as f:
        f.write(render(first, totals))
    print(f"wrote {argv[1]}: {totals[-1]} stars through "
          f"{month_label(first + len(totals) - 1)}, {len(totals)} months")


if __name__ == "__main__":
    main(sys.argv)
