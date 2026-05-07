(function () {
    const PROMISSORY_STORAGE_KEY = 'ccs.promissory.requests'; // Shared key with student promissory submit flow
    const FEES_STORAGE_KEY = 'ccs.organization.fees';

    let pendingRejectionId = null;

    function getOrganizationScope() {
        if (window.CCSAuthHelpers && typeof window.CCSAuthHelpers.getCurrentOrganizationScope === 'function') {
            return window.CCSAuthHelpers.getCurrentOrganizationScope();
        }
        return null;
    }

    function getCurrentOrgId() {
        const scope = getOrganizationScope();
        return scope && scope.orgId ? scope.orgId : 'u-org-001';
    }

    function getCurrentOrgName() {
        const scope = getOrganizationScope();
        return scope && scope.organization ? scope.organization : 'CCS Student Council';
    }

    function readJson(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (_err) {
            return fallback;
        }
    }

    function readJsonArray(key) {
        return readJson(localStorage.getItem(key), []);
    }

    function formatDate(dateStr) {
        if (!dateStr) return '-';
        try {
            const date = new Date(dateStr);
            return date.toLocaleDateString('en-US', { year: 'numeric', month: 'short', day: 'numeric' });
        } catch (e) {
            return dateStr;
        }
    }

    function formatCurrency(amount) {
        if (!amount) return '₱0.00';
        const num = Number(amount);
        return '₱' + num.toFixed(2);
    }

    function getFeesForOrg(orgId) {
        const fees = readJsonArray(FEES_STORAGE_KEY);
        return fees.filter(fee => (fee.orgId === orgId || (!fee.orgId && orgId === 'u-org-001')));
    }

    function getPromissoryRequestsForOrg(orgId) {
        const orgFees = getFeesForOrg(orgId);
        const orgFeeIds = orgFees.map(f => f.id);
        const allRequests = readJsonArray(PROMISSORY_STORAGE_KEY);
        return allRequests.filter(req => orgFeeIds.includes(req.feeId));
    }

    function renderPromissoryTable() {
        const orgId = getCurrentOrgId();
        const requests = getPromissoryRequestsForOrg(orgId).sort(function(a, b) {
            return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
        });

        const body = document.getElementById('promissoryTableBody');
        const badge = document.getElementById('promissoryCountBadge');
        const pendingCount = requests.filter(r => r.status === 'Pending Review').length;

        if (requests.length === 0) {
            body.innerHTML = '<tr><td colspan="9" class="promissory-empty">No promissory note requests found.</td></tr>';
            badge.textContent = '0 Pending';
            return;
        }

        badge.textContent = pendingCount + ' Pending';

        body.innerHTML = requests.map(request => {
            const statusClass = request.status === 'Pending Review' 
                ? 'promissory-status-pending'
                : request.status === 'Promissory Approved'
                    ? 'promissory-status-approved'
                    : 'promissory-status-rejected';

            let actionsHTML = '';
            if (request.status === 'Pending Review') {
                actionsHTML = `
<div class="promissory-actions">
<button class="promissory-btn-approve" data-id="${request.id}" data-action="approve">Approve</button>
<button class="promissory-btn-reject" data-id="${request.id}" data-action="reject">Reject</button>
</div>
`;
            } else {
                actionsHTML = `<span class="${statusClass}">${request.status}</span>`;
            }

            return `
<tr>
<td>${request.studentName}</td>
<td>${request.studentNumber}</td>
<td>${request.feeName}</td>
<td>${request.partialAmount ? formatCurrency(request.partialAmount) : '-'}</td>
<td>${request.reason}</td>
<td>${formatDate(request.promisedDate)}</td>
<td>${formatDate(request.createdAt)}</td>
<td><span class="${statusClass}">${request.status}</span></td>
<td>${actionsHTML}</td>
</tr>
`;
        }).join('');

        attachActionHandlers();
    }

    function attachActionHandlers() {
        const approveButtons = document.querySelectorAll('[data-action="approve"]');
        const rejectButtons = document.querySelectorAll('[data-action="reject"]');

        approveButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                approvePromissory(id);
            });
        });

        rejectButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                pendingRejectionId = id;
                document.getElementById('rejectionReason').value = '';
                document.getElementById('rejectionModal').classList.add('active');
            });
        });
    }

    function approvePromissory(id) {
        const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
        const request = requests.find(r => r.id === id);
        if (!request) return;

        request.status = 'Promissory Approved';
        request.updatedAt = new Date().toISOString();

        localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));

        // Mark notification as unread for student
        const studentId = request.studentId;
        const unreadKey = 'ccs.promissory.unread.' + studentId;
        const unread = readJsonArray(unreadKey);
        if (!unread.find(u => u.requestId === id)) {
            unread.push({ requestId: id, status: 'Promissory Approved', timestamp: new Date().toISOString() });
            localStorage.setItem(unreadKey, JSON.stringify(unread));
        }

        renderPromissoryTable();
        alert('Promissory note approved successfully.');
    }

    function rejectPromissory(id, reason) {
        const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
        const request = requests.find(r => r.id === id);
        if (!request) return;

        request.status = 'Promissory Rejected';
        request.rejectionReason = reason;
        request.updatedAt = new Date().toISOString();

        localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));

        // Mark notification as unread for student
        const studentId = request.studentId;
        const unreadKey = 'ccs.promissory.unread.' + studentId;
        const unread = readJsonArray(unreadKey);
        if (!unread.find(u => u.requestId === id)) {
            unread.push({ requestId: id, status: 'Promissory Rejected', reason: reason, timestamp: new Date().toISOString() });
            localStorage.setItem(unreadKey, JSON.stringify(unread));
        }

        renderPromissoryTable();
        alert('Promissory note rejected successfully.');
    }

    function initializeModal() {
        const modal = document.getElementById('rejectionModal');
        const cancelBtn = document.getElementById('rejectionModalCancel');
        const confirmBtn = document.getElementById('rejectionModalConfirm');

        cancelBtn.addEventListener('click', function() {
            modal.classList.remove('active');
            pendingRejectionId = null;
        });

        confirmBtn.addEventListener('click', function() {
            if (!pendingRejectionId) return;
            const reason = document.getElementById('rejectionReason').value.trim();
            if (!reason) {
                alert('Please enter a rejection reason.');
                return;
            }
            rejectPromissory(pendingRejectionId, reason);
            modal.classList.remove('active');
            pendingRejectionId = null;
        });

        modal.addEventListener('click', function(e) {
            if (e.target === modal) {
                modal.classList.remove('active');
                pendingRejectionId = null;
            }
        });
    }

    function initializePage() {
        loadSidebar();
        const orgName = getCurrentOrgName();
        const headerElement = document.querySelector('.home-content span.text');
        if (headerElement) {
            headerElement.textContent = `${orgName} - Promissory Notes Management`;
        }
        renderPromissoryTable();
        initializeModal();
    }

    document.addEventListener('DOMContentLoaded', initializePage);
})();
