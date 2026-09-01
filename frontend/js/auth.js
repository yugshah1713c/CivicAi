/* ============================================================
   CIVIC AI — auth.js (frontend-only demo authentication)
   ============================================================ */

function initCitizenLogin(){
  const form = document.getElementById('loginForm');
  if(!form) return;

  form.addEventListener('submit', async (e) => {
    e.preventDefault();

    const username = document.getElementById('username').value.trim();
    const password = document.getElementById('password').value;
    const btn = document.getElementById('loginBtn');

    if(!username || !password){
      showToast('Email and password are required', 'error');
      return;
    }

    btn.innerHTML = `<span class="loader-ring"></span> Signing in...`;
    btn.disabled = true;

    try {
      const response = await fetch('http://127.0.0.1:5000/api/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          email: username,
          password: password
        })
      });

      const result = await response.json();

      if(result.success){

        localStorage.setItem(
          'currentUser',
          result.user.name
        );

        localStorage.setItem(
          'currentUserEmail',
          result.user.email
        );

        localStorage.setItem(
          'currentUserRole',
          result.user.role
        );

        showToast('Welcome back! Redirecting...', 'success');

        setTimeout(() => {
          window.location.href = 'index.html';
        }, 700);

      } else {

        showToast(
          result.error || 'Invalid login credentials',
          'error'
        );

        btn.innerHTML = 'Login';
        btn.disabled = false;
      }

    } catch(error) {

      console.error('LOGIN ERROR:', error);

      showToast(
        'Unable to connect to server',
        'error'
      );

      btn.innerHTML = 'Login';
      btn.disabled = false;
    }
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
