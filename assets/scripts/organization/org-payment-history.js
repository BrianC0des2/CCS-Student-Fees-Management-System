(function () {
    function getOrgScope() {
        if (window.CCSAuthHelpers && typeof window.CCSAuthHelpers.getCurrentOrganizationScope === 'function') {
            return window.CCSAuthHelpers.getCurrentOrganizationScope();
        }
        return null;
    }

    function getCurrentOrgId() {
        const scope = getOrgScope();
        return scope && scope.orgId ? scope.orgId : 'u-org-001';
    }

    function getCurrentOrgName() {
        const scope = getOrgScope();
        return scope && scope.organization ? scope.organization : 'CCS Student Council';
    }

    function initializePageForOrg() {
        const orgHeaderName = document.getElementById('paymentHistoryOrgName');
        if (orgHeaderName) {
            orgHeaderName.textContent = getCurrentOrgName();
        }
    }

    function parsePeso(value) {
        return Number(String(value || '0').replace(/[^\d.-]/g, '')) || 0;
    }

    function getStudentProfile(studentId) {
        const accounts = window.SAMPLE_ACCOUNTS || [];
        return accounts.find(function (a) {
            return String(a.studentId || '') === String(studentId || '');
        }) || null;
    }

    function formatPeso(value) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function showReceiptModal(payment) {
        const existing = document.getElementById('org-receipt-modal-root');
        if (existing) existing.remove();

        const root = document.createElement('div');
        root.id = 'org-receipt-modal-root';
        root.innerHTML = `
            <div style="position:fixed;inset:0;background:rgba(0,0,0,0.5);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
                <div style="background:white;border-radius:12px;width:min(560px,100%);max-height:90vh;overflow-y:auto;padding:24px;font-family:Poppins,sans-serif;">
                    <div style="display:flex;justify-content:space-between;align-items:center;margin-bottom:20px;">
                        <div style="font-size:16px;font-weight:600;">Receipt ${payment.referenceNumber || payment.id}</div>
                        <button id="close-receipt-modal" style="background:none;border:none;font-size:20px;cursor:pointer;">×</button>
                    </div>
                    <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;font-size:13px;">
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Student Name</div><div style="font-weight:500;margin-top:4px;">${payment.studentName || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Student ID</div><div style="font-weight:500;margin-top:4px;">${payment.studentId || payment.studentNo || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Fee</div><div style="font-weight:500;margin-top:4px;">${payment.feeName || payment.desc || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Amount</div><div style="font-weight:500;margin-top:4px;">${formatPeso(parsePeso(payment.amount))}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Payment Method</div><div style="font-weight:500;margin-top:4px;">${payment.paymentMethod || payment.method || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Date</div><div style="font-weight:500;margin-top:4px;">${payment.date || payment.dateSubmitted || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Reference No.</div><div style="font-weight:500;margin-top:4px;">${payment.referenceNumber || '-'}</div></div>
                        <div><div style="color:#6b7280;font-size:11px;text-transform:uppercase;">Status</div><div style="margin-top:4px;"><span style="background:#dcfce7;color:#16a34a;padding:2px 8px;border-radius:999px;font-size:11px;font-weight:600;">Confirmed</span></div></div>
                    </div>
                    <div style="margin-top:20px;padding:12px;background:#f0fdf4;border-radius:8px;font-size:12px;color:#16a34a;font-weight:500;text-align:center;">
                        Verified and confirmed by ${getCurrentOrgName()}
                    </div>
                </div>
            </div>
        `;
        document.body.appendChild(root);
        document.getElementById('close-receipt-modal').addEventListener('click', () => root.remove());
        root.querySelector('div').addEventListener('click', function (e) {
            if (e.target === this) root.remove();
        });
    }

    function renderPaymentHistoryRows() {
        const tbody = document.getElementById('orgPaymentHistoryBody');
        if (!tbody) return;

        const currentOrgId = getCurrentOrgId();

        const confirmedPayments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]')
            .filter(function (p) {
                return String(p.orgId) === String(currentOrgId) &&
                       String(p.status).toLowerCase() === 'confirmed';
            })
            .sort(function (a, b) {
                return new Date(b.date || b.dateSubmitted || b.updatedAt || 0) -
                       new Date(a.date || a.dateSubmitted || a.updatedAt || 0);
            });

        let schoolYear = '-';
        let semester = '-';
        try {
            const settings = JSON.parse(localStorage.getItem('ccs.academic.settings') || '{}');
            if (settings.academicYear) schoolYear = settings.academicYear;
            if (settings.semester) semester = settings.semester;
        } catch (e) {}

        if (!confirmedPayments.length) {
            tbody.innerHTML = '<tr><td colspan="10" style="text-align:center;padding:20px;color:#6b7280;">No confirmed payments found.</td></tr>';
            return;
        }

        tbody.innerHTML = confirmedPayments.map(function (p) {
            const amount = parsePeso(p.amount).toFixed(2);
            const date = p.date || p.dateSubmitted || '-';
            const profile = getStudentProfile(p.studentId || p.studentNo);
            const course = profile ? (profile.course || '-') : '-';
            const yearSection = profile ? [profile.year, profile.section].filter(Boolean).join(', ') || '-' : '-';

            return `
                <tr>
                    <td>${p.studentId || p.studentNo || '-'}</td>
                    <td>${p.studentName || '-'}</td>
                    <td>${course}</td>
                    <td>${yearSection}</td>
                    <td>${schoolYear}</td>
                    <td>${semester}</td>
                    <td>${p.feeName || p.desc || '-'}</td>
                    <td>₱${amount}</td>
                    <td>${p.paymentMethod || p.method || '-'}</td>
                    <td>${date}</td>
                    <td><button class="action-btn view-details-btn" data-payment-id="${p.id || ''}">View Details</button></td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.view-details-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const paymentId = btn.dataset.paymentId;
                const payments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]');
                const payment = payments.find(function (p) { return String(p.id || '') === String(paymentId); });
                if (!payment) return;
                showReceiptModal(payment);
            });
        });
    }

    renderPaymentHistoryRows();
    initializePageForOrg();
})();


(function () {
    const PROMISSORY_STORAGE_KEY = 'ccs.promissory.requests';

    function readRequests() {
        try {
            const parsed = JSON.parse(localStorage.getItem(PROMISSORY_STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function saveRequests(requests) {
        localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));
    }

    function formatDate(value) {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            year: 'numeric'
        });
    }

    function formatAmount(value) {
        if (value === null || value === undefined || value === '') return '-';
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(value) || 0);
    }

    function statusClass(status) {
        if (status === 'Promissory Approved') return 'approved';
        if (status === 'Promissory Rejected') return 'rejected';
        return 'pending';
    }

    function updateRequestStatus(requestId, status) {
        const updated = readRequests().map(function (request) {
            if (request.id !== requestId) return request;
            return {
                ...request,
                status: status,
                updatedAt: new Date().toISOString()
            };
        });

        saveRequests(updated);
        renderPromissoryTable();
    }

    function renderPromissoryTable() {
        const body = document.getElementById('promissoryTableBody');
        const counter = document.getElementById('promissoryPendingCounter');
        const requests = readRequests().sort(function (a, b) {
            return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0);
        });

        const pendingCount = requests.filter(function (request) {
            return request.status === 'Pending Review';
        }).length;

        if (counter) counter.textContent = `${pendingCount} Pending`;

        if (!body) return;

        if (!requests.length) {
            body.innerHTML = '<tr><td colspan="7" class="promissory-empty">No promissory note requests submitted yet.</td></tr>';
            return;
        }

        body.innerHTML = requests.map(function (request) {
            const canReview = request.status === 'Pending Review';
            return `
                <tr>
                    <td>${request.studentName || '-'}</td>
                    <td>${request.studentNumber || '-'}</td>
                    <td>${request.feeName || '-'}</td>
                    <td>${request.reason || '-'}</td>
                    <td>${formatDate(request.promisedDate)}</td>
                    <td>${formatDate(request.createdAt)}</td>
                    <td><span class="promissory-status ${statusClass(request.status)}">${request.status || 'Pending Review'}</span></td>
                    <td>
                        <div class="promissory-actions">
                            <button type="button" class="approve-btn" data-action="approve" data-id="${request.id}" ${canReview ? '' : 'disabled'}>Approve</button>
                            <button type="button" class="reject-btn" data-action="reject" data-id="${request.id}" ${canReview ? '' : 'disabled'}>Reject</button>
                        </div>
                    </td>
                </tr>
            `;
        }).join('');

        body.querySelectorAll('button[data-action="approve"]').forEach(function (button) {
            button.addEventListener('click', function () {
                updateRequestStatus(button.dataset.id, 'Promissory Approved');
            });
        });

        body.querySelectorAll('button[data-action="reject"]').forEach(function (button) {
            button.addEventListener('click', function () {
                updateRequestStatus(button.dataset.id, 'Promissory Rejected');
            });
        });
    }

    renderPromissoryTable();
})();
