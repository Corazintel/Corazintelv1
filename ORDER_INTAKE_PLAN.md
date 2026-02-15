# Customer Order Intake System - Implementation Plan

## 🎯 System Overview

A comprehensive, customer-facing order intake wizard that feeds into your existing Orders Management system.

---

## 📦 Deliverables

### Frontend Files (To Be Created)
1. ✅ **`views/order-intake.ejs`** - Main multi-step form page
2. ⏳ **`views/order-confirmation.ejs`** - Success confirmation page
3. ⏳ **`public/css/order-intake.css`** - Complete styling
4. ⏳ **`public/js/order-intake.js`** - Wizard logic + validation

### Backend Files (To Be Created/Updated)
1. ⏳ **`src/routes/intake.js`** - New route handler
2. ⏳ **`src/services/uploadService.js`** - File upload handling
3. ⏳ Update **`server.js`** - Register routes

---

## 🎨 Features Included

### Multi-Step Wizard (4 Steps)
- **Step 1**: Service selection + basics
- **Step 2**: Customer information  
- **Step 3**: Service-specific conditional questions
- **Step 4**: Review + E-signature + Policies

### Service Categories with Conditional Questions
1. **Tech (Web/Software)**
   - Project type, URL, access, features, integrations, success criteria
   
2. **Documents**
   - Document type, purpose, audience, deadline, draft upload, format
   
3. **Credit Repair**
   - Goals, issues, bureaus, disputes, report upload, acknowledgements
   
4. **Computer Repair**
   - Device info, issue, error messages, photos, data importance
   
5. **Beauty – Wig**
   - Service type, wig specs, texture/length, color, sensitivities
   
6. **Beauty – Body Contouring**
   - Areas, sessions, contraindications, aftercare
   
7. **Beauty – Facials**
   - Skin type, concerns, allergies, ingredients, recent treatments

### Integration Features
- ✅ Stripe product catalog integration
- ✅ File upload with preview
- ✅ E-signature (typed + canvas)
- ✅ Policy acknowledgements (6 required checkboxes)
- ✅ Auto-tagging based on answers
- ✅ Structured summary generation
- ✅ Local draft saving

### UX Features
- ✅ Progress indicator
- ✅ Back/Next navigation
- ✅ Inline validation
- ✅ Error messages
- ✅ Mobile-first responsive
- ✅ Loading states
- ✅ Form draft persistence

---

## 📊 Order Model Mapping

### Form → Order Fields
```javascript
{
  customer: {
    name: customerName,
    email: customerEmail,
    phone: customerPhone
  },
  category: service (mapped to full name),
  subject: subject,
  description: generated summary + answers,
  priority: P0/P1/P2/P3,
  status: 'New',
  dueDate: dueDate,
  tags: auto-generated [],
  attachments: uploaded file URLs [],
  paymentStatus: 'Unpaid',
  amount: from Stripe product,
  stripe: {
    checkoutSessionId: if provided,
    paymentIntentId: if provided,
    productId: selected package
  },
  metadata: {
    source: 'intake-form',
    ipAddress: client IP,
    userAgent: browser info,
    signatureTimestamp: timestamp,
    signatureName: typed name,
    signatureData: canvas data URL
  },
  activityLog: [{
    at: timestamp,
    type: 'created',
    text: 'Order created via intake form'
  }]
}
```

### Auto-Tags Logic
- "rush" → if priority P0
- "priority" → if priority P1
- "waiting-on-client" → if missing required fields
- "appointment-request" → for beauty services
- "data-critical" → if computer repair mentions data
- "contraindications" → if beauty service flags issues
- Service-specific tags from answers

---

## 🔒 Security & Validation

### Server-Side Validation
- ✅ Sanitize all inputs
- ✅ Validate email format
- ✅ Validate phone format
- ✅ Check required fields
- ✅ Validate file types/sizes
- ✅ Rate limiting on submission

### File Upload Security
- ✅ Allowed extensions: .pdf, .doc, .docx, .jpg, .jpeg, .png, .zip
- ✅ Max file size: 10MB per file
- ✅ Max 5 files per order
- ✅ Virus scanning (if available)
- ✅ Unique filenames with UUID
- ✅ Store in secure directory

### E-Signature Capture
- ✅ Timestamp (ISO 8601)
- ✅ IP address
- ✅ User agent
- ✅ Typed name
- ✅ Canvas signature as base64
- ✅ All policy checkboxes state

---

## 🎨 Design System

### Colors
- Primary: #2563EB (blue)
- Success: #10B981 (green)
- Error: #EF4444 (red)
- Warning: #F59E0B (amber)
- Neutral: Grays

### Typography
- Font: Inter (Google Fonts)
- Headings: 600-700 weight
- Body: 400 weight
- Small: 300 weight

### Components
- Stepper/Progress indicator
- Form fields with validation states
- File upload with drag-drop
- Signature pad (canvas-based)
- Review summary cards
- Loading spinners
- Toast notifications

---

## 📱 Responsive Breakpoints

- Mobile: 375px - 767px
- Tablet: 768px - 1023px
- Desktop: 1024px+

### Mobile Optimizations
- Single column layout
- Larger touch targets (44px min)
- Simplified navigation
- Collapsible review sections
- Bottom-sticky nav buttons

---

## 🚀 API Endpoints

### Public Endpoints
```
GET  /order-intake          - Show intake form
POST /api/intake/submit     - Submit order
POST /api/intake/upload     - Upload files
```

### Response Structure
```javascript
// Success
{
  success: true,
  orderId: "ORD-1234567890",
  message: "Order created successfully",
  redirect: "/order-confirmation/ORD-123..."
}

// Error
{
  success: false,
  errors: {
    field: "error message"
  },
  message: "Validation failed"
}
```

---

## 📧 Confirmation Page Features

Shows:
- ✅ Order ID (prominently)
- ✅ Order summary
- ✅ Next steps
- ✅ Contact information
- ✅ Payment link (if not paid)
- ✅ Estimated timeline
- ✅ What happens next

---

## 🔄 Workflow

### Customer Journey
1. Visit `/order-intake`
2. Select service & package → Step 1
3. Enter contact info → Step 2
4. Answer service questions → Step 3
5. Review, sign, accept policies → Step 4
6. Submit → Create order in system
7. Redirect to `/order-confirmation/:orderId`
8. Receive confirmation email (future)

### Admin Receives
- New order in Orders Management
- All form data structured
- Uploaded files linked
- E-signature captured
- Tags auto-applied
- Ready for review

---

## 📝 Development Status

### Completed
- ✅ Main form HTML structure
- ✅ Multi-step wizard layout
- ✅ All form fields
- ✅ Signature section
- ✅ Policy checkboxes

### In Progress
- ⏳ CSS styling (next)
- ⏳ JavaScript wizard logic (next)
- ⏳ Service questions templates (next)
- ⏳ Backend API routes (next)
- ⏳ File upload handler (next)
- ⏳ Confirmation page (next)

### Estimated Time
- Total: ~2-3 hours for complete implementation
- Each component: 20-30 minutes

---

## 🧪 Testing Checklist

- [ ] Mobile (375px) displays correctly
- [ ] Tablet (768px) displays correctly
- [ ] Desktop (1024px+) displays correctly
- [ ] All service categories show correct questions
- [ ] File upload works
- [ ] Signature pad works
- [ ] Validation shows errors
- [ ] Navigation (back/next) works
- [ ] Form submission creates order
- [ ] Confirmation page displays
- [ ] Local draft saves/restores
- [ ] All required fields enforced
- [ ] Stripe integration (when connected)

---

## 📚 Files Roadmap

**Created:**
1. `views/order-intake.ejs` ✅

**Next to Create:**
2. `public/css/order-intake.css` (styling)
3. `public/js/order-intake.js` (logic)
4. `src/routes/intake.js` (backend)
5. `src/services/uploadService.js` (uploads)
6. `views/order-confirmation.ejs` (success page)
7. Update `server.js` (register routes)

---

**This comprehensive system will provide a professional, conversion-optimized order intake experience for your customers!** 🎉
