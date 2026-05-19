"""Add notaire transaction columns Phase 6f

Revision ID: 8c08a78cc189
Revises:
Create Date: 2026-05-19 12:11:00.807786

"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision: str = '8c08a78cc189'
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    # Add Phase 6f.notaire columns to transaction_notaire table
    op.add_column('transaction_notaire', sa.Column('frais_notaire', sa.Numeric(12, 2), nullable=True))
    op.add_column('transaction_notaire', sa.Column('frais_immo2000', sa.Numeric(12, 2), nullable=True))
    op.add_column('transaction_notaire', sa.Column('compromis_url', sa.String(500), nullable=True))
    op.add_column('transaction_notaire', sa.Column('docusign_envelope_id', sa.String(100), nullable=True))
    op.add_column('transaction_notaire', sa.Column('date_validation_frais', sa.DateTime(), nullable=True))
    op.add_column('transaction_notaire', sa.Column('compromis_genere_le', sa.DateTime(), nullable=True))
    op.add_column('transaction_notaire', sa.Column('date_envoi_signature', sa.DateTime(), nullable=True))


def downgrade() -> None:
    # Drop Phase 6f.notaire columns from transaction_notaire table
    op.drop_column('transaction_notaire', 'date_envoi_signature')
    op.drop_column('transaction_notaire', 'compromis_genere_le')
    op.drop_column('transaction_notaire', 'date_validation_frais')
    op.drop_column('transaction_notaire', 'docusign_envelope_id')
    op.drop_column('transaction_notaire', 'compromis_url')
    op.drop_column('transaction_notaire', 'frais_immo2000')
    op.drop_column('transaction_notaire', 'frais_notaire')
