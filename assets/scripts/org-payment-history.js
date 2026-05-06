(function () {
    const FEES_STORAGE_KEY = 'ccs.organization.fees';
    const PROFILE_OVERRIDES_KEY = 'ccs.auth.accountProfileOverrides';

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
        const orgName = getCurrentOrgName();
        const orgHeaderName = document.getElementById('paymentHistoryOrgName');
        if (orgHeaderName) {
            orgHeaderName.textContent = orgName;
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
            { id: 'fee-default-csc', name: 'CSC Fee', amount: 200, appliesTo: 'all', isActive: true },
            { id: 'fee-default-misc', name: 'Miscellaneous fee', amount: 60, appliesTo: 'all', isActive: true },
            { id: 'fee-default-msa', name: 'MSA Fee', amount: 50, appliesTo: 'Muslim', isActive: true },
            { id: 'fee-default-insurance', name: 'Insurance (Whole Year)', amount: 100, appliesTo: 'all', isActive: true }
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
        const fees = Array.isArray(savedFees) && savedFees.length ? savedFees : defaultFees();

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
        if (selectedFeeRaw && typeof selectedFeeRaw === 'object') {
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

    function getSchoolYearAndSemester() {
        const now = new Date();
        const month = now.getMonth() + 1;
        const startYear = month >= 6 ? now.getFullYear() : now.getFullYear() - 1;
        const schoolYear = `${startYear}-${startYear + 1}`;
        const semester = month >= 6 && month <= 10 ? '1st Semester' : '2nd Semester';
        return { schoolYear, semester };
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

    function renderPaymentHistoryRows() {
        const tbody = document.getElementById('orgPaymentHistoryBody');
        if (!tbody) return;

        const selectedFee = getSelectedFee();
        const currentOrgId = getCurrentOrgId();
        const feeName = String(selectedFee.name || '').toLowerCase();
        const feeAmount = Number(selectedFee.amount) || 0;
        const schedule = getSchoolYearAndSemester();

        const overrides = readJson(localStorage.getItem(PROFILE_OVERRIDES_KEY), {});
        const allStudents = (window.SAMPLE_ACCOUNTS || []).filter(function (account) {
            return account && account.permissions && account.permissions.studentView;
        }).map(function (account) {
            const override = overrides[account.id] || {};
            return {
                ...account,
                religion: typeof override.religion === 'string' ? override.religion : account.religion
            };
        });

        const students = allStudents.filter(function (student) {
            const feeMatches = studentMatchesFee(student.religion, selectedFee);
            const isMuslimStudent = String(student.religion || '').toLowerCase() === 'muslim/islam' || String(student.religion || '').toLowerCase() === 'muslim';

            if (currentOrgId === 'org-msa-001') {
                return isMuslimStudent && feeMatches;
            } else {
                return !isMuslimStudent && feeMatches;
            }
        });

        const allPayments = window.SAMPLE_PAYMENTS || [];

        tbody.innerHTML = students.map(function (student) {
            const payments = allPayments.filter(function (payment) {
                if (payment.studentNo !== student.studentId) return false;
                if (!feeName) return true;
                return String(payment.desc || '').toLowerCase().includes(feeName);
            });

            const paidAmount = payments.reduce(function (total, payment) {
                return total + parsePeso(payment.amount);
            }, 0);

            const isPaid = feeAmount > 0 && paidAmount >= feeAmount;

            return `
<tr>
<td>${student.studentId || '-'}</td>
<td>${student.name || '-'}</td>
<td>${student.course || '-'}</td>
<td>${student.year && student.section ? `${student.year} - ${student.section}` : '-'}</td>
<td>${schedule.schoolYear}</td>
<td>${schedule.semester}</td>
<td>${formatPeso(feeAmount)}</td>
<td><span class="status-badge ${isPaid ? 'paid' : 'pending'}">${isPaid ? 'Paid' : 'Pending'}</span></td>
</tr>
`;
        }).join('');
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

        counter.textContent = `${pendingCount} Pending`;

        if (!requests.length) {
            body.innerHTML = '<tr><td colspan="8" class="promissory-empty">No promissory note requests submitted yet.</td></tr>';
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
<td>${formatAmount(request.partialAmount)}</td>
<td>${formatDate(request.promisedDate)}</td>
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
