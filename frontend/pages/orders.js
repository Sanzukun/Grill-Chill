// ============================================================
// Orders Page
// ============================================================

async function renderOrdersPage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container animate-fade';

  if (!AppState.user) {
    container.innerHTML = `
      <div class="orders-page">
        <div class="empty-state animate-up">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">Login to view orders</div>
          <div class="empty-state-sub">Your order history will appear here</div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('auth')">
            Login
          </button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="orders-page">
      <div style="text-align:center;padding:40px 0;color:var(--text-muted);">
        <div style="font-size:28px;">⏳</div>
        <div style="margin-top:8px;font-size:14px;">Loading your orders…</div>
      </div>
    </div>`;

  try {
    const orders = await api.get('/orders/');
    renderOrdersList(orders);
  } catch (err) {
    container.innerHTML = `
      <div class="orders-page">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Could not load orders</div>
          <button class="btn btn-ghost" style="margin-top:12px;" onclick="renderOrdersPage()">Retry</button>
        </div>
      </div>`;
  }
}

function renderOrdersList(orders) {
  const container = document.getElementById('page-container');

  if (!orders.length) {
    container.innerHTML = `
      <div class="orders-page">
        <div class="empty-state animate-up">
          <div class="empty-state-icon">📋</div>
          <div class="empty-state-title">No orders yet</div>
          <div class="empty-state-sub">Your orders will appear here after you place one</div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('home')">
            Order Now
          </button>
        </div>
      </div>`;
    return;
  }

  const cardsHtml = orders.map(order => renderOrderCard(order)).join('');

  container.innerHTML = `
    <div class="orders-page animate-up">
      <div class="section-header" style="padding-bottom:16px;">
        <div class="section-title">Your Orders</div>
        <div class="section-sub">${orders.length} total</div>
      </div>
      ${cardsHtml}
      <div style="height:16px;"></div>
    </div>`;
}

function renderOrderCard(order) {
  const badge = statusBadge(order.status);
  const date  = formatDate(order.created_at);

  const itemsHtml = order.items
    ? order.items.map(item => `
        <div class="order-item-row">
          <span class="order-item-name">${item.product_name} × ${item.quantity}</span>
          <span class="order-item-price">₹${item.line_total.toFixed(0)}</span>
        </div>`).join('')
    : '';

  const walletRow = order.wallet_used > 0
    ? `<div class="order-total-row">
         <span style="color:var(--text-muted);">Wallet Used</span>
         <span style="color:var(--green);">− ₹${order.wallet_used.toFixed(0)}</span>
       </div>` : '';

  const approvedRow = order.approved_amount && order.status === 'approved'
    ? `<div class="order-total-row">
         <span style="color:var(--text-muted);">Amount Paid</span>
         <span style="color:var(--orange);">₹${order.approved_amount.toFixed(0)}</span>
       </div>` : '';

  const rewardHtml = order.buyer_reward > 0
    ? `<div class="reward-earned">
         🎁 You earned <strong>₹${order.buyer_reward.toFixed(2)}</strong> wallet reward!
       </div>` : '';

  return `
    <div class="order-card">
      <div class="order-card-header">
        <div>
          <div class="order-number">${order.order_number}</div>
          <div class="order-date">${date}</div>
        </div>
        ${badge}
      </div>

      ${itemsHtml ? `<div class="order-items-list">${itemsHtml}</div>` : ''}

      <div class="order-totals">
        <div class="order-total-row">
          <span style="color:var(--text-muted);">Subtotal</span>
          <span>₹${order.subtotal.toFixed(0)}</span>
        </div>
        ${walletRow}
        ${approvedRow}
        <div class="order-total-row main">
          <span>Total</span>
          <span style="color:var(--orange);">₹${(order.approved_amount || order.final_amount).toFixed(0)}</span>
        </div>
      </div>

      ${rewardHtml}

      ${order.status === 'pending'
        ? `<div style="margin-top:10px;font-size:12px;color:var(--yellow);display:flex;align-items:center;gap:6px;">
             ⏳ Waiting for owner approval · Pay cash at counter
           </div>`
        : ''}
      ${order.status === 'rejected'
        ? `<div style="margin-top:10px;font-size:12px;color:var(--red);display:flex;align-items:center;gap:6px;">
             ❌ Order was rejected${order.wallet_used > 0 ? ' · Wallet balance refunded' : ''}
           </div>`
        : ''}
    </div>`;
}

function statusBadge(status) {
  const map = {
    pending:  `<span class="badge badge-pending">⏳ Pending</span>`,
    approved: `<span class="badge badge-approved">✅ Approved</span>`,
    rejected: `<span class="badge badge-rejected">❌ Rejected</span>`,
  };
  return map[status] || `<span class="badge">${status}</span>`;
}

function formatDate(iso) {
  if (!iso) return '';
  const d = new Date(iso);
  return d.toLocaleDateString('en-IN', {
    day: '2-digit', month: 'short', year: 'numeric',
    hour: '2-digit', minute: '2-digit',
  });
}
