// ============================================================
// Wallet Page
// ============================================================

async function renderWalletPage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container animate-fade';

  if (!AppState.user) {
    container.innerHTML = `
      <div class="wallet-page">
        <div class="empty-state animate-up">
          <div class="empty-state-icon">👛</div>
          <div class="empty-state-title">Login to view wallet</div>
          <div class="empty-state-sub">Earn rewards on every order</div>
          <button class="btn btn-primary" style="margin-top:16px;" onclick="navigateTo('auth')">
            Login
          </button>
        </div>
      </div>`;
    return;
  }

  container.innerHTML = `
    <div class="wallet-page">
      <div style="text-align:center;padding:40px 0;color:var(--text-muted);">
        <div style="font-size:28px;">⏳</div>
        <div style="margin-top:8px;font-size:14px;">Loading wallet…</div>
      </div>
    </div>`;

  try {
    const data = await api.get('/wallet/');
    renderWalletView(data);
  } catch (err) {
    container.innerHTML = `
      <div class="wallet-page">
        <div class="empty-state">
          <div class="empty-state-icon">⚠️</div>
          <div class="empty-state-title">Could not load wallet</div>
          <button class="btn btn-ghost" style="margin-top:12px;" onclick="renderWalletPage()">Retry</button>
        </div>
      </div>`;
  }
}

function renderWalletView(data) {
  const container = document.getElementById('page-container');
  const { balance, transactions } = data;

  // Update stored user balance
  if (AppState.user) {
    AppState.user.wallet_balance = balance;
    AppState.saveUser();
    updateHeaderWallet();
  }

  const txnHtml = transactions.length
    ? transactions.map(t => renderTxnCard(t)).join('')
    : `<div class="empty-state" style="padding:40px 0;">
         <div class="empty-state-icon">💸</div>
         <div class="empty-state-title">No transactions yet</div>
         <div class="empty-state-sub">Place an order to start earning rewards</div>
       </div>`;

  container.innerHTML = `
    <div class="wallet-page animate-up">

      <!-- Balance Card -->
      <div class="wallet-balance-card">
        <div class="wallet-balance-label">Wallet Balance</div>
        <div class="wallet-balance-amount">₹${balance.toFixed(2)}</div>
        <div class="wallet-balance-sub">Earn 10% cashback on every approved order 🎁</div>
      </div>

      <!-- How it works -->
      <div class="card" style="margin-bottom:20px;">
        <div style="font-size:14px;font-weight:700;margin-bottom:10px;">How Rewards Work</div>
        <div style="font-size:13px;color:var(--text-muted);line-height:1.7;">
          🛒 Place an order · get <strong style="color:var(--orange);">7.5% back</strong><br>
          👥 Refer a friend · earn <strong style="color:var(--orange);">2.5%</strong> of their every order<br>
          ✅ Rewards credited after owner approval<br>
          👛 Use wallet to reduce your next bill
        </div>
      </div>

      <!-- Transactions -->
      <div class="section-header" style="padding: 0 0 12px;">
        <div class="section-title">Transaction History</div>
        <div class="section-sub">${transactions.length} records</div>
      </div>
      ${txnHtml}

      <div style="height:16px;"></div>
    </div>`;
}

function renderTxnCard(txn) {
  const isCredit = txn.transaction_type === 'credit';
  const icon     = isCredit ? '⬆️' : '⬇️';
  const sign     = isCredit ? '+' : '−';
  const label    = txnLabel(txn.reason);
  const date     = formatDate(txn.created_at);

  return `
    <div class="txn-card">
      <div class="txn-icon ${isCredit ? 'credit' : 'debit'}">${icon}</div>
      <div class="txn-info">
        <div class="txn-note">${txn.note || label}</div>
        <div class="txn-date">${date} · Bal: ₹${txn.balance_after.toFixed(2)}</div>
      </div>
      <div class="txn-amount ${isCredit ? 'credit' : 'debit'}">
        ${sign}₹${txn.amount.toFixed(2)}
      </div>
    </div>`;
}

function txnLabel(reason) {
  const map = {
    referral_buyer:    '🎁 Order Reward',
    referral_referrer: '👥 Referral Reward',
    order_redemption:  '👛 Wallet Redeemed',
    manual_credit:     '💳 Refund',
  };
  return map[reason] || reason;
}
