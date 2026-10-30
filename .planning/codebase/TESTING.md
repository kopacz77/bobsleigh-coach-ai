# Testing Patterns

**Analysis Date:** 2026-05-02

## Test Framework

**Backend runner:**
- pytest 7.4.4
- Config: No `pytest.ini`, `setup.cfg`, or `pyproject.toml` found -- uses pytest defaults
- HTTP testing: `httpx==0.26.0` (in requirements but FastAPI TestClient used instead)
- FastAPI TestClient from `fastapi.testclient` for API integration tests

**Frontend runner:**
- No test framework configured
- No Jest, Vitest, or other test runner installed
- No test files exist (`*.test.*`, `*.spec.*` patterns return zero results)
- CI workflow has tests commented out: `# - name: Run tests` / `#   run: npm test`

**Run Commands:**
```bash
# Backend
cd backend && pytest                    # Run all tests
cd backend && pytest -v                 # Verbose output
cd backend && pytest tests/test_pmc_service.py  # Run specific test file

# Frontend
# No test commands available -- no test framework installed
```

## Test File Organization

**Backend location:**
- Separate test directory: `backend/tests/`
- No `conftest.py` for shared fixtures
- No `__init__.py` in test directory

**Naming:**
- `test_{module_name}.py` (e.g., `test_pmc_service.py`, `test_performance_api.py`)

**Current test files:**
```
backend/tests/
├── test_pmc_service.py        # Tests for PMCService (3 async tests)
└── test_performance_api.py    # Tests for performance API endpoints (4 sync tests)
```

**Frontend:**
- No test files exist anywhere in the frontend codebase

## Test Structure

**Suite organization (Backend - Service tests):**
```python
"""Tests for the PMC service."""

import pytest
from fastapi.testclient import TestClient
from app.services.pmc_service import PMCService


@pytest.fixture
def pmc_service():
    """Create a PMC service instance for testing."""
    return PMCService()


async def test_calculate_pmc_for_athlete(pmc_service):
    """Test PMC calculation for an athlete."""
    athlete_id = 1
    days = 30

    pmc_data = await pmc_service.calculate_pmc_for_athlete(athlete_id, days)

    # Check that we have the expected keys
    assert "dates" in pmc_data
    assert "loads" in pmc_data
    assert "ctl" in pmc_data

    # Check array lengths
    assert len(pmc_data["dates"]) == days

    # Domain-specific assertions
    atl_diff = pmc_data["atl"][7] - pmc_data["atl"][0]
    ctl_diff = pmc_data["ctl"][7] - pmc_data["ctl"][0]
    assert atl_diff > ctl_diff, "ATL should respond faster than CTL to load changes"
```

**Suite organization (Backend - API tests):**
```python
"""Tests for the performance API endpoints."""

import pytest
from fastapi.testclient import TestClient
from app.main import app


@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)


def test_get_performance_metrics(client, monkeypatch):
    """Test the get_performance_metrics endpoint."""
    response = client.get("/api/performance/metrics/1")

    assert response.status_code == 200

    data = response.json()
    assert "athlete_id" in data
    assert "strength_metrics" in data
    assert "squat_1rm" in data["strength_metrics"]
```

**Patterns:**
- Each test file has a module-level docstring
- Fixtures defined per-file (no shared `conftest.py`)
- Tests follow Arrange-Act-Assert pattern
- Test names are descriptive: `test_get_performance_metrics`, `test_calculate_pmc_for_athlete`
- Each test function has a docstring describing what it tests
- Assertions check response structure (key presence) then specific values

## Fixture Patterns

**Service fixture:**
```python
@pytest.fixture
def pmc_service():
    """Create a PMC service instance for testing."""
    return PMCService()
```

**Client fixture:**
```python
@pytest.fixture
def client():
    """Test client fixture."""
    return TestClient(app)
```

**Key observations:**
- No database fixtures (tests use mock/hardcoded data from services)
- No factory pattern for test data
- No shared fixtures across test files
- `monkeypatch` from pytest used but not implemented in current tests

## Mocking

**Framework:** pytest built-in `monkeypatch` (referenced but not actively used)

**Current approach:**
- Services return hardcoded/mock data internally (no actual database queries)
- Tests rely on this built-in mock data rather than explicit mocking
- The `monkeypatch` parameter is declared but unused in `test_get_performance_metrics`
- No `unittest.mock`, `pytest-mock`, or other mocking libraries in requirements

**What is NOT mocked (because services use placeholder data):**
- Database calls (services return hardcoded dictionaries)
- Authentication (endpoints don't enforce auth in tests)
- External services

**Pattern for future tests (suggested):**
```python
# When real database integration is added, use monkeypatch:
def test_get_performance_metrics(client, monkeypatch):
    async def mock_get_metrics(self, athlete_id):
        return {"athlete_id": athlete_id, "strength_metrics": {...}}

    monkeypatch.setattr(PerformanceService, "get_performance_metrics", mock_get_metrics)
    response = client.get("/api/performance/metrics/1")
    assert response.status_code == 200
```

## Fixtures and Factories

**Test Data:**
- No test data factories exist
- No fixture files or JSON test data
- Services use inline hardcoded mock data (e.g., `backend/app/services/performance_service.py` returns static dicts)
- PMC service uses `np.random.seed(42)` for reproducible random data

**Location:**
- No dedicated test data directory
- No `fixtures/`, `factories/`, or `testdata/` directories

## Coverage

**Requirements:** No coverage targets enforced
- No `pytest-cov` in requirements
- No coverage configuration
- CI pipeline has test execution commented out

**To add coverage:**
```bash
pip install pytest-cov
cd backend && pytest --cov=app --cov-report=html
```

## Test Types

**Unit Tests (Backend):**
- `backend/tests/test_pmc_service.py`: Tests PMCService methods directly
  - 3 test functions, all async
  - Tests: `calculate_pmc_for_athlete`, `get_training_recommendations`, `generate_workout_recommendations`
  - Validates data structure, array lengths, and domain logic (ATL responds faster than CTL)

**Integration Tests (Backend):**
- `backend/tests/test_performance_api.py`: Tests API endpoints via TestClient
  - 4 test functions, synchronous
  - Tests: `get_performance_metrics`, `get_training_load`, `get_performance_trends`, `get_peer_comparison`
  - Validates HTTP status codes and JSON response structure

**E2E Tests:**
- Not present in the codebase
- No Cypress, Playwright, or similar framework configured

**Frontend Tests:**
- None exist. No test framework, no test files, no test configuration.

## Common Patterns

**Async Testing (Backend):**
```python
# Tests use async def but no pytest-asyncio marker
# This is a potential issue - these tests may not actually run as async
async def test_calculate_pmc_for_athlete(pmc_service):
    """Test PMC calculation for an athlete."""
    pmc_data = await pmc_service.calculate_pmc_for_athlete(athlete_id, days)
    assert "dates" in pmc_data
```

**Note:** The async tests in `test_pmc_service.py` use `async def` without `@pytest.mark.asyncio` decorator and without `pytest-asyncio` in requirements. These tests likely do NOT run properly -- pytest would skip or error on them without the asyncio plugin.

**Structure Validation Pattern:**
```python
# Check response has expected top-level keys
data = response.json()
assert "athlete_id" in data
assert "strength_metrics" in data

# Check nested structure
assert "squat_1rm" in data["strength_metrics"]

# Check array structure
assert len(data["daily_load"]) > 0
first_day = data["daily_load"][0]
assert "date" in first_day
assert "load" in first_day
```

**Value Range Validation:**
```python
# Validate percentile bounds
assert 0 <= data["percentiles"]["overall"] <= 100

# Validate ranking logic
assert 1 <= data["ranking"]["team_rank"] <= data["ranking"]["total_athletes"]
```

**Domain Logic Validation:**
```python
# Check that ATL responds faster than CTL (domain rule)
ctl_diff = pmc_data["ctl"][high_load_period] - pmc_data["ctl"][0]
atl_diff = pmc_data["atl"][high_load_period] - pmc_data["atl"][0]
assert atl_diff > ctl_diff, "ATL should respond faster than CTL to load changes"

# Check recommendations match TSB thresholds
if tsb > 20:
    assert recommendations["status"] == "Peak Form"
    assert recommendations["load_adjustment"] > 0
```

## CI/CD Test Integration

**Pipeline:** GitHub Actions (`.github/workflows/ci.yml`)

**Backend CI:**
```yaml
- name: Lint with flake8
  run: |
    pip install flake8
    flake8 . --count --select=E9,F63,F7,F82 --show-source --statistics
    flake8 . --count --max-complexity=10 --max-line-length=127 --statistics
# Tests commented out:
# - name: Test with pytest
#   run: pytest
```

**Frontend CI:**
```yaml
- name: Run ESLint
  run: npm run lint
# Tests commented out:
# - name: Run tests
#   run: npm test
```

**Key issues:**
- CI uses `npm` despite project using `pnpm` as package manager
- Both test steps are commented out
- No coverage reporting in CI

## Gaps and Recommendations

**Critical gaps:**
1. No frontend test framework installed or configured
2. Backend async tests missing `pytest-asyncio` dependency and `@pytest.mark.asyncio` markers
3. No `conftest.py` for shared fixtures
4. No mocking infrastructure for database/auth
5. No test coverage measurement
6. CI does not run any tests

**When adding new tests:**
- Backend: Add `pytest-asyncio` to requirements, create `conftest.py` with shared fixtures
- Backend: Place test files in `backend/tests/` with `test_` prefix
- Backend: Use `TestClient(app)` for API tests, direct service instantiation for unit tests
- Frontend: Install Vitest (recommended for Next.js) or Jest, add test scripts to `frontend/package.json`
- Frontend: Co-locate test files with components as `ComponentName.test.tsx`

---

*Testing analysis: 2026-05-02*
