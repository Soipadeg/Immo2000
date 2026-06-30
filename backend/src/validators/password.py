"""
Password validation following OWASP guidelines.
"""

import re
from typing import Tuple


class PasswordValidator:
    """Validate passwords according to OWASP standards."""

    # OWASP Configuration
    MIN_LENGTH = 12
    MAX_LENGTH = 128
    REQUIRE_UPPERCASE = True
    REQUIRE_LOWERCASE = True
    REQUIRE_NUMBERS = True
    REQUIRE_SPECIAL = True

    # Common passwords to reject
    BLOCKED_PASSWORDS = {
        'password', 'password123', '12345678', 'qwerty', 'abc123',
        'letmein', 'welcome', 'monkey', 'dragon', 'master'
    }

    # Special characters allowed
    SPECIAL_CHARS = r'!@#$%^&*(),.?":{}|<>~`-_+=[\];:\'"'

    @staticmethod
    def validate(password: str) -> Tuple[bool, str]:
        """
        Validate password strength.

        Returns:
            Tuple[bool, str]: (is_valid, error_message)
        """

        if not password:
            return False, "Password ne peut pas être vide"

        # Check length
        if len(password) < PasswordValidator.MIN_LENGTH:
            return (
                False,
                f"❌ Password trop court (minimum {PasswordValidator.MIN_LENGTH} caractères)"
            )

        if len(password) > PasswordValidator.MAX_LENGTH:
            return (
                False,
                f"❌ Password trop long (maximum {PasswordValidator.MAX_LENGTH} caractères)"
            )

        # Check if password is in blocklist
        if password.lower() in PasswordValidator.BLOCKED_PASSWORDS:
            return False, "❌ Ce password est trop commun, choisissez un autre"

        # Check for uppercase
        if PasswordValidator.REQUIRE_UPPERCASE:
            if not re.search(r'[A-Z]', password):
                return (
                    False,
                    "❌ Password doit contenir au moins une MAJUSCULE (A-Z)"
                )

        # Check for lowercase
        if PasswordValidator.REQUIRE_LOWERCASE:
            if not re.search(r'[a-z]', password):
                return (
                    False,
                    "❌ Password doit contenir au moins une minuscule (a-z)"
                )

        # Check for numbers
        if PasswordValidator.REQUIRE_NUMBERS:
            if not re.search(r'\d', password):
                return (
                    False,
                    "❌ Password doit contenir au moins un chiffre (0-9)"
                )

        # Check for special characters
        if PasswordValidator.REQUIRE_SPECIAL:
            if not re.search(f"[{re.escape(PasswordValidator.SPECIAL_CHARS)}]", password):
                return (
                    False,
                    f"❌ Password doit contenir au moins 1 caractère spécial: {PasswordValidator.SPECIAL_CHARS}"
                )

        # Check for spaces
        if ' ' in password:
            return False, "❌ Password ne peut pas contenir d'espaces"

        # Check for repeating characters (no more than 3 consecutive)
        if re.search(r'(.)\1{3,}', password):
            return False, "❌ Password ne peut pas contenir 4+ caractères identiques consécutifs"

        return True, "✅ Password valide et sécurisé"

    @staticmethod
    def get_strength_score(password: str) -> int:
        """
        Calculate password strength score (0-100).

        Returns:
            int: Score from 0 to 100
        """
        score = 0

        if len(password) >= 12:
            score += 20
        if len(password) >= 16:
            score += 10
        if len(password) >= 20:
            score += 10

        if re.search(r'[a-z]', password):
            score += 10
        if re.search(r'[A-Z]', password):
            score += 10
        if re.search(r'\d', password):
            score += 10
        if re.search(f"[{re.escape(PasswordValidator.SPECIAL_CHARS)}]", password):
            score += 20

        # Bonus for mixed character types
        types = sum([
            bool(re.search(r'[a-z]', password)),
            bool(re.search(r'[A-Z]', password)),
            bool(re.search(r'\d', password)),
            bool(re.search(f"[{re.escape(PasswordValidator.SPECIAL_CHARS)}]", password)),
        ])
        if types >= 3:
            score += 10

        return min(score, 100)

    @staticmethod
    def get_strength_label(score: int) -> str:
        """Get human-readable strength label."""
        if score < 30:
            return "Très faible 🔴"
        elif score < 50:
            return "Faible 🟠"
        elif score < 70:
            return "Moyen 🟡"
        elif score < 90:
            return "Fort 🟢"
        else:
            return "Très fort 🔒"

    @staticmethod
    def validate_with_score(password: str) -> dict:
        """
        Validate password and return detailed info.

        Returns:
            dict: {
                'is_valid': bool,
                'message': str,
                'score': int,
                'strength': str,
                'requirements': {
                    'min_length': bool,
                    'uppercase': bool,
                    'lowercase': bool,
                    'numbers': bool,
                    'special': bool,
                    'no_spaces': bool,
                    'no_repeats': bool,
                }
            }
        """
        is_valid, message = PasswordValidator.validate(password)
        score = PasswordValidator.get_strength_score(password)

        return {
            'is_valid': is_valid,
            'message': message,
            'score': score,
            'strength': PasswordValidator.get_strength_label(score),
            'requirements': {
                'min_length': len(password) >= PasswordValidator.MIN_LENGTH,
                'uppercase': bool(re.search(r'[A-Z]', password)),
                'lowercase': bool(re.search(r'[a-z]', password)),
                'numbers': bool(re.search(r'\d', password)),
                'special': bool(re.search(f"[{re.escape(PasswordValidator.SPECIAL_CHARS)}]", password)),
                'no_spaces': ' ' not in password,
                'no_repeats': not bool(re.search(r'(.)\1{3,}', password)),
            }
        }
