/* ============================================================
   CIVIC AI — main.js (shared across every page)
   ============================================================ */

const CivicAI = {
  citizenNav: [
    { href: 'index.html', label: 'Home' },
    { href: 'report.html', label: 'Report Issue' },
    { href: 'reports.html', label: 'My Reports' },
    { href: 'about.html', label: 'About' },
  ],
  adminNav: [
    { href: 'admin-dashboard.html', label: 'Dashboard' },
    { href: 'priority.html', label: 'Priority Queue' },
    { href: 'admin-reports.html', label: 'All Reports' },
    { href: 'map.html', label: 'City Map' },
    { href: 'analytics.html', label: 'Analytics' },
    { href: 'ai-insights.html', label: 'AI Insights' },
  ]
};

/* ---------- Navbar / Footer injection ---------- */
function renderNavbar(){
  const el = document.getElementById('navbar');
  if(!el) return;
  const mode = el.dataset.mode || 'citizen'; // citizen | admin | bare
  const current = el.dataset.current || '';
  const user = localStorage.getItem('currentUser');
  const admin = localStorage.getItem('adminSession');

  if(mode === 'bare'){
    el.innerHTML = `
      <div class="nav"><div class="nav-inner">
        <a href="index.html" class="brand"><span class="dot"></span> Civic AI</a>
        <a href="index.html" class="tag">← Back to site</a>
      </div></div>`;
    return;
  }

  const links = mode === 'admin' ? CivicAI.adminNav : CivicAI.citizenNav;
  const linkHtml = links.map(l => `<a href="${l.href}" class="${l.href===current?'active':''}">${l.label}</a>`).join('');

  let rightHtml = '';
  if(mode === 'admin'){
    rightHtml = `<span class="nav-user">Console · <b>${admin || 'Officer'}</b></span>
      <a href="admin-login.html" class="btn btn-ghost btn-sm" onclick="localStorage.removeItem('adminSession')">Logout</a>`;
  } else if(user){
    rightHtml = `<span class="nav-user">Welcome, <b>${user}</b> 👋</span>
      <a href="index.html" class="btn btn-ghost btn-sm" onclick="localStorage.removeItem('currentUser')">Logout</a>`;
  } else {
    rightHtml = `<a href="login.html" class="btn btn-primary btn-sm">Login</a>`;
  }

  el.innerHTML = `
    <div class="nav"><div class="nav-inner">
      <a href="${mode==='admin'?'admin-dashboard.html':'index.html'}" class="brand"><span class="dot"></span> Civic AI ${mode==='admin'?'<span class="admin-console-tag" style="padding:0;margin:0 0 0 8px;">/ Console</span>':''}</a>
      <div class="nav-links">${linkHtml}</div>
      <div class="nav-right">
        ${rightHtml}
        <button class="hamburger" id="hamburgerBtn" aria-label="Menu"><span></span><span></span><span></span></button>
      </div>
    </div></div>
    <div class="mobile-menu" id="mobileMenu">${linkHtml}</div>
  `;

  const burger = document.getElementById('hamburgerBtn');
  const menu = document.getElementById('mobileMenu');
  if(burger){
    burger.addEventListener('click', () => menu.classList.toggle('open'));
  }
}

/* ---------- Admin sidebar (Government Console layout) ---------- */
function renderAdminSidebar(){
  const el = document.getElementById('adminSidebar');
  if(!el) return;
  const current = el.dataset.current || '';
  const admin = localStorage.getItem('adminSession') || 'Officer';
  const iconFor = { 'admin-dashboard.html':'📊', 'priority.html':'🚨', 'admin-reports.html':'🗂️', 'map.html':'🗺️', 'analytics.html':'📈', 'ai-insights.html':'🤖' };

  const linkHtml = CivicAI.adminNav.map(l => `<a href="${l.href}" class="${l.href===current?'active':''}">${iconFor[l.href]||'•'} ${l.label}</a>`).join('');

  el.innerHTML = `
    <a href="admin-dashboard.html" class="brand"><span class="dot"></span> Civic AI</a>
    <div class="admin-console-tag">Government Console</div>
    ${linkHtml}
    <a href="admin-login.html" class="logout-link" onclick="localStorage.removeItem('adminSession')">🚪 Logout (${admin})</a>
  `;
}

function initAdminSidebarToggle(){
  const btn = document.getElementById('sidebarToggle');
  const sidebar = document.getElementById('adminSidebar');
  if(!btn || !sidebar) return;
  btn.addEventListener('click', () => sidebar.classList.toggle('open'));
}

function renderFooter(){
  const el = document.getElementById('footer');
  if(!el) return;
  el.innerHTML = `
    <div class="container">
      <div class="footer-grid">
        <div class="footer-brand">
          <h3>Civic AI</h3>
          <p style="max-width:260px;">Smarter Cities. Faster Action. Better Living.</p>
        </div>
        <div class="footer-links">
          <div class="footer-col">
            <h4>Citizen</h4>
            <a href="index.html">Home</a>
            <a href="report.html">Report Issue</a>
            <a href="reports.html">My Reports</a>
          </div>
          <div class="footer-col">
            <h4>Platform</h4>
            <a href="admin-login.html">Government Portal</a>
            <a href="about.html">About</a>
          </div>
        </div>
      </div>
      <div class="footer-bottom">© 2026 Civic AI — Hackathon demo build. Frontend simulation only, no data leaves this browser.</div>
    </div>
  `;
}

/* ---------- Toasts ---------- */
function ensureToastStack(){
  let stack = document.getElementById('toast-stack');
  if(!stack){
    stack = document.createElement('div');
    stack.id = 'toast-stack';
    document.body.appendChild(stack);
  }
  return stack;
}
function showToast(message, type = 'success'){
  const icons = { success: '✓', error: '✕', warn: '⚠' };
  const stack = ensureToastStack();
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.innerHTML = `<span class="icon">${icons[type] || 'ℹ'}</span><span>${message}</span>`;
  stack.appendChild(toast);
  setTimeout(() => {
    toast.classList.add('leaving');
    setTimeout(() => toast.remove(), 350);
  }, 3400);
}

/* ---------- Scroll reveal ---------- */
function initReveal(){
  const items = document.querySelectorAll('.reveal, .reveal-stagger');
  if(!items.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(entry.isIntersecting){
        entry.target.classList.add('in');
        obs.unobserve(entry.target);
      }
    });
  }, { threshold: 0.18 });
  items.forEach(i => obs.observe(i));
}

/* ---------- Count-up ---------- */
function initCounters(){
  const counters = document.querySelectorAll('[data-count]');
  if(!counters.length) return;
  const obs = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if(!entry.isIntersecting) return;
      const el = entry.target;
      const target = parseInt(el.dataset.count, 10);
      const duration = 1400;
      const start = performance.now();
      function tick(now){
        const p = Math.min((now - start) / duration, 1);
        const eased = 1 - Math.pow(1 - p, 3);
        el.textContent = Math.floor(eased * target).toLocaleString();
        if(p < 1) requestAnimationFrame(tick);
        else el.textContent = target.toLocaleString();
      }
      requestAnimationFrame(tick);
      obs.unobserve(el);
    });
  }, { threshold: 0.4 });
  counters.forEach(c => obs.observe(c));
}

/* ---------- Ambient background particles ---------- */
function initParticles(){
  const canvas = document.getElementById('bg-particles');
  if(!canvas) return;
  const ctx = canvas.getContext('2d');
  let w, h, particles = [];
  function resize(){
    w = canvas.width = window.innerWidth;
    h = canvas.height = window.innerHeight;
  }
  resize();
  window.addEventListener('resize', resize);
  const count = window.innerWidth < 700 ? 30 : 60;
  for(let i=0;i<count;i++){
    particles.push({
      x: Math.random()*w, y: Math.random()*h,
      r: Math.random()*1.6 + 0.4,
      vx: (Math.random()-0.5)*0.15,
      vy: (Math.random()-0.5)*0.15,
      a: Math.random()*0.5 + 0.15
    });
  }
  function draw(){
    ctx.clearRect(0,0,w,h);
    particles.forEach(p => {
      p.x += p.vx; p.y += p.vy;
      if(p.x < 0) p.x = w; if(p.x > w) p.x = 0;
      if(p.y < 0) p.y = h; if(p.y > h) p.y = 0;
      ctx.beginPath();
      ctx.arc(p.x, p.y, p.r, 0, Math.PI*2);
      ctx.fillStyle = `rgba(79,224,232,${p.a})`;
      ctx.fill();
    });
    requestAnimationFrame(draw);
  }
  draw();
}

/* ---------- Init ---------- */
document.addEventListener('DOMContentLoaded', () => {
  renderNavbar();
  renderAdminSidebar();
  initAdminSidebarToggle();
  renderFooter();
  initReveal();
  initCounters();
  initParticles();
  document.body.classList.add('page-fade');
});
