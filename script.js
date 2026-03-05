
// =============================
// LOGIN FLOW
// =============================
// FLOW SUMMARY
// 1) This script runs on multiple pages, so we first check if #login-form exists.
// 2) If it exists, we intercept submit, validate inputs, and delegate auth to window.Auth.
// 3) On successful login, routing moves user to the main student dashboard.
// 4) If the form does not exist (non-login pages), this block safely does nothing.
// TYPE GUIDE (for this file)
// - USER-DEFINED FUNCTION: functions declared in this file (enforceRouteAccess, renderPayments, etc.).
// - PREDEFINED API: browser/JS built-ins (document, window, localStorage, Date, setTimeout, Array.map/filter).
const loginForm = document.getElementById("login-form");
if (loginForm) {
  // Submit flow starts only when the user clicks login/presses Enter in the form.
  loginForm.addEventListener("submit", (e) => {
    // Keep control in JS first so we can validate before any navigation happens.
    e.preventDefault();
    // Normalize values by trimming spaces to avoid false-empty and typo-like issues.
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value.trim();
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

    // Auth handshake:
    // - window.Auth.login(...) checks account + password
    // - result.ok tells us if login should continue
    // - result.message gives user-friendly failure reason
    if (window.Auth) {
      const result = window.Auth.login(email, password);
      if (!result.ok) {
        alert(result.message);
        return;
      }
    }

    // Success path: route to personal/student dashboard.
    // (If needed, route protection below will still enforce proper page access.)
    window.location.href = "index.html";
  });
}

// =============================
// ROUTE PROTECTION
// =============================
// FLOW SUMMARY
// This function is a page guard that runs on every page load:
// A) Detect current page
// B) Read current user session
// C) Redirect if page is not allowed for that session/role
// D) Sync persisted preferred view (student vs organization)
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Enforce authentication/authorization rules per page at load time.
// PREDEFINED APIS USED: window.location, String.toLowerCase.
function enforceRouteAccess() {
  if (!window.Auth) return;

  // Get current file name from URL (example: index.html)
  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = page === 'login-page.html';
  const user = window.Auth.getUser();

  // Guard 1: login page is only for guests.
  // If a user is already authenticated, redirect them away from login.
  if (isLoginPage) {
    if (!user) return;

    const preferredView = window.Auth.getView();
    if (preferredView === 'organization' && window.Auth.canManageOrg()) {
      window.location.href = 'FinanceDS.html';
      return;
    }

    window.location.href = 'index.html';
    return;
  }

  // Guard 2: every protected page requires an active session.
  if (!user) {
    window.location.href = 'login-page.html';
    return;
  }

  // Guard 3: finance/organization dashboard requires org-management permission.
  if (page === 'financeds.html' && !window.Auth.canManageOrg()) {
    window.location.href = 'index.html';
    return;
  }

  // State sync: keep stored view aligned with what page user is currently on.
  // This makes future redirects open the same context the user last used.
  if (page === 'financeds.html') {
    window.Auth.setView('organization');
  } else if (page === 'index.html') {
    window.Auth.setView('student');
  }
}

// Route checks run immediately so unauthorized views are blocked early.
enforceRouteAccess();

// =============================
// SIDEBAR INTERACTIONS
// =============================
// FLOW SUMMARY
// - Arrow click toggles nested menu visibility.
// - Burger icon toggles sidebar width (expanded/collapsed).
// - After toggle, content container dimensions are recalculated.
let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
  arrow[i].addEventListener("click", (e)=>{
 let arrowParent = e.target.parentElement.parentElement; // selecting main parent of arrow
 arrowParent.classList.toggle("showMenu");
  });
}

// Sidebar burger button: collapse/expand sidebar.
let sidebarBtn = document.querySelector(".bx-menu");
if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
  // Prevent duplicate event listener registration
  sidebarBtn.dataset.sidebarInitialized = 'true';
  sidebarBtn.addEventListener("click", ()=>{
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    sidebar.classList.toggle("close");
    adjustHomeSectionMargin();
  });
}

// Layout sync helper used after sidebar state changes.
// Keeps main content readable by matching margin/width to sidebar mode.
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Resize/reposition main content when sidebar state changes.
// PREDEFINED APIS USED: document.querySelector, classList.contains.
function adjustHomeSectionMargin() {
  const sidebar = document.querySelector(".sidebar");
  const homeSection = document.querySelector(".home-section");
  if (!sidebar || !homeSection) return;
  
  if (sidebar.classList.contains("close")) {
    homeSection.style.marginLeft = "88px";
    homeSection.style.width = "calc(100% - 88px)";
  } else {
    homeSection.style.marginLeft = "270px";
    homeSection.style.width = "calc(100% - 270px)";
  }
}

// =============================
// PROFILE UI HELPERS
// =============================
// FLOW SUMMARY
// 1) Read logged-in user details from Auth.
// 2) Paint identity fields in sidebar/profile slots.
// 3) Enable view-switch dropdown (if role allows).
// 4) Bind logout action to clear session and return to login.
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Fill profile UI elements with current user details.
// PREDEFINED APIS USED: document.querySelectorAll, NodeList.forEach.
function syncProfileDetails() {
  if (!window.Auth) return;
  const user = window.Auth.getUser();
  if (!user) return;

  const profileNames = document.querySelectorAll('.profile_name');
  const jobs = document.querySelectorAll('.job');

  profileNames.forEach((el) => {
    el.textContent = user.name;
  });

  jobs.forEach((el) => {
    el.textContent = user.studentId || user.email;
  });
}

// View switch flow:
// - Only visible for users with org privilege.
// - Clicking container opens a temporary dropdown.
// - Selecting target view persists preference and redirects immediately.
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Handle profile dropdown for switching between student and organization views.
// PREDEFINED APIS USED: document.querySelector, createElement, addEventListener, setTimeout.
function initializeViewToggle() {
  const switchContainer = document.querySelector('.view-switch-container');
  if (!switchContainer) return;

  // Hide toggle for users that do not have organization access.
  if (!window.Auth || !window.Auth.canManageOrg()) {
    switchContainer.style.display = 'none';
    return;
  }

  const switchIcon = switchContainer.querySelector('.view-switch-icon');
  if (!switchIcon) return;

  // Local cleanup utility so all close paths behave consistently.
  // TYPE: USER-DEFINED LOCAL FUNCTION
  // PURPOSE: Remove dropdown and reset open state classes.
  const closeDropdown = () => {
    const dropdown = switchContainer.querySelector('.view-switch-dropdown');
    if (dropdown) dropdown.remove();
    switchContainer.classList.remove('is-open');
  };

  // Close dropdown when user clicks outside of it.
  // TYPE: USER-DEFINED LOCAL FUNCTION
  // PURPOSE: Detect outside clicks and close the dropdown.
  const handleOutsideClick = (event) => {
    if (!switchContainer.contains(event.target)) {
      closeDropdown();
      document.removeEventListener('click', handleOutsideClick);
    }
  };

  // Main toggle handler: open if closed, close if open.
  switchContainer.addEventListener('click', (event) => {
    event.stopPropagation();

    const existing = switchContainer.querySelector('.view-switch-dropdown');
    if (existing) {
      closeDropdown();
      document.removeEventListener('click', handleOutsideClick);
      return;
    }

    const currentView = window.Auth.getView();
    switchContainer.classList.add('is-open');
    const dropdown = document.createElement('div');
    dropdown.className = 'view-switch-dropdown';
    dropdown.innerHTML = `
      <div class="switch-menu-label">Switch view</div>
      <button type="button" class="switch-btn ${currentView === 'student' ? 'active' : ''}" data-view="student">
        <i class='bx bx-check switch-check'></i>
        <span>Personal</span>
      </button>
      <button type="button" class="switch-btn ${currentView === 'organization' ? 'active' : ''}" data-view="organization">
        <i class='bx bx-check switch-check'></i>
        <span>Organization</span>
      </button>
    `;

    switchContainer.appendChild(dropdown);

    dropdown.addEventListener('click', (e) => {
      const button = e.target.closest('.switch-btn');
      if (!button) return;

      const nextView = button.dataset.view;
      // If user selected current view, just close menu.
      if (nextView === currentView) {
        closeDropdown();
        document.removeEventListener('click', handleOutsideClick);
        return;
      }

      // Commit selected view to Auth storage, then route to matching page.
      const allowed = window.Auth.setView(nextView);
      if (!allowed) return;

      window.location.href = nextView === 'organization' ? 'FinanceDS.html' : 'index.html';
    });

    setTimeout(() => {
      document.addEventListener('click', handleOutsideClick);
    }, 0);
  });
}

// Logout flow:
// - Clear session via Auth helper
// - Always redirect user to login screen
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Bind sign-out action to session cleanup and login redirect.
// PREDEFINED APIS USED: document.querySelector, addEventListener, window.location.href.
function initializeLogout() {
  const logoutSection = document.querySelector('.profile-details .logout-section');
  if (!logoutSection) return;

  logoutSection.addEventListener('click', () => {
    if (window.Auth) {
      window.Auth.logout();
    }
    window.location.href = 'login-page.html';
  });
}

// STARTUP FLOW (post-DOM render)
// We delay a little so elements are mounted and measurable before UI setup.
document.addEventListener('DOMContentLoaded', function() {
  // Step 1: sync layout with sidebar state.
  setTimeout(adjustHomeSectionMargin, 100);
  setTimeout(() => {
    // Step 2: initialize auth-dependent profile interactions.
    syncProfileDetails();
    initializeViewToggle();
    initializeLogout();
  }, 120);
});

// =============================
// PAYMENTS HISTORY (DEMO)
// =============================
// FLOW SUMMARY
// - samplePayments is source-of-truth demo data.
// - renderPayments(...) paints list from whichever array is passed.
// - filterPayments(...) computes filtered array then calls render.
// - dropdown change event triggers filter + re-render.
const paymentsFilter = document.getElementById('payments-filter');
const paymentsListEl = document.querySelector('.payments-history .payments-list');

// sample data (date in YYYY-MM-DD)
const samplePayments = [
  { desc: 'Gender Club', amount: '₱1,000.00', date: '2026-02-25' },
  { desc: 'CCSC fee', amount: '₱150.00', date: '2026-02-20' },
  { desc: 'Insurance', amount: '₱40.00', date: '2026-01-10' },
  { desc: 'Miscellaneous', amount: '₱60.00', date: '2025-12-15' },
  { desc: 'Gender Club', amount: '₱1,000.00', date: '2026-02-25' },
  { desc: 'CCSC fee', amount: '₱150.00', date: '2026-02-20' },
  { desc: 'Insurance', amount: '₱40.00', date: '2026-01-10' },
  { desc: 'Miscellaneous', amount: '₱60.00', date: '2025-12-15' }
];

// Pure rendering step: takes a list and turns it into payment item markup.
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Render payment records into the payments list container.
// PREDEFINED APIS USED: Array.map, Element.innerHTML.
function renderPayments(list){
  if (!paymentsListEl) return;
  paymentsListEl.innerHTML = list.map(p => `
    <div class="payment-item" data-date="${p.date}">
      <div class="payment-row">
        <span class="pay-desc">${p.desc}</span>
        <span class="pay-amount">${p.amount}</span>
      </div>
      <div class="payment-meta">${p.date}</div>
    </div>
  `).join('');
}

// Decision step: derive which records should be shown based on selected range.
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Select which payments to show based on filter option.
// PREDEFINED APIS USED: Date, Array.filter.
function filterPayments(value){
  if (value === 'all') {
    renderPayments(samplePayments);
    return;
  }

  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  const filtered = samplePayments.filter(p => {
    const d = new Date(p.date + 'T00:00:00');
    // recent = within last 30 days, old = older than 30 days
    if (value === 'recent') return d >= recentThreshold;
    if (value === 'old') return d < recentThreshold;
    return true;
  });

  renderPayments(filtered);
}

// Initial paint so list is visible before user interaction.
renderPayments(samplePayments);
if (paymentsFilter) {
  // Recalculate and repaint every time the selected filter changes.
  paymentsFilter.addEventListener('change', (e) => {
    filterPayments(e.target.value);
  });
  // Ensure startup view reflects preselected option in the dropdown.
  filterPayments(paymentsFilter.value || 'recent');
}

// Section navigation flow:
// 1) remove active state from all sections
// 2) activate exactly one section by id
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Switch visible content section by id.
// PREDEFINED APIS USED: document.querySelectorAll, classList, document.getElementById.
function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(function(sec) {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

// School year badge flow:
// - Get current date
// - Derive semester window using month
// - Build AY range and inject into badge element
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Compute and display current school year and semester badge text.
// PREDEFINED APIS USED: Date, document.querySelector.
function setSchoolYear() {
    const today = new Date();
    const year = today.getFullYear();
    const month = today.getMonth() + 1;
  const badge = document.querySelector('.ay-badge');
  if (!badge) return;

    let sem = month >= 6 && month <= 10 ? "1st Semester" : "2nd Semester";
    let startYear = month >= 6 ? year : year - 1;
    let endYear = startYear + 1;

  badge.textContent = `S.Y. ${startYear}-${endYear} | ${sem}`;
}

// List of available sections per course-year combination.
const sections = {
    "BSCS-1": ["BSCS 1A", "BSCS 1B"],
    "BSCS-2": ["BSCS 2A", "BSCS 2B"],
    "BSCS-3": ["BSCS 3A", "BSCS 3B"],
    "BSCS-4": ["BSCS 4A", "BSCS 4B"],
    "BSIT-1": ["BSIT 1A", "BSIT 1B"],
    "BSIT-2": ["BSIT 2A", "BSIT 2B"],
    "BSIT-3": ["BSIT 3A", "BSIT 3B"],
    "BSIT-4": ["BSIT 4A"],
    "ACT-AD-1": ["ACT-AD 1A", "ACT-AD 1B"],
    "ACT-AD-2": ["ACT-AD 2A", "ACT-AD 2B"],
    "ACT-NET-1": ["ACT-NET 1A", "ACT-NET 1B"],
    "ACT-NET-2": ["ACT-NET 2A", "ACT-NET 2B"],
};

  // Course/year -> section options flow:
  // - reset dropdown
  // - reject unavailable ACT years (3/4)
  // - map valid key to section options and append each option node
  // TYPE: USER-DEFINED FUNCTION
  // PURPOSE: Populate section dropdown based on selected course and year level.
  // PREDEFINED APIS USED: document.getElementById, document.createElement, Array.forEach.
function updateSections() {
    const year = document.getElementById('yearLevel').value;
    const course = document.getElementById('course').value;
    const sectionSelect = document.getElementById('section');

    sectionSelect.innerHTML = '<option value="">Section</option>';

  // In this setup, ACT-AD and ACT-NET only have year levels 1 and 2.
    if ((course === "ACT-AD" || course === "ACT-NET") && (year === "3" || year === "4")) {
        sectionSelect.innerHTML = '<option value="">Not available</option>';
        return;
    }

    const key = course + "-" + year;
    if (sections[key]) {
        sections[key].forEach(function(s) {
            const opt = document.createElement('option');
            opt.value = s;
            opt.textContent = s;
            sectionSelect.appendChild(opt);
        });
    }
}

  // Startup call so the AY badge is correct as soon as page loads.
setSchoolYear();

