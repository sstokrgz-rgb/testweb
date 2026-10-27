/**
 * Auto Order App Premium - Shopping Cart Logic
 * Manages cart state, quantity modification, summary calculation, and checkout API submission.
 */

let realtimeStockById = new Map();
let realtimeStockByName = new Map();
let cartStockInterval = null;
let currentUserBalance = 0;

function normalizeProductName(str) {
  return String(str || '')
    .replace(/^[\p{Emoji}\u2000-\u3300\s]+/u, '')
    .trim()
    .toLowerCase();
}

document.addEventListener('DOMContentLoaded', () => {
  renderCart();
  setupCheckoutEvents();
  fetchRealtimeCartStock();
  fetchRealtimeUserBalance();

  if (cartStockInterval) clearInterval(cartStockInterval);
  cartStockInterval = setInterval(fetchRealtimeCartStock, 3000);
});

/**
 * Ambil stok produk secara real-time dari server
 */
async function fetchRealtimeCartStock() {
  try {
    const res = await fetch('/api/products?t=' + Date.now(), {
      headers: { 'Cache-Control': 'no-cache' }
    });
    if (!res.ok) return;
    const data = await res.json();
    const list = Array.isArray(data)
      ? data
      : (Array.isArray(data.products) ? data.products : (Array.isArray(data.data) ? data.data : []));

    if (list.length > 0) {
      realtimeStockById.clear();
      realtimeStockByName.clear();
      list.forEach(p => {
        const stockNum = Math.max(0, Number(p.stock) || 0);
        if (p.id !== undefined && p.id !== null) {
          realtimeStockById.set(String(p.id), stockNum);
        }
        if (p.name) {
          realtimeStockByName.set(normalizeProductName(p.name), stockNum);
        }
      });

      // Sinkronkan jumlah di keranjang jika stok real-time berubah menjadi lebih kecil
      const items = getCartItems();
      let updated = false;
      items.forEach(item => {
        const available = getAvailableStockForItem(item);
        if (available !== null) {
          item.stock = available;
          if (available > 0 && (item.quantity || 1) > available) {
            item.quantity = available;
            updated = true;
          }
        }
      });

      if (updated) {
        saveCartItems(items);
        renderCart();
      }
    }
  } catch (err) {
    // Gunakan fallback data lokal jika gagal terhubung
  }
}

/**
 * Dapatkan jumlah stok real-time untuk item tertentu
 */
function getAvailableStockForItem(item) {
  if (!item) return null;
  if (item.id !== undefined && realtimeStockById.has(String(item.id))) {
    return realtimeStockById.get(String(item.id));
  }
  const cleanName = normalizeProductName(item.name);
  if (cleanName && realtimeStockByName.has(cleanName)) {
    return realtimeStockByName.get(cleanName);
  }
  if (item.stock !== undefined && item.stock !== null) {
    return Math.max(0, Number(item.stock) || 0);
  }
  return null;
}

/**
 * Ambil saldo user secara real-time dari database
 */
async function fetchRealtimeUserBalance() {
  try {
    const localUser = JSON.parse(localStorage.getItem('user') || '{}');
    const localBal = Number(localUser.balance ?? localUser.saldo ?? 0);
    if (!isNaN(localBal)) currentUserBalance = Math.max(0, localBal);
  } catch (e) {}

  const token = localStorage.getItem('token');
  if (!token) return currentUserBalance;

  const endpoints = ['/api/auth/me', '/api/user', '/api/profile'];
  for (const ep of endpoints) {
    try {
      const res = await fetch(ep + '?t=' + Date.now(), {
        headers: {
          'Authorization': `Bearer ${token}`,
          'Cache-Control': 'no-cache'
        }
      });
      if (res.ok) {
        const data = await res.json();
        const userObj = data.user || data.data || data;
        const dbBalance = userObj?.balance ?? userObj?.saldo;
        if (dbBalance !== undefined && dbBalance !== null) {
          currentUserBalance = Math.max(0, Number(dbBalance) || 0);
          try {
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}');
            savedUser.balance = currentUserBalance;
            localStorage.setItem('user', JSON.stringify(savedUser));
          } catch (e) {}
          return currentUserBalance;
        }
      }
    } catch (err) {
      // Coba endpoint berikutnya
    }
  }
  return currentUserBalance;
}

/**
 * Render Cart page items and summary
 */
function renderCart() {
  const container = document.getElementById('cart-items-container');
  const emptyState = document.getElementById('cart-empty-state');
  const contentSection = document.getElementById('cart-content-section');
  const items = getCartItems();

  if (!container) return;

  if (items.length === 0) {
    if (emptyState) emptyState.classList.remove('hidden');
    if (contentSection) contentSection.classList.add('hidden');
    updateSummary(0, 0);
    return;
  }

  if (emptyState) emptyState.classList.add('hidden');
  if (contentSection) contentSection.classList.remove('hidden');

  let subtotal = 0;
  let totalCount = 0;

  container.innerHTML = items.map((item, index) => {
    const itemSubtotal = item.price * (item.quantity || 1);
    subtotal += itemSubtotal;
    totalCount += item.quantity || 1;

    return `
      <div class="glass-panel p-4 sm:p-5 rounded-2xl border border-slate-800/80 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 transition-all hover:border-slate-700">
        <!-- Item Info -->
        <div class="flex items-center gap-3.5">
          <div class="w-14 h-14 rounded-2xl bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-3xl flex-shrink-0">
            ${item.icon || '📦'}
          </div>
          <div>
            <h4 class="font-semibold text-slate-100 text-sm sm:text-base leading-snug">${item.name}</h4>
            <div class="flex items-center gap-2 mt-1">
              <span class="px-2 py-0.5 text-[11px] font-medium rounded-md bg-purple-500/20 text-purple-300 border border-purple-500/30">
                ${item.plan || '1 Bulan'}
              </span>
              <span class="text-xs text-slate-400 font-mono">${formatPrice(item.price)} / unit</span>
            </div>
          </div>
        </div>

        <!-- Quantity & Subtotal Actions -->
        <div class="flex items-center justify-between sm:justify-end gap-5 w-full sm:w-auto pt-3 sm:pt-0 border-t sm:border-t-0 border-slate-800">
          <!-- Quantity Control -->
          <div class="flex items-center border border-slate-700 rounded-xl bg-slate-900/60 p-0.5">
            <button 
              onclick="changeCartQuantity(${index}, -1)" 
              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Kurang 1"
            >
              -
            </button>
            <span class="w-9 text-center text-xs font-bold text-slate-200 font-mono">${item.quantity || 1}</span>
            <button 
              onclick="changeCartQuantity(${index}, 1)" 
              class="w-7 h-7 flex items-center justify-center text-slate-400 hover:text-white rounded-lg hover:bg-slate-800 transition-colors"
              title="Tambah 1"
            >
              +
            </button>
          </div>

          <!-- Item Subtotal -->
          <div class="text-right min-w-[100px]">
            <span class="text-xs text-slate-400 block leading-tight">Subtotal</span>
            <span class="font-bold text-sm sm:text-base text-indigo-400 font-mono">
              ${formatPrice(itemSubtotal)}
            </span>
          </div>

          <!-- Remove Item Button -->
          <button 
            onclick="removeCartItem(${index})" 
            class="p-2 text-rose-400 hover:text-rose-300 hover:bg-rose-500/10 rounded-xl transition-colors ml-1"
            title="Hapus dari keranjang"
          >
            <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16"></path>
            </svg>
          </button>
        </div>
      </div>
    `;
  }).join('');

  updateSummary(totalCount, subtotal);
}

/**
 * Update Summary Sidebar
 */
function updateSummary(totalCount, subtotal) {
  const summaryCount = document.getElementById('summary-total-items');
  const summarySubtotal = document.getElementById('summary-subtotal');
  const summaryTotal = document.getElementById('summary-total-price');

  if (summaryCount) summaryCount.textContent = `${totalCount} item`;
  if (summarySubtotal) summarySubtotal.textContent = formatPrice(subtotal);
  if (summaryTotal) summaryTotal.textContent = formatPrice(subtotal);
}

/**
 * Increment / Decrement Quantity
 */
async function changeCartQuantity(index, delta) {
  const items = getCartItems();
  if (!items[index]) return;

  if (delta > 0) {
    await fetchRealtimeCartStock();
    const availableStock = getAvailableStockForItem(items[index]);
    const currentQty = items[index].quantity || 1;

    if (availableStock !== null) {
      if (availableStock <= 0) {
        showToast(`Maaf, stok "${items[index].name}" sedang habis!`, 'warning');
        return;
      }
      if (currentQty + delta > availableStock) {
        showToast(`Stok "${items[index].name}" hanya tersedia ${availableStock} unit!`, 'warning');
        return;
      }
    }
  }

  items[index].quantity = (items[index].quantity || 1) + delta;

  if (items[index].quantity <= 0) {
    items.splice(index, 1);
  }

  saveCartItems(items);
  renderCart();
}

/**
 * Remove an item from cart
 */
function removeCartItem(index) {
  const items = getCartItems();
  if (!items[index]) return;

  const removed = items.splice(index, 1);
  saveCartItems(items);
  renderCart();
  if (removed[0]) {
    showToast(`"${removed[0].name}" dihapus dari keranjang.`, 'info');
  }
}

/**
 * Setup Checkout Actions
 */
function setupCheckoutEvents() {
  const checkoutBtn = document.getElementById('btn-checkout');
  if (checkoutBtn) {
    checkoutBtn.addEventListener('click', handleCheckout);
  }

  const paymentRadios = document.querySelectorAll('input[name="payment_method"]');
  paymentRadios.forEach(radio => {
    radio.addEventListener('change', async (e) => {
      if (e.target.value === 'Saldo') {
        const balance = await fetchRealtimeUserBalance();
        const items = getCartItems();
        const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

        if (balance <= 0) {
          showToast('tidak memiliki saldo, pilih metode pembayaran lain', 'warning');
          const qrisRadio = document.querySelector('input[name="payment_method"][value="QRIS Auto Scan"]');
          if (qrisRadio) qrisRadio.checked = true;
        } else if (balance < totalAmount) {
          showToast('saldo tidak mencukupi', 'warning');
          const qrisRadio = document.querySelector('input[name="payment_method"][value="QRIS Auto Scan"]');
          if (qrisRadio) qrisRadio.checked = true;
        }
      }
    });
  });
}

/**
 * Process Checkout
 */
async function handleCheckout() {
  const items = getCartItems();
  if (items.length === 0) {
    showToast('Keranjang belanja Anda masih kosong.', 'warning');
    return;
  }

  const token = localStorage.getItem('token');
  if (!token) {
    showToast('Silakan login terlebih dahulu untuk melakukan checkout.', 'warning');
    setTimeout(() => {
      window.location.href = 'login.html';
    }, 1200);
    return;
  }

  // Selected Payment Method
  const selectedPayment = document.querySelector('input[name="payment_method"]:checked')?.value || 'QRIS Auto';
  const totalAmount = items.reduce((sum, item) => sum + (item.price * (item.quantity || 1)), 0);

  // Validasi saldo jika memilih metode pembayaran Saldo
  if (selectedPayment === 'Saldo') {
    const balance = await fetchRealtimeUserBalance();
    if (balance <= 0) {
      showToast('tidak memiliki saldo, pilih metode pembayaran lain', 'warning');
      return;
    } else if (balance < totalAmount) {
      showToast('saldo tidak mencukupi', 'warning');
      return;
    }
  }

  // Validasi ulang stok real-time sebelum mengirim order
  await fetchRealtimeCartStock();
  for (const item of items) {
    const availableStock = getAvailableStockForItem(item);
    if (availableStock !== null && (item.quantity || 1) > availableStock) {
      showToast(`Stok "${item.name}" hanya tersedia ${availableStock} unit!`, 'warning');
      return;
    }
  }

  const checkoutBtn = document.getElementById('btn-checkout');
  const originalText = checkoutBtn.innerHTML;
  checkoutBtn.disabled = true;
  checkoutBtn.innerHTML = `
    <span class="spinner w-4 h-4 inline-block mr-2 align-middle"></span>
    Memproses Pesanan...
  `;

  const orderPayload = {
    items: items.map(item => ({
      product_id: item.id,
      name: item.name,
      plan: item.plan || '1 Bulan',
      quantity: item.quantity || 1,
      price: item.price
    })),
    total_amount: totalAmount,
    payment_method: selectedPayment,
    status: 'Selesai',
    notes: 'Order website auto order'
  };

  try {
    let orderResult;
    try {
      orderResult = await apiCall('/api/orders', 'POST', orderPayload);
    } catch (apiErr) {
      console.warn('API /api/orders fallback:', apiErr.message);
      // Fallback simulated order if backend is not yet active
      const randomOrderNumber = 'INV-' + new Date().toISOString().slice(0,10).replace(/-/g,'') + '-' + Math.floor(1000 + Math.random() * 9000);
      orderResult = {
        success: true,
        order: {
          id: Date.now(),
          order_number: randomOrderNumber,
          total_amount: orderPayload.total_amount,
          payment_method: selectedPayment,
          status: 'Selesai',
          created_at: new Date().toISOString(),
          items: orderPayload.items
        }
      };

      // Also persist to local transaction history fallback
      const savedOrders = JSON.parse(localStorage.getItem('local_orders') || '[]');
      savedOrders.unshift(orderResult.order);
      localStorage.setItem('local_orders', JSON.stringify(savedOrders));
    }

    const orderData = orderResult.order || orderResult;
    orderData.status = 'Selesai';

    // Simpan ID/nomor pesanan yang sudah checkout agar berstatus Selesai di halaman transaksi
    const paidOrderKeys = JSON.parse(localStorage.getItem('paid_orders') || '[]');
    if (orderData.id) paidOrderKeys.push(String(orderData.id));
    if (orderData.order_number) paidOrderKeys.push(String(orderData.order_number));
    localStorage.setItem('paid_orders', JSON.stringify(paidOrderKeys));

    // Clear cart
    localStorage.removeItem('cart_items');
    updateCartBadge();
    renderCart();

    // Show Success Modal
    showOrderSuccessModal(orderData);

  } catch (error) {
    console.error('Checkout failed:', error);
    showToast(error.message || 'Gagal memproses checkout.', 'error');
  } finally {
    checkoutBtn.disabled = false;
    checkoutBtn.innerHTML = originalText;
  }
}

/**
 * Display Order Success Modal with QRIS instructions
 */
function showOrderSuccessModal(order) {
  const modal = document.getElementById('checkout-success-modal');
  if (!modal) {
    showToast(`Pesanan berhasil dibuat! No. Pesanan: ${order.order_number || order.id}`, 'success');
    setTimeout(() => {
      window.location.href = 'transactions.html';
    }, 1500);
    return;
  }

  const orderNoEl = document.getElementById('success-order-number');
  const orderTotalEl = document.getElementById('success-order-total');
  const orderMethodEl = document.getElementById('success-order-method');

  if (orderNoEl) orderNoEl.textContent = order.order_number || `#${order.id}`;
  if (orderTotalEl) orderTotalEl.textContent = formatPrice(order.total_amount || order.total || 0);
  if (orderMethodEl) orderMethodEl.textContent = order.payment_method || 'QRIS Auto';

  modal.classList.remove('hidden');
}