# CCS Student Fees Management System - Claude Project Guide

**Project:** CCS Student Fees Management System (Pay++)  
**Status:** Beta - Core features implemented  
**Tech Stack:** Vanilla HTML/CSS/JavaScript + localStorage  
**Version:** 1.0.0

---

## Quick Overview

This is a comprehensive web-based platform for managing student fees, payments, and clearance procedures at the College of Computing Studies (CCS). It's a **client-side only** application with no backend server, using localStorage for data persistence.

**Key Workflow:** Student Registration → Professor Approval → Payment → Clearance Signing

---

## Project Structure

```
CCS-Student-Fees-Management-System/
├── index.html                          # Login page
├── signup.html                         # Student registration
├── landing-page.html                   # Public landing page
├── CLAUDE.md                           # This file
├── PROJECT_DOCUMENTATION.md            # Full feature documentation
├── QUICK_REFERENCE.md                  # Quick lookup guide
├── ARCHITECTURE.md                     # System architecture & data flow
│
├── pages/
│   ├── admin/admin-dashboard.html      # Admin system configuration
│   ├── dean/dean-dashboard.html        # Dean clearance management
│   ├── faculty/faculty-dashboard.html  # Professor pending signups & clearance
│   ├── organization/                   # Organization/staff role pages
│   └── student/                        # Student dashboards & workflows
│
├── assets/
│   ├── images/                         # Logos and branding (org-ccs.png, pyt.png, bg.jpg)
│   └── scripts/
│       ├── auth.js                     # Authentication & signup lifecycle
│       ├── admin-dashboard.js          # Admin panel logic
│       ├── faculty-dashboard.js        # Faculty pending signups & approvals
│       ├── clearance-status.js         # Clearance workflow
│       ├── script.js                   # Main routing & dashboard logic
│       ├── settings.js                 # Theme & settings management
│       ├── sidebar-template.js         # Sidebar component
│       ├── sample-accounts.js          # Demo account data
│       └── student/payment-history.js
│
└── styles/
    ├── theme.css                       # CSS variables & brand colors
    ├── login-style.css
    ├── sidebar.css
    ├── settings.css
    ├── landing-page.css
    ├── admin-styles/
    ├── faculty-styles/
    ├── organization-styles/
    └── student-styles/
```

---

## User Roles & Permissions

| Role | Key Permissions | Primary Workflow |
|------|-----------------|------------------|
| **Student** | studentView, organizationView | Self-register → Wait approval → Pay → Check clearance |
| **Professor/Faculty** | facultyView, verify_signup | Approve pending signups → Verify payment → Sign clearance |
| **Dean** | deanView | Final clearance signing |
| **Admin** | adminView (full access) | System configuration, user management, audit logs |
| **Organization/Staff** | organizationView | Payment collection management |

---

## Core Workflows

### 1. Student Registration Flow
1. Student visits landing-page.html → Clicks "Sign Up"
2. Fills signup form with name, student ID, email (@wmsu.edu.ph), course, year, section, sex, password
3. Form validated and saved to localStorage as "pending signup"
4. Student sees "Awaiting approval" message
5. Professor reviews and approves/rejects in faculty-dashboard.html
6. If approved: Account created, student can login
7. All actions logged to audit trail

### 2. Payment & Clearance Flow
1. Student logs in → Views dashboard → Selects "Make Payment"
2. Chooses payment method (Cash, Bank Transfer, Check)
3. Submits payment → Receives receipt with reference number
4. Payment tracked in payment history
5. Professor verifies payment in faculty-dashboard.html → Signs clearance
6. Dean performs final clearance signing in dean-dashboard.html
7. Student views completed clearance status

### 3. Faculty Approval Workflow
1. Professor logs in → Goes to Faculty Dashboard
2. Views "Pending Student Signups" section (grouped by section)
3. Can View full details in modal, Approve (single/batch), or Reject
4. Each action creates audit log entry
5. Approved students appear in clearance queue

---

## Key Data Structures

### localStorage Keys
- `ccs.auth.user` — Current logged-in user object
- `ccs.pending.signups` — Array of pending student registrations
- `ccs.audit.logs` — Array of all system actions
- `ccs.theme` — Theme preference ('light' or 'dark')
- `ccs.payments` — Array of payment records

### User Object
```javascript
{
  id: "u-TY202500100",
  name: "Juan Dela Cruz",
  email: "juan@wmsu.edu.ph",
  permissions: {
    studentView: true,
    organizationView: false,
    adminView: false,
    facultyView: false,
    deanView: false
  }
}
```

### Pending Signup Object
```javascript
{
  id: "PENDING-1714086600000",
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
  password: "hashedpassword",
  status: "pending",
  createdAt: "2026-04-26T10:30:00.000Z"
}
```

---

## Core Modules

### auth.js (Authentication & Signup Management)
Key functions:
- `login(email, password)` — Authenticates user and creates session
- `logout()` — Clears session and redirects to login
- `getUser()` — Returns current authenticated user
- `savePendingSignup(signupData)` — Stores pending signup to localStorage
- `getPendingSignups()` — Retrieves all pending signups
- `approvePendingSignup(signupId)` — Approves signup and creates account
- `rejectPendingSignup(signupId, reason)` — Rejects signup

### script.js (Main Router & Dashboard Logic)
Key functions:
- `getDashboardPath(user)` — Routes user to appropriate dashboard based on role
- `renderFacultyDashboard()` — Renders faculty/professor view
- `renderProfessorTable(students)` — Displays clearance queue
- `renderDeanTable(students)` — Displays dean clearance queue
- `signClearance(studentId)` — Professor signs clearance
- `getProfessorClearanceState(student)` — Gets student clearance status

### faculty-dashboard.js (Pending Signups Management)
Key functions:
- `renderPendingSignups()` — Displays pending signups grouped by section
- `viewSignupDetails(signupId)` — Opens modal with full student info
- `approveSectionSignups(section)` — Batch approves entire section
- `approveSingleSignup(signupId)` — Approves individual student
- `rejectSingleSignup(signupId)` — Rejects individual student
- `addAuditLog(action, details)` — Logs actions for audit trail

### admin-dashboard.js (System Administration)
Features:
- Faculty/student management interface
- Fee structure configuration
- Permission assignment
- Audit log viewing
- Settings management

---

## Demo Accounts

| Role | Email | Password |
|------|-------|----------|
| Student | student@wmsu.edu.ph | password123 |
| Student 2 | student2@wmsu.edu.ph | password456 |
| Professor | professor@wmsu.edu.ph | facpass789 |
| Dean | dean@wmsu.edu.ph | deanpass000 |
| Admin | admin@wmsu.edu.ph | adminpass123 |

---

## Color System (theme.css)

**Brand Colors:**
- `--brand-700`: #2e7d52 (Primary green)
- `--brand-600`: #3d9467
- `--brand-500`: #4aac7f

**Semantic Colors:**
- `--success-600`: #16a34a (Approve, success)
- `--danger-600`: #dc2626 (Reject, errors)
- `--accent-amber`: #f59e0b (Warnings)

**Text Colors:**
- `--sys-text-900`: #1a1a2e (Primary text)
- `--sys-text-600`: #6b7280 (Secondary text)

**Surfaces:**
- `--sys-surface`: #ffffff (White)
- `--sys-page-bg`: #f3f4f6 (Page background)

---

## Architecture Overview

```
┌─────────────────────────────────────┐
│     CLIENT BROWSER (Vanilla JS)     │
├─────────────────────────────────────┤
│  HTML Pages + CSS Styling           │
│  ↓                                  │
│  JavaScript Modules:                │
│  • auth.js → Authentication         │
│  • script.js → Routing              │
│  • [role]-dashboard.js → UI Logic   │
│  ↓                                  │
│  localStorage (Client Storage)      │
│  • Pending signups                  │
│  • Auth sessions                    │
│  • Audit logs                       │
│  • Payments                         │
└─────────────────────────────────────┘
```

---

## Common Tasks

### Add a New Role/Permission
1. Create account object in `assets/scripts/sample-accounts.js`
2. Add dashboard file in `pages/[role]/[role]-dashboard.html`
3. Update `getDashboardPath()` in `script.js` to route new role
4. Create role-specific CSS in `styles/`

### Add a New Page
1. Create HTML file in `pages/[role]/`
2. Create JS logic file in `assets/scripts/`
3. Create CSS file in `styles/`
4. Import necessary scripts in HTML (auth.js, script.js, sidebar-template.js)
5. Use modal components from existing pages as templates

### Test a Feature
Use browser DevTools Console:
```javascript
// View current user
console.log(window.Auth.getUser());

// View pending signups
console.log(window.Auth.getPendingSignups());

// View audit logs
console.log(JSON.parse(localStorage.getItem('ccs.audit.logs')));

// View all localStorage
console.log(localStorage);
```

---

## Known Limitations

1. **No Backend** — All data in localStorage (~5-10MB limit), lost if cache cleared
2. **No Real Database** — In-memory demo accounts, no persistent data between sessions
3. **No Security** — Plain-text passwords, no encryption, JWT, or hashing (demo only)
4. **No Real Payments** — Fake payment processing and reference generation
5. **No Email** — No email notifications or confirmations
6. **No Advanced Reporting** — Basic audit logs only, no export/analytics

---

## Implementation Status

✅ **Complete:**
- Login system with role-based routing
- Student self-registration with email validation
- Professor approval/rejection workflow
- Batch approval by section
- Clearance workflow (Faculty → Dean signing)
- Admin dashboard
- Audit logging for all actions
- Theme management (dark/light)
- Responsive design
- Payment tracking

❌ **NOT Implemented:**
- Backend server
- Real database
- Email notifications
- Real payment gateway
- Advanced user management UI
- Data export/reporting

---

## Production Roadmap

To move to production:
1. Build backend API (Node/Express, Python/Django, etc.)
2. Integrate real database (PostgreSQL, MongoDB)
3. Implement proper authentication (JWT, OAuth2)
4. Add payment gateway (Stripe, PayMongo)
5. Set up email service (SendGrid, etc.)
6. Implement HTTPS/SSL security
7. Add rate limiting and security headers
8. Set up CI/CD pipeline
9. Security audit and hardening

---

## File Sizes

| Component | Size |
|-----------|------|
| JavaScript | ~50KB |
| CSS | ~30KB |
| Images | ~200KB |
| **Total** | **~280KB** (uncompressed) |

---

## Getting Started

**To run locally:**
1. Open `index.html` in browser
2. Login with any demo account from the table above
3. Explore features based on role

**To test workflow:**
1. Signup as new student (landing-page.html)
2. Login as professor (professor@wmsu.edu.ph)
3. Approve the pending signup in faculty-dashboard.html
4. Logout and login as the new student
5. Navigate through payment and clearance workflows

---

## Debugging

**Common Issues:**

| Issue | Solution |
|-------|----------|
| Data lost after browser restart | Check localStorage persistence and browser privacy settings |
| Permissions not showing | Verify user permissions object has correct boolean flags |
| Modal not closing | Check for event listener conflicts in JavaScript |
| Page not rendering | Check browser console for JavaScript errors (F12) |

---

## Related Documentation

- **PROJECT_DOCUMENTATION.md** — Complete feature specification and data models
- **QUICK_REFERENCE.md** — Quick lookup guide for common tasks
- **ARCHITECTURE.md** — Detailed system architecture and data flow diagrams

---

## Support

**Last Updated:** May 4, 2026  
**Maintained By:** CCS Department  
**Version:** 1.0.0 (Beta)
