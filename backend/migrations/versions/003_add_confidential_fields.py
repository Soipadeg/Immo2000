"""Add confidential fields to annonces table

Revision ID: 003_add_confidential_fields
Revises: documents_requis_002
Create Date: 2026-06-09 11:00:00.000000

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '003_add_confidential_fields'
down_revision = 'documents_requis_002'
branch_labels = None
depends_on = None


def upgrade():
    """Add confidential fields to annonces table"""
    try:
        # Ajouter les colonnes
        op.add_column('annonces', sa.Column('nom_proprietaires', sa.String(255), nullable=True))
        op.add_column('annonces', sa.Column('reference_cadastrale', sa.String(100), nullable=True))
        op.add_column('annonces', sa.Column('date_construction', sa.Date(), nullable=True))

        # Remplir les colonnes existantes avec des valeurs par défaut
        # Pour les annonces existantes
        op.execute("UPDATE annonces SET nom_proprietaires = 'À compléter' WHERE nom_proprietaires IS NULL")
        op.execute("UPDATE annonces SET reference_cadastrale = 'À compléter' WHERE reference_cadastrale IS NULL")
        op.execute("UPDATE annonces SET date_construction = CURRENT_DATE WHERE date_construction IS NULL AND statut = 'brouillon'")

        # Rendre les colonnes NOT NULL après le remplissage
        op.alter_column('annonces', 'nom_proprietaires', nullable=False, existing_type=sa.String(255))
        op.alter_column('annonces', 'reference_cadastrale', nullable=False, existing_type=sa.String(100))
        op.alter_column('annonces', 'date_construction', nullable=False, existing_type=sa.Date())
    except:
        pass  # Table annonces doesn't exist or columns already exist


def downgrade():
    """Remove confidential fields from annonces table"""
    op.drop_column('annonces', 'date_construction')
    op.drop_column('annonces', 'reference_cadastrale')
    op.drop_column('annonces', 'nom_proprietaires')
