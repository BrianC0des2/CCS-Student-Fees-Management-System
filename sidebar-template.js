// Sidebar template loader
// Usage: Add <div id="sidebar-container"></div> to your HTML, then call loadSidebar()

const sidebarHTML = `
<div class="sidebar close">
    <div class="logo-details">
        <i class='bx bxl-c-plus-plus'></i>
        <span class="logo_name">Pay++</span>
    </div>
    <div id="view-toggle-sidebar-container"></div>
    <ul class="nav-links">
        <li>
            <a href="#">
                <i class='bx bx-grid-alt' ></i>
                <span class="link_name">Dashboard</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Category</a></li>
            </ul>
        </li>
        <li>
            <div class="iocn-link">
                <a href="#">
                    <i class='bx bx-collection' ></i>
                    <span class="link_name">Clearance</span>
                </a>
                <i class='bx bxs-chevron-down arrow' ></i>
            </div>
            <ul class="sub-menu">
                <li><a class="link_name" href="#">Clearance</a></li>
                <li><a href="#">View Status</a></li>
                <li><a href="#">Requirements</a></li>
                <li><a href="#">Track Progress</a></li>
            </ul>
        </li>
        <li>
            <div class="iocn-link">
                <a href="#">
                    <i class='bx bx-book-alt' ></i>
                    <span class="link_name">Payments</span>
                </a>
                <i class='bx bxs-chevron-down arrow' ></i>
            </div>
            <ul class="sub-menu">
                <li><a class="link_name" href="#">Payments</a></li>
                <li><a href="#">Outstanding Fees</a></li>
                <li><a href="#">Payment History</a></li>
                <li><a href="#">Receipt</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class='bx bx-pie-chart-alt-2' ></i>
                <span class="link_name">Analytics</span>
            </a>
            <ul class="sub-menu blank">
                <li><a class="link_name" href="#">Analytics</a></li>
            </ul>
        </li>
        <li>
            <a href="#">
                <i class='bx bx-line-chart' ></i>
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
                        <img src="assets/images/profile.png" alt="profileImg">
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
    
    // Re-attach sidebar event handlers after inserting HTML
    initializeSidebarEvents();
}

function initializeSidebarEvents() {
    // Sidebar toggle
    let sidebar = document.querySelector(".sidebar");
    let sidebarBtn = document.querySelector(".bx-menu");
    if (sidebarBtn) {
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

// Auto-load sidebar if DOM is ready
if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', loadSidebar);
} else {
    loadSidebar();
}

// Call adjustHomeSectionMargin after sidebar is loaded
document.addEventListener('DOMContentLoaded', function() {
    setTimeout(adjustHomeSectionMargin, 100);
});
