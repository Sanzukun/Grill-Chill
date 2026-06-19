// ============================================================
// Profile Page
// ============================================================

async function renderProfilePage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container animate-fade';

  if (!AppState.user) {
    container.innerHTML = `
      <div class="profile-page">
        <div class="empty-state animate-up">
          <div class="empty-state-icon">👤</div>
          <div class="empty-state-title">You're not logged in</div>
          <div class="empty-state-sub">Login to view your profile</div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('auth')">
            Login
          </button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="profile-page">
      <div style="text-align:center;padding:40px 0;color:var(--text-muted);">
        <div style="font-size:28px;">⏳</div>
        <div style="margin-top:8px;font-size:14px;">Loading profile…</div>
      </div>
    </div>`;

  try {
    const profile = await api.get('/users/me');
    renderProfileView(profile);
  } catch (err) {
    container.innerHTML = `
      <div class="profile-page">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Could not load profile</div>
          <button class="btn btn-ghost" style="margin-top:12px;" onclick="renderProfilePage()">Retry</button>
        </div>
      </div>`;
  }
}

function renderProfileView(profile) {
  const container = document.getElementById('page-container');
  const initials  = profile.full_name.charAt(0).toUpperCase();
  const joined    = new Date(profile.created_at).toLocaleDateString('en-IN', {
    day: '2-digit', month: 'long', year: 'numeric',
  });

  // Keep local user data in sync
  if (AppState.user) {
    AppState.user.wallet_balance = profile.wallet_balance;
    AppState.saveUser();
    updateHeaderWallet();
  }

  container.innerHTML = `
    <div class="profile-page animate-up">

      <!-- Hero -->
      <div class="profile-hero">
        <div class="profile-avatar">${initials}</div>
        <div class="profile-name">${profile.full_name}</div>
        <div class="profile-phone">📱 ${profile.phone}</div>
        <div style="font-size:12px;color:var(--text-dim);margin-top:4px;">Member since ${joined}</div>

        <!-- Referral Code -->
        <div class="referral-box" onclick="copyReferralCode('${profile.referral_code}')">
          <div class="referral-label">Your Referral Code</div>
          <div class="referral-code">${profile.referral_code}</div>
          <div class="referral-hint">Tap to copy &amp; share 👆</div>
        </div>
      </div>

      <!-- Stats -->
      <div class="stats-grid">
        <div class="stat-card">
          <div class="stat-value">${profile.total_orders}</div>
          <div class="stat-label">Orders</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">${profile.total_referrals}</div>
          <div class="stat-label">Referrals</div>
        </div>
        <div class="stat-card">
          <div class="stat-value">₹${profile.lifetime_earnings.toFixed(0)}</div>
          <div class="stat-label">Earned</div>
        </div>
      </div>

      <!-- Wallet Balance -->
      <div class="card" style="margin-bottom:16px;cursor:pointer;" onclick="navigateTo('wallet')">
        <div style="display:flex;justify-content:space-between;align-items:center;">
          <div>
            <div style="font-size:13px;color:var(--text-muted);font-weight:500;">Wallet Balance</div>
            <div style="font-size:24px;font-weight:800;color:var(--green);margin-top:2px;">
              ₹${profile.wallet_balance.toFixed(2)}
            </div>
          </div>
          <div style="font-size:32px;opacity:0.6;">👛</div>
        </div>
        <div style="font-size:12px;color:var(--text-muted);margin-top:8px;">
          Tap to view full transaction history →
        </div>
      </div>

      <!-- Share referral -->
      <button class="btn btn-ghost btn-full" style="margin-bottom:10px;"
        onclick="shareReferral('${profile.referral_code}', '${profile.full_name}')">
        🔗 Share Referral Code
      </button>

      <!-- Logout -->
      <button class="btn btn-danger btn-full" onclick="handleLogout()">
        🚪 Logout
      </button>

      <div style="height:20px;"></div>
    </div>`;
}

function copyReferralCode(code) {
  navigator.clipboard.writeText(code).then(() => {
    showToast(`Copied ${code} to clipboard! 📋`, 'success');
  }).catch(() => {
    showToast(`Your code: ${code}`, 'success');
  });
}

function shareReferral(code, name) {
  const text = `Hey! Join me on Grill & Chill — the best cafe in Kulti! 🔥\nUse my referral code: ${code} to get started.\nOrder food & earn wallet rewards on every purchase! 🍕`;

  if (navigator.share) {
    navigator.share({ title: 'Grill & Chill', text }).catch(() => {});
  } else {
    navigator.clipboard.writeText(text).then(() => {
      showToast('Referral message copied! 📋', 'success');
    });
  }
}

async function handleLogout() {
  const confirmed = confirm('Are you sure you want to logout?');
  if (!confirmed) return;

  try {
    await api.post('/auth/logout', {});
  } catch (_) {
    // ignore errors — clear session regardless
  }

  AppState.clearUser();
  updateHeaderWallet();
  updateCartBadge();
  showToast('Logged out successfully', 'success');
  navigateTo('home');
}
