// =============================================
//   KEUANGAN RUMAH TANGGA — Script.js
// =============================================

// ===== CONFIG =====
const APPS_SCRIPT_URL = 'https://script.google.com/macros/s/AKfycbzqc0-MBl3BJHhbOZ4jwsox-gaAX2S_VIfhG2jedrqHeqSrFdsBCr75iwLA0dgGiNP_-A/exec';
// Contoh: 'https://script.google.com/macros/s/AKfyc.../exec'

// ===== STATE =====
let transactions = JSON.parse(localStorage.getItem('krt_transactions') || '[]');
let currentType = 'pemasukan';
let currentFilter = 'semua';
let isDark = localStorage.getItem('krt_theme') === 'dark';

// ===== KATEGORI =====
const CATEGORIES = {
  pemasukan: ['Gaji', 'Bonus', 'Freelance', 'Bisnis', 'Investasi', 'Transfer Masuk', 'Lainnya'],
  pengeluaran: ['Makan & Minum', 'Belanja', 'Transportasi', 'Tagihan', 'Kesehatan', 'Pendidikan', 'Hiburan', 'Pakaian', 'Rumah Tangga', 'Tabungan', 'Lainnya']
};

const CATEGORY_EMOJI = {
  'Gaji': '💼', 'Bonus': '🎉', 'Freelance': '💻', 'Bisnis': '🏢',
  'Investasi': '📈', 'Transfer Masuk': '↩️', 'Makan & Minum': '🍜',
  'Belanja': '🛒', 'Transportasi': '🚗', 'Tagihan': '📄', 'Kesehatan': '❤️‍🩹',
  'Pendidikan': '📚', 'Hiburan': '🎮', 'Pakaian': '👕', 'Rumah Tangga': '🏠',
  'Tabungan': '🏦', 'Lainnya': '📦'
};

// ===== INIT =====
document.addEventListener('DOMContentLoaded', () => {
  // Theme
  if (isDark) document.documentElement.setAttribute('data-theme', 'dark');

  // Date/Greeting
  updateHeaderDate();

  // Populate kategori
  setType('pemasukan');

  // Render data
  renderAll();

  // Splash
  setTimeout(() => {
    const splash = document.getElementById('splash');
    const app = document.getElementById('app');
    splash.classList.add('hide');
    app.style.display = '';
    setTimeout(() => splash.remove(), 600);
  }, 1800);

  // Register service worker
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('service-worker.js')
      .then(() => console.log('SW registered'))
      .catch(e => console.log('SW error:', e));
  }

  // Chart
  buildChart();
});

// ===== DATE & GREETING =====
function updateHeaderDate() {
  const now = new Date();
  const days = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Ags', 'Sep', 'Okt', 'Nov', 'Des'];
  const h = now.getHours();
  let greet = h < 11 ? 'Selamat Pagi 🌤️' : h < 15 ? 'Selamat Siang ☀️' : h < 18 ? 'Selamat Sore 🌅' : 'Selamat Malam 🌙';

  document.getElementById('greetingText').textContent = greet;
  document.getElementById('headerDate').textContent =
    `${days[now.getDay()]}, ${now.getDate()} ${months[now.getMonth()]} ${now.getFullYear()}`;
}

// ===== THEME =====
function toggleTheme() {
  isDark = !isDark;
  document.documentElement.setAttribute('data-theme', isDark ? 'dark' : '');
  localStorage.setItem('krt_theme', isDark ? 'dark' : 'light');
  document.getElementById('themeColorMeta').content = isDark ? '#0f2137' : '#0d9488';
  buildChart();
}

// ===== TYPE TOGGLE =====
function setType(type) {
  currentType = type;
  const btnIn = document.getElementById('btnIncome');
  const btnEx = document.getElementById('btnExpense');
  const submit = document.getElementById('submitBtn');

  btnIn.classList.toggle('active', type === 'pemasukan');
  btnEx.classList.toggle('active', type === 'pengeluaran');
  submit.classList.toggle('expense-mode', type === 'pengeluaran');

  // Update kategori dropdown
  const sel = document.getElementById('kategori');
  sel.innerHTML = '<option value="">— Pilih Kategori —</option>';
  CATEGORIES[type].forEach(k => {
    const o = document.createElement('option');
    o.value = k; o.textContent = k;
    sel.appendChild(o);
  });
}

// ===== FORMAT NOMINAL =====
function formatNominal(el) {
  let v = el.value.replace(/\D/g, '');
  if (!v) { el.value = ''; return; }
  el.value = parseInt(v).toLocaleString('id-ID');
}

function getRawNominal() {
  return parseInt((document.getElementById('nominal').value || '0').replace(/\D/g, '')) || 0;
}

function formatRupiah(n) {
  return 'Rp ' + Math.abs(n).toLocaleString('id-ID');
}

// ===== SUBMIT =====
async function submitTransaksi() {
  const nominal = getRawNominal();
  const kategori = document.getElementById('kategori').value;
  const keterangan = document.getElementById('keterangan').value.trim();

  // Validasi
  if (!nominal || nominal <= 0) {
    showToast('⚠️ Nominal harus diisi!', 'warn');
    document.getElementById('nominal').focus();
    return;
  }
  if (!kategori) {
    showToast('⚠️ Pilih kategori dulu!', 'warn');
    document.getElementById('kategori').focus();
    return;
  }

  // Loading state
  setLoading(true);

  const tx = {
    id: Date.now(),
    tipe: currentType,
    kategori,
    nominal,
    keterangan: keterangan || '-',
    tanggal: new Date().toISOString(),
    tanggalFmt: formatTanggal(new Date())
  };

  // Simpan lokal dulu (optimistic)
  transactions.unshift(tx);
  saveLocal();
  renderAll();

  // Kirim ke Google Sheets
  try {
    if (true) {
      await fetch(APPS_SCRIPT_URL, {
        method: 'POST',
        mode: 'no-cors',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tipe: tx.tipe,
          kategori: tx.kategori,
          nominal: tx.nominal,
          keterangan: tx.keterangan,
          tanggal: tx.tanggalFmt
        })
      });
    }
    showToast('✅ Transaksi berhasil disimpan!', 'success');
  } catch (e) {
    showToast('⚠️ Tersimpan lokal, gagal sync ke Sheets', 'warn');
  }

  // Reset form
  document.getElementById('nominal').value = '';
  document.getElementById('keterangan').value = '';
  document.getElementById('kategori').value = '';
  setLoading(false);

  // Ripple on button
  addRipple(document.getElementById('submitBtn'));
}

function setLoading(on) {
  document.getElementById('submitText').style.display = on ? 'none' : 'flex';
  document.getElementById('btnSpinner').style.display = on ? 'flex' : 'none';
  document.getElementById('submitBtn').disabled = on;
}

function addRipple(btn) {
  const r = document.createElement('span');
  r.className = 'ripple';
  const size = Math.max(btn.offsetWidth, btn.offsetHeight);
  r.style.cssText = `width:${size}px;height:${size}px;left:0;top:0;margin-left:-${size/2}px;margin-top:-${size/2}px`;
  btn.appendChild(r);
  r.addEventListener('animationend', () => r.remove());
}

// ===== RENDER ALL =====
function renderAll() {
  renderSummary();
  renderRecentList();
  renderFullList();
  renderStats();
  buildChart();
}

// ===== SUMMARY =====
function renderSummary() {
  let income = 0, expense = 0;
  transactions.forEach(tx => {
    if (tx.tipe === 'pemasukan') income += tx.nominal;
    else expense += tx.nominal;
  });
  const saldo = income - expense;

  animateCount('heroSaldo', saldo, true);
  animateCount('heroIncome', income, false);
  animateCount('heroExpense', expense, false);
  document.getElementById('statIncome').textContent = formatRupiah(income);
  document.getElementById('statExpense').textContent = formatRupiah(expense);

  // Warning
  const wb = document.getElementById('warningBanner');
  wb.style.display = (expense > income && transactions.length > 0) ? 'flex' : 'none';
}

function animateCount(id, target, showSign) {
  const el = document.getElementById(id);
  const start = 0;
  const duration = 600;
  const startTime = performance.now();
  const sign = target < 0 ? '-' : '';

  function update(now) {
    const progress = Math.min((now - startTime) / duration, 1);
    const ease = 1 - Math.pow(1 - progress, 3);
    const val = Math.floor(ease * Math.abs(target));
    el.textContent = (showSign && target < 0 ? '-' : '') + 'Rp ' + val.toLocaleString('id-ID');
    if (progress < 1) requestAnimationFrame(update);
    else el.textContent = (target < 0 ? '-' : '') + 'Rp ' + Math.abs(target).toLocaleString('id-ID');
  }
  requestAnimationFrame(update);
}

// ===== RECENT LIST =====
function renderRecentList() {
  const el = document.getElementById('recentList');
  const recent = transactions.slice(0, 5);
  if (!recent.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-emoji">💸</div><div class="empty-title">Belum ada transaksi</div><div class="empty-desc">Catat transaksi pertamamu di atas!</div></div>`;
    return;
  }
  el.innerHTML = recent.map(tx => txHTML(tx)).join('');
}

// ===== FULL LIST =====
function renderFullList() {
  const el = document.getElementById('fullList');
  let filtered = transactions;
  if (currentFilter !== 'semua') filtered = transactions.filter(tx => tx.tipe === currentFilter);
  if (!filtered.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-emoji">📋</div><div class="empty-title">Belum ada transaksi</div></div>`;
    return;
  }
  el.innerHTML = filtered.map(tx => txHTML(tx)).join('');
}

function txHTML(tx) {
  const emoji = CATEGORY_EMOJI[tx.kategori] || '💰';
  const amt = tx.tipe === 'pemasukan' ? '+' + formatRupiah(tx.nominal) : '-' + formatRupiah(tx.nominal);
  const sign = tx.tipe === 'pemasukan' ? 'income' : 'expense';
  return `
    <div class="tx-item" id="tx-${tx.id}">
      <div class="tx-icon ${sign}">${emoji}</div>
      <div class="tx-body">
        <div class="tx-cat">${tx.kategori}</div>
        <div class="tx-desc">${tx.keterangan !== '-' ? tx.keterangan : tx.tanggalFmt || ''}</div>
      </div>
      <div class="tx-right">
        <div class="tx-amt ${sign}">${amt}</div>
        <div class="tx-date">${tx.tanggalFmt || ''}</div>
      </div>
      <button class="delete-btn" onclick="deleteTransaksi(${tx.id})">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><polyline points="3 6 5 6 21 6"/><path d="M19 6l-1 14H6L5 6"/><path d="M10 11v6M14 11v6"/><path d="M9 6V4h6v2"/></svg>
      </button>
    </div>`;
}

function deleteTransaksi(id) {
  if (!confirm('Hapus transaksi ini?')) return;
  const el = document.getElementById('tx-' + id);
  if (el) {
    el.style.opacity = '0';
    el.style.transform = 'translateX(40px)';
    el.style.transition = 'all 0.25s ease';
  }
  setTimeout(() => {
    transactions = transactions.filter(tx => tx.id !== id);
    saveLocal();
    renderAll();
    showToast('🗑️ Transaksi dihapus!', 'success');
  }, 250);
}

// ===== FILTER =====
function filterTx(type, btn) {
  currentFilter = type;
  document.querySelectorAll('.chip').forEach(c => c.classList.remove('active'));
  btn.classList.add('active');
  renderFullList();
}

// ===== STATS =====
function renderStats() {
  const el = document.getElementById('categoryStats');
  const expenseTx = transactions.filter(tx => tx.tipe === 'pengeluaran');
  if (!expenseTx.length) {
    el.innerHTML = `<div class="empty-state"><div class="empty-emoji">📊</div><div class="empty-title">Belum ada data</div></div>`;
    return;
  }

  const cats = {};
  expenseTx.forEach(tx => { cats[tx.kategori] = (cats[tx.kategori] || 0) + tx.nominal; });
  const sorted = Object.entries(cats).sort((a, b) => b[1] - a[1]);
  const max = sorted[0][1];

  el.innerHTML = sorted.slice(0, 5).map(([cat, amt]) => `
    <div class="cat-item">
      <div class="cat-header">
        <span class="cat-name">${CATEGORY_EMOJI[cat] || '📦'} ${cat}</span>
        <span class="cat-amt">${formatRupiah(amt)}</span>
      </div>
      <div class="cat-bar-bg">
        <div class="cat-bar" style="width:${(amt/max*100).toFixed(1)}%"></div>
      </div>
    </div>`).join('');
}

// ===== CHART =====
let chartInstance = null;
function buildChart() {
  const canvas = document.getElementById('barChart');
  if (!canvas) return;

  // Last 7 days
  const days = [];
  const incomeData = [];
  const expenseData = [];
  const now = new Date();

  for (let i = 6; i >= 0; i--) {
    const d = new Date(now);
    d.setDate(d.getDate() - i);
    const key = `${d.getDate()}/${d.getMonth()+1}`;
    days.push(key);

    let inc = 0, exp = 0;
    transactions.forEach(tx => {
      const td = new Date(tx.tanggal);
      if (td.toDateString() === d.toDateString()) {
        if (tx.tipe === 'pemasukan') inc += tx.nominal;
        else exp += tx.nominal;
      }
    });
    incomeData.push(inc);
    expenseData.push(exp);
  }

  const darkMode = document.documentElement.getAttribute('data-theme') === 'dark';
  const textColor = darkMode ? '#94a3b8' : '#64748b';
  const gridColor = darkMode ? 'rgba(255,255,255,0.05)' : 'rgba(0,0,0,0.05)';

  if (chartInstance) { chartInstance.destroy(); }

  // Simple canvas chart (no library needed)
  drawBarChart(canvas, days, incomeData, expenseData, textColor, gridColor);
}

function drawBarChart(canvas, labels, income, expense, textColor, gridColor) {
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const W = canvas.parentElement.offsetWidth - 32;
  const H = 180;
  canvas.style.width = W + 'px';
  canvas.style.height = H + 'px';
  canvas.width = W * dpr;
  canvas.height = H * dpr;
  ctx.scale(dpr, dpr);

  const pad = { top: 16, right: 16, bottom: 32, left: 48 };
  const chartW = W - pad.left - pad.right;
  const chartH = H - pad.top - pad.bottom;

  const maxVal = Math.max(...income, ...expense, 1);
  const n = labels.length;
  const groupW = chartW / n;
  const barW = Math.min(groupW * 0.3, 16);
  const gap = 3;

  ctx.clearRect(0, 0, W, H);

  // Grid lines
  for (let i = 0; i <= 4; i++) {
    const y = pad.top + (chartH / 4) * i;
    ctx.beginPath();
    ctx.strokeStyle = gridColor;
    ctx.lineWidth = 1;
    ctx.moveTo(pad.left, y);
    ctx.lineTo(W - pad.right, y);
    ctx.stroke();

    const val = maxVal * (1 - i / 4);
    ctx.fillStyle = textColor;
    ctx.font = `500 9px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'right';
    ctx.fillText(val >= 1e6 ? (val/1e6).toFixed(1)+'jt' : val >= 1e3 ? (val/1e3).toFixed(0)+'rb' : val, pad.left - 4, y + 3);
  }

  // Bars
  labels.forEach((label, i) => {
    const x = pad.left + i * groupW + groupW / 2;

    // income bar
    const incH = (income[i] / maxVal) * chartH;
    ctx.beginPath();
    ctx.fillStyle = '#16a34a';
    ctx.globalAlpha = 0.85;
    roundRect(ctx, x - barW - gap / 2, pad.top + chartH - incH, barW, incH, 3);
    ctx.fill();

    // expense bar
    const expH = (expense[i] / maxVal) * chartH;
    ctx.beginPath();
    ctx.fillStyle = '#dc2626';
    roundRect(ctx, x + gap / 2, pad.top + chartH - expH, barW, expH, 3);
    ctx.fill();

    ctx.globalAlpha = 1;

    // label
    ctx.fillStyle = textColor;
    ctx.font = `600 9px "Plus Jakarta Sans", sans-serif`;
    ctx.textAlign = 'center';
    ctx.fillText(label, x, H - 8);
  });

  // Legend
  ctx.fillStyle = '#16a34a'; ctx.globalAlpha = 0.85;
  ctx.fillRect(pad.left, H - 26, 8, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = textColor; ctx.font = `600 9px "Plus Jakarta Sans", sans-serif`; ctx.textAlign = 'left';
  ctx.fillText('Pemasukan', pad.left + 11, H - 19);

  ctx.fillStyle = '#dc2626'; ctx.globalAlpha = 0.85;
  ctx.fillRect(pad.left + 80, H - 26, 8, 8);
  ctx.globalAlpha = 1;
  ctx.fillStyle = textColor;
  ctx.fillText('Pengeluaran', pad.left + 91, H - 19);
}

function roundRect(ctx, x, y, w, h, r) {
  if (h < 0) { y += h; h = -h; }
  if (h < r) r = h;
  ctx.moveTo(x + r, y);
  ctx.lineTo(x + w - r, y);
  ctx.quadraticCurveTo(x + w, y, x + w, y + r);
  ctx.lineTo(x + w, y + h);
  ctx.lineTo(x, y + h);
  ctx.lineTo(x, y + r);
  ctx.quadraticCurveTo(x, y, x + r, y);
  ctx.closePath();
}

// ===== NAVIGATION =====
function switchPage(name) {
  document.querySelectorAll('.page').forEach(p => p.classList.remove('active'));
  document.querySelectorAll('.nav-btn').forEach(b => b.classList.remove('active'));
  document.getElementById('page-' + name).classList.add('active');
  document.getElementById('nav-' + name).classList.add('active');
  if (name === 'statistik') { renderStats(); setTimeout(buildChart, 50); }
  window.scrollTo(0, 0);
}

// ===== LOCAL STORAGE =====
function saveLocal() {
  localStorage.setItem('krt_transactions', JSON.stringify(transactions));
}

// ===== TOAST =====
function showToast(msg, type = '') {
  const container = document.getElementById('toastContainer');
  const icons = {
    success: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"/></svg>',
    error: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>',
    warn: '<svg viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><path d="M10.29 3.86L1.82 18a2 2 0 001.71 3h16.94a2 2 0 001.71-3L13.71 3.86a2 2 0 00-3.42 0z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>'
  };
  const div = document.createElement('div');
  div.className = `toast ${type}`;
  div.innerHTML = (icons[type] || '') + `<span>${msg}</span>`;
  container.appendChild(div);
  setTimeout(() => {
    div.classList.add('hide');
    div.addEventListener('animationend', () => div.remove());
  }, 2800);
}

// ===== HELPERS =====
function formatTanggal(d) {
  const months = ['Jan','Feb','Mar','Apr','Mei','Jun','Jul','Ags','Sep','Okt','Nov','Des'];
  return `${d.getDate()} ${months[d.getMonth()]} ${d.getFullYear()}`;
}
