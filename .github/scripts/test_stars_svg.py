"""Tests for stars-svg.py. Run with:
python3 -I -m unittest discover -s .github/scripts -p 'test_*.py' -v
"""
import datetime as dt
import importlib.util
import pathlib
import unittest
import xml.dom.minidom

_spec = importlib.util.spec_from_file_location(
    "stars_svg", pathlib.Path(__file__).with_name("stars-svg.py"))
stars_svg = importlib.util.module_from_spec(_spec)
_spec.loader.exec_module(stars_svg)


def utc(*args):
    return dt.datetime(*args, tzinfo=dt.timezone.utc)


def idx(year, month):
    return year * 12 + month - 1


class MonthlyCumulative(unittest.TestCase):
    def test_counts_complete_months_only(self):
        stamps = ["2021-01-05T10:00:00Z",
                  "2021-03-01T00:00:00Z", "2021-03-31T12:00:00Z",
                  "2021-04-10T08:00:00Z"]
        self.assertEqual(
            stars_svg.monthly_cumulative(stamps, utc(2021, 4, 15)),
            (idx(2021, 1), [1, 1, 3]))

    def test_month_boundary_utc(self):
        first, totals = stars_svg.monthly_cumulative(
            ["2026-10-31T23:59:59Z"], utc(2026, 11, 1, 0, 0, 0))
        self.assertEqual((first, totals), (idx(2026, 10), [1]))

    def test_gap_months_flat(self):
        _, totals = stars_svg.monthly_cumulative(
            ["2021-01-02T00:00:00Z", "2021-05-02T00:00:00Z"], utc(2021, 6, 2))
        self.assertEqual(totals, [1, 1, 1, 1, 2])

    def test_accepts_date_only_lines(self):
        # stars-fetch.sh emits YYYY-MM-DD lines from /stargazers/history.
        self.assertEqual(
            stars_svg.monthly_cumulative(
                ["2021-01-28", "2021-03-09", "2021-03-09"], utc(2021, 4, 1)),
            (idx(2021, 1), [1, 1, 3]))

    def test_no_complete_month_raises(self):
        with self.assertRaises(ValueError):
            stars_svg.monthly_cumulative([], utc(2021, 6, 2))
        with self.assertRaises(ValueError):
            stars_svg.monthly_cumulative(["2021-06-01T00:00:00Z"], utc(2021, 6, 2))


class Render(unittest.TestCase):
    def test_single_month_renders(self):
        svg = stars_svg.render(idx(2026, 10), [5])
        self.assertIn("<polyline", svg)
        self.assertIn(">5</text>", svg)

    def test_render_deterministic(self):
        totals = [1, 1, 3, 4, 4, 9]
        a = stars_svg.render(idx(2021, 1), totals)
        b = stars_svg.render(idx(2021, 1), totals)
        self.assertEqual(a, b)
        xml.dom.minidom.parseString(a)


if __name__ == "__main__":
    unittest.main()
