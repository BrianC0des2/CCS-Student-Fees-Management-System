'use strict';

/* Admin Dashboard Shared Configuration */

const ROLE_LABELS = {
    professor:       'Professor',
    dept_head:       'Department Head',
    adviser:         'Class Adviser',
    coordinator:     'Student Affairs Coordinator',
    dean:            'College Dean',
    finance_officer: 'Finance Officer',
};

const ROLE_BADGE_CLASS = {
    professor:       'badge-blue',
    dept_head:       'badge-purple',
    adviser:         'badge-green',
    coordinator:     'badge-amber',
    dean:            'badge-red',
    finance_officer: 'badge-indigo',
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
    { id: 'FAC-002', name: 'Mr. Robert Johnson, MIT',   email: 'r.johnson@wmsu.edu.ph',  phone: '+63-912-345-6790', role: 'dept_head',       department: 'BS Information Technology',      sex: 'M', status: 'active',   permissions: ['view_students','approve_clearance','sign_clearance','generate_reports','view_payments'], dateAdded: 'Jun 1, 2022',  lastLogin: 'Mar 6, 2026' },
    { id: 'FAC-003', name: 'Asst Prof Marjorie A. Rojas',  email: 'ma.rojas@wmsu.edu.ph',    phone: '+63-912-345-6791', role: 'coordinator',     department: 'BS Computer Science',            sex: 'F', status: 'active',   permissions: ['view_students','approve_clearance','sign_clearance','edit_students','generate_reports'], dateAdded: 'Jun 1, 2022',  lastLogin: 'Mar 5, 2026' },
    { id: 'FAC-004', name: 'Ms. Jennifer Santos',           email: 'j.santos@wmsu.edu.ph',    phone: '+63-912-345-6792', role: 'finance_officer', department: 'BS Computer Science',            sex: 'F', status: 'active',   permissions: ['view_students','view_payments','process_payments','generate_reports','export_data','manage_fees'], dateAdded: 'Aug 15, 2022', lastLogin: 'Mar 7, 2026' },
    { id: 'FAC-005', name: 'Prof. John Smith, MIT',  email: 'j.smith@wmsu.edu.ph',  phone: '+63-912-345-6793', role: 'dean',         department: 'BS Computer Science',            sex: 'M', status: 'active',   permissions: ['view_students','verify_signup','approve_clearance','sign_clearance'], dateAdded: 'Jan 10, 2023', lastLogin: 'Mar 4, 2026' },
    { id: 'FAC-006', name: 'Prof. Elena Mercado',           email: 'e.mercado@wmsu.edu.ph',   phone: '+63-912-345-6794', role: 'professor',       department: 'BS Information Technology',      sex: 'F', status: 'inactive', permissions: ['view_students','verify_signup','sign_clearance'], dateAdded: 'Mar 1, 2023',  lastLogin: 'Jan 20, 2026' },
];

let studentList = [
    { id: '2022-00123', name: 'Maria Santos',   email: 'maria.santos@wmsu.edu.ph',  course: 'BS Computer Science',       year: '4th Year', section: 'A', status: 'active',    paymentStatus: 'pending', clearanceStatus: 'in_progress', permissions: ['view_dashboard','make_payment','view_receipt'], enrollmentDate: 'Aug 1, 2022' },
    { id: '2022-00124', name: 'Juan Dela Cruz',  email: 'juan.delacruz@wmsu.edu.ph', course: 'BS Information Technology', year: '3rd Year', section: 'B', status: 'active',    paymentStatus: 'paid',    clearanceStatus: 'complete',    permissions: ['view_dashboard','make_payment','view_receipt'], enrollmentDate: 'Aug 1, 2022' },
    { id: '2023-00211', name: 'Ana Reyes',       email: 'ana.reyes@wmsu.edu.ph',     course: 'BS Computer Science',       year: '2nd Year', section: 'A', status: 'active',    paymentStatus: 'overdue', clearanceStatus: 'not_started', permissions: ['view_dashboard'], enrollmentDate: 'Aug 1, 2023' },
    { id: '2023-00212', name: 'Carlos Mendoza',  email: 'c.mendoza@wmsu.edu.ph',     course: 'BS Information Technology', year: '1st Year', section: 'C', status: 'suspended', paymentStatus: 'overdue', clearanceStatus: 'not_started', permissions: [], enrollmentDate: 'Aug 1, 2023' },
    { id: '2024-00301', name: 'Liza Tan',        email: 'liza.tan@wmsu.edu.ph',      course: 'BS Computer Science',       year: '1st Year', section: 'A', status: 'active',    paymentStatus: 'pending', clearanceStatus: 'not_started', permissions: ['view_dashboard','make_payment'], enrollmentDate: 'Aug 1, 2024' },
];

let feeList = [
    { id: 'csc',       name: 'CSC Fee',                                 amount: 200, description: 'College Student Council Fee',       dueDate: 'Feb 15, 2026', status: 'active' },
    { id: 'gender',    name: 'Gender Club Membership Fee',              amount: 50,  description: 'CSC Gender Club Annual Membership', dueDate: 'Feb 15, 2026', status: 'active' },
    { id: 'misc',      name: 'Miscellaneous Fee',                       amount: 100, description: 'General Miscellaneous Expenses',    dueDate: 'Mar 1, 2026',  status: 'active' },
];

let auditLogs = [
    { id: 'LOG-001', timestamp: 'Mar 7, 2026 – 09:15 AM', user: 'Admin',                       role: 'System Admin',    action: 'Faculty Added',         details: 'Added Prof. John Smith to BS Computer Science department',         ipAddress: '192.168.1.1',   type: 'success' },
    { id: 'LOG-002', timestamp: 'Mar 6, 2026 – 02:45 PM', user: 'Prof. Mark L. Flores, PhD.',  role: 'College Dean',    action: 'Clearance Approved',     details: 'Approved clearance for Maria Santos (2022-00123)',                   ipAddress: '192.168.1.35',  type: 'success' },
    { id: 'LOG-003', timestamp: 'Mar 5, 2026 – 11:20 AM', user: 'Mr. Robert Johnson, MIT',     role: 'Department Head', action: 'Fee Updated',           details: 'Updated CSC Fee from ₱150 to ₱200',                                ipAddress: '192.168.1.42',  type: 'info' },
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

const systemSettings = {
    systemName:             'WMSU CCS Student Fees Management System',
    academicYear:           '2025–2026',
    semester:               '2nd Semester',
    paymentGracePeriod:     7,
    emailNotifications:     true,
    smsNotifications:       false,
    autoReminders:          true,
    requireTwoFactor:       false,
    allowNewRegistrations:  true,
    maintenanceMode:        false,
    currentSemesterId:      'SEM-001',
};

if (!window.semesterList) {
    window.semesterList = [
        { id: 'SEM-001', schoolYear: '2025-2026', name: '1st Semester', status: 'active', startDate: '2025-08-01', endDate: '2025-12-20', paymentDeadline: '2025-09-15', autoStartEnabled: false, autoStartDate: null, createdDate: '2025-06-01', description: 'First semester of academic year 2025-2026' },
        { id: 'SEM-002', schoolYear: '2025-2026', name: '2nd Semester', status: 'inactive', startDate: '2026-01-06', endDate: '2026-05-31', paymentDeadline: '2026-02-15', autoStartEnabled: false, autoStartDate: null, createdDate: '2025-06-01', description: 'Second semester of academic year 2025-2026' },
        { id: 'SEM-003', schoolYear: '2026-2027', name: '1st Semester', status: 'inactive', startDate: '2026-08-01', endDate: '2026-12-20', paymentDeadline: '2026-09-15', autoStartEnabled: true, autoStartDate: '2026-08-01', createdDate: '2025-06-01', description: 'First semester of academic year 2026-2027' },
    ];
    localStorage.setItem('ccs.semesters', JSON.stringify(window.semesterList));
}

/* Helper Functions */
function bxi(name, extra = '') {
    return `<i class='bx bx-${name}' ${extra}></i>`;
}

function getInitials(name) {
    return name.split(' ').map(n => n[0]).join('').slice(0, 2).toUpperCase();
}

function showToast(msg, isError = false) {
    const el = document.getElementById('toast');
    if (!el) return;
    el.innerHTML = `${bxi(isError ? 'x-circle' : 'check-circle')} <span>${msg}</span>`;
    el.className = 'toast' + (isError ? ' toast--error' : '');
    setTimeout(() => { el.className = 'toast toast--hidden'; }, 3000);
}

function riskBadgeClass(r) {
    return r === 'high' ? 'badge-red' : r === 'medium' ? 'badge-amber' : 'badge-green';
}

function riskCheckClass(r) {
    return r === 'high' ? 'perm-checkbox--red' : r === 'medium' ? 'perm-checkbox--amber' : 'perm-checkbox--green';
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

function facultyEmailFromId(facultyId) {
    return facultyId.toLowerCase().replace(/[^a-z0-9]/g, '') + '@wmsu.edu.ph';
}

function studentEmailFromId(studentId) {
    return 'ty' + studentId.replace(/-/g, '') + '@wmsu.edu.ph';
}
