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
            
            function getOrgSystemTotal() {
                const currentOrgId = getCurrentOrgId();
                const payments = window.CCSPaymentStore && typeof window.CCSPaymentStore.getPaymentsForOrg === 'function'
                    ? window.CCSPaymentStore.getPaymentsForOrg(currentOrgId)
                    : [];
                const confirmedPayments = payments.filter(function (payment) {
                    return String(payment.status || 'Confirmed') === 'Confirmed';
                });
                const total = confirmedPayments.reduce(function (sum, payment) {
                    const amount = String(payment.amount || '₱0').replace(/[^\d.-]/g, '');
                    return sum + (Number(amount) || 0);
                }, 0);
                return Math.round(total * 100) / 100;
            }
            
            function initializeCollectionPage() {
                const orgName = getCurrentOrgName();
                const orgHeaderName = document.getElementById('collectionOrgName');
                const printHeaderTitle = document.getElementById('printHeaderTitle');
                
                if (orgHeaderName) {
                    orgHeaderName.textContent = orgName;
                }
                if (printHeaderTitle) {
                    printHeaderTitle.textContent = orgName + ' - Collection Report';
                }
            }
            
            document.getElementById('collectionDate').valueAsDate = new Date();
            let SYSTEM_TOTAL = getOrgSystemTotal();
            
            window.addEventListener('load', function() {
                initializeCollectionPage();
                SYSTEM_TOTAL = getOrgSystemTotal();
                document.getElementById('systemTotal').textContent = '₱' + Number(SYSTEM_TOTAL).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                document.getElementById('compSystemTotal').textContent = '₱' + Number(SYSTEM_TOTAL).toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
            });

            function computeTotals() {
                const inputs = document.querySelectorAll('.denomination-input');
                let grandTotal = 0;
                inputs.forEach(input => {
                    const count = parseInt(input.value) || 0;
                    const value = parseInt(input.getAttribute('data-value'));
                    const rowTotal = count * value;
                    grandTotal += rowTotal;
                    const totalId = 'total' + input.id.replace('bill', '').replace('coin', '');
                    const totalElement = document.getElementById(totalId);
                    if (totalElement) totalElement.textContent = '₱' + rowTotal.toLocaleString('en-PH');
                    const printElement = document.getElementById('print-' + input.id);
                    if (printElement) printElement.textContent = count;
                });
                document.getElementById('grandTotal').textContent = '₱' + grandTotal.toLocaleString('en-PH');
                document.getElementById('totalCounted').textContent = '₱' + grandTotal.toLocaleString('en-PH');
                document.getElementById('compTotalCounted').textContent = '₱' + grandTotal.toLocaleString('en-PH', {minimumFractionDigits: 2, maximumFractionDigits: 2});
                const difference = SYSTEM_TOTAL - grandTotal;
                const differenceText = '₱' + Math.abs(difference).toLocaleString('en-PH');
                const differenceDisplay = difference >= 0 ? differenceText : '-' + differenceText;
                document.getElementById('difference').textContent = differenceDisplay;
                document.getElementById('compDifference').textContent = differenceDisplay;
                const statusBadge = document.getElementById('statusBadge');
                if (difference === 0) {
                    statusBadge.textContent = 'MATCHED';
                    statusBadge.className = 'status-badge status-matched';
                } else {
                    statusBadge.textContent = 'DISCREPANCY';
                    statusBadge.className = 'status-badge status-discrepancy';
                }
                return { grandTotal, difference };
            }

            document.querySelectorAll('.denomination-input').forEach(input => {
                input.addEventListener('input', computeTotals);
            });

            document.getElementById('clearCollectionBtn').addEventListener('click', function() {
                if (confirm('Are you sure you want to clear all counts?')) {
                    document.querySelectorAll('.denomination-input').forEach(input => input.value = 0);
                    computeTotals();
                    document.getElementById('successSummary').classList.remove('active');
                }
            });

            document.getElementById('saveCollectionBtn').addEventListener('click', function() {
                const collectionDate = document.getElementById('collectionDate').value;
                if (!collectionDate) { alert('Please select a collection date.'); return; }
                const { grandTotal, difference } = computeTotals();
                const dateStr = new Date(collectionDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                let userName = 'Admin User';
                if (window.Auth && typeof window.Auth.getUser === 'function') {
                    const user = window.Auth.getUser();
                    if (user && user.name) userName = user.name;
                }
                document.getElementById('savedDate').textContent = dateStr;
                document.getElementById('savedCounted').textContent = '₱' + grandTotal.toLocaleString('en-PH');
                document.getElementById('savedStatus').textContent = difference === 0 ? 'MATCHED' : 'DISCREPANCY';
                document.getElementById('savedPreparedBy').textContent = userName;
                document.getElementById('successSummary').classList.add('active');
                document.getElementById('successSummary').scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            });

            function printCollection() {
                const collectionDate = document.getElementById('collectionDate').value;
                if (!collectionDate) { alert('Please select a collection date.'); return; }
                const { grandTotal, difference } = computeTotals();
                const dateStr = new Date(collectionDate + 'T00:00:00').toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
                let userName = 'Admin User';
                if (window.Auth && typeof window.Auth.getUser === 'function') {
                    const user = window.Auth.getUser();
                    if (user && user.name) userName = user.name;
                }
                document.getElementById('printDateHeader').textContent = dateStr;
                document.getElementById('printPreparedBy').textContent = userName;
                document.getElementById('printTotalCounted').textContent = '₱' + grandTotal.toLocaleString('en-PH');
                const differenceText = '₱' + Math.abs(difference).toLocaleString('en-PH');
                document.getElementById('printDifference').textContent = difference >= 0 ? differenceText : '-' + differenceText;
                document.getElementById('printStatus').textContent = difference === 0 ? 'MATCHED' : 'DISCREPANCY';
                window.print();
            }

            document.getElementById('printCollectionBtn2').addEventListener('click', printCollection);
            document.getElementById('printSavedCollectionBtn')
                .addEventListener('click', printCollection);
