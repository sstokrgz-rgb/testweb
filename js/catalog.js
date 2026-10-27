/**
 * Auto Order App Premium - Catalog Logic (MoraxStore Style)
 * Product catalog rendering, search & category filtering, and stepped checkout modal.
 */

// Sample fallback products if API server is not yet seeded
const DEFAULT_PRODUCTS = [
  {
    id: 1,
    name: 'Netflix Premium Ultra HD 4K',
    category: 'Streaming',
    price: 32000,
    original_price: 186000,
    icon: '🎬',
    rating: 4.9,
    review_count: 342,
    stock: 50,
    sold: 428,
    badge: 'Best Seller 🔥',
    description: 'Nonton ribuan film & serial TV tanpa batas dengan kualitas 4K UHD + HDR. Akun privat/sharing legal anti-on hold, bergaransi penuh 30 hari.',
    features: ['Akun Premium UHD 4K', 'Bisa di HP, Laptop, Smart TV', 'Bebas Profil & Pin Sendiri', 'Garansi Replace 30 Hari']
  },
  {
    id: 2,
    name: 'Spotify Premium Individual',
    category: 'Streaming',
    price: 18000,
    original_price: 54990,
    icon: '🎵',
    rating: 4.8,
    review_count: 215,
    stock: 75,
    sold: 310,
    badge: 'Favorit 🎧',
    description: 'Dengarkan jutaan lagu tanpa iklan, download lagu offline tak terbatas, audio kualitas sangat tinggi (320kbps). Bisa perpanjang akun lama.',
    features: ['Bebas Iklan Selamanya', 'Download Lagu Offline', 'Kualitas Suara Maksimal 320kbps', 'Garansi Full 1 Bulan']
  },
  {
    id: 3,
    name: 'YouTube Premium & Music',
    category: 'Streaming',
    price: 15000,
    original_price: 59000,
    icon: '▶️',
    rating: 4.9,
    review_count: 289,
    stock: 60,
    sold: 520,
    badge: 'Promo ⚡',
    description: 'Bebas iklan di semua video YouTube dan YouTube Music. Putar latar belakang saat layar mati atau membuka aplikasi lain.',
    features: ['Bebas Iklan (No Ads)', 'Background Play & PiP', 'Termasuk YouTube Music Premium', 'Bisa Pakai Email Pribadi']
  },
  {
    id: 4,
    name: 'ChatGPT Plus (GPT-4o)',
    category: 'AI & Tools',
    price: 75000,
    original_price: 320000,
    icon: '🤖',
    rating: 5.0,
    review_count: 412,
    stock: 40,
    sold: 642,
    badge: 'Super Hot 🔥',
    description: 'Akses penuh ke model tercanggih GPT-4o, DALL·E 3 Image Generation, Advanced Voice Mode, dan browsing web real-time tanpa batas antrean.',
    features: ['Model GPT-4o & GPT-4o mini', 'DALL·E 3 Image Generator', 'Analisis Data & Unggah File', 'Garansi Aktif 30 Hari']
  },
  {
    id: 5,
    name: 'Claude Pro (Claude 3.5 Sonnet)',
    category: 'AI & Tools',
    price: 85000,
    original_price: 330000,
    icon: '🧠',
    rating: 4.9,
    review_count: 178,
    stock: 30,
    sold: 219,
    badge: 'Top Coding AI',
    description: 'Model AI coding dan penulisan tercerdas di dunia. Dapatkan batas kuota 5x lipat, akses fitur Artifacts terbaru dan pemrosesan dokumen besar.',
    features: ['Claude 3.5 Sonnet & Opus', 'Fitur Interaktif Artifacts', '200k Context Window', 'Garansi 30 Hari']
  },
  {
    id: 6,
    name: 'Canva Pro Edu / Lifetime',
    category: 'Produktivitas',
    price: 20000,
    original_price: 120000,
    icon: '🎨',
    rating: 4.9,
    review_count: 520,
    stock: 100,
    sold: 890,
    badge: 'Terlaris 🌟',
    description: 'Akses 100+ juta template premium, foto, grafis, font, fitur Magic Studio AI, dan Background Remover dalam 1 kali klik. Bisa invite ke email sendiri.',
    features: ['Akses Semua Template Pro', 'One-Click Background Remover', 'Kapasitas Cloud 1TB', 'Unduh Format Kualitas Tertinggi']
  },
  {
    id: 7,
    name: 'Microsoft 365 + OneDrive 1TB',
    category: 'Produktivitas',
    price: 45000,
    original_price: 160000,
    icon: '💼',
    rating: 4.8,
    review_count: 134,
    stock: 35,
    sold: 195,
    badge: 'Original 💻',
    description: 'Paket lengkap Word, Excel, PowerPoint, Outlook untuk 5 perangkat (PC/Mac/HP) beserta penyimpanan Cloud OneDrive 1TB super aman.',
    features: ['Original 5 Device Sekaligus', 'OneDrive Cloud 1000GB (1TB)', 'Update Fitur Resmi Terbaru', 'Garansi Aktif 1 Tahun']
  },
  {
    id: 8,
    name: 'Midjourney AI Standard Plan',
    category: 'AI & Tools',
    price: 90000,
    original_price: 450000,
    icon: '🖼️',
    rating: 4.9,
    review_count: 162,
    stock: 25,
    sold: 144,
    badge: 'Paling Dicari',
    description: 'Generator gambar AI paling fotorealistik dan estetik di dunia. Fast GPU time untuk render karya seni dan grafis kualitas tinggi.',
    features: ['Akses Discord Server Resmi', 'Fast GPU Render Hours', 'Komersial Hak Cipta', 'Garansi Replace Bot']
  },
  {
    id: 9,
    name: 'Disney+ Hotstar Premium',
    category: 'Streaming',
    price: 28000,
    original_price: 65000,
    icon: '🏰',
    rating: 4.7,
    review_count: 145,
    stock: 45,
    sold: 260,
    badge: 'Populer 🍿',
    description: 'Nonton Marvel, Disney, Pixar, Star Wars, National Geographic dan bioskop Indonesia terlengkap dengan kualitas audio Dolby Atmos.',
    features: ['Resolusi 4K UHD & Dolby Vision', 'Bisa Nonton di TV & Ponsel', 'Garansi Full 30 Hari', 'Akun Legal & Aman']
  },
  {
    id: 10,
    name: 'Duolingo Super (Plus)',
    category: 'Edukasi',
    price: 25000,
    original_price: 110000,
    icon: '🦉',
    rating: 4.9,
    review_count: 98,
    stock: 65,
    sold: 180,
    badge: 'Edukasi 📚',
    description: 'Belajar bahasa Inggris, Jepang, Mandarin, dan 40+ bahasa dunia tanpa batas nyawa (Unlimited Hearts), bebas iklan, dan review kesalahan.',
    features: ['Unlimited Hearts / Bebas Nyawa', 'No Ads / Bebas Iklan', 'Mistake Review Praktik Khusus', 'Garansi Durasi Penuh']
  },
  {
    id: 11,
    name: 'Coursera Plus / Skillshare 1 Bln',
    category: 'Edukasi',
    price: 38000,
    original_price: 240000,
    icon: '🎓',
    rating: 4.8,
    review_count: 84,
    stock: 30,
    sold: 95,
    badge: 'Sertifikat 📜',
    description: 'Akses ribuan kelas online industri kreatif, bisnis, koding, dan dapatkan sertifikat resmi dari universitas dan perusahaan global ternama.',
    features: ['Akses Ribuan Video Kursus', 'Download Video Offline', 'Trik Dapatkan Sertifikat', 'Garansi Aktif']
  },
  {
    id: 12,
    name: 'Perplexity Pro AI',
    category: 'AI & Tools',
    price: 60000,
    original_price: 310000,
    icon: '🔍',
    rating: 4.9,
    review_count: 112,
    stock: 50,
    sold: 175,
    badge: 'AI Search 💡',
    description: 'Mesin pencari bertenaga AI dengan referensi kutipan langsung, akses Claude 3.5 Sonnet, GPT-4o, dan upload dokumen tak terbatas.',
    features: ['Unlimited Pro Search', 'Pilih Model GPT-4o / Claude', 'File Upload Analysis', 'Garansi 30 Hari']
  }
];

let allProducts = [];
let currentCategory = 'All';
let currentSearchQuery = '';
let activeModalProduct = null;
let realtimeStockInterval = null;
let cachedBalanceEndpoint = null;

function normalizeProductImageUrl(image) {
  if (!image || typeof image !== 'string') return '';
  const trimmed = image.trim();
  if (!trimmed || trimmed === 'default-product.png') return '';
  try {
    if (trimmed.includes('google.') && trimmed.includes('imgurl=')) {
      const u = new URL(trimmed);
      const extracted = u.searchParams.get('imgurl');
      if (extracted) return decodeURIComponent(extracted);
    }
  } catch (e) {}
  return trimmed;
}

function hasValidProductImage(image) {
  const clean = normalizeProductImageUrl(image);
  return clean.length > 0;
}

function getFallbackEmoji(product) {
  if (product.icon && !String(product.icon).startsWith('<img')) return product.icon;
  if (product.category === 'Streaming') return '🎬';
  if (product.category === 'Produktivitas') return '💼';
  if (product.category === 'AI & Tools') return '🤖';
  if (product.category === 'Edukasi') return '📚';
  return '📦';
}

document.addEventListener('DOMContentLoaded', () => {
  loadProducts();
  setupFilterEvents();
  setupModalEvents();
  startRealtimeStockPolling();
});

/**
 * Helper untuk mengekstrak nilai saldo dari response API / objek user
 */
function extractBalanceValue(data) {
  if (!data || typeof data !== 'object') return null;
  const target = data.user || data.data || data.profile || data;
  if (!target || typeof target !== 'object') return null;

  const raw = target.balance ?? target.saldo ?? target.wallet_balance ?? data.balance ?? data.saldo;
  if (raw !== undefined && raw !== null && raw !== '') {
    const num = Number(raw);
    return Number.isFinite(num) ? Math.max(0, num) : 0;
  }

  return null;
}

/**
 * Sinkronisasi tampilan teks "Saldo Anda" di dalam Modal
 */
function syncModalBalanceDisplay(balance) {
  const safeBalance = Math.max(0, Number(balance) || 0);
  const possibleIds = [
    'modal-user-balance',
    'modal-user-saldo',
    'modal-saldo-user',
    'user-balance',
    'user-saldo',
    'modal-balance'
  ];

  for (const id of possibleIds) {
    const el = document.getElementById(id);
    if (el) {
      el.textContent = /Saldo Anda/i.test(el.textContent)
        ? `⚠️ Saldo Anda: ${formatPrice(safeBalance)}`
        : formatPrice(safeBalance);
      return;
    }
  }

  const modal = document.getElementById('product-detail-modal');
  if (!modal) return;
  const elements = modal.querySelectorAll('p, span, div, small');
  for (const el of elements) {
    if (/Saldo Anda\s*:/i.test(el.textContent) && !el.querySelector('div, p')) {
      el.textContent = `⚠️ Saldo Anda: ${formatPrice(safeBalance)}`;
      break;
    }
  }
}

/**
 * Ambil saldo user secara real-time dari database
 */
async function fetchRealtimeUserBalance(telegramId = '') {
  const token = localStorage.getItem('token');
  if (!token) return 0;

  const query = `?t=${Date.now()}${telegramId ? `&telegram_id=${encodeURIComponent(telegramId)}` : ''}`;
  const endpoints = cachedBalanceEndpoint
    ? [cachedBalanceEndpoint]
    : ['/api/auth/me', '/api/user/profile', '/api/profile', '/api/user', '/api/users/me', '/api/balance'];

  for (const endpoint of endpoints) {
    try {
      const data = await apiCall(endpoint + query);
      const balance = extractBalanceValue(data);
      if (balance !== null) {
        cachedBalanceEndpoint = endpoint;
        try {
          const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
          savedUser.balance = balance;
          savedUser.saldo = balance;
          localStorage.setItem('user', JSON.stringify(savedUser));
        } catch (e) {}
        syncModalBalanceDisplay(balance);
        return balance;
      }
    } catch (e) {
      // Coba endpoint berikutnya jika endpoint ini tidak ditemukan
    }
  }

  //Jika endpoint gagal karena koneksi, baca data user terakhir yang tersimpan
  try {
    const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
    const fallbackBalance = extractBalanceValue(savedUser) ?? 0;
    syncModalBalanceDisplay(fallbackBalance);
    return fallbackBalance;
  } catch (e) {
    return 0;
  }
}

/**
 * Helper untuk membuat HTML badge stok real-time (sama seperti bot WA & Telegram)
 */
function buildStockBadgeHTML(product) {
  const stock = Math.max(0, Number(product.stock) || 0);
  if (stock > 0) {
    return `
      <span data-stock-badge="${product.id}" class="realtime-stock-badge px-2.5 py-1 text-[11px] font-semibold rounded-full bg-emerald-500/15 text-emerald-400 border border-emerald-500/30 inline-flex items-center gap-1.5 whitespace-nowrap">
        <span class="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
        <span>Stok: ${stock}</span>
      </span>
    `;
  }
  return `
    <span data-stock-badge="${product.id}" class="realtime-stock-badge px-2.5 py-1 text-[11px] font-semibold rounded-full bg-rose-500/15 text-rose-400 border border-rose-500/30 inline-flex items-center gap-1.5 whitespace-nowrap">
      <span class="w-1.5 h-1.5 rounded-full bg-rose-400"></span>
      <span>Stok Kosong</span>
    </span>
  `;
}

/**
 * Fetch and load products
 */
async function loadProducts() {
  const grid = document.getElementById('products-grid');
  if (!grid) return;

  grid.innerHTML = `
    <div class="col-span-full py-16 text-center">
      <div class="spinner w-8 h-8 mx-auto mb-3"></div>
      <p class="text-slate-400 text-sm">Memuat katalog aplikasi premium...</p>
    </div>
  `;

  try {
    const data = await apiCall('/api/products?t=' + Date.now());
    if (Array.isArray(data) && data.length > 0) {
      allProducts = data;
    } else if (data && Array.isArray(data.products) && data.products.length > 0) {
      allProducts = data.products;
    } else {
      allProducts = DEFAULT_PRODUCTS;
    }
  } catch (err) {
    console.log('Using default product catalog:', err.message);
    allProducts = DEFAULT_PRODUCTS;
  }

  renderProducts();
}

/**
 * Polling stok real-time setiap 4 detik agar selalu sinkron dengan Bot WA & Telegram
 */
function startRealtimeStockPolling() {
  if (realtimeStockInterval) clearInterval(realtimeStockInterval);
  realtimeStockInterval = setInterval(async () => {
    try {
      const data = await apiCall('/api/products?t=' + Date.now());
      const freshList = Array.isArray(data)
        ? data
        : (data && Array.isArray(data.products) ? data.products : null);

      if (!freshList || freshList.length === 0) return;

      let hasChanges = false;
      let hasImageChanges = false;
      freshList.forEach(freshProd => {
        const existing = allProducts.find(p => p.id === freshProd.id);
        const newStock = Math.max(0, Number(freshProd.stock) || 0);
        if (existing) {
          const oldStock = Math.max(0, Number(existing.stock) || 0);
          if (oldStock !== newStock) {
            existing.stock = newStock;
            hasChanges = true;
            updateSingleCardStockDOM(existing);
          }
          if (freshProd.image !== existing.image) {
            existing.image = freshProd.image;
            hasImageChanges = true;
          }
        }
      });

      if (hasImageChanges) {
        renderProducts();
      }

      if (hasChanges && activeModalProduct) {
        const updatedActive = allProducts.find(p => p.id === activeModalProduct.id);
        if (updatedActive) {
          activeModalProduct.stock = updatedActive.stock;
          syncModalStockDisplay(updatedActive);
        }
      }

      if (activeModalProduct && localStorage.getItem('token')) {
        const telegramId = document.getElementById('modal-telegram-id')?.value?.trim() || '';
        await fetchRealtimeUserBalance(telegramId);
      }
    } catch (e) {
      // Abaikan jika jaringan sedang sibuk
    }
  }, 4000);
}

/**
 * Update elemen badge stok pada kartu tertentu secara langsung tanpa mereset tampilan
 */
function updateSingleCardStockDOM(product) {
  const badgeEl = document.querySelector(`[data-stock-badge="${product.id}"]`);
  if (!badgeEl) return;
  const temp = document.createElement('div');
  temp.innerHTML = buildStockBadgeHTML(product).trim();
  if (temp.firstElementChild) {
    badgeEl.replaceWith(temp.firstElementChild);
  }
}

/**
 * Sinkronisasi tampilan stok & status tombol Bayar Sekarang di dalam Modal
 */
function syncModalStockDisplay(product) {
  const stock = Math.max(0, Number(product.stock) || 0);
  const modalStockEl = document.getElementById('modal-stock');
  const maxQtyEl = document.getElementById('modal-max-qty');
  const qtyInput = document.getElementById('modal-qty-input');
  const checkoutBtn = document.querySelector('button[onclick="handleModalCheckout()"]');

  if (modalStockEl && modalStockEl.parentElement) {
    if (stock > 0) {
      modalStockEl.parentElement.className = 'text-teal-400';
      modalStockEl.parentElement.innerHTML = `📦 Stok: <span id="modal-stock">${stock}</span> Unit`;
    } else {
      modalStockEl.parentElement.className = 'text-rose-400';
      modalStockEl.parentElement.innerHTML = `📦 <span id="modal-stock">Stok Kosong</span>`;
    }
  }

  if (maxQtyEl) {
    maxQtyEl.textContent = stock > 0 ? `(Maks. ${stock} unit)` : '(Stok Kosong)';
  }

  if (qtyInput) {
    qtyInput.max = Math.max(1, stock);
    if (stock > 0 && parseInt(qtyInput.value) > stock) {
      qtyInput.value = stock;
      updateModalPrices();
    }
  }

  // Blokir tombol Bayar Sekarang jika stok kosong, aktifkan kembali jika stok tersedia
  if (checkoutBtn) {
    if (stock > 0) {
      checkoutBtn.disabled = false;
      checkoutBtn.className = 'flex-1 py-2.5 rounded-xl bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-white text-xs font-bold transition-all shadow-lg shadow-amber-500/25 flex items-center justify-center gap-1.5';
    } else {
      checkoutBtn.disabled = true;
      checkoutBtn.className = 'flex-1 py-2.5 rounded-xl bg-slate-700 text-slate-400 text-xs font-bold transition-all flex items-center justify-center gap-1.5 opacity-50 cursor-not-allowed';
    }
  }
}

/**
 * Setup Search & Category filter tabs
 */
function setupFilterEvents() {
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      currentSearchQuery = e.target.value.toLowerCase().trim();
      renderProducts();
    });
  }

  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach(btn => {
    btn.addEventListener('click', () => {
      categoryButtons.forEach(b => {
        b.classList.remove('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white', 'shadow-md', 'shadow-indigo-500/25');
        b.classList.add('bg-slate-800/80', 'text-slate-300', 'hover:bg-slate-700/80');
      });

      btn.classList.remove('bg-slate-800/80', 'text-slate-300', 'hover:bg-slate-700/80');
      btn.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white', 'shadow-md', 'shadow-indigo-500/25');

      currentCategory = btn.dataset.category || 'All';
      renderProducts();
    });
  });
}

/**
 * Setup Modal Event Listeners
 */
function setupModalEvents() {
  const qtyInput = document.getElementById('modal-qty-input');
  if (qtyInput) {
    qtyInput.addEventListener('input', () => {
      let val = parseInt(qtyInput.value) || 1;
      const max = parseInt(qtyInput.max) || 50;
      if (val < 1) val = 1;
      if (val > max) val = max;
      qtyInput.value = val;
      updateModalPrices();
    });
    qtyInput.addEventListener('change', () => {
      updateModalPrices();
    });
  }

  // Backdrop click to close
  const modal = document.getElementById('product-detail-modal');
  if (modal) {
    modal.addEventListener('click', (e) => {
      if (e.target === modal) {
        closeProductModal();
      }
    });
  }

  // Escape key to close
  document.addEventListener('keydown', (e) => {
    if (e.key === 'Escape') {
      closeProductModal();
    }
  });
}

/**
 * Render filtered product cards
 */
function renderProducts() {
  const grid = document.getElementById('products-grid');
  const countEl = document.getElementById('products-count');
  if (!grid) return;

  const filtered = allProducts.filter(item => {
    const matchesCategory = currentCategory === 'All' || item.category?.toLowerCase() === currentCategory.toLowerCase();
    const matchesSearch = !currentSearchQuery ||
      item.name?.toLowerCase().includes(currentSearchQuery) ||
      (item.description && item.description.toLowerCase().includes(currentSearchQuery)) ||
      (item.category && item.category.toLowerCase().includes(currentSearchQuery));
    return matchesCategory && matchesSearch;
  });

  if (countEl) {
    countEl.textContent = `Menampilkan ${filtered.length} aplikasi`;
  }

  if (filtered.length === 0) {
    grid.innerHTML = `
      <div class="col-span-full py-16 text-center glass-panel rounded-3xl p-8 border border-slate-800">
        <div class="text-5xl mb-3">🔍</div>
        <h4 class="text-lg font-bold text-slate-200">Aplikasi Tidak Ditemukan</h4>
        <p class="text-sm text-slate-400 mt-1">Coba gunakan kata kunci lain atau pilih kategori berbeda.</p>
        <button onclick="resetFilters()" class="mt-4 px-4 py-2 text-xs font-semibold rounded-xl bg-slate-800 hover:bg-slate-700 text-indigo-400 border border-slate-700">
          Reset Pencarian
        </button>
      </div>
    `;
    return;
  }

  grid.innerHTML = filtered.map(product => {
    const fallbackEmoji = getFallbackEmoji(product);
    const cleanImgUrl = normalizeProductImageUrl(product.image);
    const mediaHtml = cleanImgUrl
      ? `<img src="${cleanImgUrl}" referrerpolicy="no-referrer" alt="${product.name}" class="w-full h-full object-cover rounded-2xl" onerror="this.parentElement.textContent='${fallbackEmoji}'">`
      : fallbackEmoji;

    return `
      <div class="group glass-panel rounded-2xl p-5 border border-slate-800/80 card-hover flex flex-col justify-between cursor-pointer" data-product-id="${product.id}" onclick="openProductModal(${product.id})">
        <div>
          <!-- Card Header, Real-Time Stock & Category Badge -->
          <div class="flex items-start justify-between gap-2 mb-4">
            <div class="w-14 h-14 rounded-2xl bg-gradient-to-br from-indigo-500/20 to-purple-500/20 border border-indigo-500/30 flex items-center justify-center text-3xl shadow-inner group-hover:scale-110 transition-transform flex-shrink-0 overflow-hidden">
              ${mediaHtml}
            </div>
            <div class="flex items-center gap-2 flex-wrap justify-end">
              ${buildStockBadgeHTML(product)}
              ${product.badge ? `
                <span class="px-2.5 py-1 text-[11px] font-semibold tracking-wide rounded-full bg-indigo-500/10 text-indigo-400 border border-indigo-500/30">
                  ${product.badge}
                </span>
              ` : `
                <span class="px-2.5 py-1 text-[11px] font-medium rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                  ${product.category || 'Premium'}
                </span>
              `}
            </div>
          </div>

          <!-- Product Title -->
          <h3 class="font-bold text-slate-100 text-lg mb-1 group-hover:text-teal-400 transition-colors line-clamp-1">
            ${product.name}
          </h3>

          <!-- Rating & Reviews -->
          <div class="flex items-center gap-1.5 mb-3 text-xs">
            <div class="flex text-amber-400">
              <span>★</span>
              <span class="font-semibold ml-1 text-slate-200">${product.rating || '4.9'}</span>
            </div>
            <span class="text-slate-500">•</span>
            <span class="text-slate-400">(${product.review_count || 120} ulasan)</span>
          </div>

          <!-- Description Preview -->
          <p class="text-xs text-slate-400 line-clamp-2 leading-relaxed mb-4">
            ${product.description || 'Akun premium garansi resmi, pengiriman otomatis kilat dalam hitungan detik.'}
          </p>
        </div>

        <!-- Pricing & Action Button -->
        <div class="pt-4 border-t border-slate-800/80 flex items-center justify-between mt-auto">
          <div>
            ${product.original_price ? `<span class="text-[11px] text-slate-500 line-through block leading-none mb-1">${formatPrice(product.original_price)}</span>` : ''}
            <span class="text-lg font-extrabold text-transparent bg-clip-text bg-gradient-to-r from-teal-400 to-emerald-400">
              ${formatPrice(product.price)}
            </span>
          </div>

          <button 
            type="button"
            onclick="event.stopPropagation(); handleAddToCartClick(${product.id})" 
            class="px-3.5 py-2 rounded-xl gradient-btn text-white text-xs font-semibold flex items-center gap-1.5 shadow-md shadow-indigo-500/20 active:scale-95"
            title="Tambah ke Keranjang"
          >
            <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 4v16m8-8H4"></path></svg>
            <span>Beli</span>
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function resetFilters() {
  currentCategory = 'All';
  currentSearchQuery = '';
  const searchInput = document.getElementById('catalog-search');
  if (searchInput) searchInput.value = '';

  const categoryButtons = document.querySelectorAll('.category-btn');
  categoryButtons.forEach((btn, index) => {
    if (index === 0) {
      btn.classList.add('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
      btn.classList.remove('bg-slate-800/80', 'text-slate-300');
    } else {
      btn.classList.remove('bg-gradient-to-r', 'from-indigo-600', 'to-purple-600', 'text-white');
      btn.classList.add('bg-slate-800/80', 'text-slate-300');
    }
  });

  renderProducts();
}

function handleAddToCartClick(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;

  const stock = Math.max(0, Number(product.stock) || 0);
  if (stock <= 0) {
    showToast(`Maaf, stok ${product.name} sedang habis!`, 'warning');
    return;
  }

  const fallbackEmoji = getFallbackEmoji(product);
  const cleanImgUrl = normalizeProductImageUrl(product.image);
  const productForCart = {
    ...product,
    icon: cleanImgUrl
      ? `<img src="${cleanImgUrl}" referrerpolicy="no-referrer" alt="${product.name}" class="w-full h-full object-cover rounded-2xl">`
      : fallbackEmoji
  };

  addToCart(productForCart, 1, '1 Bulan');
}

/**
 * Open Product Detail Modal (MoraxStore Style)
 */
async function openProductModal(productId) {
  const product = allProducts.find(p => p.id === productId);
  if (!product) return;
  activeModalProduct = product;
  
  const modal = document.getElementById('product-detail-modal');
  if (!modal) return;

  // Set header
  const iconEl = document.getElementById('modal-product-icon');
  const fallbackEmoji = getFallbackEmoji(product);
  const cleanImgUrl = normalizeProductImageUrl(product.image);
  if (iconEl) {
    if (cleanImgUrl) {
      iconEl.innerHTML = `<img src="${cleanImgUrl}" referrerpolicy="no-referrer" alt="${product.name}" class="w-full h-full object-cover rounded-xl" onerror="this.parentElement.textContent='${fallbackEmoji}'">`;
    } else {
      iconEl.textContent = fallbackEmoji;
    }
  }
  document.getElementById('modal-product-title').textContent = product.name;
  document.getElementById('modal-product-category').textContent = '📦 ' + (product.category || 'Umum');
  
  // Stock & Sold
  const stock = Math.max(0, Number(product.stock) || 0);
  const sold = product.sold !== undefined ? product.sold : Math.floor(Math.random() * 500) + 100;
  document.getElementById('modal-sold').textContent = sold;
  document.getElementById('modal-subtitle').textContent = 'Private Akun, Garansi Penuh 30 Hari';
  syncModalStockDisplay(product);
  
  // SNK (Syarat dan Ketentuan)
  const snkText = (product.snk && product.snk.trim())
    ? product.snk
    : `=CARA LOGIN=\n${product.description || 'Deskripsi produk dan panduan penggunaan akun.'}\n\n=GARANSI=\nGaransi penuh selama masa aktif. Jika ada kendala silakan hubungi admin via bot Telegram / WhatsApp.`;
  document.getElementById('modal-snk').textContent = snkText;
  
  // Prices
  const price = product.price;
  document.getElementById('modal-price-qris').textContent = formatPrice(price);
  document.getElementById('modal-price-saldo').textContent = formatPrice(price);
  document.getElementById('modal-total-price').textContent = formatPrice(price);
  
  // Reset qty
  const qtyInput = document.getElementById('modal-qty-input');
  if (qtyInput) {
    qtyInput.value = 1;
    qtyInput.max = Math.max(1, stock);
  }

  // Reset promo code input
  const promoInput = document.getElementById('modal-promo-code');
  if (promoInput) promoInput.value = '';

  // Prefill telegram ID if user logged in
  const telegramInput = document.getElementById('modal-telegram-id');
  if (telegramInput) {
    const user = JSON.parse(localStorage.getItem('user') || '{}');
    telegramInput.value = user.telegram_id || '';
  }

  // Reset payment selection to QRIS
  const qrisRadio = document.querySelector('input[name="payment-method"][value="qris"]');
  if (qrisRadio) qrisRadio.checked = true;
  
  // Show modal
  modal.classList.remove('hidden');
  document.body.style.overflow = 'hidden';

  // Sinkronkan saldo user secara real-time dari database saat modal dibuka
  if (localStorage.getItem('token')) {
    const telegramId = telegramInput ? telegramInput.value.trim() : '';
    await fetchRealtimeUserBalance(telegramId);
  }
}

/**
 * Close Product Detail Modal
 */
function closeProductModal() {
  const modal = document.getElementById('product-detail-modal');
  if (modal) modal.classList.add('hidden');
  document.body.style.overflow = '';
  activeModalProduct = null;
}

/**
 * Quantity +/- handler
 */
function changeQty(delta) {
  const input = document.getElementById('modal-qty-input');
  if (!input) return;
  let val = parseInt(input.value) || 1;
  const max = parseInt(input.max) || 50;
  val = Math.max(1, Math.min(max, val + delta));
  input.value = val;
  updateModalPrices();
}

/**
 * Update dynamic price displays based on quantity
 */
function updateModalPrices() {
  if (!activeModalProduct) return;
  const qty = parseInt(document.getElementById('modal-qty-input')?.value) || 1;
  const total = activeModalProduct.price * qty;
  
  const qrisPriceEl = document.getElementById('modal-price-qris');
  const saldoPriceEl = document.getElementById('modal-price-saldo');
  const totalPriceEl = document.getElementById('modal-total-price');

  if (qrisPriceEl) qrisPriceEl.textContent = formatPrice(total);
  if (saldoPriceEl) saldoPriceEl.textContent = formatPrice(total);
  if (totalPriceEl) totalPriceEl.textContent = formatPrice(total);
}

/**
 * Promo code redemption
 */
function applyPromo() {
  const code = document.getElementById('modal-promo-code')?.value?.trim();
  if (!code) {
    showToast('Silakan ketik kode kupon diskon terlebih dahulu.', 'warning');
    return;
  }
  showToast('Kode promo tidak valid atau kupon telah habis.', 'warning');
}

/**
 * Redirect to Bot Telegram order deeplink
 */
function buyViaBotTelegram() {
  if (!activeModalProduct) return;
  const botUsername = window.APP_CONFIG?.botUsername || 'tesbothac_bot';
  const url = `https://t.me/${botUsername}?start=order_${activeModalProduct.id}`;
  window.open(url, '_blank');
}

/**
 * Handle checkout directly from modal
 */
async function handleModalCheckout() {
  if (!activeModalProduct) return;
  if ((Number(activeModalProduct.stock) || 0) <= 0) return;

  const qty = parseInt(document.getElementById('modal-qty-input')?.value) || 1;
  const telegramId = document.getElementById('modal-telegram-id')?.value?.trim();
  const paymentMethodEl = document.querySelector('input[name="payment-method"]:checked');
  const paymentMethod = paymentMethodEl ? paymentMethodEl.value.toUpperCase() : 'QRIS';
  const totalPrice = (Number(activeModalProduct.price) || 0) * qty;

  const token = localStorage.getItem('token');
  if (!token) {
    // Add to cart for convenience and redirect to login
    addToCart(activeModalProduct, qty);
    showToast('Silakan masuk (login) terlebih dahulu untuk memproses pesanan.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  // Validasi saldo secara real-time sesuai database jika memilih metode pembayaran Saldo Akun
  if (paymentMethod === 'SALDO') {
    const realtimeBalance = await fetchRealtimeUserBalance(telegramId);
    if (realtimeBalance <= 0 || realtimeBalance < totalPrice) {
      showToast('saldo tidak mencukupi', 'error');
      return;
    }
  }

  // Attempt API checkout
  try {
    // First add to backend cart
    await apiCall('/api/cart', 'POST', {
      product_id: activeModalProduct.id,
      quantity: qty
    });

    // Create the order
    const orderRes = await apiCall('/api/orders', 'POST', {
      payment_method: paymentMethod === 'SALDO' ? 'Saldo Akun' : 'QRIS Instant',
      telegram_id: telegramId
    });

    const orderNumber = orderRes.order?.order_number || 'ORD-' + Date.now();
    closeProductModal();
    showToast(`Pesanan berhasil dibuat! No: ${orderNumber}`, 'success');

    setTimeout(() => {
      window.location.href = 'transactions.html';
    }, 1200);

  } catch (err) {
    // Jika metode pembayaran Saldo Akun ditolak oleh backend karena saldo kurang, tampilkan notif & batalkan fallback
    if (paymentMethod === 'SALDO') {
      const errMsg = (err && err.message) ? err.message.toLowerCase() : '';
      if (errMsg.includes('saldo') || errMsg.includes('balance') || errMsg.includes('cukup') || errMsg.includes('insufficient')) {
        showToast('saldo tidak mencukupi', 'error');
        return;
      }
      const latestBalance = await fetchRealtimeUserBalance(telegramId);
      if (latestBalance <= 0 || latestBalance < totalPrice) {
        showToast('saldo tidak mencukupi', 'error');
        return;
      }
    }

    console.warn('API checkout failed, using local fallback:', err.message);

    // Local fallback order
    const randomOrderNumber = 'ORD-' + new Date().toISOString().slice(0, 10).replace(/-/g, '') + '-' + Math.random().toString(36).substring(2, 6).toUpperCase();
    const fallbackOrder = {
      id: Date.now(),
      order_number: randomOrderNumber,
      total: activeModalProduct.price * qty,
      payment_method: paymentMethod === 'SALDO' ? 'Saldo Akun' : 'QRIS Instant',
      status: 'pending',
      created_at: new Date().toISOString(),
      telegram_id: telegramId,
      items: [
        {
          product_id: activeModalProduct.id,
          product_name: activeModalProduct.name,
          quantity: qty,
          price: activeModalProduct.price
        }
      ]
    };

    const savedOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
    savedOrders.unshift(fallbackOrder);
    localStorage.setItem('local_orders', JSON.stringify(savedOrders));

    closeProductModal();
    showToast(`Pesanan berhasil dibuat! No: ${randomOrderNumber}`, 'success');

    setTimeout(() => {
      window.location.href = 'transactions.html';
    }, 1200);
  }
}