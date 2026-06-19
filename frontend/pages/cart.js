// ============================================================
// Cart Page
// ============================================================

let _menuCache = null;
let _useWallet = false;

async function renderCartPage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container animate-fade';

  const { totalItems } = AppState.cartTotals();

  if (totalItems === 0) {
    container.innerHTML = `
      <div class="cart-page">
        <div class="cart-empty animate-up">
          <div class="cart-empty-icon">🛒</div>
          <div class="cart-empty-title">Your cart is empty</div>
          <div class="cart-empty-sub">Add some delicious items from the menu</div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('home')">
            Browse Menu
          </button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `<div class="cart-page animate-up" id="cart-root">
    <div style="display:flex;flex-direction:column;gap:0;">
      <div id="cart-items-section"></div>
      <div id="cart-summary-section"></div>
    </div>
  </div>`;

  await buildCartView();
}

async function buildCartView() {
  if (!_menuCache) {
    try {
      _menuCache = await api.get('/products/menu');
    } catch {
      showToast('Could not load product info', 'error');
      return;
    }
  }

  const allProducts = _menuCache.flatMap(c => c.products);
  const productMap  = Object.fromEntries(allProducts.map(p => [p.id, p]));

  const cartEntries = Object.entries(AppState.cart)
    .map(([id, qty]) => ({ product: productMap[parseInt(id)], qty: parseInt(qty) }))
    .filter(e => e.product);

  const subtotal    = cartEntries.reduce((s, e) => s + e.product.price * e.qty, 0);
  const walletBal   = AppState.user ? AppState.user.wallet_balance : 0;
  const walletDeduct = _useWallet ? Math.min(walletBal, subtotal) : 0;
  const payable     = Math.max(0, subtotal - walletDeduct);

  // --- Items ---
  const itemsHtml = cartEntries.map(({ product, qty }) => `
    <div class="cart-item" id="ci-${product.id}">
      <div class="cart-item-info">
        <div class="cart-item-name">${product.name}</div>
        <div class="cart-item-price">₹${product.price} × ${qty}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;">
        <div class="qty-control">
          <button class="qty-btn" onclick="cartChangeQty(${product.id}, -1)">−</button>
          <span class="qty-value" id="cqty-${product.id}">${qty}</span>
          <button class="qty-btn" onclick="cartChangeQty(${product.id}, 1)">+</button>
        </div>
        <div class="cart-item-total">₹${(product.price * qty).toFixed(0)}</div>
      </div>
    </div>`).join('');

  document.getElementById('cart-items-section').innerHTML = `
    <div style="margin-bottom:14px;">
      <div class="section-header" style="padding-bottom:10px;">
        <div class="section-title">Your Cart</div>
        <div class="section-sub">${cartEntries.length} item${cartEntries.length > 1 ? 's' : ''}</div>
      </div>
      <div class="cart-items">${itemsHtml}</div>
    </div>`;

  // --- Wallet Toggle (only when logged in and has balance) ---
  let walletHtml = '';
  if (AppState.user && walletBal > 0) {
    walletHtml = `
      <label class="wallet-toggle" for="wallet-checkbox">
        <div class="wallet-toggle-left">
          <div class="wallet-toggle-label">👛 Use Wallet Balance</div>
          <div class="wallet-toggle-balance">Available: ₹${walletBal.toFixed(2)}</div>
        </div>
        <label class="toggle-switch">
          <input type="checkbox" id="wallet-checkbox" ${_useWallet ? 'checked' : ''}
            onchange="toggleWallet(this.checked)" />
          <span class="toggle-slider"></span>
        </label>
      </label>`;
  }

  // --- Summary ---
  const summaryRows = [
    { label: 'Subtotal', value: `₹${subtotal.toFixed(0)}` },
  ];
  if (_useWallet && walletDeduct > 0) {
    summaryRows.push({ label: '👛 Wallet Discount', value: `− ₹${walletDeduct.toFixed(0)}`, green: true });
  }

  const summaryHtml = summaryRows.map(r => `
    <div class="order-summary-row">
      <span>${r.label}</span>
      <span class="val" style="${r.green ? 'color:var(--green)' : ''}">${r.value}</span>
    </div>`).join('');

  // --- Reward Preview ---
  const rewardPool = subtotal * 0.10;
  const rewardHtml = AppState.user ? `
    <div style="background:rgba(34,197,94,0.07);border:1px solid rgba(34,197,94,0.2);
      border-radius:var(--radius-md);padding:12px 14px;margin-bottom:12px;font-size:13px;color:var(--green);">
      🎁 You'll earn up to <strong>₹${Math.round(rewardPool * 0.75)}</strong> wallet reward on approval!
    </div>` : '';

  // --- Place Order Button ---
  const placeBtn = AppState.user
    ? `<button class="btn btn-primary btn-full" id="place-order-btn" onclick="handlePlaceOrder()">
         Place Order · ₹${payable.toFixed(0)}
       </button>
       <div style="text-align:center;font-size:12px;color:var(--text-muted);margin-top:8px;">
         Pay cash at counter when you pick up 💵
       </div>`
    : `<button class="btn btn-primary btn-full" onclick="navigateTo('auth')">
         Login to Place Order
       </button>`;

  document.getElementById('cart-summary-section').innerHTML = `
    ${walletHtml}
    <div class="order-summary">
      ${summaryHtml}
      <div class="order-summary-row total">
        <span>Total Payable</span>
        <span class="val">₹${payable.toFixed(0)}</span>
      </div>
    </div>
    ${rewardHtml}
    ${placeBtn}
    <div style="height:20px;"></div>`;
}

function cartChangeQty(productId, delta) {
  const current = AppState.cart[productId] || 0;
  const newQty  = current + delta;

  if (newQty <= 0) {
    delete AppState.cart[productId];
  } else {
    AppState.cart[productId] = newQty;
  }

  AppState.saveCart();
  updateCartBadge();

  const { totalItems } = AppState.cartTotals();
  if (totalItems === 0) {
    renderCartPage();
  } else {
    buildCartView();
  }
}

function toggleWallet(checked) {
  _useWallet = checked;
  buildCartView();
}

async function handlePlaceOrder() {
  if (!AppState.user) { navigateTo('auth'); return; }

  const { totalItems } = AppState.cartTotals();
  if (totalItems === 0) { showToast('Cart is empty', 'error'); return; }

  const items = Object.entries(AppState.cart).map(([product_id, quantity]) => ({
    product_id: parseInt(product_id),
    quantity: parseInt(quantity),
  }));

  const btn = document.getElementById('place-order-btn');
  if (btn) setButtonLoading(btn, true, 'Placing order…');

  try {
    const order = await api.post('/orders/', {
      items,
      use_wallet: _useWallet,
    });

    // Clear cart
    AppState.cart = {};
    AppState.saveCart();
    _useWallet = false;
    updateCartBadge();

    // Refresh wallet balance
    if (order.wallet_used > 0 && AppState.user) {
      AppState.user.wallet_balance = Math.max(0, AppState.user.wallet_balance - order.wallet_used);
      AppState.saveUser();
      updateHeaderWallet();
    }

    showToast(`Order ${order.order_number} placed! 🎉`, 'success');
    navigateTo('orders');
  } catch (err) {
    showToast(err.message || 'Could not place order', 'error');
    if (btn) setButtonLoading(btn, false, `Place Order`);
  }
}
