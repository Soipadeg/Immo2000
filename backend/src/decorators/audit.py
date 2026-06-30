"""
Decorator for automatic audit logging.
"""

from functools import wraps
from flask import request, g
from backend.src.models.audit import AuditLog, AuditActionType
from backend.src.database import db
import logging

logger = logging.getLogger(__name__)


def audit_action(action_type: str, resource_type: str = None):
    """
    Decorator to automatically log actions to audit trail.

    Args:
        action_type: Type of action (from AuditActionType enum)
        resource_type: Type of resource being modified

    Usage:
        @audit_action(AuditActionType.LISTING_CREATE, 'listing')
        def create_listing():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = None
            status = 'success'
            error_message = None

            # Get user ID from flask g (set by auth middleware)
            if hasattr(g, 'user_id'):
                user_id = g.user_id

            try:
                result = f(*args, **kwargs)
                return result
            except Exception as e:
                status = 'failure'
                error_message = str(e)
                raise
            finally:
                try:
                    # Log the action
                    ip_address = request.remote_addr or 'unknown'
                    user_agent = request.headers.get('User-Agent', '')

                    audit_log = AuditLog(
                        user_id=user_id,
                        action=action_type,
                        resource_type=resource_type,
                        ip_address=ip_address,
                        user_agent=user_agent[:500],  # Limit length
                        status=status,
                        error_message=error_message,
                    )

                    db.session.add(audit_log)
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Failed to log audit action: {e}")
                    db.session.rollback()

        return decorated_function
    return decorator


def audit_action_detailed(action_type: str, resource_type: str = None, extract_resource_id=None):
    """
    Decorator with resource ID extraction and change tracking.

    Args:
        action_type: Type of action
        resource_type: Type of resource
        extract_resource_id: Function to extract resource ID from args/kwargs/result

    Usage:
        @audit_action_detailed(
            AuditActionType.LISTING_UPDATE,
            'listing',
            extract_resource_id=lambda args, kwargs, result: kwargs.get('listing_id')
        )
        def update_listing(listing_id):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = None
            resource_id = None
            status = 'success'
            error_message = None
            result = None

            if hasattr(g, 'user_id'):
                user_id = g.user_id

            try:
                result = f(*args, **kwargs)

                # Extract resource ID if provided
                if extract_resource_id:
                    resource_id = extract_resource_id(args, kwargs, result)

                return result
            except Exception as e:
                status = 'failure'
                error_message = str(e)
                raise
            finally:
                try:
                    ip_address = request.remote_addr or 'unknown'
                    user_agent = request.headers.get('User-Agent', '')

                    audit_log = AuditLog(
                        user_id=user_id,
                        action=action_type,
                        resource_type=resource_type,
                        resource_id=resource_id,
                        ip_address=ip_address,
                        user_agent=user_agent[:500],
                        status=status,
                        error_message=error_message,
                    )

                    db.session.add(audit_log)
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Failed to log detailed audit action: {e}")
                    db.session.rollback()

        return decorated_function
    return decorator


def track_changes(action_type: str, resource_type: str, get_old_value=None, get_new_value=None):
    """
    Decorator to track before/after changes.

    Args:
        action_type: Type of action
        resource_type: Type of resource
        get_old_value: Function to get old value before change
        get_new_value: Function to get new value after change

    Usage:
        @track_changes(
            AuditActionType.USER_UPDATE,
            'user',
            get_old_value=lambda user: {'email': user.email},
            get_new_value=lambda: {'email': request.json['email']}
        )
        def update_user():
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            user_id = None
            old_value = None
            new_value = None
            status = 'success'
            error_message = None

            if hasattr(g, 'user_id'):
                user_id = g.user_id

            # Get old value if provided
            if get_old_value:
                try:
                    old_value = get_old_value()
                except:
                    pass

            try:
                result = f(*args, **kwargs)

                # Get new value if provided
                if get_new_value:
                    try:
                        new_value = get_new_value()
                    except:
                        pass

                return result
            except Exception as e:
                status = 'failure'
                error_message = str(e)
                raise
            finally:
                try:
                    ip_address = request.remote_addr or 'unknown'
                    user_agent = request.headers.get('User-Agent', '')

                    changes = None
                    if old_value or new_value:
                        changes = {
                            'before': old_value,
                            'after': new_value,
                        }

                    audit_log = AuditLog(
                        user_id=user_id,
                        action=action_type,
                        resource_type=resource_type,
                        ip_address=ip_address,
                        user_agent=user_agent[:500],
                        changes=changes,
                        status=status,
                        error_message=error_message,
                    )

                    db.session.add(audit_log)
                    db.session.commit()
                except Exception as e:
                    logger.error(f"Failed to track changes: {e}")
                    db.session.rollback()

        return decorated_function
    return decorator
