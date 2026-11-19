(() => {
  'use strict';
  for (const button of document.querySelectorAll('[data-password-toggle]')) {
    const input = document.getElementById(button.dataset.passwordToggle);
    function conceal() {
      input.type = 'password';
      button.textContent = 'Show';
      button.setAttribute('aria-pressed', 'false');
      button.setAttribute('aria-label', 'Show password');
    }
    button.addEventListener('click', () => {
      if (input.form.getAttribute('aria-busy') === 'true') return;
      const show = input.type === 'password';
      input.type = show ? 'text' : 'password';
      button.textContent = show ? 'Hide' : 'Show';
      button.setAttribute('aria-pressed', String(show));
      button.setAttribute('aria-label', show ? 'Hide password' : 'Show password');
    });
    input.form.addEventListener('submit', conceal);
    input.form.addEventListener('reset', conceal);
    window.addEventListener('pagehide', conceal);
  }
})();
