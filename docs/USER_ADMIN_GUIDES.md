# User & Admin Guides - Immo2000 Notaire System

**Document Version**: 1.0
**Status**: ✅ Production Ready
**Last Updated**: Phase 4 Documentation

---

## Table of Contents

1. [Buyer Workflow Guide](#buyer-workflow-guide)
2. [Seller Workflow Guide](#seller-workflow-guide)
3. [Notaire Workflow Guide](#notaire-workflow-guide)
4. [Administrator Guide](#administrator-guide)
5. [FAQ & Troubleshooting](#faq--troubleshooting)

---

## Buyer Workflow Guide

### Overview
As a buyer, you'll navigate through the process from finding a property to finalizing the real estate transaction.

### Step 1: Browse Listings

**Location**: `http://localhost:3000/listings` or home page

1. Use the search bar to find properties
2. Filter by:
   - Location (city/postal code)
   - Price range
   - Number of rooms
   - Surface area

3. Click on a listing to view full details:
   - Photos and floor plan
   - Property description
   - Current asking price
   - Seller contact information

### Step 2: Make an Offer

**Location**: Property detail page → "Make Offer" button

1. Enter your proposed price
2. (Optional) Add a message to the seller
3. Review your offer:
   - Property details
   - Your price
   - Offer terms

4. Click "Submit Offer"

**What happens next**:
- Seller will receive notification
- Status changes to "EN_ATTENTE" (waiting)
- You'll receive updates on seller's response

### Step 3: Offer Negotiation (if needed)

**If seller counters**:
1. You'll receive notification
2. Review counter-offer
3. Options:
   - Accept (proceed to transaction)
   - Counter again (new offer)
   - Reject

**If seller accepts**:
- Congratulations! Transaction begins automatically ✅
- System creates transaction record
- You'll be prompted to select a notaire

### Step 4: Select a Notaire

**Location**: Dashboard → Transaction Details → "Select Notaire"

1. Click "Search Notaires"
2. Enter your property's postal code
3. System shows available notaires with:
   - Name and law firm
   - Distance from property
   - Current workload/availability
   - Contact information

4. Click "Select" next to your preferred notaire

**What to consider**:
- Proximity to property (not always required)
- Availability (% workload)
- Previous reviews (if available)

### Step 5: Review & Pay Fees

**Location**: Transaction Details → "Validate Fees"

You'll see the notarial fees breakdown:
```
Property Value:        €250,000.00
Notarial Commission:     €5,000.00 (2%)
TVA (20% on commission):  €1,000.00
─────────────────────────────────
Total Fees:              €6,000.00
```

These fees are **mandatory** and legally set.

### Step 6: Make Deposit Payment

**Location**: Transaction Details → "Payment"

1. You'll pay **15% of property price** as deposit
   - Example: €250,000 × 15% = €37,500

2. Payment process:
   - Click "Process Payment"
   - Enter card details via Stripe (secure)
   - Confirm payment
   - Receipt sent to your email

3. After deposit paid:
   - Status changes to "Payment Confirmed"
   - Notaire begins preparing documents
   - You'll receive email with next steps

**Important**: Deposit is held in escrow. You'll pay the remaining 85% at final signature.

### Step 7: Sign Compromis (Preliminary Agreement)

**Location**: Transaction Details → "Sign Compromis"

1. Review compromis document:
   - Download PDF to read
   - Contains all transaction terms
   - Your obligations and seller's obligations

2. Click "Sign with DocuSign"
3. You'll be redirected to DocuSign
4. Follow DocuSign signing process:
   - Review document
   - Click signature fields
   - Sign electronically
   - Return to Immo2000

**What is Compromis?**
- Binding agreement between buyer and seller
- Sets property conditions
- Specifies inspection period (usually 10 days)
- Defines payment schedule

### Step 8: Final Signature (Acte de Vente)

**Location**: Transaction Details → "Sign Acte"

1. After inspection period passes:
   - Notaire prepares final acte
   - You'll receive notification

2. Same signing process as Compromis:
   - Review final document
   - Sign via DocuSign
   - Complete transaction

3. After final signature:
   - **TRANSACTION COMPLETE** ✅
   - Property is now yours!
   - Remaining balance (85%) due
   - Keys transferred
   - Registration complete

### Key Dates to Remember

```
Offer Submission:      Day 0
├─ Seller responds:   Day 1-7
│
Offer Acceptance:     Day X
├─ Select notaire:    Day X+1
├─ Review fees:       Day X+2
├─ Pay deposit (15%): Day X+3
│
Sign Compromis:       Day X+5
├─ Inspection period: 10 days
│
All inspections OK:   Day X+16
├─ Sign Acte:        Day X+17
│
Transaction Complete: Day X+18
└─ Pay balance (85%): Automatically
```

---

## Seller Workflow Guide

### Overview
As a seller, your goal is to get the best deal for your property and complete the transaction smoothly.

### Step 1: Create Listing

**Location**: Dashboard → "List Property"

1. Click "Sell Your Property"
2. Fill in property details:
   - Address and location
   - Property type (house, apartment, etc.)
   - Number of rooms
   - Surface area (m²)
   - Construction year
   - Property condition

3. Set asking price
   - Research comparable properties
   - Consider market conditions
   - This is starting price (buyers may offer less)

4. Upload photos:
   - Minimum 5 photos
   - Clear, well-lit images
   - Show key features
   - Professional photos recommended

5. Write description:
   - Highlight features
   - Mention renovations
   - Note special amenities (garden, views, etc.)

6. Click "Publish Listing"
   - Status: "Active"
   - Visible to all buyers

### Step 2: Receive & Review Offers

**Location**: Dashboard → "My Listings" → Property → "Offers"

You'll receive notifications when buyers make offers.

For each offer, you see:
- Buyer's name
- Proposed price
- Offer date/time
- Buyer's message (if any)

**Decision time**: For each offer, choose:
- ✅ Accept
- ❌ Reject
- 🔄 Counter-offer

### Step 3: Counter-Offer (if needed)

**If price is too low**:
1. Click "Counter-Offer"
2. Enter your new asking price
3. Send back to buyer
4. Buyer will respond with:
   - Another counter
   - Acceptance
   - Rejection

**Negotiation tips**:
- Be realistic about market value
- Multiple offers? You can negotiate with each
- Remember buyer must be approved for mortgage

### Step 4: Accept Offer

**When ready to proceed**:
1. Click "Accept Offer"
2. Confirm acceptance
3. **Transaction automatically created** ✅

**What happens immediately**:
- Status changes to "ACCEPTEE"
- Buyer is notified
- Buyer selects notaire
- Buyer pays deposit
- Process begins

### Step 5: Monitor Transaction Progress

**Location**: Dashboard → "My Transactions"

You'll see real-time status:

```
Transaction Status Timeline:
├─ Offer Accepted          ✅ Done
├─ Notaire Selected        (Waiting for buyer)
├─ Fees Validated          (Automatic)
├─ Deposit Paid (15%)      (Waiting for buyer)
├─ Compromis Signed        (Waiting for both parties)
├─ Inspection Period       (10 days)
├─ Acte Prepared           (Notaire's work)
├─ Acte Signed             (Final signature)
└─ Transaction Complete    (You're done!)
```

### Step 6: Prepare for Final Signatures

**When both compromis signatures are done**:
1. You'll receive notification
2. Notaire begins final document preparation
3. After 10-day inspection period:
   - You'll be invited to sign final acte
   - Same DocuSign process as buyer

### Step 7: Finalization

**After final signatures**:
1. Transaction marked as "FINALISEE" ✅
2. Buyer receives keys
3. Property transfers to buyer
4. You receive balance of sale price
5. Payment made to your bank account

**Timeline**: Usually 5 business days after final signatures

### Important Seller Notes

- **You can't withdraw** once offer is accepted
- **Inspection period** is 10 days (buyer's right)
- If inspection fails, transaction can be cancelled
- You must cooperate with notaire (provide documents)
- All fees paid by buyer (not you)

---

## Notaire Workflow Guide

### Overview
As a notaire (notary professional), you manage the legal aspects of real estate transactions.

### Step 1: Dashboard Overview

**Location**: `http://localhost:3000/notaire/dashboard`

Your dashboard shows:
- **Pending Dossiers**: Transactions awaiting your work
- **Statistics**:
  - Total dossiers in progress
  - Compromis signed
  - Acte signed
- **Recent Activity**: Recent assignments and updates

### Step 2: Accept Transaction Assignment

**When buyer selects you**:
1. You receive notification
2. Check pending dossiers
3. Review transaction details:
   - Parties (buyer & seller)
   - Property address and price
   - Notarial fees due

4. Accept or request reassignment if:
   - Workload is too high
   - Conflict of interest
   - Specialization mismatch

### Step 3: Prepare Compromis Document

**Once assigned**:
1. Access transaction details
2. Download property documents:
   - Property deed (titre)
   - Survey/cadastral map
   - Inspection reports

3. Prepare compromis that includes:
   - Full property description
   - Price and payment schedule
   - Conditions precedent
   - Inspection terms (usually 10 days)

4. Upload draft to system
5. Request both parties to review

### Step 4: Obtain Signatures on Compromis

1. Submit document via DocuSign
2. Both buyer and seller will receive signing requests
3. Monitor signature status in transaction dashboard
4. Once both signed:
   - Status changes to "COMPROMIS_SIGNE"
   - Inspection period begins (10 days)
   - You can begin final acte preparation

### Step 5: Prepare Final Acte

**During inspection period**:
1. Gather additional documents:
   - Energy performance certificate
   - Building permits
   - Inspection reports
   - Tax documents

2. Prepare final acte that includes:
   - Confirmed property details
   - Final price and terms
   - Tax obligations
   - Registration details

3. Have both parties review
4. Prepare for signature

### Step 6: Obtain Final Signature (Acte)

1. Submit final acte via DocuSign
2. Both parties sign
3. Once complete:
   - Status changes to "ACTE_SIGNE"
   - Final payment arrangements confirmed
   - Registration begins

### Step 7: Complete & Register Transaction

**After final signature**:
1. Register acte with:
   - Land registry
   - Tax office
   - Local authorities

2. Prepare final report:
   - Confirm all signatures
   - Verify payments
   - Register transaction

3. Mark as "FINALISEE"
4. Send final documents to parties

**Timeline**: Usually 5-7 business days

### Notaire Dashboard Features

**Transaction Details Tab**:
- Full property information
- Current status
- All involved parties
- Timeline of actions

**Documents Tab**:
- Upload/download documents
- Version history
- Signature status
- Storage in cloud (S3)

**Payments Tab**:
- Deposit status (15%)
- Final payment (85%)
- Notarial fees
- Commission breakdown

**History Tab**:
- Complete timeline
- All actions taken
- Audit trail
- Compliance records

### Important Notaire Notes

- **Legally required** to review all documents
- **Responsible** for ensuring compliance
- **Cannot proceed** if documentation incomplete
- **Must verify** both parties' identities
- **Fees are set** by law (2% base + 20% TVA)

---

## Administrator Guide

### Overview
Administrators manage users, system settings, and monitor overall platform health.

### Step 1: User Management

**Location**: Admin Dashboard → Users

**View All Users**:
- Email, name, role
- Registration date
- Last login
- Account status

**Manage User**:
- View profile
- Change role (if needed)
- Deactivate account (if needed)
- View transaction history

**User Roles**:
- `UTILISATEUR` - Buyer/Seller
- `NOTAIRE` - Notary professional
- `ADMINISTRATEUR` - System admin

### Step 2: Notaire Management

**Location**: Admin Dashboard → Notaires

**Register New Notaire**:
1. Click "Add Notaire"
2. Enter notaire details:
   - User email (must be registered user)
   - Law firm name
   - RPPS number (professional ID)
   - Contact information
   - Specializations

3. System assigns them to transactions

**Review Notaire Profile**:
- Current workload
- Transaction history
- Performance metrics
- Client reviews (if available)

**Manage Availability**:
- Set max dossier capacity
- Mark unavailable periods
- Reassign workload if needed

### Step 3: Monitor Transactions

**Location**: Admin Dashboard → Transactions

**View All Transactions**:
- Status overview
- Parties involved
- Key dates and milestones
- Payment status

**Filter by**:
- Status (CREEE, EN_COURS, FINALISEE)
- Date range
- Value range
- Notaire assigned

**Troubleshoot Issues**:
- Stuck transactions
- Missing documents
- Payment failures
- Signature problems

### Step 4: Payment Management

**Location**: Admin Dashboard → Payments

**View Payments**:
- Transaction reference
- Amount (deposit & balance)
- Status
- Payment method
- Stripe ID

**Handle Payment Issues**:
- Investigate failed payments
- Process refunds (if needed)
- Generate payment reports
- Verify Stripe integration

### Step 5: System Settings

**Location**: Admin Dashboard → Settings

**Configure**:
- Email templates (notifications)
- Payment settings (Stripe keys)
- DocuSign integration settings
- AWS S3 bucket configuration
- Rate limiting rules

**Monitoring**:
- API usage statistics
- Error logs
- Performance metrics
- User activity

### Step 6: Reports & Analytics

**Location**: Admin Dashboard → Reports

**Available Reports**:
1. **Transaction Summary**:
   - Total transactions
   - Completion rate
   - Average transaction value
   - Timeline metrics

2. **Revenue Report**:
   - Total commissions
   - Payment status
   - Outstanding amounts
   - Refunds

3. **User Report**:
   - Total users by role
   - Activation rate
   - Monthly new users
   - User retention

4. **Notaire Performance**:
   - Dossiers completed
   - Avg completion time
   - Client satisfaction
   - Revenue per notaire

### Step 7: Backup & Maintenance

**Location**: Admin Dashboard → System

**Backup**:
- Daily automated backups
- Manual backup on demand
- Backup verification
- Restore procedures

**Maintenance**:
- Database optimization
- Log rotation
- Cache clearing
- System health check

---

## FAQ & Troubleshooting

### Buyer FAQs

#### Q: Can I withdraw my offer after submitting?
**A**: Once submitted, you can wait for seller's response. If rejected, you're free to make another offer on the same or different property.

#### Q: What if the seller doesn't respond to my offer?
**A**: Offers typically expire after 7 days. You'll be notified if seller rejects or counters.

#### Q: What happens during the 10-day inspection period?
**A**: You (or your inspector) can inspect the property. If issues found, you can renegotiate or withdraw.

#### Q: Can I cancel the transaction after paying the deposit?
**A**: After compromis is signed and inspection period passes, cancellation is difficult. Deposit would be forfeited.

#### Q: What if I need a loan?
**A**: You should arrange financing BEFORE making an offer. Notaire will verify you have the funds.

---

### Seller FAQs

#### Q: Can I sell to multiple buyers?
**A**: No. Once you accept an offer, that property is committed to that buyer.

#### Q: What if an inspection reveals problems?
**A**: Buyer can renegotiate price or withdraw. You're not obligated to fix issues (French law).

#### Q: When do I get my money?
**A**: Usually 5 business days after final signature. Notaire handles the transfer.

#### Q: What documents do I need to provide?
**A**: Deed, survey, permits, energy certificate, and tax documents. Notaire will request these.

---

### Notaire FAQs

#### Q: How are fees determined?
**A**: By law in France. 2% of property value + 20% TVA on the commission.

#### Q: What if parties don't sign?
**A**: Document the failure. Determine why and communicate with parties about resolution.

#### Q: Can I refuse a transaction?
**A**: Yes, if conflict of interest or workload is full. Request reassignment before starting.

---

### Technical Troubleshooting

#### Issue: "Can't log in"
**Solution**:
1. Verify email address is correct
2. Reset password via "Forgot Password"
3. Check browser cookies are enabled
4. Try different browser
5. Contact support if persists

#### Issue: "Payment failed"
**Solution**:
1. Check card has sufficient funds
2. Verify billing address matches bank
3. Try different payment method
4. Ensure 3D Secure is enabled
5. Contact your bank

#### Issue: "Document not uploading"
**Solution**:
1. Check file size (max 25MB)
2. Verify PDF format
3. Check browser storage space
4. Try different browser
5. Check internet connection

#### Issue: "Can't find pending dossier"
**Solution**:
1. Refresh page (Ctrl+F5)
2. Log out and log back in
3. Clear browser cache
4. Check if you're the assigned notaire
5. Verify you're in correct account

---

### Getting Help

**In-App Support**:
- Help icon (?) in bottom-right corner
- Live chat available 9am-5pm CET

**Email Support**:
- support@immo2000.fr
- Response time: 24 hours

**Documentation**:
- Complete guides at https://docs.immo2000.fr
- Video tutorials available
- FAQ section on website

---

**Guide Version**: 1.0
**Last Updated**: Phase 4 Documentation
**Status**: ✅ Ready for Production
