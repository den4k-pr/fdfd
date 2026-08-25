// auth.js

const API_URL = 'https://umaw4x5a1k.execute-api.eu-central-1.amazonaws.com/prod/user-data';

// Initialize or load persistent ID from localStorage
let USER_ID = (function () {
  let id;
  try {
    id = localStorage.getItem('sbf-uid');
  } catch (e) {
    console.warn('[Auth] LocalStorage is not accessible.');
  }
  if (!id) {
    id = 'anon-' + Math.random().toString(36).substring(2) + '-' + Date.now();
    try { localStorage.setItem('sbf-uid', id); } catch (e) {}
  }
  return id;
})();

// Стан флоу відновлення паролю
let _resetEmail   = '';
let _verifiedCode = '';

// ─── FORM MESSAGE HELPERS ────────────────────────────────────────────────────

function showFormMessage(formId, message, type) {
  const container = document.getElementById(formId);
  if (!container) return;

  let msg = container.querySelector('.sbf-form-msg');
  if (!msg) {
    msg = document.createElement('div');
    msg.className = 'sbf-form-msg';
    container.appendChild(msg);
  }

  const baseStyles = 'margin-top:12px; padding:11px 15px; border-radius:10px; font-size:13.5px; font-weight:600; line-height:1.45; display:block; opacity:1; transition:opacity 0.25s ease-in-out;';

  const palette = {
    error:   'background:rgba(255,60,60,0.12); color:#ff6b6b; border:1px solid rgba(255,60,60,0.3);',
    success: 'background:rgba(80,255,120,0.1); color:#5dde7a; border:1px solid rgba(80,255,120,0.3);',
    loading: 'background:rgba(200,200,255,0.07); color:#9999cc; border:1px solid rgba(200,200,255,0.18);',
  };

  msg.style.cssText = baseStyles + (palette[type] || palette.error);
  msg.textContent   = message;

  if (type === 'success') {
    clearTimeout(msg._hideTimeout);
    msg._hideTimeout = setTimeout(() => {
      msg.style.opacity = '0';
      setTimeout(() => { if (msg) msg.style.display = 'none'; }, 280);
    }, 4500);
  }
}

function clearFormMessage(formId) {
  const container = document.getElementById(formId);
  if (!container) return;
  const msg = container.querySelector('.sbf-form-msg');
  if (msg) { msg.style.display = 'none'; msg.textContent = ''; }
}

function setButtonLoading(buttonId, isLoading, defaultLabel) {
  const button = document.getElementById(buttonId);
  if (!button) return;
  button.disabled     = isLoading;
  button.textContent  = isLoading ? 'Please wait...' : defaultLabel;
  button.style.opacity = isLoading ? '0.55' : '1';
  button.style.cursor  = isLoading ? 'not-allowed' : 'pointer';
}

// ─── TRACKER WRAPPERS ────────────────────────────────────────────────────────
// Ці функції використовують apiCall з main.js який повертає data напряму або null

async function apiLoadUserData() {
  const data = await apiCall('get_user_data', {});
  return data || null;
}

async function apiSaveDay(day, kcal, water) {
  await apiCall('save_day', { day, kcal: parseInt(kcal) || null, water: parseInt(water) || 0 });
}

async function apiSaveSettings(kcalTarget, waterGoal) {
  await apiCall('save_settings', { kcal_target: kcalTarget, water_goal: waterGoal });
}

async function apiSaveMeal(mealObject) {
  await apiCall('save_meal', { meal: mealObject });
}

async function apiDeleteMeal(mealId) {
  await apiCall('delete_meal', { meal_id: mealId });
}

// ─── AUTHENTICATION MODAL LOGIC ──────────────────────────────────────────────

function toggleAuthModal(viewName) {
  const modal = document.getElementById('auth-modal');
  if (!modal) return;

  modal.classList.remove('hide');

  const views = ['login', 'register', 'forgot', 'verify', 'reset'];
  views.forEach(view => {
    const el = document.getElementById('auth-view-' + view);
    if (el) el.classList.add('hide');
    clearFormMessage('auth-view-' + view);
  });

  const target = document.getElementById('auth-view-' + viewName);
  if (target) target.classList.remove('hide');
}

function updateAuthUI() {
  let token = null;
  let email = null;

  try {
    token = localStorage.getItem('sbf-token');
    email = localStorage.getItem('sbf-user-email');
  } catch (e) {}

  const statusDot    = document.getElementById('user-status-dot');
  const statusText   = document.getElementById('user-status-text');
  const logoutButton = document.getElementById('nav-logout-btn');
  const modal        = document.getElementById('auth-modal');

  if (token && email) {
    if (statusDot)    statusDot.className   = 'dot';
    if (statusText)   statusText.innerText  = 'Logged in as: ' + email;
    if (logoutButton) logoutButton.classList.remove('hide');
    if (modal)        modal.classList.add('hide');
  } else {
    if (statusDot)    statusDot.className   = 'dot anon';
    if (statusText)   statusText.innerText  = 'Authentication required';
    if (logoutButton) logoutButton.classList.add('hide');
    toggleAuthModal('login');
  }
}

function saveAuthState(data) {
  if (!data || !data.accessToken || !data.user) {
    console.error('[saveAuthState] Invalid data:', data);
    return;
  }

  try {
    localStorage.setItem('sbf-token',      data.accessToken);
    localStorage.setItem('sbf-user-email', data.user.email);
    localStorage.setItem('sbf-uid',        data.user.id);
  } catch (e) {
    console.error('[saveAuthState] localStorage error:', e);
  }

  USER_ID = data.user.id;
  updateAuthUI();
  loadAndRenderUserData();
}

async function loadAndRenderUserData() {
  console.log('[App] Fetching user data...');
  const data = await apiLoadUserData();

  if (data) {
    console.log(`[App] Loaded. Days: ${Object.keys(data.days || {}).length}, Meals: ${(data.meals || []).length}`);
    if (typeof initApp === 'function') initApp(data);
  } else {
    console.warn('[App] Failed to fetch user data.');
  }
}

// ─── AUTHENTICATION SUBMISSIONS ──────────────────────────────────────────────
//
// ВАЖЛИВО: apiCall з main.js повертає json.data напряму або null при помилці.
// Тому НЕ перевіряємо result.ok — перевіряємо конкретні поля які очікуємо.

async function submitRegister() {
  const formId = 'auth-view-register';
  const email    = (document.getElementById('register-email')    || {}).value?.trim() || '';
  const password = (document.getElementById('register-password') || {}).value?.trim() || '';

  clearFormMessage(formId);

  if (!email)                                    { showFormMessage(formId, 'Please enter your email address.', 'error');    return; }
  if (!email.includes('@') || !email.includes('.')) { showFormMessage(formId, 'Please enter a valid email address.', 'error'); return; }
  if (!password)                                 { showFormMessage(formId, 'Please enter a password.', 'error');            return; }
  if (password.length < 6)                       { showFormMessage(formId, 'Password must be at least 6 characters.', 'error'); return; }

  setButtonLoading('register-submit-btn', true, 'Sign Up');
  showFormMessage(formId, 'Creating your account...', 'loading');

  // apiCall повертає data або null
  const data = await apiCall('auth_register', { email, password });

  setButtonLoading('register-submit-btn', false, 'Sign Up');

  // data = { success, accessToken, user } або null
  if (!data || !data.accessToken) {
    showFormMessage(formId, 'Registration failed. Please try again.', 'error');
    return;
  }

  showFormMessage(formId, 'Account created! Signing you in...', 'success');
  setTimeout(() => saveAuthState(data), 900);
}

async function submitLogin() {
  const formId = 'auth-view-login';
  const email    = (document.getElementById('login-email')    || {}).value?.trim() || '';
  const password = (document.getElementById('login-password') || {}).value?.trim() || '';

  clearFormMessage(formId);

  if (!email)    { showFormMessage(formId, 'Please enter your email address.', 'error'); return; }
  if (!password) { showFormMessage(formId, 'Please enter your password.', 'error');      return; }

  setButtonLoading('login-submit-btn', true, 'Sign In');
  showFormMessage(formId, 'Authenticating...', 'loading');

  // apiCall повертає data або null
  const data = await apiCall('auth_login', { email, password });

  setButtonLoading('login-submit-btn', false, 'Sign In');

  // data = { success, accessToken, user } або null
  if (!data || !data.accessToken) {
    showFormMessage(formId, 'Login failed. Please verify your credentials.', 'error');
    return;
  }

  showFormMessage(formId, 'Welcome back! Loading your dashboard...', 'success');
  setTimeout(() => saveAuthState(data), 700);
}

// КРОК 1: вводимо email → надсилаємо код
async function submitForgotPassword() {
  const formId = 'auth-view-forgot';
  const email  = (document.getElementById('forgot-email') || {}).value?.trim() || '';

  clearFormMessage(formId);

  if (!email)                                    { showFormMessage(formId, 'Please enter your email address.', 'error');    return; }
  if (!email.includes('@') || !email.includes('.')) { showFormMessage(formId, 'Please enter a valid email address.', 'error'); return; }

  setButtonLoading('forgot-submit-btn', true, 'Send Code');
  showFormMessage(formId, 'Sending verification code...', 'loading');

  // apiCall повертає data або null
  // data = { success: true, message: '...' }
  const data = await apiCall('auth_forgot_password', { email });

  setButtonLoading('forgot-submit-btn', false, 'Send Code');

  if (!data || !data.success) {
    showFormMessage(formId, 'An error occurred. Please try again.', 'error');
    return;
  }

  _resetEmail = email;

  showFormMessage(formId, 'Code sent! Check your inbox.', 'success');
  setTimeout(() => {
    const hint = document.getElementById('verify-email-hint');
    if (hint) hint.textContent = email;
    toggleAuthModal('verify');
  }, 800);
}

// КРОК 2: вводимо 6-значний код
async function submitVerifyCode() {
  const formId = 'auth-view-verify';
  const code   = (document.getElementById('verify-code-input') || {}).value?.trim() || '';

  clearFormMessage(formId);

  if (!_resetEmail) {
    showFormMessage(formId, 'Session expired. Please start over.', 'error');
    setTimeout(() => toggleAuthModal('forgot'), 2000);
    return;
  }

  if (!code)              { showFormMessage(formId, 'Please enter the verification code.', 'error'); return; }
  if (!/^\d{6}$/.test(code)) { showFormMessage(formId, 'Code must be exactly 6 digits.', 'error');  return; }

  setButtonLoading('verify-submit-btn', true, 'Verify Code');
  showFormMessage(formId, 'Verifying code...', 'loading');

  // apiCall повертає data або null
  // data = { success: true, verified: true }
  const data = await apiCall('auth_verify_code', { email: _resetEmail, code });

  setButtonLoading('verify-submit-btn', false, 'Verify Code');

  if (!data || !data.verified) {
    showFormMessage(formId, 'Invalid or expired code. Please try again.', 'error');
    return;
  }

  _verifiedCode = code;

  showFormMessage(formId, 'Code verified! Set your new password.', 'success');
  setTimeout(() => toggleAuthModal('reset'), 800);
}

// КРОК 3: встановлюємо новий пароль
async function submitResetPassword() {
  const formId      = 'auth-view-reset';
  const newPassword = (document.getElementById('reset-password-field') || {}).value?.trim() || '';

  clearFormMessage(formId);

  if (!_resetEmail || !_verifiedCode) {
    showFormMessage(formId, 'Session expired. Please start over.', 'error');
    setTimeout(() => toggleAuthModal('forgot'), 2000);
    return;
  }

  if (!newPassword)          { showFormMessage(formId, 'Please enter your new password.', 'error');           return; }
  if (newPassword.length < 6) { showFormMessage(formId, 'Password must be at least 6 characters.', 'error'); return; }

  setButtonLoading('reset-submit-btn', true, 'Update Password');
  showFormMessage(formId, 'Updating your password...', 'loading');

  // apiCall повертає data або null
  // data = { success: true, message: '...' }
  const data = await apiCall('auth_reset_password', {
    email:        _resetEmail,
    code:         _verifiedCode,
    new_password: newPassword,
  });

  setButtonLoading('reset-submit-btn', false, 'Update Password');

  if (!data || !data.success) {
    showFormMessage(formId, 'Failed to update password. The code may have expired.', 'error');
    return;
  }

  // Очищуємо стан
  _resetEmail   = '';
  _verifiedCode = '';

  showFormMessage(formId, 'Password updated! Redirecting to login...', 'success');
  setTimeout(() => toggleAuthModal('login'), 2000);
}

function handleLogout() {
  try {
    localStorage.removeItem('sbf-token');
    localStorage.removeItem('sbf-user-email');
    localStorage.removeItem('sbf-uid');
  } catch (e) {
    console.error('[handleLogout] localStorage error:', e);
  }
  window.location.reload();
}

// ─── INITIALIZATION ──────────────────────────────────────────────────────────

function initAuthApp() {
  updateAuthUI();
  let token = null;
  try { token = localStorage.getItem('sbf-token'); } catch (e) {}
  if (token) loadAndRenderUserData();
}

document.addEventListener('DOMContentLoaded', initAuthApp);