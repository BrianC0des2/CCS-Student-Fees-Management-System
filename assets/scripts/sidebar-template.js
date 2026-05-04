
const sidebarHTML = `
<div class="sidebar">
    <a href="#" class="logo-link" style="text-decoration: none;">
        <div class="logo-details">
            <img src="../../assets/images/pyt.png" alt="Pay++ Logo" class="sidebar-logo-img">
            <span class="logo_name">Pay++</span>
        </div>
    </a>
    <div id="sidebar-semester-badge" class="sidebar-semester-badge"></div>
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
             <li><a href="../organization/add-payment.html">Manage Fees</a></li>
            <li><a href="../organization/pending-payments.html">Pending Payments</a></li>
            <li><a href="../organization/promissory-notes.html">Promissory Notes</a></li>
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
        <li id="profile-link-item">
            <a href="../organization/profile.html">
                <i class='bx bx-user-circle'></i>
                <span class="link_name">Profile</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Profile</a></li>
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
        // Fallback for pages that already include static sidebar markup.
        applyRoleBasedSidebarAccess();
        initializeSidebarEvents();
        adjustHomeSectionMargin();
        return;
    }
    
    container.innerHTML = sidebarHTML;

    applyRoleBasedSidebarAccess();
    
    initializeSidebarEvents();
    adjustHomeSectionMargin();
}

function applyRoleBasedSidebarAccess() {
    if (!window.Auth || typeof window.Auth.getUser !== 'function') return;

    const user = window.Auth.getUser();
    if (!user || !user.permissions) return;

    const hasAdminView = Boolean(user.permissions.adminView);
    const hasOrganizationView = Boolean(user.permissions.organizationView);
    const hasFacultyView = Boolean(user.permissions.facultyView);
    const hasDeanView = Boolean(user.permissions.deanView);
    const isStudentOnly = !hasAdminView && !hasOrganizationView && !hasFacultyView && !hasDeanView;

    // Determine dashboard href based on role priority: admin > dean > faculty > organization > student
    let dashboardHref = '../student/student-dashboard.html'; // default
    
    if (hasAdminView) {
        dashboardHref = '../admin/admin-dashboard.html';
    } else if (hasDeanView) {
        dashboardHref = '../dean/dean-dashboard.html';
    } else if (hasFacultyView) {
        dashboardHref = '../faculty/faculty-dashboard.html';
    } else if (hasOrganizationView) {
        dashboardHref = '../organization/organization-dashboard.html';
    }

    // Update logo link (both dynamic template and static sidebars)
    const logoLink = document.querySelector('.sidebar .logo-link') || document.querySelector('.sidebar .logo-details')?.closest('a');
    if (logoLink) {
        logoLink.setAttribute('href', dashboardHref);
        logoLink.style.textDecoration = 'none';
        logoLink.style.color = 'inherit';
        logoLink.style.cursor = 'pointer';
    } else {
        // Fallback: if logo is not wrapped in anchor, add click handler to logo-details
        const logoDetails = document.querySelector('.sidebar .logo-details');
        if (logoDetails && !logoDetails.hasClickHandler) {
            logoDetails.hasClickHandler = true;
            logoDetails.style.cursor = 'pointer';
            logoDetails.addEventListener('click', function (e) {
                e.preventDefault();
                window.location.href = dashboardHref;
            });
        }
    }

    // Update first nav-link (Dashboard link)
    const dashboardLink = document.querySelector('.nav-links > li:first-child > a');
    if (dashboardLink) {
        dashboardLink.setAttribute('href', dashboardHref);
    }

    // Update Profile link href based on role
    let profileHref = '../student/student-profile.html'; // default for students
    if (hasAdminView) {
        // Admin profile - may need to create or use organization profile
        profileHref = '../organization/profile.html';
    } else if (hasDeanView) {
        // Dean profile - may need to create or use organization profile
        profileHref = '../organization/profile.html';
    } else if (hasFacultyView) {
        // Faculty profile - may need to create or use organization profile
        profileHref = '../organization/profile.html';
    } else if (hasOrganizationView) {
        profileHref = '../organization/profile.html';
    }

    const profileLink = document.querySelector('#profile-link-item a');
    if (profileLink) {
        profileLink.setAttribute('href', profileHref);
    }

    // Hide navigation items not applicable to student role
    if (isStudentOnly) {
        // Remove Payments menu for students
        const walletIcon = document.querySelector('.nav-links .bx-wallet');
        const paymentsListItem = walletIcon ? walletIcon.closest('li') : null;
        if (paymentsListItem) {
            paymentsListItem.remove();
        }

        // Remove Reports menu for students
        const fileIcon = document.querySelector('.nav-links .bx-file');
        const reportsListItem = fileIcon ? fileIcon.closest('li') : null;
        if (reportsListItem) {
            reportsListItem.remove();
        }
        return;
    }

    // Handle admin-specific navigation
    if (hasAdminView) {
        // Admin has all menu items, no modifications needed
        return;
    }

    // Handle faculty/dean-specific navigation
    const hasFacultyOrDeanView = hasFacultyView || hasDeanView;
    if (hasFacultyOrDeanView) {
        // Remove Payments menu for faculty/dean
        const walletIcon = document.querySelector('.nav-links .bx-wallet');
        const paymentsListItem = walletIcon ? walletIcon.closest('li') : null;
        if (paymentsListItem) {
            paymentsListItem.remove();
        }

        // Remove Reports menu for faculty/dean
        const fileIcon = document.querySelector('.nav-links .bx-file');
        const reportsListItem = fileIcon ? fileIcon.closest('li') : null;
        if (reportsListItem) {
            reportsListItem.remove();
        }

        // Add My Students link for faculty only (not dean)
        const isFacultyOnly = hasFacultyView && !hasDeanView;
        if (isFacultyOnly) {
            const dashLi = document.querySelector('.nav-links > li:first-child');
            const myStudentsLi = document.createElement('li');
            myStudentsLi.innerHTML = `
                <a id="myStudentsSidebarLink" href="../faculty/students.html">
                    <i class='bx bx-group'></i>
                    <span class="link_name">My Students</span>
                </a>
                <ul class="sub-menu blank">
                    <li><a class="link_name" href="../faculty/students.html">My Students</a></li>
                </ul>
            `;
            dashLi.insertAdjacentElement('afterend', myStudentsLi);

            // Add History link for faculty
            const myStudentsLi_elem = document.getElementById('myStudentsSidebarLink').closest('li');
            const historyLi = document.createElement('li');
            historyLi.innerHTML = `
                <a href="../faculty/clearance-history.html">
                    <i class='bx bx-history'></i>
                    <span class="link_name">History</span>
                </a>
                <ul class="sub-menu blank">
                    <li><a class="link_name" href="../faculty/clearance-history.html">History</a></li>
                </ul>
            `;
            myStudentsLi_elem.insertAdjacentElement('afterend', historyLi);
        }

        // Add History link for dean only
        const isDeanOnly = hasDeanView && !hasFacultyView;
        if (isDeanOnly) {
            const dashLi = document.querySelector('.nav-links > li:first-child');
            const deanHistoryLi = document.createElement('li');
            deanHistoryLi.innerHTML = `
                <a href="../dean/clearance-history.html">
                    <i class='bx bx-history'></i>
                    <span class="link_name">History</span>
                </a>
                <ul class="sub-menu blank">
                    <li><a class="link_name" href="../dean/clearance-history.html">History</a></li>
                </ul>
            `;
            dashLi.insertAdjacentElement('afterend', deanHistoryLi);
        }
        return;
    }

    // Handle organization-specific navigation
    if (hasOrganizationView) {
        // Organizations have all menu items available
        return;
    }
}

function initializeSidebarEvents() {
    let sidebar = document.querySelector(".sidebar");
    let sidebarBtn = document.querySelector(".bx-menu, .toggle-btn, #toggle-btn");
    if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
        sidebarBtn.dataset.sidebarInitialized = 'true';
        sidebarBtn.addEventListener("click", () => {
            if (!sidebar) return;

            if (isMobileViewport()) {
                toggleMobileSidebar(sidebar);
                adjustHomeSectionMargin();
                return;
            }

            if (isTabletViewport()) {
                sidebar.classList.toggle("close");
                hideSidebarBackdrop();
                sidebar.classList.remove("mobile-open");
                adjustHomeSectionMargin();
                return;
            }

            sidebar.classList.toggle("close");
            hideSidebarBackdrop();
            sidebar.classList.remove("mobile-open");
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

    bindResponsiveSidebarHandlers();
}

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
    const sidebar = document.querySelector('.sidebar');
    if (!sidebar) return;
    sidebar.classList.remove('mobile-open');
    hideSidebarBackdrop();
}

function toggleMobileSidebar(sidebar) {
    const isOpen = sidebar.classList.toggle('mobile-open');
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
        const sidebar = document.querySelector('.sidebar');
        if (!sidebar) return;

        if (!isMobileViewport()) {
            sidebar.classList.remove('mobile-open');
            hideSidebarBackdrop();
        }

        if (isTabletViewport()) {
            sidebar.classList.add('close');
        }

        adjustHomeSectionMargin();
    });
}

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

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

document.addEventListener('DOMContentLoaded', function() {
    setTimeout(adjustHomeSectionMargin, 100);
});
