// ============================================================
// Grill & Chill — Main App
// Router · State · API · Utilities
// ============================================================

// Set your deployed backend URL here (or via build-time replacement)
window.API_BASE = "https://api.grillchill.in";  // ← Change this

// ============================================================
// API Client
// ============================================================
const api = {
  async request(method, path, body = null) {
    const headers = { 'Content-Type': 'application/json' };
    const token   = AppState.token;
    if (token) headers['Authorization'] = `Bearer ${token}`;

    const opts = { method, headers };
    if (body !== null) opts.body = JSON.stringify(body);

    let res;
    try {
      res = await fetch(window.API_BASE + path, opts);
    } catch {
      throw new Error('Network error. Please check your connection.');
    }

    const data = await res.json().catch(() => ({ detail: 'Invalid server response' }));
    if (!res.ok) throw new Error(data.detail || `Request failed (${res.status})`);
    return data;
  },

  get(path)         { return this.request('GET',    path); },
  post(path, body)  { return this.request('POST',   path, body); },
  put(path, body)   { return this.request('PUT',    path, body); },
  delete(path)      { return this.request('DELETE', path); },
};

// ============================================================
// App State
// ============================================================
const AppState = {
  user:  null,
  token: null,
  cart:  {},

  init() {
    // Restore session
    const savedUser  = localStorage.getItem('gc_user');
    const savedToken = localStorage.getItem('gc_token');
    if (savedUser && savedToken) {
      try {
        this.user  = JSON.parse(savedUser);
        this.token = savedToken;
      } catch { this.clearUser(); }
    }

    // Restore cart
    const savedCart = localStorage.getItem('gc_cart');
    if (savedCart) {
      try { this.cart = JSON.parse(savedCart); } catch { this.cart = {}; }
    }
  },

  setUser(user, token) {
    this.user  = user;
    this.token = token;
    localStorage.setItem('gc_user',  JSON.stringify(user));
    localStorage.setItem('gc_token', token);
  },

  saveUser() {
    if (this.user) localStorage.setItem('gc_user', JSON.stringify(this.user));
  },

  clearUser() {
    this.user  = null;
    this.token = null;
    localStorage.removeItem('gc_user');
    localStorage.removeItem('gc_token');
  },

  saveCart() {
    localStorage.setItem('gc_cart', JSON.stringify(this.cart));
  },

  cartTotals() {
    let totalItems  = 0;
    let totalAmount = 0;
    for (const [, qty] of Object.entries(this.cart)) {
      totalItems += qty;
    }
    // We don't have prices here; home.js / cart.js compute amounts separately
    return { totalItems, totalAmount };
  },
};

// ============================================================
// Router
// ============================================================
const PAGES = ['home', 'cart', 'orders', 'wallet', 'profile', 'auth', 'owner'];

function navigateTo(page) {
  if (!PAGES.includes(page)) page = 'home';

  // Update hash
  window.location.hash = page;

  // Update bottom nav active state (not for auth/owner)
  document.querySelectorAll('.nav-item').forEach(item => {
    item.classList.toggle('active', item.dataset.page === page);
  });

  // Show/hide header and nav for special pages
  const header = document.getElementById('app-header');
  const nav    = document.getElementById('bottom-nav');

  if (page === 'auth' || page === 'owner') {
    header.classList.add('hidden');
    nav.classList.add('hidden');
  } else {
    header.classList.remove('hidden');
    nav.classList.remove('hidden');
  }

  // Update cart nav dot
  updateCartBadge();

  // Render page
  switch (page) {
    case 'home':    renderHomePage();    break;
    case 'cart':    renderCartPage();    break;
    case 'orders':  renderOrdersPage();  break;
    case 'wallet':  renderWalletPage();  break;
    case 'profile': renderProfilePage(); break;
    case 'auth':    renderAuthPage();    break;
    case 'owner':   renderOwnerPage();   break;
    default:        renderHomePage();
  }
}

// ============================================================
// UI Utilities
// ============================================================

let _toastTimer = null;
function showToast(message, type = '') {
  const toast = document.getElementById('toast');
  toast.textContent = message;
  toast.className   = `toast${type ? ' ' + type : ''} show`;

  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => {
    toast.classList.remove('show');
  }, 3000);
}

function setButtonLoading(btn, loading, label) {
  if (!btn) return;
  btn.disabled     = loading;
  btn.textContent  = label;
  btn.style.opacity = loading ? '0.7' : '1';
}

function updateCartBadge() {
  const { totalItems } = AppState.cartTotals();
  const badge    = document.getElementById('cart-count-badge');
  const cartBtn  = document.getElementById('cart-badge-btn');
  const navDot   = document.getElementById('nav-cart-dot');

  if (badge) badge.textContent = totalItems;
  if (cartBtn) cartBtn.classList.toggle('hidden', totalItems === 0);
  if (navDot)  navDot.classList.toggle('hidden', totalItems === 0);
}

function updateHeaderWallet() {
  const walletEl  = document.getElementById('header-wallet');
  const balanceEl = document.getElementById('header-wallet-balance');

  if (AppState.user) {
    walletEl.classList.remove('hidden');
    balanceEl.textContent = `₹${AppState.user.wallet_balance.toFixed(0)}`;
  } else {
    walletEl.classList.add('hidden');
  }
}

// ============================================================
// Global Utilities (available to all pages)
// ============================================================

function formatDate(iso) {
  if (!iso) return '';
  try {
    return new Date(iso).toLocaleString('en-IN', {
      day: '2-digit', month: 'short', year: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  } catch { return iso; }
}

// ============================================================
// App Boot
// ============================================================
document.addEventListener('DOMContentLoaded', () => {
  AppState.init();

  // Determine initial page from hash
  const hash = window.location.hash.replace('#', '') || 'home';
  const page = PAGES.includes(hash) ? hash : 'home';

  // Hide loader after short delay for UX
  setTimeout(() => {
    document.getElementById('global-loader').classList.add('hidden');
    navigateTo(page);
    updateHeaderWallet();
    updateCartBadge();
  }, 600);
});

// Handle back/forward browser navigation
window.addEventListener('hashchange', () => {
  const page = window.location.hash.replace('#', '') || 'home';
  navigateTo(PAGES.includes(page) ? page : 'home');
});
