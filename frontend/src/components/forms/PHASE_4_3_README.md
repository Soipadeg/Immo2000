# React Hook Form - Phase 4.3

## 📚 Guide d'Utilisation

Cette phase ajoute validation côté client avec **React Hook Form** et **Zod**.

### Avantages

```
Avant (Validation manuelle):
- 200+ lignes de code par formulaire
- Validation incohérente
- Difficilement testable
- UX médiocre

Après (React Hook Form):
- 50 lignes de code par formulaire
- Validation centralisée et réutilisable
- Facile à tester
- UX optimale (validation en temps réel)
```

### Installation

```bash
npm install react-hook-form zod @hookform/resolvers
```

### Structure

```
frontend/src/components/forms/
├── schemas.js         ← Schémas Zod (validation)
├── FormField.jsx      ← Composants réutilisables
├── LoginForm.jsx      ← Formulaire de connexion
├── RegisterForm.jsx   ← Formulaire d'inscription
├── ListingForm.jsx    ← Formulaire d'annonce
├── index.js           ← Exports
└── PHASE_4_3_README.md ← Ce fichier
```

### Utilisation Basique

#### 1. Définir le schéma de validation

```javascript
import { z } from 'zod';

const mySchema = z.object({
  email: z
    .string()
    .email('Email invalide'),
  password: z
    .string()
    .min(8, 'Minimum 8 caractères'),
});

const defaultValues = {
  email: '',
  password: '',
};
```

#### 2. Utiliser dans un composant

```javascript
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { FormField, FormContainer } from '../forms';

function MyForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mySchema),
    defaultValues,
    mode: 'onBlur', // Valide au blur
  });

  const onSubmit = async (data) => {
    console.log('Form data:', data); // Données validées!
  };

  return (
    <FormContainer
      onSubmit={onSubmit}
      handleSubmit={handleSubmit}
      submitLabel="Envoyer"
    >
      <FormField
        control={control}
        name="email"
        label="Email"
        type="email"
        error={errors.email}
        required
      />
      <FormField
        control={control}
        name="password"
        label="Password"
        type="password"
        error={errors.password}
        required
      />
    </FormContainer>
  );
}
```

### Schémas Disponibles

#### loginSchema
```javascript
import { loginSchema, loginDefaultValues } from '../forms';

// Valide:
// - email: email valid obligatoire
// - password: min 6 caractères
// - rememberMe: booléen optionnel
```

#### registerSchema
```javascript
import { registerSchema, registerDefaultValues } from '../forms';

// Valide:
// - email, nom, prenom: obligatoires
// - password: min 8 char, 1 majuscule, 1 minuscule, 1 chiffre
// - confirmPassword: doit correspondre au password
// - acceptTerms: doit être true
```

#### listingSchema
```javascript
import { listingSchema, listingDefaultValues } from '../forms';

// Valide:
// - titre: 5-100 caractères
// - description: 20-5000 caractères
// - type_bien: maison|appartement|terrain|local
// - surface, prix: nombres positifs obligatoires
// - nbr_chambres, nbr_salles_bain: optionnels
// - adresse, ville, code_postal: obligatoires
```

#### searchSchema
```javascript
import { searchSchema, searchDefaultValues } from '../forms';

// Valide:
// - query: texte optionnel
// - type_bien, prix_min, prix_max, etc: optionnels
// - prix_min <= prix_max (si tous deux présents)
```

### Composants Réutilisables

#### FormField
Champ texte/email/password/number

```javascript
<FormField
  control={control}
  name="email"
  label="Email"
  type="email"
  placeholder="user@example.com"
  error={errors.email}
  required
/>
```

#### FormSelect
Champ select/dropdown

```javascript
<FormSelect
  control={control}
  name="type_bien"
  label="Type de bien"
  options={[
    { label: 'Maison', value: 'maison' },
    { label: 'Appartement', value: 'appartement' },
  ]}
  error={errors.type_bien}
  required
/>
```

#### FormCheckbox
Checkbox simple

```javascript
<FormCheckbox
  control={control}
  name="acceptTerms"
  label="J'accepte les conditions"
  error={errors.acceptTerms}
/>
```

#### FormContainer
Conteneur pour le formulaire (form, button)

```javascript
<FormContainer
  onSubmit={onSubmit}
  handleSubmit={handleSubmit}
  isLoading={isLoading}
  submitLabel="Envoyer"
>
  {/* Champs du formulaire */}
</FormContainer>
```

### Formulaires Prêts à l'Emploi

#### LoginForm
```javascript
import { LoginForm } from '../forms';

function LoginPage() {
  return <LoginForm />;
}
```

#### RegisterForm
```javascript
import { RegisterForm } from '../forms';

function RegisterPage() {
  return <RegisterForm />;
}
```

#### ListingForm
```javascript
import { ListingForm } from '../forms';

function CreateListingPage() {
  const handleSuccess = (listing) => {
    console.log('Listing created:', listing);
    navigate(`/listings/${listing.id}`);
  };

  return (
    <ListingForm
      existingListing={null}  // null = créer, objet = modifier
      onSuccess={handleSuccess}
    />
  );
}

// Modifier une annonce existante
function EditListingPage({ listingId }) {
  const listing = {...}; // Fetch depuis API

  return (
    <ListingForm
      existingListing={listing}
      onSuccess={handleSuccess}
    />
  );
}
```

### Validation Custom

#### Ajouter une validation personnalisée

```javascript
const customSchema = z.object({
  age: z
    .number()
    .min(18, 'Doit être majeur')
    .refine(
      (age) => age <= 120,
      { message: 'Age invalide' }
    ),
}).refine(
  (data) => data.password === data.confirmPassword,
  {
    message: 'Les mots de passe ne correspondent pas',
    path: ['confirmPassword'], // Le champ qui aura l'erreur
  }
);
```

#### Validation asynchrone (vérifier l'email existe)

```javascript
const registerSchema = z.object({
  email: z
    .string()
    .email()
    .refine(
      async (email) => {
        // Appeler l'API pour vérifier
        const response = await checkEmailExists(email);
        return !response.exists;
      },
      { message: 'Email déjà utilisé' }
    ),
});
```

### Modes de Validation

```javascript
useForm({
  mode: 'onBlur',      // ✅ Valide au blur (par défaut)
  // mode: 'onChange',  // Valide à chaque caractère (lent)
  // mode: 'onSubmit',  // Valide au submit seulement
  // mode: 'onTouched', // Valide si touché + blur
});
```

### Intégration avec Zustand + API

```javascript
import { useNotificationStore } from '../../store';
import { authApi } from '../../services/api';

function LoginForm() {
  const { showError, showSuccess } = useNotificationStore();

  const onSubmit = async (data) => {
    try {
      const { data: response } = await authApi.login(data.email, data.password);
      showSuccess('Connecté!');
    } catch (error) {
      showError(error.response?.data?.message || 'Erreur');
    }
  };
}
```

### Gestion des Erreurs

```javascript
function MyForm() {
  const {
    control,
    handleSubmit,
    formState: { errors },
  } = useForm({
    resolver: zodResolver(mySchema),
  });

  return (
    <>
      <FormField
        control={control}
        name="email"
        label="Email"
        error={errors.email}  // Affiche l'erreur automatiquement
      />

      {/* Afficher les erreurs manuellement */}
      {errors.email && (
        <span style={{ color: 'red' }}>
          {errors.email.message}
        </span>
      )}
    </>
  );
}
```

### Testing

#### Tester un formulaire

```javascript
import { render, screen, userEvent } from '@testing-library/react';
import { LoginForm } from '../forms';

test('validates email', async () => {
  render(<LoginForm />);

  const emailInput = screen.getByLabelText('Email');

  await userEvent.type(emailInput, 'invalid');
  await userEvent.tab(); // Trigger onBlur validation

  expect(screen.getByText('Email invalide')).toBeInTheDocument();
});

test('submits with valid data', async () => {
  render(<LoginForm />);

  await userEvent.type(screen.getByLabelText('Email'), 'test@test.com');
  await userEvent.type(screen.getByLabelText('Password'), 'Test1234');

  await userEvent.click(screen.getByRole('button', { name: /sign in/i }));

  // Vérifier l'appel API ou la navigation
});
```

### Best Practices

1. **Utiliser les schémas centralisés:**
   ```javascript
   ✅ import { loginSchema } from '../forms';
   ❌ const schema = z.object({ ... }); // Inline
   ```

2. **Valider au blur (meilleure UX):**
   ```javascript
   ✅ mode: 'onBlur'
   ❌ mode: 'onChange'
   ```

3. **Afficher les erreurs:**
   ```javascript
   ✅ error={errors.email}
   ❌ {errors.email && <ErrorMessage />}
   ```

4. **Utiliser les composants réutilisables:**
   ```javascript
   ✅ <FormField ... />
   ❌ <TextField ... /> (sans wrapper)
   ```

5. **Intégrer avec l'API et Zustand:**
   ```javascript
   ✅ try { await api.call(); showSuccess(); }
   ❌ throw new Error(); (sans gestion)
   ```

### Prochaines Étapes

**Phase 4.4:** Code Splitting
- Lazy load les routes
- Lazy load les composants lourds
- Optimiser le bundle size

Intégration:
- Remplacer LoginPage/RegisterPage avec LoginForm/RegisterForm
- Utiliser ListingForm pour créer/modifier annonces
- Créer SearchForm pour les filtres

### Ressources

- React Hook Form: https://react-hook-form.com/
- Zod Validation: https://zod.dev/
- @hookform/resolvers: https://github.com/react-hook-form/resolvers
