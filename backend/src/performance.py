"""
Performance analysis and query optimization tools.

This module helps analyze and measure the impact of indexes on query performance.
"""

import time
from typing import Dict, List, Tuple
from sqlalchemy import text
from backend.src.database import db


class PerformanceAnalyzer:
    """Analyze database query performance."""

    @staticmethod
    def measure_query_time(query: str, iterations: int = 1) -> float:
        """
        Measure query execution time.

        Args:
            query: SQL query to measure
            iterations: Number of times to run the query

        Returns:
            Average execution time in milliseconds
        """
        total_time = 0

        for _ in range(iterations):
            start = time.time()
            try:
                db.session.execute(text(query))
            except Exception as e:
                print(f"Query error: {e}")
                return -1
            end = time.time()
            total_time += (end - start) * 1000  # Convert to milliseconds

        return total_time / iterations

    @staticmethod
    def explain_query(query: str) -> Dict:
        """
        Get query execution plan (EXPLAIN ANALYZE).

        Args:
            query: SQL query to analyze

        Returns:
            Dictionary with execution plan details
        """
        try:
            result = db.session.execute(text(f"EXPLAIN ANALYZE {query}"))
            plan = result.fetchall()

            return {
                'success': True,
                'plan': [str(row[0]) for row in plan],
                'indexes_used': PerformanceAnalyzer._extract_indexes_used(plan),
            }
        except Exception as e:
            return {
                'success': False,
                'error': str(e),
            }

    @staticmethod
    def _extract_indexes_used(plan: List) -> List[str]:
        """Extract index names from execution plan."""
        indexes = []
        for row in plan:
            plan_str = str(row[0])
            if 'Index' in plan_str or 'index' in plan_str:
                indexes.append(plan_str.strip())
        return indexes

    @staticmethod
    def get_table_stats(table_name: str) -> Dict:
        """
        Get table statistics.

        Args:
            table_name: Name of the table

        Returns:
            Dictionary with table stats
        """
        try:
            # Get row count
            row_count_result = db.session.execute(
                text(f"SELECT COUNT(*) FROM {table_name}")
            )
            row_count = row_count_result.scalar()

            # Get table size
            size_result = db.session.execute(
                text(f"SELECT pg_size_pretty(pg_total_relation_size('{table_name}'))")
            )
            size = size_result.scalar()

            # Get indexes
            indexes_result = db.session.execute(
                text(f"""
                    SELECT indexname FROM pg_indexes
                    WHERE tablename = '{table_name}'
                """)
            )
            indexes = [row[0] for row in indexes_result.fetchall()]

            return {
                'table': table_name,
                'row_count': row_count,
                'size': size,
                'indexes': indexes,
                'index_count': len(indexes),
            }
        except Exception as e:
            return {
                'error': str(e),
            }

    @staticmethod
    def get_slow_queries(threshold_ms: float = 100) -> List[Dict]:
        """
        Get slow queries from query logs (PostgreSQL specific).

        Args:
            threshold_ms: Queries slower than this (in ms) are reported

        Returns:
            List of slow queries
        """
        try:
            # Requires PostgreSQL log_min_duration_statement to be set
            result = db.session.execute(
                text(f"""
                    SELECT query, mean_time, calls
                    FROM pg_stat_statements
                    WHERE mean_time > {threshold_ms}
                    ORDER BY mean_time DESC
                    LIMIT 20
                """)
            )

            slow_queries = []
            for row in result.fetchall():
                slow_queries.append({
                    'query': row[0],
                    'mean_time_ms': row[1],
                    'calls': row[2],
                })

            return slow_queries
        except Exception as e:
            return [{'error': str(e)}]

    @staticmethod
    def get_index_stats() -> List[Dict]:
        """
        Get statistics for all indexes.

        Returns:
            List of index statistics
        """
        try:
            result = db.session.execute(
                text("""
                    SELECT
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan,
                        idx_tup_read,
                        idx_tup_fetch
                    FROM pg_stat_user_indexes
                    ORDER BY idx_scan DESC
                """)
            )

            stats = []
            for row in result.fetchall():
                stats.append({
                    'schema': row[0],
                    'table': row[1],
                    'index': row[2],
                    'scans': row[3],
                    'tuples_read': row[4],
                    'tuples_fetched': row[5],
                    'usage_score': row[3] * (row[4] + row[5]),  # Simple usage metric
                })

            return stats
        except Exception as e:
            return [{'error': str(e)}]

    @staticmethod
    def find_unused_indexes() -> List[Dict]:
        """
        Find indexes that are never used.

        Returns:
            List of unused indexes
        """
        try:
            result = db.session.execute(
                text("""
                    SELECT
                        schemaname,
                        tablename,
                        indexname,
                        idx_scan
                    FROM pg_stat_user_indexes
                    WHERE idx_scan = 0
                    ORDER BY pg_relation_size(indexrelid) DESC
                """)
            )

            unused = []
            for row in result.fetchall():
                unused.append({
                    'schema': row[0],
                    'table': row[1],
                    'index': row[2],
                    'scans': row[3],
                    'recommendation': 'Consider dropping this index',
                })

            return unused
        except Exception as e:
            return [{'error': str(e)}]

    @staticmethod
    def generate_index_report() -> str:
        """Generate a comprehensive index performance report."""
        report = []
        report.append("═" * 80)
        report.append("DATABASE INDEX PERFORMANCE REPORT")
        report.append("═" * 80)
        report.append("")

        # Table Statistics
        report.append("TABLE STATISTICS")
        report.append("─" * 80)
        tables = ['users', 'annonces', 'paiements', 'messages', 'notifications']
        for table in tables:
            stats = PerformanceAnalyzer.get_table_stats(table)
            if 'error' not in stats:
                report.append(
                    f"  {stats['table']}: "
                    f"{stats['row_count']:,} rows, "
                    f"{stats['size']}, "
                    f"{stats['index_count']} indexes"
                )
        report.append("")

        # Index Usage
        report.append("TOP 10 MOST USED INDEXES")
        report.append("─" * 80)
        index_stats = PerformanceAnalyzer.get_index_stats()
        for i, stat in enumerate(index_stats[:10], 1):
            if 'error' not in stat:
                report.append(
                    f"  {i}. {stat['index']}: "
                    f"scans={stat['scans']:,}, "
                    f"tuples_read={stat['tuples_read']:,}"
                )
        report.append("")

        # Unused Indexes
        unused = PerformanceAnalyzer.find_unused_indexes()
        if unused and 'error' not in unused[0]:
            report.append("UNUSED INDEXES (Consider Dropping)")
            report.append("─" * 80)
            for unused_idx in unused[:5]:
                report.append(f"  {unused_idx['table']}.{unused_idx['index']}")
            report.append("")

        report.append("═" * 80)
        return "\n".join(report)


class QueryOptimizer:
    """Optimize queries using index information."""

    COMMON_SLOW_PATTERNS = {
        "SELECT * FROM table": "Use specific columns instead of *",
        "LIKE '%value'": "Use LIKE 'value%' or full-text search",
        "OR in WHERE": "Consider UNION of indexed queries",
        "NOT IN": "Consider NOT EXISTS instead",
        "JOIN without index": "Ensure foreign keys are indexed",
    }

    @staticmethod
    def suggest_indexes(query: str) -> List[str]:
        """
        Suggest indexes for a given query.

        Args:
            query: SQL query to analyze

        Returns:
            List of suggestions
        """
        suggestions = []
        query_upper = query.upper()

        # Check for common patterns
        if "WHERE" in query_upper:
            if "LIKE '%" in query_upper:
                suggestions.append(
                    "💡 Use LIKE 'value%' instead of LIKE '%value%' for better index usage"
                )

            if " OR " in query_upper:
                suggestions.append(
                    "💡 Consider breaking OR conditions into separate indexed queries"
                )

            if "NOT IN" in query_upper:
                suggestions.append(
                    "💡 Consider using NOT EXISTS instead of NOT IN for better performance"
                )

        if "JOIN" in query_upper:
            suggestions.append(
                "💡 Ensure all JOIN columns are indexed (especially foreign keys)"
            )

        if "SELECT *" in query_upper:
            suggestions.append(
                "💡 Select only needed columns to reduce I/O"
            )

        if "ORDER BY" in query_upper and "LIMIT" in query_upper:
            suggestions.append(
                "💡 Use composite index on (ORDER BY columns, LIMIT columns)"
            )

        return suggestions if suggestions else ["✓ Query looks optimized"]

    @staticmethod
    def recommend_indexes(table_name: str, columns: List[str]) -> Dict:
        """
        Recommend indexes for a table and columns.

        Args:
            table_name: Name of the table
            columns: List of column names

        Returns:
            Recommendations
        """
        recommendations = {
            'table': table_name,
            'columns': columns,
            'index_suggestions': [],
        }

        # Single column indexes
        for col in columns:
            recommendations['index_suggestions'].append({
                'type': 'SINGLE',
                'columns': [col],
                'reason': f'Index for WHERE {col} = value queries',
            })

        # Composite index
        if len(columns) > 1:
            recommendations['index_suggestions'].append({
                'type': 'COMPOSITE',
                'columns': columns,
                'reason': f'Composite index for multi-column filters',
            })

        return recommendations


# Performance Testing Queries
PERFORMANCE_TEST_QUERIES = {
    "users_by_email": "SELECT * FROM users WHERE email = 'admin@immo2000.fr' LIMIT 1;",
    "user_listings_recent": "SELECT * FROM annonces WHERE user_id = 1 ORDER BY created_at DESC LIMIT 20;",
    "listings_by_status": "SELECT * FROM annonces WHERE status = 'published' LIMIT 50;",
    "listings_by_price": "SELECT * FROM annonces WHERE prix BETWEEN 100000 AND 500000 LIMIT 20;",
    "user_payments": "SELECT * FROM paiements WHERE user_id = 1 ORDER BY created_at DESC;",
    "pending_payments": "SELECT * FROM paiements WHERE status = 'pending' LIMIT 100;",
    "user_messages_unread": "SELECT COUNT(*) FROM messages WHERE user_id_to = 1 AND read = false;",
    "user_notifications": "SELECT * FROM notifications WHERE user_id = 1 AND read = false ORDER BY created_at DESC;",
    "user_favorites": "SELECT * FROM favoris WHERE user_id = 1;",
    "property_offers": "SELECT * FROM offres WHERE listing_id = 1 ORDER BY prix DESC;",
}


if __name__ == "__main__":
    print("Performance Analysis Module")
    print("Usage: from src.performance import PerformanceAnalyzer")
    print("       analyzer = PerformanceAnalyzer()")
    print("       report = analyzer.generate_index_report()")
