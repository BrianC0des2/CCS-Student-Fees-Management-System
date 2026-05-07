(function () {
    const FEES_STORAGE_KEY = 'ccs.organization.fees';
    const PROFILE_OVERRIDES_KEY = 'ccs.auth.accountProfileOverrides';

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

    function initializePageForOrg() {
        const orgId = getCurrentOrgId();
        const dashboardTitle = orgId === 'org-msa-001'
            ? 'Muslim Student Association Dashboard'
            : orgId === 'org-dean-office-001'
                ? "Dean's Office Dashboard"
                : 'CCS Student Council Dashboard';
        const headerElement = document.querySelector('.dashboard-title');
        if (headerElement) {
            headerElement.textContent = dashboardTitle;
        }
    }

    function readJson(value, fallback) {
        try {
            const parsed = JSON.parse(value);
            return parsed === null || parsed === undefined ? fallback : parsed;
        } catch (_err) {
            return fallback;
        }
    }

    function defaultFees() {
        return [
            { id: 'fee-default-csc', name: 'CSC Fee', amount: 200, appliesTo: 'all', isActive: true, orgId: 'u-org-001' },
            { id: 'fee-default-misc', name: 'Miscellaneous fee', amount: 60, appliesTo: 'all', isActive: true, orgId: 'org-dean-office-001' },
            { id: 'fee-default-msa', name: 'MSA Fee', amount: 50, appliesTo: 'Muslim', isActive: true, orgId: 'org-msa-001' },
            { id: 'fee-default-insurance', name: 'Insurance (Whole Year)', amount: 100, appliesTo: 'all', isActive: true, orgId: 'u-org-001' }
        ];
    }

    function normalizeAppliesToValue(appliesTo, specificReligion) {
        const normalized = String(appliesTo || 'all').trim().toLowerCase();
        if (normalized === 'muslim' || normalized === 'muslim/islam') return 'muslim';
        if (normalized === 'catholic' || normalized === 'roman catholic') return 'catholic';
        if (normalized === 'specific') {
            const value = String(specificReligion || '').trim().toLowerCase();
            return value || 'all';
        }
        return normalized || 'all';
    }

    function getSelectedFee() {
        const savedFees = readJson(localStorage.getItem(FEES_STORAGE_KEY), []);
        const fees = (Array.isArray(savedFees) && savedFees.length ? savedFees : defaultFees()).filter(function (fee) {
            return String(fee.orgId || 'u-org-001') === String(getCurrentOrgId());
        });

        const params = new URLSearchParams(window.location.search);
        const feeIdFromQuery = params.get('feeId');
        const feeIdFromStorage = localStorage.getItem('ccs.organization.selectedFeeId') || localStorage.getItem('ccs.organization.activeFeeId');
        const selectedFeeId = feeIdFromQuery || feeIdFromStorage;

        if (selectedFeeId) {
            const matched = fees.find(function (fee) { return fee.id === selectedFeeId; });
            if (matched) return matched;
        }

        const feeNameFromQuery = params.get('feeName');
        const feeNameFromStorage = localStorage.getItem('ccs.organization.selectedFeeName') || localStorage.getItem('ccs.organization.activeFeeName');
        const selectedFeeName = (feeNameFromQuery || feeNameFromStorage || '').trim().toLowerCase();
        if (selectedFeeName) {
            const matchedByName = fees.find(function (fee) {
                return String(fee.name || '').trim().toLowerCase() === selectedFeeName;
            });
            if (matchedByName) return matchedByName;
        }

        const selectedFeeRaw = readJson(localStorage.getItem('ccs.organization.selectedFee'), null);
        if (selectedFeeRaw && typeof selectedFeeRaw === 'object' && String(selectedFeeRaw.orgId || 'u-org-001') === String(getCurrentOrgId())) {
            return selectedFeeRaw;
        }

        return fees.find(function (fee) { return fee.isActive !== false; }) || fees[0] || { name: 'Selected Fee', amount: 0, appliesTo: 'all' };
    }

    function parsePeso(value) {
        return Number(String(value || '0').replace(/[^\d.-]/g, '')) || 0;
    }

    function formatPeso(value) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP',
            minimumFractionDigits: 2,
            maximumFractionDigits: 2
        }).format(Number(value) || 0);
    }

    function normalizeReligion(value) {
        return String(value || '').trim().toLowerCase();
    }

    function studentMatchesFee(studentReligion, fee) {
        const appliesTo = normalizeAppliesToValue(fee.appliesTo, fee.specificReligion);
        if (appliesTo === 'all') return true;

        const religion = normalizeReligion(studentReligion);
        if (!religion) return false;

        if (appliesTo === 'muslim') {
            return religion === 'muslim/islam' || religion === 'muslim';
        }
        if (appliesTo === 'catholic') {
            return religion === 'roman catholic' || religion === 'catholic';
        }

        return religion === appliesTo;
    }

    // ── FIX 1: Receipt modal ────────────────────────────────────────────────────

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

    // ── FIX 2: Student records table reads from ccs.student.payments ────────────

    function renderOrgStudentRows() {
        const tbody = document.getElementById('orgStudentRecordsBody');
        if (!tbody) return;

        const currentOrgId = getCurrentOrgId();
        const allPayments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]')
            .filter(p => String(p.orgId) === String(currentOrgId));

        const studentMap = new Map();
        allPayments.forEach(function (p) {
            const sid = String(p.studentId || p.studentNo || '');
            if (!sid) return;
            if (!studentMap.has(sid)) {
                studentMap.set(sid, {
                    studentId: sid,
                    name: p.studentName || '-',
                    yearSection: p.yearSection || '-',
                    payments: []
                });
            }
            studentMap.get(sid).payments.push(p);
        });

        if (studentMap.size === 0) {
            tbody.innerHTML = '<tr><td colspan="9" style="text-align:center;padding:20px;color:#6b7280;">No student payment records found.</td></tr>';
            return;
        }

        const allFees = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]')
            .filter(f => String(f.orgId) === String(currentOrgId) && f.isActive !== false);
        const totalDue = allFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

        tbody.innerHTML = Array.from(studentMap.values()).map(function (student) {
            const confirmed = student.payments.filter(p => String(p.status).toLowerCase() === 'confirmed');
            const pending   = student.payments.filter(p => String(p.status).toLowerCase() === 'pending verification');
            const amountPaid = confirmed.reduce((sum, p) => sum + parsePeso(p.amount), 0);
            const lastConfirmed = confirmed.slice().sort((a, b) =>
                new Date(b.date || b.dateSubmitted || 0) - new Date(a.date || a.dateSubmitted || 0)
            )[0];

            let status, statusClass, actionBtn;

            if (amountPaid >= totalDue && totalDue > 0) {
                status = 'Fully Paid';
                statusClass = 'fully-paid';
                actionBtn = `<button class="action-btn view-details-btn" data-student-id="${student.studentId}">View Details</button>`;
            } else if (pending.length > 0) {
                status = 'Pending';
                statusClass = 'pending';
                const pendingPayment = pending[0];
                actionBtn = `
                    <button class="action-btn confirm-btn" data-payment-id="${pendingPayment.id}" style="background:#16a34a;color:white;margin-right:4px;">Confirm</button>
                    <button class="action-btn reject-btn" data-payment-id="${pendingPayment.id}" style="background:#dc2626;color:white;">Reject</button>
                `;
            } else if (amountPaid > 0) {
                status = 'Partial';
                statusClass = 'pending';
                actionBtn = `<button class="action-btn view-details-btn" data-student-id="${student.studentId}">View Details</button>`;
            } else {
                status = 'Unpaid';
                statusClass = 'unpaid';
                actionBtn = '-';
            }

            return `
                <tr>
                    <td>${student.studentId}</td>
                    <td>${student.name}</td>
                    <td>${student.yearSection}</td>
                    <td>${formatPeso(amountPaid)}</td>
                    <td>${formatPeso(totalDue)}</td>
                    <td><span class="status ${statusClass}">${status}</span></td>
                    <td>${lastConfirmed ? (lastConfirmed.date || lastConfirmed.dateSubmitted || '-') : '-'}</td>
                    <td>${lastConfirmed ? (lastConfirmed.paymentMethod || lastConfirmed.method || '-') : '-'}</td>
                    <td>${actionBtn}</td>
                </tr>
            `;
        }).join('');

        tbody.querySelectorAll('.confirm-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const payments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]');
                const payment  = payments.find(p => p.id === btn.dataset.paymentId);
                if (!payment) return;
                payment.status    = 'Confirmed';
                payment.updatedAt = new Date().toISOString();
                localStorage.setItem('ccs.student.payments', JSON.stringify(payments));
                renderDashboard();
            });
        });

        tbody.querySelectorAll('.reject-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const reason = prompt('Enter rejection reason:');
                if (!reason) return;
                const payments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]');
                const payment  = payments.find(p => p.id === btn.dataset.paymentId);
                if (!payment) return;
                payment.status          = 'Rejected';
                payment.rejectionReason = reason;
                payment.updatedAt       = new Date().toISOString();
                localStorage.setItem('ccs.student.payments', JSON.stringify(payments));
                renderDashboard();
            });
        });

        tbody.querySelectorAll('.view-details-btn').forEach(function (btn) {
            btn.addEventListener('click', function () {
                const studentId = btn.dataset.studentId;
                const payments  = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]')
                    .filter(p =>
                        String(p.studentId || p.studentNo) === String(studentId) &&
                        String(p.orgId) === String(currentOrgId) &&
                        String(p.status).toLowerCase() === 'confirmed'
                    )
                    .sort((a, b) => new Date(b.date || b.dateSubmitted || 0) - new Date(a.date || a.dateSubmitted || 0));
                if (!payments.length) return;
                showReceiptModal(payments[0]);
            });
        });
    }

    // ── FIX 3: Summary cards read from ccs.student.payments ────────────────────

    function renderDashboard() {
        renderOrgStudentRows();

        const currentOrgId = getCurrentOrgId();
        const allPayments  = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]')
            .filter(p => String(p.orgId) === String(currentOrgId));

        const confirmedPayments = allPayments.filter(p => String(p.status).toLowerCase() === 'confirmed');
        const pendingPayments   = allPayments.filter(p => String(p.status).toLowerCase() === 'pending verification');

        const totalCollected = confirmedPayments.reduce((sum, p) => sum + parsePeso(p.amount), 0);
        const uniqueStudents = new Set(allPayments.map(p => p.studentId || p.studentNo)).size;

        const allFees  = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]')
            .filter(f => String(f.orgId) === String(currentOrgId) && f.isActive !== false);
        const totalDue = allFees.reduce((sum, f) => sum + (Number(f.amount) || 0), 0);

        const fullyPaidCount = Array.from(new Set(confirmedPayments.map(p => p.studentId || p.studentNo)))
            .filter(function (sid) {
                const paid = confirmedPayments
                    .filter(p => String(p.studentId || p.studentNo) === String(sid))
                    .reduce((sum, p) => sum + parsePeso(p.amount), 0);
                return paid >= totalDue;
            }).length;

        document.querySelectorAll('.summary-cards .card').forEach(function (card) {
            const title = card.querySelector('h3');
            const value = card.querySelector('p');
            if (!title || !value) return;
            const label = String(title.textContent || '').trim().toLowerCase();
            if      (label === 'total collected')  value.textContent = formatPeso(totalCollected);
            else if (label === 'pending payments') value.textContent = String(pendingPayments.length);
            else if (label === 'fully paid')       value.textContent = String(fullyPaidCount);
            else if (label === 'total students')   value.textContent = String(uniqueStudents);
        });

        const orgHeaderName = document.querySelector('.org-header-name');
        if (orgHeaderName) orgHeaderName.textContent = getCurrentOrgName();
    }

    // ── FIX 4: Filters moved inside IIFE ───────────────────────────────────────

    const yearLabelMap = {
        '1': '1st Year',
        '2': '2nd Year',
        '3': '3rd Year',
        '4': '4th Year'
    };

    function matchesCourse(yearSection, course) {
        if (!course) return true;
        if (course === 'BSCS') return yearSection.includes('CS ');
        if (course === 'BSIT') return yearSection.includes('IT ');
        return yearSection.includes(course);
    }

    function applyStudentFilters() {
        const searchInput         = document.getElementById('studentSearch');
        const yearLevelSelect     = document.getElementById('filterYearLevel');
        const courseSelect        = document.getElementById('filterCourse');
        const sectionSelect       = document.getElementById('filterSection');
        const paymentMethodSelect = document.getElementById('filterPaymentMethod');

        const searchQuery   = searchInput         ? searchInput.value.toLowerCase().trim() : '';
        const yearLevel     = yearLevelSelect     ? yearLevelSelect.value                  : '';
        const course        = courseSelect        ? courseSelect.value                     : '';
        const section       = sectionSelect       ? sectionSelect.value                   : '';
        const paymentMethod = paymentMethodSelect ? paymentMethodSelect.value              : '';
        const yearLabel     = yearLabelMap[yearLevel] || '';

        document.querySelectorAll('#orgStudentRecordsBody tr').forEach(function (row) {
            const cells       = row.querySelectorAll('td');
            const rowText     = row.textContent.toLowerCase();
            const yearSection = cells[2] ? cells[2].textContent.trim() : '';
            const method      = cells[7] ? cells[7].textContent.trim() : '';

            let show = true;
            if (searchQuery   && !rowText.includes(searchQuery))   show = false;
            if (yearLabel     && !yearSection.includes(yearLabel))  show = false;
            if (!matchesCourse(yearSection, course))                show = false;
            if (section       && !yearSection.includes(section))    show = false;
            if (paymentMethod && method !== paymentMethod)          show = false;

            row.style.display = show ? '' : 'none';
        });
    }

    function initFilters() {
        const filtersBtn          = document.getElementById('filtersBtn');
        const filtersPopover      = document.getElementById('filtersPopover');
        const searchBtn           = document.getElementById('studentSearchBtn');
        const searchInput         = document.getElementById('studentSearch');
        const applyBtn            = document.getElementById('applyFilters');
        const resetBtn            = document.getElementById('resetFilters');

        if (filtersBtn && filtersPopover) {
            filtersBtn.addEventListener('click', function (e) {
                e.stopPropagation();
                filtersPopover.classList.toggle('show');
            });
            document.addEventListener('click', function (e) {
                if (!filtersBtn.contains(e.target) && !filtersPopover.contains(e.target)) {
                    filtersPopover.classList.remove('show');
                }
            });
        }

        if (applyBtn) {
            applyBtn.addEventListener('click', function () {
                if (filtersPopover) filtersPopover.classList.remove('show');
                applyStudentFilters();
            });
        }

        if (resetBtn) {
            resetBtn.addEventListener('click', function () {
                ['filterYearLevel', 'filterCourse', 'filterSection', 'filterPaymentMethod'].forEach(function (id) {
                    const el = document.getElementById(id);
                    if (el) el.value = '';
                });
                if (filtersPopover) filtersPopover.classList.remove('show');
                applyStudentFilters();
            });
        }

        if (searchBtn) {
            searchBtn.addEventListener('click', function (e) {
                e.preventDefault();
                e.stopImmediatePropagation();
                applyStudentFilters();
            }, true);
        }

        if (searchInput) {
            searchInput.addEventListener('input', applyStudentFilters);
        }
    }

    function initNotificationBadge() {
        const badgeEl = document.getElementById('orgNotificationBadge');
        if (badgeEl) {
            badgeEl.textContent = '3';
            badgeEl.style.display = 'flex';
        }
    }

    // ── Init ───────────────────────────────────────────────────────────────────

    initializePageForOrg();
    renderDashboard();
    initFilters();
    initNotificationBadge();

})();