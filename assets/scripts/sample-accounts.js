window.SAMPLE_ACCOUNTS = [
  {
    id: "u-student-001",
    name: "Bryan",
    studentId: "TY202500100",
    email: "student1@demo.com",
    password: "123456",
    isFirstLogin: true,
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
    name: "Bryan",
    studentId: "TY202500101",
    email: "studentorg@demo.com",
    password: "123456",
    isFirstLogin: true,
    permissions: {
      studentView: true,
      organizationView: true,
      adminView: false,
      facultyView: false,
      deanView:false
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
