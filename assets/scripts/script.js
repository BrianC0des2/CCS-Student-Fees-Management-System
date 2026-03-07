
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
function appPath(targetPath) {
  const isInsidePagesDir = window.location.pathname.includes('/pages/');
  if (!isInsidePagesDir) return targetPath;
  return `../../${targetPath}`;
}

function navigateTo(targetPath) {
  const destination = appPath(targetPath);
  const now = Date.now();
  let state = { time: 0, count: 0, last: '' };

  try {
    const stored = sessionStorage.getItem('ccs.redirect.state');
    if (stored) {
      const parsed = JSON.parse(stored);
      if (parsed && typeof parsed === 'object') {
        state = {
          time: Number(parsed.time) || 0,
          count: Number(parsed.count) || 0,
          last: String(parsed.last || '')
        };
      }
    }
  } catch (error) {
  }

  if (now - state.time < 1500 && state.last === destination) {
    state.count += 1;
  } else {
    state.count = 1;
  }

  state.time = now;
  state.last = destination;

  try {
    sessionStorage.setItem('ccs.redirect.state', JSON.stringify(state));
  } catch (error) {
  }

  if (state.count > 6) {
    alert('Navigation loop detected. Please clear site data and reload.');
    return;
  }

  window.location.replace(destination);
}

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
    if (!window.Auth) {
      alert("Authentication module failed to load. Please refresh and try again.");
      return;
    }

    if (window.Auth) {
      const result = window.Auth.login(email, password);
      if (!result.ok) {
        alert(result.message);
        return;
      }
    }

    // Success path: route to personal/student dashboard.
    // (If needed, route protection below will still enforce proper page access.)
    navigateTo('pages/student/student-dashboard.html');
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

  // Get current file name from URL (example: student-dashboard.html)
  const page = (window.location.pathname.split('/').pop() || 'student-dashboard.html').toLowerCase();
  const isLoginPage = page === 'login-page.html';
  const user = window.Auth.getUser();

  // Guard 1: login page is only for guests.
  // If a user is already authenticated, redirect them away from login.
  if (isLoginPage) {
    if (!user) return;

    const preferredView = window.Auth.getView();
    if (preferredView === 'organization' && window.Auth.canManageOrg()) {
      navigateTo('pages/organization/organization-dashboard.html');
      return;
    }

    navigateTo('pages/student/student-dashboard.html');
    return;
  }

  // Guard 2: every protected page requires an active session.
  if (!user) {
    navigateTo('login-page.html');
    return;
  }

  // Guard 3: finance/organization dashboard requires org-management permission.
  if (page === 'organization-dashboard.html' && !window.Auth.canManageOrg()) {
    navigateTo('pages/student/student-dashboard.html');
    return;
  }

  // State sync: keep stored view aligned with what page user is currently on.
  // This makes future redirects open the same context the user last used.
  if (page === 'organization-dashboard.html') {
    window.Auth.setView('organization');
  } else if (page === 'student-dashboard.html') {
    window.Auth.setView('student');
  }

  try {
    sessionStorage.removeItem('ccs.redirect.state');
  } catch (error) {
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
function adjustHomeSectionMargin() {
  const sidebar = document.querySelector(".sidebar");
  const homeSection = document.querySelector(".home-section");
  if (!sidebar || !homeSection) return;
  
  if (sidebar.classList.contains("close")) {
    homeSection.style.marginLeft = "78px";
    homeSection.style.width = "calc(100% - 78px)";
  } else {
    homeSection.style.marginLeft = "260px";
    homeSection.style.width = "calc(100% - 260px)";
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

      navigateTo(
        nextView === 'organization'
          ? 'pages/organization/organization-dashboard.html'
          : 'pages/student/student-dashboard.html'
      );
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
    navigateTo('login-page.html');
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
    // Step 3: initialize page tools
    initializeFilters();
    initializeSearch();
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
  // Payments for student1@demo.com (TY202500100)
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'CCSC Fee - BSCS 1A', amount: '₱1,000.00', date: '2026-02-14' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Insurance - BSCS 1A', amount: '₱150.00', date: '2026-02-10' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Miscellaneous - BSCS 1A', amount: '₱850.00', date: '2026-01-20' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Gender Club - BSCS 1A', amount: '₱1,000.00', date: '2026-01-10' },
  // Payments for studentorg@demo.com (TY202500101)
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'CCSC Fee - BSCS 1B', amount: '₱1,000.00', date: '2026-02-13' },
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'Insurance - BSCS 1B', amount: '₱150.00', date: '2026-02-08' },
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'Partial Payment - BSCS 1B', amount: '₱500.00', date: '2026-01-15' },
  // Recent payments from various students (for org/admin view)
  { studentNo: "TY202500102", studentName: "Maria Santos", desc: 'CCSC Fee - BSCS 1A', amount: '₱1,000.00', date: '2026-02-10' },
  { studentNo: "TY202500104", studentName: "Ana Garcia", desc: 'Insurance - BSCS 1B', amount: '₱150.00', date: '2026-02-05' },
  { studentNo: "TY202500106", studentName: "Sofia Martinez", desc: 'Miscellaneous - BSIT 1A', amount: '₱850.00', date: '2026-02-01' },
  { studentNo: "TY202500108", studentName: "Isabella Flores", desc: 'Gender Club - BSIT 1B', amount: '₱1,000.00', date: '2026-01-28' },
  { studentNo: "TY202500110", studentName: "Valentina Castro", desc: 'CCSC Fee - ACT-AD 1A', amount: '₱1,000.00', date: '2026-01-22' },
  { studentNo: "TY202400202", studentName: "Camila Vargas", desc: 'Insurance - BSCS 2A', amount: '₱150.00', date: '2026-02-08' },
  { studentNo: "TY202400204", studentName: "Gabriela Ruiz", desc: 'Miscellaneous - BSCS 2B', amount: '₱850.00', date: '2026-02-03' },
  { studentNo: "TY202400206", studentName: "Lucia Herrera", desc: 'Gender Club - BSIT 2A', amount: '₱1,000.00', date: '2026-01-31' },
  { studentNo: "TY202400208", studentName: "Elena Jimenez", desc: 'CCSC Fee - BSIT 2B', amount: '₱1,000.00', date: '2026-01-26' },
  { studentNo: "TY202400210", studentName: "Marina Ortega", desc: 'Insurance - ACT-AD 2A', amount: '₱150.00', date: '2026-02-06' },
  { studentNo: "TY202300302", studentName: "Rosa Medina", desc: 'Miscellaneous - BSCS 3A', amount: '₱850.00', date: '2026-02-09' },
  { studentNo: "TY202300304", studentName: "Carmen Delgado", desc: 'Gender Club - BSCS 3B', amount: '₱1,000.00', date: '2026-02-07' },
  { studentNo: "TY202300306", studentName: "Patricia Soto", desc: 'CCSC Fee - BSIT 3A', amount: '₱1,000.00', date: '2026-01-23' },
  { studentNo: "TY202300308", studentName: "Adriana Vega", desc: 'Insurance - BSIT 3B', amount: '₱150.00', date: '2026-01-19' },
  { studentNo: "TY202300310", studentName: "Monica Paredes", desc: 'Miscellaneous - ACT-NET 1A', amount: '₱850.00', date: '2026-02-12' },
  { studentNo: "TY202200402", studentName: "Silvia Aguilar", desc: 'Gender Club - BSCS 4A', amount: '₱1,000.00', date: '2026-02-13' },
  { studentNo: "TY202200404", studentName: "Teresa Blanco", desc: 'CCSC Fee - BSCS 4B', amount: '₱1,000.00', date: '2026-02-14' },
  { studentNo: "TY202200406", studentName: "Beatriz Leon", desc: 'Insurance - BSIT 4A', amount: '₱150.00', date: '2026-01-30' },
  { studentNo: "TY202200408", studentName: "Alicia Rubio", desc: 'Miscellaneous - ACT-AD 1B', amount: '₱850.00', date: '2026-01-25' },
  { studentNo: "TY202200410", studentName: "Natalia Gil", desc: 'Gender Club - ACT-NET 1B', amount: '₱1,000.00', date: '2026-02-16' },
  // Older payments
  { studentNo: "TY202500111", studentName: "Juan Dela Cruz", desc: 'Partial Payment - BSCS 1A', amount: '₱500.00', date: '2026-01-15' },
  { studentNo: "TY202500103", studentName: "Pedro Reyes", desc: 'Partial Payment - BSCS 1B', amount: '₱700.00', date: '2026-01-20' },
  { studentNo: "TY202500105", studentName: "Carlos Lopez", desc: 'Partial Payment - BSIT 1A', amount: '₱300.00', date: '2026-01-25' },
  { studentNo: "TY202500107", studentName: "Miguel Torres", desc: 'Partial Payment - BSIT 1B', amount: '₱800.00', date: '2026-01-30' },
  { studentNo: "TY202500109", studentName: "Diego Ramirez", desc: 'Partial Payment - ACT-AD 1A', amount: '₱500.00', date: '2026-02-02' },
  { studentNo: "TY202400201", studentName: "Luis Mendoza", desc: 'Partial Payment - BSCS 2A', amount: '₱600.00', date: '2026-01-18' },
  { studentNo: "TY202400203", studentName: "Andres Silva", desc: 'Partial Payment - BSCS 2B', amount: '₱400.00', date: '2026-01-12' },
  { studentNo: "TY202400205", studentName: "Fernando Morales", desc: 'Partial Payment - BSIT 2A', amount: '₱400.00', date: '2026-01-27' },
  { studentNo: "TY202400207", studentName: "Roberto Diaz", desc: 'Partial Payment - BSIT 2B', amount: '₱700.00', date: '2026-02-04' },
  { studentNo: "TY202400209", studentName: "Pablo Alvarez", desc: 'Partial Payment - ACT-AD 2A', amount: '₱600.00', date: '2026-01-29' },
  { studentNo: "TY202300301", studentName: "Antonio Guzman", desc: 'Partial Payment - BSCS 3A', amount: '₱300.00', date: '2026-01-21' },
  { studentNo: "TY202300303", studentName: "Manuel Chavez", desc: 'Partial Payment - BSCS 3B', amount: '₱500.00', date: '2026-01-16' },
  { studentNo: "TY202300305", studentName: "Javier Romero", desc: 'Partial Payment - BSIT 3A', amount: '₱250.00', date: '2026-01-24' },
  { studentNo: "TY202300307", studentName: "Francisco Luna", desc: 'Partial Payment - BSIT 3B', amount: '₱850.00', date: '2026-02-11' },
  { studentNo: "TY202300309", studentName: "Ricardo Cortes", desc: 'Partial Payment - ACT-NET 1A', amount: '₱450.00', date: '2026-01-14' },
  { studentNo: "TY202200401", studentName: "Eduardo Rios", desc: 'Partial Payment - BSCS 4A', amount: '₱250.00', date: '2026-01-17' },
  { studentNo: "TY202200403", studentName: "Hector Navarro", desc: 'Partial Payment - BSCS 4B', amount: '₱650.00', date: '2026-01-13' },
  { studentNo: "TY202200405", studentName: "Raul Moreno", desc: 'Partial Payment - BSIT 4A', amount: '₱350.00', date: '2026-01-11' },
  { studentNo: "TY202200407", studentName: "Oscar Peña", desc: 'Partial Payment - ACT-AD 1B', amount: '₱750.00', date: '2026-02-15' },
  { studentNo: "TY202200409", studentName: "Victor Suarez", desc: 'Partial Payment - ACT-NET 1B', amount: '₱550.00', date: '2026-01-28' }
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
    renderPayments(myPayments);
    return;
  }

  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  const filtered = myPayments.filter(p => {
    const d = new Date(p.date + 'T00:00:00');
    // recent = within last 30 days, old = older than 30 days
    if (value === 'recent') return d >= recentThreshold;
    if (value === 'old') return d < recentThreshold;
    return true;
  });

  renderPayments(filtered);
}

// Scope payments to the currently logged-in student only.
// Each entry in samplePayments has a studentNo that maps to a user's studentId.
const currentUser = window.Auth ? window.Auth.getUser() : null;
const myPayments = currentUser
  ? samplePayments.filter(p => p.studentNo === currentUser.studentId)
  : samplePayments;

// Initial paint so list is visible before user interaction.
renderPayments(myPayments);
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
    const orgYearSem = document.getElementById('orgYearSem');

    let sem = month >= 6 && month <= 10 ? "1st Semester" : "2nd Semester";
    let startYear = month >= 6 ? year : year - 1;
    let endYear = startYear + 1;

    const yearSemText = `S.Y. ${startYear}-${endYear} | ${sem}`;
    
    if (badge) {
        badge.textContent = yearSemText;
    }
    
    if (orgYearSem) {
        orgYearSem.textContent = yearSemText;
    }
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

// =============================
// FILTERS FUNCTIONALITY
// =============================
let activeFilters = {};

function initializeFilters() {
    const filtersBtn = document.getElementById('filtersBtn');
    const filtersPopover = document.getElementById('filtersPopover');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const activeFiltersContainer = document.getElementById('activeFilters');
    const filterCount = document.getElementById('filterCount');

    if (!filtersBtn || !filtersPopover) return;

    // Toggle popover
    filtersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filtersPopover.classList.toggle('show');
    });

    // Close popover when clicking outside
    document.addEventListener('click', (e) => {
        if (!filtersBtn.contains(e.target) && !filtersPopover.contains(e.target)) {
            filtersPopover.classList.remove('show');
        }
    });

    // Apply filters
    applyFiltersBtn.addEventListener('click', () => {
        activeFilters = {};
        
        // Get filter values
        const yearLevel = document.getElementById('yearLevel').value;
        const course = document.getElementById('course').value;
        const section = document.getElementById('section').value;
        const schoolYear = document.getElementById('schoolYear').value;
        const semester = document.getElementById('semester').value;

        if (yearLevel) activeFilters.yearLevel = yearLevel;
        if (course) activeFilters.course = course;
        if (section) activeFilters.section = section;
        if (schoolYear) activeFilters.schoolYear = schoolYear;
        if (semester) activeFilters.semester = semester;

        updateActiveFiltersDisplay();
        updateFilterCount();
        filtersPopover.classList.remove('show');
        applyTableFilters();
    });

    // Reset filters
    resetFiltersBtn.addEventListener('click', () => {
        activeFilters = {};
        document.querySelectorAll('#filtersPopover select').forEach(select => {
            select.value = '';
        });
        restoreAllOptions(); // Restore all dropdown options
        updateActiveFiltersDisplay();
        updateFilterCount();
        applyTableFilters();
        updateFilterSections(); // Reset sections to show all
    });

    // Update sections dropdown when Year Level or Course changes
    const yearLevelSelect = document.getElementById('yearLevel');
    const courseSelect = document.getElementById('course');
    
    if (yearLevelSelect) {
        yearLevelSelect.addEventListener('change', () => {
            updateCourseOptions();
            updateFilterSections();
        });
    }
    if (courseSelect) {
        courseSelect.addEventListener('change', () => {
            updateYearLevelOptions();
            updateFilterSections();
        });
    }

    // Initialize sections dropdown with all options
    updateFilterSections();

    // Filter Course options based on selected Year Level
    function updateCourseOptions() {
        const year = document.getElementById('yearLevel')?.value;
        const courseSelect = document.getElementById('course');
        
        if (!courseSelect) return;

        // Get all options
        const options = courseSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const courseValue = option.value;
            
            // If year is 3 or 4, hide ACT courses (they only have years 1 and 2)
            if ((year === "3" || year === "4") && (courseValue === "ACT-AD" || courseValue === "ACT-NET")) {
                option.disabled = true;
                option.style.display = 'none';
                // If this option was selected, deselect it
                if (courseSelect.value === courseValue) {
                    courseSelect.value = '';
                }
            } else {
                option.disabled = false;
                option.style.display = '';
            }
        });
    }

    // Filter Year Level options based on selected Course
    function updateYearLevelOptions() {
        const course = document.getElementById('course')?.value;
        const yearLevelSelect = document.getElementById('yearLevel');
        
        if (!yearLevelSelect) return;

        // Get all options
        const options = yearLevelSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const yearValue = option.value;
            
            // If course is ACT-AD or ACT-NET, hide years 3 and 4
            if ((course === "ACT-AD" || course === "ACT-NET") && (yearValue === "3" || yearValue === "4")) {
                option.disabled = true;
                option.style.display = 'none';
                // If this option was selected, deselect it
                if (yearLevelSelect.value === yearValue) {
                    yearLevelSelect.value = '';
                }
            } else {
                option.disabled = false;
                option.style.display = '';
            }
        });
    }

    // Restore all options in dropdowns
    function restoreAllOptions() {
        const yearLevelSelect = document.getElementById('yearLevel');
        const courseSelect = document.getElementById('course');
        
        if (yearLevelSelect) {
            yearLevelSelect.querySelectorAll('option').forEach(option => {
                option.disabled = false;
                option.style.display = '';
            });
        }
        
        if (courseSelect) {
            courseSelect.querySelectorAll('option').forEach(option => {
                option.disabled = false;
                option.style.display = '';
            });
        }
    }

    function updateFilterSections() {
        const year = document.getElementById('yearLevel')?.value;
        const course = document.getElementById('course')?.value;
        const sectionSelect = document.getElementById('section');

        if (!sectionSelect) return;

        // Reset to "All" option
        sectionSelect.innerHTML = '<option value="">All</option>';

        // If both year and course are selected, show only matching sections
        if (year && course) {
            // Check if ACT courses have invalid year levels
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
        } else {
            // Show all sections from all combinations
            const allSections = new Set();
            Object.keys(sections).forEach(key => {
                // Filter based on what's selected
                if (year && !key.endsWith('-' + year)) return;
                if (course && !key.startsWith(course + '-')) return;
                
                sections[key].forEach(s => allSections.add(s));
            });

            // Sort and add all sections
            Array.from(allSections).sort().forEach(s => {
                const opt = document.createElement('option');
                opt.value = s;
                opt.textContent = s;
                sectionSelect.appendChild(opt);
            });
        }
    }

    function updateActiveFiltersDisplay() {
        activeFiltersContainer.innerHTML = '';
        Object.entries(activeFilters).forEach(([key, value]) => {
            const tag = document.createElement('div');
            tag.className = 'filter-tag';
            tag.innerHTML = `${getFilterLabel(key)}: ${value} <span class="remove" data-filter="${key}">×</span>`;
            activeFiltersContainer.appendChild(tag);
        });

        // Add remove event listeners
        document.querySelectorAll('.filter-tag .remove').forEach(removeBtn => {
            removeBtn.addEventListener('click', (e) => {
                const filterKey = e.target.dataset.filter;
                delete activeFilters[filterKey];
                updateActiveFiltersDisplay();
                updateFilterCount();
                applyTableFilters();
            });
        });
    }

    function updateFilterCount() {
        const count = Object.keys(activeFilters).length;
        filterCount.textContent = count;
        filterCount.style.display = count > 0 ? 'inline-block' : 'none';
    }

    function getFilterLabel(key) {
        const labels = {
            yearLevel: 'Year Level',
            course: 'Course',
            section: 'Section',
            schoolYear: 'School Year',
            semester: 'Semester'
        };
        return labels[key] || key;
    }

    function applyTableFilters() {
        const rows = document.querySelectorAll('tbody tr');
        const isPaymentHistory = window.location.pathname.includes('payment-history');
        
        rows.forEach(row => {
            let show = true;
            const cells = row.querySelectorAll('td');
            
            if (isPaymentHistory) {
                // Payment history table structure: Student No.(0), Name(1), Course(2), Year & Section(3), School Year(4), Semester(5), Amount(6), Status(7)
                if (activeFilters.yearLevel) {
                    const yearSection = cells[3]?.textContent || '';
                    if (!yearSection.includes(activeFilters.yearLevel)) show = false;
                }
                
                if (activeFilters.course) {
                    const course = cells[2]?.textContent || '';
                    if (course !== activeFilters.course) show = false;
                }
                
                if (activeFilters.section) {
                    const yearSection = cells[3]?.textContent || '';
                    if (!yearSection.includes(activeFilters.section)) show = false;
                }
                
                if (activeFilters.schoolYear) {
                    const schoolYear = cells[4]?.textContent || '';
                    if (schoolYear !== activeFilters.schoolYear) show = false;
                }
                
                if (activeFilters.semester) {
                    const semester = cells[5]?.textContent || '';
                    if (semester !== activeFilters.semester) show = false;
                }
            } else {
                // Dashboard table structure: Student No.(0), Name(1), Year & Section(2), Amount Paid(3), Total Due(4), Status(5), Last Payment(6), Actions(7)
                if (activeFilters.yearLevel) {
                    const yearSection = cells[2]?.textContent || '';
                    if (!yearSection.includes(activeFilters.yearLevel)) show = false;
                }
                
                if (activeFilters.section) {
                    const yearSection = cells[2]?.textContent || '';
                    if (!yearSection.includes(activeFilters.section)) show = false;
                }
                
                // Course, School Year, and Semester filters are not applicable on dashboard
            }
            
            row.style.display = show ? '' : 'none';
        });
    }
}

// =============================
// SEARCH FUNCTIONALITY
// =============================
function initializeSearch() {
    const searchBtn = document.getElementById('searchBtn');
    const searchInput = document.getElementById('searchInput');
    const tableBody = document.querySelector('tbody');

    if (!searchBtn || !searchInput || !tableBody) return;

    searchBtn.addEventListener('click', () => {
        const query = searchInput.value.toLowerCase().trim();
        const rows = tableBody.querySelectorAll('tr');

        rows.forEach(row => {
            const cells = row.querySelectorAll('td');
            let match = false;

            cells.forEach(cell => {
                if (cell.textContent.toLowerCase().includes(query)) {
                    match = true;
                }
            });

            row.style.display = match ? '' : 'none';
        });
    });
}