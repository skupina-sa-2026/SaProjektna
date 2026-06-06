from pathlib import Path
from fastapi import HTTPException
import pytest

from api.main import clean_username, create_or_get_reservation, get_reservation


def test_clean_username_normalizes_value():
    assert clean_username(' Rok Kogovsek ') == 'rok_kogovsek'


def test_reservation_creation_returns_required_fields(tmp_path, monkeypatch):
    import api.main as main
    test_file = tmp_path / 'reservations.json'
    monkeypatch.setattr(main, 'RESERVATIONS_FILE', test_file)
    reservation = create_or_get_reservation('test_guest')
    assert reservation['reservation_id'].startswith('AIR-')
    assert reservation['locker_id'] in main.LOCKER_IDS
    assert get_reservation(reservation['reservation_id'])['username'] == 'test_guest'
