const refNum = localStorage.getItem('ccs.cash.ref') 
    || 'CASH-2026-0000';
const fees = JSON.parse(
    localStorage.getItem('ccs.selected.fees') || '[]'
);
const total = fees.reduce((s, f) => s + f.price, 0);

document.getElementById('cashRefDisplay')
    .textContent = refNum;
document.getElementById('cashRefDisplay2')
    .textContent = refNum;

const tbody = document.getElementById('cash-fee-rows');
tbody.innerHTML = fees.map(f =>
    `<tr>
<td>${f.fee}</td>
<td>₱${f.price}</td>
</tr>`
).join('');
document.getElementById('cash-total')
    .textContent = '₱' + total;

const validDate = new Date();
validDate.setDate(validDate.getDate() + 7);
document.getElementById('validUntil')
    .textContent = validDate.toLocaleDateString(
        'en-US', {
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        }
    );

const now = new Date();
const dateStr = now.toLocaleDateString('en-US', {
    year: 'numeric', month: 'long', day: 'numeric'
});
const timeStr = now.toLocaleTimeString('en-US', {
    hour: 'numeric', minute: '2-digit'
});
document.getElementById('receipt-datetime')
    .textContent = `${dateStr} • ${timeStr}`;

const user = window.Auth ? 
    window.Auth.getUser() : null;
if (user) {
    document.getElementById('receipt-student-name')
        .textContent = user.name || '—';
    document.getElementById('receipt-student-id')
        .textContent = user.studentId || 
            user.id || '—';
}
