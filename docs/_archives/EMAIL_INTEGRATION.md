# Intégration Email - Documentation Technique

## 📋 Vue d'ensemble

Le système Immo2000 utilise **smtplib** (module Python natif) pour envoyer des emails HTML en production via SMTP.

### Flux d'emails implémentés:
1. ✅ **Notification au vendeur** - Nouvelle visite (lors de création annonce)
2. ✅ **Modification RDV** - Emails à vendeur + acheteur
3. ✅ **Annulation RDV** - Emails à vendeur + acheteur
4. ✅ **Feedback reminder** - Email acheteur 24h après visite (à implémenter avec APScheduler)

---

## 🏗️ Architecture

### Service d'Email (`backend/src/services/email_service.py`)

```python
class EmailService:
    @staticmethod
    def envoyer_email(destinataire: str, sujet: str, corps_html: str, corps_texte: str = None) -> bool

    @staticmethod
    def generer_email_modification_rdv(vendeur, acheteur, annonce, visite, est_modification: bool) -> str

    @staticmethod
    def generer_email_feedback(visite, acheteur, annonce, est_rappel: bool) -> str
```

### Variables d'environnement (`.env`)

```env
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
EMAIL_USER=noreply@immo2000.fr
EMAIL_PASSWORD=your_app_password_here
FRONTEND_URL=http://localhost:3000
```

---

## 🔧 Configuration SMTP

### Pour Gmail (test/développement):
1. Activer **2FA** sur votre compte Google
2. Générer un **App Password** (pas votre mot de passe principal!)
   - Aller à: https://myaccount.google.com/apppasswords
   - Sélectionner "Mail" + "Windows Computer"
   - Copier le mot de passe généré
3. Ajouter à `.env`:
   ```env
   SMTP_HOST=smtp.gmail.com
   SMTP_PORT=587
   EMAIL_USER=votre_email@gmail.com
   EMAIL_PASSWORD=your_16_char_app_password
   ```

### Pour un serveur SMTP personnalisé:
```env
SMTP_HOST=smtp.votre-domaine.fr
SMTP_PORT=587
EMAIL_USER=noreply@votre-domaine.fr
EMAIL_PASSWORD=votre_mot_de_passe_smtp
```

### Pour Amazon SES:
```env
SMTP_HOST=email-smtp.region.amazonaws.com
SMTP_PORT=587
EMAIL_USER=your_ses_username
EMAIL_PASSWORD=your_ses_password
```

---

## 📧 Détails des emails

### 1. Notification Vendeur - Nouvelle Visite

**Quand**: Lors de la création d'une visite par un acheteur

**Destinataire**: Email du vendeur

**Contenu**:
- Date/heure proposée
- Infos acheteur (nom, prenom)
- Liens pour ajouter au calendrier (ICS + Google Calendar)
- Lien vers dashboard pour confirmer/refuser

**Template**: HTML avec style inline CSS, logo bleu (#2E86C1)

```python
EmailService.envoyer_email(
    destinataire=vendeur.email,
    sujet=f"Nouvelle visite pour votre annonce #{annonce.annonce_id}",
    corps_html=html_notification
)
```

### 2. Modification RDV

**Quand**: Lors d'un PUT /api/v1/visites/{id} avec date_heure modifiée

**Destinataires**: Vendeur + Acheteur

**Contenu**:
- Nouvelle date/heure
- Raison du changement (si fournie par API)
- Lien vers annonce
- Lien pour modifier à nouveau

```python
html = EmailService.generer_email_modification_rdv(
    vendeur=vendeur,
    acheteur=acheteur,
    annonce=annonce,
    visite=visite,
    est_modification=True  # True = modification, False = annulation
)
```

### 3. Annulation RDV

**Quand**: PUT /api/v1/visites/{id} avec statut="annulee"

**Destinataires**: Vendeur + Acheteur

**Contenu**:
- Notification d'annulation
- Lien pour reprendre rendez-vous
- Raison de l'annulation (si fournie)

```python
html = EmailService.generer_email_modification_rdv(
    vendeur=vendeur,
    acheteur=acheteur,
    annonce=annonce,
    visite=visite,
    est_modification=False  # False = annulation
)
```

### 4. Rappel Feedback (À IMPLÉMENTER)

**Quand**: 24h après la date/heure de la visite (via APScheduler)

**Destinataire**: Acheteur

**Contenu**:
- Demande de laisser un avis
- Lien direct vers formulaire feedback
- Question: "Comment s'est déroulée la visite?"
- Notes 1-5 + champ texte commentaires

---

## 🚀 Intégration dans les routes

### Créer une visite (POST /api/v1/visites)

```python
# Dans routes/visites.py
@visites_bp.route("/api/v1/visites", methods=["POST"])
@token_required
def creer_visite(current_user):
    visite = VisitesService.creer_visite(...)
    # Email notification envoyé automatiquement dans le service
    return {"status": "success", "data": visite}
```

### Modifier une visite (PUT /api/v1/visites/{id})

```python
@visites_bp.route("/api/v1/visites/<int:visite_id>", methods=["PUT"])
@token_required
def modifier_visite(current_user, visite_id):
    result = VisitesService.modifier_visite(
        visite_id=visite_id,
        utilisateur_id=current_user["user_id"],
        date_heure_str=data.get("date_heure"),
        statut=data.get("statut")
    )
    # Emails envoyés automatiquement dans le service
    return {"status": "success", "data": result}
```

---

## ✅ Tests

### Mock du service email dans les tests:

```python
@pytest.fixture
def mock_email_service():
    with patch('src.services.visites.EmailService') as mock_service:
        mock_service.envoyer_email = MagicMock()
        mock_service.generer_email_modification_rdv = MagicMock(
            return_value="<html>Email</html>"
        )
        yield mock_service

def test_modifier_visite_envoie_emails(client, mock_email_service):
    # Test que envoyer_email est appelé
    response = client.put("/api/v1/visites/1", ...)

    # Vérifier que 2 emails ont été envoyés (vendeur + acheteur)
    assert mock_email_service.envoyer_email.call_count == 2

    # Vérifier le contenu du premier appel
    call_args = mock_email_service.envoyer_email.call_args_list[0]
    assert "vendeur@example.com" in call_args[1]["destinataire"]
    assert "Modification" in call_args[1]["sujet"]
```

---

## 🐛 Gestion des erreurs

### Classes d'exception:

```python
class EmailServiceError(Exception):
    """Exception levée lors d'erreur SMTP"""
    pass
```

### Erreurs gérées:

1. **Configuration manquante** → Log error, ne pas bloquer la requête
2. **SMTP timeout** → Retry avec exponentiel backoff
3. **Email invalide** → Log warning, continuer
4. **Connexion refusée** → Log error, notifier administrateur

### Logging:

```python
import logging
logger = logging.getLogger(__name__)

logger.info(f"✅ Email envoyé à {email}")
logger.error(f"❌ Erreur SMTP: {error}")
logger.warning(f"⚠️ Email invalide: {email}")
```

---

## 📱 Templates HTML

### Style utilisé:
- **Font**: Arial, sans-serif
- **Couleur principale**: #2E86C1 (bleu Immo2000)
- **Background**: #f4f4f4 (léger gris)
- **Padding**: 30px container, responsive max-width: 600px

### Structure:
```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="UTF-8">
    <style>/* CSS inline */</style>
</head>
<body>
    <div class="container">
        <h2>Titre 📧</h2>
        <p>Contenu personnalisé</p>
        <div class="details"><!-- Info structurées --></div>
        <a class="button">Lien d'action</a>
        <div class="footer">© 2026 Immo2000</div>
    </div>
</body>
</html>
```

---

## 🔍 Débogage

### Vérifier la configuration:

```bash
# Terminal
cd /home/djali/code/Soipadeg/Immo2000
python3 -c "
from src.services.email_service import EmailService
print('✅ EmailService importé avec succès')
"
```

### Tester l'envoi:

```bash
# Test script
cat > test_email.py << 'EOF'
from src.services.email_service import EmailService

try:
    EmailService.envoyer_email(
        destinataire="test@example.com",
        sujet="Test Immo2000",
        corps_html="<h1>Test</h1>"
    )
    print("✅ Email envoyé!")
except Exception as e:
    print(f"❌ Erreur: {e}")
EOF

python3 test_email.py
```

### Logs:

```bash
# Voir les logs du serveur Flask
tail -f /tmp/flask_debug.log

# Chercher les erreurs email
grep "EMAIL\|SMTP" /tmp/flask_debug.log
```

---

## 🚨 Limitations et TODOs

### ✅ Implémenté:
- [x] SMTP avec STARTTLS
- [x] HTML templates inline
- [x] Envoi email dans notifications vendeur
- [x] Envoi emails modification/annulation RDV
- [x] Logs et gestion d'erreurs

### ⏳ À implémenter:
- [ ] APScheduler pour rappel feedback 24h après
- [ ] Bounce handling (emails invalides)
- [ ] Rate limiting (max 100 emails/heure)
- [ ] Email templates dans fichiers séparés (.html)
- [ ] Dashboard vendeur pour voir réponses feedback
- [ ] Unsubscribe links (RGPD)

### ⚠️ Limitations connues:
- Pas de retry automatique après timeout
- Pas de queue d'emails (synchrone)
- Pas de tracking d'ouverture
- Pas de suivi de délivrabilité

---

## 📚 Références

- **smtplib docs**: https://docs.python.org/3/library/smtplib.html
- **email.mime**: https://docs.python.org/3/library/email.mime.html
- **Gmail App Passwords**: https://support.google.com/accounts/answer/185833
- **SMTP Ports**: 25 (SMTP), 587 (STARTTLS), 465 (SMTPS)
- **APScheduler**: https://apscheduler.readthedocs.io/ (pour implémentation future)

---

## 📞 Support

Pour tester les emails en développement :
1. Créer compte test Gmail
2. Générer app password
3. Configurer .env avec les credentials
4. Faire une réservation de visite = email reçu!

Pour la production:
1. Utiliser un service SMTP professionnel (SendGrid, AWS SES, etc.)
2. Configurer DKIM/SPF/DMARC sur le domaine
3. Monitorer les bounces et spam complaints
