# CCS Student Fees Management System - Architecture & Data Flow

## System Architecture

### High-Level Overview

```
┌─────────────────────────────────────────────────────────────┐
│                    CLIENT BROWSER                           │
│  ┌───────────────────────────────────────────────────────┐  │
│  │            HTML/CSS/JavaScript Frontend               │  │
│  ├────────────┬──────────────┬────────────┬────────────┤  │
│  │  Landing   │    Login     │   Signup   │ Dashboards │  │
│  │    Page    │   (index)    │  (signup)  │ (multiple) │  │
│  └────────────┴──────────────┴────────────┴────────────┤  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │     JavaScript Modules & Core Logic         │    │  │
│  │  ├─────────────┬──────────┬──────────────────┤    │  │
│  │  │   auth.js   │script.js │faculty-dash.js  │    │  │
│  │  │  (signup &  │ (routing │  (approvals)    │    │  │
│  │  │   login)    │ & logic) │                 │    │  │
│  │  └─────────────┴──────────┴──────────────────┘    │  │
│  │                                                       │  │
│  │  ┌─────────────────────────────────────────────┐    │  │
│  │  │         localStorage (Client Storage)       │    │  │
│  │  ├─────────────┬──────────┬──────────────────┤    │  │
│  │  │ Auth User   │ Pending  │  Audit Logs     │    │  │
│  │  │   Session   │ Signups  │  Payments       │    │  │
│  │  └─────────────┴──────────┴──────────────────┘    │  │
│  └───────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────┘
```

### Component Architecture

```
┌─────────────────────────────────────────┐
│         Authentication Module            │
│  (auth.js)                              │
├─────────────────────────────────────────┤
│ • login(email, password)                │
│ • logout()                              │
│ • getUser()                             │
│ • savePendingSignup()                   │
│ • getPendingSignups()                   │
│ • approvePendingSignup()                │
│ • rejectPendingSignup()                 │
└─────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│            Router Module (script.js)                     │
├──────────────────────────────────────────────────────────┤
│ • getDashboardPath() - Route to appropriate dashboard   │
│ • Loads role-specific UI components                     │
│ • Manages permission checks                            │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│         Role-Specific Dashboard Modules                 │
├──────────────────────────────────────────────────────────┤
│ • script.js: renderFacultyDashboard()                   │
│ • faculty-dashboard.js: renderPendingSignups()          │
│ • admin-dashboard.js: renderAdminPanel()               │
│ • clearance-status.js: renderClearanceStatus()         │
└──────────────────────────────────────────────────────────┘
              ↓
┌──────────────────────────────────────────────────────────┐
│        UI Components & Event Listeners                  │
├──────────────────────────────────────────────────────────┤
│ • Modals (approve, reject, view details)               │
│ • Forms (signup, payment, clearance)                   │
│ • Tables (students, payments, audit logs)              │
│ • Filters & Search                                      │
└──────────────────────────────────────────────────────────┘
```

---

## Data Flow Diagrams

### 1. Student Registration & Approval Flow

```
┌──────────────────┐
│  Student visits  │
│  landing page    │
└────────┬─────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Clicks "Sign Up" button             │
│  Redirected to signup.html           │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Student fills form:                 │
│  • Full name                         │
│  • Student ID                        │
│  • @wmsu.edu.ph email (validated)   │
│  • Course, Year, Section             │
│  • Sex                               │
│  • Password                          │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Form validation:                    │
│  • Email ends with @wmsu.edu.ph     │
│  • Password confirmation match       │
│  • All required fields filled        │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────────────────┐
│  Auth.savePendingSignup() called                 │
│  Data stored in localStorage                     │
│  Key: ccs.pending.signups                        │
└────────┬─────────────────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Student redirected to login page    │
│  Shows success message               │
└────────────────────────────────────────┘

                    ↓↓↓ PROFESSOR SIDE ↓↓↓

┌──────────────────────────────────────┐
│  Professor logs in                   │
│  Navigates to faculty-dashboard.html │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  faculty-dashboard.js loads          │
│  renderPendingSignups() called       │
│  Fetches from localStorage            │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Groups signups by section           │
│  Displays table with:                │
│  • Name, ID, Email, Course           │
│  • Buttons: View, Approve, Reject    │
└────────┬─────────────────────────────┘
         │
     ┌───┴───────────────────┬───────────────────┐
     │                       │                   │
     ↓                       ↓                   ↓
┌─────────┐         ┌──────────────┐      ┌──────────┐
│  View   │         │   Approve    │      │  Reject  │
│ Details │         │              │      │          │
└────┬────┘         └────┬─────────┘      └────┬─────┘
     │                   │                     │
     │                   ↓                     ↓
     │         ┌──────────────────┐   ┌──────────────────┐
     │         │Auth.approve()    │   │Auth.reject()     │
     │         │                  │   │                  │
     │         │Creates account   │   │Removes signup    │
     │         │in SAMPLE_ACCOUNTS│   │from pending      │
     │         │                  │   │with reason       │
     │         │Logs to audit     │   │Logs to audit     │
     │         └────┬─────────────┘   └────┬─────────────┘
     │              │                      │
     │              ↓                      ↓
     │     ┌──────────────────┐   ┌──────────────────┐
     │     │Student can now   │   │Student notified  │
     │     │login with new    │   │(manual or email) │
     │     │credentials       │   │                  │
     │     └──────────────────┘   └──────────────────┘
     │
     ↓
┌──────────────────────────────────────┐
│  Modal shows full student details:   │
│  • All signup form fields            │
│  • Application timestamp             │
│  • Section and course info           │
└──────────────────────────────────────┘
```

### 2. Login & Session Flow

```
┌──────────────────────────────────────┐
│  User enters credentials on          │
│  index.html (login page)             │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Auth.login() called with:           │
│  • email                             │
│  • password                          │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Searches in SAMPLE_ACCOUNTS array   │
│  for email + password match          │
└────────┬─────────────────────────────┘
         │
     ┌───┴──────────────────┬──────────────────┐
     │ Match Found          │ No Match         │
     ↓                      ↓                  
┌──────────────┐      ┌───────────────────┐
│ Success: ok  │      │ Error: Invalid    │
│ true         │      │ credentials       │
└──────┬───────┘      └───────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ Stores user in localStorage:     │
│ localStorage['ccs.auth.user'] =  │
│ {                                │
│   id, name, email, permissions   │
│ }                                │
└──────┬───────────────────────────┘
       │
       ↓
┌──────────────────────────────────┐
│ getDashboardPath(user) called    │
│ Checks user.permissions          │
└──────┬───────────────────────────┘
       │
   ┌───┴────┬─────────┬─────────┬──────────┐
   │        │         │         │          │
   ↓        ↓         ↓         ↓          ↓
┌─────────┐┌────────┐┌────────┐┌────────┐┌──────┐
│Student  ││Faculty ││ Dean   ││ Admin  ││ Org  │
│Dashboard││Dash.   ││Dash.   ││Dash.   ││Dash. │
└─────────┘└────────┘└────────┘└────────┘└──────┘
```

### 3. Faculty Clearance Signing Flow

```
┌──────────────────────────────────────┐
│  Student made payment               │
│  Payment status = "completed"       │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Professor logs into faculty-dash    │
│  Views clearance queue (Professor)   │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  renderProfessorTable() displays:    │
│  • Students awaiting faculty sign    │
│  • Payment status: Fully Paid        │
│  • Clearance status: Pending         │
│  • "Sign" button (if eligible)       │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Professor clicks "Sign" button      │
│  Faculty clearance modal opens       │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  signClearance() called              │
│  Sets clearance status in student    │
│  Logs action in audit trail          │
└────────┬─────────────────────────────┘
         │
         ↓
┌──────────────────────────────────────┐
│  Student now eligible for dean       │
│  Dean sees in dean-dashboard         │
│  Dean performs final clearance       │
│  Clearance complete = "Signed"       │
└──────────────────────────────────────┘
```

---

## localStorage Schema

### ccs.auth.user
```javascript
{
  "id": "u-TY202500100",
  "name": "Juan Dela Cruz",
  "email": "juan@wmsu.edu.ph",
  "role": "student",
  "permissions": {
    "studentView": true,
    "organizationView": false,
    "adminView": false,
    "facultyView": false,
    "deanView": false
  },
  "isFirstLogin": false
}
```

### ccs.pending.signups
```javascript
[
  {
    "id": "PENDING-1714086600000",
    "firstName": "Juan",
    "middleName": "Manuel",
    "surname": "Dela Cruz",
    "suffix": "Jr.",
    "studentId": "TY202500100",
    "course": "BS Computer Science",
    "year": "1st Year",
    "section": "A",
    "sex": "Male",
    "email": "juan@wmsu.edu.ph",
    "password": "hashedpassword",
    "status": "pending",
    "createdAt": "2026-04-26T10:30:00.000Z"
  }
]
```

### ccs.audit.logs
```javascript
[
  {
    "id": "LOG-1714086600001",
    "timestamp": "Apr 26, 2026, 10:30:00 AM",
    "user": "Prof. Maria Santos",
    "role": "Professor",
    "action": "Student Signup Approved",
    "details": "Approved signup for Juan Dela Cruz (TY202500100) - Section A",
    "ipAddress": "192.168.1.1",
    "type": "info"
  }
]
```

---

## Event Flow & User Interactions

### Page Load Event Chain

```
1. HTML Loads
   ↓
2. Scripts Import in Order:
   • settings.js (theme setup)
   • sample-accounts.js (demo data)
   • auth.js (authentication module)
   • sidebar-template.js (sidebar rendering)
   • script.js (main routing)
   • [role-specific dashboards].js
   ↓
3. DOMContentLoaded Event Fires
   ↓
4. Check User Session (localStorage)
   ↓
5. If User Logged In:
   → Render appropriate dashboard
   ↓
6. If User Not Logged In:
   → Show login form (index.html)
```

### User Action Event Chain

```
User Clicks Button
   ↓
addEventListener() Fires
   ↓
Event Handler Function Called
   ↓
Data Updated (in-memory or localStorage)
   ↓
UI Re-rendered
   ↓
Audit Log Entry Created (if applicable)
   ↓
Modal/Page Updated
```

---

## State Management Flow

### Current User State
```javascript
// Stored in localStorage + memory
window.Auth.getUser() → returns user object
                      → contains permissions
                      → used for access control

// Used for routing
if (user.permissions.studentView) → show student dashboard
if (user.permissions.facultyView) → show faculty dashboard
```

### Pending Signups State
```javascript
// Stored in localStorage
localStorage['ccs.pending.signups'] → JSON array

// Retrieved by
window.Auth.getPendingSignups() → returns array
                                → grouped by section
                                → displayed in table
                                → can be approved/rejected
```

### Audit Log State
```javascript
// Stored in localStorage
localStorage['ccs.audit.logs'] → JSON array

// Appended to on every action
addAuditLog(action, details) → creates new entry
                             → includes timestamp
                             → includes user info
                             → stored for compliance
```

---

## Permission Hierarchy

```
┌─────────────────────────────────────────┐
│              ADMIN                      │
│  • All permissions                      │
│  • System configuration                 │
│  • User management                      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│     DEAN / FACULTY / ADVISER            │
│  • facultyView                          │
│  • verify_signup (professors only)      │
│  • clearance workflows                  │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│        ORGANIZATION / STAFF             │
│  • organizationView                     │
│  • payment management                   │
│  • expense reports                      │
└─────────────────────────────────────────┘
     ↓
┌─────────────────────────────────────────┐
│           STUDENT                       │
│  • studentView (only own data)          │
│  • payment submission                   │
│  • clearance status viewing             │
└─────────────────────────────────────────┘
```

---

## Module Dependencies

```
landing-page.html
├── sidebar-template.js (optional navigation)
├── landing-page.css
└── No backend/API calls

index.html (Login)
├── auth.js
├── script.js (routing)
├── sample-accounts.js (demo data)
├── settings.js (theme)
└── login-style.css

signup.html (Registration)
├── auth.js (save pending signup)
├── sample-accounts.js (reference)
├── login-style.css
└── Sends to auth.js.savePendingSignup()

faculty-dashboard.html (Professor)
├── auth.js
├── script.js
├── faculty-dashboard.js (pending signups)
├── admin-dashboard.js (permissions)
├── sidebar-template.js
├── settings.js
├── faculty-styles/faculty-dashboard.css
└── Modals for approve/reject/view

student-dashboard.html
├── auth.js
├── script.js
├── sidebar-template.js
├── settings.js
├── student-styles/*.css
└── Multiple page references
```

---

## API/Function Call Chain Example

### Approving a Student Signup

```
1. User clicks "Approve" button in faculty-dashboard.html

2. Event listener fires:
   approveSingleSignup(signupId) {
     
3. Calls Auth module:
     const result = window.Auth.approvePendingSignup(signupId)
     
4. Inside auth.js:
     • Finds signup by ID in localStorage
     • Creates new user account in SAMPLE_ACCOUNTS
     • Removes from pending signups array
     • Updates localStorage
     • Returns result object
     
5. Back in faculty-dashboard.js:
     if (result.ok) {
       addAuditLog('Student Signup Approved', details)
       alert('Approved')
       renderPendingSignups() // re-render table
     }
     
6. Audit log added:
     • Logged to localStorage[ccs.audit.logs]
     • Includes timestamp, user, action, details
     
7. UI updated:
     • Removed from pending table
     • Appears in clearance queue below
```

---

## Error Handling Flow

```
User Action
   ↓
Try: Execute function
   ├─ Success: Update state + UI
   ├─ Validation Error: Show alert
   ├─ Permission Error: Block action
   └─ Storage Error: Fallback to memory
   ↓
Catch: Log error if caught
   ↓
Finally: Update UI state
```

---

## Session & Authentication Flow

```
Browser Start
   ↓
Check localStorage['ccs.auth.user']
   ├─ Exists + Valid → Skip login, load dashboard
   └─ Missing/Invalid → Show login form
   ↓
User enters credentials
   ↓
Auth.login() validates
   ├─ Credentials valid → Store session + route to dashboard
   └─ Invalid → Show error, stay on login
   ↓
User navigates pages
   ├─ Authorized → Show page
   └─ Unauthorized → Redirect to login
   ↓
User logs out
   ├─ Clear localStorage
   ├─ Clear memory variables
   └─ Redirect to login
```

---

## Production Architecture (Future)

```
┌──────────────────────────────────────┐
│     CLIENT BROWSER (SPA)             │
├──────────────────────────────────────┤
│ • React/Vue/Angular Frontend         │
│ • Responsive design                  │
│ • Client-side routing                │
└──────────┬───────────────────────────┘
           │ HTTPS/TLS
           ↓
┌──────────────────────────────────────┐
│      API SERVER (Backend)            │
├──────────────────────────────────────┤
│ • Node.js/Python/Java                │
│ • REST/GraphQL API                   │
│ • Authentication (JWT/OAuth2)        │
│ • Rate limiting & security           │
└──────────┬───────────────────────────┘
           │
           ↓
┌──────────────────────────────────────┐
│         DATABASE                     │
├──────────────────────────────────────┤
│ • PostgreSQL / MongoDB               │
│ • User accounts                      │
│ • Payments                           │
│ • Audit logs                         │
│ • Clearance records                  │
└──────────────────────────────────────┘
           
           + External Services:
           • Email service (SendGrid)
           • Payment gateway (Stripe)
           • SMS notifications (Twilio)
```

---

**Document Version:** 1.0
**Last Updated:** April 26, 2026
**For:** CCS Student Fees Management System
