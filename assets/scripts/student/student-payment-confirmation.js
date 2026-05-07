const SELECTED_PAYMENT_GROUPS_KEY = 'ccs.selected.paymentGroups';
const SELECTED_PAYMENT_GROUP_INDEX_KEY = 'ccs.selected.paymentGroupIndex';
const SELECTED_PAYMENT_CURRENT_GROUP_KEY = 'ccs.payment.currentGroup';
const SELECTED_FEES_KEY = 'ccs.selected.fees';
const fees = JSON.parse(
    localStorage.getItem('ccs.selected.fees') || '[]'
);
const storedGroups = (() => {
    try {
        const parsed = JSON.parse(localStorage.getItem(SELECTED_PAYMENT_GROUPS_KEY) || '[]');
        return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (_err) {
        return null;
    }
})();
const derivedGroups = (() => {
    const groups = [];
    const groupMap = new Map();
    fees.forEach(function (fee) {
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
})();
const paymentGroups = storedGroups || derivedGroups;
const currentGroupIndex = Math.max(0, Number(localStorage.getItem(SELECTED_PAYMENT_GROUP_INDEX_KEY) || '0') || 0);
const currentGroup = paymentGroups[currentGroupIndex] || paymentGroups[0] || {
    orgId: (fees[0] && fees[0].orgId) || 'u-org-001',
    orgName: 'CCS Student Council',
    fees: fees,
    total: fees.reduce((sum, fee) => sum + Number(fee.price || 0), 0)
};
localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(currentGroup));
const method = localStorage.getItem('ccs.payment.method') || 'gcash';
const selectedAccount = (() => {
    try {
        return JSON.parse(localStorage.getItem('ccs.payment.account') || '{}') || {};
    } catch (_err) {
        return {};
    }
})();

const feeEl = document.getElementById('confirm-fee-items');
const totalEl = document.getElementById('confirm-total');
const paymentGroupBannerEl = document.getElementById('paymentGroupBanner');
const confirmPopupTitleEl = document.getElementById('paymentSubmittedTitle');
const confirmPopupSubtitleEl = document.querySelector('.payment-popup-header p');
const confirmPopupPrimaryBtn = document.getElementById('makeAnotherPaymentBtn');
const confirmPopupSecondaryBtn = document.getElementById('goToDashboardBtn');
const totalPayments = paymentGroups.length || 1;
const isMultiOrgFlow = totalPayments > 1;

if (isMultiOrgFlow && paymentGroupBannerEl) {
    paymentGroupBannerEl.style.display = '';
    paymentGroupBannerEl.textContent = `Payment ${currentGroupIndex + 1} of ${totalPayments} — ${currentGroup.orgName || 'Organization'}`;
}

if (confirmPopupTitleEl) {
    confirmPopupTitleEl.textContent = isMultiOrgFlow ? `Payment ${currentGroupIndex + 1} of ${totalPayments} Submitted!` : 'Payment Submitted!';
}
if (confirmPopupSubtitleEl) {
    confirmPopupSubtitleEl.textContent = 'Your payment has been saved and is now waiting for organization verification.';
}
if (confirmPopupPrimaryBtn && confirmPopupSecondaryBtn) {
    confirmPopupSecondaryBtn.style.display = 'none';
}

const currentFees = Array.isArray(currentGroup.fees) && currentGroup.fees.length ? currentGroup.fees : fees;

if (currentFees.length === 0) {
    feeEl.innerHTML = 
        '<p class="summary-empty">No fees selected.</p>';
} else {
    feeEl.innerHTML = currentFees.map(f =>
        `<div class="summary-item">
<span>${f.fee}</span>
<span>&#8369;${f.price}</span>
</div>`
    ).join('');
    totalEl.textContent = '\u20B1' + 
        currentFees.reduce((s, f) => s + f.price, 0);
}

const methodLabel = selectedAccount.type || method || 'Cash';
const BANK_TYPES = ['bpi', 'pnb', 'landbank'];
const isBankTransfer = BANK_TYPES.includes((selectedAccount.type || '').toLowerCase());
const isCash = /cash/i.test(methodLabel);
const isGCash = /gcash|g-cash/i.test(methodLabel);

function maskGCashAccountName(fullName) {
    if (!fullName || typeof fullName !== 'string') return '';
    const nameParts = fullName.trim().split(/\s+/);
    if (nameParts.length === 0) return '';
    if (nameParts.length === 1) {
        const firstName = nameParts[0];
        return firstName.length > 1 
            ? firstName[0] + '*'.repeat(firstName.length - 1)
            : firstName;
    }
    const firstName = nameParts[0];
    const lastName = nameParts[nameParts.length - 1];
    const firstNameMasked = firstName.length > 1 
        ? firstName[0] + '*'.repeat(firstName.length - 1)
        : firstName;
    const lastNameMasked = lastName[0] + '.';
    return firstNameMasked + ' ' + lastNameMasked;
}

const gcashPaymentSection = document.getElementById('gcashPaymentSection');
const cashNoteSection = document.getElementById('cashNoteSection');

document.getElementById('confirm-method-label')
    .innerHTML = `<i class="bx bx-wallet"></i> ${methodLabel}`;

if (isGCash) {
    // Show GCash inline payment section
    gcashPaymentSection.style.display = '';
    cashNoteSection.style.display = 'none';

    // Populate GCash details from selectedAccount
    const gcashNumber = selectedAccount.number || '0912 345 6789';
    const maskedName = maskGCashAccountName(selectedAccount.accountHolderName || '');
    const totalAmount = getCurrentGroupTotal();

    document.getElementById('gcashNumber').textContent = gcashNumber;
    document.getElementById('gcashRecipientName').textContent = maskedName;
    document.getElementById('gcashAmount').textContent = '₱' + totalAmount.toFixed(2);

    // Add auto-format and validation to GCash reference input
    const gcashRefInput = document.getElementById('gcashRefInput');
    const confirmBtn = document.getElementById('confirm-pay-btn');

    // Disable on load
    confirmBtn.disabled = true;
    confirmBtn.style.opacity = '0.5';
    confirmBtn.style.cursor = 'not-allowed';

    if (gcashRefInput) {
        gcashRefInput.addEventListener('input', function() {
            this.value = this.value.replace(/[^0-9]/g, '').slice(0, 13);
            const valid = this.value.length === 13;
            confirmBtn.disabled = !valid;
            confirmBtn.style.opacity = valid ? '1' : '0.5';
            confirmBtn.style.cursor = valid ? 'pointer' : 'not-allowed';
        });
    }
} else if (isBankTransfer) {
    // Hide GCash and Cash sections
    gcashPaymentSection.style.display = 'none';
    cashNoteSection.style.display = 'none';

    // Inject bank payment section dynamically
    injectBankPaymentSection();
} else if (isCash) {
    // Show cash note
    gcashPaymentSection.style.display = 'none';
    cashNoteSection.style.display = '';

    // Remove bank section if it exists
    const existingBankSection = document.getElementById('bankPaymentSectionDynamic');
    if (existingBankSection) {
        existingBankSection.remove();
    }
}

function injectBankPaymentSection() {
    // Check if already injected
    if (document.getElementById('bankPaymentSectionDynamic')) {
        return;
    }

    // Read orgId and total from ccs.selected.paymentGroups
    try {
        var paymentGroups = JSON.parse(localStorage.getItem('ccs.selected.paymentGroups') || '[]');
    } catch (e) {
        return;
    }
    if (!paymentGroups || paymentGroups.length === 0) {
        return;
    }

    const orgId = paymentGroups[0].orgId;
    const paymentMethod = localStorage.getItem('ccs.payment.method');
    const amount = paymentGroups[0].total;

    // Read bank accounts from localStorage using orgId
    var accounts = [];
    try {
        var stored = localStorage.getItem('ccs.organization.paymentAccounts::' + orgId);
        if (stored) {
            accounts = JSON.parse(stored);
        }
    } catch (e) {
        // accounts remains empty array
    }

    // Find matching bank account by payment method type
    const bankAccount = accounts.find(function(a) {
        return a.type && a.type.toLowerCase() === paymentMethod.toLowerCase();
    });

    console.log('orgId:', orgId, 'paymentMethod:', paymentMethod, 'bankAccount:', bankAccount);

    if (!bankAccount) {
        return;
    }

    const bankSectionHTML = `
<div class="confirm-detail-row" id="bankPaymentSectionDynamic" style="flex-direction:column; align-items:stretch; border-bottom:none; padding:0;">
<div style="width:100%; background:#f0f4f8; border:1px solid #cbd5e0; border-radius:12px; padding:20px; margin-top:24px; margin-bottom:20px;">
<p style="font-size:11px; color:#4b5563; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 12px 0;">Transfer To</p>
<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
<div>
<p style="font-size:11px; color:#6b7a88; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px 0;">Bank</p>
<p style="font-size:14px; font-weight:700; color:#1a2420; margin:0;">${bankAccount.type}</p>
</div>
<div>
<p style="font-size:11px; color:#6b7a88; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px 0;">Account Number</p>
<p style="font-size:14px; font-weight:700; color:#1a2420; margin:0;">${bankAccount.number || '—'}</p>
</div>
</div>
<div style="display:grid; grid-template-columns:1fr 1fr; gap:12px; margin-bottom:12px;">
<div>
<p style="font-size:11px; color:#6b7a88; font-weight:600; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px 0;">Account Name</p>
<p style="font-size:14px; font-weight:700; color:#1a2420; margin:0;">${bankAccount.name || '—'}</p>
</div>
<div>
<p style="font-size:11px; color:#4b5563; font-weight:700; text-transform:uppercase; letter-spacing:0.5px; margin:0 0 4px 0;">Amount to Transfer</p>
<p style="font-size:14px; font-weight:700; color:#2e7d52; margin:0;">₱${Number(amount).toFixed(2)}</p>
</div>
</div>
</div>
<div style="margin-top:20px; display:flex; flex-direction:column; gap:16px;">
<div>
<label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:8px;">Bank Reference Number (required)</label>
<input type="text" id="bankRefInput" class="confirm-input" placeholder="Enter transaction reference number" style="width:100%;">
</div>
<div>
<label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:8px;">Account Name Used (required)</label>
<input type="text" id="bankAccountNameInput" class="confirm-input" placeholder="Enter the name on your account" style="width:100%;">
</div>
<div>
<label style="display:block; font-size:12px; font-weight:600; color:#374151; margin-bottom:8px;">Payment Screenshot (optional)</label>
<label id="screenshotLabel" style="display:flex; align-items:center; gap:10px; border:1.5px dashed #cbd5e0; border-radius:10px; padding:14px 16px; cursor:pointer; background:#f9fafb;">
<i class="bx bx-image" style="font-size:20px; color:#6b7280;"></i>
<span id="screenshotFileName" style="font-size:13px; color:#6b7280;">Attach screenshot of your transfer</span>
<input type="file" id="screenshotInput" accept="image/*" style="display:none;">
</label>
</div>
</div>
</div>`;

    // Find insertion point (after Payment Method row)
    const paymentMethodRow = document.querySelector('[id="confirm-method-label"]').closest('.confirm-detail-row');
    paymentMethodRow.insertAdjacentHTML('afterend', bankSectionHTML);

    // Add event listeners for button enable/disable
    const bankRefInput = document.getElementById('bankRefInput');
    const bankAcctNameInput = document.getElementById('bankAccountNameInput');
    const confirmBtn = document.getElementById('confirm-pay-btn');

    function updateButtonState() {
        const allFilled = bankRefInput.value.trim() && bankAcctNameInput.value.trim();
        confirmBtn.disabled = !allFilled;
        confirmBtn.style.opacity = allFilled ? '1' : '0.5';
        confirmBtn.style.cursor = allFilled ? 'pointer' : 'not-allowed';
    }

    bankRefInput.addEventListener('input', updateButtonState);
    bankAcctNameInput.addEventListener('input', updateButtonState);

    // Screenshot input handler
    const screenshotInput = document.getElementById('screenshotInput');
    const screenshotFileName = document.getElementById('screenshotFileName');
    screenshotInput.addEventListener('change', function() {
        if (this.files && this.files[0]) {
            screenshotFileName.textContent = this.files[0].name;
            screenshotFileName.style.color = '#1a5c2a';
        }
    });

    // Initial button state
    updateButtonState();
}

function readCurrentUser() {
    return window.Auth && typeof window.Auth.getUser === 'function'
        ? window.Auth.getUser()
        : null;
}

function getCurrentGroupFees() {
    return Array.isArray(currentGroup.fees) && currentGroup.fees.length ? currentGroup.fees : fees;
}

function getCurrentGroupTotal() {
    return Number(currentGroup.total) || getCurrentGroupFees().reduce((sum, fee) => sum + Number(fee.price || 0), 0);
}

function getCurrentFeeNames() {
    return getCurrentGroupFees().map(function (fee) {
        return fee.fee || fee.feeName || 'Fee';
    });
}

function clearCheckoutState() {
    localStorage.removeItem(SELECTED_FEES_KEY);
    localStorage.removeItem(SELECTED_PAYMENT_GROUPS_KEY);
    localStorage.removeItem(SELECTED_PAYMENT_GROUP_INDEX_KEY);
    localStorage.removeItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY);
    localStorage.removeItem('ccs.payment.method');
    localStorage.removeItem('ccs.payment.account');
}

function setFeeVerificationStatus(studentId, feeIds, status) {
    if (!window.CCSPaymentStore || typeof window.CCSPaymentStore.setFeeStatuses !== 'function') return;
    window.CCSPaymentStore.setFeeStatuses(studentId, feeIds, status);
}

function getNextPaymentGroup() {
    return paymentGroups[currentGroupIndex + 1] || null;
}

function hidePaymentPopup() {
    const popup = document.getElementById('paymentSubmittedPopup');
    popup.classList.remove('show');
    popup.setAttribute('aria-hidden', 'true');
}

function showPaymentPopup(payment, hasMorePayments) {
    document.getElementById('paymentPopupRef').textContent = payment.referenceNumber;
    document.getElementById('paymentPopupFeeName').textContent = payment.feeName;
    document.getElementById('paymentPopupAmount').textContent = payment.amount;
    document.getElementById('paymentPopupDate').textContent = new Date(payment.dateSubmitted + 'T00:00:00').toLocaleDateString('en-US', {
        year: 'numeric',
        month: 'short',
        day: 'numeric'
    });
    document.getElementById('paymentPopupMethod').textContent = payment.paymentMethod;

    // Show GCash Reference Number field only for GCash payments
    const gcashRefItem = document.getElementById('gcashRefPopupItem');
    const isGCashPayment = /gcash|g-cash/i.test(payment.paymentMethod || '');
    if (isGCashPayment) {
        gcashRefItem.style.display = '';
        const gcashRef = localStorage.getItem('ccs.payment.referenceNumber') || '—';
        document.getElementById('paymentPopupGCashRef').textContent = gcashRef;
    } else {
        gcashRefItem.style.display = 'none';
    }

    if (confirmPopupPrimaryBtn) {
        confirmPopupPrimaryBtn.textContent = hasMorePayments ? 'Continue to Next Payment' : 'Go to Dashboard';
    }
    if (confirmPopupSecondaryBtn) {
        confirmPopupSecondaryBtn.style.display = 'none';
    }

    const popup = document.getElementById('paymentSubmittedPopup');
    popup.classList.add('show');
    popup.setAttribute('aria-hidden', 'false');
}

document.getElementById('confirm-pay-btn')
    .addEventListener('click', function() {
        if (!window.CCSPaymentStore || typeof window.CCSPaymentStore.savePayment !== 'function') {
            alert('Payment storage module failed to load. Please refresh and try again.');
            return;
        }

        // Validate GCash reference if GCash payment
        if (isGCash) {
            const gcashRef = (document.getElementById('gcashRefInput').value || '').trim();
            if (!gcashRef || gcashRef.length !== 13 || !/^\d{13}$/.test(gcashRef)) {
                alert('Please enter a valid 13-digit GCash reference number.');
                return;
            }
            // Store GCash reference
            localStorage.setItem('ccs.payment.referenceNumber', gcashRef);
        }

        // Validate Bank fields if Bank transfer
        if (isBankTransfer) {
            const bankRef = (document.getElementById('bankRefInput').value || '').trim();
            const bankAcctName = (document.getElementById('bankAccountNameInput').value || '').trim();

            if (!bankRef) {
                alert('Please enter your bank reference number.');
                return;
            }
            if (!bankAcctName) {
                alert('Please enter the account name used for this transfer.');
                return;
            }
            // Store Bank details
            localStorage.setItem('ccs.payment.bankDetails', JSON.stringify({
                referenceNumber: bankRef,
                accountNameUsed: bankAcctName
            }));
        }

        const user = readCurrentUser();
        const referenceNumber = window.CCSPaymentStore.generateReferenceNumber();
        const dateSubmitted = new Date().toISOString().slice(0, 10);
        const currentFees = getCurrentGroupFees();
        const totalAmount = getCurrentGroupTotal();
        const feeNames = getCurrentFeeNames();
        const feeIds = currentFees.map(function (fee) {
            return fee.feeId || fee.id || '';
        }).filter(Boolean);
        const feeName = feeNames.join(', ');
        const orgId = currentGroup.orgId || (currentFees[0] && currentFees[0].orgId) || selectedAccount.orgId || 'u-org-001';
        const orgName = currentGroup.orgName || (orgId === 'org-msa-001' ? 'Muslim Student Association' : orgId === 'org-dean-office-001' ? "Dean's Office — CCS" : 'CCS Student Council');

        const payment = {
            id: `payment-${Date.now()}`,
            orgId: orgId,
            orgName: orgName,
            feeId: feeIds[0] || '',
            feeIds: feeIds,
            feeName: feeName,
            feeNames: feeNames,
            studentId: user && user.studentId ? user.studentId : '',
            studentName: user && user.name ? user.name : '',
            amount: '₱' + totalAmount.toFixed(2),
            dateSubmitted: dateSubmitted,
            paymentMethod: methodLabel,
            referenceNumber: referenceNumber,
            status: 'Pending Verification',
            rejectionReason: '',
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        window.CCSPaymentStore.savePayment(payment);
        setFeeVerificationStatus(payment.studentId, feeIds, 'Pending Verification');
        showPaymentPopup(payment, !!getNextPaymentGroup());
    });

document.getElementById('makeAnotherPaymentBtn').addEventListener('click', function () {
    const nextGroup = getNextPaymentGroup();
    if (nextGroup) {
        localStorage.setItem(SELECTED_PAYMENT_GROUP_INDEX_KEY, String(currentGroupIndex + 1));
        localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(nextGroup));
        localStorage.setItem(SELECTED_FEES_KEY, JSON.stringify(nextGroup.fees || []));
        window.location.href = 'payment-method.html';
        return;
    }

    clearCheckoutState();
    window.location.href = 'student-dashboard.html';
});

document.getElementById('goToDashboardBtn').addEventListener('click', function () {
    clearCheckoutState();
    window.location.href = 'student-dashboard.html';
});

document.getElementById('paymentSubmittedPopup').addEventListener('click', function (event) {
    if (event.target === this) {
        hidePaymentPopup();
    }
});
