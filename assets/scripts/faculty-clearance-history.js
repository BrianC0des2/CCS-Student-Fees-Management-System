// Filters toggle
const filtersBtn = document.getElementById('filtersBtn');
const filtersPopover = document.getElementById('filtersPopover');

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

// Reset filters
document.getElementById('resetFilters')
    .addEventListener('click', function() {
    document.getElementById('course').value = '';
    document.getElementById('section').value = '';
    document.getElementById('schoolYear').value = '';
    document.getElementById('semester').value = '';
    filtersPopover.classList.remove('show');
    filterTable();
});

// Apply filters
document.getElementById('applyFilters')
    .addEventListener('click', function() {
    filtersPopover.classList.remove('show');
    filterTable();
});

// Search
document.getElementById('searchBtn')
    .addEventListener('click', function() {
    filterTable();
});

document.getElementById('searchInput')
    .addEventListener('input', function() {
    filterTable();
});

// Filter logic
function filterTable() {
    const search = document.getElementById('searchInput')
        .value.toLowerCase();
    const course = document.getElementById('course').value;
    const section = document.getElementById('section').value;
    const schoolYear = document.getElementById('schoolYear').value;
    const semester = document.getElementById('semester').value;

    document.querySelectorAll('tbody tr').forEach(row => {
        const cells = row.querySelectorAll('td');
        const text = row.textContent.toLowerCase();

        let show = true;

        if (search && !text.includes(search)) show = false;
        if (course && course !== 'BSCS')
            show = false;
        if (section && cells[2]?.textContent.trim() !== section) 
            show = false;
        if (schoolYear && cells[3]?.textContent.trim() !== schoolYear) 
            show = false;
        if (semester && cells[4]?.textContent.trim() !== semester) 
            show = false;

        row.style.display = show ? '' : 'none';
    });
}
