# 🎯 Phase 5.3 - Next Steps & Continuation Guide

## Current Status: ✅ Setup Complete, Ready for Execution

All testing infrastructure has been created. The next step is to execute the tests and measure coverage.

---

## 📋 Immediate Next Steps

### Step 1: Install Dependencies
```bash
cd frontend
npm install
```
**Duration**: 2-3 minutes
**Installs**:
- Vitest (unit testing)
- @testing-library/react (component testing)
- Cypress (E2E testing)
- jsdom (DOM simulation)

### Step 2: Run Unit Tests
```bash
npm test
```
**Expected Result**: 120+ unit tests run
**What to Look For**:
- All tests pass (green ✓)
- No import errors
- No mock errors
- Fast execution (<5 seconds)

### Step 3: Generate Coverage Report
```bash
npm run test:coverage
```
**Expected Result**: Coverage report generated
**Output**: `coverage/` directory with:
- `index.html` - Interactive coverage report
- `coverage.json` - Machine-readable data

**Check**: Open `coverage/index.html` to see:
- Lines coverage %
- Functions coverage %
- Branches coverage %
- Statements coverage %

### Step 4: Run E2E Tests
```bash
npm run e2e:run
```
**Expected Result**: 50+ E2E tests run
**Duration**: 5-10 minutes
**What to Look For**:
- Tests pass (green ✓)
- No DOM errors
- API mocks work correctly
- Screenshots on failures (if any)

### Step 5: Analyze Results
After tests pass, review:
1. Coverage metrics - target is 80%+
2. Failed tests - debug and fix
3. Coverage gaps - identify untested code

---

## 🐛 Common Issues & Solutions

### Issue 1: Import Errors in Tests
**Problem**: `Cannot find module 'src/pages/PaymentPage'`
**Solution**:
```javascript
// Instead of full import, mock the component
vi.mock('../../pages/PaymentPage', () => ({
  default: () => <div>Mock PaymentPage</div>
}));
```

### Issue 2: Stripe Mock Not Working
**Problem**: CardElement throws error about Stripe context
**Solution**:
- Check that `stripe-config.js` is properly mocked
- Verify `setup.js` initializes Stripe global
- Ensure Elements provider wraps CardElement in PaymentPage

### Issue 3: Cypress Can't Find Elements
**Problem**: `cy.getByTestId('element-id')` returns nothing
**Solution**:
- Add `data-testid` attributes to components if missing
- Use `cy.get('[data-testid="element-id"]')` directly
- Check element is in viewport with `cy.scrollIntoView()`

### Issue 4: API Calls Not Mocked
**Problem**: Tests make real API calls to localhost:5000
**Solution**:
- Start backend server: `python run_server.py`
- Or use Cypress intercept to mock responses:
```javascript
cy.intercept('GET', '/api/v1/transactions', {
  statusCode: 200,
  body: [{ transaction_id: '1', titre: 'Test' }]
});
```

### Issue 5: Tests Timeout
**Problem**: Tests exceed 10 second timeout
**Solution**:
- Increase timeout in cypress.config.js:
```javascript
defaultCommandTimeout: 15000, // 15 seconds
```
- Or in specific tests:
```javascript
cy.get('[data-testid="element"]', { timeout: 20000 });
```

---

## 📊 Coverage Improvement Plan

### Current Coverage Status
- **API Services**: ~25 tests → Expected 90%
- **Store/Hooks**: ~20 tests → Expected 85%
- **Validation**: ~40 tests → Expected 95%
- **Components**: ~15 tests → Expected 80%
- **Pages**: ~50 placeholders → Expected 60-70%
- **Overall**: ~120 unit tests → Target 80%+

### To Reach 80%+ Coverage

#### 1. Implement Page Component Tests (High Priority)
Files to test:
- `src/pages/PaymentPage.jsx` (3-step payment flow)
- `src/pages/SignCompromisPage.jsx` (4-step DocuSign flow)
- `src/pages/SignActePage.jsx` (4-step with warnings)
- `src/pages/SelectNotairePage.jsx` (notaire selection)
- `src/pages/ValidateFeesPage.jsx` (fee breakdown)

Example test to add:
```javascript
it('should display 3-step stepper', () => {
  render(
    <BrowserRouter>
      <PaymentPage />
    </BrowserRouter>
  );

  expect(screen.getByText('Étape 1')).toBeInTheDocument();
  expect(screen.getByText('Étape 2')).toBeInTheDocument();
  expect(screen.getByText('Étape 3')).toBeInTheDocument();
});
```

#### 2. Add Error Scenario Tests
Missing coverage:
- Payment errors (declined card, network error)
- DocuSign OAuth failures
- Signature declined scenarios
- API timeout handling
- Validation error messages

#### 3. Add Integration Tests
Test interactions between:
- Payment form + Stripe integration
- Notaire selection + Fee calculation
- Signature + State persistence
- Navigation between pages

---

## 🔍 Coverage Report Analysis

### After Running `npm run test:coverage`

**What to Check**:

1. **Overall Coverage**
```
Statements   : 82.5% ( 330/400 )
Branches     : 78.2% ( 290/370 )
Functions    : 85.1% ( 260/305 )
Lines        : 80.9% ( 320/395 )
```

2. **By File** (look for low coverage):
```
services/
  transactions.js   ✅ 92%
  payments.js       ✅ 88%
  docusign.js       ✅ 85%

hooks/
  store.test.js     ✅ 87%

pages/
  PaymentPage.jsx   ⚠️ 65%  ← Needs tests
  SignActePage.jsx  ⚠️ 60%  ← Needs tests
```

3. **Branches** (most common issue):
- If statements not fully tested (true and false paths)
- Try/catch blocks with missing error paths
- Conditional rendering with all conditions

### Adding Tests for Low Coverage Areas

Find uncovered lines in HTML report:
1. Open `coverage/index.html`
2. Click on file with low coverage
3. Red lines = uncovered code
4. Add tests to cover red lines

Example:
```javascript
// Original code with missing error path
const handleSubmit = async () => {
  try {
    const result = await api.submit();
    setSuccess(true);
  } catch (error) {
    // This catch is not tested!
    setError(error.message);
  }
};

// Add test for error path:
it('should handle submission error', async () => {
  vi.mocked(api.submit).mockRejectedValue(new Error('Failed'));
  // ... test error handling
});
```

---

## 🚀 Execution Timeline

### Day 1 (Now)
- [x] Create test infrastructure
- [ ] Install dependencies (2-3 min)
- [ ] Run unit tests (2-3 min)
- [ ] Run E2E tests (5-10 min)
- [ ] Review initial results (5 min)

### Day 2
- [ ] Fix any failing tests (30 min)
- [ ] Generate coverage report (2 min)
- [ ] Analyze coverage gaps (15 min)
- [ ] Add page component tests (1-2 hours)

### Day 3
- [ ] Add error scenario tests (1 hour)
- [ ] Add integration tests (1 hour)
- [ ] Re-run coverage (2 min)
- [ ] Verify 80%+ coverage (15 min)

### Day 4
- [ ] Performance optimization (30 min)
- [ ] Documentation update (30 min)
- [ ] Final review (15 min)

---

## 📚 Test Execution Commands Reference

### Quick Start
```bash
cd frontend
npm test                    # Run all unit tests once
npm test:coverage          # Run with coverage report
npm run e2e:run            # Run all E2E tests headless
```

### Development
```bash
npm test -- --watch                    # Watch mode
npm test -- --ui                       # UI dashboard
npm test -- src/__tests__/services    # Single directory
npm test -- --grep "payment"           # By test name
npm run e2e                            # Interactive mode
```

### CI/CD
```bash
npm run build                          # Build app
npm test                               # Run tests
npm test:coverage                      # Generate coverage
npm run e2e:ci                         # E2E in CI mode
```

---

## 🎯 Success Criteria

✅ All tests pass:
```
✓ Unit tests: 120+ passing
✓ E2E tests: 50+ passing
✓ No errors or warnings
```

✅ Coverage metrics achieved:
```
✓ Lines:       80%+
✓ Functions:   80%+
✓ Branches:    80%+
✓ Statements:  80%+
```

✅ All scenarios covered:
```
✓ Happy path (success)
✓ Error paths (failures)
✓ Edge cases (boundary)
✓ Integration (multi-step)
```

---

## 📝 Monitoring & Maintenance

### Before Each Commit
```bash
npm lint              # Check code style
npm test              # Run tests
npm test:coverage     # Check coverage
```

### Weekly
- Review coverage trends
- Add tests for new features
- Update documentation

### Monthly
- Performance benchmarking
- Dependency updates
- Security scanning

---

## 🔗 Related Documents

- `PHASE5_3_TESTING.md` - Detailed setup and configuration
- `PHASE5_3_COMPLETE.md` - Summary and quick start
- `frontend/vitest.config.js` - Vitest configuration
- `frontend/cypress.config.js` - Cypress configuration
- `frontend/package.json` - Test scripts

---

## ❓ FAQ

**Q: Why do I get "Cannot find module" in tests?**
A: Mock the import at the top of your test file with `vi.mock()`

**Q: How do I test async functions?**
A: Use `async/await` in tests and `waitFor()` for async state updates

**Q: Can I skip a test temporarily?**
A: Use `it.skip()` to skip, `it.only()` to run only one test

**Q: How do I debug E2E tests?**
A: Use `cy.pause()` in test, or run `npm run e2e` for interactive mode

**Q: What if tests are slow?**
A: Check mocks are working, reduce API calls, use `cy.intercept()`

---

## ✨ Quick Reference

### Test Patterns Used

**Unit Test Pattern**:
```javascript
describe('Feature', () => {
  beforeEach(() => { /* setup */ });
  it('should do X', () => {
    // Arrange, Act, Assert
  });
});
```

**E2E Test Pattern**:
```javascript
describe('User Flow', () => {
  beforeEach(() => { cy.login(); });
  it('should complete flow', () => {
    cy.visit('/page');
    cy.clickByTestId('button');
    cy.url().should('include', '/next-page');
  });
});
```

### Custom Cypress Commands
```javascript
cy.login(email, password)
cy.navigateToTransaction(id)
cy.selectNotaire(id)
cy.fillPaymentForm(name, email)
cy.fillStripeCard(cardNumber)
cy.validateFees()
cy.getByTestId(id)
cy.clickByTestId(id)
cy.typeByTestId(id, text)
```

---

**Status**: Ready for execution
**Next Action**: `cd frontend && npm install && npm test`
