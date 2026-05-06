const FEES_STORAGE_KEY = 'ccs.organization.fees';
    
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
        const orgId = getCurrentOrgId();
        const orgName = getCurrentOrgName();
        const titleElement = document.getElementById('orgFeesTitle');
        const subtitleElement = document.getElementById('orgFeesSubtitle');
        const headerNameElement = document.querySelector('.org-header-name');
        
        if (titleElement) {
            titleElement.textContent = orgId === 'org-msa-001' ? 'MSA FEES' : 'CCS FEES';
        }
        if (subtitleElement) {
            subtitleElement.textContent = orgName + ' fee types, Amounts, and Collection due dates';
        }
        if (headerNameElement) {
            headerNameElement.textContent = orgName;
        }
    }
    
        const CURRENT_ORG_SCOPE = getOrgScope();
        const CURRENT_ORG_ID = getCurrentOrgId();
        const CURRENT_ORG_NAME = getCurrentOrgName();

    const DEFAULT_FEES = [
        {
            id: 'fee-default-csc',
            name: 'CSC Fee',
            description: 'College Student Council Fee',
            amount: 200,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'mandatory',
            appliesTo: 'all',
            acceptedPaymentChannels: [],
            orgId: 'u-org-001'
        },
        {
            id: 'fee-default-misc',
            name: 'Miscellaneous fee',
            description: 'CCS Faculty',
            amount: 60,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'mandatory',
            appliesTo: 'all',
            acceptedPaymentChannels: [],
            orgId: 'u-org-001'
        },
        {
            id: 'fee-default-msa',
            name: 'MSA Fee',
            description: 'Muslim Students Association Fee',
            amount: 50,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'mandatory',
            appliesTo: 'Muslim',
            acceptedPaymentChannels: [],
            orgId: 'org-msa-001'
        },
        {
            id: 'fee-default-insurance',
            name: 'Insurance (Whole Year)',
            description: 'Annual Student Insurance Coverage',
            amount: 100,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'mandatory',
            appliesTo: 'all',
            acceptedPaymentChannels: [],
            orgId: 'u-org-001'
        }
    ];

    function normalizeFee(fee) {
        return {
            id: fee.id || ('fee-' + Date.now()),
            name: String(fee.name || '').trim(),
            description: String(fee.description || '').trim(),
            amount: Number(fee.amount) || 0,
            dueDate: fee.dueDate || '',
            isActive: fee.isActive !== false,
            feeType: fee.feeType === 'voluntary' ? 'voluntary' : 'mandatory',
            appliesTo: normalizeAppliesToValue(fee.appliesTo, fee.specificReligion),
            specificReligion: String(fee.specificReligion || '').trim(),
            acceptedPaymentChannels: Array.isArray(fee.acceptedPaymentChannels) ? fee.acceptedPaymentChannels : [],
            orgId: fee.orgId || 'u-org-001'
        };
    }

    function normalizeAppliesToValue(appliesTo, specificReligion) {
        const normalized = String(appliesTo || 'all').trim().toLowerCase();
        if (normalized === 'muslim') return 'Muslim';
        if (normalized === 'catholic') return 'Catholic';
        if (normalized === 'specific') {
            const value = String(specificReligion || '').trim();
            return value ? 'specific' : 'all';
        }
        return 'all';
    }

    function formatDueDate(value) {
        if (!value) return 'No due date';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
    }

    function getPaymentAccounts() {
        if (window.CCSPaymentAccounts && typeof window.CCSPaymentAccounts.getPaymentAccounts === 'function') {
            return window.CCSPaymentAccounts.getPaymentAccounts();
        }
        return [];
    }

    function getStoredFees() {
        try {
            const parsed = JSON.parse(localStorage.getItem(FEES_STORAGE_KEY) || '[]');
            return Array.isArray(parsed) ? parsed.map(normalizeFee) : [];
        } catch (_err) {
            return [];
        }
    }

    function getAllFees() {
        const saved = getStoredFees();
        if (saved.length) return saved;
        return DEFAULT_FEES.map(normalizeFee);
    }

    function saveFees(fees) {
        localStorage.setItem(FEES_STORAGE_KEY, JSON.stringify(fees.map(normalizeFee)));
    }

    function maskChannelNumber(rawNumber) {
        const digits = String(rawNumber || '').replace(/\D/g, '');
        if (digits.length >= 6) {
            return digits.slice(0, 2) + 'XX XXX ' + digits.slice(-4);
        }
        if (!digits.length) return 'XXXX';
        return digits.slice(0, 2) + 'XXXX';
    }

    function renderAcceptedPaymentChannels() {
        const channelsContainer = document.getElementById('paymentChannelsContainer');
        const warning = document.getElementById('paymentChannelsWarning');
        const activeAccounts = getPaymentAccounts().filter(function (account) {
            return account.isActive;
        });

        channelsContainer.innerHTML = '';
        warning.hidden = activeAccounts.length > 0;

        if (!activeAccounts.length) {
            return;
        }

        activeAccounts.forEach(function (account) {
            const option = document.createElement('label');
            option.className = 'payment-channel-option';

            option.innerHTML = `
                <input type="checkbox" class="payment-channel-checkbox" value="${account.id}">
                <span>${account.type} - ${maskChannelNumber(account.number)}</span>
            `;

            channelsContainer.appendChild(option);
        });
    }

    function getSelectedPaymentChannels() {
        const selected = [];
        const activeAccounts = getPaymentAccounts().filter(function (account) {
            return account.isActive;
        });
        const accountMap = new Map(activeAccounts.map(function (account) {
            return [account.id, account];
        }));

        document.querySelectorAll('.payment-channel-checkbox:checked').forEach(function (input) {
            const matched = accountMap.get(input.value);
            if (!matched) return;

            selected.push({
                id: matched.id,
                type: matched.type,
                name: matched.name,
                number: matched.number
            });
        });

        return selected;
    }

    function setPaymentChannelError(showError) {
        document.getElementById('paymentChannelsError').hidden = !showError;
    }

    function getSelectedFeeType() {
        return document.querySelector('input[name="feeType"]:checked')?.value || 'mandatory';
    }

    function getSelectedAppliesTo() {
        const selectValue = document.getElementById('feeAppliesTo').value;
        if (selectValue === 'muslim') {
            return { appliesTo: 'Muslim', specificReligion: '' };
        }
        if (selectValue === 'catholic') {
            return { appliesTo: 'Catholic', specificReligion: '' };
        }
        if (selectValue === 'specific') {
            return {
                appliesTo: 'specific',
                specificReligion: document.getElementById('feeAppliesToSpecific').value.trim()
            };
        }
        return { appliesTo: 'all', specificReligion: '' };
    }

    function toggleSpecificReligionInput() {
        const selectValue = document.getElementById('feeAppliesTo').value;
        const specificInput = document.getElementById('feeAppliesToSpecific');
        const shouldShow = selectValue === 'specific';
        specificInput.style.display = shouldShow ? 'block' : 'none';
        if (!shouldShow) {
            specificInput.value = '';
        }
    }

    function getAppliesToLabel(fee) {
        const value = String(fee.appliesTo || 'all').trim();
        if (!value || value.toLowerCase() === 'all') return 'All students';
        if (value.toLowerCase() === 'specific') {
            return fee.specificReligion ? fee.specificReligion : 'Specific religion';
        }
        return value;
    }

    function updateFeeTypeHelp() {
        const feeType = getSelectedFeeType();
        document.getElementById('feeTypeHelp').textContent = feeType === 'voluntary'
            ? 'This fee will not affect student clearance'
            : 'This fee is required for student clearance';
    }

    function updateStatsCards() {
        const fees = getAllFees().filter(function (fee) {
            return String(fee.orgId || 'u-org-001') === CURRENT_ORG_ID;
        });
        const activeFees = fees.filter(function (fee) { return fee.isActive !== false; });
        const totalAmount = activeFees.reduce(function (sum, fee) { return sum + Number(fee.amount || 0); }, 0);
        const unpaidFees = activeFees.filter(function (fee) { return Number(fee.amount || 0) > 0; }).length;
        
        const totalPerStudent = document.getElementById('totalPerStudentStat');
        const activeFeeTypes = document.getElementById('activeFeeTypesStat');
        const avgCollectionRate = document.getElementById('avgCollectionRateStat');
        const feesWithUnpaid = document.getElementById('feesWithUnpaidStat');
        
        if (totalPerStudent) {
            totalPerStudent.textContent = 'PHP ' + Number(totalAmount).toFixed(2);
        }
        if (activeFeeTypes) {
            activeFeeTypes.textContent = String(activeFees.length);
        }
        if (avgCollectionRate) {
            avgCollectionRate.textContent = '0%';
        }
        if (feesWithUnpaid) {
            feesWithUnpaid.textContent = String(unpaidFees);
        }
    }

    function renderFeesList() {
        const list = document.getElementById('orgFeesList');
        const fees = getAllFees().filter(function (fee) {
            return String(fee.orgId || 'u-org-001') === CURRENT_ORG_ID;
        });

        list.innerHTML = fees.map(function (fee) {
            const statusClass = fee.isActive ? 'badge-active' : 'badge-inactive';
            const statusText = fee.isActive ? 'Active' : 'Inactive';
            const typeClass = fee.feeType === 'voluntary' ? 'badge-optional' : 'badge-required';
            const typeText = fee.feeType === 'voluntary' ? 'Optional' : 'Required';

            return `
                <article class="fee-item" data-fee-id="${fee.id}">
                    <div class="fee-icon"><i class='bx bx-money'></i></div>
                    <div class="fee-info">
                        <div class="fee-name-row">
                            <span class="fee-name">${fee.name}</span>
                            <span class="${typeClass}">${typeText}</span>
                            <span class="${statusClass}">${statusText}</span>
                        </div>
                        <div class="fee-desc">${fee.description} | Applies to: ${getAppliesToLabel(fee)} | Due: ${formatDueDate(fee.dueDate)}</div>
                        <div class="progress-row">
                            <div class="progress-bar"><div class="progress-fill" style="width: 0%"></div></div>
                            <span class="progress-label">0/342 collected</span>
                        </div>
                    </div>
                    <div class="fee-right">
                        <span class="fee-amount">PHP ${Number(fee.amount).toFixed(2)}</span>
                        <div class="fee-actions">
                            <button type="button" aria-label="Edit ${fee.name}"><i class='bx bx-edit-alt'></i></button>
                            <button type="button" aria-label="Hide ${fee.name}"><i class='bx bx-hide'></i></button>
                            <button type="button" aria-label="Delete ${fee.name}"><i class='bx bx-trash'></i></button>
                        </div>
                    </div>
                </article>
            `;
        }).join('');
    }

    function openAddFeeModal() {
        renderAcceptedPaymentChannels();
        setPaymentChannelError(false);
        updateFeeTypeHelp();
        document.getElementById('addFeeModal').classList.add('active');
    }

    function closeAddFeeModal() {
        document.getElementById('addFeeModal').classList.remove('active');
        document.getElementById('feeName').value = '';
        document.getElementById('feeDescription').value = '';
        document.getElementById('feeAmount').value = '';
        document.getElementById('feeDueDate').value = '';
        document.getElementById('feeStatus').checked = true;
        document.getElementById('toggleLabel').textContent = 'Active';
        const feeTypeDefault = document.querySelector('input[name="feeType"][value="mandatory"]');
        if (feeTypeDefault) feeTypeDefault.checked = true;
        document.getElementById('feeAppliesTo').value = 'all';
        document.getElementById('feeAppliesToSpecific').value = '';
        toggleSpecificReligionInput();
        updateFeeTypeHelp();
        setPaymentChannelError(false);
    }

    document.getElementById('addFeeModal').addEventListener('click', function(e) {
        if (e.target === this) closeAddFeeModal();
    });

    document.getElementById('feeStatus').addEventListener('change', function() {
        document.getElementById('toggleLabel').textContent = this.checked ? 'Active' : 'Inactive';
    });

    document.querySelectorAll('input[name="feeType"]').forEach(function (radio) {
        radio.addEventListener('change', updateFeeTypeHelp);
    });

    document.getElementById('feeAppliesTo').addEventListener('change', toggleSpecificReligionInput);

    function submitFee() {
        const name = document.getElementById('feeName').value.trim();
        const desc = document.getElementById('feeDescription').value.trim();
        const amount = document.getElementById('feeAmount').value;
        const due = document.getElementById('feeDueDate').value;
        const selectedChannels = getSelectedPaymentChannels();
        const feeType = getSelectedFeeType();
        const appliesConfig = getSelectedAppliesTo();

        if (!name || !desc || !amount || !due) {
            alert('Please fill in all required fields (*).');
            return;
        }

        if (selectedChannels.length === 0) {
            setPaymentChannelError(true);
            return;
        }

        if (appliesConfig.appliesTo === 'specific' && !appliesConfig.specificReligion) {
            alert('Please enter the specific religion for this fee.');
            return;
        }

        setPaymentChannelError(false);

        const isActive = document.getElementById('feeStatus').checked;
        const fees = getAllFees();
        fees.push({
            id: 'fee-' + Date.now(),
            name: name,
            description: desc,
            amount: parseFloat(amount),
            dueDate: due,
            isActive: isActive,
            feeType: feeType,
            appliesTo: appliesConfig.appliesTo,
            specificReligion: appliesConfig.specificReligion,
            acceptedPaymentChannels: selectedChannels,
            orgId: CURRENT_ORG_ID,
            organization: CURRENT_ORG_NAME,
            createdAt: new Date().toISOString()
        });

        saveFees(fees);
        renderFeesList();
        updateStatsCards();
        closeAddFeeModal();
    }

    document.addEventListener('DOMContentLoaded', function () {
        initializePageForOrg();
        renderFeesList();
        updateStatsCards();
        updateFeeTypeHelp();
        toggleSpecificReligionInput();
    });
