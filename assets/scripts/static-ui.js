'use strict';

document.addEventListener('DOMContentLoaded', () => {
  const menuBtn = document.querySelector('.bx-menu');
  const sidebar = document.querySelector('.sidebar');
  const homeSection = document.querySelector('.home-section');

  function adjustLayout() {
    if (!sidebar || !homeSection) return;

    if (sidebar.classList.contains('close')) {
      homeSection.style.marginLeft = '78px';
      homeSection.style.width = 'calc(100% - 78px)';
    } else {
      homeSection.style.marginLeft = '260px';
      homeSection.style.width = 'calc(100% - 260px)';
    }
  }

  if (menuBtn && sidebar) {
    menuBtn.addEventListener('click', () => {
      sidebar.classList.toggle('close');
      adjustLayout();
    });
  }

  adjustLayout();

  const yearSem = 'AY 2025-2026 • 2nd Semester';
  document.querySelectorAll('#orgYearSem').forEach((el) => {
    el.textContent = yearSem;
  });

  const loginHref = window.location.pathname.includes('/pages/')
    ? '../../login-page.html'
    : 'login-page.html';

  document.querySelectorAll('.logout-section').forEach((el) => {
    if (el.tagName === 'A') {
      el.setAttribute('href', loginHref);
    } else {
      el.addEventListener('click', () => {
        window.location.href = loginHref;
      });
    }
  });
});
