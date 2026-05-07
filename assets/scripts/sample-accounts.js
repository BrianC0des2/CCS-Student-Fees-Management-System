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
      deanView:false

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
      deanView:false
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
      deanView:false
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

// Shared payment data for all students
window.SAMPLE_PAYMENTS_SEED_VERSION = 3;
window.SAMPLE_PAYMENTS = [
  // Kayden's payments (TY202500100) - Most recent to oldest
  // Seed a confirmed partial payment for the approved promissory
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'CSC Fee', amount: '₱100.00', date: '2026-02-20', method: 'GCash', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'CSC Fee', amount: '₱200.00', date: '2026-01-03', method: 'GCash', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'Insurance', amount: '₱40.00', date: '2025-08-03', method: 'Cash', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'Gender Club', amount: '₱50.00', date: '2025-01-03', method: 'GCash', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'Miscellaneous', amount: '₱60.00', date: '2024-08-02', method: 'Bank Transfer', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'CSC Fee', amount: '₱200.00', date: '2024-01-05', method: 'GCash', status: 'Pending Verification' },
  { studentNo: "TY202500100", studentName: "Kayden Break", desc: 'Insurance', amount: '₱40.00', date: '2023-08-03', method: 'Cash', status: 'Pending Verification' },

  // Demo students for organization dashboard
  // Student 1: Marco Reyes - Fully Paid (all mandatory fees confirmed)
  { studentNo: "TY202500115", studentName: "Marco Reyes", desc: 'CSC Fee', amount: '₱200.00', date: '2026-02-20', method: 'GCash', status: 'Confirmed' },
  { studentNo: "TY202500115", studentName: "Marco Reyes", desc: 'Gender Club', amount: '₱50.00', date: '2026-02-25', method: 'GCash', status: 'Confirmed' },
  { studentNo: "TY202500115", studentName: "Marco Reyes", desc: 'Miscellaneous', amount: '₱60.00', date: '2026-03-01', method: 'GCash', status: 'Confirmed' },
  // Student 2: Jessica Santos - Pending (partial payment submitted)
  { studentNo: "TY202500116", studentName: "Jessica Santos", desc: 'CSC Fee', amount: '₱200.00', date: '2026-03-10', method: 'GCash', status: 'Pending Verification' },
  // Student 3: Vincent Aquino - Unpaid (no payments made)
  // (No entries - demonstrates zero payment state)
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

// Default payment accounts for each organization
window.SAMPLE_PAYMENT_ACCOUNTS = {
  'u-org-001': {
    orgId: 'u-org-001',
    accounts: [
      {
        id: 'acct-u-org-001-gcash',
        type: 'GCash',
        name: 'CCS Student Council',
        number: '0912 345 6789',
        isActive: true
      },
      {
        id: 'acct-u-org-001-cash',
        type: 'Cash',
        name: 'CCS Student Council',
        number: '',
        isActive: true
      },
      {
        id: 'acct-u-org-001-bpi',
        type: 'BPI',
        name: 'CCS Student Council',
        number: '3456-7890-12',
        isActive: true
      },
      {
        id: 'acct-u-org-001-pnb',
        type: 'PNB',
        name: 'CCS Student Council',
        number: '6789-0123-45',
        isActive: true
      },
      {
        id: 'acct-u-org-001-landbank',
        type: 'Landbank',
        name: 'CCS Student Council',
        number: '1234-5678-90',
        isActive: true
      }
    ]
  },
  'org-msa-001': {
    orgId: 'org-msa-001',
    accounts: [
      {
        id: 'msa-account-001',
        type: 'GCash',
        name: 'Muslim Student Association',
        number: '0912 345 6789',
        isActive: true
      },
      {
        id: 'msa-account-002',
        type: 'Cash',
        name: 'Muslim Student Association',
        number: '',
        isActive: true
      }
    ]
  },
  'org-dean-office-001': {
    orgId: 'org-dean-office-001',
    accounts: [
      { id: 'acct-dean-cash',     type: 'Cash',     name: "Dean's Office CCS", number: '',            isActive: true },
      { id: 'acct-dean-landbank', type: 'Landbank', name: "Dean's Office CCS", number: '1234-5678-91', isActive: true }
    ]
  }
};

// Versioned default fees seed to keep localStorage in sync with sample updates.
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
  } catch (_err) {
  }
})();

// Promissory requests are intentionally not auto-seeded for demo reset testing.
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
