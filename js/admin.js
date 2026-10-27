/**
 * Admin Panel - AutoOrder Premium
 * Real-time dashboard, product/order/user management
 */

const ADMIN_API = '/api/admin';
let currentTab = 'dashboard';
let refreshInterval = null;

function getAdminToken() { return localStorage.getItem('admin_token'); }
function setAdminToken(t) { localStorage.setItem('admin_token', t); }
function clearAdminToken() { localStorage.removeItem('admin_token'); }

function formatRupiah(n) { return 'Rp ' + Number(n || 0).toLocaleString('id-ID'); }
function formatDate(d) {
  if (!d) return '-';
  const dt = new Date(d.replace(' ', 'T') + (d.includes('T') ? '' : 'Z'));
  return dt.toLocaleDateString('id-ID', { day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit' });
}

async function adminApi(endpoint, method = 'GET', body = null) {
  const headers = { 'Content-Type': 'application/json' };
  const token = getAdminToken();
  if (token) headers['Authorization'] = `Bearer ${token}`;
  const opts = { method, headers };
  if (body) opts.body = JSON.stringify(body);
  const res = await fetch(`${ADMIN_API}${endpoint}`, opts);
  if (res.status === 401 || res.status === 403) { clearAdminToken(); showLogin(); throw new Error('Unauthorized'); }
  return res.json();
}

// =================== INIT ===================
document.addEventListener('DOMContentLoaded', () => {
  if (getAdminToken()) { showPanel(); loadDashboard(); }
  else showLogin();
});

// =================== AUTH ===================
function showLogin() {
  document.getElementById('login-screen').classList.remove('hidden');
  document.getElementById('admin-panel').classList.add('hidden');
  if (refreshInterval) clearInterval(refreshInterval);
}
function showPanel() {
  document.getElementById('login-screen').classList.add('hidden');
  document.getElementById('admin-panel').classList.remove('hidden');
}

async function handleAdminLogin(e) {
  e.preventDefault();
  const username = document.getElementById('admin-username').value;
  const password = document.getElementById('admin-password').value;
  const errEl = document.getElementById('login-error');
  try {
    const data = await fetch(`${ADMIN_API}/login`, {
      method: 'POST', headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ username, password })
    }).then(r => r.json());
    if (data.success && data.token) {
      setAdminToken(data.token);
      showPanel();
      loadDashboard();
    } else {
      errEl.textContent = data.message || 'Login gagal';
      errEl.classList.remove('hidden');
    }
  } catch (err) {
    errEl.textContent = 'Gagal terhubung ke server';
    errEl.classList.remove('hidden');
  }
}

function adminLogout() {
  clearAdminToken();
  if (refreshInterval) clearInterval(refreshInterval);
  showLogin();
}

// =================== SIDEBAR ===================
function toggleSidebar() {
  const sb = document.getElementById('sidebar');
  sb.classList.toggle('-translate-x-full');
}

function switchTab(tab) {
  currentTab = tab;
  document.querySelectorAll('.sidebar-link').forEach(l => {
    l.classList.toggle('active', l.dataset.tab === tab);
    if (l.dataset.tab !== tab) l.classList.add('text-slate-400');
    else l.classList.remove('text-slate-400');
  });
  const titles = { dashboard: '📊 Dashboard', products: '📦 Kelola Produk', accounts: '🔑 Stok Akun', orders: '📋 Rekap Transaksi', users: '👥 Pengguna' };
  document.getElementById('page-title').textContent = titles[tab] || '';
  if (tab === 'dashboard') loadDashboard();
  else if (tab === 'products') loadProducts();
  else if (tab === 'accounts') loadAccountStocks();
  else if (tab === 'orders') loadOrders();
  else if (tab === 'users') loadUsers();
  // Auto close sidebar on mobile
  const sb = document.getElementById('sidebar');
  if (window.innerWidth < 1024) sb.classList.add('-translate-x-full');
}

// =================== DASHBOARD ===================
async function loadDashboard() {
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="flex justify-center py-20"><div class="spinner w-8 h-8"></div></div>';
  try {
    const res = await adminApi('/dashboard');
    const d = res.data;
    area.innerHTML = `
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${statCard('👥', 'Total Pengguna', d.totalUsers, 'from-blue-500/10 to-cyan-500/10', 'border-blue-500')}
        ${statCard('📦', 'Total Transaksi', d.totalOrders, 'from-purple-500/10 to-pink-500/10', 'border-purple-500')}
        ${statCard('💰', 'Total Pendapatan', formatRupiah(d.totalRevenue), 'from-amber-500/10 to-orange-500/10', 'border-amber-500')}
        ${statCard('🔥', 'Produk Terjual', d.totalProductsSold, 'from-green-500/10 to-emerald-500/10', 'border-green-500')}
      </div>
      <div class="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        ${miniCard('⏳', 'Pending', d.pendingOrders, 'text-yellow-400')}
        ${miniCard('✅', 'Selesai', d.completedOrders, 'text-green-400')}
        ${miniCard('📅', 'Order Hari Ini', d.todayOrders, 'text-blue-400')}
        ${miniCard('💵', 'Pendapatan Hari Ini', formatRupiah(d.todayRevenue), 'text-amber-400')}
      </div>
      <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div class="px-5 py-4 border-b border-slate-800 flex items-center justify-between">
          <h3 class="text-sm font-bold text-white">📋 Transaksi Terbaru</h3>
          <button onclick="switchTab('orders')" class="text-xs text-amber-400 hover:text-amber-300">Lihat Semua →</button>
        </div>
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-4 py-3 text-left">No. Order</th><th class="px-4 py-3 text-left">Pembeli</th><th class="px-4 py-3 text-left">Produk</th><th class="px-4 py-3 text-right">Total</th><th class="px-4 py-3 text-center">Status</th><th class="px-4 py-3 text-right">Waktu</th>
            </tr></thead>
            <tbody>
              ${d.recentOrders && d.recentOrders.length > 0 ? d.recentOrders.map(o => `
                <tr class="border-b border-slate-800/50">
                  <td class="px-4 py-3 font-mono text-amber-400">${o.order_number || '-'}</td>
                  <td class="px-4 py-3">
                    <div class="font-semibold text-white">${o.username}</div>
                    <div class="text-slate-500">${o.linked_platform === 'telegram' ? '🤖 ' + (o.telegram_id || '') : '📱 ' + (o.wa_number || '')}</div>
                  </td>
                  <td class="px-4 py-3">${o.items ? o.items.map(i => i.product_name + ' x' + i.quantity).join(', ') : '-'}</td>
                  <td class="px-4 py-3 text-right font-semibold text-white">${formatRupiah(o.total)}</td>
                  <td class="px-4 py-3 text-center">${statusBadge(o.status)}</td>
                  <td class="px-4 py-3 text-right text-slate-400">${formatDate(o.created_at)}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada transaksi</td></tr>'}
            </tbody>
          </table>
        </div>
      </div>
    `;
    startPolling();
  } catch (e) { area.innerHTML = `<p class="text-red-400 text-center py-10">${e.message}</p>`; }
}

function statCard(icon, label, value, gradient, border) {
  return `<div class="stat-card bg-gradient-to-br ${gradient} bg-slate-900 rounded-2xl border border-slate-800 p-5 border-l-4 ${border}">
    <div class="text-2xl mb-2">${icon}</div>
    <div class="text-[11px] text-slate-400 font-medium mb-1">${label}</div>
    <div class="text-xl font-extrabold text-white" data-stat="${label}">${value}</div>
  </div>`;
}
function miniCard(icon, label, value, color) {
  return `<div class="bg-slate-900 rounded-xl border border-slate-800 p-4 text-center">
    <div class="text-lg">${icon}</div>
    <div class="text-[10px] text-slate-400 mt-1">${label}</div>
    <div class="text-base font-bold ${color}" data-stat="${label}">${value}</div>
  </div>`;
}
function statusBadge(s) {
  const map = {
    pending: ['Pending', 'badge-yellow'],
    processing: ['Diproses', 'badge-blue'],
    completed: ['Selesai', 'badge-green'],
    cancelled: ['Dibatalkan', 'badge-red']
  };
  const [t, c] = map[s] || ['Unknown', 'badge-purple'];
  return `<span class="badge ${c}">${t}</span>`;
}

function startPolling() {
  if (refreshInterval) clearInterval(refreshInterval);
  refreshInterval = setInterval(async () => {
    if (currentTab !== 'dashboard') return;
    try {
      const res = await adminApi('/stats/realtime');
      const d = res.data;
      updateStat('Total Pengguna', d.totalUsers);
      updateStat('Total Transaksi', d.totalOrders);
      updateStat('Total Pendapatan', formatRupiah(d.totalRevenue));
      updateStat('Produk Terjual', d.totalProductsSold);
      updateStat('Pending', d.pendingOrders);
      updateStat('Selesai', d.completedOrders);
      updateStat('Order Hari Ini', d.todayOrders);
      updateStat('Pendapatan Hari Ini', formatRupiah(d.todayRevenue));
    } catch (e) {}
  }, 5000);
}
function updateStat(label, value) {
  document.querySelectorAll(`[data-stat="${label}"]`).forEach(el => {
    if (el.textContent !== String(value)) {
      el.textContent = value;
      el.style.transition = 'color .3s';
      el.style.color = '#fbbf24';
      setTimeout(() => el.style.color = '', 600);
    }
  });
}

// =================== PRODUCTS ===================
async function loadProducts() {
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="flex justify-center py-20"><div class="spinner w-8 h-8"></div></div>';
  try {
    const res = await adminApi('/products');
    const products = res.data || [];
    area.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-slate-400">${products.length} produk terdaftar</p>
        <button onclick="openProductModal()" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/25 flex items-center gap-1.5">
          <span class="text-base">+</span> Tambah Produk
        </button>
      </div>
      <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-4 py-3 text-left">ID</th><th class="px-4 py-3 text-left">Kode</th><th class="px-4 py-3 text-left">Nama Produk</th><th class="px-4 py-3 text-left">Kategori</th><th class="px-4 py-3 text-right">Harga</th><th class="px-4 py-3 text-center">Stok</th><th class="px-4 py-3 text-center">Terjual</th><th class="px-4 py-3 text-center">Status</th><th class="px-4 py-3 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              ${products.map(p => `
                <tr class="border-b border-slate-800/50">
                  <td class="px-4 py-3 text-slate-500">#${p.id}</td>
                  <td class="px-4 py-3 font-mono text-amber-400">${p.product_code || '-'}</td>
                  <td class="px-4 py-3 font-semibold text-white">${p.name}</td>
                  <td class="px-4 py-3"><span class="badge badge-purple">${p.category || '-'}</span></td>
                  <td class="px-4 py-3 text-right font-semibold text-teal-400">${formatRupiah(p.price)}</td>
                  <td class="px-4 py-3 text-center ${p.stock < 5 ? 'text-red-400 font-bold' : 'text-white'}">${p.stock}</td>
                  <td class="px-4 py-3 text-center text-amber-400 font-semibold">${p.total_sold || 0}</td>
                  <td class="px-4 py-3 text-center">${p.is_active ? '<span class="badge badge-green">Aktif</span>' : '<span class="badge badge-red">Nonaktif</span>'}</td>
                  <td class="px-4 py-3 text-center">
                    <div class="flex items-center justify-center gap-1">
                      <button onclick='openProductModal(${JSON.stringify(p).replace(/'/g, "&#39;")})' class="px-2 py-1 rounded-lg bg-blue-500/10 text-blue-400 hover:bg-blue-500/20 text-[10px] font-semibold">Edit</button>
                      <button onclick="toggleProduct(${p.id})" class="px-2 py-1 rounded-lg ${p.is_active ? 'bg-yellow-500/10 text-yellow-400 hover:bg-yellow-500/20' : 'bg-green-500/10 text-green-400 hover:bg-green-500/20'} text-[10px] font-semibold">${p.is_active ? 'Hide' : 'Show'}</button>
                      <button onclick="deleteProduct(${p.id})" class="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-semibold">Hapus</button>
                    </div>
                  </td>
                </tr>
              `).join('')}
              ${products.length === 0 ? '<tr><td colspan="9" class="px-4 py-8 text-center text-slate-500">Belum ada produk</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) { area.innerHTML = `<p class="text-red-400 text-center py-10">${e.message}</p>`; }
}

function openProductModal(product = null) {
  document.getElementById('product-modal').classList.remove('hidden');
  document.getElementById('product-modal-title').textContent = product ? 'Edit Produk' : 'Tambah Produk Baru';
  document.getElementById('edit-product-id').value = product ? product.id : '';
  document.getElementById('prod-name').value = product ? product.name : '';
  document.getElementById('prod-code').value = product ? (product.product_code || '') : '';
  document.getElementById('prod-category').value = product ? (product.category || 'Streaming') : 'Streaming';
  document.getElementById('prod-price').value = product ? product.price : '';
  document.getElementById('prod-stock').value = product ? product.stock : 0;
  document.getElementById('prod-desc').value = product ? (product.description || '') : '';
  document.getElementById('prod-snk').value = product ? (product.snk || '') : '';
  document.getElementById('prod-wmin').value = product ? (product.wholesale_min || 0) : 0;
  document.getElementById('prod-wprice').value = product ? (product.wholesale_price || 0) : 0;
  document.getElementById('prod-active').checked = product ? !!product.is_active : true;
}
function closeProductModal() { document.getElementById('product-modal').classList.add('hidden'); }

async function handleSaveProduct(e) {
  e.preventDefault();
  const id = document.getElementById('edit-product-id').value;
  const data = {
    name: document.getElementById('prod-name').value,
    product_code: document.getElementById('prod-code').value,
    category: document.getElementById('prod-category').value,
    price: parseFloat(document.getElementById('prod-price').value),
    stock: parseInt(document.getElementById('prod-stock').value) || 0,
    description: document.getElementById('prod-desc').value,
    snk: document.getElementById('prod-snk').value,
    wholesale_min: parseInt(document.getElementById('prod-wmin').value) || 0,
    wholesale_price: parseFloat(document.getElementById('prod-wprice').value) || 0,
    is_active: document.getElementById('prod-active').checked ? 1 : 0
  };
  try {
    if (id) {
      await adminApi(`/products/${id}`, 'PUT', data);
      showAdminToast('Produk berhasil diperbarui', 'success');
    } else {
      await adminApi('/products', 'POST', data);
      showAdminToast('Produk berhasil ditambahkan', 'success');
    }
    closeProductModal();
    loadProducts();
  } catch (e) { showAdminToast(e.message, 'error'); }
}

async function toggleProduct(id) {
  try {
    const res = await adminApi(`/products/${id}/toggle`, 'PATCH');
    showAdminToast(res.message, 'success');
    loadProducts();
  } catch (e) { showAdminToast(e.message, 'error'); }
}

async function deleteProduct(id) {
  if (!confirm('Yakin ingin menghapus produk ini?')) return;
  try {
    await adminApi(`/products/${id}`, 'DELETE');
    showAdminToast('Produk berhasil dihapus', 'success');
    loadProducts();
  } catch (e) { showAdminToast(e.message, 'error'); }
}

// =================== ORDERS ===================
let orderFilter = 'all';
async function loadOrders() {
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="flex justify-center py-20"><div class="spinner w-8 h-8"></div></div>';
  try {
    const res = await adminApi('/orders');
    const orders = res.data || [];
    const filtered = orderFilter === 'all' ? orders : orders.filter(o => o.status === orderFilter);

    area.innerHTML = `
      <div class="flex items-center gap-2 mb-5 overflow-x-auto pb-1">
        ${['all', 'pending', 'processing', 'completed', 'cancelled'].map(s => `
          <button onclick="orderFilter='${s}';loadOrders()" class="px-4 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${orderFilter === s ? 'bg-gradient-to-r from-amber-500 to-orange-600 text-white shadow' : 'bg-slate-800 text-slate-400 hover:bg-slate-700'}">${s === 'all' ? 'Semua (' + orders.length + ')' : (s === 'pending' ? 'Pending' : s === 'processing' ? 'Diproses' : s === 'completed' ? 'Selesai' : 'Dibatalkan') + ' (' + orders.filter(o => o.status === s).length + ')'}</button>
        `).join('')}
      </div>
      <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-4 py-3 text-left">No. Order</th><th class="px-4 py-3 text-left">Tanggal</th><th class="px-4 py-3 text-left">Username</th><th class="px-4 py-3 text-left">Akun Tele/WA</th><th class="px-4 py-3 text-left">Produk Dibeli</th><th class="px-4 py-3 text-left">Akun Terkirim</th><th class="px-4 py-3 text-center">Jumlah</th><th class="px-4 py-3 text-right">Total</th><th class="px-4 py-3 text-center">Status</th><th class="px-4 py-3 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              ${filtered.map(o => {
                const items = o.items || [];
                const prodNames = items.map(i => i.product_name).join(', ') || '-';
                const totalQty = items.reduce((s, i) => s + i.quantity, 0);
                const account = o.linked_platform === 'telegram' ? `🤖 ${o.telegram_id || '-'}` : `📱 ${o.wa_number || '-'}`;
                const assignedList = (o.assigned_accounts || []).map(a => a.account_data).join(', ') || '-';
                return `<tr class="border-b border-slate-800/50">
                  <td class="px-4 py-3 font-mono text-amber-400">${o.order_number || '-'}</td>
                  <td class="px-4 py-3 text-slate-400">${formatDate(o.created_at)}</td>
                  <td class="px-4 py-3 font-semibold text-white">${o.username}</td>
                  <td class="px-4 py-3 text-slate-300">${account}</td>
                  <td class="px-4 py-3 text-teal-400 max-w-[180px] truncate" title="${prodNames}">${prodNames}</td>
                  <td class="px-4 py-3 font-mono text-xs ${assignedList !== '-' ? 'text-green-400' : 'text-slate-500'} max-w-[180px] truncate" title="${assignedList}">${assignedList}</td>
                  <td class="px-4 py-3 text-center text-white font-semibold">${totalQty}</td>
                  <td class="px-4 py-3 text-right font-bold text-white">${formatRupiah(o.total)}</td>
                  <td class="px-4 py-3 text-center">${statusBadge(o.status)}</td>
                  <td class="px-4 py-3 text-center">
                    <select onchange="updateOrderStatus(${o.id}, this.value)" class="bg-slate-800 border border-slate-700 text-[10px] rounded-lg px-2 py-1 text-white focus:outline-none focus:border-amber-500">
                      <option value="pending" ${o.status === 'pending' ? 'selected' : ''}>Pending</option>
                      <option value="processing" ${o.status === 'processing' ? 'selected' : ''}>Diproses</option>
                      <option value="completed" ${o.status === 'completed' ? 'selected' : ''}>Selesai</option>
                      <option value="cancelled" ${o.status === 'cancelled' ? 'selected' : ''}>Batal</option>
                    </select>
                  </td>
                </tr>`;
              }).join('')}
              ${filtered.length === 0 ? '<tr><td colspan="10" class="px-4 py-8 text-center text-slate-500">Belum ada transaksi</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
  } catch (e) { area.innerHTML = `<p class="text-red-400 text-center py-10">${e.message}</p>`; }
}

async function updateOrderStatus(id, status) {
  try {
    const res = await adminApi(`/orders/${id}/status`, 'PUT', { status });
    showAdminToast(res.message || `Status diubah ke ${status}`, 'success');
    loadOrders();
  } catch (e) { showAdminToast(e.message, 'error'); }
}

// =================== USERS ===================
async function loadUsers() {
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="flex justify-center py-20"><div class="spinner w-8 h-8"></div></div>';
  try {
    const res = await adminApi('/users');
    const users = res.data || [];
    area.innerHTML = `
      <div class="flex items-center justify-between mb-5">
        <p class="text-sm text-slate-400">${users.length} pengguna terdaftar</p>
        <div class="relative">
          <input type="text" id="user-search" placeholder="Cari pengguna..." oninput="filterUsers()" class="px-3 py-2 rounded-xl bg-slate-800 border border-slate-700 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-amber-500 w-48">
        </div>
      </div>
      <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden">
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-4 py-3 text-left">ID</th><th class="px-4 py-3 text-left">Username</th><th class="px-4 py-3 text-left">Email</th><th class="px-4 py-3 text-center">Platform</th><th class="px-4 py-3 text-left">ID Tele / No. WA</th><th class="px-4 py-3 text-center">Total Order</th><th class="px-4 py-3 text-right">Total Belanja</th><th class="px-4 py-3 text-right">Saldo</th><th class="px-4 py-3 text-right">Bergabung</th><th class="px-4 py-3 text-center">Aksi</th>
            </tr></thead>
            <tbody id="users-tbody">
              ${users.map(u => userRow(u)).join('')}
              ${users.length === 0 ? '<tr><td colspan="10" class="px-4 py-8 text-center text-slate-500">Belum ada pengguna</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;
    window._adminUsers = users;
  } catch (e) { area.innerHTML = `<p class="text-red-400 text-center py-10">${e.message}</p>`; }
}

function userRow(u) {
  const platform = u.linked_platform === 'telegram'
    ? '<span class="badge badge-blue">🤖 Telegram</span>'
    : '<span class="badge badge-green">📱 WhatsApp</span>';
  const accountId = u.linked_platform === 'telegram' ? (u.telegram_id || '-') : (u.wa_number || '-');
  return `<tr class="border-b border-slate-800/50 user-row" data-search="${(u.username + u.email + accountId).toLowerCase()}">
    <td class="px-4 py-3 text-slate-500">#${u.id}</td>
    <td class="px-4 py-3 font-semibold text-white">${u.username}</td>
    <td class="px-4 py-3 text-slate-300">${u.email}</td>
    <td class="px-4 py-3 text-center">${platform}</td>
    <td class="px-4 py-3 font-mono text-amber-400">${accountId}</td>
    <td class="px-4 py-3 text-center text-white font-semibold">${u.total_orders || 0}</td>
    <td class="px-4 py-3 text-right font-semibold text-teal-400">${formatRupiah(u.total_spent)}</td>
    <td class="px-4 py-3 text-right font-bold text-amber-400">${formatRupiah(u.balance)}</td>
    <td class="px-4 py-3 text-right text-slate-400">${formatDate(u.created_at)}</td>
    <td class="px-4 py-3 text-center"><button onclick="openBalanceModal(${u.id})" class="px-3 py-1 rounded-lg bg-amber-500/15 text-amber-400 hover:bg-amber-500/25 text-[11px] font-semibold whitespace-nowrap">💰 Saldo</button></td>
  </tr>`;
}

function openBalanceModal(userId) {
  const u = (window._adminUsers || []).find(x => x.id === userId);
  if (!u) return;
  document.getElementById('balance-user-id').value = u.id;
  document.getElementById('balance-username').textContent = u.username;
  document.getElementById('balance-current').textContent = formatRupiah(u.balance);
  document.getElementById('balance-action').value = 'add';
  document.getElementById('balance-amount').value = '';
  document.getElementById('balance-modal').classList.remove('hidden');
}
function closeBalanceModal() { document.getElementById('balance-modal').classList.add('hidden'); }

async function handleSaveBalance(e) {
  e.preventDefault();
  const id = document.getElementById('balance-user-id').value;
  const action = document.getElementById('balance-action').value;
  const amount = parseFloat(document.getElementById('balance-amount').value);
  try {
    const res = await adminApi(`/users/${id}/balance`, 'PUT', { action, amount });
    showAdminToast(res.message || 'Saldo diperbarui', 'success');
    closeBalanceModal();
    loadUsers();
  } catch (err) { showAdminToast(err.message, 'error'); }
}

function filterUsers() {
  const q = (document.getElementById('user-search')?.value || '').toLowerCase();
  document.querySelectorAll('.user-row').forEach(row => {
    row.style.display = row.dataset.search.includes(q) ? '' : 'none';
  });
}

// =================== ACCOUNT STOCKS ===================
let selectedProductId = null;

async function loadAccountStocks() {
  const area = document.getElementById('content-area');
  area.innerHTML = '<div class="flex justify-center py-20"><div class="spinner w-8 h-8"></div></div>';
  try {
    const res = await adminApi('/accounts-summary');
    const products = res.data || [];
    area.innerHTML = `
      <div class="mb-5">
        <p class="text-sm text-slate-400 mb-1">Pilih produk untuk mengelola stok akun (email/password).</p>
        <p class="text-xs text-slate-500">Format input: <code class="bg-slate-800 px-1.5 py-0.5 rounded text-amber-400">email|password</code> (satu akun per baris)</p>
      </div>
      <div class="bg-slate-900 rounded-2xl border border-slate-800 overflow-hidden mb-6">
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-4 py-3 text-left">Produk</th><th class="px-4 py-3 text-left">Kode</th><th class="px-4 py-3 text-center">Tersedia</th><th class="px-4 py-3 text-center">Terjual</th><th class="px-4 py-3 text-center">Total</th><th class="px-4 py-3 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              ${products.map(p => `
                <tr class="border-b border-slate-800/50 hover:bg-slate-800/30 cursor-pointer" onclick="viewProductAccounts(${p.id}, '${p.name.replace(/'/g, "\\'")}')">
                  <td class="px-4 py-3 font-semibold text-white">${p.name}</td>
                  <td class="px-4 py-3 font-mono text-amber-400">${p.product_code || '-'}</td>
                  <td class="px-4 py-3 text-center"><span class="badge badge-green">${p.available}</span></td>
                  <td class="px-4 py-3 text-center"><span class="badge badge-red">${p.sold}</span></td>
                  <td class="px-4 py-3 text-center text-white font-semibold">${p.total}</td>
                  <td class="px-4 py-3 text-center">
                    <button onclick="event.stopPropagation(); viewProductAccounts(${p.id}, '${p.name.replace(/'/g, "\\'")}')" class="px-3 py-1 rounded-lg bg-amber-500/10 text-amber-400 hover:bg-amber-500/20 text-[10px] font-semibold">Kelola Stok</button>
                  </td>
                </tr>
              `).join('')}
              ${products.length === 0 ? '<tr><td colspan="6" class="px-4 py-8 text-center text-slate-500">Belum ada produk aktif</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
      <div id="account-detail-area"></div>
    `;
  } catch (e) { area.innerHTML = `<p class="text-red-400 text-center py-10">${e.message}</p>`; }
}

async function viewProductAccounts(productId, productName) {
  selectedProductId = productId;
  const detailArea = document.getElementById('account-detail-area');
  if (!detailArea) return;
  detailArea.innerHTML = '<div class="flex justify-center py-10"><div class="spinner w-6 h-6"></div></div>';

  try {
    const res = await adminApi(`/accounts/${productId}`);
    const accounts = res.data || [];
    const stats = res.stats || {};

    detailArea.innerHTML = `
      <div class="bg-slate-900 rounded-2xl border border-amber-500/30 p-5">
        <div class="flex items-center justify-between mb-4">
          <div>
            <h3 class="text-base font-bold text-white">🔑 Stok Akun: ${productName}</h3>
            <p class="text-xs text-slate-400 mt-1">
              <span class="text-green-400 font-semibold">${stats.available || 0} tersedia</span> · 
              <span class="text-red-400">${stats.sold || 0} terjual</span> · 
              Total ${stats.total || 0}
            </p>
          </div>
        </div>

        <!-- Add Accounts Form -->
        <div class="bg-slate-800/50 rounded-xl p-4 border border-slate-700/50 mb-4">
          <h4 class="text-sm font-bold text-amber-400 mb-2">➕ Tambah Akun Baru</h4>
          <p class="text-[10px] text-slate-400 mb-2">Masukkan data akun, satu akun per baris. Format: <code class="bg-slate-900 px-1 py-0.5 rounded text-amber-400">email|password</code> atau format bebas.</p>
          <textarea id="bulk-accounts-input" rows="5" placeholder="contoh@gmail.com|password123&#10;user2@gmail.com|pass456&#10;akun3@mail.com|secretpass" class="w-full px-3 py-2 rounded-xl bg-slate-900 border border-slate-600 text-xs text-white font-mono placeholder-slate-500 focus:outline-none focus:border-amber-500 resize-none"></textarea>
          <div class="flex items-center justify-between mt-3">
            <span class="text-[10px] text-slate-500" id="lines-count">0 akun siap ditambahkan</span>
            <button onclick="addBulkAccounts(${productId})" class="px-4 py-2 rounded-xl bg-gradient-to-r from-amber-500 to-orange-600 text-white text-xs font-bold shadow-lg shadow-amber-500/25">Tambah Akun</button>
          </div>
        </div>

        <!-- Accounts List -->
        <div class="overflow-x-auto">
          <table class="w-full text-xs admin-table">
            <thead><tr class="text-slate-400 border-b border-slate-800">
              <th class="px-3 py-2 text-left">ID</th><th class="px-3 py-2 text-left">Data Akun</th><th class="px-3 py-2 text-center">Status</th><th class="px-3 py-2 text-left">Pembeli</th><th class="px-3 py-2 text-center">Aksi</th>
            </tr></thead>
            <tbody>
              ${accounts.map(a => `
                <tr class="border-b border-slate-800/50">
                  <td class="px-3 py-2 text-slate-500">#${a.id}</td>
                  <td class="px-3 py-2 font-mono text-teal-400 text-[11px]">${a.account_data}</td>
                  <td class="px-3 py-2 text-center">${a.status === 'available' ? '<span class="badge badge-green">Tersedia</span>' : '<span class="badge badge-red">Terjual</span>'}</td>
                  <td class="px-3 py-2 text-slate-300">${a.sold_to_username || '-'}</td>
                  <td class="px-3 py-2 text-center">
                    ${a.status === 'available' ? `<button onclick="deleteAccount(${a.id}, ${productId}, '${productName.replace(/'/g, "\\'")}')" class="px-2 py-1 rounded-lg bg-red-500/10 text-red-400 hover:bg-red-500/20 text-[10px] font-semibold">Hapus</button>` : '<span class="text-slate-600 text-[10px]">-</span>'}
                  </td>
                </tr>
              `).join('')}
              ${accounts.length === 0 ? '<tr><td colspan="5" class="px-3 py-6 text-center text-slate-500">Belum ada stok akun. Tambahkan di atas.</td></tr>' : ''}
            </tbody>
          </table>
        </div>
      </div>
    `;

    // Line counter for textarea
    const textarea = document.getElementById('bulk-accounts-input');
    if (textarea) {
      textarea.addEventListener('input', () => {
        const lines = textarea.value.split('\n').filter(l => l.trim()).length;
        document.getElementById('lines-count').textContent = `${lines} akun siap ditambahkan`;
      });
    }
  } catch (e) { detailArea.innerHTML = `<p class="text-red-400 text-sm">${e.message}</p>`; }
}

async function addBulkAccounts(productId) {
  const textarea = document.getElementById('bulk-accounts-input');
  if (!textarea) return;
  const lines = textarea.value.split('\n').map(l => l.trim()).filter(l => l);
  if (lines.length === 0) { showAdminToast('Masukkan minimal 1 data akun', 'error'); return; }

  try {
    const res = await adminApi(`/accounts/${productId}`, 'POST', { accounts: lines });
    showAdminToast(res.message, 'success');
    const product = document.querySelector(`#account-detail-area h3`);
    const name = product ? product.textContent.replace('🔑 Stok Akun: ', '') : '';
    await loadAccountStocks();
    await viewProductAccounts(productId, name);
  } catch (e) { showAdminToast(e.message, 'error'); }
}

async function deleteAccount(accountId, productId, productName) {
  if (!confirm('Yakin hapus akun ini?')) return;
  try {
    await adminApi(`/accounts/item/${accountId}`, 'DELETE');
    showAdminToast('Akun berhasil dihapus', 'success');
    await loadAccountStocks();
    await viewProductAccounts(productId, productName);
  } catch (e) { showAdminToast(e.message, 'error'); }
}

// =================== TOAST ===================
function showAdminToast(message, type = 'info') {
  const container = document.getElementById('admin-toast-container');
  const colors = { success: 'border-green-500 text-green-400', error: 'border-red-500 text-red-400', info: 'border-blue-500 text-blue-400' };
  const icons = { success: '✅', error: '❌', info: 'ℹ️' };
  const toast = document.createElement('div');
  toast.className = `flex items-center gap-2 px-4 py-3 rounded-xl bg-slate-900 border ${colors[type] || colors.info} shadow-xl text-sm animate-slide-up`;
  toast.innerHTML = `<span>${icons[type] || icons.info}</span> <span class="text-slate-100">${message}</span>`;
  container.appendChild(toast);
  setTimeout(() => { toast.style.opacity = '0'; toast.style.transition = 'opacity .3s'; setTimeout(() => toast.remove(), 300); }, 3500);
}
