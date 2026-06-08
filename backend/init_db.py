#!/usr/bin/env python3
"""Initialize database tables for Immo2000."""

import sys
import os

# Add backend to path
sys.path.insert(0, '/app/backend')
os.chdir('/app/backend')

from src.app import create_app
from src.auth.models import db

def init_db():
    """Create all database tables."""
    print("🔄 Initializing database...")

    app = create_app()
    with app.app_context():
        try:
            db.create_all()
            print("✅ Database tables created successfully!")
            return True
        except Exception as e:
            print(f"❌ Error creating tables: {e}")
            return False

if __name__ == "__main__":
    success = init_db()
    sys.exit(0 if success else 1)
