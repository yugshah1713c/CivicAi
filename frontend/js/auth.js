/* ============================================================
   CIVIC AI — auth.js (frontend-only demo authentication)
   ============================================================ */

function initCitizenLogin(){
  const form = document.getElementById('loginForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value.trim();
    const btn = document.getElementById('loginBtn');

    btn.innerHTML = `<span class="loader-ring"></span> Signing in...`;
    btn.disabled = true;

    setTimeout(() => {
      if(username === 'demo' && password === 'demo'){
        localStorage.setItem('currentUser', username.charAt(0).toUpperCase() + username.slice(1));
        showToast('Welcome back! Redirecting...', 'success');
        setTimeout(() => window.location.href = 'index.html', 700);
      } else if(username && password){
        // Any non-empty credentials also succeed, for demo convenience
        localStorage.setItem('currentUser', username.charAt(0).toUpperCase() + username.slice(1));
        showToast('Welcome to Civic AI!', 'success');
        setTimeout(() => window.location.href = 'index.html', 700);
      } else {
        showToast('Invalid login credentials', 'error');
        btn.innerHTML = 'Login';
        btn.disabled = false;
      }
    }, 900);
  });
}

function initAdminLogin(){
  const form = document.getElementById('adminLoginForm');
  if(!form) return;
  form.addEventListener('submit', (e) => {
    e.preventDefault();
    const id = document.getElementById('govId').value.trim();
    const password = document.getElementById('govPassword').value.trim();
    const btn = document.getElementById('adminLoginBtn');

    btn.innerHTML = `<span class="loader-ring"></span> Verifying...`;
    btn.disabled = true;

    setTimeout(() => {
      if(id && password){
        localStorage.setItem('adminSession', id);
        showToast('Access granted. Loading console...', 'success');
        setTimeout(() => window.location.href = 'admin-dashboard.html', 700);
      } else {
        showToast('Invalid login credentials', 'error');
        btn.innerHTML = 'Login';
        btn.disabled = false;
      }
    }, 900);
  });
}

/* Guard pages that require login (soft guard — demo only) */
function requireCitizen(){
  if(!localStorage.getItem('currentUser')){
    window.location.href = 'login.html';
  }
}
function requireAdmin(){
  if(!localStorage.getItem('adminSession')){
    window.location.href = 'admin-login.html';
  }
}

document.addEventListener('DOMContentLoaded', () => {
  initCitizenLogin();
  initAdminLogin();
});
