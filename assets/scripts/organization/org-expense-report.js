const addExpenseModal = document.getElementById('addExpenseModal');
const editExpenseModal = document.getElementById('editExpenseModal');
const voidExpenseModal = document.getElementById('voidExpenseModal');
const successMessage = document.getElementById('successMessage');
const confirmVoidBtn = document.getElementById('confirmVoidBtn');
let activeEditRow = null;
let activeVoidRow = null;

document.getElementById('expenseDate').valueAsDate = new Date();

function formatMoney(value) {
    return '₱' + value.toLocaleString('en-PH', { minimumFractionDigits: 0, maximumFractionDigits: 2 });
}

function parseMoney(text) {
    return parseFloat(String(text).replace(/[^0-9.-]/g, '')) || 0;
}

function adjustTotals(deltaExpenses) {
    const totalExpensesEl = document.getElementById('totalExpenses');
    const remainingBalanceEl = document.getElementById('remainingBalance');
    const totalCollected = parseMoney(document.getElementById('totalCollected').textContent);
    const currentExpenses = parseMoney(totalExpensesEl.textContent);
    const newExpenses = currentExpenses + deltaExpenses;
    const newBalance = totalCollected - newExpenses;
    totalExpensesEl.textContent = formatMoney(newExpenses);
    remainingBalanceEl.textContent = formatMoney(newBalance);
}

function showSuccessMessage(message) {
    successMessage.textContent = message;
    successMessage.classList.add('active');
    setTimeout(() => successMessage.classList.remove('active'), 3000);
}

function createActionsCell() {
    return '<div class="row-actions"><button class="edit-btn" type="button" onclick="openEditModal(this)">Edit</button><button class="void-btn" type="button" onclick="openVoidModal(this)">Void</button></div>';
}

function closeModal() {
    addExpenseModal.classList.remove('active');
    document.getElementById('expensePurpose').value = '';
    document.getElementById('expenseAmount').value = '';
    document.getElementById('expenseReceipt').value = '';
    document.getElementById('expenseDate').valueAsDate = new Date();
}

function closeEditModal() {
    editExpenseModal.classList.remove('active');
    activeEditRow = null;
}

function closeVoidModal() {
    voidExpenseModal.classList.remove('active');
    activeVoidRow = null;
}

window.openEditModal = function(button) {
    const row = button.closest('tr');
    activeEditRow = row;
    document.getElementById('editExpenseDate').value = row.cells[0].textContent.trim();
    document.getElementById('editExpensePurpose').value = row.cells[1].textContent.trim();
    document.getElementById('editExpenseAmount').value = parseMoney(row.cells[2].textContent);
    document.getElementById('editExpenseReceipt').value = row.cells[3].textContent.trim();
    editExpenseModal.classList.add('active');
};

window.openVoidModal = function(button) {
    const row = button.closest('tr');
    activeVoidRow = row;
    const purpose = row.cells[1].textContent.trim();
    document.getElementById('voidExpenseMessage').textContent = 'Are you sure you want to void "' + purpose + '"? This cannot be undone.';
    voidExpenseModal.classList.add('active');
};

document.getElementById('addExpenseBtn').addEventListener('click', function() {
    addExpenseModal.classList.add('active');
});

document.getElementById('saveExpenseBtn').addEventListener('click', function() {
    const purpose = document.getElementById('expensePurpose').value.trim();
    const amount = parseFloat(document.getElementById('expenseAmount').value);
    const date = document.getElementById('expenseDate').value;
    const receipt = document.getElementById('expenseReceipt').value.trim();
    if (!purpose || !amount || !date || !receipt) return;
    const tbody = document.querySelector('#expenseTable tbody');
    const newRow = tbody.insertRow(0);
    newRow.innerHTML = `
<td>${date}</td>
<td>${purpose}</td>
<td>${formatMoney(amount)}</td>
<td>${receipt}</td>
<td class="no-print">${createActionsCell()}</td>
`;
    adjustTotals(amount);
    closeModal();
    showSuccessMessage('Expense recorded successfully!');
});

document.getElementById('saveEditBtn').addEventListener('click', function() {
    if (!activeEditRow) return;
    const oldAmount = parseMoney(activeEditRow.cells[2].textContent);
    const newDate = document.getElementById('editExpenseDate').value;
    const newPurpose = document.getElementById('editExpensePurpose').value.trim();
    const newAmount = parseFloat(document.getElementById('editExpenseAmount').value);
    const newReceipt = document.getElementById('editExpenseReceipt').value.trim();
    activeEditRow.cells[0].textContent = newDate;
    activeEditRow.cells[1].textContent = newPurpose;
    activeEditRow.cells[2].textContent = formatMoney(newAmount);
    activeEditRow.cells[3].textContent = newReceipt;
    adjustTotals(newAmount - oldAmount);
    closeEditModal();
    showSuccessMessage('Expense updated successfully!');
});

confirmVoidBtn.addEventListener('click', function() {
    if (!activeVoidRow || activeVoidRow.dataset.voided === 'true') {
        closeVoidModal();
        return;
    }
    const amount = parseMoney(activeVoidRow.cells[2].textContent);
    activeVoidRow.dataset.voided = 'true';
    activeVoidRow.style.textDecoration = 'line-through';
    activeVoidRow.style.color = '#9e9e9e';
    activeVoidRow.style.background = '#f5f5f5';
    activeVoidRow.cells[4].innerHTML = '<span class="voided-badge">Voided</span>';
    adjustTotals(-amount);
    closeVoidModal();
    showSuccessMessage('Expense voided successfully!');
});

addExpenseModal.addEventListener('click', function(e) { if (e.target === addExpenseModal) closeModal(); });
editExpenseModal.addEventListener('click', function(e) { if (e.target === editExpenseModal) closeEditModal(); });
voidExpenseModal.addEventListener('click', function(e) { if (e.target === voidExpenseModal) closeVoidModal(); });

document.getElementById('searchBtn').addEventListener('click', function() {
    const searchTerm = document.getElementById('searchInput').value.toLowerCase();
    document.querySelectorAll('#expenseTable tbody tr').forEach(row => {
        const purpose = row.cells[1].textContent.toLowerCase();
        const receipt = row.cells[3].textContent.toLowerCase();
        row.style.display = (purpose.includes(searchTerm) || receipt.includes(searchTerm)) ? '' : 'none';
    });
});

document.getElementById('searchInput').addEventListener('input', function() {
    if (this.value === '') {
        document.querySelectorAll('#expenseTable tbody tr').forEach(row => row.style.display = '');
    }
});

document.getElementById('saveExpenseReportBtn')
    .addEventListener('click', function() {
        const today = new Date();
        const dateStr = today.toLocaleDateString('en-US', {
            year: 'numeric', month: 'long', day: 'numeric'
        });
        let userName = 'Admin User';
        if (window.Auth && typeof window.Auth.getUser === 'function') {
            const user = window.Auth.getUser();
            if (user && user.name) userName = user.name;
        }
        document.getElementById('savedExpenseDate')
            .textContent = dateStr;
        document.getElementById('savedExpenseCollected')
            .textContent = document.getElementById('totalCollected').textContent;
        document.getElementById('savedExpenseTotal')
            .textContent = document.getElementById('totalExpenses').textContent;
        document.getElementById('savedExpenseBalance')
            .textContent = document.getElementById('remainingBalance').textContent;
        document.getElementById('savedExpenseBy')
            .textContent = userName;
        const summary = document.getElementById('expenseReportSummary');
        summary.style.display = 'block';
        summary.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
    });

document.getElementById('printExpenseBtn').addEventListener('click', function() {
    const today = new Date();
    document.getElementById('printDate').textContent = today.toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    window.print();
});

document.getElementById('printSavedExpenseBtn')
    .addEventListener('click', function() {
        const today = new Date();
        document.getElementById('printDate').textContent = 
            today.toLocaleDateString('en-US', { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
            });
        window.print();
    });
