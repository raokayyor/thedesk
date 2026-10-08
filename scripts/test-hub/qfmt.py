"""Shared formatting and validation helpers for the question generators."""
from decimal import Decimal, ROUND_HALF_UP


def h(v, dp=0):
    """Round half-up (6.25 -> 6.3) and return a string with fixed decimals."""
    q = Decimal(1).scaleb(-dp) if dp else Decimal(1)
    d = Decimal(str(round(float(v), 9))).quantize(q, rounding=ROUND_HALF_UP)
    return f"{d:,f}" if dp else f"{int(d):,}"


def trim(s):
    return s.rstrip("0").rstrip(".") if "." in s else s


def signed(v, body):
    """Prefix with + or − (proper minus sign)."""
    if v > 0:
        return "+" + body
    if v < 0:
        return "−" + body.lstrip("-")
    return body


def too_close(correct, wrong, rel=0.005, absol=0.0):
    """True if a distractor is near enough to the answer to be confused once rounded."""
    try:
        c = float(correct)
    except (TypeError, ValueError):
        return False
    for w in wrong:
        try:
            w = float(w)
        except (TypeError, ValueError):
            continue
        if abs(w - c) <= max(absol, rel * abs(c)):
            return True
    return False


import re as _re


def mixed_dp(opts):
    """True if numeric options are shown with different numbers of decimal places."""
    dps = set()
    for o in opts:
        m = _re.search(r"\d(?:\.(\d+))?\D*$", o)
        if m:
            dps.add(len(m.group(1)) if m.group(1) else 0)
    return len(dps) > 1
