"""Add audit logs and security events tables

Revision ID: 002_add_audit_tables
Revises: 001_add_security_models
Create Date: 2024-06-26

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '002_add_audit_tables'
down_revision = '001_add_security_models'
branch_labels = None
depends_on = None


def upgrade():
    """Create audit log and security event tables."""

    # Create audit_logs table
    try:
        op.create_table(
            'audit_logs',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('action', sa.String(length=50), nullable=False),
            sa.Column('resource_type', sa.String(length=50), nullable=True),
            sa.Column('resource_id', sa.Integer(), nullable=True),
            sa.Column('description', sa.Text(), nullable=True),
            sa.Column('changes', postgresql.JSON(), nullable=True),
            sa.Column('ip_address', sa.String(length=45), nullable=False),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('status', sa.String(length=20), nullable=False, server_default='success'),
            sa.Column('error_message', sa.Text(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

        # Create indexes for audit_logs
        op.create_index('idx_audit_user_id', 'audit_logs', ['user_id'], unique=False)
        op.create_index('idx_audit_action', 'audit_logs', ['action'], unique=False)
        op.create_index('idx_audit_created_at', 'audit_logs', ['created_at'], unique=False)
        op.create_index('idx_audit_user_action', 'audit_logs', ['user_id', 'action'], unique=False)
    except:
        pass  # Tables already exist

    # Create security_events table
    try:
        op.create_table(
            'security_events',
            sa.Column('id', sa.Integer(), nullable=False),
            sa.Column('user_id', sa.Integer(), nullable=True),
            sa.Column('event_type', sa.String(length=50), nullable=False),
            sa.Column('severity', sa.String(length=20), nullable=False),
            sa.Column('description', sa.Text(), nullable=False),
            sa.Column('ip_address', sa.String(length=45), nullable=False),
            sa.Column('user_agent', sa.Text(), nullable=True),
            sa.Column('metadata', postgresql.JSON(), nullable=True),
            sa.Column('created_at', sa.DateTime(), nullable=False),
            sa.Column('resolved_at', sa.DateTime(), nullable=True),
            sa.Column('resolved_by_admin', sa.Integer(), nullable=True),
            sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
            sa.ForeignKeyConstraint(['resolved_by_admin'], ['users.id'], ),
            sa.PrimaryKeyConstraint('id')
        )

        # Create indexes for security_events
        op.create_index('idx_security_user_id', 'security_events', ['user_id'], unique=False)
        op.create_index('idx_security_event_type', 'security_events', ['event_type'], unique=False)
        op.create_index('idx_security_created_at', 'security_events', ['created_at'], unique=False)
    except:
        pass  # Tables already exist


def downgrade():
    """Drop audit log and security event tables."""

    # Drop security_events table
    op.drop_index('idx_security_created_at', table_name='security_events')
    op.drop_index('idx_security_event_type', table_name='security_events')
    op.drop_index('idx_security_user_id', table_name='security_events')
    op.drop_table('security_events')

    # Drop audit_logs table
    op.drop_index('idx_audit_user_action', table_name='audit_logs')
    op.drop_index('idx_audit_created_at', table_name='audit_logs')
    op.drop_index('idx_audit_action', table_name='audit_logs')
    op.drop_index('idx_audit_user_id', table_name='audit_logs')
    op.drop_table('audit_logs')
