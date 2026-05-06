const SELECTED_PAYMENT_GROUPS_KEY = 'ccs.selected.paymentGroups';
const SELECTED_PAYMENT_GROUP_INDEX_KEY = 'ccs.selected.paymentGroupIndex';
const SELECTED_PAYMENT_CURRENT_GROUP_KEY = 'ccs.payment.currentGroup';

const allSelectedFees = JSON.parse(
    localStorage.getItem('ccs.selected.fees') || '[]'
);
const storedPaymentGroups = (() => {
    try {
        const parsed = JSON.parse(localStorage.getItem(SELECTED_PAYMENT_GROUPS_KEY) || '[]');
        return Array.isArray(parsed) && parsed.length ? parsed : null;
    } catch (_err) {
        return null;
    }
})();
const derivedPaymentGroups = (() => {
    const groups = [];
    const groupMap = new Map();
    allSelectedFees.forEach(function (fee) {
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
const paymentGroups = storedPaymentGroups || derivedPaymentGroups;
const currentGroupIndex = Math.max(0, Number(localStorage.getItem(SELECTED_PAYMENT_GROUP_INDEX_KEY) || '0') || 0);
const currentGroup = paymentGroups[currentGroupIndex] || paymentGroups[0] || {
    orgId: (allSelectedFees[0] && allSelectedFees[0].orgId) || 'u-org-001',
    orgName: 'CCS Student Council',
    fees: allSelectedFees,
    total: allSelectedFees.reduce((sum, fee) => sum + (Number(fee.price) || 0), 0)
};
localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(currentGroup));
const selectedOrgId = currentGroup.orgId || ((allSelectedFees[0] && allSelectedFees[0].orgId) || (window.CCSAuthHelpers && typeof window.CCSAuthHelpers.getCurrentOrganizationScope === 'function' && window.CCSAuthHelpers.getCurrentOrganizationScope() ? window.CCSAuthHelpers.getCurrentOrganizationScope().orgId : 'u-org-001'));
const summaryEl = document.getElementById(
    'method-summary-items'
);
const totalEl = document.getElementById(
    'method-summary-total'
);
const paymentAccountsListEl = document.getElementById('paymentAccountsList');
const paymentAccountsEmptyEl = document.getElementById('paymentAccountsEmpty');
const paymentGroupBannerEl = document.getElementById('paymentGroupBanner');
const fees = currentGroup.fees || [];
const total = Number(currentGroup.total) || fees.reduce((s, f) => s + f.price, 0);

if (paymentGroups.length > 1 && paymentGroupBannerEl) {
    paymentGroupBannerEl.style.display = '';
    paymentGroupBannerEl.textContent = `Payment ${currentGroupIndex + 1} of ${paymentGroups.length} — ${currentGroup.orgName || 'Organization'}`;
}

if (fees.length === 0) {
    summaryEl.innerHTML = 
        '<p class="summary-empty">No fees selected.</p>';
} else {
    summaryEl.innerHTML = fees.map(f =>
        `<div class="summary-item">
<span>${getShortFeeName(f.fee)}</span>
<span>&#8369;${f.price}</span>
</div>`
    ).join('');
    totalEl.textContent = '\u20B1' + total;
}

const orgAccounts = window.CCSPaymentAccounts && typeof window.CCSPaymentAccounts.getPaymentAccountsForOrg === 'function'
    ? window.CCSPaymentAccounts.getPaymentAccountsForOrg(selectedOrgId).filter(account => account.isActive !== false)
    : [];
const orgName = currentGroup.orgName || (orgAccounts[0] && orgAccounts[0].name ? orgAccounts[0].name : (selectedOrgId === 'org-msa-001' ? 'Muslim Student Association' : selectedOrgId === 'org-dean-office-001' ? "Dean's Office — CCS" : 'CCS Student Council'));

function getShortFeeName(feeName) {
    const normalized = String(feeName || '').toLowerCase();
    if (normalized.includes('csc')) return 'CSC Fee';
    if (normalized.includes('gender')) return 'Gender Club';
    if (normalized.includes('insurance')) return 'Insurance';
    if (normalized.includes('misc')) return 'Miscellaneous';
    return feeName;
}

function normalizeMethod(account) {
    return String(account.type || '').trim().toLowerCase().replace(/\s+/g, '-');
}

// Modal helper functions
function generateCashReferenceNumber() {
    const now = new Date();
    const year = now.getFullYear();
    const month = String(now.getMonth() + 1).padStart(2, '0');
    const day = String(now.getDate()).padStart(2, '0');
    const random = String(Math.floor(Math.random() * 10000)).padStart(4, '0');
    return `PAY-${year}${month}${day}-${random}`;
}

function closeGCashModal() {
    const modal = document.getElementById('gcashModal');
    modal.classList.remove('active');
}

function closeBankModal() {
    const modal = document.getElementById('bankModal');
    modal.classList.remove('active');
}

function renderPaymentAccounts() {
    if (!paymentAccountsListEl) return;

    if (!orgAccounts.length) {
        paymentAccountsEmptyEl.style.display = '';
        paymentAccountsListEl.innerHTML = '';
        document.getElementById('reviewPaymentBtn').disabled = true;
        return;
    }

    paymentAccountsEmptyEl.style.display = 'none';
    document.getElementById('reviewPaymentBtn').disabled = false;

    paymentAccountsListEl.innerHTML = orgAccounts.map((account, index) => {
        const method = normalizeMethod(account);
        const isRecommended = method === 'gcash' || index === 0;
        return `
<div class="method-option ${index === 0 ? 'selected' : ''}" data-account-id="${account.id}" data-method="${method}">
<div class="method-info">
<i class='bx bx-wallet method-icon'></i>
<div>
<div class="method-name">${account.type}${isRecommended ? ' <span class="badge">Recommended</span>' : ''}</div>
<p class="method-desc">${account.name}${account.number ? ` • ${account.number}` : ''}</p>
</div>
</div>
<input type="radio" name="payment-method" value="${method}" ${index === 0 ? 'checked' : ''}>
</div>
`;
    }).join('');

    document.querySelectorAll('.method-option').forEach(option => {
        option.addEventListener('click', () => {
            document.querySelectorAll('.method-option').forEach(o => o.classList.remove('selected'));
            option.classList.add('selected');
            const radio = option.querySelector('input[type="radio"]');
            if (radio) radio.checked = true;

            const selectedAccount = orgAccounts.find(account => account.id === option.dataset.accountId);
            if (selectedAccount) {
                localStorage.setItem('ccs.payment.method', normalizeMethod(selectedAccount));
                localStorage.setItem('ccs.payment.account', JSON.stringify({
                    id: selectedAccount.id,
                    type: selectedAccount.type,
                    name: selectedAccount.name,
                    number: selectedAccount.number || '',
                    orgId: selectedOrgId,
                    orgName: orgName
                }));
            }
        });
    });

    const selectedCard = document.querySelector('.method-option.selected') || document.querySelector('.method-option');
    if (selectedCard) {
        const selectedAccount = orgAccounts.find(account => account.id === selectedCard.dataset.accountId) || orgAccounts[0];
        if (selectedAccount) {
            localStorage.setItem('ccs.payment.method', normalizeMethod(selectedAccount));
            localStorage.setItem('ccs.payment.account', JSON.stringify({
                id: selectedAccount.id,
                type: selectedAccount.type,
                name: selectedAccount.name,
                number: selectedAccount.number || '',
                orgId: selectedOrgId,
                orgName: orgName
            }));
        }
    }
}

renderPaymentAccounts();

// Review Payment Button
document.getElementById('reviewPaymentBtn').addEventListener('click', function() {
    const selected = document.querySelector('.method-option.selected');
    if (!selected || !selected.dataset.accountId) return;

    const selectedAccount = orgAccounts.find(account => account.id === selected.dataset.accountId);
    if (!selectedAccount) return;

    const method = normalizeMethod(selectedAccount);

    // Save account info
    localStorage.setItem('ccs.payment.method', method);
    localStorage.setItem('ccs.payment.account', JSON.stringify({
        id: selectedAccount.id,
        type: selectedAccount.type,
        name: selectedAccount.name,
        number: selectedAccount.number || '',
        accountHolderName: selectedAccount.accountHolderName || '',
        orgId: selectedOrgId,
        orgName: orgName
    }));

    // Navigate to confirmation without showing modal
    navigateToConfirmation();
});

function navigateToConfirmation() {
    localStorage.setItem(SELECTED_PAYMENT_CURRENT_GROUP_KEY, JSON.stringify(currentGroup));
    window.location.href = 'payment-confirmation.html';
}
