
// Login validation
const loginForm = document.getElementById("login-form");
if (loginForm) {
  loginForm.addEventListener("submit", (e) => {
    e.preventDefault();
    const email = document.getElementById("user-email").value;
    const password = document.getElementById("user-password").value;
    
    if (!email || !password) {
      alert("Please enter both email and password");
      return;
    }
    
    // Navigate to index.html
    window.location.href = "index.html";
  });
}

let arrow = document.querySelectorAll(".arrow");
for (var i = 0; i < arrow.length; i++) {
  arrow[i].addEventListener("click", (e)=>{
 let arrowParent = e.target.parentElement.parentElement;//selecting main parent of arrow
 arrowParent.classList.toggle("showMenu");
  });
}

let sidebar = document.querySelector(".sidebar");
let sidebarBtn = document.querySelector(".bx-menu");
if (sidebarBtn) {
  sidebarBtn.addEventListener("click", ()=>{
    sidebar.classList.toggle("close");
    adjustHomeSectionMargin();
  });
}

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

// Initialize margin on page load
document.addEventListener('DOMContentLoaded', function() {
  setTimeout(adjustHomeSectionMargin, 100);
});

// Payments history: populate sample items and filter by date
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
    renderPayments(samplePayments);
    return;
  }

  const now = new Date();
  const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000); // 30 days

  const filtered = samplePayments.filter(p => {
    const d = new Date(p.date + 'T00:00:00');
    if (value === 'recent') return d >= recentThreshold;
    if (value === 'old') return d < recentThreshold;
    return true;
  });

  renderPayments(filtered);
}

// initialize
renderPayments(samplePayments);
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

    let sem = month >= 6 && month <= 10 ? "1st Semester" : "2nd Semester";
    let startYear = month >= 6 ? year : year - 1;
    let endYear = startYear + 1;

    document.querySelector('.ay-badge').textContent 
        = `S.Y. ${startYear}-${endYear} | ${sem}`;
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

