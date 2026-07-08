"""Shared pytest fixtures for the backend test suite."""

import sys
from pathlib import Path

# Tests run as `pytest` from backend/, but be defensive about sys.path so
# `import main`, `import store`, etc. work regardless of invocation dir.
sys.path.insert(0, str(Path(__file__).resolve().parent.parent))

import pytest

from store import RunHistoryStore


@pytest.fixture()
def run_store() -> RunHistoryStore:
    """A fresh, isolated RunHistoryStore for tests that exercise store
    logic directly (not through the FastAPI app's module-level singleton)."""
    return RunHistoryStore()


@pytest.fixture()
def client(monkeypatch):
    """A TestClient wired to a fresh RunHistoryStore, so route tests don't
    leak state into each other via the module-level `store.store` singleton
    in main.py."""
    from fastapi.testclient import TestClient

    import main
    import store as store_module

    fresh_store = RunHistoryStore()
    monkeypatch.setattr(main, "store", fresh_store)
    monkeypatch.setattr(store_module, "store", fresh_store)

    return TestClient(main.app)
