"""
Performance benchmark tests for database indexes.

Run before and after applying indexes to measure the impact.
"""

import pytest
import time
from backend.src.database import db
from backend.src.performance import PerformanceAnalyzer, PERFORMANCE_TEST_QUERIES


class TestQueryPerformance:
    """Test query performance before/after indexes."""

    @pytest.fixture(scope="session", autouse=True)
    def setup(self):
        """Setup test data."""
        # Create minimal test data if needed
        pass

    def measure_query(self, query: str, iterations: int = 5) -> float:
        """Measure query execution time."""
        return PerformanceAnalyzer.measure_query_time(query, iterations)

    # ─────────────────────────────────────────────────────────────────────
    # CRITICAL PATH TESTS (User Login, Search, etc)
    # ─────────────────────────────────────────────────────────────────────

    def test_users_by_email_performance(self):
        """Test: Find user by email (Login query)."""
        query = PERFORMANCE_TEST_QUERIES["users_by_email"]
        time_ms = self.measure_query(query)

        print(f"\n✓ User by email: {time_ms:.2f}ms")
        # After indexes: Should be < 5ms
        # Before indexes: Could be 50-200ms
        assert time_ms < 1000, "Query too slow"

    def test_user_listings_performance(self):
        """Test: Get user's recent listings (Dashboard)."""
        query = PERFORMANCE_TEST_QUERIES["user_listings_recent"]
        time_ms = self.measure_query(query)

        print(f"✓ User listings: {time_ms:.2f}ms")
        # After indexes: Should be < 20ms
        # Before indexes: Could be 100-500ms
        assert time_ms < 1000, "Query too slow"

    def test_listings_by_status_performance(self):
        """Test: Get published listings (Search)."""
        query = PERFORMANCE_TEST_QUERIES["listings_by_status"]
        time_ms = self.measure_query(query)

        print(f"✓ Listings by status: {time_ms:.2f}ms")
        # After indexes: Should be < 15ms
        # Before indexes: Could be 50-200ms
        assert time_ms < 1000, "Query too slow"

    def test_listings_by_price_performance(self):
        """Test: Get listings in price range (Filter)."""
        query = PERFORMANCE_TEST_QUERIES["listings_by_price"]
        time_ms = self.measure_query(query)

        print(f"✓ Listings by price: {time_ms:.2f}ms")
        # After indexes: Should be < 15ms
        assert time_ms < 1000, "Query too slow"

    # ─────────────────────────────────────────────────────────────────────
    # TRANSACTION TESTS (Payments, Offers)
    # ─────────────────────────────────────────────────────────────────────

    def test_user_payments_performance(self):
        """Test: Get user's payment history."""
        query = PERFORMANCE_TEST_QUERIES["user_payments"]
        time_ms = self.measure_query(query)

        print(f"✓ User payments: {time_ms:.2f}ms")
        # After indexes: Should be < 10ms
        assert time_ms < 1000, "Query too slow"

    def test_pending_payments_performance(self):
        """Test: Get pending payments (Admin reconciliation)."""
        query = PERFORMANCE_TEST_QUERIES["pending_payments"]
        time_ms = self.measure_query(query)

        print(f"✓ Pending payments: {time_ms:.2f}ms")
        # After indexes: Should be < 20ms
        assert time_ms < 1000, "Query too slow"

    def test_property_offers_performance(self):
        """Test: Get offers for a property (Sorted)."""
        query = PERFORMANCE_TEST_QUERIES["property_offers"]
        time_ms = self.measure_query(query)

        print(f"✓ Property offers: {time_ms:.2f}ms")
        # After indexes: Should be < 15ms
        assert time_ms < 1000, "Query too slow"

    # ─────────────────────────────────────────────────────────────────────
    # REAL-TIME TESTS (Messages, Notifications)
    # ─────────────────────────────────────────────────────────────────────

    def test_user_messages_unread_performance(self):
        """Test: Count unread messages (Real-time badge)."""
        query = PERFORMANCE_TEST_QUERIES["user_messages_unread"]
        time_ms = self.measure_query(query, iterations=10)  # More iterations for count

        print(f"✓ Unread messages count: {time_ms:.2f}ms")
        # After indexes: Should be < 5ms
        # This is called frequently!
        assert time_ms < 1000, "Query too slow"

    def test_user_notifications_performance(self):
        """Test: Get user's notifications."""
        query = PERFORMANCE_TEST_QUERIES["user_notifications"]
        time_ms = self.measure_query(query)

        print(f"✓ User notifications: {time_ms:.2f}ms")
        # After indexes: Should be < 10ms
        assert time_ms < 1000, "Query too slow"

    def test_user_favorites_performance(self):
        """Test: Get user's favorite listings."""
        query = PERFORMANCE_TEST_QUERIES["user_favorites"]
        time_ms = self.measure_query(query)

        print(f"✓ User favorites: {time_ms:.2f}ms")
        # After indexes: Should be < 10ms
        assert time_ms < 1000, "Query too slow"

    # ─────────────────────────────────────────────────────────────────────
    # REPORT GENERATION
    # ─────────────────────────────────────────────────────────────────────

    def test_generate_performance_report(self):
        """Generate performance report."""
        report = PerformanceAnalyzer.generate_index_report()
        print(f"\n{report}")
        assert "TABLE STATISTICS" in report
        assert "INDEX" in report


class TestIndexEffectiveness:
    """Test effectiveness of created indexes."""

    def test_all_tables_have_indexes(self):
        """Verify all critical tables have indexes."""
        critical_tables = ['users', 'annonces', 'paiements']

        for table in critical_tables:
            stats = PerformanceAnalyzer.get_table_stats(table)
            assert 'error' not in stats, f"Error getting stats for {table}"
            assert stats['index_count'] > 0, f"No indexes on {table}"
            print(f"✓ {table}: {stats['index_count']} indexes")

    def test_no_unused_indexes(self):
        """Verify indexes are being used (not bloat)."""
        index_stats = PerformanceAnalyzer.get_index_stats()

        used_indexes = 0
        for stat in index_stats:
            if 'error' not in stat and stat['scans'] > 0:
                used_indexes += 1

        total_indexes = len([s for s in index_stats if 'error' not in s])
        usage_rate = (used_indexes / total_indexes * 100) if total_indexes > 0 else 0

        print(f"\n✓ Index usage rate: {usage_rate:.1f}% ({used_indexes}/{total_indexes})")
        # After deployment, expect > 80% of indexes to be used
        assert usage_rate > 50, "Too many unused indexes"

    def test_index_sizes(self):
        """Check index sizes are reasonable."""
        tables = ['users', 'annonces', 'paiements', 'messages']

        for table in tables:
            stats = PerformanceAnalyzer.get_table_stats(table)
            if 'error' not in stats:
                print(f"\n✓ {table}: {stats['size']}")


class TestQueryOptimization:
    """Test query optimization suggestions."""

    def test_query_suggestions(self):
        """Test that optimization suggestions are generated."""
        from backend.src.performance import QueryOptimizer

        queries = [
            "SELECT * FROM users WHERE email = 'test@test.com'",
            "SELECT * FROM annonces WHERE prix BETWEEN 100000 AND 500000",
            "SELECT * FROM messages WHERE user_id_to = 1 AND read = false",
        ]

        for query in queries:
            suggestions = QueryOptimizer.suggest_indexes(query)
            print(f"\n✓ Query: {query[:50]}...")
            for suggestion in suggestions:
                print(f"  {suggestion}")
            assert len(suggestions) > 0


class TestPerformanceImpact:
    """Measure actual performance impact."""

    def test_performance_improvement_potential(self):
        """Calculate expected performance improvement."""
        analyzer = PerformanceAnalyzer()

        # Test queries that benefit most from indexes
        test_cases = [
            ("High selectivity (user_id)", PERFORMANCE_TEST_QUERIES["user_listings_recent"]),
            ("Status filter", PERFORMANCE_TEST_QUERIES["listings_by_status"]),
            ("Range query", PERFORMANCE_TEST_QUERIES["listings_by_price"]),
            ("Composite filter", PERFORMANCE_TEST_QUERIES["user_messages_unread"]),
        ]

        print("\n" + "=" * 80)
        print("PERFORMANCE IMPROVEMENT POTENTIAL")
        print("=" * 80)

        for test_name, query in test_cases:
            exec_plan = analyzer.explain_query(query)
            if exec_plan['success']:
                indexes_used = len(exec_plan['indexes_used'])
                improvement = f"Using {indexes_used} indexes"
                print(f"✓ {test_name}: {improvement}")
            else:
                print(f"✗ {test_name}: Could not analyze")

        print("=" * 80)


# Benchmark utilities
def run_benchmark():
    """Run full performance benchmark suite."""
    import sys

    print("\n" + "=" * 80)
    print("DATABASE PERFORMANCE BENCHMARK")
    print("=" * 80)
    print("\nRunning tests...")

    # Run pytest programmatically
    exit_code = pytest.main([__file__, "-v", "-s"])

    print("\n" + "=" * 80)
    if exit_code == 0:
        print("✓ All performance tests passed!")
    else:
        print("✗ Some tests failed")
    print("=" * 80)

    return exit_code


if __name__ == "__main__":
    run_benchmark()
