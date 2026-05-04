# Full Updated Code

## assets/scripts/script.js
```javascript
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

function isStudentOnlyUser(user) {
  if (!user || !user.permissions) return false;
  return Boolean(
    user.permissions.studentView &&
    !user.permissions.organizationView &&
    !user.permissions.adminView &&
    !user.permissions.facultyView &&
    !user.permissions.deanView
  );
}

function navigateToRoleHome(user) {
  if (!user || !user.permissions) {
    navigateTo('index.html');
    return;
  }

  if (user.permissions.deanView) {
    navigateTo('pages/dean/dean-dashboard.html');
  } else if (user.permissions.facultyView) {
    navigateTo('pages/faculty/faculty-dashboard.html');
  } else if (user.permissions.adminView) {
    navigateTo('pages/admin/admin-dashboard.html');
  } else if (user.permissions.organizationView) {
    navigateTo('pages/organization/organization-dashboard.html');
  } else {
    navigateTo('pages/student/student-dashboard.html');
  }
}

function readJsonArrayFromStorage(key) {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || '[]');
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function getStudentDataKey(name, fallbackValue) {
  return window.CCSStudentDataKeys && window.CCSStudentDataKeys[name]
    ? window.CCSStudentDataKeys[name]
    : fallbackValue;
}

function getStudentDataStorageKey(name) {
  if (!window.CCSStudentDataKeys) {
    window.CCSStudentDataKeys = {
      STUDENT_PAYMENTS_STORAGE_KEY: 'ccs.student.payments',
      PROMISSORY_STORAGE_KEY: 'ccs.promissory.requests'
    };
  }

  if (!window.CCSStudentDataKeys[name]) {
    return '';
  }

  return window.CCSStudentDataKeys[name];
}

function dedupePayments(payments) {
  const seen = new Set();

  return payments.filter(function (payment) {
    const key = [
      String(payment.referenceNumber || '').trim(),
      String(payment.id || '').trim(),
      String(payment.studentId || payment.studentNo || '').trim(),
      String(payment.feeId || payment.feeName || payment.desc || '').trim(),
      String(payment.amount || '').trim(),
      String(payment.dateSubmitted || payment.date || '').trim(),
      String(payment.orgId || '').trim()
    ].join('|');

    if (seen.has(key)) {
      return false;
    }

    seen.add(key);
    return true;
  });
}

function readStudentPaymentsWithMigration() {
  const paymentsKey = getStudentDataStorageKey('STUDENT_PAYMENTS_STORAGE_KEY') || getStudentDataKey('STUDENT_PAYMENTS_STORAGE_KEY', 'ccs.student.payments');
  const legacyKeys = ['ccs.payments'];
  const currentPayments = readJsonArrayFromStorage(paymentsKey);
  let combined = currentPayments.slice();

  legacyKeys.forEach(function (legacyKey) {
    if (legacyKey === paymentsKey) return;
    const legacyPayments = readJsonArrayFromStorage(legacyKey);
    if (!legacyPayments.length) return;
    combined = combined.concat(legacyPayments);
  });

  const migrated = dedupePayments(combined);

  if (migrated.length !== currentPayments.length) {
    try {
      localStorage.setItem(paymentsKey, JSON.stringify(migrated));
    } catch (error) {
    }
  }

  return migrated;
}

function getStudentPayments(studentId) {
  const payments = readStudentPaymentsWithMigration();
  const targetStudentId = String(studentId || '').trim();

  if (!targetStudentId) {
    return payments.slice();
  }

  return payments.filter(function (payment) {
    return String(payment.studentId || payment.studentNo || '').trim() === targetStudentId;
  });
}

function getStudentPromissoryRequests(studentId) {
  const promissoryKey = getStudentDataStorageKey('PROMISSORY_STORAGE_KEY') || getStudentDataKey('PROMISSORY_STORAGE_KEY', 'ccs.promissory.requests');
  const requests = readJsonArrayFromStorage(promissoryKey);
  const targetStudentId = String(studentId || '').trim();

  if (!targetStudentId) {
    return requests.slice();
  }

  return requests.filter(function (request) {
    return String(request.studentId || request.studentNumber || '').trim() === targetStudentId;
  });
}

window.getStudentPayments = getStudentPayments;
window.getStudentPromissoryRequests = getStudentPromissoryRequests;
window.CCSStudentDataHelpers = {
  getStudentDataStorageKey: getStudentDataStorageKey,
  getStudentPayments: getStudentPayments,
  getStudentPromissoryRequests: getStudentPromissoryRequests
};

const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("user-email").value.trim();
    const password = document.getElementById("user-password").value.trim();
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }

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

    const loggedUser = window.Auth.getUser();
    navigateToRoleHome(loggedUser);
  });
}

function enforceRouteAccess() {
  if (!window.Auth) return;

  const page = (window.location.pathname.split('/').pop() || 'index.html').toLowerCase();
  const isLoginPage = page === 'index.html';
  const user = window.Auth.getUser();

  if (isLoginPage) {
    if (user) {
      window.Auth.logout();
    }
    return;
  }

  if (!user) {
    navigateTo('index.html');
    return;
  }

  if (page === 'organization-dashboard.html' && !window.Auth.canManageOrg()) {
    navigateTo('pages/student/student-dashboard.html');
    return;
  }

  if (page === 'faculty-dashboard.html' && !window.Auth.isFaculty()) {
    if (window.Auth.isDean()) {
      navigateTo('pages/dean/dean-dashboard.html');
    } else {
      navigateTo('pages/student/student-dashboard.html');
    }
    return;
  }

  if (page === 'dean-dashboard.html' && !window.Auth.isDean()) {
    if (window.Auth.isFaculty()) {
      navigateTo('pages/faculty/faculty-dashboard.html');
    } else {
      navigateTo('pages/student/student-dashboard.html');
    }
    return;
  }

  if (page === 'admin-dashboard.html' && !window.Auth.isAdmin()) {
    navigateTo('pages/student/student-dashboard.html');
    return;
  }

  if (page === 'organization-dashboard.html') {
    window.Auth.setView('organization');
  } else if (page === 'student-dashboard.html') {
    window.Auth.setView('student');
  } else if (page === 'faculty-dashboard.html' && window.Auth.isFaculty()) {
    window.Auth.setView('faculty');
  } else if (page === 'dean-dashboard.html' && window.Auth.isDean()) {
    window.Auth.setView('dean');
  }

  try {
    sessionStorage.removeItem('ccs.redirect.state');
  } catch (error) {
  }
}

enforceRouteAccess();

let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
  arrow[i].addEventListener("click", (e)=>{
 let arrowParent = e.target.parentElement.parentElement; // selecting main parent of arrow
 arrowParent.classList.toggle("showMenu");
  });
}
let sidebarBtn = document.querySelector(".bx-menu, .toggle-btn, #toggle-btn");

function isMobileViewport() {
  return window.innerWidth <= 768;
}

function isTabletViewport() {
  return window.innerWidth >= 769 && window.innerWidth <= 1024;
}

function ensureSidebarBackdrop() {
  let backdrop = document.getElementById('sidebar-backdrop');
  if (backdrop) return backdrop;

  backdrop = document.createElement('div');
  backdrop.id = 'sidebar-backdrop';
  document.body.appendChild(backdrop);
  return backdrop;
}

function showSidebarBackdrop() {
  const backdrop = ensureSidebarBackdrop();
  backdrop.classList.add('active');
}

function hideSidebarBackdrop() {
  const backdrop = document.getElementById('sidebar-backdrop');
  if (!backdrop) return;
  backdrop.classList.remove('active');
}

function closeMobileSidebar() {
  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;
  sidebar.classList.remove("mobile-open");
  hideSidebarBackdrop();
}

function toggleMobileSidebar(sidebar) {
  const isOpen = sidebar.classList.toggle("mobile-open");
  if (isOpen) {
    showSidebarBackdrop();
    return;
  }
  hideSidebarBackdrop();
}

function bindResponsiveSidebarHandlers() {
  if (!document.body || document.body.dataset.sidebarResponsiveBound === 'true') {
    return;
  }

  document.body.dataset.sidebarResponsiveBound = 'true';

  const backdrop = ensureSidebarBackdrop();
  backdrop.addEventListener('click', () => {
    closeMobileSidebar();
  });

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      closeMobileSidebar();
    }
  });

  window.addEventListener('resize', () => {
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    if (!isMobileViewport()) {
      sidebar.classList.remove("mobile-open");
      hideSidebarBackdrop();
    }

    if (isTabletViewport()) {
    }

    adjustHomeSectionMargin();
  });
}

if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
  sidebarBtn.dataset.sidebarInitialized = 'true';
  sidebarBtn.addEventListener("click", ()=>{
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;

    if (isMobileViewport()) {
      toggleMobileSidebar(sidebar);
      adjustHomeSectionMargin();
      return;
    }

    if (isTabletViewport()) {
      sidebar.classList.toggle("close");
      sidebar.classList.remove("mobile-open");
      hideSidebarBackdrop();
      adjustHomeSectionMargin();
      return;
    }

    sidebar.classList.toggle("close");
    sidebar.classList.remove("mobile-open");
    hideSidebarBackdrop();
    adjustHomeSectionMargin();
  });
}

bindResponsiveSidebarHandlers();

function adjustHomeSectionMargin() {
  const homeSection = document.querySelector(".home-section");
  if (!homeSection) return;

  if (window.innerWidth <= 768) {
    homeSection.style.marginLeft = "0px";
    homeSection.style.width = "100%";
    return;
  }

  const sidebar = document.querySelector(".sidebar");
  if (!sidebar) return;

  if (sidebar.classList.contains("close")) {
    homeSection.style.marginLeft = "78px";
    homeSection.style.width = "calc(100% - 78px)";
  } else {
    homeSection.style.marginLeft = "260px";
    homeSection.style.width = "calc(100% - 260px)";
  }
}

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

function initializeViewToggle() {
  const switchContainer = document.querySelector('.view-switch-container');
  if (!switchContainer) return;

  if (!window.Auth || !window.Auth.canManageOrg()) {
    switchContainer.style.display = 'none';
    return;
  }

  const orgScope = window.CCSAuthHelpers && typeof window.CCSAuthHelpers.getCurrentOrganizationScope === 'function'
    ? window.CCSAuthHelpers.getCurrentOrganizationScope()
    : null;
  const isMSA = orgScope && orgScope.orgId === 'org-msa-001';
  
  if (isMSA) {
    switchContainer.style.display = 'none';
    return;
  }

  const switchIcon = switchContainer.querySelector('.view-switch-icon');
  if (!switchIcon) return;

  const closeDropdown = () => {
    const dropdown = switchContainer.querySelector('.view-switch-dropdown');
    if (dropdown) dropdown.remove();
    switchContainer.classList.remove('is-open');
  };

  const handleOutsideClick = (event) => {
    if (!switchContainer.contains(event.target)) {
      closeDropdown();
      document.removeEventListener('click', handleOutsideClick);
    }
  };

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
      if (nextView === currentView) {
        closeDropdown();
        document.removeEventListener('click', handleOutsideClick);
        return;
      }

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

function initializeLogout() {
  const logoutSection = document.querySelector('.profile-details .logout-section');
  if (!logoutSection) return;

  logoutSection.addEventListener('click', () => {
    if (window.Auth) {
      window.Auth.logout();
    }
    navigateTo('index.html');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(adjustHomeSectionMargin, 100);
  setTimeout(() => {
    syncProfileDetails();
    initializeViewToggle();
    initializeLogout();
    initializePaymentsPanel();
    initializeFilters();
    initializeSearch();
  }, 120);
});

let paymentsFilter = null;
let paymentsListEl = null;
let myPayments = [];

function renderPayments(list, viewMode){
  if (!paymentsListEl) return;

  const formatStatusBadge = (payment) => {
    const status = String(payment.status || 'Confirmed').toLowerCase();
    if (status === 'pending verification') {
      return '<span class="payment-status-badge payment-status-pending">Pending Verification</span>';
    }
    if (status === 'rejected') {
      return '<span class="payment-status-badge payment-status-rejected">Rejected</span>';
    }
    return '<span class="payment-status-badge payment-status-confirmed">Confirmed</span>';
  };

  if (!list.length) {
    paymentsListEl.innerHTML = viewMode === 'pending'
      ? '<div class="payment-item"><div class="payment-row"><span class="pay-desc">No pending payments</span></div></div>'
      : '<div class="payment-item"><div class="payment-row"><span class="pay-desc">No payments found</span></div></div>';
    return;
  }

  paymentsListEl.innerHTML = list.map(p => `
    <div class="payment-item" data-date="${p.dateSubmitted || p.date || ''}">
      <div class="payment-row">
        <span class="pay-desc">${p.feeName || p.desc || 'Payment'}</span>
        <span class="pay-amount">${p.amount}</span>
      </div>
      <div class="payment-meta">
        ${p.orgName ? `<span class="payment-org">${p.orgName}</span>` : ''}
        ${p.referenceNumber ? `<span class="payment-ref">${p.referenceNumber}</span>` : ''}
        <span>${p.dateSubmitted || p.date || ''}${p.paymentMethod ? ` • ${p.paymentMethod}` : ''}</span>
      </div>
      <div class="payment-status-row">
        ${formatStatusBadge(p)}
        ${String(p.status || '').toLowerCase() === 'rejected' && p.rejectionReason ? `<span class="payment-rejection-reason">${p.rejectionReason}</span>` : ''}
      </div>
    </div>
  `).join('');
}

function filterPayments(value){
  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days
  const status = (payment) => String(payment.status || 'Confirmed').toLowerCase();

  if (value === 'pending') {
    renderPayments(myPayments.filter(p => status(p) === 'pending verification'), 'pending');
    return;
  }

  if (value === 'all') {
    renderPayments(myPayments.filter(p => status(p) === 'confirmed'), 'all');
    return;
  }

  const filtered = myPayments.filter(p => {
    const paymentDate = p.dateSubmitted || p.date || '';
    const d = new Date(paymentDate + 'T00:00:00');
    if (status(p) !== 'confirmed') return false;
    if (value === 'recent') return d >= recentThreshold;
    if (value === 'old') return d < recentThreshold;
    return true;
  });

  renderPayments(filtered, value);
}

function initializePaymentsPanel() {
  paymentsFilter = document.getElementById('payments-filter');
  paymentsListEl = document.querySelector('.payments-history .payments-list');
  if (!paymentsListEl) return;

  const currentUser = window.Auth ? window.Auth.getUser() : null;
  const paymentStore = window.CCSPaymentStore && typeof window.CCSPaymentStore.getPayments === 'function' ? window.CCSPaymentStore : null;
  const allPayments = paymentStore ? paymentStore.getPayments() : (window.SAMPLE_PAYMENTS || []).map((payment) => ({
    ...payment,
    feeName: payment.feeName || payment.desc || 'Payment',
    paymentMethod: payment.paymentMethod || payment.method || 'Cash',
    status: payment.status || 'Confirmed',
    dateSubmitted: payment.dateSubmitted || payment.date || '',
    referenceNumber: payment.referenceNumber || '',
    orgName: payment.orgName || (payment.orgId === 'org-msa-001' ? 'Muslim Student Association' : 'CCS Student Council')
  }));
  const isStudentDashboardPage = (window.location.pathname || '').toLowerCase().endsWith('student-dashboard.html');

  // Filter payments by current student
  const studentPayments = currentUser && currentUser.studentId
    ? allPayments.filter(p => String(p.studentId || p.studentNo || '') === String(currentUser.studentId))
    : [];

  if (isStudentDashboardPage) {
    myPayments = studentPayments.sort((a, b) => {
      const right = new Date((b.updatedAt || b.dateSubmitted || b.date || '') + 'T00:00:00');
      const left = new Date((a.updatedAt || a.dateSubmitted || a.date || '') + 'T00:00:00');
      return right - left;
    });

    const hasPendingPayments = myPayments.some(function (payment) {
      return String(payment.status || '').toLowerCase() === 'pending verification';
    });
    const selectedView = hasPendingPayments ? 'pending' : 'recent';
    if (paymentsFilter && paymentsFilter.value !== selectedView) {
      paymentsFilter.value = selectedView;
    }

    filterPayments(selectedView);

    if (paymentsFilter && paymentsFilter.dataset.bound !== 'true') {
      paymentsFilter.dataset.bound = 'true';
      paymentsFilter.addEventListener('change', (e) => {
        filterPayments(e.target.value);
      });
    }
  } else {
    myPayments = studentPayments.sort((a, b) => new Date((a.dateSubmitted || a.date || '') + 'T00:00:00') - new Date((b.dateSubmitted || b.date || '') + 'T00:00:00'));
    renderPayments(myPayments.filter((payment) => String(payment.status || 'Confirmed') === 'Confirmed'), 'all');
    
    if (paymentsFilter && paymentsFilter.dataset.bound !== 'true') {
      paymentsFilter.dataset.bound = 'true';
      paymentsFilter.addEventListener('change', (e) => {
        filterPayments(e.target.value);
      });
    }
  }
}

function showSection(sectionId) {
    document.querySelectorAll('.section').forEach(function(sec) {
        sec.classList.remove('active');
    });
    document.getElementById(sectionId).classList.add('active');
}

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

function updateSections() {
    const year = document.getElementById('yearLevel').value;
    const course = document.getElementById('course').value;
    const sectionSelect = document.getElementById('section');

    sectionSelect.innerHTML = '<option value="">Section</option>';

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

setSchoolYear();

let activeFilters = {};

function initializeFilters() {
    const filtersBtn = document.getElementById('filtersBtn');
    const filtersPopover = document.getElementById('filtersPopover');
    const applyFiltersBtn = document.getElementById('applyFilters');
    const resetFiltersBtn = document.getElementById('resetFilters');
    const activeFiltersContainer = document.getElementById('activeFilters');
    const filterCount = document.getElementById('filterCount');
    const yearLevelSelect = document.getElementById('yearLevel');
    const courseSelect = document.getElementById('course');
    const sectionSelect = document.getElementById('section');
    const schoolYearSelect = document.getElementById('schoolYear');
    const semesterSelect = document.getElementById('semester');

    if (!filtersBtn || !filtersPopover) return;
    if (!applyFiltersBtn || !resetFiltersBtn) return;
    if (!activeFiltersContainer) return;
    if (!yearLevelSelect || !courseSelect || !sectionSelect) return;
    if (!schoolYearSelect || !semesterSelect) return;

    filtersBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        filtersPopover.classList.toggle('show');
    });

    document.addEventListener('click', (e) => {
        if (!filtersBtn.contains(e.target) && !filtersPopover.contains(e.target)) {
            filtersPopover.classList.remove('show');
        }
    });

    applyFiltersBtn.addEventListener('click', () => {
        activeFilters = {};
        
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

    updateFilterSections();

    function updateCourseOptions() {
        const year = document.getElementById('yearLevel')?.value;
        const courseSelect = document.getElementById('course');
        
        if (!courseSelect) return;

        const options = courseSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const courseValue = option.value;
            
            if ((year === "3" || year === "4") && (courseValue === "ACT-AD" || courseValue === "ACT-NET")) {
                option.disabled = true;
                option.style.display = 'none';
                if (courseSelect.value === courseValue) {
                    courseSelect.value = '';
                }
            } else {
                option.disabled = false;
                option.style.display = '';
            }
        });
    }

    function updateYearLevelOptions() {
        const course = document.getElementById('course')?.value;
        const yearLevelSelect = document.getElementById('yearLevel');
        
        if (!yearLevelSelect) return;

        const options = yearLevelSelect.querySelectorAll('option');
        
        options.forEach(option => {
            const yearValue = option.value;
            
            if ((course === "ACT-AD" || course === "ACT-NET") && (yearValue === "3" || yearValue === "4")) {
                option.disabled = true;
                option.style.display = 'none';
                if (yearLevelSelect.value === yearValue) {
                    yearLevelSelect.value = '';
                }
            } else {
                option.disabled = false;
                option.style.display = '';
            }
        });
    }

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

        sectionSelect.innerHTML = '<option value="">All</option>';

        if (year && course) {
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
            const allSections = new Set();
            Object.keys(sections).forEach(key => {
                if (year && !key.endsWith('-' + year)) return;
                if (course && !key.startsWith(course + '-')) return;
                
                sections[key].forEach(s => allSections.add(s));
            });

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
        if (!filterCount) return;
        const count = Object.keys(activeFilters).length;
        filterCount.textContent = count;
        filterCount.style.display = count > 0 
            ? 'inline-block' : 'none';
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
                if (activeFilters.yearLevel) {
                    const yearSection = cells[2]?.textContent || '';
                    if (!yearSection.includes(activeFilters.yearLevel)) show = false;
                }
                
                if (activeFilters.section) {
                    const yearSection = cells[2]?.textContent || '';
                    if (!yearSection.includes(activeFilters.section)) show = false;
                }
                
            }
            
            row.style.display = show ? '' : 'none';
        });
    }
}

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

let facultyRole = 'professor';

const facultyStudents = [
  {
    id: 'f-001',
    studentNo: '2025-1101',
    name: 'Maria Santos',
    yearLevel: '1',
    course: 'BSCS',
    section: 'BSCS 1A',
    yearSection: '1st Year - CS 1-A',
    paymentStatus: 'Fully Paid',
    studentStatus: 'Clear',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': true, 'prof-002': true },
    finalClearance: false,
    flagNotes: '',
    deanRejectReason: ''
  },
  {
    id: 'f-002',
    studentNo: '2025-1102',
    name: 'John Dela Cruz',
    yearLevel: '1',
    course: 'BSIT',
    section: 'BSIT 1B',
    yearSection: '1st Year - IT 1-B',
    paymentStatus: 'Pending',
    studentStatus: 'Clear',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': false, 'prof-002': false },
    finalClearance: false,
    flagNotes: '',
    deanRejectReason: ''
  },
  {
    id: 'f-003',
    studentNo: '2024-1103',
    name: 'Angela Reyes',
    yearLevel: '2',
    course: 'BSCS',
    section: 'BSCS 2A',
    yearSection: '2nd Year - CS 2-A',
    paymentStatus: 'Fully Paid',
    studentStatus: 'Clear',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': false, 'prof-002': true },
    finalClearance: false,
    flagNotes: '',
    deanRejectReason: ''
  },
  {
    id: 'f-004',
    studentNo: '2023-1104',
    name: 'Kevin Flores',
    yearLevel: '3',
    course: 'BSIT',
    section: 'BSIT 3B',
    yearSection: '3rd Year - IT 3-B',
    paymentStatus: 'Fully Paid',
    studentStatus: 'UW',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': false, 'prof-002': false },
    finalClearance: false,
    flagNotes: 'Attendance warning',
    deanRejectReason: ''
  },
  {
    id: 'f-005',
    studentNo: '2022-1105',
    name: 'Sofia Martinez',
    yearLevel: '4',
    course: 'BSCS',
    section: 'BSCS 4A',
    yearSection: '4th Year - CS 4-A',
    paymentStatus: 'Fully Paid',
    studentStatus: 'Clear',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': true, 'prof-002': true },
    finalClearance: true,
    flagNotes: '',
    deanRejectReason: ''
  },
  {
    id: 'f-006',
    studentNo: '2024-1106',
    name: 'Liam Navarro',
    yearLevel: '2',
    course: 'ACT-NET',
    section: 'ACT-NET 2A',
    yearSection: '2nd Year - ACT-NET 2-A',
    paymentStatus: 'Fully Paid',
    studentStatus: 'Clear',
    assignedProfessors: ['prof-001', 'prof-002'],
    professorSignatures: { 'prof-001': true, 'prof-002': true },
    finalClearance: false,
    flagNotes: '',
    deanRejectReason: ''
  }
];

const blockedStatuses = ['UW', 'AW', 'AWP', 'INC', 'Failed', 'Expelled'];
const currentProfessorId = 'prof-001';
const facultyFilters = {
  yearLevel: '',
  course: '',
  section: '',
  clearanceStatus: ''
};

let facultyActionContext = null;
let facultyConfirmHandler = null;

function getFacultyStudent(studentId) {
  return facultyStudents.find((student) => student.id === studentId);
}

function getProfessorClearanceState(student) {
  if (!student) return 'pending';
  if (student.paymentStatus !== 'Fully Paid') return 'blocked';
  if (blockedStatuses.includes(student.studentStatus)) return 'blocked';
  if (student.professorSignatures[currentProfessorId]) return 'signed';
  return 'pending';
}

function getDeanClearanceState(student) {
  if (!student) return 'pending';
  if (student.finalClearance) return 'cleared';
  return 'pending';
}

function checkAllProfessorsSigned(studentId) {
  const student = getFacultyStudent(studentId);
  if (!student || !Array.isArray(student.assignedProfessors)) return false;
  return student.assignedProfessors.every((profId) => student.professorSignatures[profId]);
}

function toggleFacultyView(role) {
  if (role !== 'professor' && role !== 'dean') return;
  facultyRole = role;

  const professorViewBtn = document.getElementById('professorViewBtn');
  const deanViewBtn = document.getElementById('deanViewBtn');

  if (professorViewBtn && deanViewBtn) {
    professorViewBtn.classList.toggle('active', role === 'professor');
    deanViewBtn.classList.toggle('active', role === 'dean');
  }

  renderFacultyDashboard();
}

function signClearance(studentId) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  const isBlocked = getProfessorClearanceState(student) === 'blocked';
  if (isBlocked) {
    alert('This student cannot be signed because payment/status blocks clearance.');
    return;
  }

  student.professorSignatures[currentProfessorId] = true;
  renderFacultyDashboard();
}

function flagStudent(studentId, status, notes) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  student.studentStatus = status;
  student.flagNotes = notes || '';
  student.professorSignatures[currentProfessorId] = false;
  student.finalClearance = false;
  renderFacultyDashboard();
}

function removeFlagStudent(studentId) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  student.studentStatus = 'Clear';
  student.flagNotes = '';
  student.professorSignatures[currentProfessorId] = false;
  student.finalClearance = false;
  renderFacultyDashboard();
}

function deanFinalSign(studentId) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  if (!checkAllProfessorsSigned(studentId)) {
    alert('Dean can only sign when all professors have signed.');
    return;
  }

  if (blockedStatuses.includes(student.studentStatus) || student.paymentStatus !== 'Fully Paid') {
    alert('Student is blocked and cannot be final signed.');
    return;
  }

  student.finalClearance = true;
  renderFacultyDashboard();
}

function deanReject(studentId, reason) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  student.deanRejectReason = reason || '';
  student.finalClearance = false;
  student.assignedProfessors.forEach((profId) => {
    student.professorSignatures[profId] = false;
  });
  renderFacultyDashboard();
}

function signAllEligible() {
  facultyStudents.forEach((student) => {
    if (student.paymentStatus === 'Fully Paid' &&
        student.studentStatus === 'Clear' &&
        student.professorSignatures[currentProfessorId] === false) {
      student.professorSignatures[currentProfessorId] = true;
    }
  });
  renderFacultyDashboard();
}

function finalSignAll() {
  facultyStudents.forEach((student) => {
    if (checkAllProfessorsSigned(student.id) &&
        student.finalClearance === false &&
        student.paymentStatus === 'Fully Paid' &&
        !blockedStatuses.includes(student.studentStatus)) {
      student.finalClearance = true;
    }
  });
  renderFacultyDashboard();
}

function filterFacultyTable() {
  renderFacultyDashboard();
}

function getFilteredStudents() {
  const searchValue = (document.getElementById('facultySearchInput')?.value || '').toLowerCase().trim();

  return facultyStudents.filter((student) => {
    const inRoleScope = facultyRole === 'professor'
      ? true
      : checkAllProfessorsSigned(student.id);

    if (!inRoleScope) return false;

    const searchable = `${student.studentNo} ${student.name}`.toLowerCase();
    if (searchValue && !searchable.includes(searchValue)) return false;

    if (facultyFilters.yearLevel && student.yearLevel !== facultyFilters.yearLevel) return false;
    if (facultyFilters.course && student.course !== facultyFilters.course) return false;
    if (facultyFilters.section && student.section !== facultyFilters.section) return false;

    if (facultyFilters.clearanceStatus) {
      if (facultyRole === 'professor') {
        const state = getProfessorClearanceState(student);
        if (facultyFilters.clearanceStatus !== state) return false;
      } else {
        const deanState = getDeanClearanceState(student);
        if (facultyFilters.clearanceStatus === 'cleared' && deanState !== 'cleared') return false;
        if (facultyFilters.clearanceStatus === 'pending' && deanState !== 'pending') return false;
        if (facultyFilters.clearanceStatus === 'blocked') return false;
        if (facultyFilters.clearanceStatus === 'signed') return false;
      }
    }

    return true;
  });
}

function renderFacultySummary(students) {
  const summaryCards = document.getElementById('facultySummaryCards');
  if (!summaryCards) return;

  if (facultyRole === 'professor') {
    const signedCount = students.filter((student) => getProfessorClearanceState(student) === 'signed').length;
    const pendingCount = students.filter((student) => getProfessorClearanceState(student) === 'pending').length;
    const blockedCount = students.filter((student) => getProfessorClearanceState(student) === 'blocked').length;

    summaryCards.innerHTML = `
      <div class="card">
        <i class='bx bx-group'></i>
        <h3>Total Students</h3>
        <p>${students.length}</p>
      </div>
      <div class="card">
        <i class='bx bx-time-five'></i>
        <h3>Pending Clearance</h3>
        <p>${pendingCount}</p>
      </div>
      <div class="card">
        <i class='bx bx-check-circle'></i>
        <h3>Signed</h3>
        <p>${signedCount}</p>
      </div>
      <div class="card">
        <i class='bx bx-error-circle'></i>
        <h3>Flagged</h3>
        <p>${blockedCount}</p>
      </div>
    `;
  } else {
    const awaitingFinalSign = students.filter((student) => !student.finalClearance).length;
    const fullyCleared = students.filter((student) => student.finalClearance).length;

    summaryCards.innerHTML = `
      <div class="card">
        <i class='bx bx-time-five'></i>
        <h3>Awaiting Final Sign</h3>
        <p>${awaitingFinalSign}</p>
      </div>
      <div class="card">
        <i class='bx bx-badge-check'></i>
        <h3>Fully Cleared</h3>
        <p>${fullyCleared}</p>
      </div>
      <div class="card">
        <i class='bx bx-group'></i>
        <h3>Total Students</h3>
        <p>${students.length}</p>
      </div>
      <div class="card">
        <i class='bx bx-notepad'></i>
        <h3>Dean Queue</h3>
        <p>${students.length - fullyCleared}</p>
      </div>
    `;
  }
}

function renderProfessorTable(students) {
  const tableHead = document.getElementById('facultyTableHead');
  const tableBody = document.getElementById('facultyTableBody');
  const tableTitle = document.getElementById('facultyTableTitle');
  if (!tableHead || !tableBody) return;

  if (tableTitle) {
    tableTitle.innerHTML = `
      <span>Clearance Queue</span>
      <button id="signAllEligibleBtn" class="bulk-action-btn" type="button">Sign All Eligible</button>
    `;
  }

  tableHead.innerHTML = `
    <tr>
      <th>Student No.</th>
      <th>Name</th>
      <th>Year & Section</th>
      <th>Payment Status</th>
      <th>Student Status</th>
      <th>Clearance</th>
      <th>Actions</th>
    </tr>
  `;

  if (!students.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No students match your filters.</td></tr>';
    return;
  }

  tableBody.innerHTML = students.map((student) => {
    const clearance = getProfessorClearanceState(student);
    const paymentBadge = student.paymentStatus === 'Fully Paid'
      ? '<span class="status-badge badge-paid">Fully Paid</span>'
      : '<span class="status-badge badge-pending-pay">Pending</span>';

    const clearanceBadge = clearance === 'signed'
      ? '<span class="status-badge badge-signed">Signed</span>'
      : clearance === 'blocked'
        ? '<span class="status-badge badge-blocked">Blocked</span>'
        : '<span class="status-badge badge-pending-clearance">Pending</span>';

    const canSign = student.paymentStatus === 'Fully Paid' && student.studentStatus === 'Clear';
    const signed = student.professorSignatures[currentProfessorId];

    return `
      <tr>
        <td>${student.studentNo}</td>
        <td>${student.name}</td>
        <td>${student.yearSection}</td>
        <td>${paymentBadge}</td>
        <td>
          <select class="status-select" data-status-id="${student.id}">
            <option value="Clear" ${student.studentStatus === 'Clear' ? 'selected' : ''}>Clear</option>
            <option value="UW" ${student.studentStatus === 'UW' ? 'selected' : ''}>UW</option>
            <option value="AW" ${student.studentStatus === 'AW' ? 'selected' : ''}>AW</option>
            <option value="AWP" ${student.studentStatus === 'AWP' ? 'selected' : ''}>AWP</option>
            <option value="INC" ${student.studentStatus === 'INC' ? 'selected' : ''}>INC</option>
            <option value="Failed" ${student.studentStatus === 'Failed' ? 'selected' : ''}>Failed</option>
            <option value="Expelled" ${student.studentStatus === 'Expelled' ? 'selected' : ''}>Expelled</option>
          </select>
        </td>
        <td>${clearanceBadge}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-sign" data-sign-id="${student.id}" ${!canSign || signed ? 'disabled' : ''}>${signed ? 'Signed' : 'Sign'}</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderDeanTable(students) {
  const tableHead = document.getElementById('facultyTableHead');
  const tableBody = document.getElementById('facultyTableBody');
  const tableTitle = document.getElementById('facultyTableTitle');
  if (!tableHead || !tableBody) return;

  if (tableTitle) {
    tableTitle.innerHTML = `
      <span>Dean Final Queue</span>
      <button id="finalSignAllBtn" class="bulk-action-btn" type="button">Final Sign All</button>
    `;
  }

  tableHead.innerHTML = `
    <tr>
      <th>Student No.</th>
      <th>Name</th>
      <th>Year & Section</th>
      <th>Professors Signed</th>
      <th>Payment Status</th>
      <th>Final Clearance</th>
      <th>Actions</th>
    </tr>
  `;

  if (!students.length) {
    tableBody.innerHTML = '<tr><td colspan="7" class="empty-state">No students awaiting dean action.</td></tr>';
    return;
  }

  tableBody.innerHTML = students.map((student) => {
    const signedCount = student.assignedProfessors.filter((profId) => student.professorSignatures[profId]).length;
    const professorsSigned = `${signedCount}/${student.assignedProfessors.length}`;
    const paymentBadge = student.paymentStatus === 'Fully Paid'
      ? '<span class="status-badge badge-paid">Fully Paid</span>'
      : '<span class="status-badge badge-pending-pay">Pending</span>';

    const clearanceBadge = student.finalClearance
      ? '<span class="status-badge badge-cleared">Cleared</span>'
      : '<span class="status-badge badge-pending-clearance">Pending</span>';

    return `
      <tr>
        <td>${student.studentNo}</td>
        <td>${student.name}</td>
        <td>${student.yearSection}</td>
        <td>${professorsSigned}</td>
        <td>${paymentBadge}</td>
        <td>${clearanceBadge}</td>
        <td>
          <div class="action-group">
            <button class="btn btn-final" data-final-sign-id="${student.id}" ${student.finalClearance ? 'disabled' : ''}>Final Sign</button>
            <button class="btn btn-reject" data-reject-id="${student.id}" ${student.finalClearance ? 'disabled' : ''}>Reject</button>
          </div>
        </td>
      </tr>
    `;
  }).join('');
}

function renderActiveFacultyFilters() {
  const activeFiltersEl = document.getElementById('facultyActiveFilters');
  if (!activeFiltersEl) return;

  const entries = Object.entries(facultyFilters).filter(([, value]) => value);
  if (!entries.length) {
    activeFiltersEl.innerHTML = '';
    return;
  }

  const labels = {
    yearLevel: 'Year Level',
    course: 'Course',
    section: 'Section',
    clearanceStatus: 'Clearance'
  };

  activeFiltersEl.innerHTML = entries.map(([key, value]) => `
    <div class="filter-tag">${labels[key]}: ${value}<span class="remove" data-remove-filter="${key}">x</span></div>
  `).join('');
}

function renderFacultyDashboard() {
  const facultyTable = document.getElementById('facultyTableBody');
  if (!facultyTable) return;

  const students = getFilteredStudents();
  renderFacultySummary(students);
  renderActiveFacultyFilters();

  if (facultyRole === 'professor') {
    renderProfessorTable(students);
  } else {
    renderDeanTable(students);
  }
}

function setFacultyConfirmModal(title, message, onConfirm) {
  const modal = document.getElementById('facultyConfirmModal');
  const titleEl = document.getElementById('facultyConfirmTitle');
  const messageEl = document.getElementById('facultyConfirmMessage');

  if (!modal || !titleEl || !messageEl) return;

  titleEl.textContent = title;
  messageEl.textContent = message;
  facultyConfirmHandler = onConfirm;
  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeFacultyConfirmModal() {
  const modal = document.getElementById('facultyConfirmModal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  facultyConfirmHandler = null;
}

function openFacultyActionModal(mode, studentId) {
  const student = getFacultyStudent(studentId);
  if (!student) return;

  const modal = document.getElementById('facultyActionModal');
  const titleEl = document.getElementById('facultyActionTitle');
  const studentEl = document.getElementById('facultyActionStudent');
  const statusField = document.getElementById('facultyStatusField');
  const notesLabel = document.getElementById('facultyActionNotesLabel');
  const notesInput = document.getElementById('facultyActionNotes');
  const statusSelect = document.getElementById('facultyActionStatus');

  if (!modal || !titleEl || !studentEl || !statusField || !notesLabel || !notesInput || !statusSelect) return;

  facultyActionContext = { mode, studentId };
  studentEl.textContent = `${student.name} (${student.studentNo})`;
  notesInput.value = '';

  if (mode === 'flag') {
    titleEl.textContent = 'Flag Student';
    notesLabel.textContent = 'Notes / Reason';
    statusField.style.display = '';
    statusSelect.value = 'UW';
  } else {
    titleEl.textContent = 'Reject Final Clearance';
    notesLabel.textContent = 'Reason';
    statusField.style.display = 'none';
  }

  modal.classList.add('show');
  modal.setAttribute('aria-hidden', 'false');
}

function closeFacultyActionModal() {
  const modal = document.getElementById('facultyActionModal');
  if (!modal) return;
  modal.classList.remove('show');
  modal.setAttribute('aria-hidden', 'true');
  facultyActionContext = null;
}

function initializeFacultyDashboard() {
  const tableBody = document.getElementById('facultyTableBody');
  if (!tableBody) return;

  const facultyWelcomeName = document.getElementById('facultyWelcomeName');
  const facultyWelcomeSub = document.getElementById('facultyWelcomeSub');
  const facultySearchBtn = document.getElementById('facultySearchBtn');
  const professorViewBtn = document.getElementById('professorViewBtn');
  const deanViewBtn = document.getElementById('deanViewBtn');
  const searchInput = document.getElementById('facultySearchInput');
  const filtersBtn = document.getElementById('facultyFiltersBtn');
  const filtersPopover = document.getElementById('facultyFiltersPopover');

  const applyFiltersBtn = document.getElementById('facultyApplyFilters');
  const resetFiltersBtn = document.getElementById('facultyResetFilters');
  const facultyFilterYear = document.getElementById('facultyFilterYear');
  const facultyFilterCourse = document.getElementById('facultyFilterCourse');
  const facultyFilterSection = document.getElementById('facultyFilterSection');

  const confirmCancelBtn = document.getElementById('facultyConfirmCancel');
  const confirmSubmitBtn = document.getElementById('facultyConfirmSubmit');

  const actionCancelBtn = document.getElementById('facultyActionCancel');
  const actionSubmitBtn = document.getElementById('facultyActionSubmit');

  const loggedUser = window.Auth && typeof window.Auth.getUser === 'function'
    ? window.Auth.getUser()
    : null;
  const hasFacultyView = Boolean(loggedUser && loggedUser.permissions && loggedUser.permissions.facultyView);
  const hasDeanView = Boolean(loggedUser && loggedUser.permissions && loggedUser.permissions.deanView);

  if (loggedUser && facultyWelcomeName) {
    facultyWelcomeName.textContent = `Welcome, ${loggedUser.name}!`;
  }
  if (facultyWelcomeSub) {
    if (hasDeanView) {
      facultyWelcomeSub.textContent = "Here's the final clearance queue";
    } else if (hasFacultyView) {
      facultyWelcomeSub.textContent = "Here's your student clearance queue";
    } else {
      facultyWelcomeSub.textContent = '';
    }
  }

  if (hasFacultyView && !hasDeanView) {
    if (deanViewBtn) deanViewBtn.remove();
    facultyRole = 'professor';
  } else if (hasDeanView && !hasFacultyView) {
    if (professorViewBtn) professorViewBtn.remove();
    facultyRole = 'dean';
  } else if (window.Auth && window.Auth.isDean && window.Auth.isDean()) {
    facultyRole = 'dean';
  }

  if (professorViewBtn) {
    professorViewBtn.addEventListener('click', () => toggleFacultyView('professor'));
  }
  if (deanViewBtn) {
    deanViewBtn.addEventListener('click', () => toggleFacultyView('dean'));
  }

  if (searchInput) {
    searchInput.addEventListener('input', filterFacultyTable);
  }
  if (facultySearchBtn) {
    facultySearchBtn.addEventListener('click', filterFacultyTable);
  }

  function updateCourseOptions() {
    const year = facultyFilterYear ? facultyFilterYear.value : '';
    if (!facultyFilterCourse) return;

    const options = facultyFilterCourse.querySelectorAll('option');
    options.forEach((option) => {
      const courseValue = option.value;
      if ((year === '3' || year === '4') && (courseValue === 'ACT-AD' || courseValue === 'ACT-NET')) {
        option.disabled = true;
        option.style.display = 'none';
        if (facultyFilterCourse.value === courseValue) {
          facultyFilterCourse.value = '';
        }
      } else {
        option.disabled = false;
        option.style.display = '';
      }
    });
  }

  function updateYearLevelOptions() {
    const course = facultyFilterCourse ? facultyFilterCourse.value : '';
    if (!facultyFilterYear) return;

    const options = facultyFilterYear.querySelectorAll('option');
    options.forEach((option) => {
      const yearValue = option.value;
      if ((course === 'ACT-AD' || course === 'ACT-NET') && (yearValue === '3' || yearValue === '4')) {
        option.disabled = true;
        option.style.display = 'none';
        if (facultyFilterYear.value === yearValue) {
          facultyFilterYear.value = '';
        }
      } else {
        option.disabled = false;
        option.style.display = '';
      }
    });
  }

  function updateFacultyFilterSections() {
    if (!facultyFilterSection) return;

    const year = facultyFilterYear ? facultyFilterYear.value : '';
    const course = facultyFilterCourse ? facultyFilterCourse.value : '';

    facultyFilterSection.innerHTML = '<option value="">All</option>';

    if (year && course) {
      if ((course === 'ACT-AD' || course === 'ACT-NET') && (year === '3' || year === '4')) {
        facultyFilterSection.innerHTML = '<option value="">Not available</option>';
        return;
      }

      const key = `${course}-${year}`;
      if (sections[key]) {
        sections[key].forEach((sectionName) => {
          const option = document.createElement('option');
          option.value = sectionName;
          option.textContent = sectionName;
          facultyFilterSection.appendChild(option);
        });
      }
      return;
    }

    const allSections = new Set();
    Object.keys(sections).forEach((key) => {
      if (year && !key.endsWith(`-${year}`)) return;
      if (course && !key.startsWith(`${course}-`)) return;
      sections[key].forEach((sectionName) => allSections.add(sectionName));
    });

    Array.from(allSections).sort().forEach((sectionName) => {
      const option = document.createElement('option');
      option.value = sectionName;
      option.textContent = sectionName;
      facultyFilterSection.appendChild(option);
    });
  }

  function restoreFacultyFilterOptions() {
    if (facultyFilterYear) {
      facultyFilterYear.querySelectorAll('option').forEach((option) => {
        option.disabled = false;
        option.style.display = '';
      });
    }

    if (facultyFilterCourse) {
      facultyFilterCourse.querySelectorAll('option').forEach((option) => {
        option.disabled = false;
        option.style.display = '';
      });
    }
  }

  if (facultyFilterYear) {
    facultyFilterYear.addEventListener('change', () => {
      updateCourseOptions();
      updateFacultyFilterSections();
    });
  }

  if (facultyFilterCourse) {
    facultyFilterCourse.addEventListener('change', () => {
      updateYearLevelOptions();
      updateFacultyFilterSections();
    });
  }

  updateFacultyFilterSections();

  if (filtersBtn && filtersPopover) {
    filtersBtn.addEventListener('click', (event) => {
      event.stopPropagation();
      filtersPopover.classList.toggle('show');
    });

    document.addEventListener('click', (event) => {
      if (!filtersPopover.contains(event.target) && !filtersBtn.contains(event.target)) {
        filtersPopover.classList.remove('show');
      }
    });
  }

  if (applyFiltersBtn) {
    applyFiltersBtn.addEventListener('click', () => {
      facultyFilters.yearLevel = facultyFilterYear ? facultyFilterYear.value : '';
      facultyFilters.course = facultyFilterCourse ? facultyFilterCourse.value : '';
      facultyFilters.section = facultyFilterSection ? facultyFilterSection.value : '';
      facultyFilters.clearanceStatus = document.getElementById('facultyFilterClearance')?.value || '';
      if (filtersPopover) filtersPopover.classList.remove('show');
      filterFacultyTable();
    });
  }

  if (resetFiltersBtn) {
    resetFiltersBtn.addEventListener('click', () => {
      facultyFilters.yearLevel = '';
      facultyFilters.course = '';
      facultyFilters.section = '';
      facultyFilters.clearanceStatus = '';
      const facultyFilterClearance = document.getElementById('facultyFilterClearance');

      if (facultyFilterYear) facultyFilterYear.value = '';
      if (facultyFilterCourse) facultyFilterCourse.value = '';
      if (facultyFilterSection) facultyFilterSection.value = '';
      if (facultyFilterClearance) facultyFilterClearance.value = '';

      restoreFacultyFilterOptions();
      updateFacultyFilterSections();

      filterFacultyTable();
    });
  }

  document.addEventListener('click', (event) => {
    const signAllBtn = event.target.closest('#signAllEligibleBtn');
    if (signAllBtn) {
      setFacultyConfirmModal('Sign All Eligible', 'Sign clearance for all eligible students?', signAllEligible);
      return;
    }

    const finalSignAllBtn = event.target.closest('#finalSignAllBtn');
    if (finalSignAllBtn) {
      setFacultyConfirmModal('Final Sign All', 'Give final clearance to all eligible students?', finalSignAll);
      return;
    }
  });

  tableBody.addEventListener('click', (event) => {
    const signBtn = event.target.closest('[data-sign-id]');
    if (signBtn) {
      const studentId = signBtn.dataset.signId;
      setFacultyConfirmModal('Sign Clearance', 'Sign this student\'s clearance?', () => {
        signClearance(studentId);
      });
      return;
    }

    const flagBtn = event.target.closest('[data-flag-id]');
    if (flagBtn) {
      openFacultyActionModal('flag', flagBtn.dataset.flagId);
      return;
    }

    const removeFlagBtn = event.target.closest('[data-remove-flag-id]');
    if (removeFlagBtn) {
      setFacultyConfirmModal('Remove Flag', 'Reset student status back to Clear?', () => {
        removeFlagStudent(removeFlagBtn.dataset.removeFlagId);
      });
      return;
    }

    const finalBtn = event.target.closest('[data-final-sign-id]');
    if (finalBtn) {
      const studentId = finalBtn.dataset.finalSignId;
      setFacultyConfirmModal('Final Sign', 'Finalize clearance for this student?', () => {
        deanFinalSign(studentId);
      });
      return;
    }

    const rejectBtn = event.target.closest('[data-reject-id]');
    if (rejectBtn) {
      openFacultyActionModal('reject', rejectBtn.dataset.rejectId);
    }
  });

  tableBody.addEventListener('change', (event) => {
    const statusSelect = event.target.closest('[data-status-id]');
    if (!statusSelect) return;

    const studentId = statusSelect.dataset.statusId;
    const nextStatus = statusSelect.value;

    if (nextStatus === 'Clear') {
      removeFlagStudent(studentId);
      return;
    }

    flagStudent(studentId, nextStatus, 'Updated via status dropdown');
  });

  const activeFiltersContainer = document.getElementById('facultyActiveFilters');
  if (activeFiltersContainer) {
    activeFiltersContainer.addEventListener('click', (event) => {
      const removeTag = event.target.closest('[data-remove-filter]');
      if (!removeTag) return;

      const key = removeTag.dataset.removeFilter;
      if (!Object.prototype.hasOwnProperty.call(facultyFilters, key)) return;

      facultyFilters[key] = '';

      if (key === 'yearLevel') {
        const facultyFilterYear = document.getElementById('facultyFilterYear');
        if (facultyFilterYear) facultyFilterYear.value = '';
      }
      if (key === 'course') {
        const facultyFilterCourse = document.getElementById('facultyFilterCourse');
        if (facultyFilterCourse) facultyFilterCourse.value = '';
      }
      if (key === 'section') {
        const facultyFilterSection = document.getElementById('facultyFilterSection');
        if (facultyFilterSection) facultyFilterSection.value = '';
      }
      if (key === 'clearanceStatus') {
        const facultyFilterClearance = document.getElementById('facultyFilterClearance');
        if (facultyFilterClearance) facultyFilterClearance.value = '';
      }

      filterFacultyTable();
    });
  }

  if (confirmCancelBtn) {
    confirmCancelBtn.addEventListener('click', closeFacultyConfirmModal);
  }

  if (confirmSubmitBtn) {
    confirmSubmitBtn.addEventListener('click', () => {
      if (typeof facultyConfirmHandler === 'function') {
        facultyConfirmHandler();
      }
      closeFacultyConfirmModal();
    });
  }

  if (actionCancelBtn) {
    actionCancelBtn.addEventListener('click', closeFacultyActionModal);
  }

  if (actionSubmitBtn) {
    actionSubmitBtn.addEventListener('click', () => {
      if (!facultyActionContext) return;

      const notesValue = (document.getElementById('facultyActionNotes')?.value || '').trim();
      if (!notesValue) {
        alert('Please provide notes/reason before submitting.');
        return;
      }

      if (facultyActionContext.mode === 'flag') {
        const statusValue = document.getElementById('facultyActionStatus')?.value || 'UW';
        flagStudent(facultyActionContext.studentId, statusValue, notesValue);
      } else {
        deanReject(facultyActionContext.studentId, notesValue);
      }

      closeFacultyActionModal();
    });
  }

  if (hasDeanView && !hasFacultyView) {
    toggleFacultyView('dean');
  } else {
    renderFacultyDashboard();
  }
}

window.toggleFacultyView = toggleFacultyView;
window.signClearance = signClearance;
window.flagStudent = flagStudent;
window.removeFlagStudent = removeFlagStudent;
window.deanFinalSign = deanFinalSign;
window.deanReject = deanReject;
window.checkAllProfessorsSigned = checkAllProfessorsSigned;
window.filterFacultyTable = filterFacultyTable;

document.addEventListener('DOMContentLoaded', initializeFacultyDashboard);```

## assets/scripts/student/payment-history.js
```javascript
// Payment History Module

const PaymentHistory = (() => {
    let paymentHistory = [];
    let currentReceiptList = [];
    let currentPromissoryList = [];
    let currentFilter = 'recent';
    let currentModal = null;

    function getCurrentUser() {
        if (window.Auth && typeof window.Auth.getUser === 'function') {
            return window.Auth.getUser();
        }

        try {
            const authData = localStorage.getItem('ccs.auth.user') || sessionStorage.getItem('ccs.auth.user');
            return authData ? JSON.parse(authData) : null;
        } catch (_error) {
            return null;
        }
    }

    // Initialize payment history from dashboard payments
    function initializeFromDashboard() {
        const currentUser = getCurrentUser();

        const studentPayments = window.getStudentPayments
            ? window.getStudentPayments(currentUser && currentUser.studentId ? currentUser.studentId : '')
            : [];

        paymentHistory = studentPayments.map(function (payment) {
            return {
                desc: payment.feeName || payment.desc || 'Payment',
                date: payment.dateSubmitted || payment.date || '',
                amount: payment.amount,
                method: payment.paymentMethod || payment.method || 'Cash',
                referenceNumber: payment.referenceNumber || '',
                orgName: payment.orgName || (payment.orgId === 'org-msa-001' ? 'Muslim Student Association' : 'CCS Student Council'),
                status: payment.status || 'Confirmed',
                rejectionReason: payment.rejectionReason || ''
            };
        });
    }

    function formatDate(date) {
        if (!date) return '-';
        const d = new Date(date + 'T00:00:00');
        if (Number.isNaN(d.getTime())) return String(date);
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function isRecent(dateStr) {
        const now = new Date();
        const d = new Date(dateStr + 'T00:00:00');
        const diffTime = now - d;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // 30 days
    }

    function groupPaymentsByCategory(payments, filter) {
        let grouped = {};

        payments.forEach(payment => {
            const isRecentPayment = isRecent(payment.date);
            const category = isRecentPayment ? 'recent' : 'old';

            if (filter === 'all' || filter === category) {
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(payment);
            }
        });

        return grouped;
    }

    function buildTable(payments) {
        if (payments.length === 0) {
            currentReceiptList = [];
            return '';
        }

        const sortedPayments = payments.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        currentReceiptList = sortedPayments;

        let html = `
            <div class="receipt-table-wrapper">
                <table class="receipt-history-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Sort oldest to newest (chronological order)
        sortedPayments.forEach((payment, idx) => {
            const status = String(payment.status || 'Confirmed').toLowerCase();
            const statusBadge = status === 'pending verification'
                ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Verification</span>'
                : status === 'rejected'
                    ? '<span class="receipt-status-badge receipt-status-badge--rejected">Rejected</span>'
                    : '<span class="receipt-status-badge">Confirmed</span>';
            const referenceBlock = payment.referenceNumber ? `<div class="receipt-date">Ref: ${payment.referenceNumber}</div>` : '';
            html += `
                <tr>
                    <td><span class="receipt-num">${payment.desc}</span>${referenceBlock}${payment.orgName ? `<div class="receipt-date">${payment.orgName}</div>` : ''}</td>
                    <td><span class="receipt-date">${payment.date}</span></td>
                    <td><span class="receipt-amount">${payment.amount}</span></td>
                    <td class="receipt-action-cell">
                        ${statusBadge}
                        <button class="btn-view-details" style="width:auto;min-width:0;max-width:none;display:inline-flex;" onclick="PaymentHistory.viewDetails(${idx})">
                            <i class='bx bx-show'></i> View
                        </button>
                    </td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function getStudentPromissoryNotes() {
        const currentUser = getCurrentUser();

        if (!currentUser || !currentUser.studentId || !window.getStudentPromissoryRequests) {
            return [];
        }

        const requests = window.getStudentPromissoryRequests(currentUser.studentId);
        const studentReligion = String(currentUser.religion || '').trim().toLowerCase();

        return requests
            .filter(function (request) {
                const feeName = String(request.feeName || '').toLowerCase();
                if (feeName.includes('msa')) {
                    return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
                }
                return true;
            })
            .sort(function (a, b) {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }

    function buildPromissoryTable(requests) {
        currentPromissoryList = requests.slice();

        if (!requests.length) {
            return '<p class="summary-empty" style="padding: 20px; text-align: center;">No promissory notes found.</p>';
        }

        let html = `
            <div class="receipt-table-wrapper">
                <table class="receipt-history-table">
                    <thead>
                        <tr>
                            <th>Fee Name</th>
                            <th>Amount</th>
                            <th>Date Requested</th>
                            <th>Reason</th>
                            <th>Promised Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        requests.forEach(function (request) {
            const status = String(request.status || 'Pending Review').toLowerCase();
            const statusBadge = status === 'pending review'
                ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Review</span>'
                : status === 'promissory approved'
                    ? '<span class="receipt-status-badge receipt-status-badge--approved">Promissory Approved</span>'
                    : '<span class="receipt-status-badge receipt-status-badge--rejected">Promissory Rejected</span>';

            const amount = request.partialAmount ? `₱${Number(request.partialAmount).toFixed(2)}` : (() => {
                try {
                    const fees = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]');
                    const found = fees.find(function (fee) {
                        return String(fee.id || '') === String(request.feeId || '');
                    }) || fees.find(function (fee) {
                        return String(fee.name || '').toLowerCase() === String(request.feeName || '').toLowerCase();
                    });
                    return found ? `₱${Number(found.amount || 0).toFixed(2)}` : 'Full Payment';
                } catch (_err) {
                    return 'Full Payment';
                }
            })();

            html += `
                <tr>
                    <td><span class="receipt-num">${request.feeName || 'Promissory Note'}</span></td>
                    <td><span class="receipt-amount">${amount}</span></td>
                    <td><span class="receipt-date">${formatDate(request.createdAt || '')}</span></td>
                    <td><span class="promissory-reason" title="${request.reason || ''}">${request.reason || ''}</span></td>
                    <td><span class="receipt-date">${formatDate(request.promisedDate || '')}</span></td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function renderFiltered(filter) {
        const container = document.getElementById('receipt-filter-sections');
        if (!container) return;

        const now = new Date();
        const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const status = function (payment) {
            return String(payment.status || 'Confirmed').toLowerCase();
        };

        if (filter === 'promissory') {
            container.innerHTML = buildPromissoryTable(getStudentPromissoryNotes());
            return;
        }

        const filtered = paymentHistory.filter(function (payment) {
            const paymentDate = payment.date || '';
            const dateObj = new Date(paymentDate + 'T00:00:00');

            if (filter === 'pending') {
                return status(payment) === 'pending verification';
            }

            if (filter === 'all') {
                return status(payment) === 'confirmed';
            }

            if (status(payment) !== 'confirmed') {
                return false;
            }

            if (filter === 'recent') return dateObj >= recentThreshold;
            if (filter === 'old') return dateObj < recentThreshold;
            return true;
        });

        if (!filtered.length) {
            container.innerHTML = filter === 'pending'
                ? '<div class="receipt-filter-section"><p class="summary-empty">No pending receipts</p></div>'
                : '<div class="receipt-filter-section"><p class="summary-empty">No receipts found</p></div>';
            return;
        }

        container.innerHTML = buildTable(filtered);
    }

    function viewDetails(index) {
        const payment = currentReceiptList[index] || paymentHistory[index];
        if (!payment) return;

        currentModal = payment;

        // Generate detailed receipt info from payment
        const dateObj = new Date(payment.date + 'T00:00:00');
        const amountStr = payment.amount.replace('₱', '').replace(/,/g, '');
        const amount = parseInt(amountStr);
        const receiptId = `WMSU-FO-${dateObj.getFullYear()}-${String(index + 1000).slice(-6)}`;
        const method = String(payment.method || payment.paymentMethod || 'Cash');
        const transactionId = `${method.toUpperCase().slice(0, 3)}-${dateObj.toISOString().slice(0, 10).replace(/-/g, '')}-${String(index).padStart(6, '0')}`;

        const contentHtml = `
            <!-- Receipt Header -->
            <div class="receipt-modal-header-section">
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Receipt Number</span>
                        <span class="receipt-modal-value">${receiptId}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Date</span>
                        <span class="receipt-modal-value">${payment.date}</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Payment Information -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Payment Information</h4>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Payment Method</span>
                        <span class="receipt-modal-value">${method}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Transaction ID</span>
                        <span class="receipt-modal-value receipt-txn-id">${transactionId}</span>
                    </div>
                </div>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Status</span>
                        <span class="receipt-modal-value">${payment.status && String(payment.status).toLowerCase() === 'pending verification'
                    ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Verification</span>'
                    : String(payment.status || '').toLowerCase() === 'rejected'
                        ? '<span class="receipt-status-badge receipt-status-badge--rejected">Rejected</span>'
                        : '<span class="receipt-status-badge">Confirmed</span>'}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Processed By</span>
                        <span class="receipt-modal-value">Finance Office</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Fee Breakdown -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Fee Breakdown</h4>
                <div class="receipt-fee-list">
                    <div class="receipt-fee-item">
                        <span class="receipt-fee-name">${payment.desc}</span>
                        <span class="receipt-fee-amt">${payment.amount}</span>
                    </div>
                    <div class="receipt-fee-total">
                        <span>Total Amount Paid</span>
                        <span>${payment.amount}</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Authenticity & Security -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Receipt Authenticity</h4>
                <div class="receipt-security-info">
                    <div class="receipt-verified-badge">
                        <i class='bx bx-shield-check'></i>
                        <span>Verified &amp; Approved</span>
                    </div>
                    <p class="receipt-security-text">This receipt has been digitally verified and authenticated by the Finance Office. The transaction ID and receipt number can be used to verify this payment in the official system.</p>
                    <div class="receipt-verification-items">
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Digital signature verified</span>
                        </div>
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Payment gateway confirmed</span>
                        </div>
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Student record verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Footer Notice -->
            <div class="receipt-security-notice">
                <i class='bx bx-info-circle'></i>
                <p>This is an official electronic receipt. For any inquiries or to verify this receipt, please contact the Finance Office.</p>
            </div>
        `;

        document.getElementById('modal-title').textContent = `Receipt ${receiptId}`;
        document.getElementById('receipt-modal-content').innerHTML = contentHtml;
        document.getElementById('receipt-modal').classList.add('show');
    }

    function closeModal() {
        document.getElementById('receipt-modal').classList.remove('show');
        currentModal = null;
    }

    function downloadReceipt() {
        if (currentModal) {
            window.print();
        }
    }

    function filterReceipts(filter) {
        currentFilter = filter;
        renderFiltered(filter);
    }

    function initializePage() {
        initializeFromDashboard();
        const hasPending = paymentHistory.some(function (payment) {
            return String(payment.status || '').toLowerCase() === 'pending verification';
        });
        const defaultFilter = hasPending ? 'pending' : 'all';
        const filterSelect = document.getElementById('receipt-filter-select');
        if (filterSelect) {
            filterSelect.value = defaultFilter;
        }
        renderFiltered(defaultFilter);
    }

    return {
        init: initializePage,
        viewDetails: viewDetails,
        closeModal: closeModal,
        downloadReceipt: downloadReceipt,
        filterReceipts: filterReceipts
    };
})();

// Initialize on DOM ready with delay to ensure all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PaymentHistory.init();
    }, 200);
});
```

## pages/student/payment-history.html
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <title> CCS PAY++ - Payment History </title>
        <link rel="stylesheet" href="../../styles/student-styles/payment-process.css">
        <link rel="stylesheet" href="../../styles/sidebar.css">
        <link rel="stylesheet" href="../../styles/student-styles/payment-history.css">
        <link href='https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css' rel='stylesheet'>
        <link rel="stylesheet" href="../../styles/settings.css">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <nav class="navbar page-header payment-header">
            <a href="student-dashboard.html" class="back-arrow"><i class="bx bx-arrow-back"></i></a>
            <div class="nav-title">
                <h2>Payment History</h2>
                <p>View all your receipts and transactions</p>
            </div>
        </nav>

        <div class="receipt-container">
            <div class="table-header">
                <div>
                    <h2>Payment History</h2>
                    <p style="color: var(--sys-text-500); font-size: 13px; margin-top: 4px;">View all your receipts and transactions</p>
                </div>
                <select class="receipt-filter-select" id="receipt-filter-select" onchange="PaymentHistory.filterReceipts(this.value)">
                    <option value="all">All Receipts</option>
                    <option value="recent">Recent Receipts</option>
                    <option value="pending">Pending Receipts</option>
                    <option value="old">Old Receipts</option>
                    <option value="promissory">Promissory Notes</option>
                </select>
            </div>

            <div class="table-container">
                <div class="receipt-filter-sections" id="receipt-filter-sections"></div>
            </div>

            <div class="receipt-modal-overlay" id="receipt-modal" onclick="if(event.target === this) PaymentHistory.closeModal()">
                <div class="receipt-modal-card">
                    <div class="receipt-modal-header">
                        <h3 id="modal-title">Receipt Details</h3>
                        <button class="receipt-modal-close" onclick="PaymentHistory.closeModal()">
                            <i class='bx bx-x'></i>
                        </button>
                    </div>
                    <div class="receipt-modal-content" id="receipt-modal-content"></div>
                    <div class="receipt-modal-actions">
                        <button class="receipt-modal-btn" onclick="PaymentHistory.downloadReceipt()">
                            <i class='bx bx-download'></i> Download PDF
                        </button>
                        <button class="receipt-modal-btn-close" onclick="PaymentHistory.closeModal()">
                            Close
                        </button>
                    </div>
                </div>
            </div>
        </div>

    <script src="../../assets/scripts/settings.js"></script>
    <script src="../../assets/scripts/sample-accounts.js"></script>
    <script src="../../assets/scripts/auth.js"></script>
    <script src="../../assets/scripts/script.js"></script>
    <script src="../../assets/scripts/student/payment-history.js"></script>
    <script>
        localStorage.removeItem('ccs.selected.fees');
        localStorage.removeItem('ccs.payment.method');
    </script>
    </body>
</html>
```

## pages/student/student-dashboard.html
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <title> CCS PAY++ </title>
        <link rel="stylesheet" href="../../styles/sidebar.css">
        <link rel="stylesheet" href="../../styles/student-styles/student-dashboard.css">
        <!-- Boxiocns CDN Link -->
        <link href='https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css' rel='stylesheet'>
        <link rel="stylesheet" href="../../styles/settings.css">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body>
        <div class="sidebar">
            <a href="student-dashboard.html" style="text-decoration: none; color: inherit; cursor: pointer;">
                <div class="logo-details">
                    <img src="../../assets/images/pyt.png" alt="Pay++ Logo" class="sidebar-logo-img">
                    <span class="logo_name">Pay++</span>
                </div>
            </a>
                  <ul class="nav-links">
                <li>
                    <a href="student-dashboard.html">
                        <i class='bx bx-grid-alt' ></i>
                        <span class="link_name">Dashboard</span>
                    </a>
                    <ul class="sub-menu blank">
                        <li><a class="link_name" href="student-dashboard.html">Dashboard</a></li>
                    </ul>
                </li>
                <!-- <li>
                    <div class="iocn-link">
                        <a href="#">
                            <i class='bx bx-collection' ></i>
                            <span class="link_name">Category</span>
                        </a>
                        <i class='bx bxs-chevron-down arrow' ></i>
                    </div>
                    <ul class="sub-menu">
                        <li><a class="link_name" href="#">Category</a></li>
                        <li><a href="#">HTML & CSS</a></li>
                        <li><a href="#">JavaScript</a></li>
                        <li><a href="#">PHP & MySQL</a></li>
                    </ul>
                </li> -->
                <!-- <li>
                    <div class="iocn-link">
                        <a href="#">
                            <i class='bx bx-book-alt' ></i>
                            <span class="link_name">Posts</span>
                        </a>
                        <i class='bx bxs-chevron-down arrow' ></i>
                    </div>
                    <ul class="sub-menu">
                        <li><a class="link_name" href="#">Posts</a></li>
                        <li><a href="#">Web Design</a></li>
                        <li><a href="#">Login Form</a></li>
                        <li><a href="#">Card Design</a></li>
                    </ul>
                </li> -->
                <li>
                    <div class="iocn-link">
                        <a href="#">
                            <i class='bx bx-wallet' ></i>
                            <span class="link_name">Payments</span>
                        </a>
                        <i class='bx bxs-chevron-down arrow' ></i>
                    </div>
                    <ul class="sub-menu">
                        <li><a href="make-payment.html">Make Payment</a></li>
                        <li><a href="payment-receipt.html">Payment History</a></li>
                    </ul>
                </li>
                <!-- <li>
                    <div class="iocn-link">
                        <a href="#">
                            <i class='bx bx-plug' ></i>
                            <span class="link_name">Plugins</span>
                        </a>
                        <i class='bx bxs-chevron-down arrow' ></i>
                    </div>
                    <ul class="sub-menu">
                        <li><a class="link_name" href="#">Plugins</a></li>
                        <li><a href="#">UI Face</a></li>
                        <li><a href="#">Pigments</a></li>
                        <li><a href="#">Box Icons</a></li>
                    </ul>
                </li> -->
                <li>
                    <a href="clearance-status.html">
                        <i class='bx bx-clipboard' ></i>
                        <span class="link_name">Clearance</span>
                    </a>
                    <ul class="sub-menu blank">
                        <li><a class="link_name" href="clearance-status.html">Clearance</a></li>
                    </ul>
                </li>
                <li>
                    <a href="#" class="js-settings-open">
                        <i class='bx bx-cog' ></i>
                        <span class="link_name">Settings</span>
                    </a>
                    <ul class="sub-menu blank">
                        <li><a class="link_name js-settings-open" href="#">Settings</a></li>
                    </ul>
                </li>
                <li>
                    <a href="student-profile.html">
                        <i class='bx bx-user-circle'></i>
                        <span class="link_name">Profile</span>
                    </a>
                    <ul class="sub-menu blank">
                        <li><a class="link_name" href="student-profile.html">Profile</a></li>
                    </ul>
                </li>
                <li>
                    <div class="profile-details">
                        <div class="profile-main">
                            <div class="profile-content">
                                <img src="../../assets/images/profile.png" alt="profileImg">
                            </div>
                            <div class="name-job">
                                <div class="name-with-switch">
                                    <div class="profile_name" id="sidebarProfileName">Student</div>
                                    <button type="button" class="view-switch-container" aria-label="Switch view">
                                        <i class='bx bx-chevron-up view-switch-icon'></i>
                                    </button>
                                </div>
                                <div class="job" id="sidebarStudentId">0000000000</div>
                            </div>
                        </div>
                        <a class="logout-section">
                            <span>Sign out</span>
                            <i class='bx bx-log-out'></i>
                        </a>
                    </div>
                </li>
            </ul>
        </div>

        <section class="home-section">
            <div class="home-content">
                <i class='bx bx-menu' ></i>
                <span class="text">Student Dashboard</span>
                <div style="margin-left: auto; display: flex; align-items: center; gap: 16px;">
                    <div style="position: relative; cursor: pointer;" title="Promissory notifications" id="notificationBellContainer">
                        <i class='bx bx-bell' style="font-size: 24px;"></i>
                        <span id="notificationBadge" style="position: absolute; top: -5px; right: -8px; background: #dc2626; color: white; border-radius: 50%; width: 20px; height: 20px; display: flex; align-items: center; justify-content: center; font-size: 11px; font-weight: 700;">3</span>
                    </div>
                </div>
            </div>
            <br>
            <div class="dashboard-container" style="width: 100%; overflow-x: hidden; box-sizing: border-box; max-width: 100%;">
                <div class="header">
                    <h1 id="dashboardWelcome">Welcome back, Student!</h1>
                    <p>Here's your clearance status and academic informations</p>
                </div>
                <div style="width:100%; overflow:hidden; box-sizing:border-box;">
                <div class="clearance-progress-container" style="width: 100%; box-sizing: border-box;">
                    <div class="progress-circle-wrapper">
                        <svg width="100" height="100" viewBox="0 0 100 100">
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="rgba(255,255,255,0.3)"
                                stroke-width="10"
                            />
                            <circle
                                cx="50" cy="50" r="40"
                                fill="none"
                                stroke="#f97316"
                                stroke-width="10"
                                stroke-dasharray="62.8 251.2"
                                stroke-dashoffset="0"
                                stroke-linecap="round"
                                transform="rotate(-90 50 50)"
                            />
                            <text
                                x="50" y="50"
                                dominant-baseline="middle"
                                text-anchor="middle"
                                fill="white"
                                font-size="16"
                                font-weight="bold"
                            >25%</text>
                        </svg>
                    </div>
                    <div class="clearance-content progress">
                        <h2>Clearance Progress</h2>
                        <p>2 of 8 Requirements Completed</p>
                    </div>
                    <div class="labels">
                        <div class="clearance-content completed">
                            <h1>2</h1>
                            <p>Completed</p>
                        </div>
                        <div class="clearance-content pending">
                            <h1>6</h1>
                            <p>Pending</p>
                        </div>
                    </div>
                </div>
                </div>

                <div style="width:100%; overflow:hidden; box-sizing:border-box;">
                <div class="payment-progress-container">
                    <div class="fees">
                        <h2><i class='bx bx-wallet'></i> Outstanding Fees</h2>
                        <h1 id="outstandingTotal">₱0.00</h1>
                        <p id="outstandingDueLabel">Due: -</p>
                        
                        <div class="fee-list">
                            <ul id="outstandingFeeList"></ul>
                        </div>
                    </div>
                    <div class="payments-history">
                        <div class="payments-header">
                            <label for="payments-filter" class="payments-label">View:</label>
                            <select id="payments-filter" class="payments-filter">
                                <option value="recent">Recent Payments</option>
                                <option value="pending">Pending Payments</option>
                                <option value="promissory">Promissory Notes</option>
                            </select>
                        </div>

                        <div class="payments-list" id="payments-list-container">

                        </div>

                        <div class="payments-bottom">

                        </div>
                    </div>
                </div>
                </div>
                <div class="approval-status">
                    <div class="clearance-header">
                        <h2>Clearance Signatories</h2>
                        <p>All departments must be cleared before issuance of clearance</p>
                    </div>
                    <div class="personels">
                        <h2>CSC Student Council</h2>
                        <h3>Organization</h3>
                        <p class="cleared"><i class='bx bx-check-circle'></i> Cleared</p>
                    </div>
                    <div class="personels">
                        <h2>Venom Publication</h2>
                        <h3>Organization</h3>
                        <p class="cleared"><i class='bx bx-check-circle'></i> Cleared</p>
                    </div>
                    <div class="personels">
                        <h2>PHICCS</h2>
                        <h3>Organization</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                    <div class="personels">
                        <h2>CSC Gender Club</h2>
                        <h3>Organization</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                    <div class="personels">
                        <h2>Rhamrhem Jaafar</h2>
                        <h3>Adviser</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                    <div class="personels">
                        <h2>Mr. Jaydee C. Ballaho, MIT</h2>
                        <h3>Department Head</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                    <div class="personels">
                        <h2>Asst Prof Marjorie A. Rojas</h2>
                        <h3>Student Affairs Coordinator, CCS</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                    <div class="personels">
                        <h2>Dr. Mark L. Flores</h2>
                        <h3>College Dean CCS</h3>
                        <p class="pendings"><i class='bx bx-time-five'></i> Pending</p>
                    </div>
                </div>
            </div>
        </section>

        <!-- First Login Modal -->
        <div class="first-login-overlay" id="firstLoginModal" aria-hidden="true">
            <div class="first-login-modal-container" role="dialog" aria-modal="true" aria-labelledby="firstLoginModalTitle">
                <div class="first-login-modal-content">
                    <h2 id="firstLoginModalTitle">Complete Your Profile</h2>
                    <p class="first-login-subtitle">Please provide the following information to personalize your experience.</p>
                    
                    <form id="firstLoginForm">
                        <div class="first-login-form-group">
                            <label for="profileReligion">Religion <span class="required">*</span></label>
                            <select id="profileReligion" required>
                                <option value="">Select Religion</option>
                                <option value="Roman Catholic">Roman Catholic</option>
                                <option value="Muslim/Islam">Muslim/Islam</option>
                                <option value="Iglesia ni Cristo">Iglesia ni Cristo</option>
                                <option value="Born Again Christian">Born Again Christian</option>
                                <option value="Seventh Day Adventist">Seventh Day Adventist</option>
                                <option value="Philippine Independent Church (Aglipayan)">Philippine Independent Church (Aglipayan)</option>
                                <option value="Judaism">Judaism</option>
                                <option value="Buddhism">Buddhism</option>
                                <option value="Hinduism">Hinduism</option>
                                <option value="Other">Other</option>
                            </select>
                            <span class="first-login-error" id="religionError"></span>
                        </div>

                        <div class="first-login-form-group">
                            <label for="profilePhoneNumber">Phone Number <span class="optional">(optional)</span></label>
                            <input type="tel" id="profilePhoneNumber" placeholder="e.g. 09171234567">
                        </div>

                        <button type="submit" class="first-login-submit-btn">Complete Profile</button>
                    </form>
                </div>
            </div>
        </div>

        <div class="promissory-modal-overlay" id="promissoryModal" aria-hidden="true">
            <div class="promissory-modal-container" role="dialog" aria-modal="true" aria-labelledby="promissoryModalTitle">
                <div class="promissory-modal-header">
                    <h3 id="promissoryModalTitle">Promissory Note Request</h3>
                    <button type="button" class="promissory-close" id="promissoryCloseBtn" aria-label="Close promissory request">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                <div class="promissory-modal-body">
                    <div class="promissory-form-group">
                        <label for="promissoryFeeName">Fee Name</label>
                        <input type="text" id="promissoryFeeName" readonly>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryReason">Reason <span class="required">*</span></label>
                        <textarea id="promissoryReason" rows="4" placeholder="Explain your reason for requesting a promissory note"></textarea>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryPartialAmount">Partial Payment Amount (optional)</label>
                        <div class="input-prefix promissory-input-prefix">
                            <span>₱</span>
                            <input type="number" id="promissoryPartialAmount" min="0" step="0.01" placeholder="0.00">
                        </div>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryDate">Promised Payment Date <span class="required">*</span></label>
                        <input type="date" id="promissoryDate">
                    </div>
                </div>
                <div class="promissory-modal-footer">
                    <button type="button" class="btn-cancel" id="promissoryCancelBtn">Cancel</button>
                    <button type="button" class="btn-submit" id="promissorySubmitBtn">Submit Request</button>
                </div>
            </div>
        </div>

        <script src="../../assets/scripts/settings.js"></script>
        <script src="../../assets/scripts/sample-accounts.js"></script>
        <script src="../../assets/scripts/auth.js"></script>
        <script src="../../assets/scripts/script.js"></script>
        <script>
            (function () {
                const FEES_STORAGE_KEY = 'ccs.organization.fees';
                const PROMISSORY_STORAGE_KEY = window.CCSStudentDataHelpers && typeof window.CCSStudentDataHelpers.getStudentDataStorageKey === 'function'
                    ? window.CCSStudentDataHelpers.getStudentDataStorageKey('PROMISSORY_STORAGE_KEY')
                    : (window.CCSStudentDataKeys && window.CCSStudentDataKeys.PROMISSORY_STORAGE_KEY);
                const STUDENT_FEE_STATUS_KEY = 'ccs.student.feeStatus';

                const DEFAULT_FEES = [
                    {
                        id: 'fee-default-csc',
                        name: 'CSC Fee',
                        description: 'College Student Council Fee',
                        amount: 200,
                        dueDate: '2026-02-15',
                        isActive: true,
                        feeType: 'mandatory',
                        appliesTo: 'all',
                        orgId: 'u-org-001'
                    },
                    {
                        id: 'fee-default-gender',
                        name: 'Gender Club',
                        description: 'Gender Club Membership Fee',
                        amount: 50,
                        dueDate: '2026-02-15',
                        isActive: true,
                        feeType: 'voluntary',
                        appliesTo: 'all',
                        orgId: 'u-org-001'
                    },
                    {
                        id: 'fee-default-msa',
                        name: 'MSA Fee',
                        description: 'Muslim Students Association Fee',
                        amount: 50,
                        dueDate: '2026-02-15',
                        isActive: true,
                        feeType: 'voluntary',
                        appliesTo: 'Muslim/Islam',
                        orgId: 'org-msa-001'
                    },
                    {
                        id: 'fee-default-misc',
                        name: 'Miscellaneous',
                        description: 'Miscellaneous Supplies',
                        amount: 60,
                        dueDate: '2026-02-15',
                        isActive: true,
                        feeType: 'mandatory',
                        appliesTo: 'all',
                        orgId: 'u-org-001'
                    }
                ];

                let selectedFee = null;

                function getCurrentUser() {
                    return window.Auth && typeof window.Auth.getUser === 'function'
                        ? window.Auth.getUser()
                        : null;
                }

                function readJsonArray(key) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
                        return Array.isArray(parsed) ? parsed : [];
                    } catch (_err) {
                        return [];
                    }
                }

                function readJsonObject(key) {
                    try {
                        const parsed = JSON.parse(localStorage.getItem(key) || '{}');
                        return parsed && typeof parsed === 'object' ? parsed : {};
                    } catch (_err) {
                        return {};
                    }
                }

                function formatCurrency(value) {
                    return new Intl.NumberFormat('en-PH', {
                        style: 'currency',
                        currency: 'PHP'
                    }).format(Number(value) || 0);
                }

                function formatDueDate(value) {
                    if (!value) return '-';
                    const parsed = new Date(value);
                    if (Number.isNaN(parsed.getTime())) return value;
                    return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
                }

                function normalizeReligion(value) {
                    return String(value || '').trim().toLowerCase();
                }

                function normalizeAppliesToValue(appliesTo, specificReligion) {
                    const normalized = String(appliesTo || 'all').trim().toLowerCase();
                    if (normalized === 'muslim' || normalized === 'muslim/islam') return 'muslim';
                    if (normalized === 'catholic') return 'catholic';
                    if (normalized === 'specific') {
                        return String(specificReligion || '').trim() ? 'specific' : 'all';
                    }
                    return 'all';
                }

                function feeAppliesToStudent(fee, user) {
                    const appliesTo = normalizeAppliesToValue(fee.appliesTo, fee.specificReligion);
                    if (appliesTo === 'all') return true;

                    const studentReligion = normalizeReligion(user && user.religion ? user.religion : '');
                    if (!studentReligion) return false;

                    if (appliesTo === 'specific') {
                        return studentReligion === normalizeReligion(fee.specificReligion || '');
                    }

                    // Handle Muslim/Islam comparison - normalize both sides
                    if (appliesTo === 'muslim') {
                        return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
                    }

                    return studentReligion === appliesTo;
                }

                function normalizeFee(fee) {
                    return {
                        id: fee.id || ('fee-' + Date.now()),
                        name: String(fee.name || '').trim(),
                        description: String(fee.description || '').trim(),
                        amount: Number(fee.amount) || 0,
                        dueDate: fee.dueDate || '',
                        isActive: fee.isActive !== false,
                        feeType: fee.feeType === 'voluntary' ? 'voluntary' : 'mandatory',
                        appliesTo: normalizeAppliesToValue(fee.appliesTo, fee.specificReligion),
                        specificReligion: String(fee.specificReligion || '').trim(),
                        orgId: fee.orgId || 'u-org-001'
                    };
                }

                function getFees() {
                    const stored = readJsonArray(FEES_STORAGE_KEY).map(normalizeFee);
                    const source = stored.length ? stored : DEFAULT_FEES.map(normalizeFee);
                    const user = getCurrentUser();
                    return source.filter(function (fee) {
                        return fee.isActive && String(fee.name || '').toLowerCase() !== 'insurance' && feeAppliesToStudent(fee, user);
                    });
                }

                function getStudentRequests(studentId) {
                    if (!window.getStudentPromissoryRequests) return [];
                    return window.getStudentPromissoryRequests(studentId);
                }

                function getLatestRequestByFee(studentId) {
                    const latestByFee = new Map();
                    getStudentRequests(studentId).forEach(function (request) {
                        const existing = latestByFee.get(request.feeId);
                        if (!existing) {
                            latestByFee.set(request.feeId, request);
                            return;
                        }
                        const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
                        const requestTime = new Date(request.updatedAt || request.createdAt || 0).getTime();
                        if (requestTime >= existingTime) {
                            latestByFee.set(request.feeId, request);
                        }
                    });
                    return latestByFee;
                }

                function statusKey(studentId, feeId) {
                    return `${studentId}::${feeId}`;
                }

                function getFeeStatusMap() {
                    return readJsonObject(STUDENT_FEE_STATUS_KEY);
                }

                function getPromissoryBadge(request) {
                    if (!request) return '';
                    if (request.status === 'Pending Review') {
                        return '<span class="fee-pill fee-pill-pending-review">Promissory Pending</span>';
                    }
                    if (request.status === 'Promissory Approved') {
                        return '<span class="fee-pill fee-pill-promissory-approved">Promissory Approved</span>';
                    }
                    if (request.status === 'Promissory Rejected') {
                        return '<span class="fee-pill fee-pill-promissory-rejected">Promissory Rejected</span>';
                    }
                    return '';
                }

                function updateClearanceProgress(fees, latestRequestByFee, studentId) {
                    const statusMap = getFeeStatusMap();
                    const mandatoryFees = fees.filter(function (fee) {
                        return fee.feeType !== 'voluntary';
                    });

                    let completed = 0;
                    mandatoryFees.forEach(function (fee) {
                        const paid = statusMap[statusKey(studentId, fee.id)] === 'paid';
                        const request = latestRequestByFee.get(fee.id);
                        const promissoryApproved = request && request.status === 'Promissory Approved';

                        if (paid || promissoryApproved) {
                            completed += 1;
                        }
                    });

                    const total = mandatoryFees.length;
                    const pending = Math.max(total - completed, 0);
                    const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

                    const circumference = 251.2;
                    const filled = (percentage / 100) * circumference;

                    document.querySelector('.labels .completed h1').textContent = String(completed);
                    document.querySelector('.labels .pending h1').textContent = String(pending);
                    document.querySelector('.clearance-content.progress p').textContent = `${completed} of ${total} Requirements Completed`;

                    document.querySelector('.progress-circle-wrapper circle:nth-child(2)')
                        ?.setAttribute('stroke-dasharray', `${filled} ${circumference}`);
                    document.querySelector('.progress-circle-wrapper text').textContent = `${percentage}%`;
                }

                function renderOutstandingFees() {
                    const user = getCurrentUser();
                    const studentId = user && user.studentId ? user.studentId : 'anonymous-student';
                    const studentName = user && user.name ? user.name : 'Student';
                    const fees = getFees();
                    const latestRequestByFee = getLatestRequestByFee(studentId);
                    const feeStatusMap = getFeeStatusMap();
                    const payments = window.getStudentPayments
                        ? window.getStudentPayments(studentId)
                        : [];
                    const listEl = document.getElementById('outstandingFeeList');

                    if (!fees.length) {
                        listEl.innerHTML = '<li class="fee-empty">No outstanding fees.</li>';
                        document.getElementById('outstandingTotal').textContent = formatCurrency(0);
                        document.getElementById('outstandingDueLabel').textContent = 'Due: -';
                        updateClearanceProgress([], latestRequestByFee, studentId);
                        return;
                    }

                    // compute remaining balances per fee using confirmed payments (with rounding)
                    let totalOutstanding = 0;
                    const paymentsByFee = {};
                    payments.forEach(function (p) {
                        try {
                            const status = String(p.status || 'Confirmed').toLowerCase();
                            if (status !== 'confirmed') return;
                            const amt = String(p.amount || '').replace(/[^0-9\.\-]/g, '');
                            const amountNum = Number(amt) || 0;
                            const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                            feeIds.forEach(function (fid) {
                                const key = String(fid || '');
                                if (!key) return;
                                paymentsByFee[key] = (paymentsByFee[key] || 0) + amountNum;
                            });
                        } catch (e) {}
                    });

                    fees.forEach(function (fee) {
                        const key = String(fee.id || '');
                        const paid = Math.round((paymentsByFee[key] || 0) * 100) / 100;
                        const remaining = Math.max(Math.round((Number(fee.amount) - paid) * 100) / 100, 0);
                        totalOutstanding += remaining;
                    });

                    // Round total outstanding to 2 decimals
                    totalOutstanding = Math.round(totalOutstanding * 100) / 100;

                    const earliestDue = fees
                        .map(function (fee) { return fee.dueDate; })
                        .filter(Boolean)
                        .sort()[0];

                    document.getElementById('outstandingTotal').textContent = formatCurrency(totalOutstanding);
                    document.getElementById('outstandingDueLabel').textContent = `Due: ${formatDueDate(earliestDue)}`;

                    listEl.innerHTML = fees.map(function (fee) {
                        const typeClass = fee.feeType === 'voluntary' ? 'fee-pill-optional' : 'fee-pill-required';
                        const typeText = fee.feeType === 'voluntary' ? 'Optional' : 'Required';
                        const latestRequest = latestRequestByFee.get(fee.id);
                        const isPendingReview = latestRequest && latestRequest.status === 'Pending Review';
                        const isPromissoryApproved = latestRequest && latestRequest.status === 'Promissory Approved';
                        const isPromissoryRejected = latestRequest && latestRequest.status === 'Promissory Rejected';
                        const shouldHidePayNow = isPendingReview || isPromissoryApproved;
                        const feeStatus = feeStatusMap[statusKey(studentId, fee.id)] || '';
                        const paidBadge = feeStatus === 'paid' ? '<span class="fee-pill fee-pill-paid">Paid</span>' : '';
                        const pendingBadge = feeStatus === 'pending verification' ? '<span class="fee-pill fee-pill-pending-review">Pending Verification</span>' : '';
                        const rejectedPayment = payments.find(function (payment) {
                            const feeIds = Array.isArray(payment.feeIds) ? payment.feeIds : (payment.feeId ? [payment.feeId] : []);
                            return String(payment.status || '').toLowerCase() === 'rejected' && feeIds.some(function (feeId) {
                                return String(feeId || '') === String(fee.id);
                            });
                        });
                        const rejectedBadge = feeStatus === 'rejected' ? '<span class="fee-pill fee-pill-promissory-rejected">Rejected</span>' : '';
                        const rejectionReason = rejectedPayment && rejectedPayment.rejectionReason ? `<div class="payment-rejection-reason">${rejectedPayment.rejectionReason}</div>` : '';

                        // Build promissory status row
                        let promissoryStatusRow = '';
                        if (isPendingReview) {
                            promissoryStatusRow = '<div class="fee-status-row"><span class="fee-pill fee-pill-pending-review">PROMISSORY PENDING</span></div>';
                        } else if (isPromissoryApproved) {
                            promissoryStatusRow = '<div class="fee-status-row"><span class="fee-pill fee-pill-promissory-approved">PROMISSORY APPROVED</span></div>';
                        }

                        // Build buttons/links row
                        let buttonsRow = '';
                        if (!shouldHidePayNow && !paidBadge) {
                            buttonsRow += `<button type="button" class="pay-now-btn" data-fee-id="${fee.id}" data-fee-name="${fee.name}" data-fee-amount="${fee.amount}" data-org-id="${fee.orgId || 'u-org-001'}">Pay Now</button>`;
                        }
                        if (!isPendingReview) {
                            buttonsRow += `<a class="promissory-link fee-action-promissory" data-fee-id="${fee.id}" data-fee-name="${fee.name}" data-student-id="${studentId}" data-student-name="${studentName}">Request promissory note</a>`;
                        }

                        // compute paid/remaining for display
                        const key = String(fee.id || '');
                        const byId = paymentsByFee[key] || 0;
                        const paidAmount = Math.max(byId, 0);
                        const remainingAmount = Math.max(Number(fee.amount) - paidAmount, 0);

                        // show partially paid indicator
                        const partialPaidIndicator = paidAmount > 0 && remainingAmount > 0
                            ? `<div class="fee-partial">Partially paid: ${formatCurrency(paidAmount)}</div>`
                            : paidAmount > 0 && remainingAmount <= 0
                                ? `<div class="fee-partial">Fully paid</div>`
                                : '';

                        return `
                            <li data-fee-id="${fee.id}">
                                <div class="fee-line">
                                    <div class="fee-line-left">
                                        <span class="fee-name">${fee.name}</span>
                                        <span class="fee-pill ${typeClass}">${typeText}</span>
                                        ${paidBadge}
                                        ${pendingBadge}
                                        ${rejectedBadge}
                                    </div>
                                    <span class="fee-amount">${formatCurrency(remainingAmount)}</span>
                                </div>
                                ${promissoryStatusRow}
                                ${partialPaidIndicator}
                                ${rejectionReason}
                                <div class="fee-actions-row">${buttonsRow}</div>
                            </li>
                        `;
                    }).join('');

                    updateClearanceProgress(fees, latestRequestByFee, studentId);

                    document.querySelectorAll('.pay-now-btn').forEach(function (button) {
                        button.addEventListener('click', function () {
                            const feeId = button.dataset.feeId;
                            const feeObj = fees.find(function (f) { return String(f.id) === String(feeId); }) || {};
                            const feeAmount = Number(feeObj.amount) || 0;

                            // compute paid for this fee
                            const byId = paymentsByFee[String(feeId)] || 0;
                            const byName = paymentsByFee[String(feeObj.name || '').toLowerCase()] || 0;
                            const paidAmount = Math.max(byId, byName, 0);
                            const remaining = Math.max(feeAmount - paidAmount, 0);

                            // if there's an approved promissory with partial amount, prefill to that partial (bounded by remaining)
                            const latestReq = latestRequestByFee.get(feeId);
                            const promPartial = latestReq && latestReq.status === 'Promissory Approved' && latestReq.partialAmount ? Number(latestReq.partialAmount) : null;
                            const prefill = promPartial !== null ? Math.min(promPartial, remaining) : remaining;

                            const selectedFee = [{
                                feeId: feeId,
                                fee: button.dataset.feeName,
                                price: Number(prefill) || 0,
                                orgId: button.dataset.orgId || 'u-org-001'
                            }];
                            localStorage.setItem('ccs.selected.fees', JSON.stringify(selectedFee));
                            window.location.href = 'make-payment.html';
                        });
                    });

                    document.querySelectorAll('.fee-action-promissory').forEach(function (button) {
                        button.addEventListener('click', function () {
                            if (button.getAttribute('aria-disabled') === 'true') {
                                return;
                            }
                            selectedFee = {
                                feeId: button.dataset.feeId,
                                feeName: button.dataset.feeName,
                                studentId: button.dataset.studentId,
                                studentName: button.dataset.studentName,
                                studentNumber: button.dataset.studentId
                            };
                            openPromissoryModal();
                        });
                    });
                }

                function openPromissoryModal() {
                    if (!selectedFee) return;
                    document.getElementById('promissoryFeeName').value = selectedFee.feeName;
                    document.getElementById('promissoryReason').value = '';
                    document.getElementById('promissoryPartialAmount').value = '';
                    document.getElementById('promissoryDate').value = '';

                    const modal = document.getElementById('promissoryModal');
                    modal.classList.add('active');
                    modal.setAttribute('aria-hidden', 'false');
                }

                function closePromissoryModal() {
                    const modal = document.getElementById('promissoryModal');
                    modal.classList.remove('active');
                    modal.setAttribute('aria-hidden', 'true');
                    selectedFee = null;
                }

                function submitPromissoryRequest() {
                    if (!selectedFee) return;

                    const reason = document.getElementById('promissoryReason').value.trim();
                    const promisedDate = document.getElementById('promissoryDate').value;
                    const partialRaw = document.getElementById('promissoryPartialAmount').value;
                    const partialAmount = partialRaw === '' ? null : Number(partialRaw);

                    if (!reason || !promisedDate) {
                        alert('Please complete the required fields.');
                        return;
                    }

                    if (partialAmount !== null && (Number.isNaN(partialAmount) || partialAmount < 0)) {
                        alert('Please enter a valid partial payment amount.');
                        return;
                    }

                    if (!PROMISSORY_STORAGE_KEY) {
                        alert('Promissory storage is unavailable. Please refresh and try again.');
                        return;
                    }

                    const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
                    requests.push({
                        id: 'promissory-' + Date.now(),
                        feeId: selectedFee.feeId,
                        feeName: selectedFee.feeName,
                        studentId: selectedFee.studentId,
                        studentNumber: selectedFee.studentNumber,
                        studentName: selectedFee.studentName,
                        reason: reason,
                        partialAmount: partialAmount,
                        promisedDate: promisedDate,
                        status: 'Pending Review',
                        createdAt: new Date().toISOString(),
                        updatedAt: new Date().toISOString()
                    });

                    localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));
                    closePromissoryModal();
                    renderOutstandingFees();
                }

                document.getElementById('promissoryCloseBtn').addEventListener('click', closePromissoryModal);
                document.getElementById('promissoryCancelBtn').addEventListener('click', closePromissoryModal);
                document.getElementById('promissorySubmitBtn').addEventListener('click', submitPromissoryRequest);
                document.getElementById('promissoryModal').addEventListener('click', function (event) {
                    if (event.target === this) {
                        closePromissoryModal();
                    }
                });

                // Payments filter dropdown handler
                const paymentsFilterSelect = document.getElementById('payments-filter');
                const paymentsListContainer = document.getElementById('payments-list-container');

                function renderStudentPaymentsInPanel(filterValue) {
                    const user = getCurrentUser();
                    const studentId = user && user.studentId ? user.studentId : null;

                    if (!studentId) {
                        paymentsListContainer.innerHTML = '<p class="summary-empty">Unable to load payment history</p>';
                        return;
                    }

                    const allPayments = window.getStudentPayments ? window.getStudentPayments(studentId) : [];
                    const now = new Date();
                    const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

                    const filteredPayments = allPayments.filter(function (payment) {
                        const paymentDate = new Date(String(payment.dateSubmitted || payment.date || '') + 'T00:00:00');
                        const paymentStatus = String(payment.status || 'Confirmed').toLowerCase();

                        if (filterValue === 'pending') {
                            return paymentStatus === 'pending verification';
                        }

                        return paymentStatus === 'confirmed' && paymentDate >= recentThreshold;
                    });

                    if (!filteredPayments.length) {
                        paymentsListContainer.innerHTML = filterValue === 'pending'
                            ? '<p class="summary-empty">No pending payments</p>'
                            : '<p class="summary-empty">No payments found</p>';
                        return;
                    }

                    let html = '<table class="payments-table" style="width: 100%; font-size: 12px; border-collapse: collapse;">';
                    html += '<thead style="background: #f5f5f5;"><tr>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Fee Name</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Amount</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>';
                    html += '</tr></thead><tbody>';

                    filteredPayments.forEach(function (payment) {
                        const paymentDate = payment.dateSubmitted || payment.date || '-';
                        const amount = payment.amount ? `₱${Number(String(payment.amount).replace(/[^0-9.\-]/g, '') || 0).toFixed(2)}` : '₱0.00';
                        const statusText = String(payment.status || 'Confirmed');

                        html += '<tr style="border-bottom: 1px solid #eee;">';
                        html += `<td style="padding: 8px;">${payment.feeName || payment.desc || 'Payment'}</td>`;
                        html += `<td style="padding: 8px; font-size: 11px; color: #666;">${paymentDate}</td>`;
                        html += `<td style="padding: 8px;">${amount}</td>`;
                        html += `<td style="padding: 8px; font-size: 11px;">${statusText}</td>`;
                        html += '</tr>';
                    });

                    html += '</tbody></table>';
                    paymentsListContainer.innerHTML = html;
                }

                function renderPromissoryNotesInPanel() {
                    const user = getCurrentUser();
                    const studentId = user && user.studentId ? user.studentId : null;
                    const studentReligion = user && user.religion ? String(user.religion || '').trim().toLowerCase() : '';

                    if (!studentId) {
                        paymentsListContainer.innerHTML = '<p class="summary-empty">Unable to load promissory notes</p>';
                        return;
                    }

                    const studentRequests = window.getStudentPromissoryRequests ? window.getStudentPromissoryRequests(studentId) : [];
                    const filteredRequests = studentRequests.filter(function (req) {
                        if (String(req.feeName || '').toLowerCase().includes('msa')) {
                            return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
                        }
                        return true;
                    });

                    if (filteredRequests.length === 0) {
                        paymentsListContainer.innerHTML = '<p class="summary-empty">No promissory note requests</p>';
                        return;
                    }

                    let html = '<table class="payments-table" style="width: 100%; font-size: 12px; border-collapse: collapse;">';
                    html += '<thead style="background: #f5f5f5;"><tr>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Fee Name</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Amount</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date Requested</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Reason</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Promised Date</th>';
                    html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>';
                    html += '</tr></thead><tbody>';

                    filteredRequests.forEach(function (req) {
                        const createdDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                        const promisedDate = req.promisedDate ? new Date(req.promisedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
                        const amount = req.partialAmount ? `₱${Number(req.partialAmount).toFixed(2)}` : (function () {
                            try {
                                const fees = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]');
                                const found = fees.find(function (fee) { return String(fee.id || '') === String(req.feeId || ''); }) || fees.find(function (fee) { return String(fee.name || '').toLowerCase() === String(req.feeName || '').toLowerCase(); });
                                return found ? `₱${Number(found.amount || 0).toFixed(2)}` : 'Full Payment';
                            } catch (_error) {
                                return 'Full Payment';
                            }
                        })();
                        const statusText = req.status || 'Pending Review';

                        html += '<tr style="border-bottom: 1px solid #eee;">';
                        html += `<td style="padding: 8px;">${String(req.feeName || '').substring(0, 20)}</td>`;
                        html += `<td style="padding: 8px;">${amount}</td>`;
                        html += `<td style="padding: 8px; font-size: 11px; color: #666;">${createdDate}</td>`;
                        html += `<td style="padding: 8px; font-size: 11px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${req.reason}">${String(req.reason || '').substring(0, 20)}</td>`;
                        html += `<td style="padding: 8px; font-size: 11px; color: #666;">${promisedDate}</td>`;
                        html += `<td style="padding: 8px;">${statusText}</td>`;
                        html += '</tr>';
                    });

                    html += '</tbody></table>';
                    paymentsListContainer.innerHTML = html;
                }

                if (paymentsFilterSelect) {
                    paymentsFilterSelect.addEventListener('change', function () {
                        const filterValue = this.value;
                        if (filterValue === 'promissory') {
                            renderPromissoryNotesInPanel();
                        } else {
                            renderStudentPaymentsInPanel(filterValue);
                        }
                    });

                    renderStudentPaymentsInPanel(paymentsFilterSelect.value || 'recent');
                }

                // Expose for external calls
                window.renderStudentFees = renderOutstandingFees;
                
                renderOutstandingFees();
            })();
        </script>

        <script>
            /* First Login Modal Logic */
            (function () {
                const firstLoginModal = document.getElementById('firstLoginModal');
                const firstLoginForm = document.getElementById('firstLoginForm');
                const profileReligion = document.getElementById('profileReligion');
                const profilePhoneNumber = document.getElementById('profilePhoneNumber');
                const religionError = document.getElementById('religionError');

                function showFirstLoginModal() {
                    const user = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : null;
                    if (user && user.isFirstLogin === true) {
                        firstLoginModal.classList.add('show');
                        firstLoginModal.setAttribute('aria-hidden', 'false');
                        // Prevent interactions with page content behind the modal
                        document.body.style.overflow = 'hidden';
                    }
                }

                function closeFirstLoginModal() {
                    firstLoginModal.classList.remove('show');
                    firstLoginModal.setAttribute('aria-hidden', 'true');
                    document.body.style.overflow = '';
                }

                function handleFormSubmit(event) {
                    event.preventDefault();
                    
                    const selectedReligion = profileReligion.value.trim();
                    const phoneNumber = profilePhoneNumber.value.trim();

                    // Clear previous error
                    religionError.classList.remove('show');
                    religionError.textContent = '';

                    // Validate religion
                    if (!selectedReligion) {
                        religionError.textContent = 'Religion is required';
                        religionError.classList.add('show');
                        return;
                    }

                    // Save profile data
                    if (window.Auth && typeof window.Auth.updateCurrentUserProfile === 'function') {
                        const result = window.Auth.updateCurrentUserProfile({
                            religion: selectedReligion,
                            phoneNumber: phoneNumber,
                            isFirstLogin: false
                        });

                        if (result.ok) {
                            closeFirstLoginModal();
                            // Re-render fees based on new religion
                            if (typeof window.renderStudentFees === 'function') {
                                window.renderStudentFees();
                            }
                        } else {
                            religionError.textContent = 'Failed to save profile. Please try again.';
                            religionError.classList.add('show');
                        }
                    }
                }

                // Event listeners
                firstLoginForm.addEventListener('submit', handleFormSubmit);

                // Show modal on page load if needed
                document.addEventListener('DOMContentLoaded', showFirstLoginModal);
                
                // Also try to show it if DOM is already loaded
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', showFirstLoginModal);
                } else {
                    showFirstLoginModal();
                }
            })();

            /* Update dashboard and sidebar with logged-in student info */
            (function () {
                function updateStudentInfo() {
                    const user = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : null;
                    if (!user) return;

                    // Update dashboard welcome message
                    const welcomeEl = document.getElementById('dashboardWelcome');
                    if (welcomeEl) {
                        welcomeEl.textContent = `Welcome back, ${user.name || 'Student'}!`;
                    }

                    // Update sidebar profile name and student ID
                    const profileNameEl = document.getElementById('sidebarProfileName');
                    const studentIdEl = document.getElementById('sidebarStudentId');
                    if (profileNameEl) {
                        profileNameEl.textContent = user.name || 'Student';
                    }
                    if (studentIdEl) {
                        studentIdEl.textContent = user.studentId || '0000000000';
                    }
                }

                // Update on page load
                if (document.readyState === 'loading') {
                    document.addEventListener('DOMContentLoaded', updateStudentInfo);
                } else {
                    updateStudentInfo();
                }
            })();

            /* Notification badge system for promissory notes */
            (function () {
                const badgeEl = document.getElementById('notificationBadge');
                if (badgeEl) {
                    badgeEl.textContent = '3';
                    badgeEl.style.display = 'flex';
                }
            })();
        </script>

    </body>
</html>
```

## pages/student/make-payment.html
```html
<!DOCTYPE html>
<html lang="en" dir="ltr">
    <head>
        <meta charset="UTF-8">
        <title> CCS PAY++ - Finance </title>
        <link rel="stylesheet" href="../../styles/student-styles/payment-process.css">
        <link rel="stylesheet" href="../../styles/sidebar.css">
        <!-- Boxiocns CDN Link -->
        <link href='https://unpkg.com/boxicons@2.0.7/css/boxicons.min.css' rel='stylesheet'>
        <link rel="stylesheet" href="../../styles/settings.css">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
            /* Hide number input spinners */
            .fee-payment-amount {
                -moz-appearance: textfield;
            }

            .fee-payment-amount::-webkit-outer-spin-button,
            .fee-payment-amount::-webkit-inner-spin-button {
                -webkit-appearance: none;
                margin: 0;
            }
        </style>
    </head>
    <body>
        <nav class="navbar page-header payment-header">
            <a href="student-dashboard.html" class="back-arrow"><i class="bx bx-arrow-back"></i></a>
            <div class="nav-title">
                <h2>Make Payment</h2>
                <p>Complete your fee payment securely</p>
            </div>
        </nav>
        <div id="payment-process-container" class="step-indicator">
            <div class="vis-container">
                <div class="circle c1 step-circle"><p>1</p></div>
                <p class="texts t1 step-label">Select Fees</p>
            </div>
            <div class="line l1 step-line"></div>
            
            <div class="vis-container">
                <div class="circle c2 step-circle"><p>2</p></div>
                <p class="texts t2 step-label">Payment Method</p>
            </div>
            
            <div class="line l2 step-line"></div>
            
            <div class="vis-container">
                <div class="circle c3 step-circle"><p>3</p></div>
                <p class="texts t3 step-label">Confirmation</p>
            </div>
        
        </div>

        <div class="step-one-wrapper payment-body payment-layout payment-content">
            <div class="fee-selection-container fees-panel fee-selection">
                <form action="">   
                    <h3>Select Fees to Pay</h3> 
                    <div id="makePaymentFeeList"></div>
                    <p id="multiOrgNotice" class="summary-empty" style="display:none; margin-top:12px;"></p>
                </form>
            </div>

            <div class="payment-summary summary-panel">
                <h3>Payment Summary</h3>
                <div id="summary-items">
                    <p class="summary-empty">No fees selected yet.</p>
                </div>
                <div class="summary-total">
                    <span>Total Amount</span>
                    <span id="summary-total-amount">₱0</span>
                </div>
                <div class="action-buttons payment-actions">
                    <a class="continue-btn" href="payment-method.html">Continue to Payment Method</a>
                </div>
            </div>
        </div>

        <div class="promissory-modal-overlay" id="promissoryModal" aria-hidden="true">
            <div class="promissory-modal-container" role="dialog" aria-modal="true" aria-labelledby="promissoryModalTitle">
                <div class="promissory-modal-header">
                    <h3 id="promissoryModalTitle">Promissory Note Request</h3>
                    <button type="button" class="promissory-close" id="promissoryCloseBtn" aria-label="Close promissory request">
                        <i class='bx bx-x'></i>
                    </button>
                </div>
                <div class="promissory-modal-body">
                    <div class="promissory-form-group">
                        <label for="promissoryFeeName">Fee Name</label>
                        <input type="text" id="promissoryFeeName" readonly>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryReason">Reason <span class="required">*</span></label>
                        <textarea id="promissoryReason" rows="4" placeholder="Explain your reason for requesting a promissory note"></textarea>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryPartialAmount">Partial Payment Amount (optional)</label>
                        <div class="promissory-input-prefix">
                            <span>₱</span>
                            <input type="number" id="promissoryPartialAmount" min="0" step="0.01" placeholder="0.00">
                        </div>
                    </div>
                    <div class="promissory-form-group">
                        <label for="promissoryDate">Promised Payment Date <span class="required">*</span></label>
                        <input type="date" id="promissoryDate">
                    </div>
                </div>
                <div class="promissory-modal-footer">
                    <button type="button" class="btn-cancel" id="promissoryCancelBtn">Cancel</button>
                    <button type="button" class="btn-submit" id="promissorySubmitBtn">Submit Request</button>
                </div>
            </div>
        </div>

    <script src="../../assets/scripts/settings.js"></script>
    <script src="../../assets/scripts/sample-accounts.js"></script>
    <script src="../../assets/scripts/auth.js"></script>
    <script src="../../assets/scripts/script.js"></script>
    <script>
        const FEES_STORAGE_KEY = 'ccs.organization.fees';
        const PROMISSORY_STORAGE_KEY = window.CCSStudentDataHelpers && typeof window.CCSStudentDataHelpers.getStudentDataStorageKey === 'function'
            ? window.CCSStudentDataHelpers.getStudentDataStorageKey('PROMISSORY_STORAGE_KEY')
            : (window.CCSStudentDataKeys && window.CCSStudentDataKeys.PROMISSORY_STORAGE_KEY);
        const feeListEl = document.getElementById('makePaymentFeeList');
        const multiOrgNoticeEl = document.getElementById('multiOrgNotice');
        const summaryItems = document.getElementById('summary-items');
        const totalAmountEl = document.getElementById('summary-total-amount');
        const continueBtn = document.querySelector('.continue-btn');
        let selectedFeeForPromissory = null;
            const SELECTED_PAYMENT_GROUPS_KEY = 'ccs.selected.paymentGroups';
            const SELECTED_PAYMENT_GROUP_INDEX_KEY = 'ccs.selected.paymentGroupIndex';
            const SELECTED_PAYMENT_CURRENT_GROUP_KEY = 'ccs.payment.currentGroup';

        const DEFAULT_FEES = [
            {
                id: 'fee-default-csc',
                name: 'CSC Fee',
                amount: 200,
                dueDate: '2026-02-15',
                isActive: true,
                feeType: 'mandatory',
                appliesTo: 'all',
                orgId: 'u-org-001'
            },
            {
                id: 'fee-default-gender',
                name: 'Gender Club Membership Fee',
                amount: 50,
                dueDate: '2026-02-15',
                isActive: true,
                feeType: 'voluntary',
                appliesTo: 'all',
                orgId: 'u-org-001'
            },
            {
                id: 'fee-default-msa',
                name: 'MSA Fee',
                amount: 50,
                dueDate: '2026-02-15',
                isActive: true,
                feeType: 'voluntary',
                appliesTo: 'Muslim/Islam',
                orgId: 'org-msa-001'
            },
            {
                id: 'fee-default-insurance',
                name: 'Insurance (Whole Year)',
                amount: 40,
                dueDate: '2026-02-15',
                isActive: true,
                feeType: 'mandatory',
                appliesTo: 'all',
                orgId: 'u-org-001'
            },
            {
                id: 'fee-default-misc',
                name: 'Miscellaneous (10 booklets @ ₱6 each)',
                amount: 60,
                dueDate: '2026-02-15',
                isActive: true,
                feeType: 'mandatory',
                appliesTo: 'all',
                orgId: 'u-org-001'
            }
        ];

        function readJsonArray(key) {
            try {
                const parsed = JSON.parse(localStorage.getItem(key) || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (_err) {
                return [];
            }
        }

        function normalizeFee(fee) {
            return {
                id: fee.id || ('fee-' + Date.now()),
                name: String(fee.name || '').trim(),
                amount: Number(fee.amount) || 0,
                dueDate: fee.dueDate || '',
                isActive: fee.isActive !== false,
                feeType: fee.feeType === 'voluntary' ? 'voluntary' : 'mandatory',
                appliesTo: normalizeAppliesToValue(fee.appliesTo, fee.specificReligion),
                specificReligion: String(fee.specificReligion || '').trim(),
                orgId: fee.orgId || 'u-org-001'
            };
        }

        function normalizeReligion(value) {
            return String(value || '').trim().toLowerCase();
        }

        function normalizeAppliesToValue(appliesTo, specificReligion) {
            const normalized = String(appliesTo || 'all').trim().toLowerCase();
            if (normalized === 'muslim' || normalized === 'muslim/islam') return 'muslim';
            if (normalized === 'catholic') return 'catholic';
            if (normalized === 'specific') {
                return String(specificReligion || '').trim() ? 'specific' : 'all';
            }
            return 'all';
        }

        function feeAppliesToStudent(fee, user) {
            const appliesTo = normalizeAppliesToValue(fee.appliesTo, fee.specificReligion);
            if (appliesTo === 'all') return true;

            const studentReligion = normalizeReligion(user && user.religion ? user.religion : '');
            if (!studentReligion) return false;

            if (appliesTo === 'specific') {
                return studentReligion === normalizeReligion(fee.specificReligion || '');
            }

            // Handle Muslim/Islam comparison - normalize both sides
            if (appliesTo === 'muslim') {
                return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
            }

            return studentReligion === appliesTo;
        }

        function getActiveFees() {
            const stored = readJsonArray(FEES_STORAGE_KEY).map(normalizeFee);
            const source = stored.length ? stored : DEFAULT_FEES.map(normalizeFee);
            const user = getCurrentUser();
            return source.filter(function (fee) {
                return fee.isActive && feeAppliesToStudent(fee, user);
            });
        }

        function formatDueDate(value) {
            if (!value) return '-';
            const date = new Date(value);
            if (Number.isNaN(date.getTime())) return value;
            return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
        }

        function getCurrentUser() {
            return window.Auth && typeof window.Auth.getUser === 'function'
                ? window.Auth.getUser()
                : null;
        }

        function getPreselectedFees() {
            try {
                const parsed = JSON.parse(localStorage.getItem('ccs.selected.fees') || '[]');
                return Array.isArray(parsed) ? parsed : [];
            } catch (_err) {
                return [];
            }
        }

        function renderFeeRows() {
            const fees = getActiveFees();
            const selectAllCheckbox = `
                <div class="fees-selection fee-item-card select-all-card">
                    <div class="fee-info">
                        <input type="checkbox" id="selectAllCheckbox">
                        <div class="cb">
                            <div class="fee-name-row">
                                <h3>Select All Fees</h3>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            
            // Build fee rows with editable amount input and remaining balance awareness
            const user = getCurrentUser();
            const studentId = user && user.studentId ? user.studentId : null;

            feeListEl.innerHTML = selectAllCheckbox + fees.map(function (fee) {
                const typeClass = fee.feeType === 'voluntary' ? 'fee-pill-optional' : 'fee-pill-required';
                const typeText = fee.feeType === 'voluntary' ? 'OPTIONAL' : 'REQUIRED';

                // compute total confirmed payments for this fee for current user (with rounding)
                let totalPaid = 0;
                if (window.getStudentPayments && studentId) {
                    const payments = window.getStudentPayments(studentId) || [];
                    payments.forEach(function (p) {
                        try {
                            const status = String(p.status || 'Confirmed').toLowerCase();
                            if (status !== 'confirmed') return;
                            const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                            const matches = feeIds.some(function (fid) { return String(fid || '') === String(fee.id); });
                            if (matches) {
                                const amt = String(p.amount || '').replace(/[^0-9\.\-]/g, '');
                                totalPaid += Number(amt) || 0;
                            }
                        } catch (e) {}
                    });
                }

                // Round to 2 decimal places
                totalPaid = Math.round(totalPaid * 100) / 100;
                const remaining = Math.max(Math.round((Number(fee.amount) - totalPaid) * 100) / 100, 0);

                // check for promissory status for this fee
                const studentPromissoryRequests = window.getStudentPromissoryRequests && studentId
                    ? window.getStudentPromissoryRequests(studentId)
                    : [];
                const requests = studentPromissoryRequests.filter(function (request) {
                    return String(request.feeId || '').trim() === String(fee.id).trim();
                });
                const latest = requests.sort(function(a,b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); })[0];
                const promissoryStatus = latest ? String(latest.status || '').toLowerCase() : null;
                const isPendingReview = promissoryStatus === 'pending review';
                const isPromissoryApproved = promissoryStatus === 'promissory approved';
                const isPromissoryRejected = promissoryStatus === 'promissory rejected';

                // if pending review: disable and show label
                if (isPendingReview) {
                    return `
                        <div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
                            <div class="fee-info">
                                <input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${fee.amount}" data-org-id="${fee.orgId || 'u-org-001'}" disabled>
                                <div class="cb">
                                    <div class="fee-name-row">
                                        <h3>${fee.name}</h3>
                                        <span class="fee-pill ${typeClass}">${typeText}</span>
                                    </div>
                                    <p>Due: ${formatDueDate(fee.dueDate)}</p>
                                </div>
                            </div>
                            <div style="display:flex; align-items:center; gap:8px;">
                                <div class="fee-prices" style="color:#f59e0b; font-weight:600;">Promissory Pending — awaiting approval</div>
                            </div>
                            <button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}" disabled style="opacity:0.5;">Request promissory note instead</button>
                        </div>
                    `;
                }

                // if approved with partial: show remaining and prefill
                let promissoryPartial = null;
                if (isPromissoryApproved && latest && latest.partialAmount) {
                    promissoryPartial = Number(latest.partialAmount);
                }
                const inputValue = promissoryPartial !== null && promissoryPartial > 0 ? Math.min(promissoryPartial, remaining) : (remaining > 0 ? remaining : 0);
                const isCleared = remaining <= 0;

                return `
                    <div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
                        <div class="fee-info">
                            <input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${fee.amount}" data-org-id="${fee.orgId || 'u-org-001'}" ${isCleared ? 'disabled' : ''}>
                            <div class="cb">
                                <div class="fee-name-row">
                                    <h3>${fee.name}</h3>
                                    <span class="fee-pill ${typeClass}">${typeText}</span>
                                </div>
                                <p>Due: ${formatDueDate(fee.dueDate)}</p>
                            </div>
                        </div>
                        <div style="display:flex; align-items:center; gap:8px;">
                            <div class="fee-prices">Remaining: ₱${Number(remaining).toFixed(2)}</div>
                            <div class="fee-pay-input" style="display:inline-block;">
                                <div style="display:flex; align-items:center; gap:6px;">
                                    <span>₱</span>
                                    <input type="number" class="fee-payment-amount" data-fee-id="${fee.id}" min="1" max="${Number(remaining).toFixed(2)}" step="0.01" value="${inputValue}" ${isCleared ? 'disabled' : 'disabled'} style="width:100px;">
                                </div>
                            </div>
                        </div>
                        <button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}">Request promissory note instead</button>
                    </div>
                `;
            }).join('');

            bindFeeEvents();
        }

        function getCheckboxes() {
            return Array.from(document.querySelectorAll('input[type="checkbox"][data-fee-id]'));
        }

        function getChecked() {
            return getCheckboxes().filter(cb => cb.checked);
        }

        function getSelectedFeeGroups() {
            const checked = getChecked().map(function (cb) {
                // prefer amount from input if present
                const input = document.querySelector(`.fee-payment-amount[data-fee-id="${cb.dataset.feeId}"]`);
                const price = input ? Number(input.value) : Number(cb.dataset.price);
                return {
                    feeId: cb.dataset.feeId,
                    fee: cb.dataset.fee,
                    price: Number(price) || 0,
                    orgId: cb.dataset.orgId || 'u-org-001'
                };
            });

            const groups = [];
            const groupMap = new Map();

            checked.forEach(function (fee) {
                const orgId = String(fee.orgId || 'u-org-001');
                if (!groupMap.has(orgId)) {
                    const group = {
                        orgId: orgId,
                        orgName: orgId === 'org-msa-001' ? 'Muslim Student Association' : 'CCS Student Council',
                        fees: [],
                        total: 0
                    };
                    groupMap.set(orgId, group);
                    groups.push(group);
                }

                const group = groupMap.get(orgId);
                group.fees.push(fee);
                group.total += Number(fee.price) || 0;
            });

            return groups;
        }

        function updateMultiOrgNotice() {
            if (!multiOrgNoticeEl) return;

            const groups = getSelectedFeeGroups();
            if (groups.length <= 1) {
                multiOrgNoticeEl.style.display = 'none';
                multiOrgNoticeEl.textContent = '';
                return;
            }

            multiOrgNoticeEl.style.display = '';
            multiOrgNoticeEl.textContent = `Your selected fees belong to ${groups.length} organizations and will be processed as ${groups.length} separate payments.`;
        }

        function updateSummary() {
            const checked = getChecked();
            summaryItems.innerHTML = checked.length === 0
                    ? '<p class="summary-empty">No fees selected yet.</p>'
                : checked.map(cb => {
                    const input = document.querySelector(`.fee-payment-amount[data-fee-id="${cb.dataset.feeId}"]`);
                    const price = input ? Number(input.value) : Number(cb.dataset.price);
                    return `<div class="summary-item">
                        <span>${cb.dataset.fee}</span>
                        <span>&#8369;${Number(price || 0).toFixed(2)}</span>
                    </div>`;
                }).join('');
            const total = checked.reduce((sum, cb) => {
                const input = document.querySelector(`.fee-payment-amount[data-fee-id="${cb.dataset.feeId}"]`);
                const price = input ? Number(input.value) : Number(cb.dataset.price);
                return sum + (Number(price) || 0);
            }, 0);
            totalAmountEl.textContent = '\u20B1' + total;
            updateMultiOrgNotice();
        }

        function openPromissoryModal(feeId, feeName) {
            selectedFeeForPromissory = { feeId: feeId, feeName: feeName };
            document.getElementById('promissoryFeeName').value = feeName;
            document.getElementById('promissoryReason').value = '';
            document.getElementById('promissoryPartialAmount').value = '';
            document.getElementById('promissoryDate').value = '';
            const modal = document.getElementById('promissoryModal');
            modal.classList.add('active');
            modal.setAttribute('aria-hidden', 'false');
        }

        function closePromissoryModal() {
            const modal = document.getElementById('promissoryModal');
            modal.classList.remove('active');
            modal.setAttribute('aria-hidden', 'true');
            selectedFeeForPromissory = null;
        }

        function submitPromissoryRequest() {
            if (!selectedFeeForPromissory) return;

            if (!PROMISSORY_STORAGE_KEY) {
                alert('Promissory storage is unavailable. Please refresh and try again.');
                return;
            }

            const reason = document.getElementById('promissoryReason').value.trim();
            const promisedDate = document.getElementById('promissoryDate').value;
            const partialRaw = document.getElementById('promissoryPartialAmount').value;
            const partialAmount = partialRaw === '' ? null : Number(partialRaw);

            if (!reason || !promisedDate) {
                alert('Please complete the required fields.');
                return;
            }

            if (partialAmount !== null && (Number.isNaN(partialAmount) || partialAmount < 0)) {
                alert('Please enter a valid partial payment amount.');
                return;
            }

            const currentUser = getCurrentUser();
            const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
            requests.push({
                id: 'promissory-' + Date.now(),
                feeId: selectedFeeForPromissory.feeId,
                feeName: selectedFeeForPromissory.feeName,
                studentId: currentUser && currentUser.studentId ? currentUser.studentId : 'anonymous-student',
                studentNumber: currentUser && currentUser.studentId ? currentUser.studentId : 'anonymous-student',
                studentName: currentUser && currentUser.name ? currentUser.name : 'Student',
                reason: reason,
                partialAmount: partialAmount,
                promisedDate: promisedDate,
                status: 'Pending Review',
                createdAt: new Date().toISOString(),
                updatedAt: new Date().toISOString()
            });

            localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));
            closePromissoryModal();
        }

        function bindFeeEvents() {
            const selectAllCheckbox = document.getElementById('selectAllCheckbox');
            
            getCheckboxes().forEach(function (cb) {
                cb.addEventListener('change', function () {
                    // If any regular checkbox is unchecked, uncheck Select All
                    if (!this.checked && selectAllCheckbox) {
                        selectAllCheckbox.checked = false;
                    }

                    // enable/disable corresponding amount input
                    const feeId = this.dataset.feeId;
                    const input = document.querySelector(`.fee-payment-amount[data-fee-id="${feeId}"]`);
                    if (input) {
                        input.disabled = !this.checked;
                    }

                    updateSummary();
                });
            });

            if (selectAllCheckbox) {
                selectAllCheckbox.addEventListener('change', function () {
                    const isChecked = this.checked;
                    getCheckboxes().forEach(function (cb) {
                        if (!cb.disabled) cb.checked = isChecked;
                        const feeId = cb.dataset.feeId;
                        const input = document.querySelector(`.fee-payment-amount[data-fee-id="${feeId}"]`);
                        if (input) input.disabled = !isChecked;
                    });
                    updateSummary();
                });
            }

            document.querySelectorAll('.fee-action-promissory-link').forEach(function (button) {
                button.addEventListener('click', function () {
                    const feeId = button.dataset.feeId;
                    const feeName = button.dataset.feeName;
                    const feeCheckbox = document.querySelector(`input[type="checkbox"][data-fee-id="${feeId}"]`);

                    if (feeCheckbox && feeCheckbox.checked) {
                        feeCheckbox.checked = false;
                        // Uncheck Select All if a fee is unchecked
                        if (selectAllCheckbox) {
                            selectAllCheckbox.checked = false;
                        }
                        updateSummary();
                    }

                    openPromissoryModal(feeId, feeName);
                });
            });
        }

        function applyPreselectedFees() {
            const preselected = getPreselectedFees();
            if (!preselected.length) return;

            const preselectedNames = new Set(preselected.map(function (fee) {
                return String(fee.fee || fee.feeName || '').trim();
            }).filter(Boolean));

            const preselectedIds = new Set(preselected.map(function (fee) {
                return String(fee.feeId || fee.id || '').trim();
            }).filter(Boolean));

            let changed = false;
            getCheckboxes().forEach(function (checkbox) {
                const feeId = String(checkbox.dataset.feeId || '').trim();
                const feeName = String(checkbox.dataset.fee || '').trim();
                const shouldCheck = preselectedIds.has(feeId) || preselectedNames.has(feeName);
                if (shouldCheck) {
                    checkbox.checked = true;
                    // enable the corresponding amount input and set value if provided
                    const input = document.querySelector(`.fee-payment-amount[data-fee-id="${feeId}"]`);
                    if (input) {
                        input.disabled = false;
                        const match = preselected.find(p => (String(p.feeId || '') === feeId) || String(p.fee || '') === feeName);
                        if (match && (match.price || match.price === 0)) {
                            input.value = Number(match.price) || 0;
                        }
                    }
                    changed = true;
                }
            });

            if (changed) {
                updateSummary();
                localStorage.removeItem('ccs.selected.fees');
            }
        }

        document.getElementById('promissoryCloseBtn').addEventListener('click', closePromissoryModal);
        document.getElementById('promissoryCancelBtn').addEventListener('click', closePromissoryModal);
        document.getElementById('promissorySubmitBtn').addEventListener('click', submitPromissoryRequest);
        document.getElementById('promissoryModal').addEventListener('click', function (event) {
            if (event.target === this) closePromissoryModal();
        });

        continueBtn.addEventListener('click', function(e) {
            e.preventDefault();
            const checked = getChecked();
            if (checked.length === 0) {
                alert('Please select at least one fee.');
                return;
            }
            const fees = checked.map(cb => {
                const input = document.querySelector(`.fee-payment-amount[data-fee-id="${cb.dataset.feeId}"]`);
                const price = input ? Number(input.value) : Number(cb.dataset.price);
                return { feeId: cb.dataset.feeId, fee: cb.dataset.fee, price: Number(price) || 0, orgId: cb.dataset.orgId || 'u-org-001' };
            });
            const paymentGroups = getSelectedFeeGroups();
            localStorage.setItem('ccs.selected.fees', JSON.stringify(fees));
            localStorage.setItem(SELECTED_PAYMENT_GROUPS_KEY, JSON.stringify(paymentGroups));
            localStorage.setItem(SELECTED_PAYMENT_GROUP_INDEX_KEY, '0');
            if (paymentGroups[0]) {
                localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(paymentGroups[0]));
            }
            window.location.href = 'payment-method.html';
        });

        renderFeeRows();
        applyPreselectedFees();
        updateSummary();
    </script>
    </body>
</html>
```
