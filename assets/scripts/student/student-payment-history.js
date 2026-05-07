(function () {
    'use strict';

    // ── Storage Keys ──────────────────────────────────────────────────────────────
    const KEYS = {
        AUTH_USER:           'ccs.auth.user',
        AUTH_OVERRIDES:      'ccs.auth.accountProfileOverrides',
        STUDENT_PAYMENTS:    'ccs.student.payments',
        PROMISSORY_REQUESTS: 'ccs.promissory.requests',
        ACADEMIC_SETTINGS:   'ccs.academic.settings',
    };

    // ── State ─────────────────────────────────────────────────────────────────────
    let currentStudent  = null;
    let allPayments     = [];
    let allPromissory   = [];
    let currentPayment  = null; // for download/modal

    // ── Helpers ───────────────────────────────────────────────────────────────────
    function readJsonArray(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_) { return []; }
    }

    function readJson(key) {
        try { return JSON.parse(localStorage.getItem(key) || 'null'); }
        catch (_) { return null; }
    }

    function formatDate(dateStr) {
        if (!dateStr) return '—';
        try {
            return new Date(dateStr).toLocaleDateString('en-US', {
                year: 'numeric', month: 'short', day: 'numeric'
            });
        } catch (_) { return dateStr; }
    }

    function formatPeso(amount) {
        const num = Number(String(amount || 0).replace(/[₱,]/g, ''));
        return '₱' + (isNaN(num) ? '0.00' : num.toFixed(2));
    }

    function getStudentId() {
        if (!currentStudent) return null;
        return currentStudent.studentId || currentStudent.id || null;
    }

    function getOrgName(orgId) {
        const map = {
            'u-org-001':           'CCS Student Council',
            'org-msa-001':         'Muslim Student Association',
            'org-dean-office-001': "Dean's Office — CCS",
        };
        return map[orgId] || orgId || 'Organization';
    }

    // ── Auth Guard ────────────────────────────────────────────────────────────────
    function guardAuth() {
        const user = readJson(KEYS.AUTH_USER);
        if (!user || user.role !== 'student') {
            window.location.href = '/index.html';
            return false;
        }
        currentStudent = user;
        const overrides = readJson(KEYS.AUTH_OVERRIDES) || {};
        const sid = user.studentId || user.id;
        if (sid && overrides[sid]) {
            currentStudent = Object.assign({}, currentStudent, overrides[sid]);
        }
        return true;
    }

    // ── Load Data ─────────────────────────────────────────────────────────────────
    function loadData() {
        const sid = getStudentId();
        if (!sid) return;
        const payments   = readJsonArray(KEYS.STUDENT_PAYMENTS);
        const promissory = readJsonArray(KEYS.PROMISSORY_REQUESTS);
        allPayments   = payments.filter(p => p.studentId === sid);
        allPromissory = promissory.filter(p => p.studentId === sid);
    }

    // ── Filter Logic ──────────────────────────────────────────────────────────────
    function getFilteredPayments(filter) {
        const now       = new Date();
        const thirtyAgo = new Date();
        thirtyAgo.setDate(now.getDate() - 30);

        let result = allPayments;
        switch (filter) {
            case 'recent':
                result = allPayments.filter(p => new Date(p.dateSubmitted || p.date || '') >= thirtyAgo);
                break;
            case 'pending':
                result = allPayments.filter(p => String(p.status || '').toLowerCase() === 'pending verification');
                break;
            case 'old':
                result = allPayments.filter(p => new Date(p.dateSubmitted || p.date || '') < thirtyAgo);
                break;
            default:
                result = allPayments;
        }

        return result.slice().sort((a, b) =>
            new Date(b.dateSubmitted || b.date || 0) - new Date(a.dateSubmitted || a.date || 0)
        );
    }

    // ── Status Badge HTML ─────────────────────────────────────────────────────────
    function statusBadge(status) {
        const s = String(status || '').toLowerCase();
        if (s === 'confirmed')            return '<span class="receipt-status-badge badge-confirmed">Confirmed</span>';
        if (s === 'pending verification') return '<span class="receipt-status-badge badge-pending">Pending Verification</span>';
        if (s === 'rejected')             return '<span class="receipt-status-badge badge-rejected">Rejected</span>';
        return `<span class="receipt-status-badge badge-pending">${status}</span>`;
    }

    function promissoryStatusBadge(status) {
        const s = String(status || '').toLowerCase();
        if (s === 'promissory approved') return '<span class="receipt-status-badge badge-confirmed">Approved</span>';
        if (s === 'pending review')      return '<span class="receipt-status-badge badge-promissory">Pending Review</span>';
        if (s === 'promissory rejected') return '<span class="receipt-status-badge badge-rejected">Rejected</span>';
        return `<span class="receipt-status-badge badge-pending">${status}</span>`;
    }

    // ── Render Payments ───────────────────────────────────────────────────────────
    function renderPayments(filter) {
        const container = document.getElementById('receipt-filter-sections');
        if (!container) return;

        const data = getFilteredPayments(filter);

        if (data.length === 0) {
            container.innerHTML = `
                <div class="receipt-empty-state">
                    <i class='bx bx-receipt' style="font-size:2.5rem; color:var(--sys-text-300);"></i>
                    <p>No payment records found.</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Reference No.</th>
                        <th>Fee</th>
                        <th>Amount</th>
                        <th>Method</th>
                        <th>Date</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(p => `
                        <tr>
                            <td data-label="Reference No.">${p.referenceNumber || '—'}</td>
                            <td data-label="Fee">${p.feeName || p.desc || '—'}</td>
                            <td data-label="Amount">${formatPeso(p.amount)}</td>
                            <td data-label="Method">${p.paymentMethod || p.method || '—'}</td>
                            <td data-label="Date">${formatDate(p.dateSubmitted || p.date)}</td>
                            <td data-label="Status">${statusBadge(p.status)}</td>
                            <td data-label="Actions">
                                ${String(p.status || '').toLowerCase() === 'confirmed'
                                    ? `<button class="receipt-view-btn" data-id="${p.id}">View Receipt</button>`
                                    : '—'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        container.querySelectorAll('.receipt-view-btn').forEach(btn => {
            btn.addEventListener('click', function () {
                const payment = allPayments.find(p => p.id === this.dataset.id);
                if (payment) openReceiptModal(payment);
            });
        });
    }

    // ── Render Promissory ─────────────────────────────────────────────────────────
    function renderPromissory() {
        const container = document.getElementById('receipt-filter-sections');
        if (!container) return;

        const data = allPromissory.slice().sort((a, b) =>
            new Date(b.createdAt || b.updatedAt || 0) - new Date(a.createdAt || a.updatedAt || 0)
        );

        if (data.length === 0) {
            container.innerHTML = `
                <div class="receipt-empty-state">
                    <i class='bx bx-note' style="font-size:2.5rem; color:var(--sys-text-300);"></i>
                    <p>No promissory notes found.</p>
                </div>`;
            return;
        }

        container.innerHTML = `
            <table class="receipt-table">
                <thead>
                    <tr>
                        <th>Fee</th>
                        <th>Amount</th>
                        <th>Reason</th>
                        <th>Promised Date</th>
                        <th>Date Requested</th>
                        <th>Status</th>
                        <th>Actions</th>
                    </tr>
                </thead>
                <tbody>
                    ${data.map(p => `
                        <tr>
                            <td data-label="Fee">${p.feeName || '—'}</td>
                            <td data-label="Amount">${formatPeso(p.amount)}</td>
                            <td data-label="Reason">${p.reason || '—'}</td>
                            <td data-label="Promised Date">${formatDate(p.promisedDate)}</td>
                            <td data-label="Date Requested">${formatDate(p.dateRequested || p.createdAt)}</td>
                            <td data-label="Status">${promissoryStatusBadge(p.status)}</td>
                            <td data-label="Actions">
                                ${String(p.status || '').toLowerCase() === 'promissory rejected' && p.rejectionReason
                                    ? `<button class="receipt-view-btn" data-reason="${encodeURIComponent(p.rejectionReason || '')}">See Reason</button>`
                                    : '—'
                                }
                            </td>
                        </tr>
                    `).join('')}
                </tbody>
            </table>`;

        container.querySelectorAll('.receipt-view-btn[data-reason]').forEach(btn => {
            btn.addEventListener('click', function () {
                showRejectionReason(decodeURIComponent(this.dataset.reason));
            });
        });
    }

    // ── Receipt Modal ─────────────────────────────────────────────────────────────
    function openReceiptModal(payment) {
        currentPayment = payment;

        const modalTitle   = document.getElementById('modal-title');
        const modalContent = document.getElementById('receipt-modal-content');
        const modal        = document.getElementById('receipt-modal');

        if (modalTitle) modalTitle.textContent = 'Receipt Details';

        if (modalContent) {
            modalContent.innerHTML = `
                <div class="receipt-detail-grid">
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Reference No.</span>
                        <span class="receipt-detail-value">${payment.referenceNumber || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Student Name</span>
                        <span class="receipt-detail-value">${payment.studentName || (currentStudent && currentStudent.name) || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Student ID</span>
                        <span class="receipt-detail-value">${payment.studentId || getStudentId() || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Fee</span>
                        <span class="receipt-detail-value">${payment.feeName || payment.desc || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Amount</span>
                        <span class="receipt-detail-value">${formatPeso(payment.amount)}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Payment Method</span>
                        <span class="receipt-detail-value">${payment.paymentMethod || payment.method || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Date</span>
                        <span class="receipt-detail-value">${formatDate(payment.dateSubmitted || payment.date)}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Reference No.</span>
                        <span class="receipt-detail-value">${payment.gcashRef || payment.bankRef || payment.referenceNumber || '—'}</span>
                    </div>
                    <div class="receipt-detail-row">
                        <span class="receipt-detail-label">Status</span>
                        <span class="receipt-detail-value">${statusBadge(payment.status)}</span>
                    </div>
                </div>
                <div class="receipt-modal-footer">
                    Verified and confirmed by ${getOrgName(payment.orgId)}
                </div>`;
        }

        if (modal) modal.style.display = 'flex';
    }

    function showRejectionReason(reason) {
        const modalTitle   = document.getElementById('modal-title');
        const modalContent = document.getElementById('receipt-modal-content');
        const modal        = document.getElementById('receipt-modal');

        if (modalTitle)   modalTitle.textContent = 'Rejection Reason';
        if (modalContent) modalContent.innerHTML = `
            <div class="receipt-rejection-reason">
                <i class='bx bx-error-circle' style="font-size:2rem; color:#dc2626;"></i>
                <p>${reason || 'No reason provided.'}</p>
            </div>`;

        if (modal) modal.style.display = 'flex';
    }

    // ── Public API (called from HTML inline handlers) ──────────────────────────────
    window.PaymentHistory = {
        filterReceipts: function (value) {
            if (value === 'promissory') {
                renderPromissory();
            } else {
                renderPayments(value);
            }
        },
        closeModal: function () {
            const modal = document.getElementById('receipt-modal');
            if (modal) modal.style.display = 'none';
            currentPayment = null;
        },
        downloadReceipt: function () {
            if (!currentPayment) return;
            const p = currentPayment;
            const lines = [
                'PAY++ PAYMENT RECEIPT',
                '======================',
                'Reference No. : ' + (p.referenceNumber || '—'),
                'Student Name  : ' + (p.studentName || (currentStudent && currentStudent.name) || '—'),
                'Student ID    : ' + (p.studentId || getStudentId() || '—'),
                'Fee           : ' + (p.feeName || p.desc || '—'),
                'Amount        : ' + formatPeso(p.amount),
                'Method        : ' + (p.paymentMethod || p.method || '—'),
                'Date          : ' + formatDate(p.dateSubmitted || p.date),
                'Status        : Confirmed',
                '======================',
                'Verified and confirmed by ' + getOrgName(p.orgId),
            ].join('\n');

            const blob = new Blob([lines], { type: 'text/plain' });
            const url  = URL.createObjectURL(blob);
            const a    = document.createElement('a');
            a.href     = url;
            a.download = 'receipt-' + (p.referenceNumber || p.id || 'download') + '.txt';
            a.click();
            URL.revokeObjectURL(url);
        }
    };

    // ── Close modal on overlay click (backup for inline handler) ──────────────────
    document.addEventListener('DOMContentLoaded', function () {
        if (!guardAuth()) return;
        loadData();

        // Default render
        renderPayments('all');

        // Close modal on overlay click
        const modal = document.getElementById('receipt-modal');
        if (modal) {
            modal.addEventListener('click', function (e) {
                if (e.target === this) window.PaymentHistory.closeModal();
            });
        }
    });

})();