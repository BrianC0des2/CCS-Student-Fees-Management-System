const FEES_STORAGE_KEY = 'ccs.organization.fees';
const PROMISSORY_STORAGE_KEY = window.CCSStudentDataHelpers && typeof window.CCSStudentDataHelpers.getStudentDataStorageKey === 'function'
    ? window.CCSStudentDataHelpers.getStudentDataStorageKey('PROMISSORY_STORAGE_KEY')
    : (window.CCSStudentDataKeys && window.CCSStudentDataKeys.PROMISSORY_STORAGE_KEY);
const feeListEl = document.getElementById('makePaymentFeeList');
const multiOrgNoticeEl = document.getElementById('multiOrgNotice');
const summaryItems = document.getElementById('summary-items');
const totalAmountEl = document.getElementById('summary-total-amount');
const continueBtn = document.querySelector('.continue-btn');
let selectedFeeForPromissory = null;
const SELECTED_PAYMENT_GROUPS_KEY = 'ccs.selected.paymentGroups';
const SELECTED_PAYMENT_GROUP_INDEX_KEY = 'ccs.selected.paymentGroupIndex';
const SELECTED_PAYMENT_CURRENT_GROUP_KEY = 'ccs.payment.currentGroup';

const DEFAULT_FEES = [
    {
        id: 'fee-default-csc',
        name: 'CSC Fee',
        amount: 200,
        dueDate: '2026-02-15',
        isActive: true,
        feeType: 'mandatory',
        appliesTo: 'all',
        orgId: 'u-org-001'
    },
    {
        id: 'fee-default-gender',
        name: 'Gender Club Membership Fee',
        amount: 50,
        dueDate: '2026-02-15',
        isActive: true,
        feeType: 'voluntary',
        appliesTo: 'all',
        orgId: 'u-org-001'
    },
    {
        id: 'fee-default-msa',
        name: 'MSA Fee',
        amount: 50,
        dueDate: '2026-02-15',
        isActive: true,
        feeType: 'voluntary',
        appliesTo: 'Muslim/Islam',
        orgId: 'org-msa-001'
    },
    {
        id: 'fee-default-insurance',
        name: 'Insurance (Whole Year)',
        amount: 40,
        dueDate: '2026-02-15',
        isActive: true,
        feeType: 'mandatory',
        appliesTo: 'all',
        orgId: 'u-org-001'
    },
    {
        id: 'fee-default-misc',
        name: 'Miscellaneous (10 booklets @ ₱6 each)',
        amount: 60,
        dueDate: '2026-02-15',
        isActive: true,
        feeType: 'mandatory',
        appliesTo: 'all',
        orgId: 'u-org-001'
    }
];

function readJsonArray(key) {
    try {
        const parsed = JSON.parse(localStorage.getItem(key) || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
        return [];
    }
}

function normalizeFee(fee) {
    return {
        id: fee.id || ('fee-' + Date.now()),
        name: String(fee.name || '').trim(),
        amount: Number(fee.amount) || 0,
        dueDate: fee.dueDate || '',
        isActive: fee.isActive !== false,
        feeType: fee.feeType === 'voluntary' ? 'voluntary' : 'mandatory',
        appliesTo: normalizeAppliesToValue(fee.appliesTo, fee.specificReligion),
        specificReligion: String(fee.specificReligion || '').trim(),
        orgId: fee.orgId || 'u-org-001'
    };
}

function normalizeReligion(value) {
    return String(value || '').trim().toLowerCase();
}

function normalizeAppliesToValue(appliesTo, specificReligion) {
    const normalized = String(appliesTo || 'all').trim().toLowerCase();
    if (normalized === 'muslim' || normalized === 'muslim/islam') return 'muslim';
    if (normalized === 'catholic') return 'catholic';
    if (normalized === 'specific') {
        return String(specificReligion || '').trim() ? 'specific' : 'all';
    }
    return 'all';
}

function feeAppliesToStudent(fee, user) {
    const appliesTo = normalizeAppliesToValue(fee.appliesTo, fee.specificReligion);
    if (appliesTo === 'all') return true;

    const studentReligion = normalizeReligion(user && user.religion ? user.religion : '');
    if (!studentReligion) return false;

    if (appliesTo === 'specific') {
        return studentReligion === normalizeReligion(fee.specificReligion || '');
    }

    if (appliesTo === 'muslim') {
        return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
    }

    return studentReligion === appliesTo;
}

function isMuslimStudent(user) {
    const religion = normalizeReligion(user && user.religion ? user.religion : '');
    return religion === 'muslim' || religion === 'muslim/islam';
}

function getConfirmedPaidAmountForFee(studentId, fee) {
    if (!studentId || !fee) return 0;

    const feeId = String(fee.id || '').trim();
    const feeName = String(fee.name || '').trim().toLowerCase();
    const payments = window.getStudentPayments ? window.getStudentPayments(studentId) : [];

    const total = payments.reduce(function (sum, payment) {
        const status = String(payment.status || 'Confirmed').toLowerCase();
        if (status !== 'confirmed') return sum;

        const paymentFeeIds = Array.isArray(payment.feeIds)
            ? payment.feeIds.map(function (value) { return String(value || '').trim(); }).filter(Boolean)
            : (payment.feeId ? [String(payment.feeId || '').trim()] : []);

        const matchesFeeId = feeId && paymentFeeIds.some(function (value) { return value === feeId; });
        const matchesFeeName = !paymentFeeIds.length && feeName && String(payment.feeName || payment.desc || '').trim().toLowerCase() === feeName;

        if (!matchesFeeId && !matchesFeeName) return sum;

        const amount = Number(String(payment.amount || '').replace(/[^0-9.\-]/g, '')) || 0;
        return sum + amount;
    }, 0);

    return Math.round(total * 100) / 100;
}

function getRemainingBalanceForFee(studentId, fee) {
    const paid = getConfirmedPaidAmountForFee(studentId, fee);
    const remaining = Number(fee.amount || 0) - paid;
    return Math.round(Math.max(remaining, 0) * 100) / 100;
}

function getRenderableFees() {
    const user = getCurrentUser();
    const studentId = user && user.studentId ? user.studentId : null;

    return getActiveFees().filter(function (fee) {
        if (!feeAppliesToStudent(fee, user)) return false;

        if (String(fee.appliesTo || '').trim().toLowerCase() === 'muslim' && !isMuslimStudent(user)) return false;

        const remaining = studentId ? getRemainingBalanceForFee(studentId, fee) : Math.round(Number(fee.amount || 0) * 100) / 100;
        return remaining > 0;
    });
}

function getActiveFees() {
    const stored = readJsonArray(FEES_STORAGE_KEY).map(normalizeFee);
    const source = stored.length ? stored : DEFAULT_FEES.map(normalizeFee);
    const user = getCurrentUser();
    return source.filter(function (fee) {
        return fee.isActive && feeAppliesToStudent(fee, user);
    });
}

function formatDueDate(value) {
    if (!value) return '-';
    const date = new Date(value);
    if (Number.isNaN(date.getTime())) return value;
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
}

function getCurrentUser() {
    return window.Auth && typeof window.Auth.getUser === 'function'
        ? window.Auth.getUser()
        : null;
}

function getPreselectedFees() {
    try {
        const parsed = JSON.parse(localStorage.getItem('ccs.selected.fees') || '[]');
        return Array.isArray(parsed) ? parsed : [];
    } catch (_err) {
        return [];
    }
}

/**
 * PAYMENT WINDOW CHECK
 * Step 1: If ccs.academic.settings doesn't exist or is missing paymentStartDate/paymentDeadline → locked
 * Step 2: If both dates exist, check today against the window
 * Returns: { isOpen: bool, settings: obj|null }
 */
function getPaymentWindowStatus() {
    var raw = localStorage.getItem('ccs.academic.settings');
    if (!raw) return { isOpen: false, settings: null };

    var settings = null;
    try { settings = JSON.parse(raw); } catch (_) { return { isOpen: false, settings: null }; }

    if (!settings || !settings.paymentStartDate || !settings.paymentDeadline) {
        return { isOpen: false, settings: settings };
    }

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var start = new Date(settings.paymentStartDate);
    start.setHours(0, 0, 0, 0);

    var end = new Date(settings.paymentDeadline);
    end.setHours(0, 0, 0, 0);

    var isOpen = today >= start && today <= end;
    return { isOpen: isOpen, settings: settings };
}

/**
 * PROMISSORY EXCEPTION CHECK (Step 3)
 * If window is closed, check if student has an approved promissory note for this fee
 * and today is on or before the promisedDate.
 */
function isUnlockedByPromissory(feeId, studentId, latestPromissory) {
    if (!latestPromissory) return false;
    var status = String(latestPromissory.status || '').toLowerCase();
    if (status !== 'promissory approved') return false;
    if (!latestPromissory.promisedDate) return false;

    var today = new Date();
    today.setHours(0, 0, 0, 0);

    var promisedDate = new Date(latestPromissory.promisedDate);
    promisedDate.setHours(0, 0, 0, 0);

    return today <= promisedDate;
}

function renderFeeRows() {
    const user = getCurrentUser();
    const studentId = user && user.studentId ? user.studentId : null;
    const fees = getRenderableFees();

    // Check payment window once for all fees
    const windowStatus = getPaymentWindowStatus();
    const isWindowOpen = windowStatus.isOpen;

    const selectAllCheckbox = `
<div class="fees-selection fee-item-card select-all-card">
<div class="fee-info">
<input type="checkbox" id="selectAllCheckbox">
<div class="cb">
<div class="fee-name-row">
<h3>Select All Fees</h3>
</div>
</div>
</div>
</div>
`;

    feeListEl.innerHTML = selectAllCheckbox + fees.map(function (fee) {
        const typeClass = fee.feeType === 'voluntary' ? 'fee-pill-optional' : 'fee-pill-required';
        const typeText = fee.feeType === 'voluntary' ? 'OPTIONAL' : 'REQUIRED';
        const feeAmount = Number(fee.amount || 0);

        // Confirmed payments
        const payments = window.getStudentPayments ? window.getStudentPayments(studentId) : [];
        const confirmedPayments = payments.filter(function (p) {
            const status = String(p.status || 'Confirmed').toLowerCase();
            if (status !== 'confirmed') return false;
            const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
            return feeIds.some(function (fid) { return String(fid || '') === String(fee.id); });
        });
        const confirmedPaidAmount = confirmedPayments.reduce(function (sum, p) {
            const amt = String(p.amount || '').replace(/[^0-9\.\-]/g, '');
            return sum + (Number(amt) || 0);
        }, 0);

        // Promissory requests for this fee
        const promissoryRequests = readJsonArray('ccs.promissory.requests') || [];
        const feePromissoryRequests = promissoryRequests.filter(function (req) {
            return String(req.feeId || '') === String(fee.id) && String(req.studentId || '') === studentId;
        });
        const latestPromissory = feePromissoryRequests.length > 0
            ? feePromissoryRequests.sort(function (a, b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); })[0]
            : null;
        const promStatus = latestPromissory ? String(latestPromissory.status || '').toLowerCase() : null;
        const isPendingReview = promStatus === 'pending review';
        const isPromissoryApproved = promStatus === 'promissory approved';
        const isPromissoryRejected = promStatus === 'promissory rejected';

        // Pending verification payment check
        const hasPendingVerificationPayment = payments.some(function (p) {
            const status = String(p.status || '').toLowerCase();
            if (status !== 'pending verification') return false;
            const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
            return feeIds.some(function (fid) { return String(fid || '') === String(fee.id); });
        });

        // Remaining balance
        let remaining = 0;
        if (isPendingReview) {
            remaining = Math.round((feeAmount - confirmedPaidAmount) * 100) / 100;
        } else if (isPromissoryApproved && latestPromissory && latestPromissory.partialAmount) {
            const partialAmount = Number(latestPromissory.partialAmount) || 0;
            remaining = Math.round(Math.max(feeAmount - partialAmount - confirmedPaidAmount, 0) * 100) / 100;
        } else {
            remaining = Math.round(Math.max(feeAmount - confirmedPaidAmount, 0) * 100) / 100;
        }

        if (remaining <= 0) return '';

        // --- STEP 4a: Pending Verification takes top priority ---
        if (hasPendingVerificationPayment) {
            return `
<div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
<div class="fee-info">
<input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${remaining}" data-org-id="${fee.orgId || 'u-org-001'}" disabled>
<div class="cb">
<div class="fee-name-row">
<h3>${fee.name}</h3>
<span class="fee-pill ${typeClass}">${typeText}</span>
</div>
<p>Due: ${formatDueDate(fee.dueDate)}</p>
</div>
</div>
<div class="fee-balance-row">
<div class="fee-prices" style="color:#f59e0b; font-weight:600;">Payment Pending Verification — awaiting org confirmation</div>
<div class="fee-prices">Remaining: ₱${Number(remaining).toFixed(2)}</div>
</div>
<button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}" disabled style="opacity:0.5;">Request promissory note instead</button>
</div>
`;
        }

        // --- STEP 4b: Promissory Pending Review ---
        if (isPendingReview) {
            return `
<div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
<div class="fee-info">
<input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${remaining}" data-org-id="${fee.orgId || 'u-org-001'}" disabled>
<div class="cb">
<div class="fee-name-row">
<h3>${fee.name}</h3>
<span class="fee-pill ${typeClass}">${typeText}</span>
</div>
<p>Due: ${formatDueDate(fee.dueDate)}</p>
</div>
</div>
<div class="fee-balance-row">
<div class="fee-prices" style="color:#f59e0b; font-weight:600;">Promissory Pending — awaiting approval</div>
<div class="fee-prices">Remaining: ₱${Number(remaining).toFixed(2)}</div>
</div>
<button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}" disabled style="opacity:0.5;">Request promissory note instead</button>
</div>
`;
        }

        // --- STEPS 1, 2, 3: Payment window check ---
        // Window is open OR fee is unlocked by approved promissory note
        const unlockedByPromissory = !isWindowOpen && isUnlockedByPromissory(fee.id, studentId, latestPromissory);
        const canPay = isWindowOpen || unlockedByPromissory;

        if (!canPay) {
            // Window is closed and no promissory exception — show locked state
            const showPromissoryLink = !isPromissoryApproved && !isPendingReview;
            return `
<div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
<div class="fee-info">
<input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${remaining}" data-org-id="${fee.orgId || 'u-org-001'}" disabled>
<div class="cb">
<div class="fee-name-row">
<h3>${fee.name}</h3>
<span class="fee-pill ${typeClass}">${typeText}</span>
</div>
<p>Due: ${formatDueDate(fee.dueDate)}</p>
</div>
</div>
<div class="fee-balance-row">
<div class="fee-prices">Remaining: ₱${Number(remaining).toFixed(2)}</div>
<button type="button" class="pay-now-btn" disabled style="background:#9ca3af; color:#fff; cursor:not-allowed; border:none; padding:8px 18px; border-radius:8px; font-weight:600;">Payment Window Closed</button>
</div>
${showPromissoryLink ? `<button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}">Request promissory note instead</button>` : ''}
</div>
`;
        }

        // --- Window is open (or unlocked by promissory) — show Pay Now enabled ---
        const promissoryBadge = isPromissoryApproved
            ? `<span style="color:#16a34a; font-weight:600; font-size:0.85em;">✓ Promissory Approved</span>`
            : (isPromissoryRejected ? `<span style="color:#dc2626; font-size:0.85em;">Promissory Rejected — resubmit below</span>` : '');

        const showPromissoryLink = !isPromissoryApproved;

        return `
<div class="fees-selection fee-item-card" data-fee-id="${fee.id}">
<div class="fee-info">
<input type="checkbox" data-fee-id="${fee.id}" data-fee="${fee.name}" data-price="${remaining}" data-org-id="${fee.orgId || 'u-org-001'}">
<div class="cb">
<div class="fee-name-row">
<h3>${fee.name}</h3>
<span class="fee-pill ${typeClass}">${typeText}</span>
</div>
<p>Due: ${formatDueDate(fee.dueDate)}</p>
${promissoryBadge}
</div>
</div>
<div class="fee-balance-row">
<div class="fee-prices">Remaining: ₱${Number(remaining).toFixed(2)}</div>
</div>
${showPromissoryLink ? `<button type="button" class="fee-action-promissory-link" data-fee-id="${fee.id}" data-fee-name="${fee.name}">Request promissory note instead</button>` : ''}
</div>
`;
    }).join('');

    bindFeeEvents();
}

function getCheckboxes() {
    return Array.from(document.querySelectorAll('input[type="checkbox"][data-fee-id]'));
}

function getChecked() {
    return getCheckboxes().filter(cb => cb.checked);
}

function getSelectedFeeGroups() {
    const checked = getChecked().map(function (cb) {
        return {
            feeId: cb.dataset.feeId,
            fee: cb.dataset.fee,
            price: Number(cb.dataset.price) || 0,
            orgId: cb.dataset.orgId || 'u-org-001'
        };
    });

    const groups = [];
    const groupMap = new Map();

    checked.forEach(function (fee) {
        const orgId = String(fee.orgId || 'u-org-001');
        if (!groupMap.has(orgId)) {
            const group = {
                orgId: orgId,
                orgName: orgId === 'org-msa-001' ? 'Muslim Student Association' : orgId === 'org-dean-office-001' ? "Dean's Office — CCS" : 'CCS Student Council',
                fees: [],
                total: 0
            };
            groupMap.set(orgId, group);
            groups.push(group);
        }
        const group = groupMap.get(orgId);
        group.fees.push(fee);
        group.total += Number(fee.price) || 0;
    });

    return groups;
}

function updateMultiOrgNotice() {
    if (!multiOrgNoticeEl) return;
    const groups = getSelectedFeeGroups();
    if (groups.length <= 1) {
        multiOrgNoticeEl.style.display = 'none';
        multiOrgNoticeEl.textContent = '';
        return;
    }
    multiOrgNoticeEl.style.display = '';
    multiOrgNoticeEl.textContent = `Your selected fees belong to ${groups.length} organizations and will be processed as ${groups.length} separate payments.`;
}

function updateSummary() {
    const checked = getChecked();
    summaryItems.innerHTML = checked.length === 0
        ? '<p class="summary-empty">No fees selected yet.</p>'
        : checked.map(cb => {
            return `<div class="summary-item">
<span>${cb.dataset.fee}</span>
<span>&#8369;${Number(cb.dataset.price || 0).toFixed(2)}</span>
</div>`;
        }).join('');
    const total = checked.reduce((sum, cb) => sum + (Number(cb.dataset.price) || 0), 0);
    totalAmountEl.textContent = '\u20B1' + total;
    updateMultiOrgNotice();
}

function openPromissoryModal(feeId, feeName) {
    selectedFeeForPromissory = { feeId: feeId, feeName: feeName };
    document.getElementById('promissoryFeeName').value = feeName;
    document.getElementById('promissoryReason').value = '';
    document.getElementById('promissoryPartialAmount').value = '';
    document.getElementById('promissoryDate').value = '';

    const today = new Date().toISOString().slice(0, 10);
    const promisedDateInput = document.getElementById('promissoryDate');
    if (promisedDateInput) {
        promisedDateInput.min = today;

        // Step 3 addition: cap max to semesterEndDate from ccs.academic.settings only
        var raw = localStorage.getItem('ccs.academic.settings');
        var semesterEndDate = '';
        if (raw) {
            try {
                var settings = JSON.parse(raw);
                semesterEndDate = (settings && settings.semesterEndDate) ? settings.semesterEndDate : '';
            } catch (_) {}
        }

        if (semesterEndDate) {
            promisedDateInput.max = semesterEndDate;
        } else {
            promisedDateInput.removeAttribute('max');
        }
    }

    const modal = document.getElementById('promissoryModal');
    modal.classList.add('active');
    modal.setAttribute('aria-hidden', 'false');
}

function closePromissoryModal() {
    const modal = document.getElementById('promissoryModal');
    modal.classList.remove('active');
    modal.setAttribute('aria-hidden', 'true');
    selectedFeeForPromissory = null;
}

function submitPromissoryRequest() {
    if (!selectedFeeForPromissory) return;

    if (!PROMISSORY_STORAGE_KEY) {
        alert('Promissory storage is unavailable. Please refresh and try again.');
        return;
    }

    const reason = document.getElementById('promissoryReason').value.trim();
    const promisedDate = document.getElementById('promissoryDate').value;
    const partialRaw = document.getElementById('promissoryPartialAmount').value;
    const partialAmount = partialRaw === '' ? null : Number(partialRaw);

    if (!reason || !promisedDate) {
        alert('Please complete the required fields.');
        return;
    }

    if (partialAmount !== null && (Number.isNaN(partialAmount) || partialAmount < 0)) {
        alert('Please enter a valid partial payment amount.');
        return;
    }

    const currentUser = getCurrentUser();
    const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
    requests.push({
        id: 'promissory-' + Date.now(),
        feeId: selectedFeeForPromissory.feeId,
        feeName: selectedFeeForPromissory.feeName,
        studentId: currentUser && currentUser.studentId ? currentUser.studentId : 'anonymous-student',
        studentNumber: currentUser && currentUser.studentId ? currentUser.studentId : 'anonymous-student',
        studentName: currentUser && currentUser.name ? currentUser.name : 'Student',
        reason: reason,
        partialAmount: partialAmount,
        promisedDate: promisedDate,
        status: 'Pending Review',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    });

    localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));
    closePromissoryModal();
}

function bindFeeEvents() {
    const selectAllCheckbox = document.getElementById('selectAllCheckbox');

    getCheckboxes().forEach(function (cb) {
        cb.addEventListener('change', function () {
            if (!this.checked && selectAllCheckbox) {
                selectAllCheckbox.checked = false;
            }
            updateSummary();
        });
    });

    if (selectAllCheckbox) {
        selectAllCheckbox.addEventListener('change', function () {
            const isChecked = this.checked;
            getCheckboxes().forEach(function (cb) {
                if (!cb.disabled) cb.checked = isChecked;
            });
            updateSummary();
        });
    }

    document.querySelectorAll('.fee-action-promissory-link').forEach(function (button) {
        if (button.disabled) return;
        button.addEventListener('click', function () {
            const feeId = button.dataset.feeId;
            const feeName = button.dataset.feeName;
            const feeCheckbox = document.querySelector(`input[type="checkbox"][data-fee-id="${feeId}"]`);

            if (feeCheckbox && feeCheckbox.checked) {
                feeCheckbox.checked = false;
                if (selectAllCheckbox) selectAllCheckbox.checked = false;
                updateSummary();
            }

            openPromissoryModal(feeId, feeName);
        });
    });
}

function applyPreselectedFees() {
    const preselected = getPreselectedFees();
    if (!preselected.length) return;

    const preselectedNames = new Set(preselected.map(function (fee) {
        return String(fee.fee || fee.feeName || '').trim();
    }).filter(Boolean));

    const preselectedIds = new Set(preselected.map(function (fee) {
        return String(fee.feeId || fee.id || '').trim();
    }).filter(Boolean));

    let changed = false;
    getCheckboxes().forEach(function (checkbox) {
        const feeId = String(checkbox.dataset.feeId || '').trim();
        const feeName = String(checkbox.dataset.fee || '').trim();
        const shouldCheck = preselectedIds.has(feeId) || preselectedNames.has(feeName);
        if (shouldCheck && !checkbox.disabled) {
            checkbox.checked = true;
            changed = true;
        }
    });

    if (changed) {
        updateSummary();
        localStorage.removeItem('ccs.selected.fees');
    }
}

document.getElementById('promissoryCloseBtn').addEventListener('click', closePromissoryModal);
document.getElementById('promissoryCancelBtn').addEventListener('click', closePromissoryModal);
document.getElementById('promissorySubmitBtn').addEventListener('click', submitPromissoryRequest);
document.getElementById('promissoryModal').addEventListener('click', function (event) {
    if (event.target === this) closePromissoryModal();
});

continueBtn.addEventListener('click', function (e) {
    e.preventDefault();
    const checked = getChecked();
    if (checked.length === 0) {
        alert('Please select at least one fee.');
        return;
    }
    const fees = checked.map(cb => {
        return { feeId: cb.dataset.feeId, fee: cb.dataset.fee, price: Number(cb.dataset.price) || 0, orgId: cb.dataset.orgId || 'u-org-001' };
    });
    const paymentGroups = getSelectedFeeGroups();
    localStorage.setItem('ccs.selected.fees', JSON.stringify(fees));
    localStorage.setItem(SELECTED_PAYMENT_GROUPS_KEY, JSON.stringify(paymentGroups));
    localStorage.setItem(SELECTED_PAYMENT_GROUP_INDEX_KEY, '0');
    if (paymentGroups[0]) {
        localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(paymentGroups[0]));
    }
    window.location.href = 'payment-method.html';
});

renderFeeRows();
applyPreselectedFees();
updateSummary();