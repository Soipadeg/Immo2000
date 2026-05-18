# Backend Scripts

Cette répertoire contient tous les scripts d'initialisation, migration et seed pour le backend.

## Scripts de Migration (Alembic)

Ces scripts appliquent des changements au schéma de base de données :

- `migrate_email_verification.py` - Ajoute le système de vérification d'email
- `migrate_notifications.py` - Ajoute la table et le système de notifications
- `migrate_planification_visite.py` - Ajoute les tables pour la planification de visite
- `migrate_tunnel_annonce.py` - Ajoute le tunnel de création d'annonce
- `migrate_user_buyer_profile.py` - Ajoute le profil acheteur aux utilisateurs
- `simple_migrate.py` - Migration simple/générique

## Scripts de Seed (Données)

- `seed_database.py` - Remplit la base de données avec des données d'exemple (vendeurs, annonces, crénaux, etc.)
- `setup_test_user.py` - Crée un utilisateur de test pour le développement

## Scripts de Test

- `test_auth_quick.py` - Tests rapides d'authentification

---

## Utilisation

### Exécuter une migration Alembic
```bash
cd backend
python migrate_tunnel_annonce.py
```

### Seed la base de données
```bash
cd backend
python seed_database.py
```

### Créer un utilisateur de test
```bash
cd backend
python setup_test_user.py
```

---

## Bonnes Pratiques

1. **Avant de modifier** : Assurez-vous que la base de données est en bon état
2. **Versionner** : Les migrations doivent être versionnées dans Git
3. **Tester** : Testez les migrations sur une copie locale avant production
4. **Documentation** : Documentez les changements dans les fichiers de migration

---

## Notes de Sécurité

⚠️ **Ces scripts ne doivent JAMAIS être exécutés en production sans supervision**

- Vérifiez les connexions BD avant d'exécuter
- Sauvegardez la base de données avant les migrations
- Testez les scripts sur une DB de dev d'abord
