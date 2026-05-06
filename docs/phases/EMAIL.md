# Email & Notifications (Phase A)

## 📋 Vue d'ensemble

Système complet d'envoi d'emails en production via SMTP réel, remplaçant les anciens mocks. Les acheteurs et vendeurs sont notifiés automatiquement de tous les événements importants.

---

## 🚀 Service d'Email

### Location
```
backend/src/services/email_service.py (250 lignes)
```

### Architecture
```python
class EmailService:
    @staticmethod
    def envoyer_email(destinataire: str, sujet: str, corps_html: str,
                      corps_texte: str = None) -> bool
        """Envoie un email réel via SMTP"""

    @staticmethod
    def generer_email_notification_visite(vendeur, acheteur, annonce, visite_id) -> str
        """Template: Nouvelle visite proposée"""

    @staticmethod
    def generer_email_modification_rdv(vendeur, acheteur, annonce, visite,
                                        est_modification: bool) -> str
        """Template: Modification ou annulation de visite"""

    @staticmethod
    def generer_email_feedback(visite, acheteur, annonce, est_rappel: bool) -> str
        """Template: Demande ou rappel de feedback"""
```

---

## 📧 Types d'emails

### 1. Notification création visite
```
À: Vendeur
Sujet: "Nouvelle visite proposée - [Titre Annonce]"

Contenu:
- Titre et adresse du bien
- Date/heure proposée
- Nom et email de l'acheteur
- Boutons: Accepter / Modifier
```

### 2. Modification de visite
```
À: Vendeur + Acheteur
Sujet: "Visite modifiée - [Titre Annonce]"

Contenu:
- Ancienne date/heure
- Nouvelle date/heure
- Lien pour confirmer
```

### 3. Annulation de visite
```
À: Vendeur + Acheteur
Sujet: "Visite annulée - [Titre Annonce]"

Contenu:
- Raison (optionnel)
- Contact vendeur
```

### 4. Rappel feedback (Phase B)
```
À: Acheteur
Sujet: "Avez-vous aimé ce bien?"

Contenu:
- Adresse du bien visité
- Invitation à donner avis
- Bouton: Partager mon avis
- Rappel automatique toutes les 24h
```

---

## ⚙️ Configuration SMTP

### Variables d'environnement (`.env`)
```env
# Gmail avec App Password
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=noreply@immo2000.fr
EMAIL_PASSWORD=16_character_app_password

# Alternative: SendGrid
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
EMAIL_USER=apikey
EMAIL_PASSWORD=SG.your_sendgrid_key

# Alternative: AWS SES
SMTP_HOST=email-smtp.eu-west-1.amazonaws.com
SMTP_PORT=587
EMAIL_USER=your_ses_username
EMAIL_PASSWORD=your_ses_password

# Frontend URL pour les liens
FRONTEND_URL=http://localhost:3000
```

### Setup Gmail
1. Accéder à: https://myaccount.google.com/apppasswords
2. Sélectionner: Mail + Windows (ou autre device)
3. Google génère un password 16 caractères
4. Copier le password dans `EMAIL_PASSWORD`

### Vérifier la configuration
```bash
cd backend
python3 test_email_integration.py
```

Expected output:
```
✅ Imports: PASS
✅ Config SMTP: PASS
✅ Templates: PASS
✅ Email: PASS (email envoyé avec succès)
✅ Database: PASS

🎉 Tous les tests sont passés!
```

---

## 📤 Flux d'envoi

### Création de visite (Phase A)
```
1. Acheteur créé visite
   POST /api/v1/visites
   ↓
2. Service crée visite en DB
   ↓
3. VisitesService.creer_visite() appelle:
   envoyer_notification_vendeur(annonce, acheteur, date_heure, visite_id)
   ↓
4. EmailService.envoyer_email() est appelé
   ↓
5. SMTP établit connexion à smtp.gmail.com:587
   ↓
6. Authentification avec EMAIL_USER + EMAIL_PASSWORD
   ↓
7. Email HTML envoyé au vendeur
   ↓
8. Log: "✅ Email notification envoyé à [vendeur_email]"
```

### Modification/Annulation
```
1. Acheteur modifie ou annule visite
   PUT/DELETE /api/v1/visites/{id}
   ↓
2. VisitesService.modifier_visite() appelle:
   EmailService.generer_email_modification_rdv(...)
   ↓
3. Emails envoyés à vendeur + acheteur
   ↓
4. Logs et confirmations
```

---

## 📝 Templates Email

### Caractéristiques
- ✅ HTML responsive (adapté mobile)
- ✅ Branding Immo2000 (#2E86C1 bleu)
- ✅ Inline CSS (pas de fichiers CSS séparés)
- ✅ Liens cliquables (modification, feedback, etc.)
- ✅ Fallback texte brut (clients email basiques)

### Exemple structure
```html
<html>
  <head>
    <style>
      body { font-family: Arial, sans-serif; background: #f5f5f5; }
      .container { max-width: 600px; background: white; padding: 20px; }
      .header { color: #2E86C1; font-size: 24px; }
      .button { background: #2E86C1; color: white; padding: 10px 20px; }
    </style>
  </head>
  <body>
    <div class="container">
      <h1 class="header">Immo2000</h1>
      <p>Bonjour [Prénom],</p>
      <p>[Contenu email]</p>
      <a class="button" href="[LIEN]">Cliquez ici</a>
    </div>
  </body>
</html>
```

---

## 🔐 Sécurité

### STARTTLS
- Port 587 requiert STARTTLS (TLS encryption)
- Sécurise la transmission avant authentification
- Certificat serveur vérifié

### Données sensibles
- ❌ Pas de password en logs
- ❌ Pas de tokens dans les templates
- ✅ EMAIL_PASSWORD en variable d'environnement

### Rate limiting
- À implémenter pour éviter abuse
- Limiter: 100 emails/minute/IP

---

## 🚨 Troubleshooting

| Erreur | Cause | Solution |
|--------|-------|----------|
| SMTP_HOST not configured | Variable .env manquante | Ajouter SMTP_HOST à .env |
| 535 Authentication failed | Email_user ou password incorrect | Régénérer app password Gmail |
| Connection timeout | Firewall bloque port 587 | Ouvrir port 587, ou utiliser port 465 |
| SSL cert error | Certificat invalide | Vérifier SMTP_HOST correct |
| Email pas reçu | Spam folder | Ajouter noreply@immo2000.fr à contacts |
| Rate limit error | Trop d'emails | Implémenter retry avec backoff |

### Debug logs
```python
# Dans email_service.py
import logging
logging.basicConfig(level=logging.DEBUG)

# Puis exécuter
python3 test_email_integration.py
```

---

## 💡 Cas d'usage

### 1. Test d'envoi manuel
```bash
cd backend
python3

from src.services.email_service import EmailService

EmailService.envoyer_email(
    destinataire="test@example.com",
    sujet="Test Immo2000",
    corps_html="<p>Ceci est un test</p>",
    corps_texte="Ceci est un test"
)
```

### 2. Vérifier configuration
```bash
python3 -c "
import os
from dotenv import load_dotenv
load_dotenv()
print(f'SMTP_HOST: {os.getenv(\"SMTP_HOST\")}')
print(f'SMTP_PORT: {os.getenv(\"SMTP_PORT\")}')
print(f'EMAIL_USER: {os.getenv(\"EMAIL_USER\")}')
print(f'EMAIL_PASSWORD: {\"*\" * 12}')  # Mask password
"
```

### 3. Tester création visite avec email
```bash
# 1. Créer compte vendeur
curl -X POST http://localhost:5000/auth/register \
  -H "Content-Type: application/json" \
  -d '{"email":"vendeur@test.com","password":"test123","role":"vendeur",...}'

# 2. Créer annonce
curl -X POST http://localhost:5000/api/v1/annonces \
  -H "Authorization: Bearer {VENDEUR_TOKEN}" \
  -d '{"titre":"Bel appart","prix":250000,...}'

# 3. Créer compte acheteur
curl -X POST http://localhost:5000/auth/register \
  -d '{"email":"acheteur@test.com","password":"test123","role":"acheteur",...}'

# 4. Créer visite (email déclenché)
curl -X POST http://localhost:5000/api/v1/visites \
  -H "Authorization: Bearer {ACHETEUR_TOKEN}" \
  -d '{"acheteur_id":2,"annonce_id":1,"date_heure":"2026-05-21T14:00:00"}'

# Vérifier: Email reçu dans vendeur@test.com
```

---

## 📊 Monitoring

### Métriques à tracker
- Nombre d'emails envoyés/jour
- Taux de livraison (delivery rate)
- Taux d'ouverture (open rate)
- Taux de bounce
- Latence moyenne d'envoi

### Logs à analyser
```bash
# Chercher erreurs SMTP
grep -i "smtp\|email" logs/*.log

# Créer alertes sur:
# - SMTP connection refused
# - Authentication failed
# - Rate limit exceeded
```

---

## 🚀 Améliorations futures

- [ ] Queue d'emails (asynchrone avec Celery)
- [ ] Tracking d'ouverture (pixel tracker)
- [ ] A/B testing sur templates
- [ ] Unsubscribe link (GDPR)
- [ ] Email preferences (vendeur peut desactiver)
- [ ] WhatsApp/SMS notifications
- [ ] Push notifications
- [ ] Email templates en fichiers HTML séparés

---

## 📌 Résumé Phase A

**Status**: ✅ COMPLETE
**Fichiers**:
- `backend/src/services/email_service.py` (250 lignes)
- Configuration `.env` (5 variables)
- Tests: `backend/test_email_integration.py`

**Ce qui est implémenté**:
- ✅ SMTP réel (pas de mocks)
- ✅ 4 types d'emails (notification, modification, annulation, rappel)
- ✅ HTML templates avec branding
- ✅ Gestion erreurs SMTP
- ✅ Configuration Gmail + SendGrid + AWS SES
- ✅ Tests d'intégration

**Ce qui manque** (pour production):
- [ ] Rate limiting
- [ ] Email queue (Celery)
- [ ] Bounce handling
- [ ] GDPR unsubscribe
- [ ] Dashboard de monitoring
