// Payment History Module

const PaymentHistory = (() => {
    // Sample payment history data
    const paymentHistory = [
        {
            id: 'WMSU-FO-2026-001235',
            date: new Date(2026, 1, 5, 14, 30),
            amount: 8500,
            method: 'gcash',
            transactionId: 'GCSH-20260205-123456',
            fees: [
                { fee: 'Tuition Fee', price: 5000 },
                { fee: 'Laboratory Fee', price: 2000 },
                { fee: 'Technology Fee', price: 1500 }
            ],
            status: 'Paid'
        },
        {
            id: 'WMSU-FO-2025-001089',
            date: new Date(2025, 10, 15, 10, 15),
            amount: 9200,
            method: 'paymaya',
            transactionId: 'PMY-20251115-789456',
            fees: [
                { fee: 'Tuition Fee', price: 5500 },
                { fee: 'Laboratory Fee', price: 2000 },
                { fee: 'Facility Fee', price: 1700 }
            ],
            status: 'Paid'
        },
        {
            id: 'WMSU-FO-2025-000956',
            date: new Date(2025, 7, 20, 9, 45),
            amount: 8500,
            method: 'bank',
            transactionId: 'BNK-20250820-654321',
            fees: [
                { fee: 'Tuition Fee', price: 5000 },
                { fee: 'Laboratory Fee', price: 2000 },
                { fee: 'Technology Fee', price: 1500 }
            ],
            status: 'Paid'
        },
        {
            id: 'WMSU-FO-2025-000654',
            date: new Date(2025, 5, 10, 15, 20),
            amount: 12000,
            method: 'gcash',
            transactionId: 'GCSH-20250610-456789',
            fees: [
                { fee: 'Tuition Fee', price: 7000 },
                { fee: 'Laboratory Fee', price: 2500 },
                { fee: 'Library Card Renewal', price: 500 },
                { fee: 'Miscellaneous Fee', price: 2000 }
            ],
            status: 'Paid'
        },
        {
            id: 'WMSU-FO-2025-000423',
            date: new Date(2025, 2, 15, 11, 30),
            amount: 8200,
            method: 'paymaya',
            transactionId: 'PMY-20250315-123789',
            fees: [
                { fee: 'Tuition Fee', price: 5000 },
                { fee: 'Laboratory Fee', price: 2000 },
                { fee: 'Technology Fee', price: 1200 }
            ],
            status: 'Paid'
        },
        {
            id: 'WMSU-FO-2024-002145',
            date: new Date(2024, 11, 5, 13, 45),
            amount: 9500,
            method: 'bank',
            transactionId: 'BNK-20241205-987654',
            fees: [
                { fee: 'Tuition Fee', price: 5500 },
                { fee: 'Laboratory Fee', price: 2500 },
                { fee: 'Facility Fee', price: 1500 }
            ],
            status: 'Paid'
        }
    ];

    let currentFilter = 'recent';
    let currentModal = null;

    const methodLabels = {
        gcash: 'GCash',
        paymaya: 'PayMaya',
        bank: 'Bank Transfer',
        cash: 'Cash'
    };

    function formatDate(date) {
        return date.toLocaleDateString('en-US', {
            year: 'numeric',
            month: 'short',
            day: 'numeric'
        });
    }

    function formatCurrency(amount) {
        return '₱' + amount.toLocaleString();
    }

    function isRecent(date) {
        const now = new Date();
        const diffTime = now - date;
        const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
        return diffDays <= 90; // 3 months
    }

    function groupReceiptsByCategory(receipts, filter) {
        let grouped = {};

        receipts.forEach(receipt => {
            const isRecentReceipt = isRecent(receipt.date);
            const category = isRecentReceipt ? 'recent' : 'old';

            if (filter === 'all' || filter === category) {
                if (!grouped[category]) {
                    grouped[category] = [];
                }
                grouped[category].push(receipt);
            }
        });

        return grouped;
    }

    function buildTable(receipts) {
        if (receipts.length === 0) {
            return '<p style="padding: 24px; text-align: center; color: var(--sys-text-500); font-size: 13px;">No receipts found</p>';
        }

        let html = `
            <div class="receipt-table-wrapper">
                <table class="receipt-history-table">
                    <thead>
                        <tr>
                            <th>Receipt #</th>
                            <th>Date</th>
                            <th>Amount</th>
                            <th>Method</th>
                            <th>Status</th>
                            <th>Action</th>
                        </tr>
                    </thead>
                    <tbody>
        `;

        receipts.sort((a, b) => b.date - a.date).forEach(receipt => {
            html += `
                <tr>
                    <td><span class="receipt-num">${receipt.id}</span></td>
                    <td><span class="receipt-date">${formatDate(receipt.date)}</span></td>
                    <td><span class="receipt-amount">${formatCurrency(receipt.amount)}</span></td>
                    <td><span class="receipt-method-badge"><i class='bx bx-wallet'></i> ${methodLabels[receipt.method]}</span></td>
                    <td>
                        <span class="receipt-status-cell">
                            <span class="receipt-status-dot"></span>
                            <span class="receipt-status-text">${receipt.status}</span>
                        </span>
                    </td>
                    <td>
                        <button class="btn-view-details" onclick="PaymentHistory.viewDetails('${receipt.id}')">
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
        const grouped = groupReceiptsByCategory(paymentHistory, currentFilter);

        let html = '';

        // Recent receipts
        if (grouped['recent']) {
            html += `
                <div class="receipt-filter-section">
                    <div class="receipt-section-header">
                        <span class="receipt-section-label">
                            <i class='bx bx-time-five'></i> Recent Receipts
                        </span>
                        <span class="receipt-section-count">${grouped['recent'].length}</span>
                    </div>
                    ${buildTable(grouped['recent'])}
                </div>
            `;
        }

        // Old receipts
        if (grouped['old']) {
            html += `
                <div class="receipt-filter-section">
                    <div class="receipt-section-header">
                        <span class="receipt-section-label">
                            <i class='bx bx-archive'></i> Older Receipts
                        </span>
                        <span class="receipt-section-count">${grouped['old'].length}</span>
                    </div>
                    ${buildTable(grouped['old'])}
                </div>
            `;
        }

        if (!html) {
            html = '<p style="padding: 24px; text-align: center; color: var(--sys-text-500);">No receipts found</p>';
        }

        container.innerHTML = html;
    }

    function viewDetails(receiptId) {
        const receipt = paymentHistory.find(r => r.id === receiptId);
        if (!receipt) return;

        currentModal = receipt;

        const feeHtml = receipt.fees.map(f => `
            <div class="receipt-fee-item">
                <span class="receipt-fee-name">${f.fee}</span>
                <span class="receipt-fee-amt">${formatCurrency(f.price)}</span>
            </div>
        `).join('');

        const contentHtml = `
            <!-- Receipt Header -->
            <div class="receipt-modal-header-section">
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Receipt Number</span>
                        <span class="receipt-modal-value">${receipt.id}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Date &amp; Time</span>
                        <span class="receipt-modal-value">${formatDate(receipt.date)}</span>
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
                        <span class="receipt-modal-value">${methodLabels[receipt.method]}</span>
                    </div>
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Transaction ID</span>
                        <span class="receipt-modal-value receipt-txn-id">${receipt.transactionId}</span>
                    </div>
                </div>
                <div class="receipt-modal-row">
                    <div class="receipt-modal-item">
                        <span class="receipt-modal-label">Status</span>
                        <span class="receipt-modal-value"><span class="receipt-status-badge">✓ ${receipt.status}</span></span>
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
                    ${feeHtml}
                    <div class="receipt-fee-total">
                        <span>Total Amount Paid</span>
                        <span>${formatCurrency(receipt.amount)}</span>
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

        document.getElementById('modal-title').textContent = `Receipt ${receipt.id}`;
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

// Initialize on DOM ready
document.addEventListener('DOMContentLoaded', PaymentHistory.init);

