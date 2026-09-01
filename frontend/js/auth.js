/* ============================================================
   CIVIC AI — auth.js
   Real database authentication
   ============================================================ */


/* ============================================================
   CITIZEN LOGIN
   ============================================================ */

function initCitizenLogin() {

  const form = document.getElementById('loginForm');

  if (!form) return;


  form.addEventListener('submit', async (e) => {

    e.preventDefault();


    // Get email and password from the login form
    const email =
      document.getElementById('email').value.trim();

    const password =
      document.getElementById('password').value;


    const btn =
      document.getElementById('loginBtn');


    // Check empty fields
    if (!email || !password) {

      showToast(
        'Email and password are required',
        'error'
      );

      return;
    }


    // Show loading state
    btn.innerHTML =
      `<span class="loader-ring"></span> Signing in...`;

    btn.disabled = true;


    try {

      // Send login request to Flask backend
      const response = await fetch(
        'https://civic-ai-backend-7wv2.onrender.com/api/login',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            email: email,
            password: password
          })
        }
      );


      // Convert response to JSON
      const result = await response.json();

      console.log('LOGIN RESULT:', result);


      // Login failed
      if (!result.success) {

        showToast(
          result.error || 'Invalid email or password',
          'error'
        );

        btn.innerHTML = 'Login';
        btn.disabled = false;

        return;
      }


      // Login successful
      const user = result.user;


      // Store logged-in user information
      localStorage.setItem(
        'currentUser',
        user.name
      );

      localStorage.setItem(
        'currentUserEmail',
        user.email
      );

      localStorage.setItem(
        'currentUserRole',
        user.role
      );


      showToast(
        'Welcome back! Redirecting...',
        'success'
      );


      // Redirect to main website
      setTimeout(() => {

        window.location.href = 'index.html';

      }, 700);


    } catch (error) {

      console.error(
        'LOGIN ERROR:',
        error
      );


      showToast(
        'Unable to connect to server',
        'error'
      );


      btn.innerHTML = 'Login';
      btn.disabled = false;
    }

  });
}



/* ============================================================
   GOVERNMENT LOGIN
   ============================================================ */

function initAdminLogin() {

  const form =
    document.getElementById('adminLoginForm');

  if (!form) return;


  form.addEventListener('submit', (e) => {

    e.preventDefault();


    const id =
      document.getElementById('govId').value.trim();

    const password =
      document.getElementById('govPassword').value.trim();


    const btn =
      document.getElementById('adminLoginBtn');


    if (!id || !password) {

      showToast(
        'Government ID and password are required',
        'error'
      );

      return;
    }


    btn.innerHTML =
      `<span class="loader-ring"></span> Verifying...`;

    btn.disabled = true;


    /*
      Government authentication is still using
      the existing demo/admin system.

      We will connect this to the database later.
    */

    setTimeout(() => {

      localStorage.setItem(
        'adminSession',
        id
      );


      showToast(
        'Access granted. Loading console...',
        'success'
      );


      setTimeout(() => {

        window.location.href =
          'admin-dashboard.html';

      }, 700);

    }, 900);

  });
}



/* ============================================================
   CITIZEN PAGE GUARD
   ============================================================ */

function requireCitizen() {

  if (
    !localStorage.getItem('currentUser')
  ) {

    window.location.href =
      'login.html';

  }

}



/* ============================================================
   GOVERNMENT PAGE GUARD
   ============================================================ */

function requireAdmin() {

  if (
    !localStorage.getItem('adminSession')
  ) {

    window.location.href =
      'admin-login.html';

  }

}



/* ============================================================
   INITIALIZE AUTHENTICATION
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initCitizenLogin();
    initAdminLogin();

  }
);
