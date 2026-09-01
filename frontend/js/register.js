/* ============================================================
   CIVIC AI — register.js
   Real backend registration
   ============================================================ */

function initRegistration() {

  const form = document.getElementById('registerForm');

  if (!form) return;

  form.addEventListener('submit', async (e) => {

    e.preventDefault();

    const name =
      document.getElementById('name').value.trim();

    const email =
      document.getElementById('email').value.trim();

    const password =
      document.getElementById('password').value;

    const confirmPassword =
      document.getElementById('confirmPassword').value;

    const role =
      document.getElementById('role').value;

    const btn =
      document.getElementById('registerBtn');


    /* ========================================================
       FRONTEND VALIDATION
       ======================================================== */

    if (!name || !email || !password || !confirmPassword) {

      showToast(
        'Please fill in all fields',
        'error'
      );

      return;
    }


    if (password !== confirmPassword) {

      showToast(
        'Passwords do not match',
        'error'
      );

      return;
    }


    if (password.length < 6) {

      showToast(
        'Password must be at least 6 characters',
        'error'
      );

      return;
    }


    /* ========================================================
       DISABLE BUTTON
       ======================================================== */

    btn.innerHTML =
      '<span class="loader-ring"></span> Creating Account...';

    btn.disabled = true;


    /* ========================================================
       SEND TO BACKEND
       ======================================================== */

    try {

      const response = await fetch(
        'http://127.0.0.1:5000/api/register',
        {
          method: 'POST',

          headers: {
            'Content-Type': 'application/json'
          },

          body: JSON.stringify({
            name: name,
            email: email,
            password: password,
            role: role
          })
        }
      );


      const result =
        await response.json();


      /* ======================================================
         SUCCESS
         ====================================================== */

      if (result.success) {

        showToast(
          'Account created successfully!',
          'success'
        );

        setTimeout(() => {

          window.location.href =
            'login.html';

        }, 900);

      }


      /* ======================================================
         ERROR
         ====================================================== */

      else {

        showToast(
          result.error || 'Registration failed',
          'error'
        );

        btn.innerHTML =
          'Create Account';

        btn.disabled = false;

      }

    }


    /* ========================================================
       SERVER CONNECTION ERROR
       ======================================================== */

    catch (error) {

      console.error(
        'REGISTRATION ERROR:',
        error
      );

      showToast(
        'Unable to connect to server',
        'error'
      );

      btn.innerHTML =
        'Create Account';

      btn.disabled = false;

    }

  });

}


/* ============================================================
   INITIALIZE
   ============================================================ */

document.addEventListener(
  'DOMContentLoaded',
  () => {

    initRegistration();

  }
);

