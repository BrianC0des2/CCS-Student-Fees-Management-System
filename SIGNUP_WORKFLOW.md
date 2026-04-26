## SIGNUP WORKFLOW IMPLEMENTATION SUMMARY

### 1. signup.html
**Changes**: New self-registration page created. Mirrors login-style.css patterns and login form layout (centered card, max-width 400px). Multi-field form collecting: First/Surname/Middle Name, Suffix, Student ID, Course, Year, Section, Email (@wmsu.edu.ph enforced), Password. Email becomes read-only after @wmsu.edu.ph validation. Saves pending signup to localStorage via Auth.savePendingSignup().

**Key Validation**:
- Email must end with @wmsu.edu.ph (auto-blocked if not)
- Password minimum 6 characters
- Passwords must match
- All required fields enforced
- Existing email check

---

### 2. auth.js
**Changes**: Added 5 new functions to Auth module:
- `savePendingSignup(signupData)` – Stores pending signup in localStorage[ccs.pending.signups]
- `getPendingSignups()` – Retrieves all pending signups
- `approvePendingSignup(signupId)` – Moves signup to SAMPLE_ACCOUNTS, sets status "active" with student permissions
- `rejectPendingSignup(signupId)` – Removes signup from pending queue
- All functions handle try/catch for localStorage access

**Signup Object Structure**:
```javascript
{ id, firstName, surname, middleName, suffix, studentId, course, year, section, email, password, status: 'pending', createdAt }
```

---

### 3. faculty-dashboard.html
**Changes**: Added "Pending Signups" section (id: pendingSignupsSection) BEFORE the existing "Professor Queue" table. Section contains:
- Section-grouped student table with Approve/Reject buttons
- "Approve All" button per section
- Hidden by default; visible only if faculty has verify_signup permission
- Uses existing CSS classes: .members-table, .faculty-table-card, .table-header, .table-container

---

### 4. faculty-dashboard.js (NEW FILE)
**Changes**: New module handling pending signup workflow:
- `renderPendingSignups()` – Groups pending signups by section, renders table with Approve/Reject buttons
- `approveSectionSignups(section)` – Batch approves all signups in a section, logs action
- `approveSingleSignup(signupId)` – Single approval, logs action
- `rejectSingleSignup(signupId)` – Rejection with reason prompt, logs action
- `addAuditLog(action, details)` – Persists audit log to localStorage[ccs.audit.logs]
- `hasVerifySignupPermission()` – Permission check (professor-only)

**Exposed for debugging**: `window.PendingSignups` object with render, approveSingle, rejectSingle, approveSection methods

---

### 5. admin-dashboard.js
**Changes**: 
- Added `{ id: 'verify_signup', label: 'Verify Student Signups', category: 'Student Management' }` to ALL_PERMISSIONS array (line 40)
- Added 'verify_signup' to FAC-005 (Adviser) permissions: `['view_students','verify_signup','approve_clearance','sign_clearance']`
- Added 'verify_signup' to FAC-006 (Professor) permissions: `['view_students','verify_signup','sign_clearance']`

**Result**: Professors and advisers can now see and manage pending student signups

---

### 6. index.html
**Changes**: Added signup link below login button in login form:
```html
<div style="text-align: center; margin-top: 16px; font-size: 12px;">
    Don't have an account? <a href="signup.html">Sign Up</a>
</div>
```

---

## WORKFLOW OVERVIEW

1. **Student Self-Registration** (signup.html)
   - Student fills form with personal/academic info
   - Email auto-validated for @wmsu.edu.ph domain
   - Saved to localStorage as "pending" status

2. **Professor Batch Approval** (faculty-dashboard.js)
   - Only visible to faculty with verify_signup permission
   - Professor sees pending signups grouped by section
   - Can approve individually OR batch-approve entire section
   - Can reject with reason prompt

3. **Auto-Gate** (signup.html + auth.js)
   - Non @wmsu.edu.ph emails rejected immediately
   - No professor action needed for invalid emails

4. **Audit Trail**
   - All approvals/rejections logged with timestamp, user, action, details
   - Stored in localStorage[ccs.audit.logs] for persistence

5. **Student Access**
   - On approval: Student added to SAMPLE_ACCOUNTS with permissions ["view_dashboard", "make_payment", "view_receipt"]
   - On rejection: Signup removed, professor provides reason in audit log

---

## PERSISTENT STORAGE

- **Pending Signups**: localStorage[ccs.pending.signups]
- **Audit Logs**: localStorage[ccs.audit.logs]
- **Active Accounts**: SAMPLE_ACCOUNTS (in memory + persisted via auth module)

---

## PERMISSION HIERARCHY

- Only **Faculty with 'verify_signup' permission** can see and manage pending signups
- Current professors with permission: FAC-005 (Adviser), FAC-006 (Professor)
- Admin can grant permission via Permissions tab in Admin Dashboard
