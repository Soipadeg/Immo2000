"""
Migrations pour Task 3: Sécurité & Audit
"""

import os
import psycopg2
from psycopg2 import sql

def migrate_create_audit_tables():
    """Créer les tables d'audit et rate limiting"""

    # Récupérer la connexion DB
    db_config = {
        'host': os.getenv('DB_HOST', 'localhost'),
        'port': os.getenv('DB_PORT', '5432'),
        'database': os.getenv('DB_NAME', 'immo2000'),
        'user': os.getenv('DB_USER', 'postgres'),
        'password': os.getenv('DB_PASSWORD', 'password')
    }

    conn = psycopg2.connect(**db_config)
    cursor = conn.cursor()

    try:
        # Table admin_audit_logs
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS admin_audit_logs (
                log_id SERIAL PRIMARY KEY,
                admin_id INTEGER NOT NULL,
                admin_email VARCHAR(255) NOT NULL,
                action VARCHAR(100) NOT NULL,
                resource_type VARCHAR(50) NOT NULL,
                resource_id INTEGER,
                old_value JSONB,
                new_value JSONB,
                status_code INTEGER,
                ip_address VARCHAR(45),
                user_agent VARCHAR(500),
                reason VARCHAR(500),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP,

                CONSTRAINT fk_admin_id FOREIGN KEY (admin_id)
                    REFERENCES utilisateurs(utilisateur_id) ON DELETE CASCADE
            );
        """)

        # Index pour les requêtes communes
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_logs_admin
            ON admin_audit_logs(admin_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_logs_action
            ON admin_audit_logs(action);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_logs_resource
            ON admin_audit_logs(resource_type, resource_id);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_audit_logs_timestamp
            ON admin_audit_logs(timestamp);
        """)

        print("✓ Table admin_audit_logs créée avec succès")

        # Table rate_limit_log
        cursor.execute("""
            CREATE TABLE IF NOT EXISTS rate_limit_log (
                log_id SERIAL PRIMARY KEY,
                identifier VARCHAR(100) NOT NULL,
                endpoint VARCHAR(255),
                timestamp TIMESTAMP DEFAULT CURRENT_TIMESTAMP
            );
        """)

        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_rate_limit_identifier
            ON rate_limit_log(identifier);
        """)
        cursor.execute("""
            CREATE INDEX IF NOT EXISTS idx_rate_limit_timestamp
            ON rate_limit_log(timestamp);
        """)

        print("✓ Table rate_limit_log créée avec succès")

        conn.commit()
        print("✓ Migrations complètes pour Task 3")

    except psycopg2.Error as e:
        conn.rollback()
        print(f"✗ Erreur migration: {str(e)}")
    finally:
        cursor.close()
        conn.close()


if __name__ == '__main__':
    migrate_create_audit_tables()
