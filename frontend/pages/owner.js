// ============================================================
// Owner Dashboard Page
// Access: yoursite.com/#owner
// ============================================================

let _ownerToken = null;
let _ownerTab   = 'pending';

function renderOwnerPage() {
  // Always hide main header + bottom nav for owner page
  document.getElementById('app-header').classList.add('hidden');
  document.getElementById('bottom-nav').classList.add('hidden');

  const container = document.getElementById('page-container');
  container.className = 'page-container no-header no-nav';
  container.style.paddingTop    = '0';
  container.style.paddingBottom = '0';

  // Check if already logged in this session
  const saved = sessionStorage.getItem('gc_owner_token');
  if (saved) {
    _ownerToken = saved;
    loadOwnerDashboard();
    return;
  }

  renderOwnerLogin();
}

// ============================================================
// Owner Login Screen
// ============================================================
function renderOwnerLogin() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div style="
      min-height:100vh;
      background:var(--bg);
      display:flex;
      flex-direction:column;
      align-items:center;
      justify-content:center;
      padding:24px;
    ">
      <div style="width:100%;max-width:360px;">

        <!-- Brand -->
        <div style="text-align:center;margin-bottom:36px;">
          <div style="font-size:56px;line-height:1;">🔥</div>
          <div style="
            font-size:24px;font-weight:900;
            color:var(--orange);margin-top:12px;
            letter-spacing:-0.5px;
          ">Owner Dashboard</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:4px;">
            Grill &amp; Chill · Cafe on Street, Kulti
          </div>
        </div>

        <!-- Login Card -->
        <div style="
          background:var(--bg-card);
          border:1px solid var(--border-light);
          border-radius:var(--radius-xl);
          padding:24px;
          display:flex;
          flex-direction:column;
          gap:16px;
          box-shadow:var(--shadow);
        ">
          <div class="form-group">
            <label class="form-label">Username</label>
            <input
              type="text"
              id="owner-uname"
              class="form-control"
              placeholder="Enter owner username"
              autocomplete="off"
              autocorrect="off"
              spellcheck="false"
            />
          </div>

          <div class="form-group">
            <label class="form-label">Password</label>
            <div class="input-wrapper">
              <input
                type="password"
                id="owner-pwd"
                class="form-control"
                placeholder="Enter owner password"
                onkeydown="if(event.key==='Enter') handleOwnerLogin()"
              />
              <span class="input-toggle" onclick="ownerTogglePwd()">👁️</span>
            </div>
          </div>

          <button
            class="btn btn-primary btn-full"
            id="owner-login-btn"
            onclick="handleOwnerLogin()"
            style="margin-top:4px;"
          >
            Login as Owner
          </button>
        </div>

        <!-- Back link -->
        <div style="text-align:center;margin-top:20px;">
          <span
            onclick="navigateTo('home')"
            style="font-size:13px;color:var(--text-muted);cursor:pointer;"
          >← Back to Customer App</span>
        </div>

      </div>
    </div>`;
}

// Standalone toggle (no dependency on auth.js)
function ownerTogglePwd() {
  const inp  = document.getElementById('owner-pwd');
  const icon = document.querySelector('#owner-pwd + .input-toggle');
  if (!inp) return;
  if (inp.type === 'password') {
    inp.type = 'text';
    if (icon) icon.textContent = '🙈';
  } else {
    inp.type = 'password';
    if (icon) icon.textContent = '👁️';
  }
}

async function handleOwnerLogin() {
  const username = (document.getElementById('owner-uname')?.value || '').trim();
  const password = (document.getElementById('owner-pwd')?.value  || '');

  if (!username || !password) {
    showToast('Please enter username and password', 'error');
    return;
  }

  const btn = document.getElementById('owner-login-btn');
  if (btn) { btn.disabled = true; btn.textContent = 'Logging in…'; btn.style.opacity = '0.7'; }

  try {
    const BASE = window.API_BASE || '';
    const res  = await fetch(BASE + '/auth/owner/login', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify({ username, password }),
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Invalid credentials');

    _ownerToken = data.token;
    sessionStorage.setItem('gc_owner_token', _ownerToken);
    showToast('Welcome, Owner! 🔥', 'success');
    loadOwnerDashboard();

  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
    if (btn) { btn.disabled = false; btn.textContent = 'Login as Owner'; btn.style.opacity = '1'; }
  }
}

// ============================================================
// Owner Dashboard
// ============================================================
async function loadOwnerDashboard() {
  const container = document.getElementById('page-container');
  container.innerHTML = `
    <div class="owner-page animate-fade" id="owner-dash">

      <!-- Header -->
      <div style="
        display:flex;align-items:center;justify-content:space-between;
        padding:20px 16px 16px;
        border-bottom:1px solid var(--border);
        margin-bottom:16px;
      ">
        <div>
          <div style="font-size:20px;font-weight:800;">🔥 Owner Dashboard</div>
          <div style="font-size:12px;color:var(--text-muted);margin-top:2px;">Grill &amp; Chill · Kulti</div>
        </div>
        <button class="btn btn-sm btn-danger" onclick="ownerLogout()">Logout</button>
      </div>

      <!-- Stats skeleton -->
      <div id="owner-stats" style="
        display:grid;grid-template-columns:1fr 1fr;
        gap:10px;padding:0 16px;margin-bottom:10px;
      ">
        ${[0,1,2,3].map(() => `
          <div class="owner-stat-card">
            <div class="skeleton" style="height:11px;width:55%;border-radius:4px;margin-bottom:10px;"></div>
            <div class="skeleton" style="height:26px;width:45%;border-radius:4px;"></div>
          </div>`).join('')}
      </div>

      <!-- Order count row skeleton -->
      <div id="owner-status-row" style="
        display:grid;grid-template-columns:1fr 1fr 1fr;
        gap:10px;padding:0 16px;margin-bottom:20px;
      ">
        ${[0,1,2].map(() => `
          <div class="owner-stat-card" style="text-align:center;">
            <div class="skeleton" style="height:11px;width:60%;border-radius:4px;margin:0 auto 10px;"></div>
            <div class="skeleton" style="height:26px;width:40%;border-radius:4px;margin:0 auto;"></div>
          </div>`).join('')}
      </div>

      <!-- Tabs -->
      <div style="padding:0 16px;margin-bottom:16px;">
        <div class="tabs-row" id="owner-tabs">
          <button class="tab-btn active" id="tab-pending" onclick="ownerSwitchTab('pending')">⏳ Pending</button>
          <button class="tab-btn"        id="tab-all"     onclick="ownerSwitchTab('all')">📋 All Orders</button>
        </div>
      </div>

      <!-- Orders list -->
      <div id="owner-orders-list" style="padding:0 16px;">
        <div style="text-align:center;padding:32px 0;color:var(--text-muted);font-size:14px;">
          Loading orders…
        </div>
      </div>

      <div style="height:32px;"></div>
    </div>`;

  // Load in parallel
  await Promise.all([loadOwnerStats(), loadOwnerOrders()]);
}

// ============================================================
// Stats
// ============================================================
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

    document.getElementById('owner-status-row').innerHTML = `
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
      `<div style="color:var(--red);font-size:13px;padding:8px;grid-column:span 2;">
         ⚠️ Could not load stats
       </div>`;
  }
}

// ============================================================
// Orders List
// ============================================================
async function loadOwnerOrders() {
  const el = document.getElementById('owner-orders-list');
  if (!el) return;
  el.innerHTML = `<div style="text-align:center;padding:32px 0;color:var(--text-muted);font-size:14px;">
    Loading orders…</div>`;

  try {
    const endpoint = _ownerTab === 'pending' ? '/owner/orders/pending' : '/owner/orders';
    const orders   = await ownerApi(endpoint);
    renderOwnerOrders(orders);
  } catch (err) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load orders</div>
        <button class="btn btn-ghost btn-sm" style="margin-top:12px;" onclick="loadOwnerOrders()">
          Retry
        </button>
      </div>`;
  }
}

function renderOwnerOrders(orders) {
  const el = document.getElementById('owner-orders-list');
  if (!el) return;

  if (!orders.length) {
    el.innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">${_ownerTab === 'pending' ? '✅' : '📋'}</div>
        <div class="empty-state-title">
          ${_ownerTab === 'pending' ? 'No pending orders right now!' : 'No orders yet'}
        </div>
        <div class="empty-state-sub">
          ${_ownerTab === 'pending' ? 'All caught up 🎉' : 'Orders will appear here once placed'}
        </div>
      </div>`;
    return;
  }

  el.innerHTML = orders.map(order => buildOwnerOrderCard(order)).join('');
}

function buildOwnerOrderCard(order) {
  const isPending = order.status === 'pending';

  const badge = {
    pending:  `<span class="badge badge-pending">⏳ Pending</span>`,
    approved: `<span class="badge badge-approved">✅ Approved</span>`,
    rejected: `<span class="badge badge-rejected">❌ Rejected</span>`,
  }[order.status] || `<span class="badge">${order.status}</span>`;

  const itemsHtml = order.items.map(item => `
    <div style="display:flex;justify-content:space-between;font-size:13px;
      padding:4px 0;border-bottom:1px solid var(--border);">
      <span style="color:var(--text-muted);">
        <strong style="color:var(--text);">${item.quantity}×</strong> ${item.product_name}
      </span>
      <span style="font-weight:600;">₹${item.line_total.toFixed(0)}</span>
    </div>`).join('');

  const walletNote = order.wallet_used > 0 ? `
    <div style="font-size:12px;color:var(--green);margin-top:6px;display:flex;gap:4px;align-items:center;">
      👛 Wallet deducted: ₹${order.wallet_used.toFixed(0)} &nbsp;·&nbsp;
      Cart was: ₹${order.subtotal.toFixed(0)}
    </div>` : '';

  const approveSection = isPending ? `
    <div style="margin-top:12px;padding-top:12px;border-top:1px solid var(--border);">
      <div style="font-size:12px;color:var(--text-muted);margin-bottom:6px;">
        💡 Override final amount if needed (default: ₹${order.final_amount.toFixed(0)}):
      </div>
      <input
        type="number"
        id="override-${order.id}"
        class="override-input"
        placeholder="₹${order.final_amount.toFixed(0)}"
        min="1"
      />
      <div style="display:flex;gap:10px;margin-top:8px;">
        <button class="btn btn-success" style="flex:1;" onclick="approveOrder(${order.id})">
          ✅ Approve
        </button>
        <button class="btn btn-danger" style="flex:1;" onclick="rejectOrder(${order.id})">
          ❌ Reject
        </button>
      </div>
    </div>` : `
    <div style="font-size:12px;color:var(--text-muted);margin-top:10px;padding-top:10px;
      border-top:1px solid var(--border);">
      ${order.approved_amount ? `Final amount: ₹${order.approved_amount.toFixed(0)}` : ''}
      ${order.buyer_reward > 0 ? ` &nbsp;·&nbsp; Reward given: ₹${order.buyer_reward.toFixed(2)}` : ''}
    </div>`;

  // Format date without depending on orders.js
  const dateStr = ownerFormatDate(order.created_at);

  return `
    <div class="pending-card animate-up" id="oc-${order.id}">
      <!-- Card Header -->
      <div style="display:flex;justify-content:space-between;align-items:flex-start;margin-bottom:12px;">
        <div>
          <div style="font-size:16px;font-weight:700;">${order.customer_name}</div>
          <div style="font-size:13px;color:var(--text-muted);margin-top:2px;">
            📱 ${order.customer_phone}
          </div>
          <div style="font-size:11px;color:var(--text-dim);margin-top:2px;">${dateStr}</div>
        </div>
        <div style="text-align:right;">
          ${badge}
          <div style="font-size:14px;font-weight:800;color:var(--orange);margin-top:6px;">
            ${order.order_number}
          </div>
        </div>
      </div>

      <!-- Items -->
      <div style="margin-bottom:8px;">${itemsHtml}</div>

      <!-- Total row -->
      <div style="display:flex;justify-content:space-between;align-items:center;
        padding-top:8px;margin-top:4px;">
        <span style="font-size:13px;color:var(--text-muted);">Total Payable</span>
        <span style="font-size:18px;font-weight:800;color:var(--orange);">
          ₹${order.final_amount.toFixed(0)}
        </span>
      </div>
      ${walletNote}
      ${approveSection}
    </div>`;
}

function ownerFormatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ============================================================
// Approve / Reject
// ============================================================
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
  if (!confirm('Reject this order?\n\nWallet amount (if any) will be refunded to customer.')) return;

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

// ============================================================
// Tab switch
// ============================================================
function ownerSwitchTab(tab) {
  _ownerTab = tab;
  document.getElementById('tab-pending')?.classList.toggle('active', tab === 'pending');
  document.getElementById('tab-all')?.classList.toggle('active', tab === 'all');
  loadOwnerOrders();
}

// ============================================================
// Owner Logout
// ============================================================
function ownerLogout() {
  sessionStorage.removeItem('gc_owner_token');
  _ownerToken = null;
  showToast('Logged out from owner dashboard', 'success');
  navigateTo('home');
}

// ============================================================
// Owner API helper (uses owner token, no AppState dependency)
// ============================================================
async function ownerApi(path, method = 'GET', body = null) {
  const BASE = window.API_BASE || '';
  const opts = {
    method,
    headers: {
      'Content-Type':  'application/json',
      'Authorization': `Bearer ${_ownerToken}`,
    },
  };
  if (body !== null && method !== 'GET') opts.body = JSON.stringify(body);

  let res;
  try {
    res = await fetch(BASE + path, opts);
  } catch {
    throw new Error('Network error. Check your connection.');
  }

  const data = await res.json().catch(() => ({ detail: 'Invalid response from server' }));
  if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
  return data;
}
