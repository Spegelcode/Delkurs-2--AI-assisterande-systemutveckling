from decimal import Decimal
from pathlib import Path
import sys


LEGACY_PATH = Path(__file__).parents[2] / "src" / "legacy"
sys.path.insert(0, str(LEGACY_PATH))

import price_calc  # noqa: E402


def test_existing_order_without_discount_keeps_current_totals(tmp_path, monkeypatch):
    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price.log"))

    result = price_calc.calc_price(1042)

    assert result.net == Decimal("950")
    assert result.vat == Decimal("237.5")
    assert result.total == Decimal("1187.5")


def test_discounted_order_keeps_truncation_before_vat(tmp_path, monkeypatch):
    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price.log"))

    result = price_calc.calc_price(1044)

    assert result.net == Decimal("179.91")
    assert result.vat == Decimal("44.97")
    assert result.total == Decimal("224.88")


def test_expired_discount_is_still_applied_by_legacy_behavior(tmp_path, monkeypatch):
    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price.log"))

    result = price_calc.calc_price(1045)

    assert result.net == Decimal("551.65")
    assert result.vat == Decimal("137.91")
    assert result.total == Decimal("689.56")


def test_order_without_lines_returns_zero_totals(tmp_path, monkeypatch):
    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price.log"))

    result = price_calc.calc_price(1043)

    assert result.net == Decimal("0")
    assert result.vat == Decimal("0")
    assert result.total == Decimal("0")


def test_missing_order_returns_none(tmp_path, monkeypatch):
    monkeypatch.setattr(price_calc, "LOGG", str(tmp_path / "price.log"))

    assert price_calc.calc_price(999999) is None


def test_calculation_writes_one_log_line(tmp_path, monkeypatch):
    log_path = tmp_path / "price.log"
    monkeypatch.setattr(price_calc, "LOGG", str(log_path))

    price_calc.calc_price(1042)

    lines = log_path.read_text(encoding="utf-8").splitlines()
    assert len(lines) == 1
    assert " 1042 1187.5" in lines[0]
