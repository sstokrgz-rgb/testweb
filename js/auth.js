/**
 * Auto Order App Premium - Authentication Controller
 * Handles login, registration, platform selection, bot verification polling and redirection.
 */

// Configuration defaults
const BOT_USERNAME = window.APP_CONFIG?.botUsername || 'tesbothac_bot';
const WA_NUMBER = window.APP_CONFIG?.waNumber || '6285693436052';

let verificationPollInterval = null;

document.addEventListener('DOMContentLoaded', () => {
  // Check if user is already logged in on auth pages
  const token = localStorage.getItem('token');
  if (token && (window.location.pathname.endsWith('login.html') || window.location.pathname.endsWith('register.html'))) {
    window.location.href = 'index.html';
    return;
  }

  // Setup Login Form if present
  const loginForm = document.getElementById('login-form');
  if (loginForm) {
    loginForm.addEventListener('submit', handleLogin);
  }

  // Setup Register Form if present
  const registerForm = document.getElementById('register-form');
  if (registerForm) {
    setupPlatformSelection();
    registerForm.addEventListener('submit', handleRegister);
  }
});

/**
 * Platform Selection handling on register page
 */
function setupPlatformSelection() {
  const telegramCard = document.getElementById('platform-telegram');
  const whatsappCard = document.getElementById('platform-whatsapp');
  const platformInput = document.getElementById('selected-platform');

  if (!telegramCard || !whatsappCard || !platformInput) return;

  telegramCard.addEventListener('click', () => {
    platformInput.value = 'telegram';
    telegramCard.classList.add('border-sky-500', 'bg-sky-950/40', 'ring-2', 'ring-sky-500/50');
    telegramCard.classList.remove('border-slate-700/80', 'bg-slate-800/40');

    whatsappCard.classList.remove('border-emerald-500', 'bg-emerald-950/40', 'ring-2', 'ring-emerald-500/50');
    whatsappCard.classList.add('border-slate-700/80', 'bg-slate-800/40');

    // Update active badge
    document.getElementById('telegram-check')?.classList.remove('hidden');
    document.getElementById('whatsapp-check')?.classList.add('hidden');
  });

  whatsappCard.addEventListener('click', () => {
    platformInput.value = 'whatsapp';
    whatsappCard.classList.add('border-emerald-500', 'bg-emerald-950/40', 'ring-2', 'ring-emerald-500/50');
    whatsappCard.classList.remove('border-slate-700/80', 'bg-slate-800/40');

    telegramCard.classList.remove('border-sky-500', 'bg-sky-950/40', 'ring-2', 'ring-sky-500/50');
    telegramCard.classList.add('border-slate-700/80', 'bg-slate-800/40');

    // Update active badge
    document.getElementById('whatsapp-check')?.classList.remove('hidden');
    document.getElementById('telegram-check')?.classList.add('hidden');
  });
}

/**
 * Handle Login Submission
 */
async function handleLogin(e) {
  e.preventDefault();
  const form = e.target;
  const emailInput = document.getElementById('login-email');
  const passwordInput = document.getElementById('login-password');
  const submitBtn = document.getElementById('login-submit-btn');
  const errorAlert = document.getElementById('auth-error-alert');

  if (errorAlert) {
    errorAlert.classList.add('hidden');
    errorAlert.textContent = '';
  }

  const email = emailInput.value.trim();
  const password = passwordInput.value;

  if (!email || !password) {
    showAuthError('Harap isi semua kolom email dan password.');
    return;
  }

  // Button loading state
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner w-4 h-4 inline-block mr-2 align-middle"></span>
    Memproses Masuk...
  `;

  try {
    const response = await fetch(`${API_BASE}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email, password })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || data?.error || 'Email atau password salah.';
      throw new Error(msg);
    }

    if (!data.token) {
      throw new Error('Respon login tidak valid dari server.');
    }

    // Save token and user data
    localStorage.setItem('token', data.token);
    if (data.user) {
      localStorage.setItem('user', JSON.stringify(data.user));
    }

    showToast('Login berhasil! Mengalihkan ke beranda...', 'success');
    setTimeout(() => {
      window.location.href = 'index.html';
    }, 800);

  } catch (error) {
    console.error('Login error:', error);
    showAuthError(error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Handle Registration Submission
 */
async function handleRegister(e) {
  e.preventDefault();
  const usernameInput = document.getElementById('reg-username');
  const emailInput = document.getElementById('reg-email');
  const passwordInput = document.getElementById('reg-password');
  const platformInput = document.getElementById('selected-platform');
  const submitBtn = document.getElementById('reg-submit-btn');

  const username = usernameInput.value.trim();
  const email = emailInput.value.trim();
  const password = passwordInput.value;
  const platform = platformInput.value;

  if (!username || !email || !password) {
    showAuthError('Semua kolom formulir wajib diisi.');
    return;
  }

  if (username.length < 3) {
    showAuthError('Username minimal 3 karakter.');
    return;
  }

  if (password.length < 6) {
    showAuthError('Password minimal 6 karakter.');
    return;
  }

  if (!platform) {
    showAuthError('Silakan pilih salah satu platform verifikasi (Telegram atau WhatsApp).');
    return;
  }

  // Button loading state
  const originalBtnText = submitBtn.innerHTML;
  submitBtn.disabled = true;
  submitBtn.innerHTML = `
    <span class="spinner w-4 h-4 inline-block mr-2 align-middle"></span>
    Mendaftarkan Akun...
  `;

  try {
    const response = await fetch(`${API_BASE}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, email, password, platform })
    });

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const msg = data?.message || data?.error || 'Gagal melakukan pendaftaran.';
      throw new Error(msg);
    }

    const verifyToken = data?.verify_token || data?.token || 'VERIFY_' + Math.random().toString(36).substring(2, 9);
    const selectedPlatform = data?.platform || platform;

    // Show verification modal & start polling
    showVerificationModal(selectedPlatform, verifyToken, email);

  } catch (error) {
    console.error('Register error:', error);
    showAuthError(error.message);
    submitBtn.disabled = false;
    submitBtn.innerHTML = originalBtnText;
  }
}

/**
 * Show Verification Modal and Start Polling
 */
function showVerificationModal(platform, verifyToken, email) {
  const modal = document.getElementById('verification-modal');
  if (!modal) return;

  const botUser = window.APP_CONFIG?.botUsername || BOT_USERNAME;
  const waNum = window.APP_CONFIG?.waNumber || WA_NUMBER;

  let botLink = '';
  let botNameText = '';
  let instructionText = '';

  if (platform === 'telegram') {
    botLink = `https://t.me/${botUser}?start=${verifyToken}`;
    botNameText = `@${botUser}`;
    instructionText = `Klik tombol di bawah untuk membuka Telegram dan tekan tombol <b>START</b> pada bot <b>${botNameText}</b> untuk memverifikasi akun Anda secara otomatis.`;
  } else {
    const encodedMsg = encodeURIComponent(`.regist ${verifyToken}`);
    botLink = `https://wa.me/${waNum}?text=${encodedMsg}`;
    botNameText = `+${waNum}`;
    instructionText = `Klik tombol di bawah untuk membuka WhatsApp dan kirim pesan <code>.regist ${verifyToken}</code> ke Bot <b>${botNameText}</b> untuk aktivasi instan.`;
  }

  // Populate modal elements
  const modalDesc = document.getElementById('verify-modal-desc');
  const openBotBtn = document.getElementById('verify-bot-btn');
  const tokenDisplay = document.getElementById('verify-token-code');

  if (modalDesc) modalDesc.innerHTML = instructionText;
  if (openBotBtn) {
    openBotBtn.href = botLink;
    openBotBtn.textContent = platform === 'telegram' ? 'Buka Bot Telegram Sekarang' : 'Buka WhatsApp Sekarang';
  }
  if (tokenDisplay) tokenDisplay.textContent = verifyToken;

  // Unhide modal
  modal.classList.remove('hidden');

  // Automatically attempt opening bot in new window/tab
  try {
    window.open(botLink, '_blank');
  } catch (e) {
    console.log('Popup blocked, user will click button manually');
  }

  // Start polling verification status every 3 seconds
  startVerificationPolling(verifyToken, email);
}

/**
 * Poll verification endpoint every 3 seconds
 */
function startVerificationPolling(verifyToken, email) {
  if (verificationPollInterval) clearInterval(verificationPollInterval);

  let attempts = 0;
  const maxAttempts = 100; // ~5 minutes

  verificationPollInterval = setInterval(async () => {
    attempts++;
    if (attempts > maxAttempts) {
      clearInterval(verificationPollInterval);
      showAuthError('Waktu verifikasi habis. Silakan coba daftar ulang atau hubungi bantuan.');
      return;
    }

    try {
      const response = await fetch(`${API_BASE}/api/auth/check-verification/${verifyToken}`);
      if (!response.ok) return;

      const data = await response.json();
      if (data && (data.verified === true || data.status === 'verified' || data.token)) {
        clearInterval(verificationPollInterval);

        // Verification successful!
        if (data.token) {
          localStorage.setItem('token', data.token);
        }
        if (data.user) {
          localStorage.setItem('user', JSON.stringify(data.user));
        }

        const modal = document.getElementById('verification-modal');
        if (modal) {
          modal.innerHTML = `
            <div class="glass-panel p-8 rounded-3xl max-w-md w-full mx-auto text-center border border-emerald-500/40 glow-purple animate-modal">
              <div class="w-16 h-16 bg-emerald-500/20 text-emerald-400 rounded-2xl flex items-center justify-center mx-auto mb-4">
                <svg class="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>
              </div>
              <h3 class="text-xl font-bold text-white mb-2">Verifikasi Berhasil!</h3>
              <p class="text-slate-300 text-sm mb-6">Akun Anda telah aktif dan terhubung ke Bot. Mengalihkan ke dashboard...</p>
              <div class="spinner w-6 h-6 mx-auto"></div>
            </div>
          `;
        }

        showToast('Verifikasi akun berhasil! Selamat datang.', 'success');
        setTimeout(() => {
          window.location.href = 'index.html';
        }, 1200);
      }
    } catch (err) {
      // Ignore polling transient errors
    }
  }, 3000);
}

/**
 * Helper to display error messages in the form
 */
function showAuthError(message) {
  const alertEl = document.getElementById('auth-error-alert');
  if (alertEl) {
    alertEl.textContent = message;
    alertEl.classList.remove('hidden');
    alertEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  } else {
    showToast(message, 'error');
  }
}
