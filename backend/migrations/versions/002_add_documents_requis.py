"""
Alembic migration pour ajouter la table documents_requis.

Cette table stocke les documents obligatoires pour publier une annonce:
1. Titre de propriété
2. Carte nationale d'identité
3. Procès verbaux d'AG
4. Règlement de copropriété
5. Diagnostics Techniques
"""

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'documents_requis_002'
down_revision = '002_add_audit_tables'
branch_labels = None
depends_on = None


def upgrade():
    """Créer la table documents_requis."""

    op.create_table(
        'documents_requis',
        sa.Column('document_requis_id', sa.Integer(), nullable=False),
        sa.Column('annonce_id', sa.Integer(), nullable=False),
        sa.Column('type_document', sa.String(length=50), nullable=False),
        sa.Column('statut', sa.String(length=20), nullable=False, server_default='manquant'),
        sa.Column('url_document', sa.String(length=500), nullable=True),
        sa.Column('taille', sa.Integer(), nullable=True),
        sa.Column('mime_type', sa.String(length=50), nullable=True),
        sa.Column('motif_rejet', sa.Text(), nullable=True),
        sa.Column('date_submission', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_validation', sa.DateTime(timezone=True), nullable=True),
        sa.Column('date_creation', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.Column('date_modification', sa.DateTime(timezone=True), nullable=False, server_default=sa.func.now()),
        sa.ForeignKeyConstraint(['annonce_id'], ['annonces.annonce_id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('document_requis_id')
    )

    # Créer les indexes
    op.create_index('idx_annonce_type', 'documents_requis', ['annonce_id', 'type_document'])
    op.create_index('idx_annonce_statut', 'documents_requis', ['annonce_id', 'statut'])
    op.create_index('idx_document_type', 'documents_requis', ['type_document'])


def downgrade():
    """Supprimer la table documents_requis."""

    op.drop_index('idx_document_type', table_name='documents_requis')
    op.drop_index('idx_annonce_statut', table_name='documents_requis')
    op.drop_index('idx_annonce_type', table_name='documents_requis')
    op.drop_table('documents_requis')
