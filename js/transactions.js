/**
 * Auto Order App Premium - Transaction History Logic
 * Loads user transactions, filters by status tabs, expands order details,
 * and displays auto-order credentials with one-click copy.
 */

const DEFAULT_TRANSACTIONS = [
  {
    id: 1042,
    order_number: 'INV-20261026-0042',
    created_at: '2026-10-26T14:32:00Z',
    status: 'Selesai',
    payment_method: 'QRIS Auto Scan',
    total_amount: 32000,
    items: [
      { name: 'Netflix Premium Ultra HD 4K', plan: '1 Bulan', quantity: 1, price: 32000, icon: '🎬' }
    ],
    delivery_info: {
      platform: 'telegram',
      account_email: 'premium.member88@netflx-vip.id',
      account_password: 'SafePass#99281',
      profile_name: 'Profil 3 (PIN: 2841)',
      expiry_date: '26 November 2026',
      notes: 'Akun aktif otomatis via Bot Telegram @tesbothac_bot. Garansi resmi 30 hari.'
    }
  },
  {
    id: 1039,
    order_number: 'INV-20261025-0039',
    created_at: '2026-10-25T09:15:00Z',
    status: 'Selesai',
    payment_method: 'GoPay E-Wallet',
    total_amount: 75000,
    items: [
      { name: 'ChatGPT Plus (GPT-4o)', plan: '1 Bulan', quantity: 1, price: 75000, icon: '🤖' }
    ],
    delivery_info: {
      platform: 'telegram',
      account_email: 'ai.master.id@chatgpt-shared.com',
      account_password: 'OpenAI#Super2026',
      profile_name: 'Direct Login',
      expiry_date: '25 November 2026',
      notes: 'Jangan merubah email & metode pembayaran akun.'
    }
  },
  {
    id: 1035,
    order_number: 'INV-20261024-0012',
    created_at: '2026-10-24T18:40:00Z',
    status: 'Diproses',
    payment_method: 'BCA Virtual Account',
    total_amount: 45000,
    items: [
      { name: 'Microsoft 365 + OneDrive 1TB', plan: '1 Tahun', quantity: 1, price: 45000, icon: '💼' }
    ],
    delivery_info: {
      platform: 'whatsapp',
      notes: 'Bot sedang melakukan provisioning lisensi akun Microsoft 365. Akun akan dikirim ke WhatsApp dalam ~2 menit.'
    }
  },
  {
    id: 1028,
    order_number: 'INV-20261022-0008',
    created_at: '2026-10-22T11:20:00Z',
    status: 'Pending',
    payment_method: 'QRIS Auto Scan',
    total_amount: 18000,
    items: [
      { name: 'Spotify Premium Individual', plan: '1 Bulan', quantity: 1, price: 18000, icon: '🎵' }
    ],
    delivery_info: null
  }
];

let allTransactions = [];
let currentStatusFilter = 'Semua';

function normalizeOrderStatus(rawStatus) {
  const s = String(rawStatus || '').toLowerCase();
  if (s === 'completed' || s === 'selesai') return 'Selesai';
  if (s === 'processing' || s === 'diproses') return 'Diproses';
  if (s === 'cancelled' || s === 'dibatalkan') return 'Dibatalkan';
  return 'Pending';
}

document.addEventListener('DOMContentLoaded', () => {
  loadTransactions();
  setupFilterTabs();
});

/**
 * Load Transactions from API
 */
async function loadTransactions() {
  const container = document.getElementById('transactions-container');
  if (!container) return;

  container.innerHTML = `
    <div class="py-16 text-center">
      <div class="spinner w-8 h-8 mx-auto mb-3"></div>
      <p class="text-slate-400 text-sm">Memuat riwayat transaksi...</p>
    </div>
  `;

  try {
    const data = await apiCall('/api/orders');
    const apiOrders = Array.isArray(data) ? data : (data?.orders || []);

    localStorage.removeItem('local_orders');
    allTransactions = apiOrders.map(tx => ({
      ...tx,
      status: normalizeOrderStatus(tx.status)
    }));
  } catch (err) {
    console.log('Using default transactions:', err.message);
    const localOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
    allTransactions = localOrders.length > 0 ? [...localOrders, ...DEFAULT_TRANSACTIONS] : DEFAULT_TRANSACTIONS;
  }

  renderTransactions();
}

/**
 * Setup Status Filter Tabs
 */
function setupFilterTabs() {
  const tabs = document.querySelectorAll('.status-tab');
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      tabs.forEach(t => {
        t.classList.remove('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/20');
        t.classList.add('bg-slate-800/80', 'text-slate-400', 'hover:text-white', 'hover:bg-slate-700/80');
      });

      tab.classList.remove('bg-slate-800/80', 'text-slate-400', 'hover:text-white', 'hover:bg-slate-700/80');
      tab.classList.add('bg-indigo-600', 'text-white', 'shadow-md', 'shadow-indigo-500/20');

      currentStatusFilter = tab.dataset.status || 'Semua';
      renderTransactions();
    });
  });
}

/**
 * Render filtered transaction list
 */
function renderTransactions() {
  const container = document.getElementById('transactions-container');
  if (!container) return;

  const filtered = allTransactions.filter(item => {
    if (currentStatusFilter === 'Semua') return true;
    return normalizeOrderStatus(item.status).toLowerCase() === currentStatusFilter.toLowerCase();
  });

  if (filtered.length === 0) {
    container.innerHTML = `
      <div class="glass-panel rounded-3xl p-12 text-center border border-slate-800">
        <div class="text-5xl mb-4">📭</div>
        <h4 class="text-lg font-bold text-slate-200">Tidak Ada Transaksi</h4>
        <p class="text-sm text-slate-400 mt-1">Belum ada riwayat pesanan dengan status "${currentStatusFilter}".</p>
        <a href="catalog.html" class="inline-block mt-5 gradient-btn px-5 py-2.5 rounded-xl text-sm font-semibold text-white shadow-lg shadow-indigo-500/25">
          Mulai Belanja Sekarang
        </a>
      </div>
    `;
    return;
  }

  container.innerHTML = filtered.map(tx => {
    const status = normalizeOrderStatus(tx.status);
    let statusBadgeClass = 'bg-amber-500/10 text-amber-400 border-amber-500/30';

    if (status.toLowerCase() === 'selesai' || status.toLowerCase() === 'completed') {
      statusBadgeClass = 'bg-emerald-500/10 text-emerald-400 border-emerald-500/30';
    } else if (status.toLowerCase() === 'diproses' || status.toLowerCase() === 'processing') {
      statusBadgeClass = 'bg-sky-500/10 text-sky-400 border-sky-500/30';
    } else if (status.toLowerCase() === 'dibatalkan' || status.toLowerCase() === 'cancelled') {
      statusBadgeClass = 'bg-rose-500/10 text-rose-400 border-rose-500/30';
    }

    const formattedDate = formatTxDate(tx.created_at);
    const items = tx.items || [];
    const firstItem = items[0] || { name: 'Aplikasi Premium', plan: '1 Bulan' };
    const extraItemCount = items.length > 1 ? ` +${items.length - 1} item lainnya` : '';

    return `
      <div class="glass-panel rounded-2xl border border-slate-800/80 p-5 mb-4 card-hover overflow-hidden transition-all">
        <!-- Summary Header -->
        <div class="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-4 border-b border-slate-800/70">
          <div class="flex items-center gap-3">
            <div class="w-10 h-10 rounded-xl bg-slate-800 border border-slate-700 flex items-center justify-center text-lg">
              ${firstItem.icon || '📦'}
            </div>
            <div>
              <span class="text-xs font-mono font-medium text-indigo-300 block">${tx.order_number || `#INV-${tx.id}`}</span>
              <span class="text-xs text-slate-400">${formattedDate}</span>
            </div>
          </div>

          <div class="flex items-center gap-3 self-end sm:self-center">
            <span class="px-3 py-1 rounded-full text-xs font-semibold border ${statusBadgeClass}">
              ${status}
            </span>
            <span class="text-base font-bold text-slate-100 font-mono">
              ${formatPrice(tx.total_amount || 0)}
            </span>
          </div>
        </div>

        <!-- Order Items Preview -->
        <div class="py-3">
          <div class="flex items-center justify-between text-sm">
            <span class="text-slate-200 font-medium">${firstItem.name} ${extraItemCount}</span>
            <span class="text-xs text-slate-400">${tx.payment_method || 'QRIS Auto'}</span>
          </div>
        </div>

        <!-- Collapsible Details Toggle -->
        <div class="pt-2">
          <button 
            onclick="toggleTxDetail(${tx.id})" 
            class="text-xs font-semibold text-indigo-400 hover:text-indigo-300 flex items-center gap-1.5 focus:outline-none"
          >
            <span id="tx-toggle-text-${tx.id}">Lihat Rincian Akun & Detail</span>
            <svg id="tx-toggle-icon-${tx.id}" class="w-4 h-4 transition-transform duration-200" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 9l-7 7-7-7"></path>
            </svg>
          </button>
        </div>

        <!-- Expanded Details Drawer -->
        <div id="tx-detail-${tx.id}" class="hidden pt-4 mt-3 border-t border-slate-800/80 text-xs">
          <!-- Items List breakdown -->
          <div class="mb-4">
            <h5 class="text-slate-400 font-semibold mb-2 uppercase text-[10px] tracking-wider">Item Dipesan</h5>
            <div class="space-y-2">
              ${items.map(it => `
                <div class="flex items-center justify-between bg-slate-900/50 p-2.5 rounded-xl border border-slate-800/60">
                  <div class="flex items-center gap-2">
                    <span>${it.icon || '📦'}</span>
                    <span class="text-slate-200 font-medium">${it.name} (${it.plan || '1 Bulan'})</span>
                  </div>
                  <div class="text-right">
                    <span class="text-slate-400 mr-2">${it.quantity || 1}x</span>
                    <span class="text-slate-200 font-mono font-semibold">${formatPrice(it.price * (it.quantity || 1))}</span>
                  </div>
                </div>
              `).join('')}
            </div>
          </div>

          <!-- Account Delivery Box if Selesai -->
          ${(status.toLowerCase() === 'selesai' || status.toLowerCase() === 'completed') && tx.delivery_info ? `
            <div class="p-4 rounded-xl bg-gradient-to-r from-emerald-950/40 to-slate-900/80 border border-emerald-500/30 mb-4">
              <div class="flex items-center justify-between mb-3">
                <div class="flex items-center gap-2 text-emerald-400 font-bold">
                  <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                  <span>Data Akun Premium (Auto-Delivered)</span>
                </div>
                <span class="text-[11px] text-emerald-400/80 font-mono">Expired: ${tx.delivery_info.expiry_date || '30 Hari'}</span>
              </div>

              <div class="grid grid-cols-1 sm:grid-cols-2 gap-2.5 font-mono mb-3">
                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-400 block uppercase font-sans">Email / Username</span>
                    <span class="text-slate-200 text-xs">${tx.delivery_info.account_email || 'akun@premium.id'}</span>
                  </div>
                  <button onclick="copyToClipboard('${tx.delivery_info.account_email}', 'Email akun')" class="p-1 hover:text-indigo-400 text-slate-400 transition-colors" title="Salin Email">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>

                <div class="bg-slate-900/80 p-2.5 rounded-lg border border-slate-700/60 flex items-center justify-between">
                  <div>
                    <span class="text-[10px] text-slate-400 block uppercase font-sans">Password</span>
                    <span class="text-slate-200 text-xs">${tx.delivery_info.account_password || '********'}</span>
                  </div>
                  <button onclick="copyToClipboard('${tx.delivery_info.account_password}', 'Password akun')" class="p-1 hover:text-indigo-400 text-slate-400 transition-colors" title="Salin Password">
                    <svg class="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"></path></svg>
                  </button>
                </div>
              </div>

              ${tx.delivery_info.profile_name ? `
                <div class="text-[11px] text-slate-300 bg-slate-900/60 p-2 rounded-lg border border-slate-800 mb-2">
                  <span class="text-indigo-300 font-semibold">Petunjuk Profil:</span> ${tx.delivery_info.profile_name}
                </div>
              ` : ''}

              <div class="mt-3 p-4 rounded-xl bg-slate-950/80 border border-slate-800/90">
                <div class="flex items-center gap-1.5 text-sky-400 font-bold text-xs mb-2.5">
                  <span>📄</span>
                  <span>Syarat & Ketentuan (SnK):</span>
                </div>
                <div class="text-[11px] text-slate-200 font-mono whitespace-pre-line leading-relaxed">${firstItem.product_snk || tx.delivery_info.notes || 'Akun ini resmi dan bergaransi penuh.'}</div>
              </div>
            </div>
          ` : ''}

          <!-- If Pending, show quick pay helper -->
          ${status.toLowerCase() === 'pending' ? `
            <div class="p-4 rounded-xl bg-amber-950/30 border border-amber-500/30 mb-4 flex flex-col sm:flex-row items-center justify-between gap-3">
              <div>
                <h6 class="text-amber-300 font-bold mb-0.5">Menunggu Pembayaran</h6>
                <p class="text-slate-300 text-[11px]">Selesaikan pembayaran via ${tx.payment_method || 'QRIS'} agar bot mengirim akun otomatis.</p>
              </div>
              <button onclick="showToast('Silakan scan QRIS yang tersedia pada struk pesanan.', 'info')" class="px-4 py-2 rounded-xl bg-amber-500 text-slate-950 font-bold text-xs hover:bg-amber-400 transition-colors flex-shrink-0">
                Bayar Sekarang
              </button>
            </div>
          ` : ''}

          <!-- Action buttons -->
          <div class="flex items-center justify-between pt-2">
            <span class="text-slate-400 text-[11px]">Metode Pembayaran: <strong class="text-slate-200">${tx.payment_method || 'QRIS Auto'}</strong></span>
            <div class="flex gap-2">
              <a href="https://t.me/${window.APP_CONFIG?.botUsername || 'tesbothac_bot'}" target="_blank" class="px-3 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-indigo-400 font-medium text-xs border border-slate-700 transition-colors">
                Bantuan Bot
              </a>
              <button onclick="buyAgain('${firstItem.name}')" class="px-3 py-1.5 rounded-lg bg-indigo-600/30 hover:bg-indigo-600/50 text-indigo-300 font-medium text-xs border border-indigo-500/40 transition-colors">
                Beli Lagi
              </button>
            </div>
          </div>
        </div>
      </div>
    `;
  }).join('');
}

/**
 * Toggle Order Detail Section
 */
function toggleTxDetail(id) {
  const detail = document.getElementById(`tx-detail-${id}`);
  const icon = document.getElementById(`tx-toggle-icon-${id}`);
  const text = document.getElementById(`tx-toggle-text-${id}`);

  if (!detail) return;

  const isHidden = detail.classList.contains('hidden');
  if (isHidden) {
    detail.classList.remove('hidden');
    if (icon) icon.classList.add('rotate-180');
    if (text) text.textContent = 'Tutup Rincian';
  } else {
    detail.classList.add('hidden');
    if (icon) icon.classList.remove('rotate-180');
    if (text) text.textContent = 'Lihat Rincian Akun & Detail';
  }
}

/**
 * Copy credential text to clipboard
 */
function copyToClipboard(text, label = 'Teks') {
  if (!text) return;
  navigator.clipboard.writeText(text).then(() => {
    showToast(`${label} berhasil disalin!`, 'success');
  }).catch(() => {
    showToast(`Gagal menyalin ${label}.`, 'error');
  });
}

function buyAgain(name) {
  window.location.href = `catalog.html?search=${encodeURIComponent(name)}`;
}

function formatTxDate(dateString) {
  if (!dateString) return 'Baru Saja';
  try {
    const d = new Date(dateString);
    return d.toLocaleDateString('id-ID', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  } catch (e) {
    return dateString;
  }
}