// ============================================================
// Owner Dashboard Page  (/owner)
// ============================================================

let _ownerToken  = null;
let _ownerTab    = 'pending';

function renderOwnerPage() {
  document.getElementById('app-header').classList.add('hidden');
  document.getElementById('bottom-nav').classList.add('hidden');

  const container = document.getElementById('page-container');
  container.className = 'page-container no-header no-nav animate-fade';

  const saved = sessionStorage.getItem('gc_owner_token');
  if (saved) {
    _ownerToken = saved;
    loadOwnerDashboard();
    return;
  }

  renderOwnerLogin();
}

function renderOwnerLogin() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div style="min-height:100vh;display:flex;flex-direction:column;align-items:center;
      justify-content:center;padding:24px;">
      <div style="width:100%;max-width:360px;">
        <div style="text-align:center;margin-bottom:32px;">
          <div style="font-size:48px;">🔥</div>
          <div style="font-size:22px;font-weight:800;color:var(--orange);margin-top:8px;">
            Owner Dashboard
          </div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
            Grill &amp; Chill · Kulti
          </div>
        </div>

        <div class="card-elevated" style="display:flex;flex-direction:column;gap:14px;">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input type="text" id="owner-username" class="form-control"
              placeholder="Owner username" autocomplete="off" />
          </div>
          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrapper">
              <input type="password" id="owner-password" class="form-control"
                placeholder="Owner password" />
              <span class="input-toggle" onclick="togglePassword('owner-password', this)">👁️</span>
            </div>
          </div>
          <button class="btn btn-primary btn-full" id="owner-login-btn" onclick="handleOwnerLogin()">
            Login as Owner
          </button>
        </div>

        <div style="text-align:center;margin-top:20px;">
          <span style="font-size:13px;color:var(--text-muted);cursor:pointer;"
            onclick="navigateTo('home')">← Back to App</span>
        </div>
      </div>
    </div>`;
}

async function handleOwnerLogin() {
  const username = document.getElementById('owner-username').value.trim();
  const password = document.getElementById('owner-password').value;

  if (!username || !password) {
    showToast('Enter credentials', 'error');
    return;
  }

  const btn = document.getElementById('owner-login-btn');
  setButtonLoading(btn, true, 'Logging in…');

  try {
    const data = await api.post('/auth/owner/login', { username, password });
    _ownerToken = data.token;
    sessionStorage.setItem('gc_owner_token', _ownerToken);
    showToast('Welcome, Owner! 🔥', 'success');
    loadOwnerDashboard();
  } catch (err) {
    showToast(err.message || 'Invalid credentials', 'error');
    setButtonLoading(btn, false, 'Login as Owner');
  }
}

async function loadOwnerDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="owner-page">
      <div class="owner-header">
        <div>
          <div class="owner-title">🔥 Owner Dashboard</div>
          <div class="owner-sub">Grill &amp; Chill · Kulti</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="ownerLogout()">Logout</button>
      </div>

      <!-- Stats -->
      <div id="owner-stats" class="stats-row">
        ${[1,2,3,4].map(() => `
          <div class="owner-stat-card">
            <div class="skeleton" style="height:12px;width:60%;margin-bottom:8px;"></div>
            <div class="skeleton" style="height:28px;width:50%;"></div>
          </div>`).join('')}
      </div>

      <!-- Status counts -->
      <div id="order-status-row" class="stats-row" style="grid-template-columns:1fr 1fr 1fr;margin-bottom:20px;"></div>

      <!-- Tabs -->
      <div class="tabs-row">
        <button class="tab-btn ${_ownerTab === 'pending' ? 'active' : ''}"
          onclick="ownerSwitchTab('pending')">⏳ Pending</button>
        <button class="tab-btn ${_ownerTab === 'all' ? 'active' : ''}"
          onclick="ownerSwitchTab('all')">📋 All Orders</button>
      </div>

      <div id="owner-orders-list"></div>
    </div>`;

  await Promise.all([loadOwnerStats(), loadOwnerOrders()]);
}

async function loadOwnerStats() {
  try {
    const stats = await ownerApi('/owner/stats');
    document.getElementById('owner-stats').innerHTML = `
      <div class="owner-stat-card">
        <div class="owner-stat-label">Total Users</div>
        <div class="owner-stat-value">${stats.total_users}</div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-label">Total Orders</div>
        <div class="owner-stat-value">${stats.total_orders}</div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-label">Revenue</div>
        <div class="owner-stat-value">₹${stats.total_revenue.toFixed(0)}</div>
      </div>
      <div class="owner-stat-card">
        <div class="owner-stat-label">Rewards Given</div>
        <div class="owner-stat-value">₹${stats.total_rewards_distributed.toFixed(0)}</div>
      </div>`;

    document.getElementById('order-status-row').innerHTML = `
      <div class="owner-stat-card" style="text-align:center;">
        <div class="owner-stat-label">Pending</div>
        <div class="owner-stat-value" style="color:var(--yellow);">${stats.pending_orders}</div>
      </div>
      <div class="owner-stat-card" style="text-align:center;">
        <div class="owner-stat-label">Approved</div>
        <div class="owner-stat-value" style="color:var(--green);">${stats.approved_orders}</div>
      </div>
      <div class="owner-stat-card" style="text-align:center;">
        <div class="owner-stat-label">Rejected</div>
        <div class="owner-stat-value" style="color:var(--red);">${stats.rejected_orders}</div>
      </div>`;
  } catch (err) {
    document.getElementById('owner-stats').innerHTML =
      `<div style="color:var(--red);font-size:13px;padding:8px;">Could not load stats</div>`;
  }
}

async function loadOwnerOrders() {
  const el = document.getElementById('owner-orders-list');
  el.innerHTML = `<div style="text-align:center;padding:32px;color:var(--text-muted);font-size:14px;">
    Loading orders…</div>`;

  try {
    const endpoint = _ownerTab === 'pending' ? '/owner/orders/pending' : '/owner/orders';
    const orders   = await ownerApi(endpoint);
    renderOwnerOrders(orders);
  } catch (err) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">⚠️</div>
      <div class="empty-state-title">Could not load orders</div>
      <button class="btn btn-ghost btn-sm" onclick="loadOwnerOrders()">Retry</button>
    </div>`;
  }
}

function renderOwnerOrders(orders) {
  const el = document.getElementById('owner-orders-list');

  if (!orders.length) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">${_ownerTab === 'pending' ? '✅' : '📋'}</div>
      <div class="empty-state-title">
        ${_ownerTab === 'pending' ? 'No pending orders!' : 'No orders yet'}
      </div>
    </div>`;
    return;
  }

  el.innerHTML = orders.map(order => renderOwnerOrderCard(order)).join('');
}

function renderOwnerOrderCard(order) {
  const isPending = order.status === 'pending';
  const badge = isPending
    ? `<span class="badge badge-pending">⏳ Pending</span>`
    : order.status === 'approved'
      ? `<span class="badge badge-approved">✅ Approved</span>`
      : `<span class="badge badge-rejected">❌ Rejected</span>`;

  const itemsHtml = order.items.map(item => `
    <div class="pending-item-row">
      <span><strong>${item.quantity}×</strong> ${item.product_name}</span>
      <span>₹${item.line_total.toFixed(0)}</span>
    </div>`).join('');

  const walletNote = order.wallet_used > 0
    ? `<div style="font-size:12px;color:var(--green);margin-top:6px;">
         👛 Wallet used: ₹${order.wallet_used.toFixed(0)} · Cart total: ₹${order.subtotal.toFixed(0)}
       </div>` : '';

  const actionsHtml = isPending ? `
    <div style="margin-top:10px;">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:4px;">
        Override final amount (leave blank to use ₹${order.final_amount.toFixed(0)}):
      </div>
      <input type="number" class="override-input" id="override-${order.id}"
        placeholder="₹${order.final_amount.toFixed(0)}" min="1" />
      <div class="pending-actions">
        <button class="btn btn-success" onclick="approveOrder(${order.id})">✅ Approve</button>
        <button class="btn btn-danger"  onclick="rejectOrder(${order.id})">❌ Reject</button>
      </div>
    </div>` : `
    <div style="font-size:13px;color:var(--text-muted);margin-top:8px;">
      ${order.approved_amount ? `Final amount: ₹${order.approved_amount.toFixed(0)}` : ''}
      ${order.buyer_reward > 0 ? ` · Reward given: ₹${order.buyer_reward.toFixed(2)}` : ''}
    </div>`;

  return `
    <div class="pending-card" id="oc-${order.id}">
      <div class="pending-card-header">
        <div>
          <div class="customer-name">${order.customer_name}</div>
          <div class="customer-phone">📱 ${order.customer_phone}</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">
            ${formatDate(order.created_at)}
          </div>
        </div>
        <div style="text-align:right;">
          ${badge}
          <div style="font-size:13px;font-weight:800;color:var(--orange);margin-top:6px;">
            ${order.order_number}
          </div>
        </div>
      </div>

      <div class="pending-items">${itemsHtml}</div>

      <div style="display:flex;justify-content:space-between;align-items:center;
        padding-top:8px;border-top:1px solid var(--border);">
        <span style="font-size:13px;color:var(--text-muted);">Cart Total</span>
        <span style="font-size:16px;font-weight:800;color:var(--orange);">
          ₹${order.final_amount.toFixed(0)}
        </span>
      </div>
      ${walletNote}
      ${actionsHtml}
    </div>`;
}

async function approveOrder(orderId) {
  const input       = document.getElementById(`override-${orderId}`);
  const overrideVal = input ? input.value.trim() : '';
  const payload     = {};

  if (overrideVal) {
    const amt = parseFloat(overrideVal);
    if (isNaN(amt) || amt <= 0) {
      showToast('Enter a valid amount', 'error');
      return;
    }
    payload.final_amount = amt;
  }

  const card = document.getElementById(`oc-${orderId}`);
  if (card) card.style.opacity = '0.5';

  try {
    await ownerApi(`/owner/orders/${orderId}/approve`, 'POST', payload);
    showToast('Order approved! Rewards distributed 🎁', 'success');
    await Promise.all([loadOwnerStats(), loadOwnerOrders()]);
  } catch (err) {
    showToast(err.message || 'Could not approve order', 'error');
    if (card) card.style.opacity = '1';
  }
}

async function rejectOrder(orderId) {
  if (!confirm('Reject this order? Wallet amount (if any) will be refunded.')) return;

  const card = document.getElementById(`oc-${orderId}`);
  if (card) card.style.opacity = '0.5';

  try {
    await ownerApi(`/owner/orders/${orderId}/reject`, 'POST', {});
    showToast('Order rejected. Wallet refunded if applicable.', 'success');
    await Promise.all([loadOwnerStats(), loadOwnerOrders()]);
  } catch (err) {
    showToast(err.message || 'Could not reject order', 'error');
    if (card) card.style.opacity = '1';
  }
}

function ownerSwitchTab(tab) {
  _ownerTab = tab;
  document.querySelectorAll('.tab-btn').forEach(b => {
    b.classList.toggle('active', b.textContent.toLowerCase().includes(tab === 'pending' ? 'pending' : 'all'));
  });
  loadOwnerOrders();
}

function ownerLogout() {
  sessionStorage.removeItem('gc_owner_token');
  _ownerToken = null;
  navigateTo('home');
}

// Owner-specific API helper (uses owner token)
async function ownerApi(path, method = 'GET', body = null) {
  const BASE = window.API_BASE || 'http://localhost:8000';
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${_ownerToken}`,
    },
  };
  if (body !== null) opts.body = JSON.stringify(body);

  const res  = await fetch(BASE + path, opts);
  const data = await res.json();

  if (!res.ok) throw new Error(data.detail || 'Request failed');
  return data;
}
