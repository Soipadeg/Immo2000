"""
Locust Performance Load Testing for Immo2000 API
Tests backend API under simulated production load
"""

from locust import HttpUser, task, between
import json
from random import randint


class Immo2000User(HttpUser):
    """Simulates a user interacting with Immo2000 API"""

    wait_time = between(1, 3)  # Wait 1-3 seconds between requests

    @task(3)  # Weight: 3 (30% of requests)
    def get_health(self):
        """Check API health"""
        self.client.get(
            "/api/v1/health",
            headers={"Accept": "application/json"}
        )

    @task(2)  # Weight: 2 (20% of requests)
    def list_listings(self):
        """Fetch listings list"""
        self.client.get(
            "/api/v1/listings",
            headers={"Accept": "application/json"},
            name="/api/v1/listings"
        )

    @task(1)  # Weight: 1 (10% of requests)
    def get_listing_detail(self):
        """Fetch individual listing"""
        listing_id = randint(1, 100)
        self.client.get(
            f"/api/v1/listings/{listing_id}",
            headers={"Accept": "application/json"},
            name="/api/v1/listings/[id]"
        )

    @task(2)  # Weight: 2 (20% of requests)
    def search_listings(self):
        """Search listings"""
        self.client.get(
            "/api/v1/listings/search?q=paris&limit=10",
            headers={"Accept": "application/json"},
            name="/api/v1/listings/search"
        )

    @task(1)  # Weight: 1 (10% of requests)
    def auth_login_attempt(self):
        """Attempt login (will fail without valid credentials, but tests endpoint)"""
        self.client.post(
            "/api/v1/auth/login",
            json={"email": "test@example.com", "password": "test"},
            headers={"Content-Type": "application/json"},
            name="/api/v1/auth/login"
        )

    def on_start(self):
        """Called when simulated user starts"""
        pass

    def on_stop(self):
        """Called when simulated user stops"""
        pass


class AdminUser(HttpUser):
    """Simulates an admin user with additional operations"""

    wait_time = between(2, 5)

    @task(1)
    def admin_health(self):
        """Admin checking system health"""
        self.client.get(
            "/api/v1/health",
            headers={"Accept": "application/json"}
        )

    @task(1)
    def admin_list_users(self):
        """Admin listing users (will return 401, but tests endpoint)"""
        self.client.get(
            "/api/v1/admin/users",
            headers={"Accept": "application/json"},
            name="/api/v1/admin/users"
        )
