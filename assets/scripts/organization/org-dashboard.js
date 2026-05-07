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

    function renderOrgStudentRows() {
        const tbody = document.getElementById('orgStudentRecordsBody');
        if (!tbody) return;

        // Demo students for organization dashboard
        const demoStudents = [
            { studentId: 'TY202500115', name: 'Marco Reyes', yearSection: '3rd Year - CS 3-A', amountPaid: 310, totalDue: 310, status: 'Fully Paid', lastPayment: '2026-03-01', paymentMethod: 'GCash' },
            { studentId: 'TY202500116', name: 'Jessica Santos', yearSection: '3rd Year - CS 3-A', amountPaid: 200, totalDue: 310, status: 'Pending', lastPayment: '2026-03-10', paymentMethod: 'GCash' },
            { studentId: 'TY202500117', name: 'Vincent Aquino', yearSection: '3rd Year - CS 3-A', amountPaid: 0, totalDue: 310, status: 'Unpaid', lastPayment: '-', paymentMethod: '-' }
        ];

        const students = demoStudents;

        tbody.innerHTML = students.map(function (student) {
            const statusClass = student.status === 'Fully Paid' ? 'fully-paid' : student.status === 'Pending' ? 'pending' : 'unpaid';

            return `
<tr>
<td>${student.studentId}</td>
<td>${student.name}</td>
<td>${student.yearSection}</td>
<td>${formatPeso(student.amountPaid)}</td>
<td>${formatPeso(student.totalDue)}</td>
<td><span class="status ${statusClass}">${student.status}</span></td>
<td>${student.lastPayment}</td>
<td>${student.paymentMethod}</td>
<td><button class="action-btn">View Details</button></td>
</tr>
`;
        }).join('');
    }

    function renderDashboard() {
        renderOrgStudentRows();

        const currentOrgId = getCurrentOrgId();
        const currentOrgName = getCurrentOrgName();
        const payments = window.CCSPaymentStore && typeof window.CCSPaymentStore.getPaymentsForOrg === 'function'
            ? window.CCSPaymentStore.getPaymentsForOrg(currentOrgId)
            : [];
        const selectedFee = getSelectedFee();
        const feeAmount = Number(selectedFee.amount) || 0;
        const allStudents = (window.SAMPLE_ACCOUNTS || []).filter(function (account) {
            return account && account.permissions && account.permissions.studentView;
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

        const confirmedPayments = payments.filter(function (payment) {
            return String(payment.status || 'Confirmed') === 'Confirmed';
        });

        const totalCollected = confirmedPayments.reduce(function (total, payment) {
            return total + parsePeso(payment.amount);
        }, 0);

        const fullyPaidStudents = students.filter(function (student) {
            const studentPayments = confirmedPayments.filter(function (payment) {
                return String(payment.studentId || payment.studentNo || '') === String(student.studentId) && String(payment.feeName || payment.desc || '').toLowerCase().includes(String(selectedFee.name || '').toLowerCase());
            });
            const paidAmount = studentPayments.reduce(function (total, payment) {
                return total + parsePeso(payment.amount);
            }, 0);
            return feeAmount > 0 && paidAmount >= feeAmount;
        }).length;

        const pendingCount = payments.filter(function (payment) {
            return String(payment.status || '').toLowerCase() === 'pending verification';
        }).length;

        document.querySelectorAll('.summary-cards .card').forEach(function (card) {
            const title = card.querySelector('h3');
            const value = card.querySelector('p');
            if (!title || !value) return;
            const label = String(title.textContent || '').trim().toLowerCase();
            if (label === 'total collected') {
                value.textContent = formatPeso(totalCollected);
            } else if (label === 'pending payments') {
                value.textContent = String(pendingCount);
            } else if (label === 'fully paid') {
                value.textContent = String(fullyPaidStudents);
            } else if (label === 'total students') {
                value.textContent = String(students.length);
            }
        });

        const orgHeaderName = document.querySelector('.org-header-name');
        if (orgHeaderName) {
            orgHeaderName.textContent = currentOrgName;
        }
    }

    initializePageForOrg();
    renderOrgStudentRows();
    renderDashboard();
})();


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
    const searchQuery = searchInput.value.toLowerCase().trim();
    const yearLevel = yearLevelSelect.value;
    const course = courseSelect.value;
    const section = sectionSelect.value;
    const paymentMethod = paymentMethodSelect.value;
    const yearLabel = yearLabelMap[yearLevel] || '';

    document.querySelectorAll('#orgStudentRecordsBody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        const rowText = row.textContent.toLowerCase();
        const yearSection = cells[2]?.textContent.trim() || '';
        const method = cells[7]?.textContent.trim() || '';

        let show = true;

        if (searchQuery && !rowText.includes(searchQuery)) show = false;
        if (yearLabel && !yearSection.includes(yearLabel)) show = false;
        if (!matchesCourse(yearSection, course)) show = false;
        if (section && !yearSection.includes(section)) show = false;
        if (paymentMethod && method !== paymentMethod) show = false;

        row.style.display = show ? '' : 'none';
    });
}

filtersBtn.addEventListener('click', function(e) {
    e.stopPropagation();
    filtersPopover.classList.toggle('show');
});

document.addEventListener('click', function(e) {
    if (!filtersBtn.contains(e.target) &&
        !filtersPopover.contains(e.target)) {
        filtersPopover.classList.remove('show');
    }
});

document.getElementById('applyFilters').addEventListener('click', function() {
    filtersPopover.classList.remove('show');
    applyStudentFilters();
});

document.getElementById('resetFilters').addEventListener('click', function() {
    yearLevelSelect.value = '';
    courseSelect.value = '';
    sectionSelect.value = '';
    paymentMethodSelect.value = '';
    filtersPopover.classList.remove('show');
    applyStudentFilters();
});

searchBtn.addEventListener('click', function(e) {
    e.preventDefault();
    e.stopImmediatePropagation();
    applyStudentFilters();
}, true);

searchInput.addEventListener('input', function() {
    applyStudentFilters();
});

/* Notification badge system for pending promissory notes */
(function () {
    const badgeEl = document.getElementById('orgNotificationBadge');
    if (badgeEl) {
        badgeEl.textContent = '3';
        badgeEl.style.display = 'flex';
    }
})();
