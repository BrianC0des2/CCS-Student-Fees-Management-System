
const sidebarHTML = `
<div class="sidebar">
    <a href="organization-dashboard.html" style="text-decoration: none;">
        <div class="logo-details">
            <i class='bx bxl-c-plus-plus'></i>
            <span class="logo_name">Pay++</span>
        </div>
    </a>
    <ul class="nav-links">
        <li>
            <a href="../organization/organization-dashboard.html">
                <i class='bx bx-grid-alt' ></i>
                <span class="link_name">Dashboard</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Dashboard</a></li>
            </ul>
        </li>
       
        <li>
            <div class="iocn-link">
                <a href="#">
                    <i class='bx bx-wallet' ></i>
                    <span class="link_name">Payments</span>
                </a>
                <i class='bx bxs-chevron-down arrow' ></i>
            </div>
            <ul class="sub-menu">
            <li><a class="link_name" href="#">Payments</a></li>
             <li><a href="../organization/add-payment.html">Org Fees</a></li>
            <li><a href="../organization/payment-history.html">Payment History</a></li>     
            </ul>
        </li>

    
        <li>
          <div class="iocn-link">
             <a href="#">
              <i class='bx bx-file' ></i>
             <span class="link_name">Reports</span>
             </a>
                 <i class='bx bxs-chevron-down arrow'></i>
            </div>
             <ul class="sub-menu">
               <li><a class="link_name" href="#">Reports</a></li>
              <li><a href="../organization/expense-report.html">Expense Report</a></li>
              <li><a href="../organization/collection.html">Collection Report</a></li>
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
            <div class="profile-details">
                <div class="profile-main">
                    <div class="profile-content">
                        <img src="../../assets/images/profile.png" alt="profileImg">
                    </div>
                    <div class="name-job">
                        <div class="name-with-switch">
                            <div class="profile_name">Bryan</div>
                            <button type="button" class="view-switch-container" aria-label="Switch view">
                                <i class='bx bx-chevron-up view-switch-icon'></i>
                            </button>
                        </div>
                        <div class="job">TY202500628</div>
                    </div>
                </div>
                <div class="logout-section">
                    <span>Sign out</span>
                    <i class='bx bx-log-out'></i>
                </div>
            </div>
        </li>
    </ul>
</div>
`;

function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) {
        console.warn('Sidebar container #sidebar-container not found');
        return;
    }
    
    container.innerHTML = sidebarHTML;

    applyRoleBasedSidebarAccess();
    
    initializeSidebarEvents();
}

function applyRoleBasedSidebarAccess() {
    if (!window.Auth || typeof window.Auth.getUser !== 'function') return;

    const user = window.Auth.getUser();
    if (!user || !user.permissions) return;

    const hasFacultyView = Boolean(user.permissions.facultyView);
    const hasDeanView = Boolean(user.permissions.deanView);
    const hasFacultyOrDeanView = hasFacultyView || hasDeanView;
    const currentPage = (window.location.pathname.split('/').pop() || '').toLowerCase();
    const useDeanDashboard = hasDeanView && (!hasFacultyView || currentPage === 'dean-dashboard.html');
    const dashboardHref = useDeanDashboard
        ? '../dean/dean-dashboard.html'
        : '../faculty/faculty-dashboard.html';

    const logoLink = document.querySelector('.sidebar .logo-details').closest('a');

    if (hasFacultyOrDeanView) {
        if (logoLink) {
            logoLink.setAttribute('href', dashboardHref);
        }
    } else if (user.permissions.organizationView) {
        if (logoLink) {
            logoLink.setAttribute('href', '../organization/organization-dashboard.html');
        }
    }

    const isFacultyOrDean = hasFacultyOrDeanView;
    if (!isFacultyOrDean) return;

    const dashboardLink = document.querySelector('.nav-links > li:first-child > a');
    if (dashboardLink) {
        dashboardLink.setAttribute('href', dashboardHref);
    }

    const walletIcon = document.querySelector('.nav-links .bx-wallet');
    const paymentsListItem = walletIcon ? walletIcon.closest('li') : null;
    if (paymentsListItem) {
        paymentsListItem.remove();
    }

    // Remove Reports for faculty and dean
    const fileIcon = document.querySelector(
        '.nav-links .bx-file'
    );
    const reportsListItem = fileIcon ? 
        fileIcon.closest('li') : null;
    if (reportsListItem) reportsListItem.remove();

    // Add My Students link for faculty only (not dean)
    const isFacultyOnly = hasFacultyView && !hasDeanView;
    if (isFacultyOnly) {
        const dashLi = document.querySelector(
            '.nav-links > li:first-child'
        );
        const myStudentsLi = document.createElement('li');
        myStudentsLi.innerHTML = `
            <li>
                <a href="../faculty/students.html">
                    <i class='bx bx-group'></i>
                    <span class="link_name">My Students</span>
                </a>
                <ul class="sub-menu blank">
                    <li><a class="link_name" 
                           href="../faculty/students.html">
                        My Students
                    </a></li>
                </ul>
            </li>
        `;
        dashLi.insertAdjacentElement('afterend', myStudentsLi);
    }
}

function initializeSidebarEvents() {
    let sidebar = document.querySelector(".sidebar");
    let sidebarBtn = document.querySelector(".bx-menu");
    if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
        sidebarBtn.dataset.sidebarInitialized = 'true';
        sidebarBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            adjustHomeSectionMargin();
        });
    }
    
    let arrow = document.querySelectorAll(".arrow");
    for (let i = 0; i < arrow.length; i++) {
        arrow[i].addEventListener("click", (e) => {
            let arrowParent = e.target.parentElement.parentElement;
            arrowParent.classList.toggle("showMenu");
        });
    }
}

function adjustHomeSectionMargin() {
    const sidebar = document.querySelector(".sidebar");
    const homeSection = document.querySelector(".home-section");
    if (!sidebar || !homeSection) return;
    
    if (sidebar.classList.contains("close")) {
        homeSection.style.marginLeft = "78px";
        homeSection.style.width = "calc(100% - 78px)";
    }  else {
    homeSection.style.marginLeft = "260px";
    homeSection.style.width = "calc(100% - 260px)";
}
}

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(adjustHomeSectionMargin, 100);
});
