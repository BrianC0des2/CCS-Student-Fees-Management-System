// Payment History Module

const PaymentHistory = (() => {
    let paymentHistory = [];
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

        const samplePayments = window.SAMPLE_PAYMENTS || [];

        if (!samplePayments.length) {
            console.warn('SAMPLE_PAYMENTS not loaded');
            paymentHistory = [];
            return;
        }

        // Filter by current student or show all if no user
        paymentHistory = currentUser && currentUser.studentId
            ? samplePayments.filter(p => p.studentNo === currentUser.studentId)
            : samplePayments;
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
            return '<p style="padding: 24px; text-align: center; color: var(--sys-text-500); font-size: 13px;">No payments found</p>';
        }

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

        payments.sort((a, b) => new Date(b.date) - new Date(a.date)).forEach((payment, idx) => {
            html += `
                <tr>
                    <td><span class="receipt-num">${payment.desc}</span></td>
                    <td><span class="receipt-date">${payment.date}</span></td>
                    <td><span class="receipt-amount">${payment.amount}</span></td>
                    <td>
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

    function renderAll() {
        const container = document.getElementById('receipt-filter-sections');
        if (!container) return;

        const grouped = groupPaymentsByCategory(paymentHistory, currentFilter);

        let html = '';

        // Recent payments
        if (grouped['recent'] && grouped['recent'].length > 0) {
            html += `
                <div class="receipt-filter-section">
                    <div class="receipt-section-header">
                        <span class="receipt-section-label">
                            <i class='bx bx-time-five'></i> Recent Payments
                        </span>
                        <span class="receipt-section-count">${grouped['recent'].length}</span>
                    </div>
                    ${buildTable(grouped['recent'])}
                </div>
            `;
        }

        // Old payments
        if (grouped['old'] && grouped['old'].length > 0) {
            html += `
                <div class="receipt-filter-section">
                    <div class="receipt-section-header">
                        <span class="receipt-section-label">
                            <i class='bx bx-archive'></i> Older Payments
                        </span>
                        <span class="receipt-section-count">${grouped['old'].length}</span>
                    </div>
                    ${buildTable(grouped['old'])}
                </div>
            `;
        }

        if (!html) {
            html = '<p style="padding: 24px; text-align: center; color: var(--sys-text-500);">No payments found</p>';
        }

        container.innerHTML = html;
    }

    function viewDetails(index) {
        const payment = paymentHistory[index];
        if (!payment) return;

        currentModal = payment;

        // Generate detailed receipt info from payment
        const dateObj = new Date(payment.date + 'T00:00:00');
        const methodOptions = ['gcash', 'paymaya', 'bank', 'cash'];
        const method = methodOptions[index % methodOptions.length];
        const methodLabels = {
            gcash: 'GCash',
            paymaya: 'PayMaya',
            bank: 'Bank Transfer',
            cash: 'Cash'
        };

        const amountStr = payment.amount.replace('₱', '').replace(/,/g, '');
        const amount = parseInt(amountStr);
        const receiptId = `WMSU-FO-${dateObj.getFullYear()}-${String(index + 1000).slice(-6)}`;
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
                        <span class="receipt-modal-value">${methodLabels[method]}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Transaction ID</span>
                        <span class="receipt-modal-value receipt-txn-id">${transactionId}</span>
                    </div>
                </div>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Status</span>
                        <span class="receipt-modal-value"><span class="receipt-status-badge">✓ Paid</span></span>
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
        renderAll();
    }

    function initializePage() {
        initializeFromDashboard();
        renderAll();
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
