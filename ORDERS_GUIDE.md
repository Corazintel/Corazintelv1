# Orders Management System - User Guide

## 🎉 Overview

Your Corazintel admin panel now includes a comprehensive **Orders Management System** for tracking and managing customer orders across all your business categories (Beauty, Credit Services, Web Development, Graphic Design, and Document Creation).

## 🚀 Quick Start

### Accessing the Orders Page

1. **Login to Admin**: Navigate to `/admin/login`
   - Username: `Admin`
   - Password: `1125`

2. **Access Orders**: From the admin dashboard, click **"📦 Orders Management"** in the sidebar

3. **Create Test Data** (for testing only):
   - Open browser console (F12)
   - Run: `seedTestData(20)`
   - This creates 20 sample orders

## 📋 Features

### 1. **Orders List View**
- **Visual Organization**: Orders are displayed as cards with:
  - **Category badges** (color-coded)
  - **Priority indicators** (P0, P1, P2, P3)
  - **Status badges** (New, In Progress, Waiting on Client, Completed, Cancelled)
  - **Left border** thickness indicates priority (thicker = higher priority)
  - **Payment status** with color coding
  - **Customer info**, subject, due date, and last activity

### 2. **Search & Filters**
- **Search Bar**: Search by customer name, email, order ID, or subject
  - Debounced for performance (300ms delay)
  
- **Advanced Filters** (click "Filters" button):
  - Category (multi-select)
  - Status (multi-select)
  - Priority (multi-select)
  - Payment Status (multi-select)
  - Assigned To
  - Date Range

### 3. **Order Detail Panel**
Click any order to open the detail panel on the right showing:

- **Customer Information**:
  - Name, email, phone
  - "Copy" buttons for quick copying

- **Editable Fields** (changes save instantly):
  - Status
  - Priority
  - Category
  - Assigned To
  - Due Date
  - Payment Status

- **Quick Actions**:
  - Request Info (opens email modal)
  - Mark Deposit Paid
  - Mark Completed
  - Set to Waiting on Client
  - Escalate to P0

- **Internal Notes**: Add private notes (autosave on change)

- **Activity Log**: Complete history of all changes

### 4. **Email Functionality**
- Click "Request Info" or use email modal
- **Templates**:
  - Request Info
  - Payment Reminder
  - Ready for Review
  - Custom
- Automatically logs emails in activity log

### 5. **Export**
- Click "Export CSV" to download filtered orders
- Includes all key fields
- Filename includes date

## 🎨 Category Colors

- **Beauty**: Red (#E11D48)
- **Credit Services**: Blue (#2563EB)
- **Web Development**: Purple (#7C3AED)
- **Graphic Design**: Orange (#F59E0B)
- **Document Creation**: Green (#10B981)

## ⚡ Priority Levels

- **P0**: URGENT - Red background, 8px left border, bold
- **P1**: High - Yellow tint, 6px left border, bold
- **P2**: Normal - 4px left border
- **P3**: Low - Muted, 4px left border

## 📡 API Endpoints

### Orders API
- `GET /api/orders` - List orders (with filters)
- `GET /api/orders/:id` - Get single order
- `POST /api/orders` - Create order
- `PATCH /api/orders/:id` - Update order
- `POST /api/orders/:id/message` - Log email message
- `POST /api/orders/seed` - Seed test data

### Query Parameters for GET /api/orders
```
?status=New,In Progress
&category=Beauty,Web Development
&priority=P0,P1
&paymentStatus=Unpaid
&assignedTo=Sarah
&q=search term
&dateFrom=2026-01-01
&dateTo=2026-12-31
&sort=-createdAt
&page=1
&limit=50
```

## 💾 Data Storage

Orders are stored in: `src/data/orders.json`

**Order Object Structure**:
```json
{
  "id": "ORD-1234567890-abc123",
  "createdAt": "2026-02-14T20:00:00.000Z",
  "updatedAt": "2026-02-14T20:30:00.000Z",
  "customer": {
    "name": "Sarah Johnson",
    "email": "sarah.j@email.com",
    "phone": "(555) 123-4567"
  },
  "category": "Beauty",
  "priority": "P1",
  "status": "In Progress",
  "subject": "Deep Cleanse Facial Package",
  "description": "Client needs comprehensive service...",
  "dueDate": "2026-02-20",
  "tags": ["skincare", "package"],
  "assignedTo": "Sarah",
  "lastMessageAt": "2026-02-14T20:00:00.000Z",
  "paymentStatus": "Deposit Paid",
  "amount": 250,
  "attachments": [],
  "internalNotes": "VIP client, handle with care",
  "activityLog": [
    {
      "at": "2026-02-14T20:00:00.000Z",
      "type": "created",
      "text": "Order created"
    }
  ]
}
```

## 🔧 Customization

### Add Team Members
Edit `/public/js/orders.js` and `/views/admin/orders.ejs`:
- Look for "Sarah", "Mike", "Alex", "Jordan"
- Add your team member names

### Change Categories
Edit `/src/services/seedOrders.js` and update the `CATEGORIES` array

### Add Email Templates
Edit `/public/js/orders.js` and add to the `EMAIL_TEMPLATES` object

## 🛡️ Security

- All routes are protected with `requireAdmin` middleware
- Session-based authentication
- No orders data exposed to non-admin users

## 📱 Responsive Design

The interface is fully responsive:
- **Mobile** (375px): Stacked layout
- **Tablet** (768px): Optimized spacing
- **Desktop** (1024px+): Split view (list + detail panel)

## ⌨️ Keyboard Accessibility

- All interactive elements have proper focus states
- Minimum touch target: 44x44px
- Color contrast ratio: ≥ 4.5:1
- Visible labels for screen readers

## 🚀 Deployment Notes

When deploying to Render:

1. **Environment Variables** are already configured in your `.env` file
2. The system will auto-deploy when you push to GitHub
3. Access at: `https://your-app.onrender.com/admin/orders`

## 💡 Tips

1. **Use P0** for truly urgent orders only
2. **Filter by "Unpaid"** to follow up on payments
3. **Export CSV** regularly for records
4. **Use Internal Notes** for team communication
5. **Activity Log** tracks all changes automatically

## 🐛 Troubleshooting

### Orders not loading?
- Check browser console for errors
- Verify you're logged in as admin
- Check that `/src/data/orders.json` exists

### Can't update orders?
- Make sure you're logged in
- Check network tab for failed API calls
- Verify file permissions on `orders.json`

### Seed data not working?
- Open browser console
- Run: `seedTestData(20)`
- Check for error messages

## 📞 Support

For issues or questions, check:
1. Browser console (F12)
2. Server logs
3. Network tab in dev tools

---

**Built with ❤️ for Corazintel** - Modern, fast, and powerful order management for your multifaceted business.
