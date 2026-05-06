(function () {
    const PAYMENTS_STORAGE_KEY = 'ccs.student.payments';

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

    function formatPeso(amount) {
        if (!amount) return '₱0.00';
        const str = String(amount);
        if (str.startsWith('₱')) return str;
        const num = Number(str.replace(/[₱,]/g, ''));
        return '₱' + num.toFixed(2);
    }

    function getPendingPaymentsForOrg(orgId) {
        const allPayments = readJsonArray(PAYMENTS_STORAGE_KEY);
        return allPayments.filter(payment => 
            String(payment.status || '').toLowerCase() === 'pending verification' &&
                (payment.orgId === orgId || (!payment.orgId && orgId === 'u-org-001'))
        );
    }

    function renderPendingPaymentsTable() {
        const orgId = getCurrentOrgId();
        const payments = getPendingPaymentsForOrg(orgId).sort(function(a, b) {
            const dateA = new Date(a.updatedAt || a.dateSubmitted || a.date || '');
            const dateB = new Date(b.updatedAt || b.dateSubmitted || b.date || '');
            return dateB - dateA;
        });

        const body = document.getElementById('pendingPaymentsTableBody');
        const badge = document.getElementById('pendingCountBadge');
        const confirmAllBtn = document.getElementById('confirmAllBtn');

        badge.textContent = payments.length + ' Pending';

        // Show/hide Confirm All button based on pending count
        if (confirmAllBtn) {
            confirmAllBtn.style.display = payments.length >= 2 ? 'block' : 'none';
        }

        if (payments.length === 0) {
            body.innerHTML = '<tr><td colspan="9" class="payment-empty">No pending payments found.</td></tr>';
            return;
        }

        body.innerHTML = payments.map(payment => {
            return `
<tr>
<td>${payment.studentName || '-'}</td>
<td>${payment.studentId || payment.studentNo || '-'}</td>
<td>${payment.feeName || payment.desc || '-'}</td>
<td>${formatPeso(payment.amount)}</td>
<td>${payment.referenceNumber || '-'}</td>
<td>${formatDate(payment.dateSubmitted || payment.date)}</td>
<td>${payment.paymentMethod || payment.method || '-'}</td>
<td><span class="payment-status-pending">Pending Verification</span></td>
<td>
<div class="payment-actions">
<button class="payment-btn-confirm" data-action="confirm" data-id="${payment.id}">Confirm</button>
<button class="payment-btn-reject" data-action="reject" data-id="${payment.id}">Reject</button>
</div>
</td>
</tr>
`;
        }).join('');

        attachActionHandlers();
    }

    function attachActionHandlers() {
        const confirmButtons = document.querySelectorAll('[data-action="confirm"]');
        const rejectButtons = document.querySelectorAll('[data-action="reject"]');

        confirmButtons.forEach(btn => {
            btn.addEventListener('click', function() {
                const id = this.dataset.id;
                confirmPayment(id);
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

    function confirmPayment(id) {
        const payments = readJsonArray(PAYMENTS_STORAGE_KEY);
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        payment.status = 'Confirmed';
        payment.updatedAt = new Date().toISOString();

        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));

        renderPendingPaymentsTable();
        alert('Payment confirmed successfully.');
    }

    function rejectPayment(id, reason) {
        const payments = readJsonArray(PAYMENTS_STORAGE_KEY);
        const payment = payments.find(p => p.id === id);
        if (!payment) return;

        payment.status = 'Rejected';
        payment.rejectionReason = reason;
        payment.updatedAt = new Date().toISOString();

        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));

        renderPendingPaymentsTable();
        alert('Payment rejected successfully.');
    }

    function confirmAllPayments() {
        const orgId = getCurrentOrgId();
        const payments = readJsonArray(PAYMENTS_STORAGE_KEY);
        const pendingPayments = payments.filter(p => 
            String(p.status || '').toLowerCase() === 'pending verification' &&
                (p.orgId === orgId || (!p.orgId && orgId === 'u-org-001'))
        );

        if (pendingPayments.length === 0) {
            alert('No pending payments to confirm.');
            return;
        }

        const confirmed = window.confirm(`Are you sure you want to confirm all ${pendingPayments.length} pending payments? This action cannot be undone.`);
        if (!confirmed) return;

        pendingPayments.forEach(payment => {
            payment.status = 'Confirmed';
            payment.updatedAt = new Date().toISOString();
        });

        localStorage.setItem(PAYMENTS_STORAGE_KEY, JSON.stringify(payments));

        renderPendingPaymentsTable();
        alert('All pending payments confirmed successfully.');
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
            rejectPayment(pendingRejectionId, reason);
            modal.classList.remove('active');
            pendingRejectionId = null;
        });
    }

    // Initialize page
    document.addEventListener('DOMContentLoaded', function() {
        initializeModal();
        renderPendingPaymentsTable();

        const confirmAllBtn = document.getElementById('confirmAllBtn');
        if (confirmAllBtn) {
            confirmAllBtn.addEventListener('click', confirmAllPayments);
        }
    });

})();
