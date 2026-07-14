// ===== SHARED PRODUCT DATA =====
// Products live in products.json in the repo (the real, shared database).
// Admin adds/removes parts via admin.html, which updates products.json on GitHub through /api/products.
// Every visitor's browser just reads this same file, so everyone sees the same stock.
async function getProducts() {
  try {
    const res = await fetch('products.json?_=' + Date.now()); // cache-bust so updates show immediately
    if (!res.ok) return [];
    const data = await res.json();
    return data.products || [];
  } catch (e) {
    return [];
  }
}

// Renders products for a given category name into el with id "productList"
async function renderCategoryProducts(catName) {
  const el = document.getElementById('productList');
  if (!el) return;
  el.innerHTML = `<p class="hint-msg">⏳ Loading...</p>`;
  const products = (await getProducts()).filter(p => p.cat === catName);
  if (products.length === 0) {
    el.innerHTML = `<p class="hint-msg">📭 Is category mein abhi parts list nahi hui hai.<br><small>Sahi rate aur availability ke liye call/WhatsApp karein.</small></p>`;
    return;
  }
  el.innerHTML = products.map(p => `
    <div class="product-item">
      <div>
        <div class="pname">${p.name}${p.brand ? ' <small style="color:#888;font-weight:400;">(' + p.brand + ')</small>' : ''}</div>
      </div>
      <div style="display:flex;align-items:center;gap:10px;flex-wrap:wrap;">
        <span class="pbadge ${p.cond}">${p.cond === 'new' ? 'New' : 'Old/Used'}</span>
        <button class="btn-daam" onclick="openEnquiry('${p.name.replace(/'/g, "\\'")}')">💰 Daam Jaane</button>
      </div>
    </div>
  `).join('');
}

// Renders products with images in a card-grid (used for Engine Oils)
async function renderOilGrid(catName) {
  const el = document.getElementById('productList');
  if (!el) return;
  el.innerHTML = `<p class="hint-msg">⏳ Loading...</p>`;
  const products = (await getProducts()).filter(p => p.cat === catName);
  if (products.length === 0) {
    el.innerHTML = `<p class="hint-msg">📭 Is category mein abhi parts list nahi hui hai.<br><small>Sahi rate aur availability ke liye call/WhatsApp karein.</small></p>`;
    return;
  }
  el.innerHTML = `<div class="oil-grid">` + products.map(p => `
    <div class="oil-card">
      <div class="oil-card-img">
        ${p.image ? `<img src="${p.image}" alt="${p.name}">` : `<span class="img-placeholder">🛢️</span>`}
      </div>
      <div class="oil-card-body">
        <span class="pname">${p.name}</span>
        ${p.brand ? `<span class="pbrand">${p.brand}</span>` : ''}
      </div>
      <div class="oil-card-footer">
        <button class="btn-daam" onclick="openEnquiry('${p.name.replace(/'/g, "\\'")}')">💰 Daam Jaane</button>
      </div>
    </div>
  `).join('') + `</div>`;
}

// ===== ENQUIRY MODAL (used on every customer page) =====
function openEnquiry(partName) {
  const modal = document.getElementById('modalOverlay');
  if (!modal) return;
  document.getElementById('modalTitle').textContent = partName === 'General Enquiry' ? 'Humse Poochho' : `Daam Poocho: ${partName}`;
  document.getElementById('eqMsg').value = partName !== 'General Enquiry' ? `Mujhe ${partName} ka daam jaanna hai` : '';
  modal.classList.add('show');
}

function closeModal() {
  const modal = document.getElementById('modalOverlay');
  if (modal) modal.classList.remove('show');
}

function sendEnquiry() {
  const name = document.getElementById('eqName').value.trim() || 'Customer';
  const phone = document.getElementById('eqPhone').value.trim();
  const msg = document.getElementById('eqMsg').value.trim() || 'Part enquiry';
  const text = `Namaste Pahwa Auto Spares!\n\nNaam: ${name}\nMobile: ${phone}\n\nMessage: ${msg}`;
  const url = `https://wa.me/919057555200?text=${encodeURIComponent(text)}`;
  window.open(url, '_blank');
  closeModal();
}

document.addEventListener('DOMContentLoaded', function() {
  const overlay = document.getElementById('modalOverlay');
  if (overlay) {
    overlay.addEventListener('click', function(e) {
      if (e.target === this) closeModal();
    });
  }
});
