(function() {
    const ORGS_STORAGE_KEY = 'ccs.organizations';
    const modal = document.getElementById('handoverModal');
    const requestBtn = document.getElementById('requestHandoverBtn');
    const findBtn = document.getElementById('findStudentBtn');
    const cancelBtn = document.getElementById('handoverCancel');
    const submitBtn = document.getElementById('handoverSubmit');
    const emailInput = document.getElementById('handoverEmail');
    const resultDiv = document.getElementById('lookupResult');
    let selectedStudentId = null;

    function getOrganizations() {
        try {
            const orgs = JSON.parse(localStorage.getItem(ORGS_STORAGE_KEY) || '[]');
            return Array.isArray(orgs) ? orgs : [];
        } catch (_) {
            return [];
        }
    }

    function saveOrganizations(orgs) {
        localStorage.setItem(ORGS_STORAGE_KEY, JSON.stringify(orgs));
    }

    function getCurrentOrgId() {
        const scope = window.CCSAuthHelpers?.getCurrentOrganizationScope?.();
        return scope?.orgId || 'u-org-001';
    }

    function getCurrentOrgName() {
        const scope = window.CCSAuthHelpers?.getCurrentOrganizationScope?.();
        return scope?.organization || 'Organization';
    }

    function formatDate(dateString) {
        if (!dateString) return '';
        const date = new Date(dateString);
        return date.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    }

    function renderProfile() {
        const profileContent = document.getElementById('profileContent');
        const currentOrgId = getCurrentOrgId();
        const orgs = getOrganizations();
        const org = orgs.find(o => o.id === currentOrgId);
        const orgName = getCurrentOrgName();
        const currentUser = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : {};

        let managedByText = 'Unassigned';
        let managedByIdText = '';

        if (org && org.head) {
            const headAccount = (window.SAMPLE_ACCOUNTS || []).find(a => a.id === org.head);
            if (headAccount) {
                managedByText = headAccount.name;
                managedByIdText = headAccount.studentId || headAccount.id;
            }
        }

        // Fallback to current user if no head is set or found
        if (managedByText === 'Unassigned' && currentUser && currentUser.name) {
            managedByText = currentUser.name;
            managedByIdText = currentUser.studentId || currentUser.id;
        }

        const createdDate = org ? formatDate(org.createdAt) : formatDate('2026-01-15T08:00:00.000Z');

        profileContent.innerHTML = `
<div class="profile-row">
    <div class="profile-label">Name</div>
    <div class="profile-value">${org?.name || orgName}</div>
</div>
<div class="profile-row">
    <div class="profile-label">Abbreviation</div>
    <div class="profile-value"><span class="badge">${org?.abbreviation || 'ORG'}</span></div>
</div>
<div class="profile-row">
    <div class="profile-label">Description</div>
    <div class="profile-value">${org?.description || 'No description'}</div>
</div>
<div class="profile-row">
    <div class="profile-label">Managed by</div>
    <div class="profile-value">
        ${managedByText}${managedByIdText ? ' (' + managedByIdText + ')' : ''}
        ${managedByText === 'Unassigned' ? '<span style="color: #9ca3af;">(Unassigned)</span>' : ''}
    </div>
</div>
<div class="profile-row">
    <div class="profile-label">Created</div>
    <div class="profile-value">${createdDate}</div>
</div>
`;
    }

    function updateHandoverStatus() {
        const currentOrgId = getCurrentOrgId();
        const orgs = getOrganizations();
        const org = orgs.find(o => o.id === currentOrgId);
        const statusDiv = document.getElementById('handoverStatus');
        const btn = document.getElementById('requestHandoverBtn');

        if (org && org.pendingHandover) {
            statusDiv.style.display = 'block';
            statusDiv.innerHTML = `
<div class="status-box">
    Handover request pending admin approval.<br>
    Transferring to: ${org.pendingHandover.toStudentName}
</div>
`;
            btn.disabled = true;
            btn.style.opacity = '0.5';
        } else {
            statusDiv.style.display = 'none';
            btn.disabled = false;
            btn.style.opacity = '1';
        }
    }

    function addAuditLog(action, details) {
        const log = {
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toLocaleString(),
            user: 'Organization User',
            role: 'Organization Staff',
            action: action,
            details: details,
            ipAddress: '192.168.1.1',
            type: 'info'
        };
        const logs = JSON.parse(localStorage.getItem('ccs.audit.logs') || '[]');
        logs.unshift(log);
        localStorage.setItem('ccs.audit.logs', JSON.stringify(logs));
    }

    requestBtn.addEventListener('click', () => {
        modal.classList.add('active');
        emailInput.focus();
    });

    cancelBtn.addEventListener('click', () => {
        modal.classList.remove('active');
        emailInput.value = '';
        resultDiv.innerHTML = '';
        selectedStudentId = null;
        submitBtn.disabled = true;
        submitBtn.style.opacity = '0.5';
    });

    findBtn.addEventListener('click', () => {
        const email = emailInput.value.trim().toLowerCase();
        if (!email) {
            resultDiv.innerHTML = '<div style="color: #dc2626;">Please enter an email address.</div>';
            return;
        }
        const student = (window.SAMPLE_ACCOUNTS || []).find(a =>
            a.permissions?.studentView && a.email.toLowerCase() === email
        );
        if (student) {
            selectedStudentId = student.id;
            resultDiv.innerHTML = `<div style="color: #16a34a;">✓ Found: <strong>${student.name}</strong> (${student.studentId})</div>`;
            submitBtn.disabled = false;
            submitBtn.style.opacity = '1';
        } else {
            selectedStudentId = null;
            resultDiv.innerHTML = '<div style="color: #dc2626;">No student account found with this email.</div>';
            submitBtn.disabled = true;
            submitBtn.style.opacity = '0.5';
        }
    });

    submitBtn.addEventListener('click', () => {
        if (!selectedStudentId) return;
        const orgs = getOrganizations();
        const currentOrgId = getCurrentOrgId();
        let org = orgs.find(o => o.id === currentOrgId);

        if (!org) {
            org = { id: currentOrgId, head: '', pendingHandover: null, createdAt: new Date().toISOString() };
            orgs.push(org);
        }

        const student = (window.SAMPLE_ACCOUNTS || []).find(a => a.id === selectedStudentId);
        org.pendingHandover = {
            toStudentId: selectedStudentId,
            toStudentName: student?.name || 'Unknown',
            requestedAt: new Date().toISOString()
        };

        saveOrganizations(orgs);
        addAuditLog('Role Transfer Requested', `Requested handover of ${getCurrentOrgName()} to ${student?.name}`);

        // Write notification to receiving student
        const receivingStudentId = student?.studentId;
        if (receivingStudentId) {
            const notifKey = 'ccs.notifications.' + receivingStudentId;
            const notifs = JSON.parse(localStorage.getItem(notifKey) || '[]');
            const currentUser = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : {};
            notifs.unshift({
                id: 'notif-' + Date.now(),
                type: 'org_role_offer',
                title: 'Org Role Offer — ' + org.name,
                body: (currentUser.name || 'Someone') + ' has offered you the organization head role for ' + org.name + '.',
                orgId: org.id,
                createdAt: new Date().toISOString(),
                read: false,
                resolved: false
            });
            localStorage.setItem(notifKey, JSON.stringify(notifs));
        }

        modal.classList.remove('active');
        emailInput.value = '';
        resultDiv.innerHTML = '';
        selectedStudentId = null;
        updateHandoverStatus();
        alert('Handover request submitted. Awaiting admin approval.');
    });

    modal.addEventListener('click', (e) => {
        if (e.target === modal) {
            modal.classList.remove('active');
            emailInput.value = '';
            resultDiv.innerHTML = '';
            selectedStudentId = null;
        }
    });

    renderProfile();
    updateHandoverStatus();
})();
