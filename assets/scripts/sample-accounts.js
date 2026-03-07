// Demo accounts used by the login system.
// In a real app, this data should come from a secure backend/database.
// DATA FLOW SUMMARY
// - auth.js reads this array through window.SAMPLE_ACCOUNTS during login.
// - A successful credential match is converted into a session object.
// - permissions flags are later checked by route guards/UI toggles.
// TYPE GUIDE (for this file)
// - USER-DEFINED FUNCTION: none in this file.
// - USER-DEFINED DATA: this array/object structure is project-defined demo data.
// - PREDEFINED API: `window` is a browser global object used to expose shared data.
window.SAMPLE_ACCOUNTS = [
  {
    // FLOW: basic student account (personal dashboard only)
    // Unique user ID inside this demo system
    id: "u-student-001",
    // Display name shown in the UI
    name: "Bryan",
    // Student number shown under profile area
    studentId: "TY202500100",
    // Login email
    email: "student1@demo.com",
    // Demo password (plain text only for local practice)
    password: "123456",
    // Permissions control which dashboard/pages the user can open
    permissions: {
      studentView: true,
      organizationView: false,
      adminView: true,
      facultyView: false,
      deanView:false
      
    }
  },
  {
    // FLOW: organization-enabled account (can switch views)
    id: "u-org-001",
    name: "Bryan",
    studentId: "TY202500101",
    email: "studentorg@demo.com",
    password: "123456",
    permissions: {
      studentView: true,
      // This account can switch to organization dashboard
      organizationView: true,
      adminView: false,
      facultyView: false,
      deanView:false
    }
  },
  {
    // FLOW: role-focused account for admin/faculty/dean permission checks
    id: "u-admin-001",
    name: "Bryan Admin",
    studentId: "TY202500102",
    email: "admin@demo.com",
    password: "123456",
    permissions: {
      studentView: false,
      // This account can switch to organization dashboard
      organizationView: false,
      adminView: true,
      facultyView: false,
      deanView:false
    }
  },
  {
    // FLOW: professor account (faculty dashboard access)
    id: "u-faculty-001",
    name: "Dr. Maria Reyes",
    email: "faculty@demo.com",
    password: "123456",
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
    // FLOW: dean account (faculty dashboard with dean permissions)
    id: "u-dean-001",
    name: "Dean Carlos Villanueva",
    email: "dean@demo.com",
    password: "123456",
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
