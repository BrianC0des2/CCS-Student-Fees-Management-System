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
  });
}

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
