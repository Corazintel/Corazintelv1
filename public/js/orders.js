// Orders Management JavaScript
// ============================================================================

// Category colors mapping
const CATEGORY_COLORS = {
  'Beauty': '#E11D48',
  'Credit Services': '#2563EB',
  'Web Development': '#7C3AED',
  'Graphic Design': '#F59E0B',
  'Document Creation': '#10B981'
};

// Status colors mapping
const STATUS_COLORS = {
  'New': '#3B82F6',
  'In Progress': '#8B5CF6',
  'Waiting on Client': '#F59E0B',
  'Completed': '#10B981',
  'Cancelled': '#6B7280'
};

// Payment colors mapping
const PAYMENT_COLORS = {
  'Unpaid': '#EF4444',
  'Deposit Paid': '#F59E0B',
  'Paid': '#10B981',
  'Refunded': '#6B7280'
};

// Email templates
const EMAIL_TEMPLATES = {
  request_info: {
    subject: 'We need more information about your order',
    body: 'Hi [Customer Name],\n\nWe\'re working on your order and need some additional information to proceed.\n\nCould you please provide:\n- [Detail 1]\n- [Detail 2]\n\nThank you!\n\nBest regards,\nCorazintel Team'
  },
  payment_reminder: {
    subject: 'Payment reminder for your order',
    body: 'Hi [Customer Name],\n\nThis is a friendly reminder about the payment for your order.\n\nOrder: [Order Subject]\nAmount: $[Amount]\n\nPlease let us know if you have any questions.\n\nBest regards,\nCorazintel Team'
  },
  ready_review: {
    subject: 'Your order is ready for review',
    body: 'Hi [Customer Name],\n\nGreat news! Your order is ready for review.\n\nPlease take a look and let us know if any changes are needed.\n\nBest regards,\nCorazintel Team'
  }
};

// State
let allOrders = [];
let selectedOrderId = null;
let currentFilters = {};
let searchDebounceTimer = null;

// DOM Elements
const searchInput = document.getElementById('searchInput');
const filterBtn = document.getElementById('filterBtn');
const filterPanel = document.getElementById('filterPanel');
const closeFiltersBtn = document.getElementById('closeFilters');
const applyFiltersBtn = document.getElementById('applyFilters');
const clearFiltersBtn = document.getElementById('clearFilters');
const ordersList = document.getElementById('ordersList');
const orderDetailPanel = document.getElementById('orderDetailPanel');
const closeDetailBtn = document.getElementById('closeDetail');
const emailModal = document.getElementById('email Modal');
const closeEmailModalBtn = document.getElementById('closeEmailModal');
const exportBtn = document.getElementById('exportBtn');
const newOrderBtn = document.getElementById('newOrderBtn');
const filterCountBadge = document.getElementById('filterCount');

// Initialize
document.addEventListener('DOMContentLoaded', () => {
  loadOrders();
  setupEventListeners();
});

// Setup Event Listeners
function setupEventListeners() {
  // Search
  searchInput.addEventListener('input', (e) => {
    clearTimeout(searchDebounceTimer);
    searchDebounceTimer = setTimeout(() => {
      currentFilters.q = e.target.value;
      loadOrders();
    }, 300);
  });

  // Filter panel
  filterBtn.addEventListener('click', () => {
    filterPanel.style.display = 'flex';
  });

  closeFiltersBtn.addEventListener('click', () => {
    filterPanel.style.display = 'none';
  });

  applyFiltersBtn.addEventListener('click', () => {
    applyFilters();
    filterPanel.style.display = 'none';
  });

  clearFiltersBtn.addEventListener('click', () => {
    clearFilters();
  });

  // Detail panel
  closeDetailBtn.addEventListener('click', () => {
    closeDetailPanel();
  });

  // Email modal
  closeEmailModalBtn.addEventListener('click', () => {
    emailModal.style.display = 'none';
  });

  document.getElementById('cancelEmail').addEventListener('click', () => {
    emailModal.style.display = 'none';
  });

  document.getElementById('sendEmail').addEventListener('click', () => {
    sendEmail();
  });

  document.getElementById('emailTemplate').addEventListener('change', (e) => {
    applyEmailTemplate(e.target.value);
  });

  // Export
  exportBtn.addEventListener('click', () => {
    exportToCSV();
  });

  // New order
  newOrderBtn.addEventListener('click', () => {
    // Open the customer intake form in a new tab or redirect
    window.location.href = '/order-intake';
  });

  // Close modals on outside click
  emailModal?.addEventListener('click', (e) => {
    if (e.target === emailModal) {
      emailModal.style.display = 'none';
    }
  });
}

// Load Orders from API
async function loadOrders() {
  try {
    showLoading();

    const queryParams = new URLSearchParams();

    if (currentFilters.q) queryParams.set('q', currentFilters.q);
    if (currentFilters.status) queryParams.set('status', currentFilters.status.join(','));
    if (currentFilters.category) queryParams.set('category', currentFilters.category.join(','));
    if (currentFilters.priority) queryParams.set('priority', currentFilters.priority.join(','));
    if (currentFilters.paymentStatus) queryParams.set('paymentStatus', currentFilters.paymentStatus.join(','));
    if (currentFilters.assignedTo) queryParams.set('assignedTo', currentFilters.assignedTo);
    if (currentFilters.dateFrom) queryParams.set('dateFrom', currentFilters.dateFrom);
    if (currentFilters.dateTo) queryParams.set('dateTo', currentFilters.dateTo);

    const response = await fetch(`/api/orders?${queryParams.toString()}`);

    if (!response.ok) {
      throw new Error('Failed to load orders');
    }

    const data = await response.json();
    allOrders = data.orders;

    renderOrdersList(allOrders);
    updateFilterCount();

  } catch (error) {
    console.error('Error loading orders:', error);
    showError();
  }
}

// Show loading state
function showLoading() {
  ordersList.innerHTML = '<div class="loading"><div class="spinner"></div><p>Loading orders...</p></div>';
}

// Show error state
function showError() {
  ordersList.innerHTML = '<div class="error"><p>Failed to load orders. Please try again.</p></div>';
}

// Render Orders List
function renderOrdersList(orders) {
  if (orders.length === 0) {
    ordersList.innerHTML = '<div class="empty-state"><p>No orders found. Try adjusting your filters.</p></div>';
    return;
  }

  const html = orders.map(order => renderOrderCard(order)).join('');
  ordersList.innerHTML = html;

  // Add click handlers
  document.querySelectorAll('.order-card').forEach(card => {
    card.addEventListener('click', () => {
      const orderId = card.dataset.orderId;
      loadOrderDetail(orderId);
    });
  });
}

// Render Order Card
function renderOrderCard(order) {
  const categoryColor = CATEGORY_COLORS[order.category] || '#6B7280';
  const statusColor = STATUS_COLORS[order.status] || '#6B7280';
  const priorityClass = `priority-${order.priority}`;
  const selectedClass = selectedOrderId === order.id ? 'selected' : '';

  const lastActivity = order.lastMessageAt || order.updatedAt;
  const lastActivityText = formatRelativeTime(lastActivity);

  return `
    <div class="order-card ${priorityClass} ${selectedClass}" 
         data-order-id="${order.id}"
         style="border-left-color: ${categoryColor}">
      <div class="order-header">
        <div class="order-badges">
          <span class="badge badge-category" style="background: ${categoryColor}">
            ${order.category}
          </span>
          <span class="badge badge-priority ${order.priority}">
            ${order.priority}${order.priority === 'P0' ? ' URGENT' : ''}
          </span>
          <span class="badge badge-status" style="background: ${statusColor}">
            ${order.status}
          </span>
        </div>
      </div>
      
      <div class="order-body">
        <div class="order-customer">${escapeHtml(order.customer.name)}</div>
        <div class="order-email">${escapeHtml(order.customer.email)}</div>
        <div class="order-subject">${escapeHtml(order.subject)}</div>
      </div>
      
      <div class="order-footer">
        <div class="order-meta">
          ${order.dueDate ? `<span>Due: ${formatDate(order.dueDate)}</span>` : ''}
          <span>Last activity: ${lastActivityText}</span>
          <span style="color: ${PAYMENT_COLORS[order.paymentStatus]}">${order.paymentStatus}</span>
        </div>
        ${order.amount ? `<div><strong>$${order.amount.toFixed(2)}</strong></div>` : ''}
      </div>
    </div>
  `;
}

// Load Order Detail
async function loadOrderDetail(orderId) {
  try {
    selectedOrderId = orderId;

    // Update selected state in list
    document.querySelectorAll('.order-card').forEach(card => {
      card.classList.toggle('selected', card.dataset.orderId === orderId);
    });

    const response = await fetch(`/api/orders/${orderId}`);

    if (!response.ok) {
      throw new Error('Failed to load order');
    }

    const order = await response.json();
    renderOrderDetail(order);

    // Show detail panel
    orderDetailPanel.style.display = 'block';
    document.querySelector('.main-content').classList.add('split');

  } catch (error) {
    console.error('Error loading order detail:', error);
    alert('Failed to load order details');
  }
}

// Render Order Detail Panel
function renderOrderDetail(order) {
  const categoryColor = CATEGORY_COLORS[order.category] || '#6B7280';
  const statusColor = STATUS_COLORS[order.status] || '#6B7280';

  const html = `
    <div class="detail-section">
      <h3>Customer Information</h3>
      <div class="customer-info">
        <div class="customer-row">
          <strong>${escapeHtml(order.customer.name)}</strong>
        </div>
        <div class="customer-row">
          <span>${escapeHtml(order.customer.email)}</span>
          <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('${order.customer.email}')">
           Copy
          </button>
        </div>
        <div class="customer-row">
          <span>${escapeHtml(order.customer.phone)}</span>
          <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('${order.customer.phone}')">
            Copy
          </button>
        </div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3>Order Details</h3>
      
      <div class="detail-field">
        <label for="detailStatus">Status</label>
        <select id="detailStatus" data-field="status" onchange="updateOrderField('${order.id}', 'status', this.value)">
          <option value="New" ${order.status === 'New' ? 'selected' : ''}>New</option>
          <option value="In Progress" ${order.status === 'In Progress' ? 'selected' : ''}>In Progress</option>
          <option value="Waiting on Client" ${order.status === 'Waiting on Client' ? 'selected' : ''}>Waiting on Client</option>
          <option value="Completed" ${order.status === 'Completed' ? 'selected' : ''}>Completed</option>
          <option value="Cancelled" ${order.status === 'Cancelled' ? 'selected' : ''}>Cancelled</option>
        </select>
      </div>
      
      <div class="detail-field">
        <label for="detailPriority">Priority</label>
        <select id="detailPriority" data-field="priority" onchange="updateOrderField('${order.id}', 'priority', this.value)">
          <option value="P0" ${order.priority === 'P0' ? 'selected' : ''}>P0 (Urgent)</option>
          <option value="P1" ${order.priority === 'P1' ? 'selected' : ''}>P1 (High)</option>
          <option value="P2" ${order.priority === 'P2' ? 'selected' : ''}>P2 (Normal)</option>
          <option value="P3" ${order.priority === 'P3' ? 'selected' : ''}>P3 (Low)</option>
        </select>
      </div>
      
      <div class="detail-field">
        <label for="detailCategory">Category</label>
        <select id="detailCategory" data-field="category" onchange="updateOrderField('${order.id}', 'category', this.value)">
          <option value="Beauty" ${order.category === 'Beauty' ? 'selected' : ''}>Beauty</option>
          <option value="Credit Services" ${order.category === 'Credit Services' ? 'selected' : ''}>Credit Services</option>
          <option value="Web Development" ${order.category === 'Web Development' ? 'selected' : ''}>Web Development</option>
          <option value="Graphic Design" ${order.category === 'Graphic Design' ? 'selected' : ''}>Graphic Design</option>
          <option value="Document Creation" ${order.category === 'Document Creation' ? 'selected' : ''}>Document Creation</option>
        </select>
      </div>
      
      <div class="detail-field">
        <label for="detailAssignedTo">Assigned To</label>
        <select id="detailAssignedTo" data-field="assignedTo" onchange="updateOrderField('${order.id}', 'assignedTo', this.value)">
          <option value="">Unassigned</option>
          <option value="Sarah" ${order.assignedTo === 'Sarah' ? 'selected' : ''}>Sarah</option>
          <option value="Mike" ${order.assignedTo === 'Mike' ? 'selected' : ''}>Mike</option>
          <option value="Alex" ${order.assignedTo === 'Alex' ? 'selected' : ''}>Alex</option>
          <option value="Jordan" ${order.assignedTo === 'Jordan' ? 'selected' : ''}>Jordan</option>
        </select>
      </div>
      
      <div class="detail-field">
        <label for="detailDueDate">Due Date</label>
        <input type="date" id="detailDueDate" value="${order.dueDate || ''}" 
               onchange="updateOrderField('${order.id}', 'dueDate', this.value)">
      </div>
      
      <div class="detail-field">
        <label for="detailPaymentStatus">Payment Status</label>
        <select id="detailPaymentStatus" data-field="paymentStatus" onchange="updateOrderField('${order.id}', 'paymentStatus', this.value)">
          <option value="Unpaid" ${order.paymentStatus === 'Unpaid' ? 'selected' : ''}>Unpaid</option>
          <option value="Deposit Paid" ${order.paymentStatus === 'Deposit Paid' ? 'selected' : ''}>Deposit Paid</option>
          <option value="Paid" ${order.paymentStatus === 'Paid' ? 'selected' : ''}>Paid</option>
          <option value="Refunded" ${order.paymentStatus === 'Refunded' ? 'selected' : ''}>Refunded</option>
        </select>
      </div>
      
      <div class="detail-field">
        <label>Subject</label>
        <div>${escapeHtml(order.subject)}</div>
      </div>
      
      <div class="detail-field">
        <label>Description</label>
        <div>${escapeHtml(order.description)}</div>
      </div>
      
      <div class="detail-field">
        <label>Tags</label>
        <div>${order.tags.map(tag => `<span class="badge" style="background: #E5E7EB; color: #374151">${tag}</span>`).join(' ')}</div>
      </div>
    </div>
    
    <div class="detail-section">
      <h3>Quick Actions</h3>
      <div class="detail-actions">
        <button class="btn btn-secondary" onclick="openEmailModal('${order.id}', '${order.customer.email}', '${order.customer.name}', '${order.subject}', ${order.amount || 0})">
          Request Info
        </button>
        <button class="btn btn-secondary" onclick="quickAction('${order.id}', 'paymentStatus', 'Deposit Paid')">
          Mark Deposit Paid
        </button>
        <button class="btn btn-secondary" onclick="quickAction('${order.id}', 'status', 'Completed')">
          Mark Completed
        </button>
        <button class="btn btn-secondary" onclick="quickAction('${order.id}', 'status', 'Waiting on Client')">
          Set Waiting on Client
        </button>
        <button class="btn btn-secondary" onclick="quickAction('${order.id}', 'priority', 'P0')">
          Escalate to P0
        </button>
      </div>
    </div>
    
    ${order.stripe ? `
    <div class="detail-section">
      <h3>💳 Stripe Payment Info</h3>
      <div class="stripe-info">
        ${order.stripe.paymentIntentId ? `
        <div class="stripe-row">
          <label>Payment Intent:</label>
          <a href="https://dashboard.stripe.com/${process.env.STRIPE_MODE === 'live' ? '' : 'test/'}payments/${order.stripe.paymentIntentId}" 
             target="_blank" 
             class="stripe-link">
            ${order.stripe.paymentIntentId}
          </a>
          <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('${order.stripe.paymentIntentId}')">
            Copy
          </button>
        </div>
        ` : ''}
        
        ${order.stripe.checkoutSessionId ? `
        <div class="stripe-row">
          <label>Checkout Session:</label>
          <a href="https://dashboard.stripe.com/${process.env.STRIPE_MODE === 'live' ? '' : 'test/'}checkout/sessions/${order.stripe.checkoutSessionId}" 
             target="_blank" 
             class="stripe-link">
            ${order.stripe.checkoutSessionId.substring(0, 30)}...
          </a>
          <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('${order.stripe.checkoutSessionId}')">
            Copy
          </button>
        </div>
        ` : ''}
        
        ${order.stripe.customerId ? `
        <div class="stripe-row">
          <label>Stripe Customer:</label>
          <a href="https://dashboard.stripe.com/${process.env.STRIPE_MODE === 'live' ? '' : 'test/'}customers/${order.stripe.customerId}" 
             target="_blank" 
             class="stripe-link">
            ${order.stripe.customerId}
          </a>
          <button class="btn btn-secondary copy-btn" onclick="copyToClipboard('${order.stripe.customerId}')">
            Copy
          </button>
        </div>
        ` : ''}
        
        ${order.stripe.status ? `
        <div class="stripe-row">
          <label>Payment Status:</label>
          <span class="stripe-status status-${order.stripe.status}">
            ${order.stripe.status}
          </span>
        </div>
        ` : ''}
        
        ${order.stripe.amountTotal || order.stripe.amountCaptured ? `
        <div class="stripe-row">
          <label>Amount:</label>
          <strong>$${(order.stripe.amountTotal || order.stripe.amountCaptured).toFixed(2)} ${(order.stripe.currency || 'usd').toUpperCase()}</strong>
        </div>
        ` : ''}
        
        ${order.stripe.refunded ? `
        <div class="stripe-row">
          <label>Refund:</label>
          <span class="stripe-refund">
            $${order.stripe.amountRefunded.toFixed(2)} refunded
          </span>
        </div>
        ` : ''}
        
        ${order.stripe.lastUpdated ? `
        <div class="stripe-row">
          <label>Last Updated:</label>
          <span>${formatDateTime(order.stripe.lastUpdated)}</span>
        </div>
        ` : ''}
      </div>
    </div>
    ` : ''}
    
    <div class="detail-section">
      <h3>Internal Notes</h3>
      <div class="detail-field">
        <textarea id="internalNotes" rows="4" onchange="updateOrderField('${order.id}', 'internalNotes', this.value)">${escapeHtml(order.internalNotes || '')}</textarea>
      </div>
    </div>
    
    <div class="detail-section">
      <h3>Activity Log</h3>
      <ul class="activity-log">
        ${order.activityLog.slice().reverse().map(activity => `
          <li class="activity-item">
            <div class="activity-time">${formatDateTime(activity.at)}</div>
            <div class="activity-text">${escapeHtml(activity.text)}</div>
          </li>
        `).join('')}
      </ul>
    </div>
  `;

  document.getElementById('orderDetailContent').innerHTML = html;
}

// Close Detail Panel
function closeDetailPanel() {
  orderDetailPanel.style.display = 'none';
  document.querySelector('.main-content').classList.remove('split');
  selectedOrderId = null;

  // Remove selected state
  document.querySelectorAll('.order-card').forEach(card => {
    card.classList.remove('selected');
  });
}

// Update Order Field
async function updateOrderField(orderId, field, value) {
  try {
    const response = await fetch(`/api/orders/${orderId}`, {
      method: 'PATCH',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ [field]: value })
    });

    if (!response.ok) {
      throw new Error('Failed to update order');
    }

    // Reload orders list and detail
    await loadOrders();
    await loadOrderDetail(orderId);

  } catch (error) {
    console.error('Error updating order:', error);
    alert('Failed to update order');
  }
}

// Quick Action
async function quickAction(orderId, field, value) {
  await updateOrderField(orderId, field, value);
}

// Apply Filters
function applyFilters() {
  const filters = {};

  // Category
  const categoryChecks = document.querySelectorAll('input[name="category"]:checked');
  if (categoryChecks.length > 0) {
    filters.category = Array.from(categoryChecks).map(cb => cb.value);
  }

  // Status
  const statusChecks = document.querySelectorAll('input[name="status"]:checked');
  if (statusChecks.length > 0) {
    filters.status = Array.from(statusChecks).map(cb => cb.value);
  }

  // Priority
  const priorityChecks = document.querySelectorAll('input[name="priority"]:checked');
  if (priorityChecks.length > 0) {
    filters.priority = Array.from(priorityChecks).map(cb => cb.value);
  }

  // Payment Status
  const paymentChecks = document.querySelectorAll('input[name="paymentStatus"]:checked');
  if (paymentChecks.length > 0) {
    filters.paymentStatus = Array.from(paymentChecks).map(cb => cb.value);
  }

  // Assigned To
  const assignedTo = document.getElementById('assignedToFilter').value;
  if (assignedTo) {
    filters.assignedTo = assignedTo;
  }

  // Date Range
  const dateFrom = document.getElementById('dateFrom').value;
  const dateTo = document.getElementById('dateTo').value;
  if (dateFrom) filters.dateFrom = dateFrom;
  if (dateTo) filters.dateTo = dateTo;

  currentFilters = { ...currentFilters, ...filters };
  loadOrders();
}

// Clear Filters
function clearFilters() {
  // Clear checkboxes
  document.querySelectorAll('input[type="checkbox"]').forEach(cb => cb.checked = false);

  // Clear selects and dates
  document.getElementById('assignedToFilter').value = '';
  document.getElementById('dateFrom').value = '';
  document.getElementById('dateTo').value = '';

  // Reset filters
  currentFilters = {};
  searchInput.value = '';

  loadOrders();
}

// Update Filter Count
function updateFilterCount() {
  let count = 0;

  if (currentFilters.category) count += currentFilters.category.length;
  if (currentFilters.status) count += currentFilters.status.length;
  if (currentFilters.priority) count += currentFilters.priority.length;
  if (currentFilters.paymentStatus) count += currentFilters.paymentStatus.length;
  if (currentFilters.assignedTo) count += 1;
  if (currentFilters.dateFrom || currentFilters.dateTo) count += 1;

  if (count > 0) {
    filterCountBadge.textContent = count;
    filterCountBadge.style.display = 'inline-block';
  } else {
    filterCountBadge.style.display = 'none';
  }
}

// Open Email Modal
function openEmailModal(orderId, email, name, subject, amount) {
  document.getElementById('emailTo').value = email;
  document.getElementById('emailSubject').value = '';
  document.getElementById('emailBody').value = '';
  emailModal.dataset.orderId = orderId;
  emailModal.dataset.customerName = name;
  emailModal.dataset.orderSubject = subject;
  emailModal.dataset.amount = amount;
  emailModal.style.display = 'flex';
}

// Apply Email Template
function applyEmailTemplate(template) {
  if (template === 'custom') return;

  const tmpl = EMAIL_TEMPLATES[template];
  const customerName = emailModal.dataset.customerName;
  const orderSubject = emailModal.dataset.orderSubject;
  const amount = emailModal.dataset.amount;

  let subject = tmpl.subject;
  let body = tmpl.body;

  body = body.replace('[Customer Name]', customerName);
  body = body.replace('[Order Subject]', orderSubject);
  body = body.replace('[Amount]', amount);

  document.getElementById('emailSubject').value = subject;
  document.getElementById('emailBody').value = body;
}

// Send Email
async function sendEmail() {
  const orderId = emailModal.dataset.orderId;
  const subject = document.getElementById('emailSubject').value;
  const body = document.getElementById('emailBody').value;

  if (!subject || !body) {
    alert('Please fill in subject and message');
    return;
  }

  try {
    const response = await fetch(`/api/orders/${orderId}/message`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ subject, body })
    });

    if (!response.ok) {
      throw new Error('Failed to send email');
    }

    emailModal.style.display = 'none';
    alert('Email logged successfully');

    // Reload order detail
    await loadOrderDetail(orderId);

  } catch (error) {
    console.error('Error sending email:', error);
    alert('Failed to send email');
  }
}

// Export to CSV
function exportToCSV() {
  if (allOrders.length === 0) {
    alert('No orders to export');
    return;
  }

  const headers = ['ID', 'Created', 'Customer', 'Email', 'Category', 'Status', 'Priority', 'Subject', 'Payment Status', 'Amount', 'Due Date'];

  const rows = allOrders.map(order => [
    order.id,
    formatDateTime(order.createdAt),
    order.customer.name,
    order.customer.email,
    order.category,
    order.status,
    order.priority,
    order.subject,
    order.paymentStatus,
    order.amount || '',
    order.dueDate || ''
  ]);

  const csv = [headers, ...rows]
    .map(row => row.map(cell => `"${String(cell).replace(/"/g, '""')}"`).join(','))
    .join('\n');

  const blob = new Blob([csv], { type: 'text/csv' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = `corazintel-orders-${new Date().toISOString().split('T')[0]}.csv`;
  a.click();
  URL.revokeObjectURL(url);
}

// Utility Functions
function escapeHtml(text) {
  const div = document.createElement('div');
  div.textContent = text;
  return div.innerHTML;
}

function formatDate(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function formatDateTime(dateStr) {
  const date = new Date(dateStr);
  return date.toLocaleString('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric',
    hour: 'numeric',
    minute: '2-digit'
  });
}

function formatRelativeTime(dateStr) {
  const date = new Date(dateStr);
  const now = new Date();
  const diff = now - date;
  const minutes = Math.floor(diff / 60000);
  const hours = Math.floor(minutes / 60);
  const days = Math.floor(hours / 24);

  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  if (hours < 24) return `${hours}h ago`;
  if (days < 7) return `${days}d ago`;
  return formatDate(dateStr);
}

function copyToClipboard(text) {
  navigator.clipboard.writeText(text).then(() => {
    alert('Copied to clipboard!');
  });
}

// Seed Test Data (for development)
async function seedTestData(count = 20) {
  try {
    const response = await fetch('/api/orders/seed', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ count })
    });

    if (!response.ok) {
      throw new Error('Failed to seed data');
    }

    alert(`Created ${count} test orders!`);
    loadOrders();

  } catch (error) {
    console.error('Error seeding data:', error);
    alert('Failed to seed test data');
  }
}

// Make seedTestData available globally for console access
window.seedTestData = seedTestData;
