"""
Migration: Add security and RGPD models
"""

from alembic import op
import sqlalchemy as sa


revision = '001_add_security_models'
down_revision = None
branch_labels = None
depends_on = None


def upgrade():
    # Create security_profiles table
    op.create_table(
        'security_profiles',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('utilisateur_id', sa.Integer(), nullable=False),
        sa.Column('identite_verifiee', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('verification_id', sa.String(500), nullable=True),
        sa.Column('verification_method', sa.String(50), nullable=True),
        sa.Column('verification_date', sa.DateTime(), nullable=True),
        sa.Column('verification_expires', sa.DateTime(), nullable=True),
        sa.Column('secret_2fa', sa.String(200), nullable=True),
        sa.Column('is_2fa_enabled', sa.Boolean(), nullable=True, server_default='false'),
        sa.Column('backup_codes', sa.JSON(), nullable=True),
        sa.Column('trusted_devices', sa.JSON(), nullable=True),
        sa.Column('last_device_id', sa.String(500), nullable=True),
        sa.Column('failed_login_attempts', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('last_failed_login', sa.DateTime(), nullable=True),
        sa.Column('account_locked_until', sa.DateTime(), nullable=True),
        sa.Column('active_sessions', sa.JSON(), nullable=True),
        sa.Column('last_security_alert', sa.DateTime(), nullable=True),
        sa.Column('security_alert_count', sa.Integer(), nullable=True, server_default='0'),
        sa.Column('created_at', sa.DateTime(), nullable=True),
        sa.Column('updated_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['utilisateur_id'], ['utilisateurs.utilisateur_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('utilisateur_id')
    )
    op.create_index('ix_security_profiles_identite_verifiee', 'security_profiles', ['identite_verifiee'])
    op.create_index('ix_security_profiles_utilisateur_id', 'security_profiles', ['utilisateur_id'])

    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('utilisateur_id', sa.Integer(), nullable=True),
        sa.Column('action', sa.String(100), nullable=False),
        sa.Column('action_category', sa.String(50), nullable=True),
        sa.Column('resource_type', sa.String(50), nullable=True),
        sa.Column('resource_id', sa.Integer(), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('status', sa.String(20), nullable=True, server_default='success'),
        sa.Column('risk_level', sa.String(20), nullable=True, server_default='low'),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('user_agent', sa.String(500), nullable=True),
        sa.Column('country_code', sa.String(2), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['utilisateur_id'], ['utilisateurs.utilisateur_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_audit_logs_action', 'audit_logs', ['action'])
    op.create_index('ix_audit_logs_ip_address', 'audit_logs', ['ip_address'])
    op.create_index('ix_audit_logs_timestamp', 'audit_logs', ['timestamp'])
    op.create_index('ix_audit_logs_utilisateur_id', 'audit_logs', ['utilisateur_id'])

    # Create rgpd_requests table
    op.create_table(
        'rgpd_requests',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('utilisateur_id', sa.Integer(), nullable=False),
        sa.Column('request_type', sa.String(50), nullable=False),
        sa.Column('status', sa.String(50), nullable=True, server_default='pending'),
        sa.Column('confirmation_token', sa.String(255), nullable=True),
        sa.Column('confirmation_expires', sa.DateTime(), nullable=True),
        sa.Column('data_url', sa.String(500), nullable=True),
        sa.Column('result', sa.JSON(), nullable=True),
        sa.Column('reason', sa.String(500), nullable=True),
        sa.Column('admin_notes', sa.String(500), nullable=True),
        sa.Column('requested_at', sa.DateTime(), nullable=True),
        sa.Column('confirmed_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['utilisateur_id'], ['utilisateurs.utilisateur_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('confirmation_token')
    )
    op.create_index('ix_rgpd_requests_utilisateur_id', 'rgpd_requests', ['utilisateur_id'])

    # Create identity_verification_logs table
    op.create_table(
        'identity_verification_logs',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('utilisateur_id', sa.Integer(), nullable=False),
        sa.Column('provider', sa.String(50), nullable=False),
        sa.Column('verification_id', sa.String(500), nullable=True),
        sa.Column('first_name', sa.String(100), nullable=True),
        sa.Column('last_name', sa.String(100), nullable=True),
        sa.Column('document_type', sa.String(50), nullable=True),
        sa.Column('status', sa.String(50), nullable=True, server_default='pending'),
        sa.Column('verification_data', sa.JSON(), nullable=True),
        sa.Column('started_at', sa.DateTime(), nullable=True),
        sa.Column('completed_at', sa.DateTime(), nullable=True),
        sa.Column('expires_at', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['utilisateur_id'], ['utilisateurs.utilisateur_id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('verification_id')
    )
    op.create_index('ix_identity_verification_logs_utilisateur_id', 'identity_verification_logs', ['utilisateur_id'])

    # Create security_events table
    op.create_table(
        'security_events',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('utilisateur_id', sa.Integer(), nullable=True),
        sa.Column('event_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), nullable=True, server_default='medium'),
        sa.Column('description', sa.String(500), nullable=True),
        sa.Column('details', sa.JSON(), nullable=True),
        sa.Column('ip_address', sa.String(45), nullable=True),
        sa.Column('country_code', sa.String(2), nullable=True),
        sa.Column('action_taken', sa.String(100), nullable=True),
        sa.Column('timestamp', sa.DateTime(), nullable=True),
        sa.ForeignKeyConstraint(['utilisateur_id'], ['utilisateurs.utilisateur_id'], ),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index('ix_security_events_timestamp', 'security_events', ['timestamp'])


def downgrade():
    op.drop_table('security_events')
    op.drop_table('identity_verification_logs')
    op.drop_table('rgpd_requests')
    op.drop_table('audit_logs')
    op.drop_table('security_profiles')
