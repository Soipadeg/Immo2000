# 📋 Setup Instructions - Phase 5.2.5 React Hook Form Integration

## Status: ✅ COMPLETE

Phase 5.2.5 implements form validation using React Hook Form and Zod with custom hooks and reusable components.

## 1. What Was Implemented

### Created Files

1. **`frontend/src/schemas/validationSchemas.js`** - Zod validation schemas (8 schemas)
2. **`frontend/src/hooks/useValidatedForm.js`** - Custom hooks for React Hook Form
3. **`frontend/src/components/FormComponents.jsx`** - Reusable form components
4. **Documentation** - Setup and usage guide

### Validation Schemas

```javascript
// 8 Zod schemas for different forms:
selectNotaireSchema          // Select notaire
validateFeesSchema           // Confirm fees
signCompromisSchema          // Sign compromise agreement
signActeSchema               // Sign final deed
paymentDepositSchema         // Payment deposit form
paymentBalanceSchema         // Payment balance form
contactFormSchema            // Contact form
searchSchema                 // Search/filter form
```

### Custom Hooks

1. **`useValidatedForm(schema, defaultValues, onSubmit)`** - Complete form hook
2. **`useFieldError(errors, fieldName)`** - Manage field errors
3. **`useFormSubmit()`** - Handle async form submission

### Form Components

1. **`FormTextField`** - Text input with validation
2. **`FormCheckbox`** - Checkbox with validation
3. **`FormNumberField`** - Number input with validation
4. **`FormSection`** - Organize form fields by section

## 2. Dependencies

All packages already in `package.json`:
- `react-hook-form` ^7.76.0
- `@hookform/resolvers` ^5.2.2
- `zod` ^4.4.3

Install if needed:
```bash
cd frontend
npm install
```

## 3. How to Use React Hook Form

### Basic Example: Select Notaire

```javascript
import { useForm, Controller } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { selectNotaireSchema } from '../schemas/validationSchemas';
import { FormTextField } from '../components/FormComponents';

export default function SelectNotairePage() {
  const {
    control,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm({
    resolver: zodResolver(selectNotaireSchema),
    defaultValues: { notaire_id: null },
  });

  const onSubmit = async (data) => {
    await transactionsApi.selectNotaire(transactionId, data.notaire_id);
    navigate(`/transactions/${transactionId}/validate-fees`);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <FormTextField
        control={control}
        name="notaire_id"
        label="Sélectionner un notaire"
        type="number"
        error={errors.notaire_id}
        required
      />
      <Button
        type="submit"
        variant="contained"
        disabled={isSubmitting}
        fullWidth
      >
        {isSubmitting ? <CircularProgress size={24} /> : 'Continuer'}
      </Button>
    </form>
  );
}
```

### Using Custom Hook

Simpler way using the `useValidatedForm` hook:

```javascript
import { useValidatedForm } from '../hooks/useValidatedForm';
import { selectNotaireSchema } from '../schemas/validationSchemas';
import { FormTextField } from '../components/FormComponents';

export default function SelectNotairePage() {
  const {
    control,
    handleSubmit,
    errors,
    isSubmitting,
  } = useValidatedForm(
    selectNotaireSchema,
    { notaire_id: null },
    async (data) => {
      await transactionsApi.selectNotaire(transactionId, data.notaire_id);
      navigate(`/transactions/${transactionId}/validate-fees`);
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <FormTextField
        control={control}
        name="notaire_id"
        label="Sélectionner un notaire"
        type="number"
        error={errors.notaire_id}
        required
      />
      <Button type="submit" disabled={isSubmitting} fullWidth>
        Continuer
      </Button>
    </form>
  );
}
```

## 4. Form Components

### FormTextField

Text input with validation:

```javascript
<FormTextField
  control={control}
  name="email"
  label="Email"
  type="email"
  error={errors.email}
  placeholder="exemple@email.com"
  required
/>
```

### FormCheckbox

Checkbox with validation:

```javascript
<FormCheckbox
  control={control}
  name="agree_terms"
  label="J'accepte les conditions"
  error={errors.agree_terms}
  required
/>
```

### FormNumberField

Number input with validation:

```javascript
<FormNumberField
  control={control}
  name="price"
  label="Prix"
  min={0}
  max={10000000}
  step={1000}
  error={errors.price}
  required
/>
```

### FormSection

Group related fields:

```javascript
<FormSection title="Informations de Paiement">
  <FormTextField
    control={control}
    name="card_name"
    label="Nom sur la carte"
    error={errors.card_name}
    required
  />
  <FormTextField
    control={control}
    name="card_email"
    label="Email"
    type="email"
    error={errors.card_email}
    required
  />
</FormSection>
```

## 5. Validation Schemas

### Create Custom Schema

```javascript
// In validationSchemas.js
import { z } from 'zod';

export const myFormSchema = z.object({
  name: z.string({
    required_error: 'Le nom est requis',
  }).min(2, 'Minimum 2 caractères'),

  email: z.string()
    .email('Email invalide'),

  agree: z.boolean()
    .refine((val) => val === true, {
      message: 'Vous devez accepter',
    }),
});
```

### Reusable Validation Rules

```javascript
// Create helper functions
const stringField = (label) =>
  z.string({ required_error: `${label} est requis` })
    .min(2, `${label}: minimum 2 caractères`);

const emailField = () =>
  z.string().email('Email invalide');

const numberField = (min = 0) =>
  z.number().min(min, `Minimum ${min}`);

// Use in schemas
export const mySchema = z.object({
  name: stringField('Nom'),
  email: emailField(),
  age: numberField(18),
});
```

## 6. Error Handling

### Display Errors

Errors appear automatically with `FormTextField`:

```javascript
<FormTextField
  control={control}
  name="email"
  label="Email"
  error={errors.email}  // Shows error message below input
/>
```

### Manual Error Handling

```javascript
const { handleSubmit, setError } = useForm();

const onSubmit = async (data) => {
  try {
    await api.submit(data);
  } catch (err) {
    setError('email', {
      type: 'manual',
      message: err.message,
    });
  }
};
```

### Show All Errors

```javascript
{Object.entries(errors).length > 0 && (
  <Alert severity="error">
    Veuillez corriger les erreurs ci-dessous:
    <ul>
      {Object.entries(errors).map(([key, error]) => (
        <li key={key}>{error.message}</li>
      ))}
    </ul>
  </Alert>
)}
```

## 7. Complete Payment Form Example

```javascript
import { useValidatedForm } from '../hooks/useValidatedForm';
import { paymentDepositSchema } from '../schemas/validationSchemas';
import { FormTextField, FormCheckbox } from '../components/FormComponents';

export default function PaymentForm() {
  const {
    control,
    handleSubmit,
    errors,
    isSubmitting,
  } = useValidatedForm(
    paymentDepositSchema,
    { card_name: '', card_email: '', agree_payment: false },
    async (data) => {
      const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
        payment_method_data: {
          billing_details: { name: data.card_name, email: data.card_email },
        },
      });
      await paymentsApi.confirm(paiement.id, { payment_intent_id: paymentIntent.id });
    }
  );

  return (
    <form onSubmit={handleSubmit}>
      <FormTextField
        control={control}
        name="card_name"
        label="Nom sur la carte"
        error={errors.card_name}
        required
      />
      <FormTextField
        control={control}
        name="card_email"
        label="Email"
        type="email"
        error={errors.card_email}
        required
      />
      <FormCheckbox
        control={control}
        name="agree_payment"
        label="J'accepte les conditions de paiement"
        error={errors.agree_payment}
        required
      />
      <Button type="submit" variant="contained" disabled={isSubmitting} fullWidth>
        {isSubmitting ? <CircularProgress size={24} /> : 'Payer'}
      </Button>
    </form>
  );
}
```

## 8. Integration with Stripe

The `paymentDepositSchema` works perfectly with Stripe:

```javascript
// Schema validates cardholder info
export const paymentDepositSchema = z.object({
  card_name: z.string().min(2, 'Nom requis'),
  card_email: z.string().email('Email invalide'),
  agree_payment: z.boolean(),
});

// Form captures data for Stripe
const onSubmit = async (formData) => {
  const { paymentMethod } = await stripe.createPaymentMethod({
    type: 'card',
    card: elements.getElement(CardElement),
    billing_details: {
      name: formData.card_name,
      email: formData.card_email,
    },
  });

  const { paymentIntent } = await stripe.confirmCardPayment(clientSecret, {
    payment_method: paymentMethod.id,
  });

  // Confirm with backend
  await paymentsApi.confirm(paiement.id, {
    payment_intent_id: paymentIntent.id,
    charge_id: paymentIntent.charges.data[0].id,
  });
};
```

## 9. Advanced: Conditional Validation

Some fields only required under certain conditions:

```javascript
export const advancedSchema = z.object({
  paymentMethod: z.enum(['card', 'bank_transfer']),
  cardNumber: z.string().optional(),
  bankCode: z.string().optional(),
}).refine(
  (data) => {
    if (data.paymentMethod === 'card') {
      return !!data.cardNumber;
    }
    if (data.paymentMethod === 'bank_transfer') {
      return !!data.bankCode;
    }
    return true;
  },
  {
    message: 'Fournir les détails appropriés',
    path: ['paymentMethod'],
  }
);
```

## 10. Checklist

- [ ] React Hook Form package installed (already in package.json)
- [ ] Zod package installed (already in package.json)
- [ ] validationSchemas.js created
- [ ] useValidatedForm hook created
- [ ] FormComponents created
- [ ] Documentation complete
- [ ] Example forms tested
- [ ] Integration with PaymentPage tested
- [ ] Integration with SignCompromisPage tested
- [ ] All error messages display correctly in French

## 11. Next Steps

- ✅ **5.2.1**: Stripe Elements intégré
- ✅ **5.2.2**: DocuSign OAuth intégré
- ✅ **5.2.4**: Zustand Store créé
- ✅ **5.2.5**: React Hook Form créé
- ⏳ **5.3**: Tests unitaires et E2E (Vitest + Cypress)

---

**Created**: 19 mai 2026 | **Phase**: 5.2.5 React Hook Form Validation
