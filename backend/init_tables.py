import sys
import os
os.environ['DATABASE_URL'] = 'sqlite:///immo2000.db'
sys.path.insert(0, '.')

from src.auth.models import db
from src.app import create_app
from src.models.notaires import TransactionNotaire

app = create_app("development")
with app.app_context():
    print("Creating tables...")
    db.create_all()
    print("✅ Tables created successfully")
    
    # Check if transaction_notaire table exists
    from sqlalchemy import inspect
    inspector = inspect(db.engine)
    tables = inspector.get_table_names()
    print(f"Tables in database: {tables}")
    
    if 'transaction_notaire' in tables:
        columns = [col['name'] for col in inspector.get_columns('transaction_notaire')]
        print(f"Columns in transaction_notaire: {columns}")
        
        # Check for new columns
        new_cols = ['frais_notaire', 'frais_immo2000', 'compromis_url', 'docusign_envelope_id', 'date_validation_frais', 'compromis_genere_le', 'date_envoi_signature']
        for col in new_cols:
            if col in columns:
                print(f"  ✅ {col}")
            else:
                print(f"  ❌ {col} missing")
