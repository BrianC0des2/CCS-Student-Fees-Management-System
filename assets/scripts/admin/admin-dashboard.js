'use strict';

document.addEventListener('DOMContentLoaded', () => {

/* ══════════════════════════════
   ROUTE GUARD + SESSION SYNC
══════════════════════════════ */

(function guardAdmin() {
    if (!window.Auth) {
        window.location.replace('../../index.html');
        return;
    }
    const user = window.Auth.getUser();
    if (!user || !user.permissions || !user.permissions.adminView) {
        window.location.replace('../../index.html');
        return;
    }

    const nameEls = document.querySelectorAll('.profile_name');
    const emailEls = document.querySelectorAll('.job');
    nameEls.forEach((nameEl) => {
        nameEl.textContent = user.name;
    });
    emailEls.forEach((emailEl) => {
        emailEl.textContent = user.email;
    });
})();

/* ══════════════════════════════
   HELPER — BOXICON SHORTHAND
══════════════════════════════ */
const bxi = (name, extra = '') =>
    `<i class='bx bx-${name}${extra ? ' ' + extra : ''}'></i>`;

/* ══════════════════════════════
   SECTION A — DATA
══════════════════════════════ */

const ROLE_LABELS = {
    dept_head:    'Department Head',
    adviser:      'Class Adviser',
    coordinator:  'Student Affairs Coordinator',
    dean:         'College Dean',
};

const ROLE_BADGE_CLASS = {
    dept_head:    'badge-purple',
    adviser:      'badge-green',
    coordinator:  'badge-amber',
    dean:         'badge-red',
};

const ALL_PERMISSIONS = [
    { id: 'view_students',     label: 'View Students',       category: 'Student Management' },
    { id: 'add_students',      label: 'Add Students',         category: 'Student Management' },
    { id: 'edit_students',     label: 'Edit Student Info',    category: 'Student Management' },
    { id: 'remove_students',   label: 'Remove Students',      category: 'Student Management' },
    { id: 'manage_students',   label: 'Full Student Control', category: 'Student Management' },
    { id: 'verify_signup',     label: 'Verify Student Signups', category: 'Student Management' },
    { id: 'approve_clearance', label: 'Approve Clearance',    category: 'Clearance' },
    { id: 'reject_clearance',  label: 'Reject Clearance',     category: 'Clearance' },
    { id: 'sign_clearance',    label: 'Sign Clearance',       category: 'Clearance' },
    { id: 'view_payments',     label: 'View Payments',        category: 'Finance' },
    { id: 'process_payments',  label: 'Process Payments',     category: 'Finance' },
    { id: 'manage_fees',       label: 'Manage Org Fees',      category: 'Finance' },
    { id: 'generate_reports',  label: 'Generate Reports',     category: 'Reports' },
    { id: 'export_data',       label: 'Export Data',          category: 'Reports' },
    { id: 'view_audit',        label: 'View Audit Logs',      category: 'System' },
    { id: 'manage_users',      label: 'Manage Users',         category: 'System' },
];

const STUDENT_PERM_DETAILS = {
    view_students:   { icon: 'show',  desc: 'Can browse and search the student list',              risk: 'low' },
    add_students:    { icon: 'plus',  desc: 'Can enroll new students into the system',             risk: 'medium' },
    edit_students:   { icon: 'edit',  desc: 'Can update student info and enrollment status',       risk: 'medium' },
    remove_students: { icon: 'trash', desc: 'Can permanently delete student records',              risk: 'high' },
    manage_students: { icon: 'shield', desc: 'Full control — includes add, edit, remove, suspend', risk: 'high' },
    verify_signup:   { icon: 'check-circle', desc: 'Can verify and approve new student signups',    risk: 'medium' },
};

let departmentList = [
    { id: 'DEPT-001', name: 'BS Computer Science',         abbreviation: 'CS',   deanId: 'FAC-005', faculty: [], status: 'active' },
    { id: 'DEPT-002', name: 'BS Information Technology',   abbreviation: 'IT',   deanId: 'FAC-002', faculty: [], status: 'active' },
];

let facultyList = [
    { id: 'FAC-001', name: 'Prof. Mark L. Flores, PhD.',   email: 'ml.flores@wmsu.edu.ph',   phone: '+63-912-345-6789', role: 'dean',            department: 'BS Computer Science',            sex: 'M', status: 'active',   permissions: ['view_students','approve_clearance','reject_clearance','generate_reports','export_data','view_payments','view_audit'], dateAdded: 'Jun 1, 2022',  lastLogin: 'Mar 7, 2026' },
    { id: 'FAC-002', name: 'Mr. Jaydee C. Ballaho, MIT',   email: 'jc.ballaho@wmsu.edu.ph',  phone: '+63-912-345-6790', role: 'dept_head',       department: 'BS Information Technology',      sex: 'M', status: 'active',   permissions: ['view_students','approve_clearance','sign_clearance','generate_reports','view_payments'], dateAdded: 'Jun 1, 2022',  lastLogin: 'Mar 6, 2026' },
    { id: 'FAC-003', name: 'Asst Prof Marjorie A. Rojas',  email: 'ma.rojas@wmsu.edu.ph',    phone: '+63-912-345-6791', role: 'coordinator',     department: 'BS Computer Science',            sex: 'F', status: 'active',   permissions: ['view_students','approve_clearance','sign_clearance','edit_students','generate_reports'], dateAdded: 'Jun 1, 2022',  lastLogin: 'Mar 5, 2026' },
    { id: 'FAC-004', name: 'Ms. Jennifer Santos',           email: 'j.santos@wmsu.edu.ph',    phone: '+63-912-345-6792', role: 'finance_officer', department: 'BS Computer Science',            sex: 'F', status: 'active',   permissions: ['view_students','view_payments','process_payments','generate_reports','export_data','manage_fees'], dateAdded: 'Aug 15, 2022', lastLogin: 'Mar 7, 2026' },
    { id: 'FAC-005', name: 'Prof. Ricardo Dela Cruz, MIT',  email: 'r.delacruz@wmsu.edu.ph',  phone: '+63-912-345-6793', role: 'adviser',         department: 'BS Computer Science',            sex: 'M', status: 'active',   permissions: ['view_students','verify_signup','approve_clearance','sign_clearance'], dateAdded: 'Jan 10, 2023', lastLogin: 'Mar 4, 2026' },
    { id: 'FAC-006', name: 'Prof. Elena Mercado',           email: 'e.mercado@wmsu.edu.ph',   phone: '+63-912-345-6794', role: 'professor',       department: 'BS Information Technology',      sex: 'F', status: 'inactive', permissions: ['view_students','verify_signup','sign_clearance'], dateAdded: 'Mar 1, 2023',  lastLogin: 'Jan 20, 2026' },
];

let studentList = [
    { id: '2022-00123', name: 'Maria Santos',   email: 'maria.santos@wmsu.edu.ph',  course: 'BS Computer Science',       year: '4th Year', section: 'A', status: 'active',    paymentStatus: 'pending', clearanceStatus: 'in_progress', permissions: ['view_dashboard','make_payment','view_receipt'], enrollmentDate: 'Aug 1, 2022' },
    { id: '2022-00124', name: 'Juan Dela Cruz',  email: 'juan.delacruz@wmsu.edu.ph', course: 'BS Information Technology', year: '3rd Year', section: 'B', status: 'active',    paymentStatus: 'paid',    clearanceStatus: 'complete',    permissions: ['view_dashboard','make_payment','view_receipt'], enrollmentDate: 'Aug 1, 2022' },
    { id: '2023-00211', name: 'Ana Reyes',       email: 'ana.reyes@wmsu.edu.ph',     course: 'BS Computer Science',       year: '2nd Year', section: 'A', status: 'active',    paymentStatus: 'overdue', clearanceStatus: 'not_started', permissions: ['view_dashboard'], enrollmentDate: 'Aug 1, 2023' },
    { id: '2023-00212', name: 'Carlos Mendoza',  email: 'c.mendoza@wmsu.edu.ph',     course: 'BS Information Technology', year: '1st Year', section: 'C', status: 'suspended', paymentStatus: 'overdue', clearanceStatus: 'not_started', permissions: [], enrollmentDate: 'Aug 1, 2023' },
    { id: '2024-00301', name: 'Liza Tan',        email: 'liza.tan@wmsu.edu.ph',      course: 'BS Computer Science',       year: '1st Year', section: 'A', status: 'active',    paymentStatus: 'pending', clearanceStatus: 'not_started', permissions: ['view_dashboard','make_payment'], enrollmentDate: 'Aug 1, 2024' },
];

let organizationList = [
    { id: 'u-org-001',   name: 'CCS Student Council',        abbreviation: 'CSC',    description: 'College Student Council',        head: 'u-org-001',   pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'org-msa-001', name: 'Muslim Student Association', abbreviation: 'MSA',    description: 'Muslim Student Association',      head: 'org-msa-001', pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'org-dean-office-001', name: "Dean's Office — CCS", abbreviation: 'DO', description: "Dean's Office Finance", head: 'org-dean-office-001', pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'phiccs',      name: 'PHICCS',                     abbreviation: 'PHICCS', description: 'Philippine ICT Students Society', head: '',            pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'venom',       name: 'Venom Publication',          abbreviation: 'VP',     description: 'CCS Official Publication',        head: '',            pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
    { id: 'gender_club', name: 'CSC Gender Club',            abbreviation: 'GC',     description: 'CSC Gender Club',                 head: '',            pendingHandover: null, createdAt: '2026-01-15T08:00:00.000Z' },
];

let showAddOrgForm = false;
let editingOrgId = null;
let deleteConfirmOrgId = null;
let newOrgData = {
    name: '',
    abbreviation: '',
    description: '',
    head: ''
};

let feeList = [
    { id: 'csc',       name: 'CSC Fee',                                 amount: 200, description: 'College Student Council Fee',       dueDate: 'Feb 15, 2026', status: 'active' },
    { id: 'gender',    name: 'Gender Club Membership Fee',              amount: 50,  description: 'CSC Gender Club Annual Membership', dueDate: 'Feb 15, 2026', status: 'active' },
    { id: 'insurance', name: 'Insurance (Whole Year)',                  amount: 40,  description: 'Annual Student Insurance Coverage', dueDate: 'Feb 15, 2026', status: 'active' },
    { id: 'misc',      name: 'Miscellaneous (10 booklets @ ₱6 each)', amount: 60,  description: '10 booklets at ₱6.00 each',         dueDate: 'Mar 1, 2026',  status: 'active' },
];

let signatoryList = [
    { id: 'csc',           name: 'CSC - College Student Council', role: 'Student Organization',        type: 'organization', order: 1, status: 'active',   assignedTo: '' },
    { id: 'phiccs',        name: 'PHICCS',                         role: 'Organization',                type: 'organization', order: 2, status: 'active',   assignedTo: '' },
    { id: 'venom',         name: 'Venom Publication',              role: 'Publication Office',           type: 'organization', order: 3, status: 'active',   assignedTo: '' },
    { id: 'gender_club',   name: 'CSC Gender Club',                role: 'Student Organization',        type: 'organization', order: 4, status: 'active',   assignedTo: '' },
    { id: 'dept_head',     name: 'Mr. Robert Johnson, MIT',     role: 'Department Head',              type: 'faculty',      order: 5, status: 'active',   assignedTo: 'FAC-002' },
    { id: 'class_adviser', name: 'Class Adviser',                   role: 'Faculty',                      type: 'faculty',      order: 6, status: 'active',   assignedTo: '' },
    { id: 'student_affairs', name: 'Asst Prof Marjorie A. Rojas',  role: 'Student Affairs Coordinator', type: 'faculty',      order: 7, status: 'active',   assignedTo: 'FAC-003' },
    { id: 'dean',          name: 'Prof. Mark L. Flores, PhD.',     role: 'College Dean CCS',             type: 'dean',         order: 8, status: 'active',   assignedTo: 'FAC-001' },
];

const auditLogs = [
    { id: 'LOG-001', timestamp: 'Mar 7, 2026 – 09:15 AM', user: 'Admin',                       role: 'System Admin',    action: 'Faculty Added',         details: 'Added Prof. John Smith to BS Computer Science department',         ipAddress: '192.168.1.1',   type: 'success' },
    { id: 'LOG-002', timestamp: 'Mar 7, 2026 – 08:42 AM', user: 'Ms. Jennifer Santos',         role: 'Finance Officer', action: 'Payment Processed',      details: 'Processed payment of ₱350 for student 2022-00123',                       ipAddress: '192.168.1.22',  type: 'info' },
    { id: 'LOG-003', timestamp: 'Mar 6, 2026 – 04:30 PM', user: 'Admin',                       role: 'System Admin',    action: 'Permission Modified',    details: 'Updated permissions for Carlos Mendoza (2023-00212) – account suspended', ipAddress: '192.168.1.1',   type: 'warning' },
    { id: 'LOG-004', timestamp: 'Mar 6, 2026 – 02:11 PM', user: 'Prof. Mark L. Flores, PhD.',  role: 'College Dean',    action: 'Clearance Approved',     details: 'Approved clearance for Juan Dela Cruz (2022-00124)',                      ipAddress: '192.168.1.35',  type: 'success' },
    { id: 'LOG-005', timestamp: 'Mar 5, 2026 – 11:00 AM', user: 'Admin',                       role: 'System Admin',    action: 'Fee Updated',            details: 'Updated Miscellaneous fee due date to Mar 1, 2026',                      ipAddress: '192.168.1.1',   type: 'info' },
    { id: 'LOG-006', timestamp: 'Mar 5, 2026 – 09:00 AM', user: 'Admin',                       role: 'System Admin',    action: 'Login Failed',           details: 'Failed login attempt for unknown user from suspicious IP',               ipAddress: '203.100.45.67', type: 'error' },
    { id: 'LOG-007', timestamp: 'Mar 4, 2026 – 03:20 PM', user: 'Asst Prof Marjorie A. Rojas', role: 'Student Affairs', action: 'Clearance Signed',        details: 'Signed clearance for Maria Santos (2022-00123)',                         ipAddress: '192.168.1.18',  type: 'success' },
    { id: 'LOG-008', timestamp: 'Mar 3, 2026 – 10:45 AM', user: 'Admin',                       role: 'System Admin',    action: 'Student Status Changed', details: 'Changed Ana Reyes status to overdue due to unpaid fees',                 ipAddress: '192.168.1.1',   type: 'warning' },
];

const systemSettings = {
    systemName:             'WMSU CCS Student Fees Management System',
    paymentGracePeriod:     7,
    emailNotifications:     true,
    smsNotifications:       false,
    autoReminders:          true,
    requireTwoFactor:       false,
    allowNewRegistrations:  true,
    maintenanceMode:        false,
    currentSemesterId:      'SEM-001',
};

// Initialize semester data if not exists
if (!window.semesterList) {
    window.semesterList = [
        { id: 'SEM-001', schoolYear: '2025-2026', name: '1st Semester', status: 'active', startDate: '2025-08-01', endDate: '2025-12-20', paymentDeadline: '2025-09-15', autoStartEnabled: false, autoStartDate: null, createdDate: '2025-06-01', description: 'First semester of academic year 2025-2026', gracePeriodDays: 7 },
        { id: 'SEM-002', schoolYear: '2025-2026', name: '2nd Semester', status: 'inactive', startDate: '2026-01-06', endDate: '2026-05-31', paymentDeadline: '2026-02-15', autoStartEnabled: false, autoStartDate: null, createdDate: '2025-06-01', description: 'Second semester of academic year 2025-2026', gracePeriodDays: 7 },
        { id: 'SEM-003', schoolYear: '2026-2027', name: '1st Semester', status: 'inactive', startDate: '2026-08-01', endDate: '2026-12-20', paymentDeadline: '2026-09-15', autoStartEnabled: true, autoStartDate: '2026-08-01', createdDate: '2025-06-01', description: 'First semester of academic year 2026-2027', gracePeriodDays: 7 },
    ];
    localStorage.setItem('ccs.semesters', JSON.stringify(window.semesterList));
}

/* ══════════════════════════════
   SECTION B — UTILITIES
══════════════════════════════ */

function showToast(msg, isError = false) {
    const t = document.getElementById('toast');
    t.innerHTML = `${bxi(isError ? 'x-circle' : 'check-circle')} <span>${msg}</span>`;
    t.className = 'toast' + (isError ? ' toast--error' : '');
    setTimeout(() => { t.className = 'toast toast--hidden'; }, 3000);
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function joinPersonName(lastName, firstName, middleName = '') {
    return [firstName, middleName, lastName].filter(Boolean).join(' ').replace(/\s+/g, ' ').trim();
}

function studentEmailFromId(studentId) {
    return 'ty' + studentId.replace(/-/g, '') + '@wmsu.edu.ph';
}

function facultyEmailFromId(facultyId) {
    return facultyId.toLowerCase().replace(/[^a-z0-9]/g, '') + '@wmsu.edu.ph';
}

function statusAvatarClass(status) {
    if (status === 'active')   return 'mem-av--active';
    if (status === 'inactive') return 'mem-av--inactive';
    return 'mem-av--suspended';
}

function paymentBadgeClass(s) {
    return s === 'paid' ? 'badge-green' : s === 'pending' ? 'badge-amber' : 'badge-red';
}

function clearanceBadgeClass(s) {
    return s === 'complete' ? 'badge-green' : s === 'in_progress' ? 'badge-amber' : 'badge-gray';
}

function clearanceLabel(s) {
    return s === 'complete' ? 'Complete' : s === 'in_progress' ? 'In Progress' : 'Not Started';
}

function clearanceTextClass(s) {
    return s === 'complete' ? 'badge-green' : s === 'in_progress' ? 'badge-amber' : '';
}

function logTypeClass(type) {
    return type === 'success' ? 'audit-icon--success'
         : type === 'warning' ? 'audit-icon--warning'
         : type === 'error'   ? 'audit-icon--error'
         :                      'audit-icon--info';
}

function logTypeIcon(type) {
    return type === 'success' ? 'check'
         : type === 'warning' ? 'error'
         : type === 'error'   ? 'x-circle'
         :                      'info-circle';
}

function logBadgeClass(type) {
    return type === 'success' ? 'badge-green'
         : type === 'warning' ? 'badge-amber'
         : type === 'error'   ? 'badge-red'
         :                      'badge-blue';
}

function logRecentClass(type) {
    return type === 'success' ? 'rmi--success'
         : type === 'warning' ? 'rmi--warning'
         : type === 'error'   ? 'rmi--error'
         :                      'rmi--info';
}

function riskBadgeClass(r) {
    return r === 'high' ? 'badge-red' : r === 'medium' ? 'badge-amber' : 'badge-green';
}

function riskCheckClass(r) {
    return r === 'high' ? 'perm-checkbox--red' : r === 'medium' ? 'perm-checkbox--amber' : 'perm-checkbox--green';
}

/* ══════════════════════════════
   SECTION C — TAB SWITCHING
══════════════════════════════ */

const TAB_LABELS = {
    overview:    'Overview',
    faculty:     'Faculty Management',
    organizations: 'Organizations',
    permissions: 'Permissions',
    fees:        'Fee Configuration',
    clearance:   'Clearance Setup',
    system:      'System Settings',
    semester:    'Semester Management',
    audit:       'Audit Logs',
};

let activeTab = 'overview';

function switchTab(tab) {
    document.querySelectorAll('.tab-panel').forEach(p => p.classList.remove('tab-panel--active'));
    document.querySelectorAll('a[data-tab]').forEach(a => a.classList.remove('active'));
    document.getElementById('tab-' + tab).classList.add('tab-panel--active');
    const activeLink = document.querySelector(`a[data-tab="${tab}"]`);
    if (activeLink) activeLink.classList.add('active');
    document.getElementById('header-tab-label').textContent = TAB_LABELS[tab];
    activeTab = tab;
    renderTab(tab);
}

document.querySelectorAll('a[data-tab]').forEach(link => {
    link.addEventListener('click', e => {
        e.preventDefault();
        switchTab(link.dataset.tab);
    });
});

/* ══════════════════════════════
   SECTION D — SIDEBAR TOGGLE
══════════════════════════════ */

const sidebarEl  = document.querySelector('.sidebar');
const menuToggle = document.querySelector('.bx-menu');
if (menuToggle && !menuToggle.dataset.sidebarInitialized) {
    menuToggle.dataset.sidebarInitialized = 'true';
    menuToggle.addEventListener('click', () => sidebarEl.classList.toggle('close'));
}

document.querySelector('.logout-section').addEventListener('click', () => {
    if (window.Auth) window.Auth.logout();
    window.location.replace('../../index.html');
});

/* ══════════════════════════════
   SECTION E — RENDER FUNCTIONS
══════════════════════════════ */

function renderTab(tab) {
    if (tab === 'overview')    renderOverview();
    if (tab === 'faculty')     renderFaculty();
    if (tab === 'organizations') renderOrganizations();
    if (tab === 'permissions') renderPermissions();
    if (tab === 'clearance')   renderClearance();
    if (tab === 'system')      renderSystem();
    if (tab === 'semester')    renderSemester();
    if (tab === 'audit')       renderAudit();
}

/* ── OVERVIEW ─────────────────── */
function renderOverview() {
    const el = document.getElementById('tab-overview');
    const activeFaculty  = facultyList.filter(f => f.status === 'active').length;
    const activeStudents = studentList.filter(s => s.status === 'active').length;
    const cleared        = studentList.filter(s => s.clearanceStatus === 'complete').length;
    const inProgress     = studentList.filter(s => s.clearanceStatus === 'in_progress').length;

    const systemStatuses = [
        { label: 'Database',            icon: 'data',        status: 'Operational' },
        { label: 'Payment Gateway',     icon: 'credit-card', status: 'Operational' },
        { label: 'Email Notifications', icon: 'envelope',    status: 'Operational' },
        { label: 'Clearance Module',    icon: 'clipboard',   status: 'Operational' },
        { label: 'Report Generator',    icon: 'bar-chart-alt-2', status: 'Maintenance' },
    ];

    const stats = [
        { label: 'Total Faculty',     value: activeFaculty,  sub: facultyList.length + ' total registered', cls: 'sib--green',   icon: 'group' },
        { label: 'Total Students',    value: activeStudents, sub: studentList.length + ' total enrolled',   cls: 'sib--blue',    icon: 'user-check' },
        { label: 'Cleared Students',  value: cleared,        sub: 'fully cleared this term',               cls: 'sib--emerald', icon: 'check-circle' },
        { label: 'Pending Clearance', value: inProgress,     sub: 'awaiting completion',                   cls: 'sib--amber',   icon: 'time-five' },
    ];

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">System Overview</div>
                <div class="section-sub">Manage all aspects of the WMSU CCS Student Fees Management System</div>
            </div>
        </div>

        <div class="stat-grid">
            ${stats.map(s => `
            <div class="stat-card">
                <div class="stat-icon-box ${s.cls}">${bxi(s.icon)}</div>
                <div class="stat-value">${s.value}</div>
                <div class="stat-label">${s.label}</div>
                <div class="stat-sub">${s.sub}</div>
            </div>`).join('')}
        </div>

        <div class="card" id="overview-quick-card">
            <div class="card-title">Quick Actions</div>
            <div class="quick-grid">
                <button class="quick-btn qbtn--green" data-goto="faculty">${bxi('plus')} <span>Add Faculty</span></button>
                <button class="quick-btn qbtn--blue"  data-goto="permissions">${bxi('key')} <span>Manage Permissions</span></button>
                <button class="quick-btn qbtn--amber" data-goto="organizations">${bxi('group')} <span>Add Organization</span></button>
                <button class="quick-btn qbtn--purple" data-goto="audit">${bxi('bar-chart-alt-2')} <span>View Audit Logs</span></button>
            </div>
        </div>

        <div class="two-col">
            <div class="card">
                <div class="card-title">System Status</div>
                ${systemStatuses.map(s => `
                <div class="toggle-row">
                    <span class="text-dark">${bxi(s.icon)} ${s.label}</span>
                    <span class="badge ${s.status === 'Operational' ? 'badge-green' : 'badge-amber'}">${s.status}</span>
                </div>`).join('')}
            </div>
            <div class="card">
                <div class="card-title">Recent Activity</div>
                ${auditLogs.slice(0, 5).map(log => `
                <div class="recent-item">
                    <div class="recent-mini-icon ${logRecentClass(log.type)}">${bxi(logTypeIcon(log.type))}</div>
                    <div class="recent-mini-text">
                        <div class="recent-mini-title">${log.action}</div>
                        <div class="recent-mini-detail">${log.details}</div>
                        <div class="recent-mini-time">${log.timestamp}</div>
                    </div>
                </div>`).join('')}
            </div>
        </div>
    `;

    el.querySelectorAll('.quick-btn[data-goto]').forEach(b => {
        b.addEventListener('click', () => switchTab(b.dataset.goto));
    });
}

/* ── FACULTY ──────────────────── */
let facultySearch = '';
let facultyRoleFilter = 'all';
let facultyStatusFilter = 'all';
let facultyDepartmentFilter = 'all';
let showAddFacultyForm = false;
let editingFacultyId = null;
let deleteConfirmFacultyId = null;
let showAddDepartmentForm = false;
let editingDepartmentId = null;
let deleteConfirmDepartmentId = null;
let customRoles = [];
let newFacultyData = {
    facultyId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    suffix: '',
    email: '',
    phone: '',
    sex: 'M',
    roles: [],
    department: 'BS Computer Science'
};
let newDepartmentData = {
    name: '',
    abbreviation: '',
    deanId: '',
    description: ''
};

function renderFaculty() {
    const el = document.getElementById('tab-faculty');
    const filtered = facultyList.filter(f => {
        const q = facultySearch.toLowerCase();
        return (f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q))
            && (facultyRoleFilter === 'all' || f.role === facultyRoleFilter)
            && (facultyStatusFilter === 'all' || f.status === facultyStatusFilter)
            && (facultyDepartmentFilter === 'all' || f.department === facultyDepartmentFilter);
    });

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Faculty Management</div>
                <div class="section-sub">Add, edit, or remove faculty members and assign their roles</div>
            </div>
        </div>

        <div style="margin-bottom: 24px;">
            <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0;">Departments</h2>
                <button class="btn btn-outline" id="show-add-dept-btn" style="font-size: 12px; padding: 6px 12px;">
                    ${bxi('plus')} Add Department
                </button>
            </div>
            <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 16px;">
                ${departmentList.map(d => {
                    const deptFaculty = facultyList.filter(f => f.department === d.name);
                    const dean = facultyList.find(f => f.id === d.deanId);
                    const professorCount = deptFaculty.filter(f => f.role === 'professor').length;
                    const headCount = deptFaculty.filter(f => f.role === 'dept_head').length;
                    return `
                    <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; ${deleteConfirmDepartmentId === d.id ? 'background: #fef2f2; border-color: #fca5a5;' : ''}">
                        <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                            <div>
                                <div style="font-weight: 600; font-size: 14px; color: #111827;">${d.name}</div>
                                <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px;">
                                    <span class="badge badge-blue">${d.abbreviation}</span>
                                </div>
                            </div>
                            ${deleteConfirmDepartmentId === d.id ? '' : `
                            <div style="display: flex; gap: 4px;">
                                <button class="icon-btn icon-btn--blue dept-edit-btn" data-id="${d.id}" title="Edit" style="width: 28px; height: 28px; font-size: 14px;">
                                    ${bxi('edit')}
                                </button>
                                <button class="icon-btn icon-btn--red dept-delete-btn" data-id="${d.id}" title="Delete" style="width: 28px; height: 28px; font-size: 14px;">
                                    ${bxi('trash')}
                                </button>
                            </div>
                            `}
                        </div>
                        <div style="margin: 12px 0; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                            <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                                <strong>Faculty:</strong> ${deptFaculty.length} total
                            </div>
                            ${dean ? `
                            <div style="font-size: 12px; color: #6b7280;">
                                <strong>Dean:</strong> ${dean.name.split(',')[0]}
                            </div>
                            ` : ''}
                        </div>
                        ${deleteConfirmDepartmentId === d.id ? `
                        <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #fca5a5; display: flex; gap: 8px;">
                            <button class="btn btn-outline dept-cancel-delete" data-id="${d.id}" style="font-size: 12px; padding: 6px 12px;">Cancel</button>
                            <button class="btn btn-red dept-confirm-delete" data-id="${d.id}" style="font-size: 12px; padding: 6px 12px;">Delete</button>
                        </div>
                        ` : ''}
                    </div>
                    `;
                }).join('')}
            </div>

        ${showAddDepartmentForm ? `
        <div class="form-box form-box--green" id="add-department-form" style="margin-bottom: 24px;">
            <div class="form-box-header">
                <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Department</span>
                <button class="form-close-btn" id="close-add-dept">${bxi('x')}</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Department Name *</label>
                    <input id="nd-name" value="${newDepartmentData.name}" placeholder="e.g. BS Computer Science">
                </div>
                <div class="form-group">
                    <label>Abbreviation *</label>
                    <input id="nd-abbr" value="${newDepartmentData.abbreviation}" placeholder="e.g. CS" maxlength="4">
                </div>
                <div class="form-group">
                    <label>Department Dean</label>
                    <select id="nd-dean">
                        <option value="">Select a dean...</option>
                        ${facultyList.filter(f => f.role === 'dean' && f.status === 'active').map(f =>
                            `<option value="${f.id}"${newDepartmentData.deanId === f.id ? ' selected' : ''}>${f.name}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Description (Optional)</label>
                    <input id="nd-desc" value="${newDepartmentData.description}" placeholder="e.g. Bachelor of Science in Computer Science">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" id="cancel-add-dept">Cancel</button>
                <button class="btn btn-green" id="save-add-dept">${bxi('save')} Save Department</button>
            </div>
        </div>` : ''}

        ${editingDepartmentId ? (() => {
            const d = departmentList.find(x => x.id === editingDepartmentId);
            return d ? `
            <div class="form-box form-box--blue" id="edit-department-form" style="margin-bottom: 24px;">
                <div class="form-box-header">
                    <span class="form-box-title form-box-title--blue">${bxi('edit')} Edit Department – ${d.name}</span>
                    <button class="form-close-btn" id="close-edit-dept">${bxi('x')}</button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Department Name *</label>
                        <input id="ed-name" value="${d.name}" placeholder="Department name">
                    </div>
                    <div class="form-group">
                        <label>Abbreviation *</label>
                        <input id="ed-abbr" value="${d.abbreviation}" placeholder="Abbreviation" maxlength="4">
                    </div>
                    <div class="form-group">
                        <label>Department Dean</label>
                        <select id="ed-dean">
                            <option value="">Select a dean...</option>
                            ${facultyList.filter(f => f.role === 'dean' && f.status === 'active').map(f =>
                                `<option value="${f.id}"${d.deanId === f.id ? ' selected' : ''}>${f.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Description (Optional)</label>
                        <input id="ed-desc" value="${d.description || ''}" placeholder="Description">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline" id="cancel-edit-dept">Cancel</button>
                    <button class="btn btn-blue" id="save-edit-dept">${bxi('save')} Save Changes</button>
                </div>
            </div>` : '';
        })() : ''}

        <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 24px; padding-top: 24px; border-top: 2px solid #e5e7eb;">
            <h2 style="font-size: 16px; font-weight: 600; color: #111827; margin: 0;">Faculty Members</h2>
            <button class="btn btn-green" id="show-add-faculty-btn" style="font-size: 12px; padding: 6px 12px;">
                ${bxi('plus')} Add Faculty
            </button>
        </div>
            <div class="search-wrap">
                <span class="search-icon">${bxi('search')}</span>
                <input id="faculty-search" value="${facultySearch}" placeholder="Search by name or email…">
            </div>
            <select class="filter-select" id="faculty-department-filter">
                <option value="all">All Departments</option>
                ${departmentList.map(d =>
                    `<option value="${d.name}"${facultyDepartmentFilter === d.name ? ' selected' : ''}>${d.name}</option>`
                ).join('')}
            </select>
            <select class="filter-select" id="faculty-role-filter">
                <option value="all">All Roles</option>
                ${Object.entries(ROLE_LABELS).map(([k, v]) =>
                    `<option value="${k}"${facultyRoleFilter === k ? ' selected' : ''}>${v}</option>`
                ).join('')}
            </select>
            <select class="filter-select" id="faculty-status-filter">
                <option value="all">All Status</option>
                <option value="active"${facultyStatusFilter === 'active' ? ' selected' : ''}>Active</option>
                <option value="inactive"${facultyStatusFilter === 'inactive' ? ' selected' : ''}>Inactive</option>
                <option value="suspended"${facultyStatusFilter === 'suspended' ? ' selected' : ''}>Suspended</option>
            </select>
        </div>

        ${showAddFacultyForm ? `
        <div class="form-box form-box--green" id="add-faculty-form">
            <div class="form-box-header">
                <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Faculty Member</span>
                <button class="form-close-btn" id="close-add-faculty">${bxi('x')}</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Faculty ID *</label>
                    <input id="nf-id" value="${newFacultyData.facultyId}" placeholder="e.g. FAC-007">
                </div>
                <div class="form-group">
                    <label>First Name *</label>
                    <input id="nf-firstName" value="${newFacultyData.firstName}" placeholder="e.g. Juan">
                </div>
                <div class="form-group">
                    <label>Middle Name</label>
                    <input id="nf-middleName" value="${newFacultyData.middleName}" placeholder="e.g. Carlos">
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input id="nf-lastName" value="${newFacultyData.lastName}" placeholder="e.g. Dela Cruz">
                </div>
                <div class="form-group">
                    <label>Sex *</label>
                    <div style="display: flex; gap: 16px; padding-top: 6px;">
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                            <input type="radio" id="nf-sex-m" name="nf-sex" value="M" ${newFacultyData.sex === 'M' ? 'checked' : ''} style="cursor: pointer;">
                            Male
                        </label>
                        <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                            <input type="radio" id="nf-sex-f" name="nf-sex" value="F" ${newFacultyData.sex === 'F' ? 'checked' : ''} style="cursor: pointer;">
                            Female
                        </label>
                    </div>
                </div>
                <div class="form-group">
                    <label>Suffix (Optional)</label>
                    <input id="nf-suffix" value="${newFacultyData.suffix || ''}" placeholder="e.g. PhD., MIT, Jr.">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label>Roles * (select at least one)</label>
                    <div class="roles-pill-container">
                        <input type="checkbox" class="nf-role-check role-pill-input" id="role-adviser" value="adviser" ${newFacultyData.roles.includes('adviser') ? 'checked' : ''}>
                        <label for="role-adviser" class="role-pill">Adviser</label>

                        <input type="checkbox" class="nf-role-check role-pill-input" id="role-head" value="dept_head" ${newFacultyData.roles.includes('dept_head') ? 'checked' : ''}>
                        <label for="role-head" class="role-pill">Head</label>

                        <input type="checkbox" class="nf-role-check role-pill-input" id="role-dean" value="dean" ${newFacultyData.roles.includes('dean') ? 'checked' : ''}>
                        <label for="role-dean" class="role-pill">Dean</label>

                        <input type="checkbox" class="nf-role-check role-pill-input" id="role-coordinator" value="coordinator" ${newFacultyData.roles.includes('coordinator') ? 'checked' : ''}>
                        <label for="role-coordinator" class="role-pill">Coordinator</label>
                        ${customRoles.map(r => `
                          <span style="display:inline-flex;align-items:center;gap:4px;position:relative;">
                            <input type="checkbox" class="nf-role-check role-pill-input" id="role-${r.id}" value="${r.id}" ${newFacultyData.roles.includes(r.id)?'checked':''}>
                            <label for="role-${r.id}" class="role-pill">${r.label}</label>
                            <button type="button" class="custom-role-delete" data-id="${r.id}" style="position:absolute;top:-6px;right:-6px;background:#fee2e2;border:none;border-radius:50%;width:18px;height:18px;cursor:pointer;color:#dc2626;font-size:11px;display:flex;align-items:center;justify-content:center;">×</button>
                          </span>
                        `).join('')}
                    </div>

                    <div class="add-role-section" style="margin-top: 12px; display: flex; align-items: center; gap: 8px; flex-wrap: wrap;">
                        <button type="button" class="btn btn-outline" id="btn-add-role" style="padding: 6px 12px; font-size: 13px; font-weight: 500;">+ Add Custom Role</button>
                        <div class="add-role-input-form" id="add-role-form" style="display: none; gap: 8px; align-items: center; flex-wrap: wrap;">
                            <input type="text" id="custom-role-input" placeholder="Enter role name" maxlength="30" style="padding: 8px 12px; border: 1px solid #d1d5db; border-radius: 6px; font-size: 14px; flex: 1; min-width: 150px; max-width: 200px;">
                            <button type="button" id="confirm-custom-role" class="btn btn-green" style="padding: 6px 16px; font-size: 13px; font-weight: 500;">Add</button>
                            <button type="button" id="cancel-custom-role" class="btn btn-outline" style="padding: 6px 16px; font-size: 13px; font-weight: 500;">Cancel</button>
                        </div>
                    </div>
                </div>
                <div class="form-group">
                    <label>Department *</label>
                    <select id="nf-dept">
                        ${['BS Computer Science', 'BS Information Technology', 'College of Computer Studies', 'Finance Office'].map(d =>
                            `<option${newFacultyData.department === d ? ' selected' : ''}>${d}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Phone Number</label>
                    <input id="nf-phone" type="tel" value="${newFacultyData.phone}" placeholder="+63-912-345-6789">
                </div>
                <div class="form-group">
                    <label>School Email *</label>
                    <input id="nf-email" type="email" value="${newFacultyData.email}" placeholder="Auto-generated from Faculty ID" readonly style="background:#f3f4f6; color:#6b7280; cursor:not-allowed;">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" id="cancel-add-faculty">Cancel</button>
                <button class="btn btn-green" id="save-add-faculty">${bxi('save')} Save Faculty</button>
            </div>
        </div>` : ''}

        ${editingFacultyId ? (() => {
            const f = facultyList.find(x => x.id === editingFacultyId);
            return f ? `
            <div class="form-box form-box--blue" id="edit-faculty-form">
                <div class="form-box-header">
                    <span class="form-box-title form-box-title--blue">${bxi('edit')} Edit Faculty – ${f.name}</span>
                    <button class="form-close-btn" id="close-edit-faculty">${bxi('x')}</button>
                </div>
                <div class="form-grid">
                    <div class="form-group"><label>Last Name *</label><input id="ef-lastname" value="${f.name.split(',')[0] || ''}"></div>
                    <div class="form-group"><label>First Name *</label><input id="ef-firstname" value="${f.name.split(',')[1]?.trim().split(' ')[0] || ''}"></div>
                    <div class="form-group"><label>Middle Initial (Optional)</label><input id="ef-mi" value="${f.name.split(',')[1]?.trim().split(' ')[1] || ''}"></div>
                    <div class="form-group">
                        <label>Sex *</label>
                        <div style="display: flex; gap: 16px; padding-top: 6px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                <input type="radio" id="ef-sex-m" name="ef-sex" value="M" ${f.sex === 'M' ? 'checked' : ''} style="cursor: pointer;">
                                Male
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                <input type="radio" id="ef-sex-f" name="ef-sex" value="F" ${f.sex === 'F' ? 'checked' : ''} style="cursor: pointer;">
                                Female
                            </label>
                        </div>
                    </div>
                    <div class="form-group"><label>Suffix (Optional)</label><input id="ef-suffix" value="${f.name.split(',')[1]?.trim().split(' ')[2] || ''}"></div>
                    <div class="form-group"><label>Email</label><input id="ef-email" type="email" value="${f.email}"></div>
                    <div class="form-group"><label>Phone</label><input id="ef-phone" value="${f.phone}"></div>
                    <div class="form-group">
                        <label>Role</label>
                        <select id="ef-role">
                            ${Object.entries(ROLE_LABELS).map(([k, v]) =>
                                `<option value="${k}"${f.role === k ? ' selected' : ''}>${v}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Status</label>
                        <select id="ef-status">
                            <option value="active"${f.status === 'active' ? ' selected' : ''}>Active</option>
                            <option value="inactive"${f.status === 'inactive' ? ' selected' : ''}>Inactive</option>
                            <option value="suspended"${f.status === 'suspended' ? ' selected' : ''}>Suspended</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Department</label>
                        <select id="ef-dept">
                            ${departmentList.map(d =>
                                `<option${f.department === d.name ? ' selected' : ''}>${d.name}</option>`
                            ).join('')}
                        </select>
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline" id="cancel-edit-faculty">Cancel</button>
                    <button class="btn btn-blue" id="save-edit-faculty">${bxi('save')} Save Changes</button>
                </div>
            </div>` : '';
        })() : ''}

        <div id="faculty-list">
            ${filtered.length === 0 ? `
            <div class="card faculty-empty-state">No faculty members found.</div>` :
            filtered.map(f => `
            <div class="member-card" data-faculty-id="${f.id}">
                <div class="member-row">
                    <div class="member-avatar ${statusAvatarClass(f.status)}">${getInitials(f.name)}</div>
                    <div class="member-info">
                        <div class="member-name">
                            ${f.name}
                            ${(f.roles || [f.role]).map(r => `<span class="badge ${ROLE_BADGE_CLASS[r]}">${ROLE_LABELS[r]}</span>`).join('')}
                            <span class="badge ${f.sex === 'M' ? 'badge-blue' : 'badge-indigo'}">${f.sex === 'M' ? 'Male' : 'Female'}</span>
                            <span class="badge ${f.status === 'active' ? 'badge-green' : f.status === 'inactive' ? 'badge-gray' : 'badge-red'}">
                                ${f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                            </span>
                        </div>
                        <div class="member-meta">
                            <span>${bxi('envelope')} ${f.email}</span>
                            <span>${bxi('buildings')} ${f.department}</span>
                            <span>${bxi('time-five')} Last login: ${f.lastLogin}</span>
                        </div>
                        <div class="member-perms">
                            ${f.permissions.slice(0, 4).map(p => {
                                const perm = ALL_PERMISSIONS.find(x => x.id === p);
                                return perm ? `<span class="badge badge-gray">${perm.label}</span>` : '';
                            }).join('')}
                            ${f.permissions.length > 4 ? `<span class="badge badge-gray">+${f.permissions.length - 4} more</span>` : ''}
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="icon-btn icon-btn--blue faculty-edit-btn" data-id="${f.id}" title="Edit">
                            ${bxi('edit')}
                        </button>
                        <button class="icon-btn icon-btn--amber faculty-toggle-btn" data-id="${f.id}" title="${f.status === 'active' ? 'Deactivate' : 'Activate'}">
                            ${f.status === 'active' ? bxi('lock') : bxi('lock-open')}
                        </button>
                        <button class="icon-btn icon-btn--red faculty-delete-btn" data-id="${f.id}" title="Remove">
                            ${bxi('trash')}
                        </button>
                    </div>
                </div>
                ${deleteConfirmFacultyId === f.id ? `
                <div class="confirm-box">
                    <span>${bxi('error')} Remove <strong>${f.name}</strong> from the system? This cannot be undone.</span>
                    <div class="confirm-box-actions">
                        <button class="btn btn-outline faculty-cancel-delete" data-id="${f.id}">Cancel</button>
                        <button class="btn btn-red faculty-confirm-delete" data-id="${f.id}">Remove</button>
                    </div>
                </div>` : ''}
            </div>`).join('')}
        </div>
    `;

    document.getElementById('show-add-faculty-btn')?.addEventListener('click', () => {
        showAddFacultyForm = true; renderFaculty();
    });
    document.getElementById('close-add-faculty')?.addEventListener('click', () => {
        showAddFacultyForm = false;
        customRoles = [];
        document.getElementById('custom-role-input').value = '';
        document.getElementById('add-role-form').style.display = 'none';
        document.getElementById('btn-add-role').style.display = 'block';
        renderFaculty();
    });
    document.getElementById('cancel-add-faculty')?.addEventListener('click', () => {
        showAddFacultyForm = false;
        customRoles = [];
        document.getElementById('custom-role-input').value = '';
        document.getElementById('add-role-form').style.display = 'none';
        document.getElementById('btn-add-role').style.display = 'block';
        renderFaculty();
    });
    document.getElementById('nf-id')?.addEventListener('input', e => {
        const generated = facultyEmailFromId(e.target.value.trim());
        document.getElementById('nf-email').value = e.target.value.trim() ? generated : '';
    });
    document.querySelectorAll('input[name="nf-sex"]').forEach(radio => {
        radio.addEventListener('change', e => {
            newFacultyData.sex = e.target.value;
        });
    });
    document.querySelectorAll('.nf-role-check').forEach(checkbox => {
        checkbox.addEventListener('change', e => {
            if (e.target.checked) {
                if (!newFacultyData.roles.includes(e.target.value)) {
                    newFacultyData.roles.push(e.target.value);
                }
            } else {
                newFacultyData.roles = newFacultyData.roles.filter(r => r !== e.target.value);
            }
        });
    });

    // Custom Role Button Listeners
    document.getElementById('btn-add-role')?.addEventListener('click', () => {
        document.getElementById('add-role-form').style.display = 'flex';
        document.getElementById('btn-add-role').style.display = 'none';
        document.getElementById('custom-role-input').focus();
    });

    document.getElementById('cancel-custom-role')?.addEventListener('click', () => {
        document.getElementById('add-role-form').style.display = 'none';
        document.getElementById('btn-add-role').style.display = 'block';
        document.getElementById('custom-role-input').value = '';
    });

    document.getElementById('confirm-custom-role')?.addEventListener('click', () => {
        const roleName = document.getElementById('custom-role-input').value.trim();
        if (!roleName) { showToast('Please enter a role name.', true); return; }

        const roleId = roleName.toLowerCase().replace(/\s+/g, '_');
        if (ROLE_LABELS[roleId] || customRoles.find(r => r.id === roleId)) {
            showToast('This role already exists.', true); return;
        }

        // Push to customRoles array
        customRoles.push({ id: roleId, label: roleName });

        // Register in ROLE_LABELS and ROLE_BADGE_CLASS
        ROLE_LABELS[roleId] = roleName;
        ROLE_BADGE_CLASS[roleId] = 'badge-purple';

        // Save all current form inputs into newFacultyData
        newFacultyData.facultyId  = document.getElementById('nf-id')?.value       ?? '';
        newFacultyData.firstName  = document.getElementById('nf-firstName')?.value ?? '';
        newFacultyData.lastName   = document.getElementById('nf-lastName')?.value  ?? '';
        newFacultyData.middleName = document.getElementById('nf-middleName')?.value ?? '';
        newFacultyData.suffix     = document.getElementById('nf-suffix')?.value     ?? '';
        newFacultyData.phone     = document.getElementById('nf-phone')?.value     ?? '';
        newFacultyData.email     = document.getElementById('nf-email')?.value     ?? '';
        newFacultyData.department = document.getElementById('nf-dept')?.value     ?? '';
        newFacultyData.sex       = document.querySelector('input[name="nf-sex"]:checked')?.value ?? 'M';
        newFacultyData.roles     = Array.from(document.querySelectorAll('.nf-role-check:checked')).map(c => c.value);

        // Reset add-role form
        document.getElementById('add-role-form').style.display = 'none';
        document.getElementById('btn-add-role').style.display  = 'block';
        document.getElementById('custom-role-input').value = '';

        showToast(`Custom role "${roleName}" added.`);
        renderFaculty();

        // Re-attach custom-role-delete handlers after render
        document.querySelectorAll('.custom-role-delete').forEach(btn => {
            btn.addEventListener('click', () => {
                const idToDelete = btn.dataset.id;
                // Remove from customRoles, ROLE_LABELS, ROLE_BADGE_CLASS
                customRoles = customRoles.filter(r => r.id !== idToDelete);
                delete ROLE_LABELS[idToDelete];
                delete ROLE_BADGE_CLASS[idToDelete];
                // Remove from current newFacultyData.roles if present
                newFacultyData.roles = newFacultyData.roles.filter(r => r !== idToDelete);
                // Save current form inputs then re-render
                newFacultyData.facultyId   = document.getElementById('nf-id')?.value       ?? '';
                newFacultyData.firstName   = document.getElementById('nf-firstName')?.value ?? '';
                newFacultyData.lastName    = document.getElementById('nf-lastName')?.value  ?? '';
                newFacultyData.middleName  = document.getElementById('nf-middleName')?.value ?? '';
                newFacultyData.suffix      = document.getElementById('nf-suffix')?.value     ?? '';
                newFacultyData.phone       = document.getElementById('nf-phone')?.value     ?? '';
                newFacultyData.email       = document.getElementById('nf-email')?.value     ?? '';
                newFacultyData.department  = document.getElementById('nf-dept')?.value     ?? '';
                newFacultyData.sex         = document.querySelector('input[name="nf-sex"]:checked')?.value ?? 'M';
                newFacultyData.roles       = Array.from(document.querySelectorAll('.nf-role-check:checked')).map(c => c.value);
                renderFaculty();
            });
        });
    });

    document.getElementById('custom-role-input')?.addEventListener('keypress', e => {
        if (e.key === 'Enter') {
            document.getElementById('confirm-custom-role').click();
        }
    });

    document.getElementById('btn-add-role')?.addEventListener('click', () => {
        document.getElementById('add-role-form').style.display = 'flex';
        document.getElementById('btn-add-role').style.display = 'none';
        document.getElementById('custom-role-input').focus();
    });

    document.getElementById('save-add-faculty')?.addEventListener('click', () => {
        const facultyId = document.getElementById('nf-id').value.trim();
        const firstName = document.getElementById('nf-firstName').value.trim();
        const middleName = document.getElementById('nf-middleName').value.trim();
        const lastName = document.getElementById('nf-lastName').value.trim();
        const suffix = document.getElementById('nf-suffix').value.trim();
        const sex = document.querySelector('input[name="nf-sex"]:checked')?.value || '';
        const email = document.getElementById('nf-email').value.trim();
        const roles = Array.from(document.querySelectorAll('.nf-role-check:checked')).map(c => c.value);
        const department = document.getElementById('nf-dept').value.trim();
        const phone = document.getElementById('nf-phone').value.trim();

        if (!facultyId || !firstName || !lastName || !email || roles.length === 0 || !department || !sex) {
            showToast('Faculty ID, First Name, Last Name, Email, at least one Role, Department, and Sex are required.', true);
            return;
        }

        // Build full name: LastName, FirstName MiddleName Suffix
        const nameParts = [lastName + ',', firstName];
        if (middleName) nameParts.push(middleName);
        if (suffix) nameParts.push(suffix);
        const name = nameParts.join(' ').trim();

        // Check if faculty ID already exists
        if (facultyList.find(f => f.id === facultyId)) {
            showToast('Faculty ID already exists.', true);
            return;
        }

        facultyList.push({
            id: facultyId,
            name: name,
            email: email,
            phone: phone,
            sex: sex,
            role: roles[0],
            roles: roles,
            department: department,
            status: 'active',
            permissions: [],
            dateAdded: 'Mar 8, 2026',
            lastLogin: 'Never',
        });

        showAddFacultyForm = false;
        newFacultyData = {
            facultyId: '',
            lastName: '',
            firstName: '',
            middleName: '',
            suffix: '',
            email: '',
            phone: '',
            sex: 'M',
            roles: [],
            department: 'BS Computer Science'
        };
        customRoles = [];
        document.getElementById('custom-role-input').value = '';
        document.getElementById('add-role-form').style.display = 'none';
        showToast('Faculty member ' + name + ' added.');
        renderFaculty();
    });

    document.getElementById('close-edit-faculty')?.addEventListener('click', () => {
        editingFacultyId = null; renderFaculty();
    });
    document.getElementById('cancel-edit-faculty')?.addEventListener('click', () => {
        editingFacultyId = null; renderFaculty();
    });
    document.getElementById('save-edit-faculty')?.addEventListener('click', () => {
        facultyList = facultyList.map(f => f.id !== editingFacultyId ? f : {
            ...f,
            name: [
                document.getElementById('ef-lastname').value.trim() + ',',
                document.getElementById('ef-firstname').value.trim(),
                document.getElementById('ef-mi').value.trim() ? document.getElementById('ef-mi').value.trim() + '.' : '',
                document.getElementById('ef-suffix').value.trim() || ''
            ].filter(Boolean).join(' ').trim(),
            email:      document.getElementById('ef-email').value,
            phone:      document.getElementById('ef-phone').value,
            sex:        document.querySelector('input[name="ef-sex"]:checked')?.value || 'M',
            role:       document.getElementById('ef-role').value,
            status:     document.getElementById('ef-status').value,
            department: document.getElementById('ef-dept').value,
        });
        editingFacultyId = null;
        showToast('Faculty updated.');
        renderFaculty();
    });

    document.getElementById('faculty-search')?.addEventListener('input', e => {
        facultySearch = e.target.value; renderFaculty();
    });
    document.getElementById('faculty-department-filter')?.addEventListener('change', e => {
        facultyDepartmentFilter = e.target.value; renderFaculty();
    });
    document.getElementById('faculty-role-filter')?.addEventListener('change', e => {
        facultyRoleFilter = e.target.value; renderFaculty();
    });
    document.getElementById('faculty-status-filter')?.addEventListener('change', e => {
        facultyStatusFilter = e.target.value; renderFaculty();
    });

    el.querySelectorAll('.faculty-edit-btn').forEach(b => b.addEventListener('click', () => {
        editingFacultyId = b.dataset.id; showAddFacultyForm = false; renderFaculty();
    }));
    el.querySelectorAll('.faculty-toggle-btn').forEach(b => b.addEventListener('click', () => {
        facultyList = facultyList.map(f =>
            f.id === b.dataset.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
        );
        showToast('Faculty status updated.'); renderFaculty();
    }));
    el.querySelectorAll('.faculty-delete-btn').forEach(b => b.addEventListener('click', () => {
        deleteConfirmFacultyId = b.dataset.id; renderFaculty();
    }));
    el.querySelectorAll('.faculty-cancel-delete').forEach(b => b.addEventListener('click', () => {
        deleteConfirmFacultyId = null; renderFaculty();
    }));
    el.querySelectorAll('.faculty-confirm-delete').forEach(b => b.addEventListener('click', () => {
        facultyList = facultyList.filter(f => f.id !== b.dataset.id);
        deleteConfirmFacultyId = null;
        showToast('Faculty removed.'); renderFaculty();
    }));

    // Department management listeners
    document.getElementById('show-add-dept-btn')?.addEventListener('click', () => {
        showAddDepartmentForm = true; renderFaculty();
    });
    document.getElementById('close-add-dept')?.addEventListener('click', () => {
        showAddDepartmentForm = false; renderFaculty();
    });
    document.getElementById('cancel-add-dept')?.addEventListener('click', () => {
        showAddDepartmentForm = false; renderFaculty();
    });
    document.getElementById('save-add-dept')?.addEventListener('click', () => {
        const name = document.getElementById('nd-name').value.trim();
        const abbr = document.getElementById('nd-abbr').value.trim();
        const deanId = document.getElementById('nd-dean').value.trim();

        if (!name || !abbr) {
            showToast('Department Name and Abbreviation are required.', true);
            return;
        }

        if (departmentList.find(d => d.name === name)) {
            showToast('Department with this name already exists.', true);
            return;
        }

        departmentList.push({
            id: 'DEPT-' + String(Date.now()).slice(-6),
            name: name,
            abbreviation: abbr,
            deanId: deanId,
            description: document.getElementById('nd-desc').value.trim(),
            faculty: [],
            status: 'active'
        });

        showAddDepartmentForm = false;
        newDepartmentData = { name: '', abbreviation: '', deanId: '', description: '' };
        showToast('Department added successfully.');
        renderFaculty();
    });

    document.getElementById('close-edit-dept')?.addEventListener('click', () => {
        editingDepartmentId = null; renderFaculty();
    });
    document.getElementById('cancel-edit-dept')?.addEventListener('click', () => {
        editingDepartmentId = null; renderFaculty();
    });
    document.getElementById('save-edit-dept')?.addEventListener('click', () => {
        const name = document.getElementById('ed-name').value.trim();
        const abbr = document.getElementById('ed-abbr').value.trim();
        const deanId = document.getElementById('ed-dean').value.trim();

        if (!name || !abbr) {
            showToast('Department Name and Abbreviation are required.', true);
            return;
        }

        departmentList = departmentList.map(d => d.id !== editingDepartmentId ? d : {
            ...d,
            name: name,
            abbreviation: abbr,
            deanId: deanId,
            description: document.getElementById('ed-desc').value.trim(),
        });
        editingDepartmentId = null;
        showToast('Department updated.');
        renderFaculty();
    });

    el.querySelectorAll('.dept-edit-btn').forEach(b => b.addEventListener('click', () => {
        editingDepartmentId = b.dataset.id; showAddDepartmentForm = false; renderFaculty();
    }));
    el.querySelectorAll('.dept-delete-btn').forEach(b => b.addEventListener('click', () => {
        deleteConfirmDepartmentId = b.dataset.id; renderFaculty();
    }));
    el.querySelectorAll('.dept-cancel-delete').forEach(b => b.addEventListener('click', () => {
        deleteConfirmDepartmentId = null; renderFaculty();
    }));
    el.querySelectorAll('.dept-confirm-delete').forEach(b => b.addEventListener('click', () => {
        departmentList = departmentList.filter(d => d.id !== b.dataset.id);
        deleteConfirmDepartmentId = null;
        showToast('Department removed.');
        renderFaculty();
    }));
}

/* ── STUDENTS ─────────────────── */
let studentSearch = '';
let showAddStudentForm = false;
let deleteConfirmStudentId = null;
let newStudentData = {
    studentId: '',
    lastName: '',
    firstName: '',
    middleName: '',
    email: '',
    course: 'BS Computer Science',
    year: '1st Year',
    section: 'A'
};

function renderStudents() {
    const el = document.getElementById('tab-students');
    const filtered = studentList.filter(s => {
        const q = studentSearch.toLowerCase();
        return s.name.toLowerCase().includes(q)
            || s.id.includes(q)
            || s.course.toLowerCase().includes(q);
    });

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Student Accounts</div>
                <div class="section-sub">Manage student accounts, status, and system access</div>
            </div>
            <button class="btn btn-green" id="show-add-student-btn">
                ${bxi('plus')} Add Student
            </button>
        </div>

        <div class="filters-row">
            <div class="search-wrap">
                <span class="search-icon">${bxi('search')}</span>
                <input id="student-search" value="${studentSearch}" placeholder="Search by name, ID, or course…">
            </div>
        </div>

        ${showAddStudentForm ? `
        <div class="form-box form-box--green">
            <div class="form-box-header">
                <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Student</span>
                <button class="form-close-btn" id="close-add-student">${bxi('x')}</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Last Name *</label>
                    <input id="ns-lastname" value="${newStudentData.lastname || ''}" placeholder="e.g. Santos">
                </div>
                <div class="form-group">
                    <label>First Name *</label>
                    <input id="ns-firstname" value="${newStudentData.firstname || ''}" placeholder="e.g. Maria">
                </div>
                <div class="form-group">
                    <label>Middle Initial (Optional)</label>
                    <input id="ns-mi" value="${newStudentData.mi || ''}" placeholder="e.g. A">
                </div>
                <div class="form-group">
                    <label>Suffix (Optional)</label>
                    <input id="ns-suffix" value="${newStudentData.suffix || ''}" placeholder="e.g. Jr., III">
                </div>
                <div class="form-group">
                    <label>Initial Password</label>
                    <input value="123456" disabled class="input-disabled">
                </div>
                <div class="form-group">
                    <label>Last Name *</label>
                    <input id="ns-last-name" value="${newStudentData.lastName}" placeholder="Last Name">
                </div>
                <div class="form-group">
                    <label>Year Level</label>
                    <select id="ns-year">
                        ${['1st Year', '2nd Year', '3rd Year', '4th Year'].map(year =>
                            `<option${newStudentData.year === year ? ' selected' : ''}>${year}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>First Name *</label>
                    <input id="ns-first-name" value="${newStudentData.firstName}" placeholder="First Name">
                </div>
                <div class="form-group">
                    <label>Course</label>
                    <select id="ns-course">
                        ${['BS Computer Science', 'BS Information Technology'].map(course =>
                            `<option${newStudentData.course === course ? ' selected' : ''}>${course}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Middle Name</label>
                    <input id="ns-middle-name" value="${newStudentData.middleName}" placeholder="Middle Name">
                </div>
                <div class="form-group">
                    <label>Section</label>
                    <select id="ns-section">
                        ${['A', 'B', 'C', 'D'].map(section =>
                            `<option${newStudentData.section === section ? ' selected' : ''}>${section}</option>`
                        ).join('')}
                    </select>
                </div>
                <div class="form-group">
                    <label>Student No. *</label>
                    <input id="ns-id" value="${newStudentData.studentId}" placeholder="e.g. 2025-1101">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" id="cancel-add-student">Cancel</button>
                <button class="btn btn-green" id="save-add-student">${bxi('save')} Save Student</button>
            </div>
        </div>` : ''}

        <div id="student-list">
            ${filtered.map(s => `
            <div class="member-card">
                <div class="member-row">
                    <div class="member-avatar ${statusAvatarClass(s.status)}">${getInitials(s.name)}</div>
                    <div class="member-info">
                        <div class="member-name">
                            ${s.name}
                            <span class="badge badge-gray student-id-badge">#${s.id}</span>
                            <span class="badge ${s.status === 'active' ? 'badge-green' : 'badge-red'}">
                                ${s.status.charAt(0).toUpperCase() + s.status.slice(1)}
                            </span>
                            <span class="badge ${paymentBadgeClass(s.paymentStatus)}">
                                ${s.paymentStatus.charAt(0).toUpperCase() + s.paymentStatus.slice(1)}
                            </span>
                        </div>
                        <div class="member-meta">
                            <span>${s.course} – ${s.year}, Sec. ${s.section}</span>
                            <span>
                                ${bxi('clipboard')} Clearance:
                                <span class="badge ${clearanceBadgeClass(s.clearanceStatus)}">${clearanceLabel(s.clearanceStatus)}</span>
                            </span>
                        </div>
                        <div class="member-perms">
                            ${['view_dashboard', 'make_payment', 'view_receipt'].map(p => `
                            <button class="badge ${s.permissions.includes(p) ? 'badge-green' : 'badge-gray'} student-perm-toggle"
                                data-sid="${s.id}" data-perm="${p}">
                                ${p === 'view_dashboard' ? 'Dashboard' : p === 'make_payment' ? 'Payments' : 'Receipts'}
                            </button>`).join('')}
                        </div>
                    </div>
                    <div class="member-actions">
                        <button class="icon-btn icon-btn--amber student-toggle-btn" data-id="${s.id}" title="${s.status === 'active' ? 'Suspend' : 'Activate'}">
                            ${s.status === 'active' ? bxi('block') : bxi('check')}
                        </button>
                        <button class="icon-btn icon-btn--red student-delete-btn" data-id="${s.id}" title="Remove">
                            ${bxi('trash')}
                        </button>
                    </div>
                </div>
                ${deleteConfirmStudentId === s.id ? `
                <div class="confirm-box">
                    <span>${bxi('error')} Remove <strong>${s.name}</strong>?</span>
                    <div class="confirm-box-actions">
                        <button class="btn btn-outline student-cancel-delete" data-id="${s.id}">Cancel</button>
                        <button class="btn btn-red student-confirm-delete" data-id="${s.id}">Remove</button>
                    </div>
                </div>` : ''}
            </div>`).join('')}
        </div>
    `;

    document.getElementById('show-add-student-btn')?.addEventListener('click', () => {
        showAddStudentForm = true; renderStudents();
    });
    document.getElementById('close-add-student')?.addEventListener('click', () => {
        showAddStudentForm = false; renderStudents();
    });
    document.getElementById('cancel-add-student')?.addEventListener('click', () => {
        showAddStudentForm = false; renderStudents();
    });
    document.getElementById('ns-id')?.addEventListener('input', e => {
        const generated = studentEmailFromId(e.target.value.trim());
        document.getElementById('ns-email').value = e.target.value.trim() ? generated : '';
    });
    document.getElementById('save-add-student')?.addEventListener('click', () => {
        const lastname = document.getElementById('ns-lastname').value.trim();
        const firstname = document.getElementById('ns-firstname').value.trim();
        const mi = document.getElementById('ns-mi').value.trim();
        const suffix = document.getElementById('ns-suffix').value.trim();
        const email = document.getElementById('ns-email').value.trim();
        if (!lastname || !firstname || !email) {
            showToast('Last name, first name and email are required.', true);
            return;
        }
        const name = [
            lastname + ',',
            firstname,
            mi ? mi + '.' : '',
            suffix || ''
        ].filter(Boolean).join(' ').trim();
        const id = '2026-' + String(Math.floor(Math.random() * 90000) + 10000);
        studentList.push({
            id, name, email,
            course: document.getElementById('ns-course').value,
            year:   document.getElementById('ns-year').value,
            section: document.getElementById('ns-section').value,
            status: 'active', paymentStatus: 'pending', clearanceStatus: 'not_started',
            permissions: ['view_dashboard', 'make_payment'], enrollmentDate: 'Mar 8, 2026',
        });
        showAddStudentForm = false;
        newStudentData = {
            studentId: '',
            lastName: '',
            firstName: '',
            middleName: '',
            email: '',
            course: 'BS Computer Science',
            year: '1st Year',
            section: 'A'
        };
        showToast('Student ' + name + ' added.');
        renderStudents();
    });

    document.getElementById('student-search')?.addEventListener('input', e => {
        studentSearch = e.target.value; renderStudents();
    });
    el.querySelectorAll('.student-toggle-btn').forEach(b => b.addEventListener('click', () => {
        studentList = studentList.map(s =>
            s.id === b.dataset.id ? { ...s, status: s.status === 'active' ? 'suspended' : 'active' } : s
        );
        showToast('Student status updated.'); renderStudents();
    }));
    el.querySelectorAll('.student-delete-btn').forEach(b => b.addEventListener('click', () => {
        deleteConfirmStudentId = b.dataset.id; renderStudents();
    }));
    el.querySelectorAll('.student-cancel-delete').forEach(b => b.addEventListener('click', () => {
        deleteConfirmStudentId = null; renderStudents();
    }));
    el.querySelectorAll('.student-confirm-delete').forEach(b => b.addEventListener('click', () => {
        studentList = studentList.filter(s => s.id !== b.dataset.id);
        deleteConfirmStudentId = null;
        showToast('Student removed.'); renderStudents();
    }));
    el.querySelectorAll('.student-perm-toggle').forEach(b => b.addEventListener('click', () => {
        const sid = b.dataset.sid, perm = b.dataset.perm;
        studentList = studentList.map(s => {
            if (s.id !== sid) return s;
            const perms = s.permissions.includes(perm)
                ? s.permissions.filter(p => p !== perm)
                : [...s.permissions, perm];
            return { ...s, permissions: perms };
        });
        renderStudents();
    }));
}

/* ── PERMISSIONS ──────────────── */
let expandedFacultyPermId = null;
const studentMgmtPerms = ALL_PERMISSIONS.filter(p => p.category === 'Student Management');
const otherPerms       = ALL_PERMISSIONS.filter(p => p.category !== 'Student Management');
const otherCategories  = [...new Set(otherPerms.map(p => p.category))];

function toggleFacultyPerm(facultyId, permId) {
    facultyList = facultyList.map(f => {
        if (f.id !== facultyId) return f;
        const perms = f.permissions.includes(permId)
            ? f.permissions.filter(p => p !== permId)
            : [...f.permissions, permId];
        return { ...f, permissions: perms };
    });
    renderPermissions();
}

function renderOrganizations() {
    const el = document.getElementById('tab-organizations');

    const filipinoNames = [
        'Maria Santos', 'Juan Dela Cruz', 'Pedro Garcia', 'Ana Lopez', 'Carlos Reyes',
        'Rosa Torres', 'Miguel Rodriguez', 'Luisa Fernandez', 'Antonio Morales', 'Isabel Cruz',
        'Ramon Gutierrez', 'Sofia Romero', 'Diego Mendoza', 'Carmen Flores', 'Francisco Ruiz',
        'Angela Vargas', 'Manuel Jimenez', 'Elena Castillo', 'Luis Aguirre', 'Beatriz Navarro'
    ];

    const assignedHeads = new Map();

    function getRandomFilipinoName(orgId) {
        if (assignedHeads.has(orgId)) {
            return assignedHeads.get(orgId);
        }
        const randomName = filipinoNames[orgId.charCodeAt(0) % filipinoNames.length];
        assignedHeads.set(orgId, randomName);
        return randomName;
    }

    function getStudentName(studentId) {
        const account = window.SAMPLE_ACCOUNTS?.find(a => a.id === studentId);
        return account ? `${account.name} (${account.studentId})` : studentId;
    }

    function addAuditLogOrg(action, details) {
        const log = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toLocaleString(),
            user: 'Admin',
            role: 'System Admin',
            action: action,
            details: details,
            ipAddress: '192.168.1.1',
            type: 'info'
        };
        auditLogs.unshift(log);
    }

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Organizations</div>
                <div class="section-sub">Manage student organizations and assign organization heads</div>
            </div>
        </div>

        ${showAddOrgForm ? `
        <div class="form-box form-box--green" style="margin-bottom: 24px;">
            <div class="form-box-header">
                <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Organization</span>
                <button class="form-close-btn" id="close-add-org">${bxi('x')}</button>
            </div>
            <div class="form-grid">
                <div class="form-group">
                    <label>Organization Name *</label>
                    <input id="no-name" value="${newOrgData.name}" placeholder="e.g. Supreme Student Council">
                </div>
                <div class="form-group">
                    <label>Abbreviation *</label>
                    <input id="no-abbr" value="${newOrgData.abbreviation}" placeholder="e.g. SSC" maxlength="10">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label>Description (Optional)</label>
                    <textarea id="no-desc" placeholder="Organization description" style="resize: vertical; min-height: 60px;">${newOrgData.description}</textarea>
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label>Organization Head</label>
                    <div style="display: flex; gap: 8px; margin-bottom: 8px;">
                        <input type="email" id="no-head-email" placeholder="Enter student email" style="flex: 1;">
                        <button type="button" id="no-head-lookup" class="btn btn-green" style="padding: 8px 16px;">Find Student</button>
                    </div>
                    <div id="no-head-result"></div>
                    <div style="margin-top: 8px;">
                        <button type="button" id="no-head-skip" class="btn btn-outline" style="font-size: 11px; padding: 4px 12px;">Skip / Assign later</button>
                    </div>
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-outline" id="cancel-add-org">Cancel</button>
                <button class="btn btn-green" id="save-add-org">${bxi('save')} Save Organization</button>
            </div>
        </div>` : ''}

        <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(300px, 1fr)); gap: 16px; margin-bottom: 24px;">
            ${organizationList.length === 0 ? `
            <div class="card" style="grid-column: 1 / -1; padding: 32px; text-align: center; color: #9ca3af;">
                No organizations yet. Create one to get started.
            </div>` : organizationList.map(org => {
                const head = window.SAMPLE_ACCOUNTS?.find(a => a.id === org.head);
                const hasPending = org.pendingHandover !== null;
                return `
                <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; ${deleteConfirmOrgId === org.id ? 'background: #fef2f2; border-color: #fca5a5;' : ''}">
                    <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 12px;">
                        <div>
                            <div style="font-weight: 600; font-size: 14px; color: #111827;">${org.name}</div>
                            <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px;">
                                <span class="badge badge-blue">${org.abbreviation}</span>
                                ${hasPending ? '<span class="badge badge-amber">Pending Handover</span>' : ''}
                            </div>
                        </div>
                        ${deleteConfirmOrgId === org.id ? '' : `
                        <div style="display: flex; gap: 4px;">
                            <button class="icon-btn icon-btn--blue org-edit-btn" data-id="${org.id}" title="Edit" style="width: 28px; height: 28px; font-size: 14px;">
                                ${bxi('edit')}
                            </button>
                            <button class="icon-btn icon-btn--red org-delete-btn" data-id="${org.id}" title="Delete" style="width: 28px; height: 28px; font-size: 14px;">
                                ${bxi('trash')}
                            </button>
                        </div>
                        `}
                    </div>
                    ${org.description ? `<div style="font-size: 12px; color: #6b7280; margin-bottom: 12px;">${org.description}</div>` : ''}
                    <div style="margin: 12px 0; padding: 12px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                        <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                            <strong>Managed by:</strong> ${head ? head.name : getRandomFilipinoName(org.id)}
                        </div>
                        ${head ? `<div style="font-size: 11px; color: #9ca3af;">${head.studentId || head.id} • ${head.email}</div>` : ''}
                    </div>
                    ${hasPending ? `
                    <div style="margin-top: 12px; padding-top: 12px; border-top: 1px solid #e5e7eb; display: flex; gap: 8px;">
                        <button class="btn btn-outline org-approve-handover" data-id="${org.id}" style="font-size: 12px; padding: 6px 12px; flex: 1;">
                            ${bxi('check')} Approve
                        </button>
                        <button class="btn btn-red org-reject-handover" data-id="${org.id}" style="font-size: 12px; padding: 6px 12px; flex: 1;">
                            ${bxi('x')} Reject
                        </button>
                    </div>
                    ` : ''}
                    ${deleteConfirmOrgId === org.id ? `
                    <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #fca5a5; display: flex; gap: 8px;">
                        <button class="btn btn-outline org-cancel-delete" data-id="${org.id}" style="font-size: 12px; padding: 6px 12px;">Cancel</button>
                        <button class="btn btn-red org-confirm-delete" data-id="${org.id}" style="font-size: 12px; padding: 6px 12px;">Delete</button>
                    </div>
                    ` : ''}
                </div>
                `;
            }).join('')}
        </div>

        ${!showAddOrgForm ? `
        <button class="btn btn-green" id="show-add-org-btn" style="font-size: 12px; padding: 8px 16px;">
            ${bxi('plus')} Add Organization
        </button>` : ''}
    `;

    document.getElementById('show-add-org-btn')?.addEventListener('click', () => {
        showAddOrgForm = true; renderOrganizations();
    });
    document.getElementById('close-add-org')?.addEventListener('click', () => {
        showAddOrgForm = false; renderOrganizations();
    });
    document.getElementById('cancel-add-org')?.addEventListener('click', () => {
        showAddOrgForm = false; renderOrganizations();
    });

    document.getElementById('no-head-lookup')?.addEventListener('click', () => {
        const email = document.getElementById('no-head-email').value.trim().toLowerCase();
        const resultDiv = document.getElementById('no-head-result');
        if (!email) {
            resultDiv.innerHTML = '<div style="color: #dc2626; font-size: 12px;">Please enter an email address.</div>';
            return;
        }
        const student = (window.SAMPLE_ACCOUNTS || []).find(a =>
            a.permissions?.studentView && a.email.toLowerCase() === email
        );
        if (student) {
            newOrgData.head = student.id;
            resultDiv.innerHTML = `<div style="color: #16a34a; font-size: 12px;">✓ Found: <strong>${student.name}</strong> (${student.studentId})</div>`;
        } else {
            newOrgData.head = '';
            resultDiv.innerHTML = '<div style="color: #dc2626; font-size: 12px;">No student account found with this email.</div>';
        }
    });

    document.getElementById('no-head-skip')?.addEventListener('click', () => {
        newOrgData.head = '';
        document.getElementById('no-head-email').value = '';
        document.getElementById('no-head-result').innerHTML = '';
    });

    document.getElementById('save-add-org')?.addEventListener('click', () => {
        const name = document.getElementById('no-name').value.trim();
        const abbr = document.getElementById('no-abbr').value.trim();
        const description = document.getElementById('no-desc').value.trim();
        const head = newOrgData.head;

        if (!name || !abbr) {
            showToast('Organization Name and Abbreviation are required.', true);
            return;
        }

        if (!editingOrgId && organizationList.find(o => o.name === name)) {
            showToast('Organization with this name already exists.', true);
            return;
        }

        const newOrg = {
            id: 'ORG-' + String(Date.now()).slice(-6),
            name: name,
            abbreviation: abbr,
            description: description,
            head: head,
            pendingHandover: null,
            createdAt: new Date().toISOString()
        };

        organizationList.push(newOrg);

        const headAccount = window.SAMPLE_ACCOUNTS.find(a => a.id === head);
        if (headAccount) {
            headAccount.permissions.organizationView = true;
            const user = window.Auth.getUser();
            if (user && user.id === head) {
                user.permissions.organizationView = true;
                window.Auth.setStoredUser(user);
            }
        }

        addAuditLogOrg('Organization Created', `Created organization "${name}" with head ${getStudentName(head)}`);

        showAddOrgForm = false;
        newOrgData = { name: '', abbreviation: '', description: '', head: '' };
        showToast('Organization created successfully.');
        renderOrganizations();
    });

    el.querySelectorAll('.org-edit-btn').forEach(b => b.addEventListener('click', () => {
        const org = organizationList.find(o => o.id === b.dataset.id);
        if (org) {
            newOrgData = { name: org.name, abbreviation: org.abbreviation, description: org.description, head: org.head };
            editingOrgId = b.dataset.id;
            showAddOrgForm = true;
            setTimeout(() => {
                const headEmail = org.head ? (window.SAMPLE_ACCOUNTS || []).find(a => a.id === org.head)?.email : '';
                const emailInput = document.getElementById('no-head-email');
                const resultDiv = document.getElementById('no-head-result');
                if (emailInput && headEmail) {
                    emailInput.value = headEmail;
                    const student = (window.SAMPLE_ACCOUNTS || []).find(a => a.id === org.head);
                    if (student) {
                        resultDiv.innerHTML = `<div style="color: #16a34a; font-size: 12px;">✓ Found: <strong>${student.name}</strong> (${student.studentId})</div>`;
                    }
                }
            }, 0);
            renderOrganizations();
        }
    }));

    el.querySelectorAll('.org-delete-btn').forEach(b => b.addEventListener('click', () => {
        deleteConfirmOrgId = b.dataset.id; renderOrganizations();
    }));
    el.querySelectorAll('.org-cancel-delete').forEach(b => b.addEventListener('click', () => {
        deleteConfirmOrgId = null; renderOrganizations();
    }));
    el.querySelectorAll('.org-confirm-delete').forEach(b => b.addEventListener('click', () => {
        const org = organizationList.find(o => o.id === b.dataset.id);
        if (org && org.head) {
            const headAccount = window.SAMPLE_ACCOUNTS.find(a => a.id === org.head);
            if (headAccount) {
                headAccount.permissions.organizationView = false;
                const user = window.Auth.getUser();
                if (user && user.id === org.head) {
                    user.permissions.organizationView = false;
                    window.Auth.setStoredUser(user);
                }
            }
        }
        addAuditLogOrg('Organization Deleted', `Deleted organization "${org?.name}"`);
        organizationList = organizationList.filter(o => o.id !== b.dataset.id);
        deleteConfirmOrgId = null;
        showToast('Organization deleted.');
        renderOrganizations();
    }));

    el.querySelectorAll('.org-approve-handover').forEach(b => b.addEventListener('click', () => {
        const org = organizationList.find(o => o.id === b.dataset.id);
        if (org && org.pendingHandover) {
            const oldHead = org.head;
            const newHead = org.pendingHandover.toStudentId;

            const oldAccount = window.SAMPLE_ACCOUNTS.find(a => a.id === oldHead);
            const newAccount = window.SAMPLE_ACCOUNTS.find(a => a.id === newHead);

            if (oldAccount) {
                oldAccount.permissions.organizationView = false;
            }
            if (newAccount) {
                newAccount.permissions.organizationView = true;
                const user = window.Auth.getUser();
                if (user && user.id === newHead) {
                    user.permissions.organizationView = true;
                    window.Auth.setStoredUser(user);
                }
            }

            org.head = newHead;
            org.pendingHandover = null;

            addAuditLogOrg('Org Head Handover Approved', `Approved handover for ${org.name} from ${getStudentName(oldHead)} to ${getStudentName(newHead)}`);
            showToast('Handover approved.');
            renderOrganizations();
        }
    }));

    el.querySelectorAll('.org-reject-handover').forEach(b => b.addEventListener('click', () => {
        const org = organizationList.find(o => o.id === b.dataset.id);
        if (org && org.pendingHandover) {
            const newHeadId = org.pendingHandover.toStudentId;
            addAuditLogOrg('Org Head Handover Rejected', `Rejected handover for ${org.name}, head remains ${getStudentName(org.head)}`);
            org.pendingHandover = null;
            showToast('Handover rejected.');
            renderOrganizations();
        }
    }));
}

function renderPermissions() {
    const el = document.getElementById('tab-permissions');

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Role Permissions</div>
                <div class="section-sub">Configure what each role can access and do in the system</div>
            </div>
        </div>

        <div class="info-banner info-banner--amber">
            <span class="info-banner-icon">${bxi('error')}</span>
            <p>Changing permissions affects all users with the corresponding role immediately. Changes are logged in the Audit trail.</p>
        </div>

        <div class="card" id="perm-matrix-card">
            <div class="perm-section-head">
                <span class="perm-section-head-icon">${bxi('graduation')}</span>
                <div>
                    <div class="perm-section-head-title">Student Management Permissions</div>
                    <div class="perm-section-head-sub">Control who can add, edit, or remove students</div>
                </div>
            </div>
            <div class="perm-legend-row">
                ${studentMgmtPerms.map(p => {
                    const d = STUDENT_PERM_DETAILS[p.id];
                    return `<div class="perm-legend-item">
                        <span class="perm-legend-icon">${bxi(d.icon)}</span>
                        <span class="perm-legend-item-label">${p.label}</span>
                        <span class="badge ${riskBadgeClass(d.risk)}">${d.risk}</span>
                    </div>`;
                }).join('')}
            </div>
            <div class="perm-table-overflow">
                <table class="perm-table">
                    <thead>
                        <tr>
                            <th>Faculty / Role</th>
                            ${studentMgmtPerms.map(p => {
                                const d = STUDENT_PERM_DETAILS[p.id];
                                return `<th class="th-center">
                                    <div class="perm-th-cell">
                                        ${bxi(d.icon)}
                                        <span>${p.label}</span>
                                        <span class="badge ${riskBadgeClass(d.risk)}">${d.risk}</span>
                                    </div>
                                </th>`;
                            }).join('')}
                        </tr>
                    </thead>
                    <tbody>
                        ${facultyList.map(f => `
                        <tr>
                            <td>
                                <div class="perm-table-faculty-cell">
                                    <div class="member-avatar mem-av--active perm-table-avatar">${getInitials(f.name)}</div>
                                    <div>
                                        <div class="perm-table-fname">${f.name.split(',')[0]}</div>
                                        <span class="badge ${ROLE_BADGE_CLASS[f.role]}">${ROLE_LABELS[f.role]}</span>
                                    </div>
                                </div>
                            </td>
                            ${studentMgmtPerms.map(p => {
                                const has = f.permissions.includes(p.id);
                                const d   = STUDENT_PERM_DETAILS[p.id];
                                return `<td class="th-center">
                                    <button class="perm-checkbox ${has ? riskCheckClass(d.risk) : ''} matrix-perm-toggle"
                                        data-fid="${f.id}" data-pid="${p.id}" title="${d.desc}">
                                        ${has ? bxi('check') : ''}
                                    </button>
                                </td>`;
                            }).join('')}
                        </tr>`).join('')}
                    </tbody>
                </table>
            </div>
            <div class="perm-desc-footer">
                <div class="perm-desc-footer-title">Permission Descriptions</div>
                <div class="perm-desc-grid">
                    ${studentMgmtPerms.map(p => {
                        const d = STUDENT_PERM_DETAILS[p.id];
                        return `<div class="perm-desc-item ${d.risk === 'high' ? 'perm-desc-item--red' : 'perm-desc-item--blue'}">
                            <span class="perm-desc-item-icon">${bxi(d.icon)}</span>
                            <div>
                                <div class="perm-desc-item-name">${p.label}</div>
                                <div class="perm-desc-item-text">${d.desc}</div>
                            </div>
                        </div>`;
                    }).join('')}
                </div>
            </div>
        </div>

        <div class="perm-save-row">
            <button class="btn btn-blue" id="save-student-perms">
                Save Student Permissions
            </button>
        </div>

        <div>
            <div class="perm-other-title">Other Role Permissions</div>
            <div class="perm-other-sub">Configure clearance, finance, report, and system access per faculty member</div>
        </div>

        ${facultyList.map(f => {
            const isExp = expandedFacultyPermId === f.id;
            const studentPermCount = f.permissions.filter(p =>
                ['add_students','edit_students','remove_students','manage_students'].includes(p)
            ).length;
            const otherPermCount = f.permissions.filter(p =>
                !['view_students','add_students','edit_students','remove_students','manage_students'].includes(p)
            ).length;
            return `
            <div class="accordion-card">
                <button class="accordion-btn accordion-perm-btn" data-fid="${f.id}">
                    <div class="accordion-btn-left">
                        <div class="member-avatar mem-av--active">${getInitials(f.name)}</div>
                        <div class="accordion-btn-info">
                            <div class="accordion-btn-name">${f.name}</div>
                            <div class="accordion-btn-sub">
                                ${ROLE_LABELS[f.role]} –
                                <span class="accordion-btn-sub-blue">${studentPermCount} student perm(s)</span>,
                                ${otherPermCount} other
                            </div>
                        </div>
                    </div>
                    <div class="accordion-btn-right">
                        <span class="badge ${ROLE_BADGE_CLASS[f.role]}">${ROLE_LABELS[f.role]}</span>
                        <span class="accordion-chevron ${isExp ? 'open' : ''}">${bxi('chevron-down')}</span>
                    </div>
                </button>
                <div class="accordion-body ${isExp ? 'accordion-body--expanded' : ''}" id="perm-body-${f.id}">
                    ${otherCategories.map(cat => `
                    <div class="accordion-category">
                        <div class="accordion-category-title">${cat}</div>
                        <div class="accordion-category-pills">
                            ${otherPerms.filter(p => p.category === cat).map(p => {
                                const has = f.permissions.includes(p.id);
                                return `<button class="perm-pill ${has ? 'perm-pill--on' : 'perm-pill--off'} other-perm-toggle"
                                    data-fid="${f.id}" data-pid="${p.id}">
                                    <span class="perm-pill-check">${has ? bxi('check') : ''}</span>
                                    <span>${p.label}</span>
                                </button>`;
                            }).join('')}
                        </div>
                    </div>`).join('')}
                    <div class="accordion-save-row">
                        <button class="btn btn-green save-other-perms" data-fid="${f.id}">
                            ${bxi('save')} Save Permissions
                        </button>
                    </div>
                </div>
            </div>`;
        }).join('')}
    `;

    document.getElementById('save-student-perms')?.addEventListener('click', () =>
        showToast('Student management permissions saved.')
    );
    el.querySelectorAll('.matrix-perm-toggle').forEach(b => b.addEventListener('click', () => {
        toggleFacultyPerm(b.dataset.fid, b.dataset.pid);
    }));
    el.querySelectorAll('.accordion-perm-btn').forEach(b => b.addEventListener('click', () => {
        expandedFacultyPermId = expandedFacultyPermId === b.dataset.fid ? null : b.dataset.fid;
        renderPermissions();
    }));
    el.querySelectorAll('.other-perm-toggle').forEach(b => b.addEventListener('click', () => {
        toggleFacultyPerm(b.dataset.fid, b.dataset.pid);
    }));
    el.querySelectorAll('.save-other-perms').forEach(b => b.addEventListener('click', () => {
        const f = facultyList.find(x => x.id === b.dataset.fid);
        showToast('Permissions saved for ' + (f?.name || '') + '.');
        expandedFacultyPermId = null;
        renderPermissions();
    }));
}

/* ── FEES ─────────────────────── */
let editingFeeId = null;
let showAddFeeModal = false;

function renderFees() {
    const el = document.getElementById('tab-fees');
    const activeFees = feeList.filter(f => f.status === 'active');
    const total = activeFees.reduce((s, f) => s + f.amount, 0);

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Fee Configuration</div>
                <div class="section-sub">Manage fee types, amounts, and due dates</div>
            </div>
            <button class="btn btn-green" id="add-fee-btn">
                ${bxi('plus')} Add Fee
            </button>
        </div>

        ${showAddFeeModal ? `
        <div class="admin-fee-modal-overlay active" id="add-fee-modal">
            <div class="admin-fee-modal-container">
                <div class="admin-fee-modal-header">
                    <div>
                        <h3>Add New Fee</h3>
                        <p>Fill in the details for the new organization fee</p>
                    </div>
                    <button class="admin-fee-modal-close" type="button" id="close-add-fee-modal" aria-label="Close add fee form">
                        ${bxi('x')}
                    </button>
                </div>

                <div class="admin-fee-modal-body">
                    <div class="admin-fee-form-group">
                        <label for="nf-fee-name">Fee Name <span class="admin-fee-required">*</span></label>
                        <input type="text" id="nf-fee-name" placeholder="e.g. CSC Fee" />
                    </div>
                    <div class="admin-fee-form-group">
                        <label for="nf-fee-desc">Description <span class="admin-fee-required">*</span></label>
                        <input type="text" id="nf-fee-desc" placeholder="e.g. College Student Council Fee" />
                    </div>

                    <div class="admin-fee-form-row">
                        <div class="admin-fee-form-group">
                            <label for="nf-fee-amount">Amount (PHP) <span class="admin-fee-required">*</span></label>
                            <div class="admin-fee-input-prefix">
                                <span>₱</span>
                                <input type="number" id="nf-fee-amount" placeholder="0.00" min="0" step="0.01" />
                            </div>
                        </div>
                        <div class="admin-fee-form-group">
                            <label for="nf-fee-due">Due Date <span class="admin-fee-required">*</span></label>
                            <input type="date" id="nf-fee-due" />
                        </div>
                    </div>

                    <div class="admin-fee-form-group">
                        <label for="nf-fee-category">Assigned To / Category</label>
                        <select id="nf-fee-category">
                            <option value="">Select category...</option>
                            <option value="CCS Student Council">CCS Student Council</option>
                            <option value="CCS Faculty">CCS Faculty</option>
                            <option value="Insurance">Insurance</option>
                            <option value="Other">Other</option>
                        </select>
                    </div>

                    <div class="admin-fee-form-group">
                        <label>Status</label>
                        <div class="admin-fee-toggle-group">
                            <label class="admin-fee-toggle">
                                <input type="checkbox" id="nf-fee-status" checked />
                                <span class="admin-fee-toggle-slider"></span>
                            </label>
                            <span class="admin-fee-status-label" id="nf-fee-status-label">Active</span>
                        </div>
                    </div>

                    <div class="admin-fee-note">
                        ${bxi('info-circle')}
                        This fee will appear on every student's dashboard as an unpaid item to settle.
                    </div>
                </div>

                <div class="admin-fee-modal-footer">
                    <button class="btn btn-outline" type="button" id="cancel-add-fee-modal">Cancel</button>
                    <button class="btn btn-green" type="button" id="submit-add-fee">${bxi('plus')} Add Fee</button>
                </div>
            </div>
        </div>
        ` : ''}

        <div id="fee-list">
            ${feeList.map(f => `
            <div class="fee-card" data-fee-id="${f.id}">
                ${editingFeeId === f.id ? `
                <div class="form-grid">
                    <div class="form-group"><label>Fee Name</label><input id="ef-fname" value="${f.name}"></div>
                    <div class="form-group"><label>Amount (₱)</label><input id="ef-famount" type="number" value="${f.amount}"></div>
                    <div class="form-group"><label>Description</label><input id="ef-fdesc" value="${f.description}"></div>
                    <div class="form-group"><label>Due Date</label><input id="ef-fdue" value="${f.dueDate}"></div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline fee-cancel-edit">Cancel</button>
                    <button class="btn btn-green fee-save-edit" data-id="${f.id}">${bxi('save')} Save</button>
                </div>` : `
                <div class="fee-row">
                    <div class="fee-icon">${bxi('dollar-circle')}</div>
                    <div class="fee-info">
                        <div class="fee-name">
                            ${f.name}
                            <span class="badge ${f.status === 'active' ? 'badge-green' : 'badge-gray'}">${f.status}</span>
                        </div>
                        <div class="fee-desc">${f.description} • Due: ${f.dueDate}</div>
                    </div>
                    <div class="fee-amount">₱${f.amount.toFixed(2)}</div>
                    <div class="fee-actions">
                        <button class="icon-btn icon-btn--blue fee-edit-btn" data-id="${f.id}" title="Edit">${bxi('edit')}</button>
                        <button class="icon-btn icon-btn--amber fee-toggle-btn" data-id="${f.id}" title="${f.status === 'active' ? 'Disable' : 'Enable'}">
                            ${f.status === 'active' ? bxi('hide') : bxi('show')}
                        </button>
                        <button class="icon-btn icon-btn--red fee-delete-btn" data-id="${f.id}" title="Remove">${bxi('trash')}</button>
                    </div>
                </div>`}
            </div>`).join('')}
        </div>
        <div class="total-bar">
            <div>
                <div class="total-bar-label">Total Active Fees</div>
                <div class="total-bar-sub">${activeFees.length} active fee type(s)</div>
            </div>
            <div class="total-bar-value">₱${total.toFixed(2)}</div>
        </div>
    `;

    document.getElementById('add-fee-btn')?.addEventListener('click', () => {
        showAddFeeModal = true;
        editingFeeId = null;
        renderFees();
    });

    const addFeeModal = document.getElementById('add-fee-modal');
    const closeAddFeeModal = () => {
        showAddFeeModal = false;
        renderFees();
    };

    document.getElementById('close-add-fee-modal')?.addEventListener('click', closeAddFeeModal);
    document.getElementById('cancel-add-fee-modal')?.addEventListener('click', closeAddFeeModal);

    addFeeModal?.addEventListener('click', e => {
        if (e.target === addFeeModal) closeAddFeeModal();
    });

    document.getElementById('nf-fee-status')?.addEventListener('change', e => {
        const label = document.getElementById('nf-fee-status-label');
        if (label) label.textContent = e.target.checked ? 'Active' : 'Inactive';
    });

    document.getElementById('submit-add-fee')?.addEventListener('click', () => {
        const nameInput = document.getElementById('nf-fee-name');
        const descInput = document.getElementById('nf-fee-desc');
        const amountInput = document.getElementById('nf-fee-amount');
        const dueInput = document.getElementById('nf-fee-due');
        const categoryInput = document.getElementById('nf-fee-category');
        const statusInput = document.getElementById('nf-fee-status');

        const name = nameInput?.value.trim() || '';
        const desc = descInput?.value.trim() || '';
        const amount = parseFloat(amountInput?.value || '0');
        const dueRaw = dueInput?.value || '';

        if (!name || !desc || !dueRaw || amount <= 0) {
            showToast('Please fill in all required fields with valid values.', true);
            return;
        }

        const dueDate = new Date(dueRaw + 'T00:00:00');
        const dueDateFormatted = dueDate.toLocaleDateString('en-US', {
            month: 'short', day: 'numeric', year: 'numeric',
        });

        const category = categoryInput?.value || '';
        const fullDesc = category ? `${desc} | ${category}` : desc;

        feeList.push({
            id: 'fee-' + Date.now(),
            name,
            amount,
            description: fullDesc,
            dueDate: dueDateFormatted,
            status: statusInput?.checked ? 'active' : 'inactive',
        });

        showAddFeeModal = false;
        showToast('Fee added successfully.');
        renderFees();
    });

    el.querySelectorAll('.fee-edit-btn').forEach(b => b.addEventListener('click', () => {
        editingFeeId = b.dataset.id; renderFees();
    }));
    el.querySelectorAll('.fee-cancel-edit').forEach(b => b.addEventListener('click', () => {
        editingFeeId = null; renderFees();
    }));
    el.querySelectorAll('.fee-save-edit').forEach(b => b.addEventListener('click', () => {
        feeList = feeList.map(f => f.id !== b.dataset.id ? f : {
            ...f,
            name:        document.getElementById('ef-fname').value,
            amount:      parseFloat(document.getElementById('ef-famount').value) || 0,
            description: document.getElementById('ef-fdesc').value,
            dueDate:     document.getElementById('ef-fdue').value,
        });
        editingFeeId = null;
        showToast('Fee updated.'); renderFees();
    }));
    el.querySelectorAll('.fee-toggle-btn').forEach(b => b.addEventListener('click', () => {
        feeList = feeList.map(f =>
            f.id === b.dataset.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
        );
        renderFees();
    }));
    el.querySelectorAll('.fee-delete-btn').forEach(b => b.addEventListener('click', () => {
        feeList = feeList.filter(f => f.id !== b.dataset.id);
        showToast('Fee removed.'); renderFees();
    }));
}

/* ── CLEARANCE SETUP ─────────── */
function renderClearance() {
    const el = document.getElementById('tab-clearance');
    const activeCount = signatoryList.filter(s => s.status === 'active').length;
    const typeBadge   = { organization: 'badge-blue', faculty: 'badge-green', dean: 'badge-purple' };

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Clearance Setup</div>
                <div class="section-sub">Configure clearance signatories and their approval workflow order</div>
            </div>
        </div>
        <div class="info-banner info-banner--blue">
            <span class="info-banner-icon">${bxi('info-circle')}</span>
            <p>The clearance workflow has <strong>${activeCount} active signatories</strong>. Disabling a signatory removes them from the student clearance checklist.</p>
        </div>
        <div id="signatory-list">
            ${signatoryList.map(s => `
            <div class="signatory-card ${s.status === 'inactive' ? 'signatory-card--disabled' : ''}">
                <div class="signatory-num ${s.status === 'active' ? 'signatory-num--active' : 'signatory-num--inactive'}">${s.order}</div>
                <div class="signatory-info">
                    <div class="signatory-name-row">
                        <span class="signatory-name">${s.name}</span>
                        <span class="badge ${typeBadge[s.type]}">${s.type.charAt(0).toUpperCase() + s.type.slice(1)}</span>
                    </div>
                    <div class="signatory-role">${s.role}</div>
                </div>
                <div class="signatory-actions">
                    ${(s.type === 'faculty' || s.type === 'dean') ? `
                    <select class="filter-select signatory-assign" data-id="${s.id}">
                        <option value="">Assign to…</option>
                        ${facultyList.filter(f => f.status === 'active').map(f =>
                            `<option value="${f.id}"${s.assignedTo === f.id ? ' selected' : ''}>${f.name}</option>`
                        ).join('')}
                    </select>` : ''}
                    <button class="btn ${s.status === 'active' ? 'btn-green' : 'btn-outline'} signatory-toggle-btn" data-id="${s.id}">
                        ${s.status === 'active' ? bxi('check') + ' Active' : bxi('x') + ' Disabled'}
                    </button>
                </div>
            </div>`).join('')}
        </div>
        <div class="clearance-save-row">
            <button class="btn btn-green" id="save-clearance-btn">
                 Save Workflow
            </button>
        </div>
    `;

    document.getElementById('save-clearance-btn')?.addEventListener('click', () =>
        showToast('Clearance workflow configuration saved.')
    );
    el.querySelectorAll('.signatory-toggle-btn').forEach(b => b.addEventListener('click', () => {
        signatoryList = signatoryList.map(s =>
            s.id === b.dataset.id ? { ...s, status: s.status === 'active' ? 'inactive' : 'active' } : s
        );
        showToast('Signatory status updated.'); renderClearance();
    }));
    el.querySelectorAll('.signatory-assign').forEach(sel => sel.addEventListener('change', () => {
        signatoryList = signatoryList.map(s =>
            s.id === sel.dataset.id ? { ...s, assignedTo: sel.value } : s
        );
    }));
}

/* ── SYSTEM SETTINGS ─────────── */
function renderSystem() {
    const el = document.getElementById('tab-system');

    const notifToggles = [
        { key: 'emailNotifications', label: 'Email Notifications',  desc: 'Send payment and clearance updates via email' },
        { key: 'smsNotifications',   label: 'SMS Notifications',    desc: 'Send SMS alerts for important deadlines' },
        { key: 'autoReminders',      label: 'Automatic Reminders',  desc: 'Auto-send reminders before payment due dates' },
    ];
    const secToggles = [
        { key: 'requireTwoFactor',      label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts',                    danger: false },
        { key: 'allowNewRegistrations', label: 'Allow New Registrations',   desc: 'Allow new students to self-register',                    danger: false },
        { key: 'maintenanceMode',       label: 'Maintenance Mode',          desc: 'Temporarily disable access for non-admin users',        danger: true },
    ];

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">System Settings</div>
                <div class="section-sub">Configure global system preferences and behavior</div>
            </div>
        </div>

        <div class="settings-card">
            <div class="settings-card-title">${bxi('bell')} Notifications</div>
            ${notifToggles.map(item => `
            <div class="toggle-row">
                <div>
                    <div class="toggle-label">${item.label}</div>
                    <div class="toggle-desc">${item.desc}</div>
                </div>
                <button class="toggle-switch ${systemSettings[item.key] ? 'toggle-switch--on' : 'toggle-switch--off'} sys-toggle"
                    data-key="${item.key}">
                    <div class="toggle-knob"></div>
                </button>
            </div>`).join('')}
        </div>

        <div class="settings-card">
            <div class="settings-card-title">${bxi('shield')} Security &amp; Access</div>
            ${secToggles.map(item => `
            <div class="toggle-row${item.danger && systemSettings[item.key] ? ' toggle-row--maintenance' : ''}">
                <div>
                    <div class="toggle-label${item.danger && systemSettings[item.key] ? ' toggle-label--danger' : ''}">${item.label}</div>
                    <div class="toggle-desc">${item.desc}</div>
                </div>
                <button class="toggle-switch ${systemSettings[item.key] ? (item.danger ? 'toggle-switch--maintenance' : 'toggle-switch--on') : 'toggle-switch--off'} sys-toggle"
                    data-key="${item.key}">
                    <div class="toggle-knob"></div>
                </button>
            </div>`).join('')}
        </div>

        <div class="danger-zone">
            <div class="danger-zone-title">${bxi('error-circle')} Danger Zone</div>
            <div class="danger-row">
                <div>
                    <div class="danger-row-title">Reset All Student Clearances</div>
                    <div class="danger-row-sub">Reset all clearance statuses to Not Started for the new term</div>
                </div>
                <button class="btn-danger-outline" id="reset-clearance-btn">
                    ${bxi('refresh')} Reset
                </button>
            </div>
            <div class="danger-row">
                <div>
                    <div class="danger-row-title">Export All System Data</div>
                    <div class="danger-row-sub">Download a full backup of all students, payments, and clearance records</div>
                </div>
                <button class="btn-danger-outline" id="export-all-btn">
                    ${bxi('download')} Export
                </button>
            </div>
        </div>

        <div class="settings-card">
            <div class="settings-card-title">${bxi('palette')} Appearance</div>
            <div class="toggle-row">
                <div>
                    <div class="toggle-label">Theme &amp; Font</div>
                    <div class="toggle-desc">Switch between Light and Dark theme, or enable the dyslexia-friendly font</div>
                </div>
                <button class="btn btn-outline" id="open-appearance-btn">
                    ${bxi('cog')} Customize
                </button>
            </div>
        </div>

        <div class="settings-save-row">
            <button class="btn btn-green" id="save-system-btn">
                ${bxi('save')} Save Settings
            </button>
        </div>
    `;

    el.querySelectorAll('.sys-toggle').forEach(btn => btn.addEventListener('click', () => {
        systemSettings[btn.dataset.key] = !systemSettings[btn.dataset.key];
        renderSystem();
    }));
    document.getElementById('save-system-btn')?.addEventListener('click', () => {
        showToast('System settings saved successfully.');
    });
    document.getElementById('reset-clearance-btn')?.addEventListener('click', () =>
        showToast('Clearance reset scheduled. This will take effect at midnight.')
    );
    document.getElementById('export-all-btn')?.addEventListener('click', () =>
        showToast("Export queued. You'll receive a download link via email.")
    );
    document.getElementById('open-appearance-btn')?.addEventListener('click', () => {
        if (typeof window.openSettingsPanel === 'function') window.openSettingsPanel();
    });
}

/* ── SEMESTER MANAGEMENT ──────── */
function renderSemester() {
    const el = document.getElementById('tab-semester');
    const semesters = window.SemesterManager.getAllSemesters();
    const current = window.SemesterManager.getCurrentSemester();

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Semester Management</div>
                <div class="section-sub">Manage academic semesters and schedule transitions</div>
            </div>
        </div>

        <div class="info-banner info-banner--blue">
            <span class="info-banner-icon">${bxi('info-circle')}</span>
            <p><strong>Current Semester:</strong> ${current ? window.SemesterManager.formatSemesterInfo(current) : 'None selected'}</p>
        </div>

        <div class="card" style="margin-bottom: 24px;">
            <div class="card-title">Active Semester</div>
            ${current ? `
                <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
                    <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">School Year</div>
                            <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${current.schoolYear}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Semester</div>
                            <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${current.name}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Start Date</div>
                            <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.startDate)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">End Date</div>
                            <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.endDate)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Payment Deadline</div>
                            <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.paymentDeadline)}</div>
                        </div>
                        <div>
                            <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Days Until Deadline</div>
                            <div style="font-size: 14px; font-weight: 600; color: ${window.SemesterManager.daysUntilDeadline(current) <= 7 ? '#dc2626' : '#16a34a'}; margin-top: 4px;">
                                ${window.SemesterManager.daysUntilDeadline(current)} days
                            </div>
                        </div>
                    </div>
                </div>
            ` : `
                <div style="padding: 16px; text-align: center; color: #6b7280;">
                    No semester is currently active. Select one below to activate.
                </div>
            `}
        </div>

        <div class="card">
            <div class="card-title">All Semesters</div>
            <div style="overflow-x: auto;">
                <table style="width: 100%; border-collapse: collapse;">
                    <thead>
                        <tr style="border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
                            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">School Year</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Semester</th>
                            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Status</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Start Date</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">End Date</th>
                            <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Auto-Start</th>
                            <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Actions</th>
                        </tr>
                    </thead>
                    <tbody>
                        ${semesters.map(sem => `
                        <tr style="border-bottom: 1px solid #e5e7eb; ${sem.status === 'active' ? 'background: #f0fdf4;' : ''}">
                            <td style="padding: 12px; font-size: 13px; color: #111827;">${sem.schoolYear}</td>
                            <td style="padding: 12px; font-size: 13px; color: #111827; font-weight: 500;">${sem.name}</td>
                            <td style="padding: 12px; text-align: center;">
                                <span class="badge ${sem.status === 'active' ? 'badge-green' : sem.status === 'completed' ? 'badge-gray' : 'badge-amber'}">
                                    ${sem.status.charAt(0).toUpperCase() + sem.status.slice(1)}
                                </span>
                            </td>
                            <td style="padding: 12px; font-size: 13px; color: #6b7280;">${window.SemesterManager.formatDate(sem.startDate)}</td>
                            <td style="padding: 12px; font-size: 13px; color: #6b7280;">${window.SemesterManager.formatDate(sem.endDate)}</td>
                            <td style="padding: 12px; font-size: 13px; color: #6b7280;">
                                ${sem.autoStartEnabled ? `${window.SemesterManager.formatDate(sem.autoStartDate)} ✓` : '—'}
                            </td>
                            <td style="padding: 12px; text-align: center;">
                                ${sem.status !== 'active' ? `
                                    <button class="btn btn-green semester-activate-btn" data-id="${sem.id}" style="font-size: 12px; padding: 6px 12px;">
                                        ${bxi('check')} Activate
                                    </button>
                                ` : `
                                    <button class="btn btn-amber semester-complete-btn" data-id="${sem.id}" style="font-size: 12px; padding: 6px 12px;">
                                        ${bxi('check-double')} Complete
                                    </button>
                                `}
                            </td>
                        </tr>
                        `).join('')}
                    </tbody>
                </table>
            </div>
        </div>

        <div class="card" style="margin-top: 24px;">
            <div class="card-title">Create New Semester</div>
            <div class="form-grid">
                <div class="form-group">
                    <label>School Year *</label>
                    <input id="ns-year" placeholder="e.g. 2026-2027">
                </div>
                <div class="form-group">
                    <label>Semester Name *</label>
                    <select id="ns-name">
                        <option value="">Select semester</option>
                        <option value="1st Semester">1st Semester</option>
                        <option value="2nd Semester">2nd Semester</option>
                        <option value="Summer">Summer</option>
                    </select>
                </div>
                <div class="form-group">
                    <label>Start Date *</label>
                    <input id="ns-start" type="date">
                </div>
                <div class="form-group">
                    <label>End Date *</label>
                    <input id="ns-end" type="date">
                </div>
                <div class="form-group">
                    <label>Payment Deadline *</label>
                    <input id="ns-payment" type="date">
                </div>
                <div class="form-group">
                    <label>Payment Grace Period (Days)</label>
                    <input id="ns-grace" type="number" value="7" min="0" max="30">
                </div>
                <div class="form-group">
                    <label>Description</label>
                    <input id="ns-desc" placeholder="e.g. First semester of AY 2026-2027">
                </div>
                <div class="form-group" style="grid-column: 1 / -1;">
                    <label style="display: flex; align-items: center; gap: 8px; font-weight: normal;">
                        <input type="checkbox" id="ns-auto" style="width: 18px; height: 18px; cursor: pointer;">
                        Enable auto-start on specific date
                    </label>
                </div>
                <div class="form-group" id="ns-auto-date-group" style="display: none;">
                    <label>Auto-Start Date</label>
                    <input id="ns-auto-date" type="date">
                </div>
            </div>
            <div class="form-actions">
                <button class="btn btn-green" id="save-new-semester">${bxi('plus')} Create Semester</button>
            </div>
        </div>
    `;

    // Event listeners
    el.querySelectorAll('.semester-activate-btn').forEach(b => b.addEventListener('click', () => {
        const semId = b.dataset.id;
        const sem = window.SemesterManager.getSemesterById(semId);
        if (confirm(`Activate "${sem.name} (${sem.schoolYear})"?`)) {
            window.SemesterManager.setActiveSemester(semId);
            showToast(`Activated: ${sem.name}`);
            renderSemester();
        }
    }));

    el.querySelectorAll('.semester-complete-btn').forEach(b => b.addEventListener('click', () => {
        const semId = b.dataset.id;
        const sem = window.SemesterManager.getSemesterById(semId);
        if (confirm(`Mark "${sem.name}" as completed?`)) {
            window.SemesterManager.completeSemester(semId);
            showToast(`Completed: ${sem.name}`);
            renderSemester();
        }
    }));

    document.getElementById('ns-auto')?.addEventListener('change', e => {
        document.getElementById('ns-auto-date-group').style.display = e.target.checked ? 'block' : 'none';
    });

    document.getElementById('save-new-semester')?.addEventListener('click', () => {
        const year = document.getElementById('ns-year').value.trim();
        const name = document.getElementById('ns-name').value.trim();
        const start = document.getElementById('ns-start').value;
        const end = document.getElementById('ns-end').value;
        const payment = document.getElementById('ns-payment').value;
        const grace = parseInt(document.getElementById('ns-grace').value) || 7;
        const autoEnabled = document.getElementById('ns-auto').checked;
        const autoDate = document.getElementById('ns-auto-date').value;
        const desc = document.getElementById('ns-desc').value.trim();

        if (!year || !name || !start || !end || !payment) {
            showToast('Please fill in all required fields.', true);
            return;
        }

        if (autoEnabled && !autoDate) {
            showToast('Please specify auto-start date.', true);
            return;
        }

        const result = window.SemesterManager.createSemester({
            schoolYear: year,
            name: name,
            startDate: start,
            endDate: end,
            paymentDeadline: payment,
            autoStartEnabled: autoEnabled,
            autoStartDate: autoEnabled ? autoDate : null,
            description: desc,
            gracePeriodDays: grace
        });

        if (result) {
            showToast(`Created: ${year} ${name}`);
            document.getElementById('ns-year').value = '';
            document.getElementById('ns-name').value = '';
            document.getElementById('ns-start').value = '';
            document.getElementById('ns-end').value = '';
            document.getElementById('ns-payment').value = '';
            document.getElementById('ns-grace').value = '7';
            document.getElementById('ns-desc').value = '';
            document.getElementById('ns-auto').checked = false;
            document.getElementById('ns-auto-date').value = '';
            document.getElementById('ns-auto-date-group').style.display = 'none';
            renderSemester();
        } else {
            showToast('Failed to create semester.', true);
        }
    });
}

/* ── AUDIT LOGS ───────────────── */
function renderAudit() {
    const el = document.getElementById('tab-audit');
    const counts = { success: 0, info: 0, warning: 0, error: 0 };
    auditLogs.forEach(l => counts[l.type]++);

    const countCards = [
        { type: 'success', label: 'Successful Actions', cls: 'badge-green' },
        { type: 'info',    label: 'Info Events',        cls: 'badge-blue'  },
        { type: 'warning', label: 'Warnings',           cls: 'badge-amber' },
        { type: 'error',   label: 'Errors',             cls: 'badge-red'   },
    ];

    el.innerHTML = `
        <div class="section-header">
            <div>
                <div class="section-title">Audit Logs</div>
                <div class="section-sub">Track all system actions and changes</div>
            </div>
            <button class="btn btn-outline" id="export-log-btn">
                ${bxi('download')} Export Log
            </button>
        </div>

        <div class="audit-count-grid">
            ${countCards.map(s => `
            <div class="audit-count-card badge ${s.cls}">
                <div class="audit-count-value">${counts[s.type]}</div>
                <div class="audit-count-label">${s.label}</div>
            </div>`).join('')}
        </div>

        <div id="audit-list">
            ${auditLogs.map(log => `
            <div class="audit-card">
                <div class="audit-row">
                    <div class="audit-icon ${logTypeClass(log.type)}">${bxi(logTypeIcon(log.type))}</div>
                    <div class="audit-content">
                        <div class="audit-top-row">
                            <div class="audit-action-row">
                                <span class="audit-action">${log.action}</span>
                                <span class="badge ${logBadgeClass(log.type)}">${log.type.charAt(0).toUpperCase() + log.type.slice(1)}</span>
                            </div>
                            <span class="audit-time">${log.timestamp}</span>
                        </div>
                        <div class="audit-detail">${log.details}</div>
                        <div class="audit-meta">
                            <span>${bxi('user')} ${log.user} (${log.role})</span>
                            <span>${bxi('desktop')} ${log.ipAddress}</span>
                        </div>
                    </div>
                </div>
            </div>`).join('')}
        </div>
    `;

    document.getElementById('export-log-btn')?.addEventListener('click', () =>
        showToast('Audit log exported as CSV.')
    );
}

/* ══════════════════════════════
   SECTION F — INIT
══════════════════════════════ */
renderTab('overview');

}); // end DOMContentLoaded
