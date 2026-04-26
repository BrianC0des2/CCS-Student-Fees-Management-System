# CCS Student Fees Management System - Quick Reference

## Project At A Glance

**What:** Web-based student fees and payment management system for CCS
**Tech:** Vanilla HTML/CSS/JavaScript + localStorage
**Status:** Beta - Core features implemented
**Users:** Students, Professors, Dean, Admin
**Key Feature:** Self-registration workflow → Professor approval → Payment & Clearance

---

## Critical Workflows

### 1. Student Registration
```
landing-page.html → signup.html 
  → fills form with @wmsu.edu.ph email, sex, year, section
  → saved as pending signup
  → professor reviews in faculty-dashboard.html
  → professor clicks View/Approve/Reject
  → if approved: added to SAMPLE_ACCOUNTS
  → student can now login
```

### 2. Professor Workflow
```
faculty-dashboard.html
  → sees "Pending Student Signups" section
  → can View full details (modal popup)
  → can Approve (single or batch by section)
  → can Reject (with reason)
  → all actions logged in audit trail
  → approved students appear in clearance queue below
```

### 3. Payment & Clearance
```
student-dashboard.html
  → view fees
  → click make-payment.html
  → select method (cash/transfer/check)
  → submit payment
  → professor verifies in faculty-dashboard.html
  → professor signs clearance
  → dean does final sign
  → student checks status in clearance-status.html
```

---

## Key Files to Edit

| Task | File |
|------|------|
| Add student feature | `assets/scripts/auth.js` |
| Change professor view | `assets/scripts/faculty-dashboard.js` |
| Modify permissions | `assets/scripts/admin-dashboard.js` |
| Login logic | `assets/scripts/script.js` |
| Add new page | Create in `pages/` folder |
| Change colors | `styles/theme.css` |
| User roles | `assets/scripts/sample-accounts.js` |

---

## User Roles & Default Accounts

### Student
- Email: `student@wmsu.edu.ph` | Pass: `password123`
- Can view dashboard, make payments, check clearance status

### Professor  
- Email: `professor@wmsu.edu.ph` | Pass: `facpass789`
- Can approve pending signups, sign clearances, manage students

### Dean
- Email: `dean@wmsu.edu.ph` | Pass: `deanpass000`
- Can perform final clearance signing

### Admin
- Email: `admin@wmsu.edu.ph` | Pass: `adminpass123`
- Full system access and configuration

---

## Key Data Structures

### localStorage Keys
- `ccs.auth.user` - Current logged-in user
- `ccs.pending.signups` - Pending student registrations
- `ccs.audit.logs` - All system actions logged
- `ccs.theme` - Theme preference

### User Object
```javascript
{
  id: "u-TY202500100",
  name: "Student Name",
  email: "student@wmsu.edu.ph",
  permissions: {
    studentView: true,
    organizationView: false,
    adminView: false,
    facultyView: false,
    deanView: false
  }
}
```

---

## Important Features

✅ **Implemented:**
- Self-registration with email validation
- Professor approval workflow
- Batch approval by section
- View student details modal
- Audit logging
- Multiple user roles
- Payment tracking
- Clearance workflow
- Responsive design
- Dark/light theme

❌ **NOT Implemented:**
- Backend server
- Real database
- Email notifications
- Real payment gateway
- User management UI
- Export/reporting

---

## How to Add Features

### Add New Permission
1. Edit `assets/scripts/admin-dashboard.js`
2. Add to `ALL_PERMISSIONS` array
3. Assign to specific roles in `SAMPLE_ACCOUNTS`
4. Use in code: `if (user.permissions.yourPermission)`

### Add New User Role
1. Edit `assets/scripts/sample-accounts.js`
2. Create new account object
3. Set permissions in `permissions` object
4. Edit `assets/scripts/script.js` getDashboardPath() to route to dashboard

### Add New Page
1. Create HTML file in `pages/[role]/`
2. Create JS logic file in `assets/scripts/`
3. Create CSS file in `styles/`
4. Import scripts in HTML
5. Use modal components from existing pages

---

## CSS Classes & Components

### Buttons
- `.btn-solid` - Primary solid button
- `.btn-ghost` - Secondary ghost button
- `.btn-reject` - Red danger button
- `.bulk-action-btn` - Bulk action button

### Modal
- `.modal-overlay` - Modal backdrop
- `.modal-card` - Modal content container
- `.modal-field` - Form field in modal
- `.modal-actions` - Action button container

### Tables
- `.members-table` - Table container
- `.faculty-table-card` - Faculty table card
- `.status-badge` - Status badge

### Colors from theme.css
- `--brand-700` - Primary green (#2e7d52)
- `--danger-600` - Red (#dc2626)
- `--success-600` - Green (#16a34a)
- `--sys-text-900` - Dark text (#1a1a2e)

---

## Common Tasks

### View All Pending Signups
```javascript
const pending = window.Auth.getPendingSignups();
console.log(pending);
```

### View Audit Logs
```javascript
const logs = JSON.parse(localStorage.getItem('ccs.audit.logs') || '[]');
console.log(logs);
```

### Get Current User
```javascript
const user = window.Auth.getUser();
console.log(user.permissions);
```

### Add Audit Log
```javascript
function addAuditLog(action, details) {
  const log = {
    id: 'LOG-' + Date.now(),
    timestamp: new Date().toISOString(),
    user: window.Auth.getUser().name,
    action: action,
    details: details
  };
  // Store in localStorage
}
```

---

## Debugging

### Check localStorage
```javascript
// View all stored data
console.log(localStorage);

// View specific key
console.log(JSON.parse(localStorage.getItem('ccs.pending.signups')));
```

### Check User Session
```javascript
console.log(window.Auth.getUser());
```

### Check Permissions
```javascript
const user = window.Auth.getUser();
console.log(user.permissions);
```

### View in DevTools
- Open Chrome DevTools (F12)
- Application → LocalStorage → see all stored data
- Console → run JavaScript commands above

---

## File Structure Summary

```
Root Files:
- index.html (login)
- signup.html (registration)
- landing-page.html (public home)

Directories:
- pages/ (role-based dashboards)
- assets/scripts/ (JavaScript logic)
- styles/ (CSS styling)
```

---

## Color Palette

| Color | Value | Usage |
|-------|-------|-------|
| Brand Green | #2e7d52 | Primary buttons, headers |
| Brand Light | #4aac7f | Hover states |
| Red | #dc2626 | Danger, reject, errors |
| Green | #16a34a | Success, approve |
| Blue | #0ea5e9 | View/info actions |
| Dark Text | #1a1a2e | Main text |
| Light Gray | #f3f4f6 | Backgrounds |
| Border | #e5e7eb | Dividers |

---

## Performance Notes

- **Total Project:** ~280KB uncompressed
- **localStorage Limit:** ~5-10MB (more than enough)
- **No external dependencies:** All vanilla JavaScript
- **Responsive:** Mobile-first design
- **Accessibility:** ARIA labels included

---

## Next Steps for Production

1. ❌→✅ Add backend server (Node/Express, Python/Django, etc.)
2. ❌→✅ Integrate real database (PostgreSQL, MongoDB)
3. ❌→✅ Implement proper authentication (JWT, OAuth2)
4. ❌→✅ Add payment gateway integration (Stripe, PayMongo)
5. ❌→✅ Set up email notifications
6. ❌→✅ Implement data validation on backend
7. ❌→✅ Add error logging/monitoring
8. ❌→✅ Set up CI/CD pipeline
9. ❌→✅ Security audit and hardening

---

**Last Updated:** April 26, 2026
**Version:** 1.0.0 Beta
