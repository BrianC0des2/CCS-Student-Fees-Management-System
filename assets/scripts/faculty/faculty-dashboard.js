'use strict';

document.addEventListener('DOMContentLoaded', () => {
  /* ══════════════════════════════
     PENDING SIGNUPS MANAGEMENT
  ══════════════════════════════ */

  function getCurrentUser() {
    if (window.Auth && typeof window.Auth.getUser === 'function') {
      return window.Auth.getUser();
    }
    try {
      const raw = localStorage.getItem('ccs.auth.user') || sessionStorage.getItem('ccs.auth.user');
      return raw ? JSON.parse(raw) : null;
    } catch (e) {
      return null;
    }
  }

  function hasVerifySignupPermission() {
    const user = getCurrentUser();
    if (!user || !user.permissions) return false;
    // Check if faculty has verify_signup permission (only professors do)
    return window.Auth && window.Auth.isFaculty && window.Auth.isFaculty();
  }

  function addAuditLog(action, details) {
    const user = getCurrentUser();
    const timestamp = new Date().toLocaleString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
      hour12: true
    });

    const log = {
      id: 'LOG-' + Date.now(),
      timestamp: timestamp,
      user: user ? user.name : 'System',
      role: user && user.permissions ? 'Professor' : 'System',
      action: action,
      details: details,
      ipAddress: '192.168.1.1',
      type: 'info'
    };

    // Store in localStorage for persistence
    try {
      let logs = [];
      const raw = localStorage.getItem('ccs.audit.logs');
      if (raw) {
        try {
          logs = JSON.parse(raw);
        } catch (e) {
          logs = [];
        }
      }
      logs.push(log);
      localStorage.setItem('ccs.audit.logs', JSON.stringify(logs));
    } catch (e) {
      console.log('Could not persist audit log');
    }
  }

  function renderPendingSignups() {
    const section = document.getElementById('pendingSignupsSection');
    const container = document.getElementById('pendingSignupsContainer');

    if (!section || !container) return;

    // Check permission
    if (!hasVerifySignupPermission()) {
      section.style.display = 'none';
      return;
    }

    // Get pending signups
    const pending = window.Auth && typeof window.Auth.getPendingSignups === 'function'
      ? window.Auth.getPendingSignups()
      : [];

    if (pending.length === 0) {
      section.style.display = 'none';
      return;
    }

    section.style.display = 'block';

    // Group by section
    const grouped = {};
    pending.forEach(signup => {
      if (!grouped[signup.section]) {
        grouped[signup.section] = [];
      }
      grouped[signup.section].push(signup);
    });

    let html = '';

    Object.entries(grouped).forEach(([sectionName, signups]) => {
      html += `
        <div style="margin-bottom: 20px; padding: 16px; border: 1px solid #e5e7eb; border-radius: 8px;">
          <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 12px;">
            <h3 style="margin: 0; font-size: 14px; font-weight: 700; color: #1a1a2e;">Section ${sectionName}</h3>
            <button class="approve-section-btn" data-section="${sectionName}" style="background: #2e7d52; color: white; border: none; padding: 6px 12px; border-radius: 6px; font-size: 12px; font-weight: 600; cursor: pointer;">
              Approve All
            </button>
          </div>
          <table style="width: 100%; border-collapse: collapse; font-size: 12px;">
            <thead>
              <tr style="background: #f3f4f6; border-bottom: 1px solid #e5e7eb;">
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Name</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Student ID</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Email</th>
                <th style="padding: 8px; text-align: left; font-weight: 600; color: #374151;">Course</th>
                <th style="padding: 8px; text-align: center; font-weight: 600; color: #374151;">Action</th>
              </tr>
            </thead>
            <tbody>
      `;

      signups.forEach(signup => {
        const fullName = [signup.firstName, signup.middleName, signup.surname].filter(Boolean).join(' ').trim();
        html += `
          <tr style="border-bottom: 1px solid #e5e7eb;">
            <td style="padding: 8px; color: #1a1a2e;">${fullName}</td>
            <td style="padding: 8px; color: #1a1a2e;">${signup.studentId}</td>
            <td style="padding: 8px; color: #1a1a2e;">${signup.email}</td>
            <td style="padding: 8px; color: #1a1a2e;">${signup.course}</td>
            <td style="padding: 8px; text-align: center;">
              <button class="view-signup-btn" data-signup-id="${signup.id}" style="background: #0ea5e9; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-right: 4px;">
                View
              </button>
              <button class="approve-signup-btn" data-signup-id="${signup.id}" style="background: #16a34a; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer; margin-right: 4px;">
                Approve
              </button>
              <button class="reject-signup-btn" data-signup-id="${signup.id}" style="background: #dc2626; color: white; border: none; padding: 4px 8px; border-radius: 4px; font-size: 11px; cursor: pointer;">
                Reject
              </button>
            </td>
          </tr>
        `;
      });

      html += `
            </tbody>
          </table>
        </div>
      `;
    });

    container.innerHTML = html;

    // Attach event listeners
    container.querySelectorAll('.approve-section-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const section = this.dataset.section;
        approveSectionSignups(section);
      });
    });

    container.querySelectorAll('.approve-signup-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const signupId = this.dataset.signupId;
        approveSingleSignup(signupId);
      });
    });

    container.querySelectorAll('.reject-signup-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const signupId = this.dataset.signupId;
        rejectSingleSignup(signupId);
      });
    });

    container.querySelectorAll('.view-signup-btn').forEach(btn => {
      btn.addEventListener('click', function () {
        const signupId = this.dataset.signupId;
        viewSignupDetails(signupId);
      });
    });
  }

  function approveSectionSignups(section) {
    if (!window.Auth) return;

    const pending = window.Auth.getPendingSignups();
    const sectionSignups = pending.filter(s => s.section === section);

    if (sectionSignups.length === 0) return;

    sectionSignups.forEach(signup => {
      const result = window.Auth.approvePendingSignup(signup.id);
      if (result.ok) {
        addAuditLog(
          'Student Signup Approved',
          `Approved signup for ${signup.firstName} ${signup.surname} (${signup.studentId}) - Section ${section}`
        );
      }
    });

    alert(`Approved ${sectionSignups.length} student(s) from Section ${section}`);
    renderPendingSignups();
  }

  function approveSingleSignup(signupId) {
    if (!window.Auth) return;

    const pending = window.Auth.getPendingSignups();
    const signup = pending.find(s => s.id === signupId);

    if (!signup) return;

    const result = window.Auth.approvePendingSignup(signupId);
    if (result.ok) {
      addAuditLog(
        'Student Signup Approved',
        `Approved signup for ${signup.firstName} ${signup.surname} (${signup.studentId})`
      );
      alert('Student approved! They can now log in.');
    } else {
      alert('Failed to approve signup: ' + result.message);
    }

    renderPendingSignups();
  }

  function rejectSingleSignup(signupId) {
    if (!window.Auth) return;

    const pending = window.Auth.getPendingSignups();
    const signup = pending.find(s => s.id === signupId);

    if (!signup) return;

    const reason = prompt('Reason for rejection:');
    if (reason === null) return; // User cancelled

    const result = window.Auth.rejectPendingSignup(signupId);
    if (result.ok) {
      addAuditLog(
        'Student Signup Rejected',
        `Rejected signup for ${signup.firstName} ${signup.surname} (${signup.studentId}). Reason: ${reason || 'No reason provided'}`
      );
      alert('Signup rejected.');
    } else {
      alert('Failed to reject signup: ' + result.message);
    }

    renderPendingSignups();
  }

  function viewSignupDetails(signupId) {
    if (!window.Auth) return;

    const pending = window.Auth.getPendingSignups();
    const signup = pending.find(s => s.id === signupId);
    if (!signup) return;

    const modal = document.getElementById('pendingSignupViewModal');
    const content = document.getElementById('pendingSignupViewContent');
    if (!modal || !content) return;

    const fullName = [signup.firstName, signup.middleName, signup.surname, signup.suffix].filter(Boolean).join(' ').trim();
    
    content.innerHTML = `
      <div style="display: grid; gap: 12px; font-size: 13px;">
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Full Name:</strong>
          <span>${fullName}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Student ID:</strong>
          <span>${signup.studentId}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Email:</strong>
          <span>${signup.email}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Course:</strong>
          <span>${signup.course}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Year:</strong>
          <span>${signup.year}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Section:</strong>
          <span>${signup.section}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Sex:</strong>
          <span>${signup.sex || 'Not specified'}</span>
        </div>
        <div style="display: grid; grid-template-columns: 120px 1fr; gap: 12px;">
          <strong>Applied:</strong>
          <span>${new Date(signup.createdAt).toLocaleString()}</span>
        </div>
      </div>
    `;

    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
  }

  function closeViewModal() {
    const modal = document.getElementById('pendingSignupViewModal');
    if (modal) {
      modal.classList.remove('show');
      modal.setAttribute('aria-hidden', 'true');
    }
  }

  // Modal close button listener
  const closeBtn = document.getElementById('pendingSignupViewClose');
  if (closeBtn) {
    closeBtn.addEventListener('click', closeViewModal);
  }

  // Close modal on overlay click
  const modal = document.getElementById('pendingSignupViewModal');
  if (modal) {
    modal.addEventListener('click', function(e) {
      if (e.target === this) {
        closeViewModal();
      }
    });
  }

  // Initial render on page load
  renderPendingSignups();

  // Re-render pending signups when faculty dashboard rerenders
  const originalRender = window.renderFacultyDashboard;
  if (originalRender) {
    window.renderFacultyDashboard = function() {
      originalRender.apply(this, arguments);
      renderPendingSignups();
    };
  }

  // Expose for testing/debugging
  window.PendingSignups = {
    render: renderPendingSignups,
    approveSingle: approveSingleSignup,
    rejectSingle: rejectSingleSignup,
    approveSection: approveSectionSignups
  };
});
