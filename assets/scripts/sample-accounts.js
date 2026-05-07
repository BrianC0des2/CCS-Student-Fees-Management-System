window.SAMPLE_ACCOUNTS = [
  {
    id: "u-student-001",
    name: "Kayden Break",
    studentId: "TY202500100",
    email: "student1@demo.com",
    password: "123456",
    isFirstLogin: true,
    religion: "",
    phoneNumber: "",
    sex: "Male",
    course: "BS Computer Science",
    year: "3rd Year",
    section: "CS 3-A",
    permissions: {
      studentView: true,
      organizationView: false,
      adminView: false,
      facultyView: false,
      deanView: false
    }
  },
  {
    id: "u-org-001",
    name: "Landis Tarro",
    studentId: "TY202500101",
    email: "studentorg@demo.com",
    password: "123456",
    isFirstLogin: true,
    sex: "Male",
    dateOfBirth: "January 15, 2004",
    role: "organization",
    organization: "CCS Student Council",
    academicYear: "S.Y. 2025-2026",
    semester: "2nd Semester",
    course: "BS Computer Science",
    year: "3rd Year",
    section: "CS 3-A",
    permissions: {
      studentView: true,
      organizationView: true,
      adminView: false,
      facultyView: false,
      deanView: false
    }
  },
  {
    id: "org-msa-001",
    name: "Muslim Student Association",
    email: "msa@demo.com",
    password: "123456",
    role: "organization",
    organization: "Muslim Student Association",
    academicYear: "S.Y. 2025-2026",
    semester: "2nd Semester",
    permissions: {
      organizationView: true,
      studentView: false,
      adminView: false,
      facultyView: false,
      deanView: false
    }
  },
  {
    id: "org-dean-office-001",
    name: "Mara Celestino",
    studentId: "TY202500530",
    email: "deanfinance@demo.com",
    password: "123456",
    role: "organization",
    organization: "Dean's Office — CCS",
    shortName: "Dean's Office",
    academicYear: "S.Y. 2025-2026",
    semester: "2nd Semester",
    course: "BS Computer Science",
    year: "4th Year",
    section: "CS 4-A",
    permissions: {
      studentView: true,
      organizationView: true,
      adminView: false,
      facultyView: false,
      deanView: false
    }
  },
  {
    id: "u-admin-001",
    name: "Bryan Admin",
    studentId: "TY202500102",
    email: "admin@demo.com",
    password: "123456",
    isFirstLogin: true,
    permissions: {
      studentView: false,
      organizationView: false,
      adminView: true,
      facultyView: false,
      deanView: false
    }
  },
  {
    id: "u-faculty-001",
    name: "Dr. Maria Reyes",
    email: "faculty@demo.com",
    password: "123456",
    isFirstLogin: true,
    assignedSections: ["CS 1-A", "CS 1-B"],
    permissions: {
      studentView: false,
      organizationView: false,
      adminView: false,
      facultyView: true,
      deanView: false
    }
  },
  {
    id: "u-dean-001",
    name: "Dean Carlos Villanueva",
    email: "dean@demo.com",
    password: "123456",
    isFirstLogin: true,
    assignedSections: [],
    permissions: {
      studentView: false,
      organizationView: false,
      adminView: false,
      facultyView: false,
      deanView: true
    }
  }
];

// Default payment accounts for each organization
window.SAMPLE_PAYMENT_ACCOUNTS = {
  'u-org-001': {
    orgId: 'u-org-001',
    accounts: [
      { id: 'acct-u-org-001-gcash',    type: 'GCash',    name: 'CCS Student Council', number: '0912 345 6789', isActive: true },
      { id: 'acct-u-org-001-cash',     type: 'Cash',     name: 'CCS Student Council', number: '',              isActive: true },
      { id: 'acct-u-org-001-bpi',      type: 'BPI',      name: 'CCS Student Council', number: '3456-7890-12',  isActive: true },
      { id: 'acct-u-org-001-pnb',      type: 'PNB',      name: 'CCS Student Council', number: '6789-0123-45',  isActive: true },
      { id: 'acct-u-org-001-landbank', type: 'Landbank', name: 'CCS Student Council', number: '1234-5678-90',  isActive: true }
    ]
  },
  'org-msa-001': {
    orgId: 'org-msa-001',
    accounts: [
      { id: 'msa-account-001', type: 'GCash', name: 'Muslim Student Association', number: '0912 345 6789', isActive: true },
      { id: 'msa-account-002', type: 'Cash',  name: 'Muslim Student Association', number: '',              isActive: true }
    ]
  },
  'org-dean-office-001': {
    orgId: 'org-dean-office-001',
    accounts: [
      { id: 'acct-dean-cash',     type: 'Cash',     name: "Dean's Office CCS", number: '',             isActive: true },
      { id: 'acct-dean-landbank', type: 'Landbank', name: "Dean's Office CCS", number: '1234-5678-91', isActive: true }
    ]
  }
};

// Versioned default fees seed
window.SAMPLE_ORGANIZATION_FEES_SEED_VERSION = 2;
window.SAMPLE_ORGANIZATION_FEES = [
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
    feeType: 'mandatory',
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
    orgId: 'org-dean-office-001'
  }
];

(function seedOrganizationFeesFromSamples() {
  const FEES_STORAGE_KEY = 'ccs.organization.fees';
  const FEES_SEED_VERSION_KEY = 'ccs.organization.fees.seedVersion';
  const nextVersion = String(window.SAMPLE_ORGANIZATION_FEES_SEED_VERSION || 1);

  try {
    const currentVersion = localStorage.getItem(FEES_SEED_VERSION_KEY);
    if (currentVersion !== nextVersion) {
      localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(window.SAMPLE_ORGANIZATION_FEES || []));
      localStorage.setItem(FEES_SEED_VERSION_KEY, nextVersion);
    }
  } catch (_err) {}
})();

// Promissory requests are intentionally not auto-seeded
window.SAMPLE_PROMISSORY_REQUESTS = [];

(function seedDemoNotifications() {
    const key = 'ccs.notifications.TY202500100';
    if (localStorage.getItem(key)) return;
    const demo = [
        {
            id: 'notif-demo-001',
            type: 'org_role_offer',
            title: 'Org Role Offer — CCS Student Council',
            body: 'Landis Tarro has offered you the organization head role for CCS Student Council.',
            orgId: 'u-org-001',
            createdAt: new Date().toISOString(),
            read: false,
            resolved: false
        }
    ];
    localStorage.setItem(key, JSON.stringify(demo));
})();

window.resetDemoData = function () {
    // Clear all ccs.* keys from localStorage
    Object.keys(localStorage)
        .filter(function (key) { return key.startsWith('ccs.'); })
        .forEach(function (key) { localStorage.removeItem(key); });

    // Re-seed fees
    localStorage.setItem('ccs.organization.fees', JSON.stringify(window.SAMPLE_ORGANIZATION_FEES || []));
    localStorage.setItem('ccs.organization.fees.seedVersion', String(window.SAMPLE_ORGANIZATION_FEES_SEED_VERSION || 1));

    // Re-seed payment accounts
    Object.keys(window.SAMPLE_PAYMENT_ACCOUNTS || {}).forEach(function (orgId) {
        const data = window.SAMPLE_PAYMENT_ACCOUNTS[orgId];
        localStorage.setItem(
            'ccs.organization.paymentAccounts::' + orgId,
            JSON.stringify(data.accounts || [])
        );
    });

    // Re-seed demo notifications
    const notifKey = 'ccs.notifications.TY202500100';
    const demo = [
        {
            id: 'notif-demo-001',
            type: 'org_role_offer',
            title: 'Org Role Offer — CCS Student Council',
            body: 'Landis Tarro has offered you the organization head role for CCS Student Council.',
            orgId: 'u-org-001',
            createdAt: new Date().toISOString(),
            read: false,
            resolved: false
        }
    ];
    localStorage.setItem(notifKey, JSON.stringify(demo));

    // NOTE: ccs.academic.settings is intentionally NOT re-seeded
    // Badge must not appear until admin explicitly activates a semester
    // NOTE: ccs.student.payments and ccs.promissory.requests are intentionally NOT re-seeded
    // They start empty — only real student actions populate them

    console.log('Demo data reset complete. All ccs.* keys cleared and defaults re-seeded.');
};