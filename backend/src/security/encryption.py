"""
Utilitaires d'encryption pour données sensibles
"""

from cryptography.fernet import Fernet
import os
import json
from functools import wraps

class EncryptionManager:
    """Gestion de l'encryption/décryption des données sensibles"""

    def __init__(self):
        # Clé d'encryption depuis variable d'environnement
        # En production: générer avec Fernet.generate_key()
        key = os.getenv('ENCRYPTION_KEY')
        if not key:
            # Développement: utiliser une clé par défaut (À CHANGER EN PROD)
            key = Fernet.generate_key()
            print(f"[WARNING] Using generated encryption key, save for production: {key.decode()}")

        self.cipher = Fernet(key)

    def encrypt(self, data: str) -> str:
        """
        Encrypter une chaîne

        Args:
            data: Chaîne à encrypter

        Returns:
            Chaîne encryptée en base64
        """
        if not data:
            return None

        encrypted = self.cipher.encrypt(str(data).encode())
        return encrypted.decode()

    def decrypt(self, encrypted_data: str) -> str:
        """
        Décrypter une chaîne

        Args:
            encrypted_data: Chaîne encryptée

        Returns:
            Chaîne décryptée
        """
        if not encrypted_data:
            return None

        try:
            decrypted = self.cipher.decrypt(encrypted_data.encode())
            return decrypted.decode()
        except ValueError as e:
            print(f"Decryption error (validation): {str(e)}")
            return None
        except Exception as e:
            print(f"Decryption error: {str(e)}")
            return None

    def encrypt_dict(self, data: dict, keys_to_encrypt: list) -> dict:
        """
        Encrypter des clés spécifiques d'un dictionnaire

        Args:
            data: Dictionnaire source
            keys_to_encrypt: Liste des clés à encrypter

        Returns:
            Dictionnaire avec clés encryptées
        """
        result = data.copy()
        for key in keys_to_encrypt:
            if key in result and result[key]:
                result[key] = self.encrypt(str(result[key]))
        return result

    def decrypt_dict(self, data: dict, keys_to_decrypt: list) -> dict:
        """
        Décrypter des clés spécifiques d'un dictionnaire

        Args:
            data: Dictionnaire source
            keys_to_decrypt: Liste des clés à décrypter

        Returns:
            Dictionnaire avec clés décryptées
        """
        result = data.copy()
        for key in keys_to_decrypt:
            if key in result and result[key]:
                result[key] = self.decrypt(result[key])
        return result


# Instance globale
encryptor = EncryptionManager()


class EncryptedField:
    """Wrapper pour encrypter/décrypter automatiquement un champ SQLAlchemy"""

    def __init__(self, field_name: str):
        self.field_name = field_name

    def get_prepared_statement(self, value):
        """Préparer la valeur pour l'encryption"""
        if value is None:
            return None
        return encryptor.encrypt(str(value))

    def get_decrypted_value(self, value):
        """Décrypter la valeur"""
        if value is None:
            return None
        return encryptor.decrypt(value)


def encrypt_json_field(field_names: list):
    """
    Décorateur pour encrypter automatiquement certains champs JSON

    Usage:
        @encrypt_json_field(['conditions', 'raison'])
        def save_offer(offer_data):
            ...
    """
    def decorator(f):
        @wraps(f)
        def decorated_function(*args, **kwargs):
            # Encrypter avant d'exécuter la fonction
            if 'data' in kwargs:
                for field in field_names:
                    if field in kwargs['data'] and kwargs['data'][field]:
                        kwargs['data'][field] = encryptor.encrypt(str(kwargs['data'][field]))

            return f(*args, **kwargs)

        return decorated_function
    return decorator


# Fonctions utilitaires courantes
def encrypt_reason(reason: str) -> str:
    """Encrypter une raison (rejet/suppression)"""
    return encryptor.encrypt(reason) if reason else None


def decrypt_reason(encrypted_reason: str) -> str:
    """Décrypter une raison"""
    return encryptor.decrypt(encrypted_reason) if encrypted_reason else None


def encrypt_conditions(conditions: dict) -> str:
    """Encrypter un dictionnaire de conditions"""
    if not conditions:
        return None
    return encryptor.encrypt(json.dumps(conditions))


def decrypt_conditions(encrypted_conditions: str) -> dict:
    """Décrypter des conditions"""
    if not encrypted_conditions:
        return None
    try:
        decrypted = encryptor.decrypt(encrypted_conditions)
        return json.loads(decrypted)
    except json.JSONDecodeError as e:
        print(f"Decrypt conditions error (JSON): {str(e)}")
        return None
    except Exception as e:
        print(f"Decrypt conditions error: {str(e)}")
        return None
