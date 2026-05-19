# 📋 Setup Instructions - Phase 5.2.1 Stripe Integration

## 1. Installation des Packages

```bash
cd frontend
npm install
```

Les packages Stripe suivants ont été ajoutés à `package.json`:
- `@stripe/react-stripe-js` - React components pour Stripe.js
- `@stripe/stripe-js` - Stripe.js client library
- `@mui/lab` - Material-UI Lab pour Timeline et autres composants
- `notistack` - Notifications toast

## 2. Configuration des Variables d'Environnement

Créez un fichier `.env.local` dans le répertoire `frontend/`:

```env
# Stripe Configuration
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_51234567890abcdef...

# API Configuration
REACT_APP_API_URL=http://localhost:5000/api/v1
```

### Obtenir les Clés Stripe

1. Allez sur [https://dashboard.stripe.com](https://dashboard.stripe.com)
2. Connectez-vous ou créez un compte
3. Accédez à **Developers** → **API Keys**
4. Copiez la **Publishable Key** (commence par `pk_test_...`)
5. Collez-la dans `REACT_APP_STRIPE_PUBLIC_KEY`

### Clés de Test

Pour développement, utilisez les clés de test:
- **Publishable Key**: `pk_test_...`
- **Secret Key**: `sk_test_...` (ne pas partager!)

## 3. Configuration du Serveur (Backend)

Assurez-vous que le backend a la configuration Stripe:

### Variables d'Environnement Backend

```env
STRIPE_SECRET_KEY=sk_test_51234567890abcdef...
STRIPE_WEBHOOK_SECRET=whsec_1234567890abcdef...
STRIPE_PUBLISHABLE_KEY=pk_test_51234567890abcdef...
```

### Vérification Backend

Vérifiez que le endpoint `/api/v1/paiements` est configuré:

```python
# backend/src/routes/paiements.py
@paiements_bp.route('', methods=['POST'])
@token_required
def creer_paiement():
    """Créer un PaymentIntent Stripe"""
    # Utiliser StripeService pour créer l'intention de paiement
```

## 4. Structure des Fichiers Créés

```
frontend/src/
├── config/
│   └── stripe-config.js          [NOUVEAU] Configuration Stripe
├── components/
│   └── StripePaymentForm.jsx     [NOUVEAU] Composant formulaire Stripe
├── pages/
│   └── PaymentPage.jsx           [MODIFIÉ] Intégration Stripe complète
└── App.jsx                       [À MODIFIER] Ajouter StripeProvider
```

## 5. Tester l'Intégration

### Démarrer Frontend et Backend

```bash
# Terminal 1 - Frontend
cd frontend
npm run dev
# → http://localhost:5173

# Terminal 2 - Backend
cd backend
python run_server.py
# → http://localhost:5000
```

### Naviguer vers PaymentPage

```
http://localhost:5173/transactions/1/payment
```

### Cartes de Test Stripe

**Succès**:
```
Numéro: 4242 4242 4242 4242
Expiration: Any future date (12/25)
CVC: Any 3 digits (123)
```

**Échec**:
```
Numéro: 4000 0000 0000 0002
Expiration: Any future date
CVC: Any 3 digits
```

**Paiement Requis**:
```
Numéro: 4000 0000 0000 3220
(Pour tester les authentifications 3D Secure)
```

## 6. Configuration App.jsx

Vous devez encapsuler l'app avec StripeProvider pour que Stripe.js soit disponible globalement.

**À faire** dans `App.jsx`:

```javascript
import { Elements } from '@stripe/react-stripe-js';
import { stripePromise } from './config/stripe-config';

function App() {
  return (
    <Elements stripe={stripePromise}>
      <ThemeProvider theme={theme}>
        {/* Rest of the app */}
      </ThemeProvider>
    </Elements>
  );
}
```

Cependant, PaymentPage utilise déjà `Elements` localement, donc ce n'est pas strictement nécessaire.

## 7. Flux du Paiement

### Frontend (React)

1. **Créer PaymentIntent**: `paymentsApi.create()` envoie montant au backend
2. **Recevoir client_secret**: Backend retourne `client_secret` du PaymentIntent
3. **Afficher CardElement**: Utilisateur entre ses informations bancaires
4. **Confirmer Paiement**: `stripe.confirmCardPayment(clientSecret)` confirme le paiement
5. **Vérifier Statut**: Backend webhook reçoit `charge.succeeded` ou `charge.failed`
6. **Rediriger**: Frontend redirige vers la prochaine page

### Backend (Flask)

1. **POST /api/v1/paiements**: Créer PaymentIntent via Stripe API
2. **POST /api/v1/paiements/webhook/stripe**: Recevoir événement Stripe
3. **Vérifier Signature**: Vérifier que webhook vient de Stripe
4. **Mettre à Jour BDD**: Enregistrer statut du paiement
5. **Envoyer Email**: SendGrid envoie confirmation à l'utilisateur

## 8. Erreurs Courantes

### Error: "Stripe is not defined"

**Cause**: `REACT_APP_STRIPE_PUBLIC_KEY` non configurée

**Solution**:
```bash
# Ajouter dans .env.local
REACT_APP_STRIPE_PUBLIC_KEY=pk_test_...
```

### Error: "Cannot read property 'confirmCardPayment'"

**Cause**: Stripe.js n'est pas chargé

**Solution**: S'assurer que `stripePromise` retourne une Promise valide

### Paiement en attente

**Cause**: Backend n'a pas reçu le webhook Stripe

**Solution**: Vérifier les logs du webhook dans Stripe Dashboard

## 9. Configuration Webhook (Production)

Pour recevoir les événements Stripe en production:

1. Allez à **Developers** → **Webhooks** dans Stripe Dashboard
2. Cliquez **Add Endpoint**
3. Entrez l'URL du webhook: `https://votre-domain.com/api/v1/paiements/webhook/stripe`
4. Sélectionnez les événements: `charge.succeeded`, `charge.failed`, `payment_intent.succeeded`
5. Copiez le **Signing Secret** et ajoutez à `.env`:
   ```env
   STRIPE_WEBHOOK_SECRET=whsec_...
   ```

## 10. Checklist de Validation

- [ ] Package.json mise à jour avec dépendances Stripe
- [ ] `.env.local` configuré avec `REACT_APP_STRIPE_PUBLIC_KEY`
- [ ] Backend `.env` configuré avec `STRIPE_SECRET_KEY`
- [ ] PaymentPage.jsx remplacé avec version Stripe Elements
- [ ] StripePaymentForm.jsx créé
- [ ] stripe-config.js créé
- [ ] Frontend démarre sans erreurs: `npm run dev`
- [ ] Backend démarre sans erreurs: `python run_server.py`
- [ ] Navigation vers `/transactions/1/payment` fonctionne
- [ ] Formulaire Stripe affiche CardElement
- [ ] Test de paiement avec carte 4242...4242 réussit

## 11. Prochaines Étapes

- ✅ **5.2.1**: Stripe Elements intégré
- ⏳ **5.2.2**: DocuSign OAuth dans SignCompromisPage
- ⏳ **5.2.3**: DocuSign OAuth dans SignActePage
- ⏳ **5.2.4**: Zustand Store création
- ⏳ **5.2.5**: React Hook Form validation

---

**Créé**: 19 mai 2026 | **Phase**: 5.2.1 Stripe Integration
