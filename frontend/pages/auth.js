// ============================================================
// Auth Page — Login & Register
// ============================================================

function renderAuthPage() {
  const container = document.getElementById('page-container');
  container.className = 'page-container no-header no-nav';

  container.innerHTML = `
    <div class="auth-page animate-fade">
      <div class="auth-hero">
        <span class="auth-flame">🔥</span>
        <div class="auth-title">Grill &amp; Chill</div>
        <div class="auth-subtitle">Cafe on Street, Kulti</div>
      </div>

      <div style="padding: 24px 16px 0;">
        <div class="auth-tabs" style="margin: 0 0 24px;">
          <div class="auth-tab active" id="tab-login" onclick="switchAuthTab('login')">Login</div>
          <div class="auth-tab" id="tab-register" onclick="switchAuthTab('register')">Sign Up</div>
        </div>

        <!-- Login Form -->
        <div id="form-login">
          <div class="auth-form" style="padding: 0;">
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="login-phone" class="form-control"
                placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrapper">
                <input type="password" id="login-password" class="form-control"
                  placeholder="Your password" />
                <span class="input-toggle" onclick="togglePassword('login-password', this)">👁️</span>
              </div>
            </div>
            <button class="btn btn-primary btn-full" onclick="handleLogin()" style="margin-top:8px;">
              Login
            </button>
            <div style="text-align:center; font-size:13px; color:var(--text-muted); margin-top:12px;">
              New here? <span style="color:var(--orange);cursor:pointer;font-weight:600;"
                onclick="switchAuthTab('register')">Create an account →</span>
            </div>
          </div>
        </div>

        <!-- Register Form -->
        <div id="form-register" class="hidden">
          <div class="auth-form" style="padding: 0;">
            <div class="form-group">
              <label class="form-label">Full Name</label>
              <input type="text" id="reg-name" class="form-control"
                placeholder="Your full name" autocomplete="name" />
            </div>
            <div class="form-group">
              <label class="form-label">Phone Number</label>
              <input type="tel" id="reg-phone" class="form-control"
                placeholder="10-digit mobile number" maxlength="10" inputmode="numeric" />
            </div>
            <div class="form-group">
              <label class="form-label">Password</label>
              <div class="input-wrapper">
                <input type="password" id="reg-password" class="form-control"
                  placeholder="Min. 6 characters" />
                <span class="input-toggle" onclick="togglePassword('reg-password', this)">👁️</span>
              </div>
            </div>
            <div class="form-group">
              <label class="form-label">Referral Code <span style="color:var(--text-dim)">(Optional)</span></label>
              <input type="text" id="reg-referral" class="form-control"
                placeholder="e.g. GC12345" style="text-transform:uppercase;" />
            </div>
            <button class="btn btn-primary btn-full" onclick="handleRegister()" style="margin-top:8px;">
              Create Account
            </button>
            <div style="text-align:center; font-size:13px; color:var(--text-muted); margin-top:12px;">
              Already have an account? <span style="color:var(--orange);cursor:pointer;font-weight:600;"
                onclick="switchAuthTab('login')">Login →</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  `;
}

function switchAuthTab(tab) {
  const loginTab    = document.getElementById('tab-login');
  const registerTab = document.getElementById('tab-register');
  const formLogin   = document.getElementById('form-login');
  const formReg     = document.getElementById('form-register');

  if (tab === 'login') {
    loginTab.classList.add('active');
    registerTab.classList.remove('active');
    formLogin.classList.remove('hidden');
    formReg.classList.add('hidden');
  } else {
    registerTab.classList.add('active');
    loginTab.classList.remove('active');
    formReg.classList.remove('hidden');
    formLogin.classList.add('hidden');
  }
}

function togglePassword(inputId, icon) {
  const input = document.getElementById(inputId);
  if (input.type === 'password') {
    input.type = 'text';
    icon.textContent = '🙈';
  } else {
    input.type = 'password';
    icon.textContent = '👁️';
  }
}

async function handleLogin() {
  const phone    = document.getElementById('login-phone').value.trim();
  const password = document.getElementById('login-password').value;

  if (!phone || !password) {
    showToast('Please fill in all fields', 'error');
    return;
  }

  const btn = document.querySelector('#form-login .btn-primary');
  setButtonLoading(btn, true, 'Logging in…');

  try {
    const data = await api.post('/auth/login', { phone, password });
    AppState.setUser(data.user, data.token);
    showToast('Welcome back! 🔥', 'success');
    navigateTo('home');
  } catch (err) {
    showToast(err.message || 'Login failed', 'error');
  } finally {
    setButtonLoading(btn, false, 'Login');
  }
}

async function handleRegister() {
  const full_name     = document.getElementById('reg-name').value.trim();
  const phone         = document.getElementById('reg-phone').value.trim();
  const password      = document.getElementById('reg-password').value;
  const referral_code = document.getElementById('reg-referral').value.trim().toUpperCase();

  if (!full_name || !phone || !password) {
    showToast('Please fill in all required fields', 'error');
    return;
  }

  const btn = document.querySelector('#form-register .btn-primary');
  setButtonLoading(btn, true, 'Creating account…');

  const payload = { full_name, phone, password };
  if (referral_code) payload.referral_code = referral_code;

  try {
    const data = await api.post('/auth/register', payload);
    AppState.setUser(data.user, data.token);
    showToast('Account created! Welcome to Grill & Chill 🔥', 'success');
    navigateTo('home');
  } catch (err) {
    showToast(err.message || 'Registration failed', 'error');
  } finally {
    setButtonLoading(btn, false, 'Create Account');
  }
}
