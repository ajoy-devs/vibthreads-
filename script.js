/* =========================================================
   VibeThreads — script.js
   Handles: product catalog, cart, wishlist, filters, quick view,
   checkout + order storage, reviews/FAQ render, theme toggle,
   scroll reveal, and (on admin.html) the admin dashboard.
   Everything is persisted to localStorage so this works with
   zero backend on GitHub Pages.
   ========================================================= */

/* ---------- storage keys ---------- */
const LS_CART = 'vibethreads_cart';
const LS_WISH = 'vibethreads_wishlist';
const LS_ORDERS = 'vibethreads_orders';
const LS_THEME = 'vibethreads_theme';
const LS_NEWSLETTER = 'vibethreads_newsletter';
const LS_CUSTOM_PRODUCTS = 'vibethreads_custom_products';
const LS_PRODUCT_OVERRIDES = 'vibethreads_product_overrides';

/* ---------- helpers ---------- */
const $  = (sel, ctx = document) => ctx.querySelector(sel);
const $$ = (sel, ctx = document) => [...ctx.querySelectorAll(sel)];
const money = n => '৳' + Number(n).toLocaleString('en-BD');
const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 7);

function teeMockupSVG(name, bgColor) {
  const hex = bgColor.replace('#','');
  const r = parseInt(hex.substring(0,2),16);
  const g = parseInt(hex.substring(2,4),16);
  const b = parseInt(hex.substring(4,6),16);
  const isLight = (r*299 + g*587 + b*114) / 1000 > 140;
  const textColor = isLight ? '#111214' : '#c8ff3e';
  const neckColor = isLight ? '#d4d2ca' : '#0e0f13';

  const lines = [];
  const words = name.split(' ');
  let cur = '';
  for (const w of words) {
    if ((cur + ' ' + w).trim().length <= 18) cur = (cur + ' ' + w).trim();
    else { if (cur) lines.push(cur); cur = w; }
  }
  if (cur) lines.push(cur);

  const fs = lines.length > 2 ? 14 : lines.length > 1 ? 16 : 20;
  const ty = 240 + (1 - lines.length) * 13;
  const txt = lines.map((l,i) =>
    `<text x="200" y="${ty+i*26}" text-anchor="middle" fill="${textColor}" font-size="${fs}" font-weight="700" font-family="Arial,sans-serif">${l.replace(/["<>&]/g,'')}</text>`
  ).join('');

  return 'data:image/svg+xml,' + encodeURIComponent(
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 400 500">
      <defs><linearGradient id="g" x1="0" y1="0" x2="0" y2="1"><stop offset="0%" stop-color="${bgColor}"/><stop offset="100%" stop-color="${bgColor}dd"/></linearGradient></defs>
      <path d="M200 70C165 70 145 58 125 40L105 20L65 45L55 52C45 65 42 75 48 87L68 105C73 110 78 112 78 118L78 430C78 438 84 445 94 445L306 445C316 445 322 438 322 430L322 118C322 112 327 110 332 105L352 87C358 75 355 65 345 52L335 45L295 20L275 40C255 58 235 70 200 70Z" fill="url(#g)"/>
      <path d="M180 72C175 68 168 64 162 62L170 52C178 56 186 58 200 58C214 58 222 56 230 52L238 62C232 64 225 68 220 72" fill="${neckColor}"/>
      <rect x="105" y="155" width="190" height="170" rx="10" fill="rgba(0,0,0,.22)"/>
      ${txt}
      <text x="200" y="427" text-anchor="middle" fill="rgba(255,255,255,.08)" font-size="9" font-family="Arial,sans-serif">VIBETHREADS</text>
    </svg>`
  );
}

function readLS(key, fallback) {
  try { return JSON.parse(localStorage.getItem(key)) ?? fallback; }
  catch (e) { return fallback; }
}
function writeLS(key, val) { localStorage.setItem(key, JSON.stringify(val)); }

function toast(msg) {
  const wrap = $('#toast-wrap');
  if (!wrap) return;
  const t = document.createElement('div');
  t.className = 'toast';
  t.textContent = msg;
  wrap.appendChild(t);
  setTimeout(() => { t.classList.add('out'); setTimeout(() => t.remove(), 300); }, 2400);
}

/* =========================================================
   PRODUCT CATALOG (demo data)
   tags: [trending, neck, sleeve, fit, fabric] categories this
   product belongs to, used by the category tab filters.
   ========================================================= */
const PRODUCTS = [
  { id:'p1', name:'Naruto Sage Mode Oversized Tee', category:'Anime T-Shirts', tags:['anime','crew-neck','short-sleeve','oversized-fit','cotton-poly-blend'],
    price:850, sizes:['S','M','L','XL','XXL'], colors:['#111214','#3a3f4b'],
    image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop&auto=format' },
  { id:'p2', name:'Chattogram Skyline Streetwear Graphic', category:'Streetwear Graphic T-Shirts', tags:['streetwear','crew-neck','short-sleeve','oversized-fit','cotton'],
    price:790, sizes:['S','M','L','XL'], colors:['#0e0f13','#ff4470'],
    image:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop&auto=format' },
  { id:'p3', name:'Minimal "কথা কম, কাজ বেশি" Typography Tee', category:'Minimal Typography T-Shirts', tags:['typography','crew-neck','short-sleeve','regular-fit','cotton'],
    price:650, sizes:['S','M','L','XL','XXL'], colors:['#f3f1ea','#111214'],
    image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&auto=format' },
  { id:'p4', name:'Respawn Gamer Graphic Tee', category:'Gaming T-Shirts', tags:['gaming','crew-neck','short-sleeve','regular-fit','dry-fit'],
    price:720, sizes:['S','M','L','XL'], colors:['#111214','#4ec5ff'],
    image:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop&auto=format' },
  { id:'p5', name:'Us Two Matching Couple Tee (Pair)', category:'Couple T-Shirts', tags:['couple','crew-neck','short-sleeve','regular-fit','cotton'],
    price:1390, sizes:['S','M','L','XL'], colors:['#ff4470','#111214'],
    image:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&auto=format' },
  { id:'p6', name:'Sabr Islamic Calligraphy Tee', category:'Islamic Quote T-Shirts', tags:['islamic','crew-neck','short-sleeve','regular-fit','cotton'],
    price:700, sizes:['S','M','L','XL','XXL'], colors:['#111214','#3a3f4b'],
    image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&auto=format' },
  { id:'p7', name:'Boxy Oversized Blank Essential Tee', category:'Oversized T-Shirts', tags:['trending','crew-neck','short-sleeve','oversized-fit','organic-cotton'],
    price:590, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea','#ff4470'],
    image:'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop&auto=format' },
  { id:'p8', name:'Attack Titan Anime Long Sleeve', category:'Anime T-Shirts', tags:['anime','crew-neck','long-sleeve','regular-fit','cotton'],
    price:980, sizes:['M','L','XL','XXL'], colors:['#111214'],
    image:'https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=500&fit=crop&auto=format' },
  { id:'p9', name:'Classic Polo Neck Tee', category:'Polo T-Shirts', tags:['trending','polo','short-sleeve','regular-fit','cotton'],
    price:890, sizes:['S','M','L','XL'], colors:['#0e0f13','#4ec5ff','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=400&h=500&fit=crop&auto=format' },
  { id:'p10', name:'Level Up Gamer V-Neck', category:'Gaming T-Shirts', tags:['gaming','v-neck','short-sleeve','slim-fit','cotton-poly-blend'],
    price:750, sizes:['S','M','L','XL'], colors:['#111214','#ff4470'],
    image:'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=400&h=500&fit=crop&auto=format' },
  { id:'p11', name:'Athletic Muscle Fit Tee', category:'Athletic T-Shirts', tags:['trending','crew-neck','muscle','athletic-fit','dry-fit'],
    price:680, sizes:['S','M','L','XL'], colors:['#111214','#3a3f4b'],
    image:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop&auto=format' },
  { id:'p12', name:'Bamboo Soft Henley Tee', category:'Henley T-Shirts', tags:['trending','henley','short-sleeve','regular-fit','bamboo'],
    price:990, sizes:['M','L','XL','XXL'], colors:['#f3f1ea','#111214'],
    image:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop&auto=format' },
  { id:'p13', name:'One Piece Luffy Gear 5 Oversized Tee', category:'Anime T-Shirts', tags:['anime','crew-neck','short-sleeve','oversized-fit','cotton'],
    price:950, sizes:['S','M','L','XL','XXL'], colors:['#111214','#d62828'],
    image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop&auto=format' },
  { id:'p14', name:'Demon Slayer Tanjiro Kamado Graphic', category:'Anime T-Shirts', tags:['anime','crew-neck','short-sleeve','regular-fit','cotton'],
    price:880, sizes:['S','M','L','XL','XXL'], colors:['#111214','#3a3f4b'],
    image:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop&auto=format' },
  { id:'p15', name:'Jujutsu Kaisen Gojo Satoru Streetwear', category:'Anime T-Shirts', tags:['anime','crew-neck','short-sleeve','regular-fit','cotton-poly-blend'],
    price:920, sizes:['S','M','L','XL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop&auto=format' },
  { id:'p16', name:'Dragon Ball Z Goku Super Saiyan Tee', category:'Anime T-Shirts', tags:['anime','crew-neck','short-sleeve','regular-fit','cotton'],
    price:850, sizes:['S','M','L','XL','XXL'], colors:['#111214','#ff8c00'],
    image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&auto=format' },
  { id:'p17', name:'Valorant Radiant Logo Esports Tee', category:'Gaming T-Shirts', tags:['gaming','crew-neck','short-sleeve','regular-fit','dry-fit'],
    price:780, sizes:['S','M','L','XL'], colors:['#111214','#ff4470'],
    image:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&auto=format' },
  { id:'p18', name:'PUBG Chicken Dinner Classic Tee', category:'Gaming T-Shirts', tags:['gaming','crew-neck','short-sleeve','regular-fit','cotton'],
    price:750, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&auto=format' },
  { id:'p19', name:'Free Fire Booyah! Graphic Tee', category:'Gaming T-Shirts', tags:['gaming','crew-neck','short-sleeve','regular-fit','cotton-poly-blend'],
    price:720, sizes:['S','M','L','XL'], colors:['#111214','#ff8c00'],
    image:'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop&auto=format' },
  { id:'p20', name:'FIFA街头 Football Streetwear Tee', category:'Gaming T-Shirts', tags:['gaming','crew-neck','short-sleeve','regular-fit','dry-fit'],
    price:790, sizes:['S','M','L','XL','XXL'], colors:['#111214','#4ec5ff'],
    image:'https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=500&fit=crop&auto=format' },
  { id:'p21', name:'Chittagong Hill Tracts Nature Tee', category:'Streetwear Graphic T-Shirts', tags:['streetwear','crew-neck','short-sleeve','regular-fit','cotton'],
    price:740, sizes:['S','M','L','XL'], colors:['#0e0f13','#2d6a4f'],
    image:'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=400&h=500&fit=crop&auto=format' },
  { id:'p22', name:'Bengal Tiger Streetwear Premium', category:'Streetwear Graphic T-Shirts', tags:['streetwear','crew-neck','short-sleeve','oversized-fit','cotton'],
    price:890, sizes:['S','M','L','XL','XXL'], colors:['#111214','#ff8c00'],
    image:'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=400&h=500&fit=crop&auto=format' },
  { id:'p23', name:'Minimalist Wave Line Art Tee', category:'Minimal Typography T-Shirts', tags:['typography','crew-neck','short-sleeve','regular-fit','cotton'],
    price:640, sizes:['S','M','L','XL','XXL'], colors:['#f3f1ea','#111214','#4ec5ff'],
    image:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop&auto=format' },
  { id:'p24', name:'"Stay Humble" Minimal Script Tee', category:'Minimal Typography T-Shirts', tags:['typography','crew-neck','short-sleeve','regular-fit','cotton'],
    price:620, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop&auto=format' },
  { id:'p25', name:'Heavyweight Oversized Sweatshirt', category:'Oversized T-Shirts', tags:['trending','crew-neck','long-sleeve','oversized-fit','cotton'],
    price:1290, sizes:['M','L','XL','XXL'], colors:['#111214','#3a3f4b','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1576566588028-4147f3842f27?w=400&h=500&fit=crop&auto=format' },
  { id:'p26', name:'Drop Shoulder Boxy Oversized Tee', category:'Oversized T-Shirts', tags:['trending','crew-neck','short-sleeve','oversized-fit','organic-cotton'],
    price:690, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea','#ff4470'],
    image:'https://images.unsplash.com/photo-1583743814966-8936f5b7be1a?w=400&h=500&fit=crop&auto=format' },
  { id:'p27', name:'"Code Sleep Repeat" Dev Life Tee', category:'Minimal Typography T-Shirts', tags:['typography','crew-neck','short-sleeve','regular-fit','cotton'],
    price:680, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1620799140408-edc6dcb6d633?w=400&h=500&fit=crop&auto=format' },
  { id:'p28', name:'Bengali Script "শান্তি" Calligraphy Tee', category:'Minimal Typography T-Shirts', tags:['typography','crew-neck','short-sleeve','regular-fit','cotton'],
    price:700, sizes:['S','M','L','XL','XXL'], colors:['#f3f1ea','#111214'],
    image:'https://images.unsplash.com/photo-1521572163474-6864f9cf17ab?w=400&h=500&fit=crop&auto=format' },
  { id:'p29', name:'His & Hers Matching Couple Set', category:'Couple T-Shirts', tags:['couple','crew-neck','short-sleeve','regular-fit','cotton'],
    price:1490, sizes:['S','M','L','XL'], colors:['#ff4470','#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1618354691373-d851c5c3a990?w=400&h=500&fit=crop&auto=format' },
  { id:'p30', name:'Love You More Couple Tee Pack', category:'Couple T-Shirts', tags:['couple','crew-neck','short-sleeve','regular-fit','cotton'],
    price:1350, sizes:['S','M','L','XL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1596755094514-f87e34085b2c?w=400&h=500&fit=crop&auto=format' },
  { id:'p31', name:'Alhamdulillah Arabic Script Tee', category:'Islamic Quote T-Shirts', tags:['islamic','crew-neck','short-sleeve','regular-fit','cotton'],
    price:720, sizes:['S','M','L','XL','XXL'], colors:['#111214','#3a3f4b','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1578587018452-892bacefd3f2?w=400&h=500&fit=crop&auto=format' },
  { id:'p32', name:'Bismillah Minimal Calligraphy Tee', category:'Islamic Quote T-Shirts', tags:['islamic','crew-neck','short-sleeve','regular-fit','cotton'],
    price:740, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1622445275576-721325763afe?w=400&h=500&fit=crop&auto=format' },
  { id:'p33', name:'V-Neck Slim Fit Essential Tee', category:'V-Neck T-Shirts', tags:['trending','v-neck','short-sleeve','slim-fit','cotton'],
    price:660, sizes:['S','M','L','XL','XXL'], colors:['#111214','#f3f1ea','#3a3f4b'],
    image:'https://images.unsplash.com/photo-1559551409-dadc959f76b8?w=400&h=500&fit=crop&auto=format' },
  { id:'p34', name:'Deep V-Neck Premium Cotton Tee', category:'V-Neck T-Shirts', tags:['v-neck','short-sleeve','regular-fit','cotton'],
    price:710, sizes:['S','M','L','XL'], colors:['#111214','#ff4470','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1594938328870-9623159c8c99?w=400&h=500&fit=crop&auto=format' },
  { id:'p35', name:'Premium 100% Organic Cotton Essential', category:'Oversized T-Shirts', tags:['trending','crew-neck','short-sleeve','regular-fit','organic-cotton'],
    price:850, sizes:['S','M','L','XL','XXL'], colors:['#f3f1ea','#111214'],
    image:'https://images.unsplash.com/photo-1606107557195-0e29a4b5b4aa?w=400&h=500&fit=crop&auto=format' },
  { id:'p36', name:'Raglan Sleeve Baseball Tee', category:'Raglan T-Shirts', tags:['trending','crew-neck','raglan-sleeve','regular-fit','cotton-poly-blend'],
    price:820, sizes:['S','M','L','XL'], colors:['#111214','#f3f1ea'],
    image:'https://images.unsplash.com/photo-1523381210434-271e8be1f52b?w=400&h=500&fit=crop&auto=format' },
];

function getAllProducts() {
  const overrides = readLS(LS_PRODUCT_OVERRIDES, {});
  const base = PRODUCTS.map(p => overrides[p.id] ? { ...p, ...overrides[p.id] } : p);
  const custom = readLS(LS_CUSTOM_PRODUCTS, []);
  return [...base, ...custom];
}

/* Category taxonomy shown in the tabbed pill sections */
const CAT_GROUPS = {
  trending: [
    ['👕','Oversized T-Shirts','oversized-fit'],['🍥','Anime T-Shirts','anime'],
    ['🔤','Minimal Typography','typography'],['🎮','Gaming T-Shirts','gaming'],
    ['💞','Couple T-Shirts','couple'],['☪️','Islamic Quote Tees','islamic'],
    ['🧱','Streetwear Graphic','streetwear'],
  ],
  neck: [
    ['⭕','Crew Neck','crew-neck'],['🔻','V-Neck','v-neck'],['🥄','Scoop Neck','scoop-neck'],
    ['👔','Henley','henley'],['🎾','Polo','polo'],['⛵','Boat Neck','boat-neck'],
    ['🚀','Mock Neck','mock-neck'],['🦢','Turtleneck','turtleneck'],
  ],
  sleeve: [
    ['✂️','Short Sleeve','short-sleeve'],['📏','Long Sleeve','long-sleeve'],['➗','Half Sleeve','half-sleeve'],
    ['🚫','Sleeveless','sleeveless'],['🧢','Cap Sleeve','cap-sleeve'],['🪡','Raglan Sleeve','raglan-sleeve'],
    ['📐','3/4 Sleeve','three-quarter-sleeve'],['💪','Muscle T-Shirt','muscle'],
  ],
  fit: [
    ['📦','Regular Fit','regular-fit'],['🩱','Slim Fit','slim-fit'],['🧬','Skinny Fit','skinny-fit'],
    ['🛋️','Relaxed Fit','relaxed-fit'],['🎒','Oversized Fit','oversized-fit'],['🧊','Boxy Fit','boxy-fit'],
    ['🏃','Athletic Fit','athletic-fit'],['✂️','Tailored Fit','tailored-fit'],
  ],
  fabric: [
    ['🌱','100% Cotton','cotton'],['🍃','Organic Cotton','organic-cotton'],['🧵','Polyester','polyester'],
    ['🔗','Cotton-Poly Blend','cotton-poly-blend'],['🧶','Tri-Blend','tri-blend'],['🌾','Linen','linen'],
    ['🎋','Bamboo','bamboo'],['💧','Dry-Fit','dry-fit'],
  ],
};

const REVIEWS = [
  { name:'Tanvir Ahmed', loc:'Chattogram', text:'Oversized fit is exactly like the photo, fabric feels premium and print hasn\'t faded after 10 washes.', rating:5 },
  { name:'Nusrat Jahan', loc:'Dhaka', text:'Ordered the couple tees for our anniversary — quality shocked me for this price. Delivery was 3 days.', rating:5 },
  { name:'Rakib Hasan', loc:'Cumilla', text:'Anime print detail is crisp, sizing chart was accurate so I didn\'t need an exchange.', rating:4 },
  { name:'Farhana Akter', loc:'Sylhet', text:'The gaming tee fabric is breathable, great for all-day wear at uni. Will order again.', rating:5 },
  { name:'Shakib Al Rahman', loc:'Chattogram', text:'bKash payment was smooth and support replied fast on WhatsApp about a size swap.', rating:4 },
  { name:'Mim Sultana', loc:'Rajshahi', text:'Typography tee print is soft-hand, not that plastic-y feel some local brands have.', rating:5 },
];

const FAQS = [
  { q:'How long does delivery take?', a:'Inside Chattogram city, orders usually arrive within 1–2 days. Anywhere else in Bangladesh takes 3–5 business days depending on courier coverage.' },
  { q:'What payment methods do you accept?', a:'We accept Cash on Delivery (COD), bKash, and Nagad. Select your preferred method at checkout — for bKash/Nagad we\'ll confirm the payment number over WhatsApp.' },
  { q:'Can I exchange a size after delivery?', a:'Yes — unworn, unwashed items with tags attached can be exchanged within 5 days of delivery. Message us on WhatsApp with your order details to start an exchange.' },
  { q:'Do you offer bulk or custom prints?', a:'Yes, we do bulk orders for events, universities and companies, plus custom designs. Reach out via WhatsApp or email with your requirements and quantity.' },
  { q:'Is Cash on Delivery available nationwide?', a:'Yes, COD is available across all 64 districts of Bangladesh through our courier partners.' },
];

/* =========================================================
   STATE
   ========================================================= */
let cart = readLS(LS_CART, []);          // [{productId, size, color, qty}]
let wishlist = readLS(LS_WISH, []);      // [productId]
let filters = { search:'', category:'all', size:'all', price:'all' };
const cardState = {}; // per-product selected size/color/qty before adding to cart

/* =========================================================
   INIT
   ========================================================= */
document.addEventListener('DOMContentLoaded', () => {
  initTheme();
  initLoader();
  initNav();
  initHeroImages();
  initMarqueeSafety();
  if ($('#productGrid')) initShopPage();
  if ($('#adminApp')) initAdmin();
  initRevealObserver();
});

/* ---------- loader ---------- */
function initLoader() {
  const loader = $('#loader');
  if (!loader) return;
  window.addEventListener('load', () => setTimeout(() => loader.classList.add('hide'), 350));
  // fallback in case load already fired
  setTimeout(() => loader.classList.add('hide'), 1800);
}

/* ---------- theme ---------- */
function initTheme() {
  const saved = readLS(LS_THEME, 'dark');
  document.body.setAttribute('data-theme', saved);
  const btn = $('#themeToggle');
  if (!btn) return;
  btn.addEventListener('click', () => {
    const cur = document.body.getAttribute('data-theme');
    const next = cur === 'dark' ? 'light' : 'dark';
    document.body.setAttribute('data-theme', next);
    writeLS(LS_THEME, next);
  });
}

/* ---------- nav (mobile menu, cart/wishlist open) ---------- */
function initNav() {
  const hamburger = $('#hamburger');
  const navLinks = $('#navLinks');
  if (hamburger) hamburger.addEventListener('click', () => navLinks.classList.toggle('open'));
  $$('#navLinks a').forEach(a => a.addEventListener('click', () => navLinks.classList.remove('open')));

  const overlay = $('#overlay');
  const cartPanel = $('#cartPanel');
  const cartToggle = $('#cartToggle');
  const cartClose = $('#cartClose');

  function openCart() { renderCart(); cartPanel.classList.add('show'); overlay.classList.add('show'); }
  function closeCart() { cartPanel.classList.remove('show'); overlay.classList.remove('show'); }

  if (cartToggle) cartToggle.addEventListener('click', openCart);
  if (cartClose) cartClose.addEventListener('click', closeCart);
  if (overlay) overlay.addEventListener('click', () => { closeCart(); closeModal(); });

  const wishNav = $('#wishToggleNav');
  if (wishNav) wishNav.addEventListener('click', () => {
    document.querySelector('#shop')?.scrollIntoView({ behavior:'smooth' });
    filters.search = ''; // just scroll to shop; wishlist items are highlighted via heart state
  });

  updateCartCount();
  updateWishCount();
}

/* ---------- scroll reveal ---------- */
function initRevealObserver() {
  const els = $$('.reveal:not(.in-view)');
  if (!('IntersectionObserver' in window) || els.length === 0) {
    els.forEach(el => el.classList.add('in-view'));
    return;
  }
  const io = new IntersectionObserver((entries) => {
    entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('in-view'); io.unobserve(e.target); } });
  }, { threshold:.12 });
  els.forEach(el => io.observe(el));
}

function initMarqueeSafety() {
  // nothing extra needed — CSS handles the infinite scroll; placeholder for future tuning
}

function initHeroImages() {
  const h1 = $('#heroTee1');
  const h2 = $('#heroTee2');
  const all = getAllProducts();
  if (h1) h1.style.background = `url(${all[0]?.image || teeMockupSVG('Oversized Streetwear', '#1c1f27')}) center/cover no-repeat`;
  if (h2) h2.style.background = `url(${all[3]?.image || teeMockupSVG('Anime Graphic Drop', '#21242e')}) center/cover no-repeat`;
}

/* =========================================================
   SHOP PAGE (index.html)
   ========================================================= */
function initShopPage() {
  buildCategoryFilterOptions();
  renderCategoryTabs();
  renderProducts();
  renderReviews();
  renderFaq();

  $('#searchInput')?.addEventListener('input', e => { filters.search = e.target.value.toLowerCase(); renderProducts(); });
  $('#filterCategory')?.addEventListener('change', e => { filters.category = e.target.value; renderProducts(); });
  $('#filterSize')?.addEventListener('change', e => { filters.size = e.target.value; renderProducts(); });
  $('#filterPrice')?.addEventListener('change', e => { filters.price = e.target.value; renderProducts(); });

  $$('.cat-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.cat-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.pill-grid').forEach(p => p.hidden = p.dataset.panel !== tab.dataset.group);
  }));

  initCheckoutForm();
  initNewsletter();
  renderCart();
  updateSummary();
}

function buildCategoryFilterOptions() {
  const sel = $('#filterCategory');
  if (!sel) return;
  const cats = [...new Set(getAllProducts().map(p => p.category))];
  cats.forEach(c => {
    const opt = document.createElement('option');
    opt.value = c; opt.textContent = c;
    sel.appendChild(opt);
  });
}

function renderCategoryTabs() {
  Object.entries(CAT_GROUPS).forEach(([group, items]) => {
    const panel = $(`.pill-grid[data-panel="${group}"]`);
    if (!panel) return;
    panel.innerHTML = items.map(([icon, label, tag]) => `
      <button class="pill-card" data-tag="${tag}">
        <span class="ic">${icon}</span>
        <div><h4>${label}</h4><span>Browse styles</span></div>
      </button>`).join('');
  });
  $$('.pill-card').forEach(card => card.addEventListener('click', () => {
    const tag = card.dataset.tag;
    filters.search = tag.replace(/-/g, ' ');
    $('#searchInput').value = '';
    filters.tagOverride = tag;
    filters.category = 'all'; filters.size='all'; filters.price='all';
    $('#filterCategory').value = 'all'; $('#filterSize').value='all'; $('#filterPrice').value='all';
    renderProducts();
    $('#shop').scrollIntoView({ behavior:'smooth' });
  }));
}

function matchesFilters(p) {
  if (filters.tagOverride && !p.tags.includes(filters.tagOverride)) return false;
  if (filters.category !== 'all' && p.category !== filters.category) return false;
  if (filters.size !== 'all' && !p.sizes.includes(filters.size)) return false;
  if (filters.price !== 'all') {
    const [lo, hi] = filters.price.split('-').map(Number);
    if (p.price < lo || p.price > hi) return false;
  }
  if (filters.search) {
    const hay = (p.name + ' ' + p.category + ' ' + p.tags.join(' ')).toLowerCase();
    if (!hay.includes(filters.search)) return false;
  }
  return true;
}

function renderProducts() {
  const grid = $('#productGrid');
  if (!grid) return;
  const list = getAllProducts().filter(matchesFilters);
  $('#resultsCount').textContent = `${list.length} product${list.length !== 1 ? 's' : ''} found`;

  if (list.length === 0) {
    grid.innerHTML = `<div class="no-results">No tees match those filters yet. Try clearing search or filters ✨</div>`;
    return;
  }

  grid.innerHTML = list.map(p => productCardHTML(p)).join('');
  list.forEach(p => bindProductCard(p));
}

function productCardHTML(p) {
  if (!cardState[p.id]) cardState[p.id] = { size: p.sizes[0], color: p.colors[0], qty: 1 };
  const st = cardState[p.id];
  const wished = wishlist.includes(p.id);
  const imgSrc = p.image || teeMockupSVG(p.name, p.colors[0]);
  return `
  <article class="product-card" data-id="${p.id}">
    <div class="product-media">
      <img src="${imgSrc}" alt="${p.name}" loading="lazy">
      <span class="product-tag">${p.category}</span>
      <button class="wish-btn ${wished ? 'active' : ''}" data-action="wish" aria-label="Toggle wishlist">
        <svg viewBox="0 0 24 24"><path d="M12 21s-7.5-4.7-10-9.3C.5 8 2.2 4 6.2 4c2.2 0 3.8 1.3 5.8 3.7C14 5.3 15.6 4 17.8 4c4 0 5.7 4 4.2 7.7C19.5 16.3 12 21 12 21Z"/></svg>
      </button>
      <button class="qv-btn" data-action="quickview">Quick View</button>
    </div>
    <div class="product-body">
      <h3>${p.name}</h3>
      <span class="product-cat">${p.category}</span>
      <span class="price-tag">${p.price}</span>

      <div class="option-row">
        <span class="opt-label">Size</span>
        ${p.sizes.map(s => `<button class="size-btn ${s === st.size ? 'active' : ''}" data-size="${s}">${s}</button>`).join('')}
      </div>
      <div class="option-row">
        <span class="opt-label">Color</span>
        ${p.colors.map(c => `<button class="color-dot ${c === st.color ? 'active' : ''}" data-color="${c}" style="background:${c}"></button>`).join('')}
      </div>
      <div class="qty-row">
        <span class="opt-label" style="width:auto;">Quantity</span>
        <div class="stepper">
          <button data-action="dec">−</button>
          <span data-role="qty">${st.qty}</span>
          <button data-action="inc">+</button>
        </div>
      </div>
      <div class="card-ctas">
        <button class="btn btn-outline" data-action="add">Add to Cart</button>
        <button class="btn btn-lime" data-action="buy">Buy Now</button>
      </div>
    </div>
  </article>`;
}

function bindProductCard(p) {
  const card = $(`.product-card[data-id="${p.id}"]`);
  if (!card) return;
  const st = cardState[p.id];

  card.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;

    if (btn.dataset.size) {
      st.size = btn.dataset.size;
      $$('.size-btn', card).forEach(b => b.classList.toggle('active', b === btn));
    }
    if (btn.dataset.color) {
      st.color = btn.dataset.color;
      $$('.color-dot', card).forEach(b => b.classList.toggle('active', b === btn));
    }
    const action = btn.dataset.action;
    if (action === 'inc') { st.qty = Math.min(st.qty + 1, 10); $('[data-role="qty"]', card).textContent = st.qty; }
    if (action === 'dec') { st.qty = Math.max(st.qty - 1, 1); $('[data-role="qty"]', card).textContent = st.qty; }
    if (action === 'wish') toggleWishlist(p.id, btn);
    if (action === 'quickview') openQuickView(p);
    if (action === 'add') addToCart(p, st, { silent:false });
    if (action === 'buy') { addToCart(p, st, { silent:true }); document.getElementById('checkout').scrollIntoView({ behavior:'smooth' }); }
  });
}

/* ---------- wishlist ---------- */
function toggleWishlist(id, btn) {
  const idx = wishlist.indexOf(id);
  if (idx > -1) { wishlist.splice(idx, 1); btn.classList.remove('active'); toast('Removed from wishlist'); }
  else { wishlist.push(id); btn.classList.add('active'); toast('Added to wishlist ♥'); }
  writeLS(LS_WISH, wishlist);
  updateWishCount();
}
function updateWishCount() { const el = $('#wishCount'); if (el) el.textContent = wishlist.length; }

/* ---------- cart ---------- */
function addToCart(p, st, { silent }) {
  const existing = cart.find(c => c.id === p.id && c.size === st.size && c.color === st.color);
  if (existing) existing.qty += st.qty;
  else cart.push({ id:p.id, size:st.size, color:st.color, qty:st.qty });
  writeLS(LS_CART, cart);
  updateCartCount();
  renderCart();
  updateSummary();
  if (!silent) toast(`${p.name} added to cart`);
}

function removeFromCart(index) {
  cart.splice(index, 1);
  writeLS(LS_CART, cart);
  updateCartCount();
  renderCart();
  updateSummary();
}

function changeCartQty(index, delta) {
  cart[index].qty = Math.max(1, cart[index].qty + delta);
  writeLS(LS_CART, cart);
  updateCartCount();
  renderCart();
  updateSummary();
}

function cartLines() {
  const all = getAllProducts();
  return cart.map((c, i) => {
    const p = all.find(pp => pp.id === c.id);
    return p ? { ...c, index:i, product:p, lineTotal:p.price * c.qty } : null;
  }).filter(Boolean);
}

function updateCartCount() {
  const el = $('#cartCount');
  if (el) el.textContent = cart.reduce((s, c) => s + c.qty, 0);
}

function renderCart() {
  const wrap = $('#cartItems');
  if (!wrap) return;
  const lines = cartLines();
  if (lines.length === 0) {
    wrap.innerHTML = `<div class="cart-empty">Your cart is empty.<br>Go grab a fit you like 👕</div>`;
  } else {
    wrap.innerHTML = lines.map(l => `
      <div class="cart-item" data-index="${l.index}">
        <img src="${l.product.image || teeMockupSVG(l.product.name, l.product.colors[0])}" alt="${l.product.name}">
        <div class="cart-item-info">
          <h4>${l.product.name}</h4>
          <span>${l.size} · ${l.color === '#f3f1ea' ? 'White' : ''} </span>
          <span class="price-tag" style="font-size:13px;">${l.lineTotal}</span>
          <div class="cart-item-bottom">
            <div class="stepper">
              <button data-cart-action="dec">−</button>
              <span>${l.qty}</span>
              <button data-cart-action="inc">+</button>
            </div>
            <button class="remove" data-cart-action="remove">Remove</button>
          </div>
        </div>
      </div>`).join('');
  }
  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  $('#cartSubtotal').textContent = money(subtotal);

  $$('.cart-item', wrap).forEach(item => {
    const idx = Number(item.dataset.index);
    item.addEventListener('click', (e) => {
      const action = e.target.dataset.cartAction;
      if (action === 'inc') changeCartQty(idx, 1);
      if (action === 'dec') changeCartQty(idx, -1);
      if (action === 'remove') removeFromCart(idx);
    });
  });
}

/* ---------- quick view modal ---------- */
function openQuickView(p) {
  const modal = $('#quickView');
  const overlay = $('#overlay');
  const st = cardState[p.id];
  const imgSrc = p.image || teeMockupSVG(p.name, p.colors[0]);
  modal.innerHTML = `
    <button class="modal-close" id="qvClose">✕</button>
    <div class="modal-grid">
      <img src="${imgSrc}" alt="${p.name}">
      <div class="modal-body">
        <span class="product-cat">${p.category}</span>
        <h3 class="display" style="font-size:26px;">${p.name}</h3>
        <span class="price-tag" style="font-size:20px;">${p.price}</span>
        <p style="color:var(--text-mute);font-size:14px;">Available sizes: ${p.sizes.join(', ')}. Tags: ${p.tags.join(', ').replace(/-/g,' ')}.</p>
        <div class="option-row"><span class="opt-label">Size</span>${p.sizes.map(s => `<button class="size-btn ${s===st.size?'active':''}" data-size="${s}">${s}</button>`).join('')}</div>
        <div class="option-row"><span class="opt-label">Color</span>${p.colors.map(c => `<button class="color-dot ${c===st.color?'active':''}" data-color="${c}" style="background:${c}"></button>`).join('')}</div>
        <div class="qty-row"><span class="opt-label" style="width:auto;">Quantity</span>
          <div class="stepper"><button data-action="dec">−</button><span data-role="qty">${st.qty}</span><button data-action="inc">+</button></div>
        </div>
        <div class="card-ctas" style="margin-top:8px;">
          <button class="btn btn-outline" data-action="add">Add to Cart</button>
          <button class="btn btn-lime" data-action="buy">Buy Now</button>
        </div>
      </div>
    </div>`;

  modal.addEventListener('click', (e) => {
    const btn = e.target.closest('button');
    if (!btn) return;
    if (btn.id === 'qvClose') return closeModal();
    if (btn.dataset.size) { st.size = btn.dataset.size; $$('.size-btn', modal).forEach(b => b.classList.toggle('active', b===btn)); }
    if (btn.dataset.color) { st.color = btn.dataset.color; $$('.color-dot', modal).forEach(b => b.classList.toggle('active', b===btn)); }
    const action = btn.dataset.action;
    if (action === 'inc') { st.qty = Math.min(st.qty+1,10); $('[data-role="qty"]', modal).textContent = st.qty; }
    if (action === 'dec') { st.qty = Math.max(st.qty-1,1); $('[data-role="qty"]', modal).textContent = st.qty; }
    if (action === 'add') { addToCart(p, st, {silent:false}); renderProducts(); }
    if (action === 'buy') { addToCart(p, st, {silent:true}); closeModal(); document.getElementById('checkout').scrollIntoView({behavior:'smooth'}); }
  }, { once:false });

  modal.classList.add('show');
  overlay.classList.add('show');
}
function closeModal() {
  $('#quickView')?.classList.remove('show');
  const cartOpen = $('#cartPanel')?.classList.contains('show');
  if (!cartOpen) $('#overlay')?.classList.remove('show');
}

/* ---------- checkout ---------- */
const DELIVERY_FEE = 70;

function updateSummary() {
  const summaryItems = $('#summaryItems');
  if (!summaryItems) return;
  const lines = cartLines();
  summaryItems.innerHTML = lines.map(l => `
    <div class="summary-item"><span>${l.product.name} × ${l.qty} (${l.size})</span><span>${money(l.lineTotal)}</span></div>
  `).join('') || `<div class="summary-item"><span>No items yet — add something from the shop</span><span></span></div>`;

  const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
  const delivery = lines.length ? DELIVERY_FEE : 0;
  $('#sumSubtotal').textContent = money(subtotal);
  $('#sumDelivery').textContent = money(delivery);
  $('#sumTotal').textContent = money(subtotal + delivery);
}

function initCheckoutForm() {
  const form = $('#checkoutForm');
  if (!form) return;

  $$('.pay-opt').forEach(opt => opt.addEventListener('click', () => {
    $$('.pay-opt').forEach(o => o.classList.remove('active'));
    opt.classList.add('active');
  }));

  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const lines = cartLines();
    if (lines.length === 0) { toast('Your cart is empty — add a product first'); return; }

    const name = $('#custName').value.trim();
    const phone = $('#custPhone').value.trim();
    const area = $('#custArea').value.trim();
    const address = $('#custAddress').value.trim();
    const payment = $('input[name="pay"]:checked').value;

    if (!/^01[0-9]{9}$/.test(phone)) { toast('Enter a valid 11-digit BD phone number'); return; }

    const subtotal = lines.reduce((s, l) => s + l.lineTotal, 0);
    const total = subtotal + DELIVERY_FEE;

    const order = {
      id: 'VT-' + uid().toUpperCase(),
      date: new Date().toISOString(),
      customer: { name, phone, area, address },
      items: lines.map(l => ({ name:l.product.name, size:l.size, color:l.color, qty:l.qty, price:l.product.price })),
      subtotal, delivery: DELIVERY_FEE, total,
      payment, status: 'Pending',
    };

    const orders = readLS(LS_ORDERS, []);
    orders.unshift(order);
    writeLS(LS_ORDERS, orders);

    cart = [];
    writeLS(LS_CART, cart);
    updateCartCount();
    renderCart();
    updateSummary();
    form.reset();
    $$('.pay-opt').forEach((o,i) => o.classList.toggle('active', i===0));

    toast(`Order ${order.id} placed! We'll confirm on WhatsApp shortly.`);
  });
}

/* ---------- newsletter ---------- */
function initNewsletter() {
  const form = $('#newsletterForm');
  if (!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const email = $('#newsletterEmail').value.trim();
    const list = readLS(LS_NEWSLETTER, []);
    if (!list.includes(email)) list.push(email);
    writeLS(LS_NEWSLETTER, list);
    form.reset();
    toast('Subscribed! Watch your inbox for the 10% code 🎉');
  });
}

/* ---------- reviews & faq ---------- */
function renderReviews() {
  const grid = $('#reviewGrid');
  if (!grid) return;
  grid.innerHTML = REVIEWS.map(r => `
    <div class="review-card reveal in-view">
      <div class="stars">${'★'.repeat(r.rating)}${'☆'.repeat(5-r.rating)}</div>
      <p>"${r.text}"</p>
      <div class="reviewer">
        <div class="av">${r.name.charAt(0)}</div>
        <div><b>${r.name}</b><span>${r.loc}</span></div>
      </div>
    </div>`).join('');
}

function renderFaq() {
  const list = $('#faqList');
  if (!list) return;
  list.innerHTML = FAQS.map((f,i) => `
    <div class="faq-item reveal in-view" data-i="${i}">
      <div class="faq-q"><span>${f.q}</span><span class="plus">+</span></div>
      <div class="faq-a"><p>${f.a}</p></div>
    </div>`).join('');
  $$('.faq-item', list).forEach(item => item.addEventListener('click', () => {
    const wasOpen = item.classList.contains('open');
    $$('.faq-item', list).forEach(i => i.classList.remove('open'));
    if (!wasOpen) item.classList.add('open');
  }));
}

/* =========================================================
   ADMIN DASHBOARD (admin.html)
   ========================================================= */
function initAdmin() {
  const ADMIN_PASS = 'vibethreads2026';
  const gate = $('#adminGate');
  const app = $('#adminApp');
  const loggedIn = sessionStorage.getItem('vt_admin') === '1';

  function unlock() {
    sessionStorage.setItem('vt_admin', '1');
    gate.style.display = 'none';
    app.style.display = 'block';
    updateAllStats();
    renderOrders();
    renderCustomers();
    renderNewsletter();
    renderMgmtProducts();
  }

  if (loggedIn) unlock();

  $('#adminLoginForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const val = $('#adminPass').value;
    if (val === ADMIN_PASS) unlock();
    else toast('Incorrect passcode');
  });

  $('#adminLogout')?.addEventListener('click', () => {
    sessionStorage.removeItem('vt_admin');
    location.reload();
  });

  $('#adminSearch')?.addEventListener('input', renderOrders);
  $('#adminStatusFilter')?.addEventListener('change', renderOrders);
  $('#clearCompletedBtn')?.addEventListener('click', () => {
    if (!confirm('Delete all Delivered and Cancelled orders?')) return;
    const all = readLS(LS_ORDERS, []).filter(o => o.status !== 'Delivered' && o.status !== 'Cancelled');
    writeLS(LS_ORDERS, all);
    toast('Completed orders cleared');
    renderOrders(); updateAllStats(); renderCustomers();
  });

  // Tab switching
  $$('.admin-tab').forEach(tab => tab.addEventListener('click', () => {
    $$('.admin-tab').forEach(t => t.classList.remove('active'));
    tab.classList.add('active');
    $$('.admin-panel').forEach(p => p.hidden = p.dataset.apanel !== tab.dataset.apanel);
  }));

  // ===== ORDER RENDER =====
  function renderOrders() {
    const orders = readLS(LS_ORDERS, []);
    const tbody = $('#ordersBody');
    const empty = $('#ordersEmpty');
    if (!tbody) return;

    const q = ($('#adminSearch')?.value || '').toLowerCase();
    const statusFilter = $('#adminStatusFilter')?.value || 'all';

    const filtered = orders.filter(o => {
      if (statusFilter !== 'all' && o.status !== statusFilter) return false;
      if (!q) return true;
      const hay = (o.id + ' ' + o.customer.name + ' ' + o.customer.phone).toLowerCase();
      return hay.includes(q);
    });

    if (filtered.length === 0) {
      tbody.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    tbody.innerHTML = filtered.map((o, idx) => `
      <tr data-id="${o.id}">
        <td><button class="icon-btn" style="width:26px;height:26px;font-size:12px;" data-action="toggle-detail">▶</button></td>
        <td><span class="mono">${o.id}</span><br><span class="muted">${new Date(o.date).toLocaleString('en-BD')}</span></td>
        <td><b>${o.customer.name}</b><br><span class="muted">${o.customer.phone}</span><br><span class="muted">${o.customer.area}</span></td>
        <td>${o.items.map(it => `${it.name} × ${it.qty} (${it.size})`).join('<br>')}</td>
        <td class="mono">${money(o.total)}</td>
        <td>${o.payment}</td>
        <td>
          <select data-action="status">
            ${['Pending','Confirmed','Shipped','Delivered','Cancelled'].map(s => `<option value="${s}" ${s===o.status?'selected':''}>${s}</option>`).join('')}
          </select>
        </td>
        <td><button class="btn btn-sm btn-outline" data-action="delete">Delete</button></td>
      </tr>
      <tr class="order-detail" data-detail="${o.id}" style="display:none;">
        <td colspan="8" style="padding:0 18px 18px;">
          <div style="background:var(--bg-soft);border-radius:12px;padding:18px;font-size:13px;display:grid;grid-template-columns:1fr 1fr;gap:10px;">
            <div><b style="color:var(--text-faint);font-size:11px;text-transform:uppercase;">Address</b><br>${o.customer.address}</div>
            <div><b style="color:var(--text-faint);font-size:11px;text-transform:uppercase;">Payment</b><br>${o.payment} · ${money(o.total)}</div>
            <div><b style="color:var(--text-faint);font-size:11px;text-transform:uppercase;">Items</b><br>${o.items.map(it => `${it.name} — ${it.size}, ${it.color}, ×${it.qty} = ${money(it.price * it.qty)}`).join('<br>')}</div>
            <div><b style="color:var(--text-faint);font-size:11px;text-transform:uppercase;">Subtotal / Delivery</b><br>${money(o.subtotal)} + ${money(o.delivery)}</div>
          </div>
        </td>
      </tr>`).join('');

    $$('#ordersBody tr[data-id]').forEach(row => {
      const id = row.dataset.id;
      row.querySelector('[data-action="toggle-detail"]')?.addEventListener('click', () => {
        const detail = $(`tr[data-detail="${id}"]`);
        if (detail) {
          const isVisible = detail.style.display !== 'none';
          detail.style.display = isVisible ? 'none' : 'table-row';
          row.querySelector('[data-action="toggle-detail"]').textContent = isVisible ? '▶' : '▼';
        }
      });
      row.querySelector('[data-action="status"]')?.addEventListener('change', (e) => {
        const all = readLS(LS_ORDERS, []);
        const ord = all.find(o => o.id === id);
        if (ord) { ord.status = e.target.value; writeLS(LS_ORDERS, all); toast(`Order ${id} marked ${ord.status}`); renderOrders(); }
      });
      row.querySelector('[data-action="delete"]')?.addEventListener('click', () => {
        if (!confirm(`Delete order ${id}? This cannot be undone.`)) return;
        const all = readLS(LS_ORDERS, []).filter(o => o.id !== id);
        writeLS(LS_ORDERS, all);
        toast(`Order ${id} deleted`);
        renderOrders(); updateAllStats(); renderCustomers();
      });
    });
  }

  // ===== CUSTOMERS =====
  function renderCustomers() {
    const tbody = $('#customersBody');
    const empty = $('#customersEmpty');
    if (!tbody) return;
    const orders = readLS(LS_ORDERS, []);
    const map = {};
    orders.forEach(o => {
      const key = o.customer.phone;
      if (!map[key]) map[key] = { ...o.customer, count:0, total:0 };
      map[key].count++;
      map[key].total += o.total;
    });
    const list = Object.values(map);
    if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    tbody.innerHTML = list.map(c => `
      <tr><td><b>${c.name}</b></td><td>${c.phone}</td><td>${c.area}</td><td>${c.count}</td><td class="mono">${money(c.total)}</td></tr>`).join('');
  }

  // ===== NEWSLETTER =====
  function renderNewsletter() {
    const tbody = $('#newsletterBody');
    const empty = $('#newsletterEmpty');
    if (!tbody) return;
    const list = readLS(LS_NEWSLETTER, []);
    if (list.length === 0) { tbody.innerHTML = ''; empty.style.display = 'block'; return; }
    empty.style.display = 'none';
    tbody.innerHTML = list.map((e, i) => `<tr><td>${i + 1}</td><td>${e}</td></tr>`).join('');
  }

  // ===== UPDATE ALL STATS =====
  function updateAllStats() {
    const orders = readLS(LS_ORDERS, []);
    const customers = new Set(orders.map(o => o.customer.phone));
    const today = new Date().toDateString();
    const todayOrders = orders.filter(o => new Date(o.date).toDateString() === today);
    const allProducts = getAllProducts();
    $('#statTotal').textContent = orders.length;
    $('#statPending').textContent = orders.filter(o => o.status === 'Pending').length;
    $('#statRevenue').textContent = money(orders.reduce((s,o) => s + o.total, 0));
    $('#statProducts').textContent = allProducts.length;
    $('#statCustomers').textContent = customers.size;
    $('#statToday').textContent = todayOrders.length;
  }

  // ===== DATA EXPORT / IMPORT / CLEAR =====
  $('#exportDataBtn')?.addEventListener('click', () => {
    const data = {
      orders: readLS(LS_ORDERS, []),
      customProducts: readLS(LS_CUSTOM_PRODUCTS, []),
      productOverrides: readLS(LS_PRODUCT_OVERRIDES, {}),
      newsletter: readLS(LS_NEWSLETTER, []),
      exportedAt: new Date().toISOString(),
    };
    const blob = new Blob([JSON.stringify(data, null, 2)], { type:'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = `vibethreads-backup-${Date.now()}.json`; a.click();
    URL.revokeObjectURL(url);
    toast('Backup downloaded');
  });

  $('#importDataInput')?.addEventListener('change', (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      try {
        const data = JSON.parse(ev.target.result);
        if (data.orders) writeLS(LS_ORDERS, data.orders);
        if (data.customProducts) writeLS(LS_CUSTOM_PRODUCTS, data.customProducts);
        if (data.productOverrides) writeLS(LS_PRODUCT_OVERRIDES, data.productOverrides);
        if (data.newsletter) writeLS(LS_NEWSLETTER, data.newsletter);
        $('#importResult').textContent = `✅ Imported: ${data.orders?.length || 0} orders, ${data.customProducts?.length || 0} custom products, ${data.newsletter?.length || 0} subscribers.`;
        toast('Data imported successfully');
        renderOrders(); renderMgmtProducts(); renderCustomers(); renderNewsletter(); updateAllStats();
      } catch (err) {
        $('#importResult').textContent = '❌ Invalid backup file';
        toast('Import failed — invalid file');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  });

  $('#clearAllBtn')?.addEventListener('click', () => {
    if (!confirm('⚠️ Delete ALL orders, custom products, overrides, and newsletter data? This cannot be undone.')) return;
    if (!confirm('Are you sure? This will wipe everything except the built-in products.')) return;
    writeLS(LS_ORDERS, []);
    writeLS(LS_CUSTOM_PRODUCTS, []);
    writeLS(LS_PRODUCT_OVERRIDES, {});
    writeLS(LS_NEWSLETTER, []);
    toast('All data cleared');
    renderOrders(); renderMgmtProducts(); renderCustomers(); renderNewsletter(); updateAllStats();
  });

  /* ---------- product management ---------- */
  let editTarget = null; // { type:'custom'|'builtin', id, index }

  function openApModal(target) {
    editTarget = target;
    const title = $('#apModalTitle');
    const btn = $('#apSubmitBtn');
    const form = $('#addProductForm');
    form.reset();
    $('#apImagePreviewWrap').style.display = 'none';

    if (target) {
      title.textContent = 'Edit Product';
      btn.textContent = 'Update Product';
      const all = getAllProducts();
      const p = all.find(x => x.id === target.id);
      if (p) {
        $('#apEditId').value = p.id;
        $('#apName').value = p.name;
        $('#apCategory').value = p.category;
        $('#apPrice').value = p.price;
        $('#apSizes').value = p.sizes.join(', ');
        $('#apColors').value = p.colors.join(', ');
        $('#apImage').value = p.image || '';
        $('#apTags').value = p.tags.join(', ');
      }
    } else {
      title.textContent = 'Add New Product';
      btn.textContent = 'Save Product';
      $('#apEditId').value = '';
    }
    $('#apModal').classList.add('show');
    $('#apOverlay').classList.add('show');
  }

  $('#addProductBtn')?.addEventListener('click', () => openApModal(null));

  function closeApModal() {
    $('#apModal').classList.remove('show');
    $('#apOverlay').classList.remove('show');
    editTarget = null;
  }
  $('#apClose')?.addEventListener('click', closeApModal);
  $('#apOverlay')?.addEventListener('click', closeApModal);

  // Image file upload → data URI preview
  $('#apImageFile')?.addEventListener('change', () => {
    const file = $('#apImageFile').files[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      $('#apImagePreview').src = e.target.result;
      $('#apImagePreviewWrap').style.display = 'block';
      $('#apImage').value = e.target.result;
    };
    reader.readAsDataURL(file);
  });

  $('#addProductForm')?.addEventListener('submit', (e) => {
    e.preventDefault();
    const name = $('#apName').value.trim();
    const category = $('#apCategory').value.trim();
    const price = parseInt($('#apPrice').value, 10);
    const sizes = $('#apSizes').value.split(',').map(s => s.trim()).filter(Boolean);
    const colors = $('#apColors').value.split(',').map(s => s.trim()).filter(Boolean);
    const image = $('#apImage').value.trim() || '';
    const tags = $('#apTags').value.split(',').map(s => s.trim()).filter(Boolean);
    if (!name || !category || !price || !sizes.length || !colors.length || !tags.length) {
      toast('Please fill all required fields'); return;
    }

    if (editTarget) {
      // ---- EDIT MODE ----
      if (editTarget.type === 'custom') {
        const custom = readLS(LS_CUSTOM_PRODUCTS, []);
        const idx = custom.findIndex(p => p.id === editTarget.id);
        if (idx > -1) {
          custom[idx] = { ...custom[idx], name, category, price, sizes, colors, tags, image: image || undefined };
          writeLS(LS_CUSTOM_PRODUCTS, custom);
          toast(`"${name}" updated`);
        }
      } else if (editTarget.type === 'builtin') {
        const overrides = readLS(LS_PRODUCT_OVERRIDES, {});
        overrides[editTarget.id] = { name, category, price, sizes, colors, tags, image: image || undefined };
        writeLS(LS_PRODUCT_OVERRIDES, overrides);
        toast(`"${name}" updated (built-in override saved)`);
      }
    } else {
      // ---- ADD MODE ----
      const newProduct = {
        id: 'cp-' + uid().toUpperCase(),
        name, category, price, sizes, colors, tags,
        image: image || undefined,
        _custom: true,
      };
      const custom = readLS(LS_CUSTOM_PRODUCTS, []);
      custom.unshift(newProduct);
      writeLS(LS_CUSTOM_PRODUCTS, custom);
      toast(`"${name}" added to catalog`);
    }

    closeApModal();
    $('#addProductForm').reset();
    renderMgmtProducts();
  });

  function renderMgmtProducts() {
    const grid = $('#mgmtProductGrid');
    const empty = $('#mgmtEmpty');
    if (!grid) return;
    const custom = readLS(LS_CUSTOM_PRODUCTS, []);
    const overrides = readLS(LS_PRODUCT_OVERRIDES, {});

    const all = getAllProducts();
    if (all.length === 0) {
      grid.innerHTML = '';
      empty.style.display = 'block';
      return;
    }
    empty.style.display = 'none';

    grid.innerHTML = all.map((p) => {
      const isCustom = p._custom;
      const isOverridden = !isCustom && overrides[p.id];
      const badge = isCustom ? 'Custom' : isOverridden ? 'Overridden' : 'Built-in';
      return `
      <div class="mgmt-card" data-id="${p.id}">
        <img src="${p.image || teeMockupSVG(p.name, p.colors[0])}" alt="${p.name}" loading="lazy">
        <h4>${p.name}</h4>
        <span class="muted">${p.category} · ৳${p.price}</span>
        <span class="muted">${p.sizes.join(', ')}</span>
        <span class="muted" style="font-size:10px;text-transform:uppercase;letter-spacing:.5px;">${badge}</span>
        <div style="display:flex;gap:6px;margin-top:4px;">
          <button class="btn btn-outline btn-sm" data-action="edit-product" style="flex:1;">Edit</button>
          ${isCustom ? `<button class="btn btn-outline btn-sm" data-action="del-product" style="flex:1;">Delete</button>` : ''}
        </div>
      </div>`;
    }).join('');

    $$('[data-action="edit-product"]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.mgmt-card').dataset.id;
        const all = getAllProducts();
        const p = all.find(x => x.id === id);
        if (!p) return;
        const isCustom = p._custom;
        openApModal({ type: isCustom ? 'custom' : 'builtin', id });
      });
    });

    $$('[data-action="del-product"]', grid).forEach(btn => {
      btn.addEventListener('click', () => {
        const id = btn.closest('.mgmt-card').dataset.id;
        if (!confirm('Delete this product? This cannot be undone.')) return;
        const custom = readLS(LS_CUSTOM_PRODUCTS, []);
        const idx = custom.findIndex(p => p.id === id);
        if (idx > -1) {
          custom.splice(idx, 1);
          writeLS(LS_CUSTOM_PRODUCTS, custom);
          toast('Product deleted');
          renderMgmtProducts();
        }
      });
    });
  }
}
