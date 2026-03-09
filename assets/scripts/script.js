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
    if (loggedUser.permissions.deanView) {
      navigateTo('pages/dean/dean-dashboard.html');
    } else if (loggedUser.permissions.facultyView) {
      navigateTo('pages/faculty/faculty-dashboard.html');
    } else if (loggedUser.permissions.adminView) {
      navigateTo('pages/admin/admin-dashboard.html');
    } else if (loggedUser.permissions.organizationView) {
      navigateTo('pages/organization/organization-dashboard.html');
    } else {
      navigateTo('pages/student/student-dashboard.html');
    }
  });
}

function enforceRouteAccess() {
  if (!window.Auth) return;

  const page = (window.location.pathname.split('/').pop() || 'student-dashboard.html').toLowerCase();
  const isLoginPage = page === 'login-page.html';
  const user = window.Auth.getUser();

  if (isLoginPage) {
    if (!user) return;

    const preferredView = window.Auth.getView();
    if (preferredView === 'organization' && window.Auth.canManageOrg()) {
      navigateTo('pages/organization/organization-dashboard.html');
      return;
    }

    if (preferredView === 'dean' && window.Auth.isDean()) {
      navigateTo('pages/dean/dean-dashboard.html');
      return;
    }

    if (preferredView === 'faculty' && window.Auth.isFaculty()) {
      navigateTo('pages/faculty/faculty-dashboard.html');
      return;
    }

    if (window.Auth.isDean()) {
      navigateTo('pages/dean/dean-dashboard.html');
      return;
    }

    if (window.Auth.isFaculty()) {
      navigateTo('pages/faculty/faculty-dashboard.html');
      return;
    }

    if (window.Auth.isAdmin()) {
      navigateTo('pages/admin/admin-dashboard.html');
      return;
    }

    navigateTo('pages/student/student-dashboard.html');
    return;
  }

  if (!user) {
    navigateTo('login-page.html');
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
let sidebarBtn = document.querySelector(".bx-menu");
if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
  sidebarBtn.dataset.sidebarInitialized = 'true';
  sidebarBtn.addEventListener("click", ()=>{
    const sidebar = document.querySelector(".sidebar");
    if (!sidebar) return;
    sidebar.classList.toggle("close");
    adjustHomeSectionMargin();
  });
}

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
    navigateTo('login-page.html');
  });
}

document.addEventListener('DOMContentLoaded', function() {
  setTimeout(adjustHomeSectionMargin, 100);
  setTimeout(() => {
    syncProfileDetails();
    initializeViewToggle();
    initializeLogout();
    initializeFilters();
    initializeSearch();
  }, 120);
});

const paymentsFilter = document.getElementById('payments-filter');
const paymentsListEl = document.querySelector('.payments-history .payments-list');

const samplePayments = [
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'CCSC Fee - BSCS 1A', amount: '₱1,000.00', date: '2026-02-14' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Insurance - BSCS 1A', amount: '₱150.00', date: '2026-02-10' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Miscellaneous - BSCS 1A', amount: '₱850.00', date: '2026-01-20' },
  { studentNo: "TY202500100", studentName: "Bryan", desc: 'Gender Club - BSCS 1A', amount: '₱1,000.00', date: '2026-01-10' },
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'CCSC Fee - BSCS 1B', amount: '₱1,000.00', date: '2026-02-13' },
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'Insurance - BSCS 1B', amount: '₱150.00', date: '2026-02-08' },
  { studentNo: "TY202500101", studentName: "Bryan", desc: 'Partial Payment - BSCS 1B', amount: '₱500.00', date: '2026-01-15' },
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

function filterPayments(value){
  if (value === 'all') {
    renderPayments(myPayments);
    return;
  }

  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  const filtered = myPayments.filter(p => {
    const d = new Date(p.date + 'T00:00:00');
    if (value === 'recent') return d >= recentThreshold;
    if (value === 'old') return d < recentThreshold;
    return true;
  });

  renderPayments(filtered);
}

const currentUser = window.Auth ? window.Auth.getUser() : null;
const myPayments = currentUser
  ? samplePayments.filter(p => p.studentNo === currentUser.studentId)
  : samplePayments;

renderPayments(myPayments);
if (paymentsFilter) {
  paymentsFilter.addEventListener('change', (e) => {
    filterPayments(e.target.value);
  });
  filterPayments(paymentsFilter.value || 'recent');
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

    if (!filtersBtn || !filtersPopover) return;

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
        <i class='bx bx-check-shield'></i>
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

document.addEventListener('DOMContentLoaded', initializeFacultyDashboard);