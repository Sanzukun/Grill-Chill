// ============================================================
// Home / Menu Page
// ============================================================

let _menuData = [];
let _activeCategory = 'all';

async function renderHomePage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container animate-fade';

  container.innerHTML = `
    <div id="menu-root">
      <div class="menu-hero animate-up">
        <div class="menu-hero-title">What are you craving?</div>
        <div class="menu-hero-sub">Fresh food, made with love 🧡</div>
        <div class="menu-hero-tag">📍 Cafe on Street, Kulti</div>
      </div>

      <div id="category-pills" style="margin-bottom:16px;"></div>
      <div id="menu-sections"></div>
      <div style="height:80px;"></div>
    </div>
    <div id="floating-cart-bar" class="floating-cart hidden" onclick="navigateTo('cart')">
      <div class="floating-cart-left">
        <div class="floating-cart-count" id="fc-count">0 items</div>
        <div class="floating-cart-label">View Cart</div>
      </div>
      <div class="floating-cart-amount" id="fc-amount">₹0</div>
    </div>
  `;

  await loadMenu();
  updateFloatingCart();
}

async function loadMenu() {
  try {
    const categories = await api.get('/products/menu');
    _menuData = categories;
    renderCategoryPills(categories);
    renderMenuSections(categories);
  } catch (err) {
    document.getElementById('menu-sections').innerHTML = `
      <div class="empty-state">
        <div class="empty-state-icon">⚠️</div>
        <div class="empty-state-title">Could not load menu</div>
        <div class="empty-state-sub">Please check your connection and try again</div>
        <button class="btn btn-ghost" style="margin-top:12px;" onclick="loadMenu()">Retry</button>
      </div>`;
  }
}

function renderCategoryPills(categories) {
  const el = document.getElementById('category-pills');
  if (!el) return;

  const pills = [`<div class="cat-pill ${_activeCategory === 'all' ? 'active' : ''}"
    onclick="filterCategory('all')">All</div>`];

  categories.forEach(cat => {
    pills.push(`<div class="cat-pill ${_activeCategory === cat.id ? 'active' : ''}"
      onclick="filterCategory(${cat.id})">${cat.name}</div>`);
  });

  el.innerHTML = `<div class="category-scroll">${pills.join('')}</div>`;
}

function renderMenuSections(categories) {
  const el = document.getElementById('menu-sections');
  if (!el) return;

  const filtered = _activeCategory === 'all'
    ? categories
    : categories.filter(c => c.id === _activeCategory);

  if (!filtered.length || filtered.every(c => !c.products.length)) {
    el.innerHTML = `<div class="empty-state">
      <div class="empty-state-icon">🍽️</div>
      <div class="empty-state-title">Nothing here yet</div>
    </div>`;
    return;
  }

  el.innerHTML = filtered.map(cat => {
    if (!cat.products.length) return '';
    return `
      <div class="menu-category" id="cat-section-${cat.id}">
        <div class="menu-cat-title">${cat.name}</div>
        ${cat.products.map(p => renderProductCard(p)).join('')}
      </div>`;
  }).join('');
}

function renderProductCard(product) {
  const qty = AppState.cart[product.id] || 0;
  const inCart = qty > 0;

  return `
    <div class="product-card ${inCart ? 'in-cart' : ''}" id="pc-${product.id}">
      <div class="product-info">
        <div class="product-name">${product.name}</div>
        <div class="product-price">₹${product.price}</div>
      </div>
      <div>
        ${inCart
          ? `<div class="qty-control">
               <button class="qty-btn" onclick="changeQty(${product.id}, -1)">−</button>
               <span class="qty-value" id="qty-${product.id}">${qty}</span>
               <button class="qty-btn" onclick="changeQty(${product.id}, 1)">+</button>
             </div>`
          : `<button class="add-btn" onclick="changeQty(${product.id}, 1)">ADD</button>`
        }
      </div>
    </div>`;
}

function filterCategory(catId) {
  _activeCategory = catId;
  renderCategoryPills(_menuData);
  renderMenuSections(_menuData);
}

function changeQty(productId, delta) {
  const current = AppState.cart[productId] || 0;
  const newQty  = current + delta;

  if (newQty <= 0) {
    delete AppState.cart[productId];
  } else {
    AppState.cart[productId] = newQty;
  }

  AppState.saveCart();
  refreshProductCard(productId);
  updateFloatingCart();
  updateCartBadge();
}

function refreshProductCard(productId) {
  const allProducts = _menuData.flatMap(c => c.products);
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const el = document.getElementById(`pc-${productId}`);
  if (!el) return;

  el.outerHTML = renderProductCard(product);
}

function updateFloatingCart() {
  const bar    = document.getElementById('floating-cart-bar');
  const fcCount = document.getElementById('fc-count');
  const fcAmt   = document.getElementById('fc-amount');
  if (!bar) return;

  const { totalItems, totalAmount } = AppState.cartTotals();

  if (totalItems === 0) {
    bar.classList.add('hidden');
  } else {
    bar.classList.remove('hidden');
    fcCount.textContent = `${totalItems} item${totalItems > 1 ? 's' : ''}`;
    fcAmt.textContent   = `₹${totalAmount}`;
  }
}
