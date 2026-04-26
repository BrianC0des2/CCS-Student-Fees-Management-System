# CCS Student Fees Management System - Project Documentation

## Project Overview
**Project Name:** CCS Student Fees Management System (Pay++)

**Purpose:** A comprehensive web-based platform for managing student fees, payments, and clearance procedures at the College of Computing Studies (CCS).

**Status:** In Development (Core features implemented)

---

## Technology Stack

### Frontend
- **HTML5** - Structure and markup
- **CSS3** - Styling with CSS variables for theming
- **JavaScript (Vanilla)** - Pure JavaScript, no frameworks
- **Fonts:** Poppins (Google Fonts)
- **Icons:** Boxicons

### Data Storage
- **localStorage** - Client-side persistence for user sessions, pending signups, audit logs, and account data
- **sessionStorage** - Temporary session data
- **In-Memory:** SAMPLE_ACCOUNTS array for demo accounts

### Architecture
- **Client-side only** (no backend server)
- **Role-based access control (RBAC)**
- **Event-driven design with modular JavaScript**
- **Modal-based workflows**
- **Responsive design** (mobile, tablet, desktop)

---

## Project Structure

```
CCS-Student-Fees-Management-System/
├── index.html                          # Login page
├── signup.html                         # Student registration/signup form
├── landing-page.html                   # Public landing page
├── README.md
├── PROJECT_DOCUMENTATION.md            # This file
│
├── pages/
│   ├── admin/
│   │   └── admin-dashboard.html       # Admin panel for system management
│   ├── dean/
│   │   ├── dean-dashboard.html        # Dean clearance management
│   │   └── clearance-history.html     # Dean's clearance history view
│   ├── faculty/
│   │   ├── faculty-dashboard.html     # Professor pending signups & clearance queue
│   │   ├── students.html              # Professor's class roster management
│   │   └── clearance-history.html     # Faculty clearance history
│   ├── organization/
│   │   ├── organization-dashboard.html
│   │   ├── collection.html
│   │   ├── add-payment.html
│   │   ├── expense-report.html
│   │   ├── payment-history.html
│   │   └── payment-status.html
│   └── student/
│       ├── student-dashboard.html     # Main student dashboard
│       ├── make-payment.html          # Payment submission form
│       ├── payment-confirmation.html  # Payment status confirmation
│       ├── payment-method.html        # Payment method selection
│       ├── payment-receipt.html       # Payment receipt display
│       ├── cash-reference.html        # Cash payment reference
│       ├── clearance-status.html      # Student clearance status
│       └── student-profile.html       # Profile management
│
├── assets/
│   ├── images/
│   │   ├── org-ccs.png               # CCS logo
│   │   ├── bg.jpg                    # Hero background
│   │   └── pyt.png                   # Brand logo
│   └── scripts/
│       ├── auth.js                   # Authentication & signup lifecycle
│       ├── admin-dashboard.js        # Admin panel logic
│       ├── faculty-dashboard.js      # Faculty pending signups & approvals
│       ├── clearance-status.js       # Clearance workflow logic
│       ├── script.js                 # Main page logic & dashboard routing
│       ├── settings.js               # Theme and settings management
│       ├── sidebar-template.js       # Sidebar component rendering
│       ├── sample-accounts.js        # Demo accounts data
│       └── student/
│           └── payment-history.js    # Student payment history logic
│
└── styles/
    ├── theme.css                     # Global CSS variables & colors
    ├── login-style.css               # Login page styling
    ├── sidebar.css                   # Sidebar component styling
    ├── settings.css                  # Settings panel styling
    ├── landing-page.css              # Landing page styling
    ├── admin-styles/
    │   └── admin-dashboard.css
    ├── faculty-styles/
    │   └── faculty-dashboard.css
    ├── organization-styles/
    │   └── organization-dashboard.css
    └── student-styles/
        ├── clearance-status.css
        ├── payment-history.css
        ├── payment-process.css
        ├── student-dashboard.css
        └── student-profile.css
```

---

## User Roles & Permissions

### 1. Student
**Default Permissions:**
- `studentView` - Access student dashboard
- `organizationView` - Can submit payments
- Can view own payment history
- Can check clearance status
- Can generate payment receipts

**Workflows:**
- Sign up via signup.html (self-registration)
- Wait for professor approval
- Access student dashboard after approval
- View fees and payment obligations
- Make payments through multiple methods
- Track payment status and clearance

### 2. Professor/Faculty
**Permissions:**
- `facultyView` - Access faculty dashboard
- `verify_signup` - Approve/reject pending student signups
- Can manage class roster (view/edit students)
- Can sign clearance forms for students
- Can view student list and payment status

**Workflows:**
- View pending student signups on faculty dashboard
- Approve or reject pending signups individually or in batch (by section)
- Manage clearance queue
- Sign clearances for eligible students
- View student information and payment status

### 3. Adviser/Coordinator
**Permissions:**
- `facultyView`
- `verify_signup`
- Additional management capabilities

### 4. Dean
**Permissions:**
- `deanView` - Access dean dashboard
- Can perform final clearance signing
- Can view all clearance requests
- Can manage clearance workflow

**Workflows:**
- View final clearance queue
- Sign final clearance for students
- View clearance history
- Manage clearance status

### 5. Admin
**Permissions:**
- `adminView` - Full system access
- Can manage all users and permissions
- Can configure system settings
- Can manage fees and payment types
- Can view audit logs
- Can manage roles and permissions

**Workflows:**
- Access admin dashboard for system configuration
- Manage user accounts and roles
- Configure permission sets
- View audit logs for all activities
- Manage fee structures and payment types

---

## Key Features & Workflows

### 1. Student Signup Workflow (NEW)
**Flow:**
1. User clicks "Sign Up" on landing page or index.html
2. User fills signup form with:
   - Name (First, Middle, Surname, Suffix)
   - Student ID
   - Course (BSCS, BSIT, ACT-AD, ACT-NET)
   - Year (1st-4th)
   - Section (A, B, C, D)
   - Sex (Male, Female, Other)
   - School email (@wmsu.edu.ph domain required)
   - Password
3. Data saved to `localStorage[ccs.pending.signups]`
4. Professor reviews pending signups on faculty-dashboard.html
5. Professor can:
   - **View** full student details in modal
   - **Approve** individual or entire section
   - **Reject** with optional reason
6. Approved students automatically added to SAMPLE_ACCOUNTS
7. Audit log entry created for each action

**Storage:**
- Pending signups: `ccs.pending.signups`
- Audit logs: `ccs.audit.logs`

### 2. Student Authentication
**Login Process:**
1. Enter email and password on index.html
2. System checks SAMPLE_ACCOUNTS or localStorage for matching credentials
3. On success, creates session in `localStorage[ccs.auth.user]`
4. User redirected to appropriate dashboard based on role
5. No forced password change on first login

**Session Data Stored:**
```javascript
{
  id, name, email, role, permissions: {
    studentView, organizationView, adminView, 
    facultyView, deanView
  }
}
```

### 3. Payment Workflow
**Student Payment Process:**
1. Student views make-payment.html
2. Selects payment method (Cash, Bank Transfer, Check)
3. For cash: generates reference number
4. For transfers: displays bank details
5. Submits payment
6. Receives payment-receipt.html
7. Status tracked in payment history

**Data Tracked:**
- Payment method
- Amount
- Date/time
- Reference number
- Status (pending, completed, verified)

### 4. Clearance Workflow
**Process:**
1. **Faculty Review:** Professor views students in clearance queue
2. **Faculty Sign:** Professor signs clearance after payment verification
3. **Dean Final:** Dean performs final clearance signing
4. **Student Status:** Student can track clearance status on clearance-status.html

**Status States:**
- Pending (awaiting payment)
- Blocked (payment not complete)
- Ready for Faculty Sign
- Faculty Signed
- Ready for Dean Sign
- Signed/Cleared

### 5. Pending Signups Management (Faculty Dashboard)
**Location:** pages/faculty/faculty-dashboard.html

**Features:**
- View all pending signups grouped by section
- **View button:** See full student details in modal
  - Full name, student ID, email, course, year, section, sex, application date
- **Approve button:** Approve individual student
- **Reject button:** Reject with reason
- **Approve All button:** Batch approve entire section

**Actions Logged:**
- Every approval/rejection tracked in audit logs
- Includes timestamp, user, action, and details

---

## Data Models

### Student Account
```javascript
{
  id: "u-TY202500100",
  name: "Juan Dela Cruz",
  studentId: "TY202500100",
  email: "juan.delacruz@wmsu.edu.ph",
  password: "securepassword",
  course: "BS Computer Science",
  year: "1st Year",
  section: "A",
  sex: "Male",
  isFirstLogin: false,
  permissions: {
    studentView: true,
    organizationView: false,
    adminView: false,
    facultyView: false,
    deanView: false
  }
}
```

### Pending Signup
```javascript
{
  id: "PENDING-1234567890",
  firstName: "Juan",
  middleName: "Manuel",
  surname: "Dela Cruz",
  suffix: "Jr.",
  studentId: "TY202500100",
  course: "BS Computer Science",
  year: "1st Year",
  section: "A",
  sex: "Male",
  email: "juan@wmsu.edu.ph",
  password: "hashed_password",
  status: "pending",
  createdAt: "2026-04-26T10:30:00.000Z"
}
```

### Audit Log
```javascript
{
  id: "LOG-1234567890",
  timestamp: "Apr 26, 2026, 10:30:00 AM",
  user: "Prof. Maria Santos",
  role: "Professor",
  action: "Student Signup Approved",
  details: "Approved signup for Juan Dela Cruz (TY202500100) - Section A",
  ipAddress: "192.168.1.1",
  type: "info"
}
```

### Payment Record
```javascript
{
  id: "PAY-1234567890",
  studentId: "TY202500100",
  amount: 5000,
  method: "Cash",
  reference: "CAS-2026-00123",
  date: "2026-04-26",
  status: "completed",
  receipt: { /* receipt data */ }
}
```

---

## Color System (from theme.css)

### Brand Colors
- `--brand-700`: #2e7d52 (Primary green)
- `--brand-600`: #3d9467
- `--brand-500`: #4aac7f

### Semantic Colors
- `--accent-amber`: #f59e0b (Warnings, alerts)
- `--danger-600`: #dc2626 (Errors, rejections)
- `--success-600`: #16a34a (Success states)

### Text Colors
- `--sys-text-900`: #1a1a2e (Primary text)
- `--sys-text-600`: #6b7280 (Secondary text)
- `--sys-text-400`: #9ca3af (Muted text)

### Surface Colors
- `--sys-surface`: #ffffff (White)
- `--sys-surface-muted`: #f9fafb (Light gray)
- `--sys-page-bg`: #f3f4f6 (Page background)
- `--sys-border`: #e5e7eb (Border color)

---

## Key Functions & Modules

### auth.js
**Authentication & Signup Management**

Functions:
- `login(email, password)` - Authenticates user
- `logout()` - Clears session
- `getUser()` - Returns current user object
- `isFirstLogin()` - Checks if password change required
- `changePassword(newPassword)` - Updates user password
- `savePendingSignup(signupData)` - Stores pending signup
- `getPendingSignups()` - Retrieves pending signups
- `approvePendingSignup(signupId)` - Approves and creates account
- `rejectPendingSignup(signupId, reason)` - Rejects signup

### faculty-dashboard.js
**Pending Signup Management**

Functions:
- `renderPendingSignups()` - Displays pending signups grouped by section
- `viewSignupDetails(signupId)` - Opens modal with full student info
- `approveSectionSignups(section)` - Batch approves section
- `approveSingleSignup(signupId)` - Approves individual student
- `rejectSingleSignup(signupId)` - Rejects individual student
- `addAuditLog(action, details)` - Logs actions for audit trail

### script.js
**Main Application Logic**

Functions:
- `getDashboardPath(user)` - Routes user to appropriate dashboard
- `renderFacultyDashboard()` - Renders faculty/professor view
- `renderProfessorTable(students)` - Displays clearance queue
- `renderDeanTable(students)` - Displays dean clearance queue
- `signClearance(studentId)` - Professor signs clearance
- `getProfessorClearanceState(student)` - Gets student clearance status

### admin-dashboard.js
**System Administration**

Features:
- Faculty/student management
- Fee structure configuration
- Permission assignment
- Audit log viewing
- Settings management

---

## localStorage Keys

| Key | Purpose | Example Value |
|-----|---------|----------------|
| `ccs.auth.user` | Current logged-in user | User object |
| `ccs.pending.signups` | Pending student signups | Array of signup objects |
| `ccs.audit.logs` | System audit trail | Array of audit log objects |
| `ccs.theme` | User theme preference | 'light' or 'dark' |
| `ccs.payments` | Payment records | Array of payment objects |

---

## Sample Demo Accounts (from sample-accounts.js)

### Student Accounts
- **Email:** student@wmsu.edu.ph | **Pass:** password123
- **Email:** student2@wmsu.edu.ph | **Pass:** password456

### Faculty Accounts
- **Email:** professor@wmsu.edu.ph | **Pass:** facpass789
- **Email:** dean@wmsu.edu.ph | **Pass:** deanpass000

### Admin Account
- **Email:** admin@wmsu.edu.ph | **Pass:** adminpass123

---

## Current Implementation Status

### ✅ COMPLETED

#### Authentication & Signup
- [x] Login system with role-based routing
- [x] Student self-registration (signup.html)
- [x] Email domain validation (@wmsu.edu.ph)
- [x] Password confirmation validation
- [x] Pending signup workflow
- [x] Professor approval/rejection system
- [x] Batch approval by section
- [x] View pending signup details modal
- [x] Audit logging for all signup actions
- [x] Sex field added to student data model

#### Faculty Dashboard
- [x] Pending signups management interface
- [x] Clearance queue display
- [x] Student approval workflows
- [x] Filter system (course, section, clearance status)
- [x] Search functionality
- [x] Bulk action buttons
- [x] Modal-based actions
- [x] Clearance signing workflow

#### Pages & UI
- [x] Login page (index.html)
- [x] Signup page (signup.html)
- [x] Landing page with navigation
- [x] Student dashboard
- [x] Faculty dashboard
- [x] Dean dashboard
- [x] Admin dashboard
- [x] Settings/theme management
- [x] Responsive design

#### Removed Features
- [x] Removed forced password change on first login
- [x] Removed "Add Student" functionality from faculty
- [x] Replaced manual student addition with pending signups workflow

---

## Known Limitations

1. **No Backend Server**
   - All data stored in localStorage (limited to ~5-10MB)
   - Data lost if browser cache/cookies cleared
   - No real payment processing
   - No email notifications

2. **No Real Database**
   - Using in-memory SAMPLE_ACCOUNTS array
   - No persistent data across browser sessions unless using localStorage

3. **No Authentication Security**
   - Passwords stored in plain text
   - No encryption or hashing
   - No JWT tokens
   - Suitable for demo/prototype only

4. **Limited Reporting**
   - No advanced analytics
   - Basic audit logs only
   - No data export functionality

---

## Browser Compatibility

- **Chrome/Edge:** Full support
- **Firefox:** Full support
- **Safari:** Full support
- **Mobile browsers:** Responsive design supported

**Minimum Requirements:**
- ES6 JavaScript support
- localStorage support
- CSS Grid and Flexbox support

---

## File Sizes & Performance

| File | Size | Type |
|------|------|------|
| Main scripts combined | ~50KB | JavaScript |
| CSS stylesheets combined | ~30KB | CSS |
| Images | ~200KB | PNG/JPG |
| **Total Project Size** | **~280KB** | **Uncompressed** |

---

## Development Notes

### Adding New Features
1. Create new HTML page in appropriate `pages/` folder
2. Add corresponding JS logic file in `assets/scripts/`
3. Create CSS file in `styles/` folder following naming convention
4. Import necessary scripts in HTML
5. Use CSS variables from theme.css for colors
6. Update audit logs if action involves data changes
7. Test with different user roles

### Testing Checklist
- [ ] Test all user roles (Student, Faculty, Dean, Admin)
- [ ] Verify permissions are enforced
- [ ] Check localStorage data persistence
- [ ] Test on mobile devices
- [ ] Verify audit logs capture actions
- [ ] Test error scenarios

### Common Issues & Solutions

**Issue:** Data lost after browser restart
**Solution:** Ensure localStorage persistence is working, check browser privacy settings

**Issue:** Permissions not showing
**Solution:** Verify user permissions object includes correct boolean flags

**Issue:** Modal not closing
**Solution:** Check for event listener conflicts, ensure modal.classList.remove('show')

---

## Deployment Notes

### For Production
- Implement actual backend server
- Add proper authentication (JWT, OAuth)
- Use real database (PostgreSQL, MongoDB, etc.)
- Implement payment gateway integration
- Add email notification system
- Implement proper error logging and monitoring
- Add input validation on backend
- Implement HTTPS/SSL
- Add rate limiting and security headers

### Current Demo Setup
- Open `index.html` to start
- Use sample account credentials
- All features work locally with localStorage
- No server required for testing

---

## Quick Start Guide

1. **For New User (Student):**
   - Go to landing-page.html
   - Click "Sign Up"
   - Fill registration form with @wmsu.edu.ph email
   - Wait for professor approval
   - Login with credentials

2. **For Professor:**
   - Login with professor account
   - Go to faculty-dashboard.html
   - Review pending signups in "Pending Student Signups" section
   - Click "View" to see student details
   - Click "Approve" or "Reject"

3. **For Admin:**
   - Login with admin account
   - Access admin dashboard for system configuration
   - View audit logs and manage permissions

---

## Contact & Support

**Project Manager:** CCS Department
**Last Updated:** April 26, 2026
**Version:** 1.0.0 (Beta)

---

**End of Documentation**
