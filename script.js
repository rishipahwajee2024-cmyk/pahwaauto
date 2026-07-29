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

// ===== TRACTOR BRANDS (for Hydraulic / Lift Pumps subsections) =====
// Each brand gets a color + short badge text. If you want a real logo image instead
// of the colored letter badge, just paste a direct image URL into "logo" below —
// leave it as null to keep the clean letter-badge look.
const TRACTOR_BRANDS = {
  "John Deere":      { color: "#367C2B", short: "JD",  logo: null },
  "Mahindra":        { color: "#D81E2C", short: "M",   logo: null },
  "Swaraj":          { color: "#C8102E", short: "SW",  logo: null },
  "Sonalika":        { color: "#EE1C25", short: "SL",  logo: null },
  "Eicher":          { color: "#E4032E", short: "EI",  logo: null },
  "Massey Ferguson": { color: "#8E1537", short: "MF",  logo: null },
  "New Holland":     { color: "#0057A8", short: "NH",  logo: null },
  "Farmtrac":        { color: "#F58220", short: "FT",  logo: null },
};
function brandInfo(brand) {
  return TRACTOR_BRANDS[brand] || { color: "#1A3A6B", short: (brand || "?").slice(0, 2).toUpperCase(), logo: null };
}
function brandBadgeHtml(brand, size) {
  const info = brandInfo(brand);
  const cls = size === 'mini' ? 'mini-badge' : 'brand-badge';
  if (info.logo) {
    return `<span class="${cls}" style="--brand-color:${info.color}"><img src="${info.logo}" alt="${brand}" onerror="this.parentElement.textContent='${info.short}'"></span>`;
  }
  return `<span class="${cls}" style="--brand-color:${info.color}">${info.short}</span>`;
}

// ===== SCROLL REVEAL =====
// Adds a gentle fade/rise-in effect to cards as they enter the viewport.
function initScrollReveal(root) {
  const scope = root || document;
  const els = scope.querySelectorAll('.reveal:not(.reveal-observed)');
  if (!('IntersectionObserver' in window)) {
    els.forEach(el => el.classList.add('visible'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('visible');
        io.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12, rootMargin: '0px 0px -40px 0px' });
  els.forEach(el => {
    el.classList.add('reveal-observed');
    io.observe(el);
  });
}

// Renders products for catName into the element with the given id.
// style: 'list' (compact rows) or 'cards' (image grid)
async function renderProductsSection(elementId, catName, style, productsOverride) {
  const el = document.getElementById(elementId);
  if (!el) return;
  el.innerHTML = `<p class="hint-msg">⏳ Loading...</p>`;
  const products = productsOverride || (await getProducts()).filter(p => p.cat === catName);
  if (products.length === 0) {
    el.innerHTML = `<p class="hint-msg">📭 Is category mein abhi parts list nahi hui hai.<br><small>Sahi rate aur availability ke liye call/WhatsApp karein.</small></p>`;
    return;
  }
  if (style === 'cards') {
    el.innerHTML = `<div class="oil-grid">` + products.map((p, i) => `
      <div class="oil-card reveal" style="transition-delay:${(i % 8) * 0.06}s">
        <div class="oil-card-img">
          ${p.image ? `<img src="${p.image}" alt="${p.name}" onerror="this.parentElement.innerHTML='<span class=&quot;img-placeholder&quot;>🔧</span>'">` : `<span class="img-placeholder">🔧</span>`}
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
  } else {
    el.innerHTML = products.map((p, i) => `
      <div class="product-item reveal" style="transition-delay:${(i % 8) * 0.06}s">
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
  initScrollReveal(el);
}

// Renders products for a given category name into el with id "productList" (used by simple category pages)
async function renderCategoryProducts(catName) {
  await renderProductsSection('productList', catName, 'list');
}

// Renders products with images in a card-grid into el with id "productList" (Engine Oils page)
async function renderOilGrid(catName) {
  await renderProductsSection('productList', catName, 'cards');
}

// Renders the Hydraulic / Lift Pumps page: groups products by tractor brand,
// gives each brand its own labeled subsection (with badge/logo) and a photo grid.
async function renderHydraulicPumps(catName) {
  const wrap = document.getElementById('pumpsWrap');
  const jumpnav = document.getElementById('brandJumpnav');
  if (!wrap) return;
  wrap.innerHTML = `<p class="hint-msg">⏳ Loading...</p>`;
  const products = (await getProducts()).filter(p => p.cat === catName);
  if (products.length === 0) {
    wrap.innerHTML = `<p class="hint-msg">📭 Abhi is category mein parts list nahi hui hai.<br><small>Sahi rate aur availability ke liye call/WhatsApp karein.</small></p>`;
    if (jumpnav) jumpnav.innerHTML = '';
    return;
  }

  // Group by brand, preserving a sensible order: known brands first (in TRACTOR_BRANDS order), then any others.
  const byBrand = {};
  products.forEach(p => {
    const key = p.brand && p.brand.trim() ? p.brand.trim() : 'Other';
    if (!byBrand[key]) byBrand[key] = [];
    byBrand[key].push(p);
  });
  const knownOrder = Object.keys(TRACTOR_BRANDS).filter(b => byBrand[b]);
  const otherOrder = Object.keys(byBrand).filter(b => !TRACTOR_BRANDS[b]);
  const brandOrder = [...knownOrder, ...otherOrder];

  if (jumpnav) {
    jumpnav.innerHTML = brandOrder.map(brand => `
      <a href="#brand-${slugify(brand)}">${brandBadgeHtml(brand, 'mini')} ${brand}</a>
    `).join('');
  }

  wrap.innerHTML = brandOrder.map(brand => `
    <section class="brand-block" id="brand-${slugify(brand)}">
      <div class="brand-head" style="--brand-color:${brandInfo(brand).color}">
        ${brandBadgeHtml(brand)}
        <h3>${brand} — Hydraulic / Lift Pumps</h3>
      </div>
      <div class="oil-grid" id="brandgrid-${slugify(brand)}"></div>
    </section>
  `).join('');

  brandOrder.forEach(brand => {
    renderProductsSection(`brandgrid-${slugify(brand)}`, catName, 'cards', byBrand[brand]);
  });
}

function slugify(s) {
  return (s || '').toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
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
