
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
                <li><a class="link_name" href="#">Fees</a></li>
                <li><a href="../organization/add-payment.html">Fees</a></li>
                <li><a class="link_name" href="#">Payments</a></li>
                <li><a href="../organization/payment-history.html">Payment History</a></li>
            </ul>
        </li>

        <li>
            <a href="#">
                <i class='bx bx-file' ></i>
                <span class="link_name">Reports</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Reports</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class='bx bx-cog' ></i>
                <span class="link_name">Settings</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Settings</a></li>
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

// LOAD FLOW
// - Verify target container exists
// - Inject shared sidebar markup
// - Bind all interaction handlers after injection
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Mount shared sidebar markup into the page and initialize behavior.
// PREDEFINED APIS USED: document.getElementById, console.warn.
function loadSidebar() {
    const container = document.getElementById('sidebar-container');
    if (!container) {
        console.warn('Sidebar container #sidebar-container not found');
        return;
    }
    
    container.innerHTML = sidebarHTML;
    
    // Re-attach sidebar event handlers after inserting HTML
    initializeSidebarEvents();
}

// INTERACTION FLOW
// - Burger button toggles collapsed/expanded state
// - Arrow buttons toggle submenu visibility
// - Each toggle keeps layout synced via adjustHomeSectionMargin()
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Attach click handlers for sidebar open/close and submenu expansion.
// PREDEFINED APIS USED: document.querySelector, addEventListener, classList.toggle.
function initializeSidebarEvents() {
    // Sidebar toggle
    let sidebar = document.querySelector(".sidebar");
    let sidebarBtn = document.querySelector(".bx-menu");
    // dataset flag prevents adding duplicate click listeners when this runs multiple times
    if (sidebarBtn && !sidebarBtn.dataset.sidebarInitialized) {
        sidebarBtn.dataset.sidebarInitialized = 'true';
        sidebarBtn.addEventListener("click", () => {
            sidebar.classList.toggle("close");
            // Adjust home-section margin based on sidebar state
            adjustHomeSectionMargin();
        });
    }
    
    // Dropdown menus
    let arrow = document.querySelectorAll(".arrow");
    for (let i = 0; i < arrow.length; i++) {
        arrow[i].addEventListener("click", (e) => {
            let arrowParent = e.target.parentElement.parentElement;
            arrowParent.classList.toggle("showMenu");
        });
    }
}

// LAYOUT FLOW
// - Read current sidebar mode (`close` or expanded)
// - Apply matching margin/width to `.home-section`
// - Prevent overlap so main content remains readable
// TYPE: USER-DEFINED FUNCTION
// PURPOSE: Keep main content dimensions synchronized with sidebar width.
// PREDEFINED APIS USED: document.querySelector, classList.contains.
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

// BOOTSTRAP FLOW
// - If DOM is still loading, wait for DOMContentLoaded
// - Otherwise load immediately
if (document.readyState === 'loading') {
    // Wait for full HTML to be parsed first
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    // DOM already loaded, we can insert sidebar immediately
    loadSidebar();
}

// Final layout sync on startup (small delay helps with initial element sizing).
document.addEventListener('DOMContentLoaded', function() {
    // Small delay helps ensure layout elements are already present
    setTimeout(adjustHomeSectionMargin, 100);
});
