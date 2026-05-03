// Payment History Module

const PaymentHistory = (() => {
    let paymentHistory = [];
    let currentReceiptList = [];
    let currentPromissoryList = [];
    let currentFilter = 'recent';
    let currentModal = null;

    // Initialize payment history from dashboard payments
    function initializeFromDashboard() {
        // Get current user from Auth or storage
        let currentUser = null;

        if (window.Auth && typeof window.Auth.getUser === 'function') {
            currentUser = window.Auth.getUser();
        }

        // If Auth not ready, try to get from storage
        if (!currentUser) {
            try {
                const authData = localStorage.getItem('ccs.auth.user') || sessionStorage.getItem('ccs.auth.user');
                if (authData) {
                    currentUser = JSON.parse(authData);
                }
            } catch (e) {
                console.warn('Could not parse auth data:', e);
            }
        }

        const studentPayments = window.getStudentPayments
            ? window.getStudentPayments(currentUser && currentUser.studentId ? currentUser.studentId : '')
            : [];

        paymentHistory = studentPayments.map(function (payment) {
            return {
                desc: payment.feeName || payment.desc || 'Payment',
                date: payment.dateSubmitted || payment.date || '',
                amount: payment.amount,
                method: payment.paymentMethod || payment.method || 'Cash',
                referenceNumber: payment.referenceNumber || '',
                orgName: payment.orgName || (payment.orgId === 'org-msa-001' ? 'Muslim Student Association' : 'CCS Student Council'),
                status: payment.status || 'Confirmed',
                rejectionReason: payment.rejectionReason || ''
            };
        });
    }

    function formatDate(date) {
        // date is already a string like "2026-03-01"
        const d = new Date(date + 'T00:00:00');
        return d.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function isRecent(dateStr) {
        const now = new Date();
        const d = new Date(dateStr + 'T00:00:00');
        const diffTime = now - d;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 30; // 30 days
    }

    function groupPaymentsByCategory(payments, filter) {
        let grouped = {};

        payments.forEach(payment => {
            const isRecentPayment = isRecent(payment.date);
            const category = isRecentPayment ? 'recent' : 'old';

            if (filter === 'all' || filter === category) {
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(payment);
            }
        });

        return grouped;
    }

    function buildTable(payments) {
        if (payments.length === 0) {
            currentReceiptList = [];
            return '';
        }

        const sortedPayments = payments.slice().sort((a, b) => new Date(a.date) - new Date(b.date));
        currentReceiptList = sortedPayments;

        let html = `
            <div class="receipt-table-wrapper">
                <table class="receipt-history-table">
                    <thead>
                        <tr>
                            <th>Description</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        // Sort oldest to newest (chronological order)
        sortedPayments.forEach((payment, idx) => {
            const status = String(payment.status || 'Confirmed').toLowerCase();
            const statusBadge = status === 'pending verification'
                ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Verification</span>'
                : status === 'rejected'
                    ? '<span class="receipt-status-badge receipt-status-badge--rejected">Rejected</span>'
                    : '<span class="receipt-status-badge">Confirmed</span>';
            const referenceBlock = payment.referenceNumber ? `<div class="receipt-date">Ref: ${payment.referenceNumber}</div>` : '';
            html += `
                <tr>
                    <td><span class="receipt-num">${payment.desc}</span>${referenceBlock}${payment.orgName ? `<div class="receipt-date">${payment.orgName}</div>` : ''}</td>
                    <td><span class="receipt-date">${payment.date}</span></td>
                    <td><span class="receipt-amount">${payment.amount}</span></td>
                    <td>
                        ${statusBadge}
                        <button class="btn-view-details" onclick="PaymentHistory.viewDetails(${idx})">
                            <i class='bx bx-show'></i> View
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

        return html;
    }

    function getStudentPromissoryNotes() {
        const currentUser = window.Auth && typeof window.Auth.getUser === 'function'
            ? window.Auth.getUser()
            : null;

        if (!currentUser || !currentUser.studentId || !window.getStudentPromissoryRequests) {
            return [];
        }

        const requests = window.getStudentPromissoryRequests(currentUser.studentId);
        const studentReligion = String(currentUser.religion || '').trim().toLowerCase();

        return requests
            .filter(function (request) {
                const feeName = String(request.feeName || '').toLowerCase();
                if (feeName.includes('msa')) {
                    return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
                }
                return true;
            })
            .sort(function (a, b) {
                return new Date(b.createdAt || 0) - new Date(a.createdAt || 0);
            });
    }

    function buildPromissoryTable(requests) {
        currentPromissoryList = requests.slice();

        if (!requests.length) {
            return '<p class="summary-empty" style="padding: 20px; text-align: center;">No promissory notes found.</p>';
        }

        let html = `
            <div class="receipt-table-wrapper">
                <table class="receipt-history-table">
                    <thead>
                        <tr>
                            <th>Fee Name</th>
                            <th>Amount</th>
                            <th>Date Requested</th>
                            <th>Reason</th>
                            <th>Promised Date</th>
                            <th>Status</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        requests.forEach(function (request) {
            const status = String(request.status || 'Pending Review').toLowerCase();
            const statusBadge = status === 'pending review'
                ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Review</span>'
                : status === 'promissory approved'
                    ? '<span class="receipt-status-badge receipt-status-badge--approved">Promissory Approved</span>'
                    : '<span class="receipt-status-badge receipt-status-badge--rejected">Promissory Rejected</span>';

            const amount = request.partialAmount ? `₱${Number(request.partialAmount).toFixed(2)}` : (() => {
                try {
                    const fees = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]');
                    const found = fees.find(function (fee) {
                        return String(fee.id || '') === String(request.feeId || '');
                    }) || fees.find(function (fee) {
                        return String(fee.name || '').toLowerCase() === String(request.feeName || '').toLowerCase();
                    });
                    return found ? `₱${Number(found.amount || 0).toFixed(2)}` : 'Full Payment';
                } catch (_err) {
                    return 'Full Payment';
                }
            })();

            html += `
                <tr>
                    <td><span class="receipt-num">${request.feeName || 'Promissory Note'}</span></td>
                    <td><span class="receipt-amount">${amount}</span></td>
                    <td><span class="receipt-date">${formatDate(request.createdAt || '')}</span></td>
                    <td><span class="promissory-reason" title="${request.reason || ''}">${request.reason || ''}</span></td>
                    <td><span class="receipt-date">${formatDate(request.promisedDate || '')}</span></td>
                    <td>${statusBadge}</td>
                </tr>
            `;
        });

        html += `
                    </tbody>
                </table>
            </div>
        `;

        return html;
    }

    function renderFiltered(filter) {
        const container = document.getElementById('receipt-filter-sections');
        if (!container) return;

        const now = new Date();
        const recentThreshold = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);
        const status = function (payment) {
            return String(payment.status || 'Confirmed').toLowerCase();
        };

        if (filter === 'promissory') {
            container.innerHTML = buildPromissoryTable(getStudentPromissoryNotes());
            return;
        }

        const filtered = paymentHistory.filter(function (payment) {
            const paymentDate = payment.date || '';
            const dateObj = new Date(paymentDate + 'T00:00:00');

            if (filter === 'pending') {
                return status(payment) === 'pending verification';
            }

            if (filter === 'all') {
                return status(payment) === 'confirmed';
            }

            if (status(payment) !== 'confirmed') {
                return false;
            }

            if (filter === 'recent') return dateObj >= recentThreshold;
            if (filter === 'old') return dateObj < recentThreshold;
            return true;
        });

        if (!filtered.length) {
            container.innerHTML = filter === 'pending'
                ? '<div class="receipt-filter-section"><p class="summary-empty">No pending receipts</p></div>'
                : '<div class="receipt-filter-section"><p class="summary-empty">No receipts found</p></div>';
            return;
        }

        container.innerHTML = buildTable(filtered);
    }

    function viewDetails(index) {
        const payment = currentReceiptList[index] || paymentHistory[index];
        if (!payment) return;

        currentModal = payment;

        // Generate detailed receipt info from payment
        const dateObj = new Date(payment.date + 'T00:00:00');
        const amountStr = payment.amount.replace('₱', '').replace(/,/g, '');
        const amount = parseInt(amountStr);
        const receiptId = `WMSU-FO-${dateObj.getFullYear()}-${String(index + 1000).slice(-6)}`;
        const method = String(payment.method || payment.paymentMethod || 'Cash');
        const transactionId = `${method.toUpperCase().slice(0, 3)}-${dateObj.toISOString().slice(0, 10).replace(/-/g, '')}-${String(index).padStart(6, '0')}`;

        const contentHtml = `
            <!-- Receipt Header -->
            <div class="receipt-modal-header-section">
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Receipt Number</span>
                        <span class="receipt-modal-value">${receiptId}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Date</span>
                        <span class="receipt-modal-value">${payment.date}</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Payment Information -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Payment Information</h4>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Payment Method</span>
                        <span class="receipt-modal-value">${method}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Transaction ID</span>
                        <span class="receipt-modal-value receipt-txn-id">${transactionId}</span>
                    </div>
                </div>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Status</span>
                        <span class="receipt-modal-value">${payment.status && String(payment.status).toLowerCase() === 'pending verification'
                    ? '<span class="receipt-status-badge receipt-status-badge--pending">Pending Verification</span>'
                    : String(payment.status || '').toLowerCase() === 'rejected'
                        ? '<span class="receipt-status-badge receipt-status-badge--rejected">Rejected</span>'
                        : '<span class="receipt-status-badge">Confirmed</span>'}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Processed By</span>
                        <span class="receipt-modal-value">Finance Office</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Fee Breakdown -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Fee Breakdown</h4>
                <div class="receipt-fee-list">
                    <div class="receipt-fee-item">
                        <span class="receipt-fee-name">${payment.desc}</span>
                        <span class="receipt-fee-amt">${payment.amount}</span>
                    </div>
                    <div class="receipt-fee-total">
                        <span>Total Amount Paid</span>
                        <span>${payment.amount}</span>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Authenticity & Security -->
            <div class="receipt-modal-section">
                <h4 class="receipt-modal-section-title">Receipt Authenticity</h4>
                <div class="receipt-security-info">
                    <div class="receipt-verified-badge">
                        <i class='bx bx-shield-check'></i>
                        <span>Verified &amp; Approved</span>
                    </div>
                    <p class="receipt-security-text">This receipt has been digitally verified and authenticated by the Finance Office. The transaction ID and receipt number can be used to verify this payment in the official system.</p>
                    <div class="receipt-verification-items">
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Digital signature verified</span>
                        </div>
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Payment gateway confirmed</span>
                        </div>
                        <div class="receipt-verification-item">
                            <i class='bx bx-check-circle'></i>
                            <span>Student record verified</span>
                        </div>
                    </div>
                </div>
            </div>

            <div class="receipt-modal-divider"></div>

            <!-- Footer Notice -->
            <div class="receipt-security-notice">
                <i class='bx bx-info-circle'></i>
                <p>This is an official electronic receipt. For any inquiries or to verify this receipt, please contact the Finance Office.</p>
            </div>
        `;

        document.getElementById('modal-title').textContent = `Receipt ${receiptId}`;
        document.getElementById('receipt-modal-content').innerHTML = contentHtml;
        document.getElementById('receipt-modal').classList.add('show');
    }

    function closeModal() {
        document.getElementById('receipt-modal').classList.remove('show');
        currentModal = null;
    }

    function downloadReceipt() {
        if (currentModal) {
            window.print();
        }
    }

    function filterReceipts(filter) {
        currentFilter = filter;
        renderFiltered(filter);
    }

    function initializePage() {
        initializeFromDashboard();
        const hasPending = paymentHistory.some(function (payment) {
            return String(payment.status || '').toLowerCase() === 'pending verification';
        });
        const defaultFilter = hasPending ? 'pending' : 'all';
        const filterSelect = document.getElementById('receipt-filter-select');
        if (filterSelect) {
            filterSelect.value = defaultFilter;
        }
        renderFiltered(defaultFilter);
    }

    return {
        init: initializePage,
        viewDetails: viewDetails,
        closeModal: closeModal,
        downloadReceipt: downloadReceipt,
        filterReceipts: filterReceipts
    };
})();

// Initialize on DOM ready with delay to ensure all scripts are loaded
document.addEventListener('DOMContentLoaded', () => {
    setTimeout(() => {
        PaymentHistory.init();
    }, 200);
});
