'use strict';

/* ─────────────────────────────────────────────────────────────────
   IMMEDIATE INIT — runs as soon as the script is parsed.
   Applies any stored theme/font preference to <html> BEFORE the
   browser paints, preventing a flash of default styles.
───────────────────────────────────────────────────────────────── */
(function applyStoredPreferences() {
    const theme = localStorage.getItem('ccs.theme') || 'light';
    const font  = localStorage.getItem('ccs.font')  || 'default';
    if (theme === 'dark')     document.documentElement.classList.add('theme-dark');
    if (font  === 'dyslexic') document.documentElement.classList.add('font-dyslexic');
}());

/* ─────────────────────────────────────────────────────────────────
   MODAL + EVENT LOGIC — runs after the DOM is ready.
───────────────────────────────────────────────────────────────── */
document.addEventListener('DOMContentLoaded', function () {
    const isOrganizationPage = window.location.pathname.toLowerCase().includes('/organization/');
    const PAYMENT_ACCOUNTS_KEY = 'ccs.organization.paymentAccounts';

    /* ── Inject overlay ── */
    const overlay = document.createElement('div');
    overlay.id = 'settings-overlay';
    document.body.appendChild(overlay);

    /* ── Inject slide-in panel ── */
    const panel = document.createElement('div');
    panel.id = 'settings-panel';
    panel.innerHTML = `
        <div class="sp-header">
            <span class="sp-title">
                <i class="bx bx-cog"></i> Settings
            </span>
            <button class="sp-close-btn" id="sp-close-btn" aria-label="Close settings">
                <i class="bx bx-x"></i>
            </button>
        </div>
        <div class="sp-body">
            <div>
                <div class="sp-section-label">Theme</div>
                <div class="sp-option-grid">
                    <button class="sp-opt" data-setting="theme" data-value="light">
                        <i class="bx bx-sun"></i>
                        <span class="sp-opt-label">Light</span>
                        <span class="sp-opt-sub">Default</span>
                    </button>
                    <button class="sp-opt" data-setting="theme" data-value="dark">
                        <i class="bx bx-moon"></i>
                        <span class="sp-opt-label">Dark</span>
                        <span class="sp-opt-sub">Easier on eyes</span>
                    </button>
                </div>
            </div>
            <div>
                <div class="sp-section-label">Accessibility — Font</div>
                <div class="sp-option-grid">
                    <button class="sp-opt" data-setting="font" data-value="default">
                        <i class="bx bx-font"></i>
                        <span class="sp-opt-label">Default</span>
                        <span class="sp-opt-sub">Poppins</span>
                    </button>
                    <button class="sp-opt font-dyslexic-preview" data-setting="font" data-value="dyslexic">
                        <i class="bx bx-font"></i>
                        <span class="sp-opt-label">Dyslexic</span>
                        <span class="sp-opt-sub">Atkinson Hyperlegible</span>
                    </button>
                </div>
            </div>
        </div>
    `;
    document.body.appendChild(panel);

    function escapeHtml(value) {
        return String(value || '')
            .replace(/&/g, '&amp;')
            .replace(/</g, '&lt;')
            .replace(/>/g, '&gt;')
            .replace(/"/g, '&quot;')
            .replace(/'/g, '&#39;');
    }

    function getPaymentAccounts() {
        try {
            const parsed = JSON.parse(localStorage.getItem(PAYMENT_ACCOUNTS_KEY) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function setPaymentAccounts(accounts) {
        localStorage.setItem(PAYMENT_ACCOUNTS_KEY, JSON.stringify(accounts));
    }

    if (isOrganizationPage) {
        panel.querySelector('.sp-body').insertAdjacentHTML('beforeend', `
            <div class="sp-settings-block">
                <div class="sp-section-label">Payment Accounts</div>
                <div class="sp-settings-card">
                    <div class="sp-settings-card-head">
                        <div class="sp-settings-card-title"><i class="bx bx-wallet"></i> Payment Accounts</div>
                        <button class="sp-add-account-btn" type="button" id="sp-add-account-btn">
                            <i class="bx bx-plus"></i>
                            Add Account
                        </button>
                    </div>
                    <div id="sp-payment-accounts-list"></div>
                </div>
            </div>
        `);

        const accountModal = document.createElement('div');
        accountModal.id = 'sp-account-modal';
        accountModal.className = 'sp-account-modal';
        accountModal.innerHTML = `
            <div class="sp-account-modal-card" role="dialog" aria-modal="true" aria-labelledby="sp-account-modal-title">
                <div class="sp-account-modal-header">
                    <h3 id="sp-account-modal-title">Add Payment Account</h3>
                    <button class="sp-account-modal-close" type="button" id="sp-account-modal-close" aria-label="Close payment account form">
                        <i class="bx bx-x"></i>
                    </button>
                </div>
                <div class="sp-account-modal-body">
                    <div class="sp-account-form-group">
                        <label for="sp-account-type">Account Type</label>
                        <select id="sp-account-type">
                            <option value="GCash">GCash</option>
                            <option value="Maya">Maya</option>
                            <option value="BPI">BPI</option>
                            <option value="PNB">PNB</option>
                            <option value="Landbank">Landbank</option>
                            <option value="Cash">Cash</option>
                        </select>
                    </div>
                    <div class="sp-account-form-group" id="sp-account-name-group">
                        <label for="sp-account-name">Account Name</label>
                        <input type="text" id="sp-account-name" placeholder=" " />
                    </div>
                    <div class="sp-account-form-group" id="sp-account-number-group">
                        <label for="sp-account-number">Account Number</label>
                        <input type="text" id="sp-account-number" placeholder=" "/>
                    </div>
                    <div class="sp-account-form-group">
                        <label>Status</label>
                        <div class="sp-account-toggle-wrap">
                            <label class="sp-toggle">
                                <input type="checkbox" id="sp-account-status" checked />
                                <span class="sp-toggle-slider"></span>
                            </label>
                            <span class="sp-toggle-label" id="sp-account-status-label">Active</span>
                        </div>
                    </div>
                </div>
                <div class="sp-account-modal-footer">
                    <button class="sp-btn-cancel" type="button" id="sp-account-cancel-btn">Cancel</button>
                    <button class="sp-btn-submit" type="button" id="sp-account-save-btn">Save</button>
                </div>
            </div>
        `;
        document.body.appendChild(accountModal);

        const accountList = panel.querySelector('#sp-payment-accounts-list');
        const addAccountBtn = panel.querySelector('#sp-add-account-btn');
        const accountModalTitle = accountModal.querySelector('#sp-account-modal-title');
        const accountTypeInput = accountModal.querySelector('#sp-account-type');
        const accountNameInput = accountModal.querySelector('#sp-account-name');
        const accountNumberInput = accountModal.querySelector('#sp-account-number');
        const accountNameGroup = accountModal.querySelector('#sp-account-name-group');
        const accountNumberGroup = accountModal.querySelector('#sp-account-number-group');
        const accountStatusInput = accountModal.querySelector('#sp-account-status');
        const accountStatusLabel = accountModal.querySelector('#sp-account-status-label');
        const accountSaveBtn = accountModal.querySelector('#sp-account-save-btn');
        const accountCancelBtn = accountModal.querySelector('#sp-account-cancel-btn');

        let editingAccountId = null;

        function toggleCashAccountFields() {
            const isCash = accountTypeInput.value === 'Cash';
            accountNameGroup.style.display = isCash ? 'none' : '';
            accountNumberGroup.style.display = isCash ? 'none' : '';
            accountCancelBtn.style.display = isCash ? 'none' : '';

            if (isCash) {
                accountNameInput.value = '';
                accountNumberInput.value = '';
            }
        }

        function renderPaymentAccounts() {
            const accounts = getPaymentAccounts();

            if (!accounts.length) {
                accountList.innerHTML = '<p class="sp-inline-empty">No payment accounts added yet</p>';
                return;
            }

            accountList.innerHTML = accounts.map(function (account) {
                const statusClass = account.isActive ? 'sp-status-badge--active' : 'sp-status-badge--inactive';
                const statusText = account.isActive ? 'Active' : 'Inactive';
                const isCash = (account.type || '').toLowerCase() === 'cash';
                const accountName = isCash ? '' : account.name;
                const accountNumber = isCash ? '' : account.number;

                return `
                    <div class="sp-account-row" data-account-id="${escapeHtml(account.id)}">
                        <div class="sp-account-details">
                            <div class="sp-account-top-row">
                                <div class="sp-account-type">${escapeHtml(account.type)}</div>
                                <span class="sp-status-badge ${statusClass}">${statusText}</span>
                            </div>
                            ${accountName ? `<div class="sp-account-meta">${escapeHtml(accountName)}</div>` : ''}
                            ${accountNumber ? `<div class="sp-account-meta">${escapeHtml(accountNumber)}</div>` : ''}
                        </div>
                        <div class="sp-account-actions">
                            <button type="button" class="sp-icon-btn js-account-edit" aria-label="Edit account">
                                <i class="bx bx-edit-alt"></i>
                            </button>
                            <button type="button" class="sp-icon-btn js-account-delete" aria-label="Delete account">
                                <i class="bx bx-trash"></i>
                            </button>
                        </div>
                    </div>
                `;
            }).join('');
        }

        function resetAccountForm() {
            accountTypeInput.value = 'GCash';
            accountNameInput.value = '';
            accountNumberInput.value = '';
            accountStatusInput.checked = true;
            accountStatusLabel.textContent = 'Active';
            accountModalTitle.textContent = 'Add Payment Account';
            accountSaveBtn.textContent = 'Save';
            editingAccountId = null;
            toggleCashAccountFields();
        }

        function openAccountModal() {
            accountModal.classList.add('sp-open');
        }

        function closeAccountModal() {
            accountModal.classList.remove('sp-open');
            resetAccountForm();
        }

        function handleEditAccount(accountId) {
            const target = getPaymentAccounts().find(function (item) {
                return item.id === accountId;
            });

            if (!target) return;

            editingAccountId = target.id;
            accountModalTitle.textContent = 'Edit Payment Account';
            accountSaveBtn.textContent = 'Save';
            accountTypeInput.value = target.type || 'GCash';
            accountNameInput.value = target.name || '';
            accountNumberInput.value = target.number || '';
            accountStatusInput.checked = !!target.isActive;
            accountStatusLabel.textContent = target.isActive ? 'Active' : 'Inactive';
            toggleCashAccountFields();
            openAccountModal();
        }

        function handleSaveAccount() {
            const type = accountTypeInput.value.trim();
            const name = accountNameInput.value.trim();
            const number = accountNumberInput.value.trim();
            const isActive = accountStatusInput.checked;
            const isCash = type === 'Cash';

            if (!type || (!isCash && (!name || !number))) {
                alert('Please fill in all payment account fields.');
                return;
            }

            const accounts = getPaymentAccounts();

            if (editingAccountId) {
                const nextAccounts = accounts.map(function (item) {
                    if (item.id !== editingAccountId) return item;
                    return {
                        id: item.id,
                        type: type,
                        name: isCash ? '' : name,
                        number: isCash ? '' : number,
                        isActive: isActive
                    };
                });
                setPaymentAccounts(nextAccounts);
            } else {
                accounts.push({
                    id: 'acct-' + Date.now() + '-' + Math.random().toString(16).slice(2),
                    type: type,
                    name: isCash ? '' : name,
                    number: isCash ? '' : number,
                    isActive: isActive
                });
                setPaymentAccounts(accounts);
            }

            renderPaymentAccounts();
            closeAccountModal();
        }

        addAccountBtn.addEventListener('click', function () {
            resetAccountForm();
            openAccountModal();
        });

        accountModal.querySelector('#sp-account-modal-close').addEventListener('click', closeAccountModal);
        accountModal.querySelector('#sp-account-cancel-btn').addEventListener('click', closeAccountModal);
        accountModal.addEventListener('click', function (e) {
            if (e.target === accountModal) closeAccountModal();
        });

        accountStatusInput.addEventListener('change', function () {
            accountStatusLabel.textContent = accountStatusInput.checked ? 'Active' : 'Inactive';
        });

        accountTypeInput.addEventListener('change', toggleCashAccountFields);

        accountSaveBtn.addEventListener('click', handleSaveAccount);

        accountList.addEventListener('click', function (e) {
            const row = e.target.closest('.sp-account-row');
            if (!row) return;

            const accountId = row.dataset.accountId;
            if (!accountId) return;

            if (e.target.closest('.js-account-edit')) {
                handleEditAccount(accountId);
                return;
            }

            if (e.target.closest('.js-account-delete')) {
                const confirmed = window.confirm('Delete this payment account?');
                if (!confirmed) return;

                const nextAccounts = getPaymentAccounts().filter(function (item) {
                    return item.id !== accountId;
                });
                setPaymentAccounts(nextAccounts);
                renderPaymentAccounts();
            }
        });

        renderPaymentAccounts();
    }

    /* ── Sync active state on option buttons ── */
    function syncActive() {
        const theme = localStorage.getItem('ccs.theme') || 'light';
        const font  = localStorage.getItem('ccs.font')  || 'default';
        panel.querySelectorAll('.sp-opt').forEach(function (btn) {
            const isActive =
                (btn.dataset.setting === 'theme' && btn.dataset.value === theme) ||
                (btn.dataset.setting === 'font'  && btn.dataset.value === font);
            btn.classList.toggle('active', isActive);
        });
    }

    /* ── Open / close ── */
    function openPanel() {
        panel.classList.add('sp-open');
        overlay.classList.add('sp-open');
        syncActive();
    }

    function closePanel() {
        panel.classList.remove('sp-open');
        overlay.classList.remove('sp-open');

        if (isOrganizationPage) {
            const accountModal = document.getElementById('sp-account-modal');
            if (accountModal) accountModal.classList.remove('sp-open');
        }
    }

    document.getElementById('sp-close-btn').addEventListener('click', closePanel);
    overlay.addEventListener('click', closePanel);

    /* ── Option button clicks ── */
    panel.querySelectorAll('.sp-opt').forEach(function (btn) {
        btn.addEventListener('click', function () {
            const setting = btn.dataset.setting;
            const value   = btn.dataset.value;

            localStorage.setItem('ccs.' + setting, value);

            if (setting === 'theme') {
                document.documentElement.classList.toggle('theme-dark', value === 'dark');
            }
            if (setting === 'font') {
                document.documentElement.classList.toggle('font-dyslexic', value === 'dyslexic');
            }

            syncActive();
        });
    });

    /* ── Hook sidebar Settings links ──
       Works for both hardcoded sidebars and sidebar-template.js.
       Any element with class "js-settings-open" will open the panel. */
    document.addEventListener('click', function (e) {
        const link = e.target.closest('.js-settings-open');
        if (link) {
            e.preventDefault();
            openPanel();
        }
    });

    /* ── Expose globally so admin renderSystem() can open the panel ── */
    window.openSettingsPanel = openPanel;
});
