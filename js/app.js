/**
 * Auto Order App Premium - Main Application Core
 * Shared logic, API helper, Toast notifications, Auth guard, and Navigation.
 */

const API_BASE = '';

// Telegram bot and WhatsApp defaults (can be overridden via meta tags or window.APP_CONFIG)
window.APP_CONFIG = window.APP_CONFIG || {
  botUsername: document.querySelector('meta[name="bot-username"]')?.content || 'tesbothac_bot',
  waNumber: document.querySelector('meta[name="wa-number"]')?.content || '6285693436052'
};

/**
 * Make API calls with authorization header and error handling
 */
async function apiCall(endpoint, method = 'GET', body = null) {
  const token = localStorage.getItem('token');
  const headers = {
    'Content-Type': 'application/json',
    'Accept': 'application/json'
  };

  if (token) {
    headers['Authorization'] = `Bearer ${token}`;
  }

  const options = {
    method,
    headers
  };

  if (body) {
    options.body = JSON.stringify(body);
  }

  try {
    const url = endpoint.startsWith('http') ? endpoint : `${API_BASE}${endpoint}`;
    const response = await fetch(url, options);

    if (response.status === 401) {
      // Token invalid or expired
      localStorage.removeItem('token');
      localStorage.removeItem('user');
      if (!window.location.pathname.endsWith('login.html') && !window.location.pathname.endsWith('register.html')) {
        window.location.href = 'login.html';
      }
      throw new Error('Sesi telah berakhir, silakan login kembali.');
    }

    const data = await response.json().catch(() => null);

    if (!response.ok) {
      const errorMsg = data?.message || data?.error || `Terjadi kesalahan (${response.status})`;
      throw new Error(errorMsg);
    }

    return data;
  } catch (err) {
    console.warn(`API Error [${method} ${endpoint}]:`, err.message);
    throw err;
  }
}

/**
 * Format number into Indonesian Rupiah format
 * Example: 25000 -> Rp 25.000
 */
function formatPrice(number) {
  if (number === undefined || number === null || isNaN(number)) return 'Rp 0';
  return 'Rp ' + Number(number).toLocaleString('id-ID');
}

/**
 * Toast Notification System
 */
function showToast(message, type = 'info') {
  let container = document.getElementById('toast-container');
  if (!container) {
    container = document.createElement('div');
    container.id = 'toast-container';
    document.body.appendChild(container);
  }

  const toast = document.createElement('div');
  toast.className = 'toast-item';

  // Choose icon and border style based on type
  let iconSvg = '';
  let borderClass = 'border-indigo-500/30';

  if (type === 'success') {
    borderClass = 'border-emerald-500/40 text-emerald-400';
    iconSvg = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path></svg>`;
  } else if (type === 'error') {
    borderClass = 'border-rose-500/40 text-rose-400';
    iconSvg = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>`;
  } else if (type === 'warning') {
    borderClass = 'border-amber-500/40 text-amber-400';
    iconSvg = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"></path></svg>`;
  } else {
    borderClass = 'border-indigo-500/40 text-indigo-400';
    iconSvg = `<svg class="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>`;
  }

  toast.className += ` ${borderClass}`;
  toast.innerHTML = `
    ${iconSvg}
    <div class="text-sm font-medium text-slate-100 flex-1 leading-snug">${message}</div>
    <button class="text-slate-400 hover:text-white transition-colors" onclick="this.parentElement.remove()">
      <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path></svg>
    </button>
  `;

  container.appendChild(toast);

  // Auto remove after 3.8 seconds
  setTimeout(() => {
    toast.classList.add('toast-leave');
    setTimeout(() => toast.remove(), 300);
  }, 3800);
}

/**
 * Authentication Guard
 */
function checkAuth(requireAuth = true) {
  const token = localStorage.getItem('token');
  const path = window.location.pathname.toLowerCase();
  const isAuthPage = path.endsWith('login.html') || path.endsWith('register.html');

  if (requireAuth && !token) {
    if (!isAuthPage) {
      window.location.href = 'login.html';
      return false;
    }
  }

  if (isAuthPage && token) {
    window.location.href = 'index.html';
    return false;
  }

  return !!token;
}

/**
 * Get current user information from local cache or API
 */
async function getUser() {
  const cached = localStorage.getItem('user');
  let user = cached ? JSON.parse(cached) : null;

  const token = localStorage.getItem('token');
  if (!token) return null;

  try {
    const data = await apiCall('/api/auth/me');
    if (data && (data.user || data.username)) {
      user = data.user || data;
      localStorage.setItem('user', JSON.stringify(user));
    }
  } catch (e) {
    // If endpoint doesn't exist or error, keep cached user or mock fallback
    if (!user) {
      user = {
        id: 1,
        username: 'Member VIP',
        email: 'member@premiumapp.id',
        phone: '081234567890',
        platform: 'telegram',
        telegram_id: '@member_vip',
        created_at: new Date().toISOString()
      };
      localStorage.setItem('user', JSON.stringify(user));
    }
  }

  return user;
}

/**
 * Logout user
 */
function logout() {
  localStorage.removeItem('token');
  localStorage.removeItem('user');
  showToast('Berhasil keluar dari akun.', 'info');
  setTimeout(() => {
    window.location.href = 'login.html';
  }, 500);
}

/**
 * Shopping Cart Storage Helpers
 */
function getCartItems() {
  try {
    return JSON.parse(localStorage.getItem('cart_items')) || [];
  } catch (e) {
    return [];
  }
}

function saveCartItems(items) {
  localStorage.setItem('cart_items', JSON.stringify(items));
  updateCartBadge();
}

function addToCart(product, quantity = 1, plan = '1 Bulan') {
  const items = getCartItems();
  const existing = items.find(item => item.id === product.id && item.plan === plan);

  if (existing) {
    existing.quantity += quantity;
  } else {
    items.push({
      id: product.id,
      name: product.name,
      category: product.category,
      price: product.price,
      icon: product.icon || '📦',
      plan: plan,
      quantity: quantity
    });
  }

  saveCartItems(items);
  showToast(`"${product.name}" berhasil ditambahkan ke keranjang!`, 'success');
}

function updateCartBadge() {
  const badgeEls = document.querySelectorAll('.cart-badge');
  const items = getCartItems();
  const totalCount = items.reduce((sum, item) => sum + (item.quantity || 1), 0);

  badgeEls.forEach(badge => {
    if (totalCount > 0) {
      badge.textContent = totalCount > 99 ? '99+' : totalCount;
      badge.classList.remove('hidden');
    } else {
      badge.classList.add('hidden');
    }
  });
}

/**
 * Shared Navigation Renderer & Controller
 */
function initNavigation() {
  const navPlaceholder = document.getElementById('shared-navbar');
  if (!navPlaceholder) return;

  const currentPath = window.location.pathname.split('/').pop() || 'index.html';
  const token = localStorage.getItem('token');
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const username = user?.username || 'Akun Saya';

  // Navigation Links
  const navLinks = [
    { name: 'Beranda', href: 'index.html', icon: '🏠' },
    { name: 'Katalog', href: 'catalog.html', icon: '📦' },
    { name: 'Keranjang', href: 'cart.html', icon: '🛒', hasBadge: true },
    { name: 'Transaksi', href: 'transactions.html', icon: '📋' },
    { name: 'Ulasan', href: 'reviews.html', icon: '⭐' },
    { name: 'Profil', href: 'profile.html', icon: '👤' }
  ];

  let linksHtml = '';
  navLinks.forEach(link => {
    const isActive = currentPath === link.href;
    const activeClass = isActive
      ? 'bg-gradient-to-r from-indigo-600/80 to-purple-600/80 text-white font-semibold shadow-md shadow-indigo-500/20'
      : 'text-slate-300 hover:text-white hover:bg-slate-800/60';

    linksHtml += `
      <a href="${link.href}" class="relative px-3.5 py-2 rounded-xl text-sm flex items-center gap-2 transition-all ${activeClass}">
        <span class="text-base">${link.icon}</span>
        <span>${link.name}</span>
        ${link.hasBadge ? `<span class="cart-badge hidden ml-1 px-1.5 py-0.2 text-[11px] font-bold bg-rose-500 text-white rounded-full">0</span>` : ''}
      </a>
    `;
  });

  const userActionHtml = token ? `
    <div class="relative group">
      <button class="flex items-center gap-2.5 px-3 py-1.5 rounded-xl bg-slate-800/80 hover:bg-slate-700/80 border border-slate-700/60 transition-all text-sm">
        <div class="w-7 h-7 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center font-bold text-white text-xs">
          ${username.charAt(0).toUpperCase()}
        </div>
        <span class="font-medium text-slate-200 hidden sm:inline max-w-[120px] truncate">${username}</span>
        <svg class="w-4 h-4 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path></svg>
      </button>
      <div class="absolute right-0 mt-2 w-48 rounded-xl bg-slate-800 border border-slate-700 shadow-xl py-1 hidden group-hover:block transition-all z-50">
        <div class="px-4 py-2 border-b border-slate-700/60">
          <p class="text-xs text-slate-400">Masuk sebagai</p>
          <p class="text-sm font-semibold text-slate-200 truncate">${username}</p>
        </div>
        <a href="profile.html" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-white">
          <span>👤</span> Profil Saya
        </a>
        <a href="transactions.html" class="flex items-center gap-2 px-4 py-2 text-sm text-slate-300 hover:bg-slate-700/60 hover:text-white">
          <span>📋</span> Transaksi
        </a>
        <button onclick="logout()" class="w-full text-left flex items-center gap-2 px-4 py-2 text-sm text-rose-400 hover:bg-rose-500/10">
          <span>🚪</span> Keluar (Logout)
        </button>
      </div>
    </div>
  ` : `
    <div class="flex items-center gap-2">
      <a href="login.html" class="px-3.5 py-1.5 text-sm font-medium text-slate-300 hover:text-white transition-colors">
        Masuk
      </a>
      <a href="register.html" class="gradient-btn px-4 py-1.5 rounded-xl text-sm font-semibold text-white shadow-md">
        Daftar
      </a>
    </div>
  `;

  navPlaceholder.innerHTML = `
    <nav class="glass-nav fixed top-0 left-0 right-0 z-50 transition-all">
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div class="flex items-center justify-between h-16">
          <!-- Brand Logo -->
          <a href="index.html" class="flex items-center gap-2.5 group">
            <div class="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 p-0.5 shadow-lg shadow-purple-500/20 group-hover:scale-105 transition-transform">
              <div class="w-full h-full bg-slate-900 rounded-[10px] flex items-center justify-center">
                <span class="text-xl">⚡</span>
              </div>
            </div>
            <div>
              <span class="font-bold text-lg tracking-tight bg-gradient-to-r from-indigo-300 via-purple-300 to-pink-300 bg-clip-text text-transparent">AutoOrder</span>
              <span class="text-xs block text-slate-400 font-medium">Premium Store</span>
            </div>
          </a>

          <!-- Desktop Menu Links -->
          <div class="hidden md:flex items-center gap-1.5 bg-slate-900/60 border border-slate-800/80 px-2 py-1.5 rounded-2xl backdrop-blur-md">
            ${linksHtml}
          </div>

          <!-- User Actions & Mobile Toggle -->
          <div class="flex items-center gap-3">
            ${userActionHtml}

            <!-- Mobile Menu Button -->
            <button id="mobile-menu-toggle" class="md:hidden p-2 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 focus:outline-none">
              <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16m-7 6h7"></path>
              </svg>
            </button>
          </div>
        </div>
      </div>

      <!-- Mobile Dropdown Menu -->
      <div id="mobile-menu" class="hidden md:hidden px-4 pt-2 pb-4 space-y-1.5 bg-slate-900/95 border-b border-slate-800/80 backdrop-blur-xl">
        ${navLinks.map(link => `
          <a href="${link.href}" class="flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium ${currentPath === link.href ? 'bg-indigo-600/30 text-indigo-300 border border-indigo-500/30' : 'text-slate-300 hover:bg-slate-800'}">
            <div class="flex items-center gap-2.5">
              <span>${link.icon}</span>
              <span>${link.name}</span>
            </div>
            ${link.hasBadge ? `<span class="cart-badge hidden px-2 py-0.5 text-xs font-bold bg-rose-500 text-white rounded-full">0</span>` : ''}
          </a>
        `).join('')}
        ${token ? `
          <button onclick="logout()" class="w-full text-left flex items-center gap-2.5 px-3.5 py-2.5 rounded-xl text-sm font-medium text-rose-400 hover:bg-rose-500/10">
            <span>🚪</span>
            <span>Keluar (Logout)</span>
          </button>
        ` : ''}
      </div>
    </nav>
  `;

  // Toggle mobile menu event
  const toggleBtn = document.getElementById('mobile-menu-toggle');
  const mobileMenu = document.getElementById('mobile-menu');
  if (toggleBtn && mobileMenu) {
    toggleBtn.addEventListener('click', () => {
      mobileMenu.classList.toggle('hidden');
    });
  }

  updateCartBadge();
}

// Global page initialization
document.addEventListener('DOMContentLoaded', () => {
  // If not on login or register, require auth if defined by page
  const pageRequiresAuth = document.body.dataset.requiresAuth === 'true';
  if (pageRequiresAuth) {
    checkAuth(true);
  }

  // Initialize navigation if placeholder present
  initNavigation();
  updateCartBadge();
});
