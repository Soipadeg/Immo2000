"""
Phase 4 - Load Testing with Locust

Performance and load testing for FastAPI application
Run: locust -f locustfile.py -H http://localhost:8000 --users 100 --spawn-rate 10 --run-time 5m
"""

from locust import HttpUser, task, between, events
from locust.contrib.fasthttp import FastHttpUser
import random
import logging
import json
from datetime import datetime

logger = logging.getLogger(__name__)


class ImmoUserBehavior(FastHttpUser):
    """Simulates typical user behavior"""

    wait_time = between(1, 3)

    def on_start(self):
        """Setup for each user"""
        self.user_id = random.randint(1, 1000)
        self.listing_id = random.randint(1, 500)
        self.api_token = "test-token-" + str(self.user_id)
        self.headers = {"Authorization": f"Bearer {self.api_token}"}

    # ===== AUTH ENDPOINTS =====

    @task(2)
    def register_user(self):
        """Test user registration"""
        payload = {
            "email": f"user{self.user_id}@example.com",
            "password": "SecurePass123!",
            "first_name": "Test",
            "last_name": "User"
        }
        self.client.post("/api/v1/auth/register", json=payload)

    @task(3)
    def login_user(self):
        """Test user login"""
        payload = {
            "email": f"user{self.user_id}@example.com",
            "password": "SecurePass123!"
        }
        self.client.post("/api/v1/auth/login", json=payload)

    @task(1)
    def get_current_user(self):
        """Test get current user info"""
        self.client.get("/api/v1/auth/me", headers=self.headers)

    # ===== LISTINGS ENDPOINTS =====

    @task(5)
    def get_listings(self):
        """Test get listings with filters"""
        filters = {
            "skip": random.randint(0, 100),
            "limit": random.choice([10, 20, 50]),
            "city": random.choice(["Paris", "Lyon", "Marseille", None]),
            "min_price": random.choice([50000, 100000, 200000, None]),
            "max_price": random.choice([300000, 500000, 1000000, None]),
            "sort_by": random.choice(["created_at", "price"])
        }
        query_string = "&".join([f"{k}={v}" for k, v in filters.items() if v is not None])
        self.client.get(f"/api/v1/listings?{query_string}")

    @task(3)
    def get_listing_detail(self):
        """Test get listing detail"""
        self.client.get(f"/api/v1/listings/{self.listing_id}")

    @task(2)
    def create_listing(self):
        """Test create listing"""
        payload = {
            "title": f"Property {self.listing_id}",
            "description": "Beautiful property with modern amenities",
            "price": random.randint(100000, 1000000),
            "property": {
                "type": random.choice(["house", "apartment", "land"]),
                "rooms": random.randint(1, 5),
                "bathrooms": random.randint(1, 3),
                "area": random.randint(50, 300)
            },
            "address": f"{random.randint(1, 999)} Main St",
            "city": random.choice(["Paris", "Lyon", "Marseille"])
        }
        self.client.post("/api/v1/listings", json=payload, headers=self.headers)

    @task(2)
    def update_listing(self):
        """Test update listing"""
        payload = {
            "title": f"Updated Property {self.listing_id}",
            "price": random.randint(100000, 1000000)
        }
        self.client.put(f"/api/v1/listings/{self.listing_id}", json=payload, headers=self.headers)

    @task(1)
    def delete_listing(self):
        """Test delete listing"""
        self.client.delete(f"/api/v1/listings/{random.randint(1, 100)}", headers=self.headers)

    # ===== USER FEATURES =====

    @task(2)
    def add_favorite(self):
        """Test add favorite"""
        payload = {"listing_id": self.listing_id}
        self.client.post("/api/v1/favorites", json=payload, headers=self.headers)

    @task(2)
    def get_favorites(self):
        """Test get favorites"""
        self.client.get("/api/v1/favorites", headers=self.headers)

    @task(2)
    def get_notifications(self):
        """Test get notifications"""
        self.client.get("/api/v1/notifications", headers=self.headers)

    @task(1)
    def get_appointments(self):
        """Test get appointments"""
        self.client.get("/api/v1/visits", headers=self.headers)

    @task(1)
    def create_appointment(self):
        """Test create appointment"""
        payload = {
            "listing_id": self.listing_id,
            "date": "2026-06-15",
            "time": "14:00"
        }
        self.client.post("/api/v1/visits", json=payload, headers=self.headers)

    @task(2)
    def get_messages(self):
        """Test get message conversations"""
        self.client.get("/api/v1/messages/conversations", headers=self.headers)

    @task(1)
    def search_history(self):
        """Test search history"""
        self.client.get("/api/v1/search-history", headers=self.headers)

    # ===== BUSINESS FEATURES =====

    @task(1)
    def get_admin_dashboard(self):
        """Test admin dashboard (admin only)"""
        self.client.get("/api/v1/admin/dashboard", headers=self.headers)

    @task(1)
    def get_admin_listings(self):
        """Test admin listings view"""
        self.client.get("/api/v1/admin/listings", headers=self.headers)

    @task(1)
    def get_alerts(self):
        """Test get alerts"""
        self.client.get("/api/v1/alerts", headers=self.headers)

    @task(1)
    def get_analytics(self):
        """Test analytics dashboard"""
        self.client.get(f"/api/v1/analytics/listings/{self.listing_id}", headers=self.headers)

    # ===== HEALTH ENDPOINTS =====

    @task(1)
    def health_check(self):
        """Test basic health check"""
        self.client.get("/api/v1/health")

    @task(1)
    def health_detailed(self):
        """Test detailed health check"""
        self.client.get("/api/v1/health/detailed")

    @task(1)
    def readiness_check(self):
        """Test readiness check"""
        self.client.get("/api/v1/health/ready")


class AdminUserBehavior(FastHttpUser):
    """Simulates admin user behavior"""

    wait_time = between(2, 5)

    def on_start(self):
        """Setup admin user"""
        self.admin_token = "admin-token-123"
        self.headers = {
            "Authorization": f"Bearer {self.admin_token}",
            "X-User-Role": "admin"
        }

    @task(5)
    def view_dashboard(self):
        """Admin views dashboard"""
        self.client.get("/api/v1/admin/dashboard", headers=self.headers)

    @task(3)
    def manage_listings(self):
        """Admin manages listings"""
        listing_id = random.randint(1, 500)
        self.client.get("/api/v1/admin/listings", headers=self.headers)

    @task(2)
    def approve_listing(self):
        """Admin approves listing"""
        listing_id = random.randint(1, 500)
        self.client.post(f"/api/v1/admin/listings/{listing_id}/approve", headers=self.headers)

    @task(2)
    def view_transactions(self):
        """Admin views transactions"""
        self.client.get("/api/v1/admin/transactions", headers=self.headers)

    @task(1)
    def manage_users(self):
        """Admin manages users"""
        self.client.get("/api/v1/admin/users", headers=self.headers)


class BuyerUserBehavior(FastHttpUser):
    """Simulates buyer/searcher behavior"""

    wait_time = between(1, 2)

    def on_start(self):
        """Setup buyer user"""
        self.buyer_token = "buyer-token-" + str(random.randint(1, 1000))
        self.headers = {"Authorization": f"Bearer {self.buyer_token}"}

    @task(10)
    def search_listings(self):
        """Buyer searches for listings"""
        city = random.choice(["Paris", "Lyon", "Marseille", "Toulouse"])
        min_price = random.choice([50000, 100000, 200000])
        max_price = min_price + random.choice([100000, 200000, 300000])

        self.client.get(
            f"/api/v1/listings?city={city}&min_price={min_price}&max_price={max_price}"
        )

    @task(5)
    def view_listing(self):
        """Buyer views listing details"""
        listing_id = random.randint(1, 1000)
        self.client.get(f"/api/v1/listings/{listing_id}")

    @task(3)
    def save_favorite(self):
        """Buyer saves favorite"""
        self.client.post(
            "/api/v1/favorites",
            json={"listing_id": random.randint(1, 1000)},
            headers=self.headers
        )

    @task(2)
    def create_alert(self):
        """Buyer creates search alert"""
        self.client.post(
            "/api/v1/alerts",
            json={
                "alert_type": "price_drop",
                "filters": {"city": "Paris", "min_rooms": 2}
            },
            headers=self.headers
        )

    @task(1)
    def get_loan_simulation(self):
        """Buyer checks loan simulation"""
        self.client.post(
            "/api/v1/simulator/loan",
            json={
                "property_value": 500000,
                "loan_percentage": 80,
                "duration_months": 240
            }
        )


class SellerUserBehavior(FastHttpUser):
    """Simulates seller behavior"""

    wait_time = between(3, 5)

    def on_start(self):
        """Setup seller user"""
        self.seller_token = "seller-token-" + str(random.randint(1, 500))
        self.headers = {"Authorization": f"Bearer {self.seller_token}"}

    @task(3)
    def view_listings(self):
        """Seller views own listings"""
        self.client.get("/api/v1/listings", headers=self.headers)

    @task(2)
    def create_listing(self):
        """Seller creates new listing"""
        self.client.post(
            "/api/v1/listings",
            json={
                "title": f"New Property {random.randint(1000, 9999)}",
                "description": "Beautiful property for sale",
                "price": random.randint(200000, 1000000),
                "property": {
                    "type": "house",
                    "rooms": random.randint(2, 5),
                    "bathrooms": random.randint(1, 3),
                    "area": random.randint(100, 300)
                },
                "city": random.choice(["Paris", "Lyon", "Marseille"])
            },
            headers=self.headers
        )

    @task(1)
    def view_analytics(self):
        """Seller views listing analytics"""
        listing_id = random.randint(1, 100)
        self.client.get(f"/api/v1/analytics/listings/{listing_id}", headers=self.headers)

    @task(1)
    def view_messages(self):
        """Seller views buyer messages"""
        self.client.get("/api/v1/messages/conversations", headers=self.headers)


# ===== EVENT HANDLERS FOR LOGGING =====

@events.test_start.add_listener
def on_test_start(environment, **kwargs):
    """Called when locust starts"""
    logger.info("🚀 Load testing started")
    logger.info(f"Target: {environment.host}")
    logger.info(f"Users: {environment.runner.target_user_count}")


@events.test_stop.add_listener
def on_test_stop(environment, **kwargs):
    """Called when locust stops"""
    logger.info("🛑 Load testing stopped")

    # Print statistics
    print("\n" + "="*70)
    print("LOAD TEST RESULTS")
    print("="*70)
    print(f"Total requests: {environment.stats.total.num_requests}")
    print(f"Total failures: {environment.stats.total.num_failures}")
    print(f"Response time (avg): {environment.stats.total.avg_response_time:.0f}ms")
    print(f"Response time (min): {environment.stats.total.min_response_time:.0f}ms")
    print(f"Response time (max): {environment.stats.total.max_response_time:.0f}ms")
    print(f"Requests/second: {environment.stats.total.total_rps:.2f}")
    print("="*70 + "\n")


@events.request.add_listener
def on_request(request_type, name, response_time, response_length, **kwargs):
    """Called after each request"""
    if response_time > 1000:  # Log slow requests (> 1s)
        logger.warning(f"⚠️  Slow request: {name} took {response_time:.0f}ms")


# ===== LOAD TEST SCENARIOS =====

class LoadTestScenarios:
    """
    Different load test scenarios:

    1. Light Load:
       locust -f locustfile.py -H http://localhost:8000 --users 10 --spawn-rate 2

    2. Normal Load:
       locust -f locustfile.py -H http://localhost:8000 --users 50 --spawn-rate 5

    3. Heavy Load:
       locust -f locustfile.py -H http://localhost:8000 --users 200 --spawn-rate 20

    4. Spike Test:
       locust -f locustfile.py -H http://localhost:8000 --users 500 --spawn-rate 50 --run-time 10m

    5. Stress Test:
       locust -f locustfile.py -H http://localhost:8000 --users 1000 --spawn-rate 100
    """
    pass


if __name__ == "__main__":
    print("""
╔════════════════════════════════════════════════════════════════╗
║           IMMO2000 LOAD TESTING WITH LOCUST                   ║
╚════════════════════════════════════════════════════════════════╝

User Behaviors:
  • ImmoUserBehavior (General users)
  • AdminUserBehavior (Admin dashboard)
  • BuyerUserBehavior (Search & browse)
  • SellerUserBehavior (Manage listings)

Run Tests:
  locust -f locustfile.py -H http://localhost:8000 --users 100 --spawn-rate 10

Web UI: http://localhost:8089

Options:
  --users N           Number of concurrent users
  --spawn-rate N      Users to spawn per second
  --run-time 5m       Duration of test
  --headless          Run without web UI
  --csv=results       Export results to CSV
    """)
