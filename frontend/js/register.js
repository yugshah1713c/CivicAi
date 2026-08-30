/* ============================================================
   CIVIC AI — register.js
   Frontend-only registration
   ============================================================ */

function initRegistration(){

  const form = document.getElementById('registerForm');

  if(!form) return;


  form.addEventListener('submit', (e) => {

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


    /* Basic validation */

    if(!name || !email || !password || !confirmPassword){

      showToast('Please fill in all fields', 'error');

      return;
    }


    /* Password confirmation */

    if(password !== confirmPassword){

      showToast('Passwords do not match', 'error');

      return;
    }


    /* Password length */

    if(password.length < 6){

      showToast(
        'Password must be at least 6 characters',
        'error'
      );

      return;
    }


    /* Loading state */

    btn.innerHTML =
      `<span class="loader-ring"></span> Creating account...`;

    btn.disabled = true;


    /*
      Demo registration.

      Currently stored in localStorage because
      this version is frontend-only.
    */

    setTimeout(() => {

      const user = {

        name: name,

        email: email,

        role: role

      };


      localStorage.setItem(
        'registeredUser',
        JSON.stringify(user)
      );


      localStorage.setItem(
        'currentUser',
        name
      );


      showToast(
        'Account created successfully!',
        'success'
      );


      setTimeout(() => {

        window.location.href = 'login.html';

      }, 900);


    }, 900);

  });

}


document.addEventListener(
  'DOMContentLoaded',
  () => {

    initRegistration();

  }
);