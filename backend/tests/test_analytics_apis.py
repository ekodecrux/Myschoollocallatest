"""
Backend API Tests for Analytics, Dashboard Stats, and User Logs
Tests the three bug fixes mentioned in the review request:
1. Analytics Dashboard data display
2. Pagination behavior (frontend fix - verified via code review)
3. File Upload validation (frontend fix - verified via Playwright)
"""
import pytest
import requests
import os

BASE_URL = os.environ.get('REACT_APP_BACKEND_URL', '').rstrip('/')

# Test credentials
TEST_SUPER_ADMIN_EMAIL = "jagrajsinghji99@gmail.com"
TEST_SUPER_ADMIN_PASSWORD = "Pass@1234"


class TestAuthentication:
    """Authentication endpoint tests"""
    
    def test_super_admin_login_success(self):
        """Test Super Admin login returns valid token and correct role"""
        response = requests.post(f"{BASE_URL}/api/rest/auth/login", json={
            "username": TEST_SUPER_ADMIN_EMAIL,
            "password": TEST_SUPER_ADMIN_PASSWORD
        })
        
        assert response.status_code == 200, f"Login failed with status {response.status_code}"
        
        data = response.json()
        assert "accessToken" in data, "accessToken missing from response"
        assert "refreshToken" in data, "refreshToken missing from response"
        assert isinstance(data["accessToken"], str), "accessToken should be a string"
        assert len(data["accessToken"]) > 0, "accessToken should not be empty"
        print(f"✓ Super Admin login successful")


class TestDashboardStats:
    """Dashboard stats API tests - verifies analytics data keys"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/rest/auth/login", json={
            "username": TEST_SUPER_ADMIN_EMAIL,
            "password": TEST_SUPER_ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("accessToken")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_dashboard_stats_returns_required_keys(self, auth_token):
        """Test that /api/admin/dashboard-stats returns all required keys for analytics"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard-stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"Dashboard stats failed with {response.status_code}"
        
        data = response.json()
        
        # Required keys for the Analytics Dashboard (as per the bug fix)
        required_keys = ['totalSchools', 'totalTeachers', 'totalStudents', 'totalCreditsUsed']
        
        for key in required_keys:
            assert key in data, f"Missing required key: {key}"
            print(f"✓ Key '{key}' present with value: {data[key]}")
        
        # Verify values are numeric
        assert isinstance(data['totalSchools'], int), "totalSchools should be int"
        assert isinstance(data['totalTeachers'], int), "totalTeachers should be int"
        assert isinstance(data['totalStudents'], int), "totalStudents should be int"
        assert isinstance(data['totalCreditsUsed'], int), "totalCreditsUsed should be int"
        
        print(f"✓ Dashboard stats API returns correct keys and types")
    
    def test_dashboard_stats_optional_keys(self, auth_token):
        """Test that /api/admin/dashboard-stats returns optional keys"""
        response = requests.get(
            f"{BASE_URL}/api/admin/dashboard-stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200
        data = response.json()
        
        # Optional keys that may be present
        optional_keys = ['totalUsers', 'totalImages', 'activeUsers', 'recentActivity']
        
        for key in optional_keys:
            if key in data:
                print(f"✓ Optional key '{key}' present with value: {data[key]}")


class TestUserLogsStats:
    """User logs stats API tests - verifies today's activity data keys"""
    
    @pytest.fixture
    def auth_token(self):
        """Get authentication token"""
        response = requests.post(f"{BASE_URL}/api/rest/auth/login", json={
            "username": TEST_SUPER_ADMIN_EMAIL,
            "password": TEST_SUPER_ADMIN_PASSWORD
        })
        if response.status_code == 200:
            return response.json().get("accessToken")
        pytest.skip("Authentication failed - skipping authenticated tests")
    
    def test_user_logs_stats_returns_required_keys(self, auth_token):
        """Test that /api/admin/user-logs/stats returns all required keys for Today's Activity"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-logs/stats",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"User logs stats failed with {response.status_code}"
        
        data = response.json()
        
        # Required keys for Today's Activity section (as per the bug fix)
        # Changed from activeUsers -> recent_activity_count
        required_keys = ['todays_activity', 'total_downloads', 'recent_activity_count']
        
        for key in required_keys:
            assert key in data, f"Missing required key: {key}"
            print(f"✓ Key '{key}' present with value: {data[key]}")
        
        # Verify values are numeric
        assert isinstance(data['todays_activity'], int), "todays_activity should be int"
        assert isinstance(data['total_downloads'], int), "total_downloads should be int"
        assert isinstance(data['recent_activity_count'], int), "recent_activity_count should be int"
        
        print(f"✓ User logs stats API returns correct keys and types")
    
    def test_user_logs_endpoint(self, auth_token):
        """Test that /api/admin/user-logs returns logs array"""
        response = requests.get(
            f"{BASE_URL}/api/admin/user-logs?limit=10",
            headers={"Authorization": f"Bearer {auth_token}"}
        )
        
        assert response.status_code == 200, f"User logs failed with {response.status_code}"
        
        data = response.json()
        assert 'logs' in data, "logs key missing from response"
        assert isinstance(data['logs'], list), "logs should be a list"
        
        print(f"✓ User logs API returns {len(data['logs'])} log entries")


class TestUnauthorizedAccess:
    """Test unauthorized access to admin endpoints"""
    
    def test_dashboard_stats_requires_auth(self):
        """Test that dashboard stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/dashboard-stats")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], \
            f"Expected 401/403/422 but got {response.status_code}"
        print(f"✓ Dashboard stats correctly requires authentication")
    
    def test_user_logs_stats_requires_auth(self):
        """Test that user logs stats requires authentication"""
        response = requests.get(f"{BASE_URL}/api/admin/user-logs/stats")
        
        # Should return 401 or 403 without auth
        assert response.status_code in [401, 403, 422], \
            f"Expected 401/403/422 but got {response.status_code}"
        print(f"✓ User logs stats correctly requires authentication")


if __name__ == "__main__":
    pytest.main([__file__, "-v", "--tb=short"])
