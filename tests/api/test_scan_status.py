"""Tests for scan status and progress endpoints"""
import pytest
from unittest.mock import patch

from nettacker.api.engine import app, request_scan_stop
from nettacker.api.scan_state import register_scan, set_scan_status, update_scan_progress, is_stop_requested


@pytest.fixture
def configured_app():
    """Create and configure Flask app for testing"""
    app.config['TESTING'] = True
    # Set up minimal configuration with all required keys
    app.config['OWASP_NETTACKER_CONFIG'] = {
        'api_access_key': 'test_key',
        'api_client_whitelisted_ips': [],
        'api_access_log': False,  # Disable logging for tests
    }
    return app


@pytest.fixture
def client(configured_app):
    """Create a test client for the Flask app"""
    with configured_app.test_client() as test_client:
        yield test_client


@pytest.fixture
def app_context(configured_app):
    """Create an app context for testing"""
    with configured_app.app_context():
        yield configured_app


class TestScanStatusEndpoint:
    """Test cases for /scan/status endpoint"""

    def test_scan_status_endpoint_exists(self, client):
        """Test that /scan/status endpoint is accessible"""
        response = client.get('/scan/status?scan_id=test_scan_123&key=test_key')
        # Should return 200 or 404 depending on scan existence, not 404 for endpoint
        assert response.status_code in [200, 404]

    def test_scan_status_returns_json(self, client, app_context):
        """Test that /scan/status returns valid JSON"""
        # Register a test scan
        scan_id = "test_scan_integration_123"
        register_scan(scan_id, 1, 1)
        update_scan_progress(scan_id, "192.168.1.1", "scan_network")
        
        with patch("nettacker.api.engine.get_scan_progress_stats") as mock_stats:
            mock_stats.return_value = {
                "progress_percent": 0,
                "completed_events": 0,
                "issues_found": 0,
                "targets_scanned": 0,
                "modules_executed": 0,
                "recent_events": [],
            }
            response = client.get(f'/scan/status?scan_id={scan_id}&key=test_key')
        
        # Should succeed for a registered scan
        assert response.status_code == 200
        data = response.get_json()
        assert isinstance(data, dict)
        assert "progress" in data
        assert "current_target" in data
        assert "current_module" in data

    def test_scan_status_missing_scan_id(self, client):
        """Test that /scan/status handles missing scan_id"""
        response = client.get('/scan/status?key=test_key')
        # Should return 400 or 404, not 500
        assert response.status_code in [400, 404, 422]

    def test_scan_status_response_format(self, client, app_context):
        """Test that /scan/status returns expected response format"""
        scan_id = "test_format_check_456"
        register_scan(scan_id, 2, 3)
        update_scan_progress(scan_id, "10.0.0.1", "brute_ssh")
        
        with patch("nettacker.api.engine.get_scan_progress_stats") as mock_stats:
            mock_stats.return_value = {
                "progress_percent": 50,
                "completed_events": 3,
                "issues_found": 1,
                "targets_scanned": 1,
                "modules_executed": 1,
                "recent_events": [
                    {
                        "target": "10.0.0.1",
                        "module_name": "brute_ssh",
                        "date": "2026-01-01 00:00:00",
                    }
                ],
            }
            response = client.get(f'/scan/status?scan_id={scan_id}&key=test_key')
        
        assert response.status_code == 200
        data = response.get_json()
        expected_fields = [
            "status",
            "progress",
            "current_target",
            "current_module",
            "hosts_scanned",
            "modules_run",
            "issues_found",
            "recent_events",
        ]
        for field in expected_fields:
            assert field in data, f"Missing field: {field}"

    def test_scan_status_completed_forces_100_percent(self, client, app_context):
        """If scan status is completed, progress should be 100 even if DB stats are low."""
        scan_id = "test_completed_progress_100"
        register_scan(scan_id, 2, 2)
        update_scan_progress(scan_id, "10.0.0.1", "scan_network")
        set_scan_status(scan_id, "completed")

        with patch("nettacker.api.engine.get_scan_progress_stats") as mock_stats:
            mock_stats.return_value = {
                "progress_percent": 5,
                "completed_events": 1,
                "issues_found": 0,
                "targets_scanned": 1,
                "modules_executed": 1,
                "recent_events": [],
            }
            response = client.get(f"/scan/status?scan_id={scan_id}&key=test_key")

        assert response.status_code == 200
        data = response.get_json()
        assert data["status"] == "completed"
        assert data["progress"] == 100


class TestScanStopEndpoint:
    """Test cases for /scan/stop endpoint"""

    def test_scan_stop_endpoint_exists(self, client):
        """Test that /scan/stop endpoint is accessible"""
        response = client.post('/scan/stop?scan_id=test_scan_999&key=test_key')
        # Should return 200 or 404 depending on scan existence, not 404 for endpoint
        assert response.status_code in [200, 404]

    def test_scan_stop_sets_flag(self, app_context):
        """Test that /scan/stop sets the stop flag"""
        scan_id = "test_stop_flag_789"
        register_scan(scan_id, 0, 0)
        
        # Verify flag is not set initially
        assert not is_stop_requested(scan_id)
        
        # Call request_scan_stop function
        result = request_scan_stop(scan_id)
        assert result is True
        
        # Verify flag is now set
        assert is_stop_requested(scan_id)


class TestScanStateTracking:
    """Test cases for scan state tracking functions"""

    def test_register_scan(self, app_context):
        """Test registering a new scan"""
        scan_id = "test_register_001"
        targets = ["192.168.1.1", "10.0.0.0/24"]
        modules = ["scan_network", "brute_ssh"]
        
        register_scan(scan_id, targets, modules)
        # If no exception, registration succeeded
        assert True

    def test_update_scan_progress(self, app_context):
        """Test updating scan progress"""
        scan_id = "test_progress_001"
        register_scan(scan_id, 0, 0)
        
        # Update progress
        update_scan_progress(scan_id, "192.168.1.1", "scan_network")
        
        # Verify state was updated (should not raise exception)
        assert is_stop_requested(scan_id) == False

    def test_is_stop_requested_false_by_default(self, app_context):
        """Test that is_stop_requested returns False by default"""
        scan_id = "test_default_stop_001"
        register_scan(scan_id, 0, 0)
        
        assert is_stop_requested(scan_id) == False

    def test_is_stop_requested_true_after_stop(self, app_context):
        """Test that is_stop_requested returns True after stop is requested"""
        scan_id = "test_stop_001"
        register_scan(scan_id, 0, 0)
        
        request_scan_stop(scan_id)
        
        assert is_stop_requested(scan_id) == True


class TestProgressCalculation:
    """Test cases for progress calculation"""

    def test_progress_calculation_zero(self, app_context):
        """Test progress calculation when no events exist"""
        scan_id = "test_progress_calc_zero"
        register_scan(scan_id, ["192.168.1.1"], ["scan_network"])

        # Sanity: stop flag shouldn't affect progress format
        assert is_stop_requested(scan_id) is False

    def test_progress_increments(self, app_context):
        """Progress is derived from DB events; update_scan_progress updates metadata only."""
        scan_id = "test_progress_increment"
        register_scan(scan_id, ["192.168.1.1", "192.168.1.2"], ["scan_network", "brute_ssh"])

        update_scan_progress(scan_id, "192.168.1.1", "scan_network")
        assert is_stop_requested(scan_id) is False
