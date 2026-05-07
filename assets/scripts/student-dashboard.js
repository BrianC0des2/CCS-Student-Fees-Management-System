(function () {
    const FEES_STORAGE_KEY = 'ccs.organization.fees';
    const PROMISSORY_STORAGE_KEY = window.CCSStudentDataHelpers && typeof window.CCSStudentDataHelpers.getStudentDataStorageKey === 'function'
        ? window.CCSStudentDataHelpers.getStudentDataStorageKey('PROMISSORY_STORAGE_KEY')
        : (window.CCSStudentDataKeys && window.CCSStudentDataKeys.PROMISSORY_STORAGE_KEY);
    const STUDENT_FEE_STATUS_KEY = 'ccs.student.feeStatus';

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
            orgId: 'u-org-001'
        },
        {
            id: 'fee-default-gender',
            name: 'Gender Club',
            description: 'Gender Club Membership Fee',
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
            description: 'Muslim Students Association Fee',
            amount: 50,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'voluntary',
            appliesTo: 'Muslim/Islam',
            orgId: 'org-msa-001'
        },
        {
            id: 'fee-default-misc',
            name: 'Miscellaneous',
            description: 'Miscellaneous Supplies',
            amount: 60,
            dueDate: '2026-02-15',
            isActive: true,
            feeType: 'mandatory',
            appliesTo: 'all',
            orgId: 'u-org-001'
        }
    ];

    let selectedFee = null;

    function getCurrentUser() {
        return window.Auth && typeof window.Auth.getUser === 'function'
            ? window.Auth.getUser()
            : null;
    }

    function readJsonArray(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function readJsonObject(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '{}');
            return parsed && typeof parsed === 'object' ? parsed : {};
        } catch (_err) {
            return {};
        }
    }

    function formatCurrency(value) {
        return new Intl.NumberFormat('en-PH', {
            style: 'currency',
            currency: 'PHP'
        }).format(Number(value) || 0);
    }

    function formatDueDate(value) {
        if (!value) return '-';
        const parsed = new Date(value);
        if (Number.isNaN(parsed.getTime())) return value;
        return parsed.toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' });
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

        // Handle Muslim/Islam comparison - normalize both sides
        if (appliesTo === 'muslim') {
            return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
        }

        return studentReligion === appliesTo;
    }

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
            orgId: fee.orgId || 'u-org-001'
        };
    }

    function readJsonArray(key) {
        try {
            const parsed = JSON.parse(localStorage.getItem(key) || '[]');
            return Array.isArray(parsed) ? parsed : [];
        } catch (_err) {
            return [];
        }
    }

    function getFees() {
        const stored = readJsonArray(FEES_STORAGE_KEY).map(normalizeFee);
        const source = stored.length ? stored : DEFAULT_FEES.map(normalizeFee);
        const user = getCurrentUser();
        return source.filter(function (fee) {
            return fee.isActive && String(fee.name || '').toLowerCase() !== 'insurance' && feeAppliesToStudent(fee, user);
        });
    }

    function getStudentRequests(studentId) {
        if (!window.getStudentPromissoryRequests) return [];
        return window.getStudentPromissoryRequests(studentId);
    }

    function getLatestRequestByFee(studentId) {
        const latestByFee = new Map();
        getStudentRequests(studentId).forEach(function (request) {
            const existing = latestByFee.get(request.feeId);
            if (!existing) {
                latestByFee.set(request.feeId, request);
                return;
            }
            const existingTime = new Date(existing.updatedAt || existing.createdAt || 0).getTime();
            const requestTime = new Date(request.updatedAt || request.createdAt || 0).getTime();
            if (requestTime >= existingTime) {
                latestByFee.set(request.feeId, request);
            }
        });
        return latestByFee;
    }

    function statusKey(studentId, feeId) {
        return `${studentId}::${feeId}`;
    }

    function getFeeStatusMap() {
        return readJsonObject(STUDENT_FEE_STATUS_KEY);
    }

    function getPromissoryBadge(request) {
        if (!request) return '';
        if (request.status === 'Pending Review') {
            return '<span class="fee-pill fee-pill-pending-review">Promissory Pending</span>';
        }
        if (request.status === 'Promissory Approved') {
            return '<span class="fee-pill fee-pill-promissory-approved">Promissory Approved</span>';
        }
        if (request.status === 'Promissory Rejected') {
            return '<span class="fee-pill fee-pill-promissory-rejected">Promissory Rejected</span>';
        }
        return '';
    }

    function updateClearanceProgress(fees, latestRequestByFee, studentId) {
        const allPayments = JSON.parse(localStorage.getItem('ccs.student.payments') || '[]');
        const confirmedPayments = allPayments.filter(function (p) {
            return String(p.studentId || p.studentNo) === String(studentId) &&
                   String(p.status).toLowerCase() === 'confirmed';
        });

        const mandatoryFees = fees.filter(function (fee) {
            return fee.feeType !== 'voluntary';
        });

        let completed = 0;
        mandatoryFees.forEach(function (fee) {
            const feeConfirmed = confirmedPayments.some(function (p) {
                const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                return feeIds.some(function (fid) { return String(fid) === String(fee.id); });
            });
            const request = latestRequestByFee.get(fee.id);
            const promissoryApproved = request && request.status === 'Promissory Approved';
            if (feeConfirmed || promissoryApproved) completed += 1;
        });

        const total = mandatoryFees.length;
        const pending = Math.max(total - completed, 0);
        const percentage = total > 0 ? Math.round((completed / total) * 100) : 100;

        const circumference = 251.2;
        const filled = (percentage / 100) * circumference;

        document.querySelector('.labels .completed h1').textContent = String(completed);
        document.querySelector('.labels .pending h1').textContent = String(pending);
        document.querySelector('.clearance-content.progress p').textContent = `${completed} of ${total} Requirements Completed`;

        document.querySelector('.progress-circle-wrapper circle:nth-child(2)')
            ?.setAttribute('stroke-dasharray', `${filled} ${circumference}`);
        document.querySelector('.progress-circle-wrapper text').textContent = `${percentage}%`;
    }


    function renderOutstandingFees() {
        const user = getCurrentUser();
        const studentId = user && user.studentId ? user.studentId : 'anonymous-student';
        const studentName = user && user.name ? user.name : 'Student';
        const fees = getFees();
        const latestRequestByFee = getLatestRequestByFee(studentId);
        const feeStatusMap = getFeeStatusMap();
        const payments = window.getStudentPayments
            ? window.getStudentPayments(studentId)
            : [];
        const listEl = document.getElementById('outstandingFeeList');

        if (!fees.length) {
            listEl.innerHTML = '<li class="fee-empty">No outstanding fees.</li>';
            document.getElementById('outstandingTotal').textContent = formatCurrency(0);
            document.getElementById('outstandingDueLabel').textContent = 'Due: -';
            updateClearanceProgress([], latestRequestByFee, studentId);
            return;
        }

        // compute remaining balances per fee using confirmed payments (with rounding)
        let totalOutstanding = 0;
        const paymentsByFee = {};
        payments.forEach(function (p) {
            try {
                const status = String(p.status || 'Confirmed').toLowerCase();
                if (status !== 'confirmed') return;
                const amt = String(p.amount || '').replace(/[^0-9\.\-]/g, '');
                const amountNum = Number(amt) || 0;
                const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                feeIds.forEach(function (fid) {
                    const key = String(fid || '');
                    if (!key) return;
                    paymentsByFee[key] = (paymentsByFee[key] || 0) + amountNum;
                });
            } catch (e) {}
        });

        fees.forEach(function (fee) {
            const key = String(fee.id || '');
            const paid = Math.round((paymentsByFee[key] || 0) * 100) / 100;

            // Check for promissory request for this fee
            const promissoryRequests = readJsonArray('ccs.promissory.requests') || [];
            const feePromissoryRequests = promissoryRequests.filter(function (req) {
                return String(req.feeId || '') === key && String(req.studentId || '') === studentId;
            });
            const latestPromissory = feePromissoryRequests.length > 0
                ? feePromissoryRequests.sort(function(a, b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); })[0]
                : null;
            const promStatus = latestPromissory ? String(latestPromissory.status || '').toLowerCase() : null;

            // Calculate remaining based on promissory status
            let displayAmount = Number(fee.amount) || 0;
            if (promStatus === 'promissory approved' && latestPromissory.partialAmount) {
                displayAmount = Math.max(displayAmount - Number(latestPromissory.partialAmount), 0);
            }
            const remaining = Math.max(Math.round((displayAmount - paid) * 100) / 100, 0);

            // Check if this fee has a pending verification payment
            const hasPendingVerification = payments.some(function (p) {
                const status = String(p.status || '').toLowerCase();
                if (status !== 'pending verification') return false;
                const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                return feeIds.some(function (fid) { return String(fid || '') === key; });
            });

            // Only add to total if NOT pending verification and NOT pending review promissory
            if (!hasPendingVerification && promStatus !== 'pending review') {
                totalOutstanding += remaining;
            }
        });

        // Round total outstanding to 2 decimals
        totalOutstanding = Math.round(totalOutstanding * 100) / 100;

        const earliestDue = fees
            .map(function (fee) { return fee.dueDate; })
            .filter(Boolean)
            .sort()[0];

        document.getElementById('outstandingTotal').textContent = formatCurrency(totalOutstanding);
        document.getElementById('outstandingDueLabel').textContent = `Due: ${formatDueDate(earliestDue)}`;

        listEl.innerHTML = fees.map(function (fee) {
            // compute paid/remaining first to check if we should hide this fee
            const key = String(fee.id || '');
            const byId = paymentsByFee[key] || 0;
            const paidAmount = Math.max(byId, 0);
            const feeAmount = Number(fee.amount) || 0;

            // Check for promissory request for this fee
            const promissoryRequests = readJsonArray('ccs.promissory.requests') || [];
            const feePromissoryRequests = promissoryRequests.filter(function (req) {
                return String(req.feeId || '') === key && String(req.studentId || '') === studentId;
            });
            const latestPromissory = feePromissoryRequests.length > 0
                ? feePromissoryRequests.sort(function(a, b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); })[0]
                : null;
            const promStatus = latestPromissory ? String(latestPromissory.status || '').toLowerCase() : null;
            const isPendingReview = promStatus === 'pending review';
            const isPromissoryApproved = promStatus === 'promissory approved';
            const isPromissoryRejected = promStatus === 'promissory rejected';

            // Calculate display amount and remaining
            let displayAmount = feeAmount;
            if (isPromissoryApproved && latestPromissory && latestPromissory.partialAmount) {
                displayAmount = Math.max(feeAmount - Number(latestPromissory.partialAmount), 0);
            }
            const remainingAmount = Math.max(Math.round((displayAmount - paidAmount) * 100) / 100, 0);

            // HIDE FULLY PAID FEES ENTIRELY (unless they have pending promissory)
            if (remainingAmount <= 0 && !isPendingReview) {
                return '';
            }

            const typeClass = fee.feeType === 'voluntary' ? 'fee-pill-optional' : 'fee-pill-required';
            const typeText = fee.feeType === 'voluntary' ? 'Optional' : 'Required';
            const feeStatus = feeStatusMap[statusKey(studentId, fee.id)] || '';
            const paidBadge = feeStatus === 'paid' ? '<span class="fee-pill fee-pill-paid">Paid</span>' : '';
            const pendingVerificationBadge = feeStatus === 'pending verification' ? '<span class="fee-pill fee-pill-pending-review">Pending Verification</span>' : '';
            const rejectedPayment = payments.find(function (payment) {
                const feeIds = Array.isArray(payment.feeIds) ? payment.feeIds : (payment.feeId ? [payment.feeId] : []);
                return String(payment.status || '').toLowerCase() === 'rejected' && feeIds.some(function (feeId) {
                    return String(feeId || '') === String(fee.id);
                });
            });
            const rejectedBadge = feeStatus === 'rejected' ? '<span class="fee-pill fee-pill-promissory-rejected">Rejected</span>' : '';
            const rejectionReason = rejectedPayment && rejectedPayment.rejectionReason ? `<div class="payment-rejection-reason">${rejectedPayment.rejectionReason}</div>` : '';

            // Determine which badge to show based on promissory status
            let promissoryBadge = '';
            if (isPendingReview) {
                promissoryBadge = '<span class="fee-pill fee-pill-pending-review">PROMISSORY PENDING</span>';
            } else if (isPromissoryApproved) {
                promissoryBadge = '<span class="fee-pill fee-pill-promissory-approved">PROMISSORY APPROVED</span>';
            }

            // Build promissory status row
            let promissoryStatusRow = '';
            if (promissoryBadge) {
                promissoryStatusRow = `<div class="fee-status-row">${promissoryBadge}</div>`;
            }

            // Check if this fee has a pending verification payment
            const hasPendingVerification = payments.some(function (p) {
                const status = String(p.status || '').toLowerCase();
                if (status !== 'pending verification') return false;
                const feeIds = Array.isArray(p.feeIds) ? p.feeIds : (p.feeId ? [p.feeId] : []);
                return feeIds.some(function (fid) { return String(fid || '') === String(fee.id); });
            });

            // Build buttons/links row based on promissory and payment status
            let buttonsRow = '';
            if (hasPendingVerification) {
                // Do nothing - just show the badge
            } else if (isPendingReview) {
                // Hide Pay Now and Request promissory
            } else if (isPromissoryApproved || isPromissoryRejected) {
                // Show Pay Now for approved or rejected
                if (!paidBadge) {
                    buttonsRow += `<button type="button" class="pay-now-btn" data-fee-id="${fee.id}" data-fee-name="${fee.name}" data-fee-amount="${fee.amount}" data-org-id="${fee.orgId || 'u-org-001'}">Pay Now</button>`;
                }
            } else {
                // No promissory request - show Pay Now
                if (!paidBadge) {
                    buttonsRow += `<button type="button" class="pay-now-btn" data-fee-id="${fee.id}" data-fee-name="${fee.name}" data-fee-amount="${fee.amount}" data-org-id="${fee.orgId || 'u-org-001'}">Pay Now</button>`;
                }
            }

            // Show "Request promissory note" only if no promissory request or rejected
            if (!isPendingReview && !isPromissoryApproved && !isPromissoryRejected && !hasPendingVerification) {
                buttonsRow += `<a class="promissory-link fee-action-promissory" data-fee-id="${fee.id}" data-fee-name="${fee.name}" data-student-id="${studentId}" data-student-name="${studentName}">Request promissory note</a>`;
            }

            // show partially paid indicator
            const partialPaidIndicator = paidAmount > 0 && remainingAmount > 0
                ? `<div class="fee-partial">Partially paid: ${formatCurrency(paidAmount)}</div>`
                : '';

            return `
<li data-fee-id="${fee.id}">
<div class="fee-line">
<div class="fee-line-left">
<span class="fee-name">${fee.name}</span>
<span class="fee-pill ${typeClass}">${typeText}</span>
${paidBadge}
${pendingVerificationBadge}
${rejectedBadge}
</div>
<span class="fee-amount">${formatCurrency(remainingAmount)}</span>
</div>
${promissoryStatusRow}
${partialPaidIndicator}
${rejectionReason}
<div class="fee-actions-row">${buttonsRow}</div>
</li>
`;
        }).filter(Boolean).join('');

        updateClearanceProgress(fees, latestRequestByFee, studentId);

        document.querySelectorAll('.pay-now-btn').forEach(function (button) {
            button.addEventListener('click', function () {
                const feeId = button.dataset.feeId;
                const feeObj = fees.find(function (f) { return String(f.id) === String(feeId); }) || {};
                const feeAmount = Number(feeObj.amount) || 0;

                // compute paid for this fee (confirmed payments only)
                const byId = paymentsByFee[String(feeId)] || 0;
                const byName = paymentsByFee[String(feeObj.name || '').toLowerCase()] || 0;
                const paidAmount = Math.max(byId, byName, 0);

                // Check for approved promissory and calculate remaining
                const promissoryRequests = readJsonArray('ccs.promissory.requests') || [];
                const feePromissoryRequests = promissoryRequests.filter(function (req) {
                    return String(req.feeId || '') === String(feeId) && String(req.studentId || '') === studentId;
                });
                const latestPromissory = feePromissoryRequests.length > 0
                    ? feePromissoryRequests.sort(function(a, b) { return new Date(b.updatedAt || b.createdAt || 0) - new Date(a.updatedAt || a.createdAt || 0); })[0]
                    : null;

                let remaining = Math.max(feeAmount - paidAmount, 0);
                let prefill = remaining;

                if (latestPromissory && String(latestPromissory.status || '').toLowerCase() === 'promissory approved' && latestPromissory.partialAmount) {
                    const partialAmount = Number(latestPromissory.partialAmount) || 0;
                    remaining = Math.max(feeAmount - partialAmount - paidAmount, 0);
                    prefill = Math.min(partialAmount, remaining);
                }

                remaining = Math.round(remaining * 100) / 100;
                prefill = Math.round(prefill * 100) / 100;

                const selectedFee = [{
                    feeId: feeId,
                    fee: button.dataset.feeName,
                    price: Number(prefill) || 0,
                    orgId: button.dataset.orgId || 'u-org-001'
                }];
                localStorage.setItem('ccs.selected.fees', JSON.stringify(selectedFee));
                window.location.href = 'make-payment.html';
            });
        });

        document.querySelectorAll('.fee-action-promissory').forEach(function (button) {
            button.addEventListener('click', function () {
                if (button.getAttribute('aria-disabled') === 'true') {
                    return;
                }
                selectedFee = {
                    feeId: button.dataset.feeId,
                    feeName: button.dataset.feeName,
                    studentId: button.dataset.studentId,
                    studentName: button.dataset.studentName,
                    studentNumber: button.dataset.studentId
                };
                openPromissoryModal();
            });
        });
    }

    function openPromissoryModal() {
        if (!selectedFee) return;
        document.getElementById('promissoryFeeName').value = selectedFee.feeName;
        document.getElementById('promissoryReason').value = '';
        document.getElementById('promissoryDate').value = '';

        // Set min date to today and max date to semester end date
        const today = new Date().toISOString().slice(0, 10);
        const academicSettings = JSON.parse(localStorage.getItem('ccs.academic.settings') || '{}');
        const semesterEndDate = academicSettings.endDate || '';

        const promisedDateInput = document.getElementById('promissoryDate');
        if (promisedDateInput) {
            promisedDateInput.min = today;
            if (semesterEndDate) {
                promisedDateInput.max = semesterEndDate;
            } else {
                // Fallback: try to get end date from current semester
                const currentSemester = window.SemesterManager && window.SemesterManager.getCurrentSemester ? window.SemesterManager.getCurrentSemester() : null;
                if (currentSemester && currentSemester.endDate) {
                    promisedDateInput.max = currentSemester.endDate;
                }
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
        selectedFee = null;
    }

    function submitPromissoryRequest() {
        if (!selectedFee) return;

        const reason = document.getElementById('promissoryReason').value.trim();
        const promisedDate = document.getElementById('promissoryDate').value;

        if (!reason || !promisedDate) {
            alert('Please complete the required fields.');
            return;
        }

        if (!PROMISSORY_STORAGE_KEY) {
            alert('Promissory storage is unavailable. Please refresh and try again.');
            return;
        }

        // Get the fee object to extract orgId
        const fees = getFees();
        const feeObj = fees.find(function (f) { return String(f.id || '') === String(selectedFee.feeId); }) || {};
        const orgId = feeObj.orgId || selectedFee.orgId || 'u-org-001';

        const requests = readJsonArray(PROMISSORY_STORAGE_KEY);
        const newRequest = {
            id: 'promissory-' + Date.now(),
            feeId: selectedFee.feeId,
            feeName: selectedFee.feeName,
            studentId: selectedFee.studentId,
            studentNumber: selectedFee.studentNumber,
            studentName: selectedFee.studentName,
            amount: feeObj.amount || null,
            partialAmount: partialAmount,
            reason: reason,
            promisedDate: promisedDate,
            dateRequested: new Date().toISOString().split('T')[0],
            status: 'Pending Review',
            orgId: orgId,
            createdAt: new Date().toISOString(),
            updatedAt: new Date().toISOString()
        };

        requests.push(newRequest);
        localStorage.setItem(PROMISSORY_STORAGE_KEY, JSON.stringify(requests));
        closePromissoryModal();
        renderOutstandingFees();
    }

    document.getElementById('promissoryCloseBtn').addEventListener('click', closePromissoryModal);
    document.getElementById('promissoryCancelBtn').addEventListener('click', closePromissoryModal);
    document.getElementById('promissorySubmitBtn').addEventListener('click', submitPromissoryRequest);
    document.getElementById('promissoryModal').addEventListener('click', function (event) {
        if (event.target === this) {
            closePromissoryModal();
        }
    });

    // Payments filter dropdown handler
    const paymentsFilterSelect = document.getElementById('payments-filter');
    const paymentsListContainer = document.getElementById('payments-list-container');

    function renderStudentPaymentsInPanel(filterValue) {
        const user = getCurrentUser();
        const studentId = user && user.studentId ? user.studentId : null;

        if (!studentId) {
            paymentsListContainer.innerHTML = '<p class="summary-empty">Unable to load payment history</p>';
            return;
        }

        const allPayments = window.getStudentPayments ? window.getStudentPayments(studentId) : [];

        const filteredPayments = allPayments.filter(function (payment) {
            const paymentStatus = String(payment.status || 'Confirmed').toLowerCase();

            if (filterValue === 'pending') {
                return paymentStatus === 'pending verification';
            }

            if (filterValue === 'recent') {
                // Show all confirmed payments (no 30-day cutoff)
                return paymentStatus === 'confirmed';
            }

            // Default/all: show all confirmed payments
            return paymentStatus === 'confirmed';
        });

        if (!filteredPayments.length) {
            paymentsListContainer.innerHTML = filterValue === 'pending'
                ? '<p class="summary-empty">No pending payments</p>'
                : '<p class="summary-empty">No payments found</p>';
            return;
        }

        let html = '<table class="payments-table" style="width: 100%; font-size: 12px; border-collapse: collapse;">';
        html += '<thead style="background: #f5f5f5;"><tr>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Fee Name</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Amount</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>';
        html += '</tr></thead><tbody>';

        filteredPayments.forEach(function (payment) {
            const paymentDate = payment.dateSubmitted || payment.date || '-';
            const amount = payment.amount ? `₱${Number(String(payment.amount).replace(/[^0-9.\-]/g, '') || 0).toFixed(2)}` : '₱0.00';
            const statusText = String(payment.status || 'Confirmed');

            html += '<tr style="border-bottom: 1px solid #eee;">';
            html += `<td style="padding: 8px;">${payment.feeName || payment.desc || 'Payment'}</td>`;
            html += `<td style="padding: 8px; font-size: 11px; color: #666;">${paymentDate}</td>`;
            html += `<td style="padding: 8px;">${amount}</td>`;
            html += `<td style="padding: 8px; font-size: 11px;">${statusText}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        paymentsListContainer.innerHTML = html;
    }

    function renderPromissoryNotesInPanel() {
        const user = getCurrentUser();
        const studentId = user && user.studentId ? user.studentId : null;
        const studentReligion = user && user.religion ? String(user.religion || '').trim().toLowerCase() : '';

        if (!studentId) {
            paymentsListContainer.innerHTML = '<p class="summary-empty">Unable to load promissory notes</p>';
            return;
        }

        const studentRequests = window.getStudentPromissoryRequests ? window.getStudentPromissoryRequests(studentId) : [];
        const filteredRequests = studentRequests.filter(function (req) {
            if (String(req.feeName || '').toLowerCase().includes('msa')) {
                return studentReligion === 'muslim' || studentReligion === 'muslim/islam';
            }
            return true;
        });

        if (filteredRequests.length === 0) {
            paymentsListContainer.innerHTML = '<p class="summary-empty">No promissory note requests</p>';
            return;
        }

        let html = '<table class="payments-table" style="width: 100%; font-size: 12px; border-collapse: collapse;">';
        html += '<thead style="background: #f5f5f5;"><tr>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Fee Name</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Amount</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Date Requested</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Reason</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Promised Date</th>';
        html += '<th style="padding: 8px; text-align: left; border-bottom: 1px solid #ddd;">Status</th>';
        html += '</tr></thead><tbody>';

        filteredRequests.forEach(function (req) {
            const createdDate = req.createdAt ? new Date(req.createdAt).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
            const promisedDate = req.promisedDate ? new Date(req.promisedDate + 'T00:00:00').toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) : '-';
            const amount = req.partialAmount ? `₱${Number(req.partialAmount).toFixed(2)}` : (function () {
                try {
                    const fees = JSON.parse(localStorage.getItem('ccs.organization.fees') || '[]');
                    const found = fees.find(function (fee) { return String(fee.id || '') === String(req.feeId || ''); }) || fees.find(function (fee) { return String(fee.name || '').toLowerCase() === String(req.feeName || '').toLowerCase(); });
                    return found ? `₱${Number(found.amount || 0).toFixed(2)}` : 'Full Payment';
                } catch (_error) {
                    return 'Full Payment';
                }
            })();
            const statusText = req.status || 'Pending Review';

            html += '<tr style="border-bottom: 1px solid #eee;">';
            html += `<td style="padding: 8px;">${String(req.feeName || '').substring(0, 20)}</td>`;
            html += `<td style="padding: 8px;">${amount}</td>`;
            html += `<td style="padding: 8px; font-size: 11px; color: #666;">${createdDate}</td>`;
            html += `<td style="padding: 8px; font-size: 11px; max-width: 150px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap;" title="${req.reason}">${String(req.reason || '').substring(0, 20)}</td>`;
            html += `<td style="padding: 8px; font-size: 11px; color: #666;">${promisedDate}</td>`;
            html += `<td style="padding: 8px;">${statusText}</td>`;
            html += '</tr>';
        });

        html += '</tbody></table>';
        paymentsListContainer.innerHTML = html;
    }

    if (paymentsFilterSelect) {
        paymentsFilterSelect.addEventListener('change', function () {
            const filterValue = this.value;
            if (filterValue === 'promissory') {
                renderPromissoryNotesInPanel();
            } else {
                renderStudentPaymentsInPanel(filterValue);
            }
        });

        // Initialize with 'recent' filter to show confirmed payments from last 30 days
        const initialFilter = paymentsFilterSelect.value || 'recent';
        renderStudentPaymentsInPanel(initialFilter);
    }

    // Expose for external calls
    window.renderStudentFees = renderOutstandingFees;

    renderOutstandingFees();
})();




/* First Login Modal Logic */
(function () {
    const firstLoginModal = document.getElementById('firstLoginModal');
    const firstLoginForm = document.getElementById('firstLoginForm');
    const profileReligion = document.getElementById('profileReligion');
    const profilePhoneNumber = document.getElementById('profilePhoneNumber');
    const religionError = document.getElementById('religionError');

    function showFirstLoginModal() {
        const user = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : null;
        if (user && user.isFirstLogin === true) {
            firstLoginModal.classList.add('show');
            firstLoginModal.setAttribute('aria-hidden', 'false');
            // Prevent interactions with page content behind the modal
            document.body.style.overflow = 'hidden';
        }
    }

    function closeFirstLoginModal() {
        firstLoginModal.classList.remove('show');
        firstLoginModal.setAttribute('aria-hidden', 'true');
        document.body.style.overflow = '';
    }

    function handleFormSubmit(event) {
        event.preventDefault();

        const selectedReligion = profileReligion.value.trim();
        const phoneNumber = profilePhoneNumber.value.trim();

        // Clear previous error
        religionError.classList.remove('show');
        religionError.textContent = '';

        // Validate religion
        if (!selectedReligion) {
            religionError.textContent = 'Religion is required';
            religionError.classList.add('show');
            return;
        }

        // Save profile data
        if (window.Auth && typeof window.Auth.updateCurrentUserProfile === 'function') {
            const result = window.Auth.updateCurrentUserProfile({
                religion: selectedReligion,
                phoneNumber: phoneNumber,
                isFirstLogin: false
            });

            if (result.ok) {
                closeFirstLoginModal();
                // Re-render fees based on new religion
                if (typeof window.renderStudentFees === 'function') {
                    window.renderStudentFees();
                }
            } else {
                religionError.textContent = 'Failed to save profile. Please try again.';
                religionError.classList.add('show');
            }
        }
    }

    // Event listeners
    firstLoginForm.addEventListener('submit', handleFormSubmit);

    // Show modal on page load if needed
    document.addEventListener('DOMContentLoaded', showFirstLoginModal);

    // Also try to show it if DOM is already loaded
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', showFirstLoginModal);
    } else {
        showFirstLoginModal();
    }
})();

/* Update dashboard and sidebar with logged-in student info */
(function () {
    function updateStudentInfo() {
        const user = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : null;
        if (!user) return;

        // Update dashboard welcome message
        const welcomeEl = document.getElementById('dashboardWelcome');
        if (welcomeEl) {
            welcomeEl.textContent = `Welcome back, ${user.name || 'Student'}!`;
        }

        // Update sidebar profile name and student ID
        const profileNameEl = document.getElementById('sidebarProfileName');
        const studentIdEl = document.getElementById('sidebarStudentId');
        if (profileNameEl) {
            profileNameEl.textContent = user.name || 'Student';
        }
        if (studentIdEl) {
            studentIdEl.textContent = user.studentId || '0000000000';
        }
    }

    // Update on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', updateStudentInfo);
    } else {
        updateStudentInfo();
    }
})();

/* Notification system */
(function () {
    let currentStudentId = null;

    function getNotifKey(studentId) {
        return 'ccs.notifications.' + studentId;
    }

    function getNotifications(studentId) {
        return JSON.parse(localStorage.getItem(getNotifKey(studentId)) || '[]');
    }

    function saveNotifications(studentId, notifs) {
        localStorage.setItem(getNotifKey(studentId), JSON.stringify(notifs));
    }

    function renderNotifications(studentId) {
        const notifs = getNotifications(studentId);
        const list = document.getElementById('notifList');
        const badge = document.querySelector('.notif-badge');

        const unread = notifs.filter(n => !n.read).length;
        if (badge) badge.textContent = unread > 0 ? unread : '';
        if (badge) badge.style.display = unread > 0 ? 'inline-flex' : 'none';

        if (!notifs.length) {
            list.innerHTML = '<div class="notif-empty">No notifications</div>';
            return;
        }

        list.innerHTML = notifs.map(n => `
<div class="notif-item ${n.read ? '' : 'unread'}" data-id="${n.id}">
<div class="notif-item-title">${n.title}</div>
<div class="notif-item-body">${n.body}</div>
<div class="notif-item-time">${new Date(n.createdAt).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}</div>
${n.type === 'org_role_offer' && !n.resolved ? `
<div class="notif-item-actions">
<button class="notif-btn-accept" data-notif-id="${n.id}" data-org-id="${n.orgId}">Accept</button>
<button class="notif-btn-decline" data-notif-id="${n.id}" data-org-id="${n.orgId}">Decline</button>
</div>
` : ''}
</div>
`).join('');

        notifs.forEach(n => n.read = true);
        saveNotifications(studentId, notifs);

        list.querySelectorAll('.notif-btn-accept').forEach(btn => {
            btn.addEventListener('click', function() {
                const orgId = this.dataset.orgId;
                const notifId = this.dataset.notifId;
                acceptOrgRoleOffer(studentId, orgId, notifId);
            });
        });

        list.querySelectorAll('.notif-btn-decline').forEach(btn => {
            btn.addEventListener('click', function() {
                const orgId = this.dataset.orgId;
                const notifId = this.dataset.notifId;
                declineOrgRoleOffer(studentId, orgId, notifId);
            });
        });
    }

    function acceptOrgRoleOffer(studentId, orgId, notifId) {
        const orgs = JSON.parse(localStorage.getItem('ccs.organizations') || '[]');
        const org = orgs.find(o => o.id === orgId);
        if (!org || !org.pendingHandover) return;

        const oldHeadAccount = (window.SAMPLE_ACCOUNTS || []).find(a => a.id === org.head);
        if (oldHeadAccount) oldHeadAccount.permissions.organizationView = false;

        const newHeadAccount = (window.SAMPLE_ACCOUNTS || []).find(a => a.studentId === studentId);
        if (newHeadAccount) newHeadAccount.permissions.organizationView = true;

        org.head = newHeadAccount ? newHeadAccount.id : org.pendingHandover.toStudentId;
        org.pendingHandover = null;
        localStorage.setItem('ccs.organizations', JSON.stringify(orgs));

        const notifs = getNotifications(studentId);
        const n = notifs.find(n => n.id === notifId);
        if (n) { n.resolved = true; n.read = true; }
        saveNotifications(studentId, notifs);

        const logs = JSON.parse(localStorage.getItem('ccs.audit.logs') || '[]');
        logs.unshift({
            id: 'LOG-' + Date.now(),
            timestamp: new Date().toLocaleString(),
            user: newHeadAccount ? newHeadAccount.name : studentId,
            action: 'Org Role Accepted',
            details: `Accepted org head role for ${org.name}`,
            type: 'info'
        });
        localStorage.setItem('ccs.audit.logs', JSON.stringify(logs));

        renderNotifications(studentId);
        alert('You are now the head of ' + org.name + '. Please log out and log back in to access the org dashboard.');
    }

    function declineOrgRoleOffer(studentId, orgId, notifId) {
        const orgs = JSON.parse(localStorage.getItem('ccs.organizations') || '[]');
        const org = orgs.find(o => o.id === orgId);
        if (org) { org.pendingHandover = null; }
        localStorage.setItem('ccs.organizations', JSON.stringify(orgs));

        const notifs = getNotifications(studentId);
        const n = notifs.find(n => n.id === notifId);
        if (n) { n.resolved = true; n.read = true; n.body += ' (Declined)'; }
        saveNotifications(studentId, notifs);

        renderNotifications(studentId);
        alert('Role offer declined.');
    }

    document.querySelector('.notif-bell').addEventListener('click', function(e) {
        e.stopPropagation();
        const dropdown = document.getElementById('notifDropdown');
        const isOpen = dropdown.style.display !== 'none';
        dropdown.style.display = isOpen ? 'none' : 'block';
        if (!isOpen) renderNotifications(currentStudentId);
    });

    document.addEventListener('click', function() {
        const dropdown = document.getElementById('notifDropdown');
        if (dropdown) dropdown.style.display = 'none';
    });

    document.getElementById('notifMarkAll')?.addEventListener('click', function(e) {
        e.stopPropagation();
        const notifs = getNotifications(currentStudentId);
        notifs.forEach(n => n.read = true);
        saveNotifications(currentStudentId, notifs);
        renderNotifications(currentStudentId);
    });

    function initNotifications() {
        const user = window.Auth && typeof window.Auth.getUser === 'function' ? window.Auth.getUser() : null;
        if (user && user.studentId) {
            currentStudentId = user.studentId;
            renderNotifications(currentStudentId);
        }
    }

    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', initNotifications);
    } else {
        initNotifications();
    }
})();
