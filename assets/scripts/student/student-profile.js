/* Student Profile Page Logic */
(function () {
    const RELIGION_OPTIONS = [
        "Roman Catholic",
        "Muslim/Islam",
        "Iglesia ni Cristo",
        "Born Again Christian",
        "Seventh Day Adventist",
        "Philippine Independent Church (Aglipayan)",
        "Judaism",
        "Buddhism",
        "Hinduism",
        "Other"
    ];

    let isEditMode = false;

    function getCurrentUser() {
        return window.Auth && typeof window.Auth.getUser === 'function'
            ? window.Auth.getUser()
            : null;
    }

    function populateHeroCard() {
        const user = getCurrentUser();
        if (!user) return;

        document.getElementById('heroName').textContent = user.name || 'Student';
        document.getElementById('heroStudentId').textContent = user.studentId || '0000000000';
    }

    function populateAccountInfo() {
        const user = getCurrentUser();
        if (!user) return;

        const accountInfoGrid = document.getElementById('accountInfoGrid');
        const fields = [
            { label: 'Full Name', value: user.name || '-' },
            { label: 'Student ID', value: user.studentId || '-' },
            { label: 'Email Address', value: user.email || '-' },
            { label: 'Course', value: user.course || '-' },
            { label: 'Year & Section', value: (user.year && user.section) ? `${user.year}, ${user.section}` : '-' },
            { label: 'Sex', value: user.sex || '-' }
        ];

        accountInfoGrid.innerHTML = fields.map(field => `
<div class="info-item">
<span class="info-label">${field.label}</span>
<span class="info-value">${field.value}</span>
</div>
`).join('');
    }

    function populatePersonalInfoView() {
        const user = getCurrentUser();
        if (!user) return;

        const personalInfoView = document.getElementById('personalInfoView');
        const religion = user.religion || '—';
        const phoneNumber = user.phoneNumber || '—';

        personalInfoView.innerHTML = `
<div class="personal-info-item">
    <span class="personal-info-label">Religion</span>
    <span class="personal-info-value">${religion}</span>
</div>
<div class="personal-info-item">
    <span class="personal-info-label">Phone Number</span>
    <span class="personal-info-value">${phoneNumber}</span>
</div>
`;
    }

    function populatePersonalInfoForm() {
        const user = getCurrentUser();
        if (!user) return;

        const editForm = document.getElementById('personalInfoEditForm');
        const selectedReligion = user.religion || '';
        const phoneNumber = user.phoneNumber || '';

        editForm.innerHTML = `
<div class="personal-info-field">
    <label for="editReligion">Religion</label>
    <select id="editReligion" required>
        <option value="">Select Religion</option>
        ${RELIGION_OPTIONS.map(r => 
        `<option value="${r}" ${r === selectedReligion ? 'selected' : ''}>${r}</option>`
        ).join('')}
    </select>
</div>
<div class="personal-info-field">
    <label for="editPhoneNumber">Phone Number</label>
    <input type="tel" id="editPhoneNumber" placeholder="e.g. 09171234567" value="${phoneNumber}">
</div>
`;
    }

    function enableEditMode() {
        isEditMode = true;
        document.getElementById('personalInfoView').style.display = 'none';
        document.getElementById('personalInfoEditForm').style.display = 'block';
        document.getElementById('personalInfoActions').style.display = 'flex';
        document.getElementById('editPersonalInfoBtn').style.display = 'none';
        populatePersonalInfoForm();
    }

    function disableEditMode() {
        isEditMode = false;
        document.getElementById('personalInfoView').style.display = 'block';
        document.getElementById('personalInfoEditForm').style.display = 'none';
        document.getElementById('personalInfoActions').style.display = 'none';
        document.getElementById('editPersonalInfoBtn').style.display = 'flex';
    }

    function savePersonalInfo() {
        const editReligion = document.getElementById('editReligion');
        const editPhoneNumber = document.getElementById('editPhoneNumber');

        const religion = editReligion.value.trim();
        const phoneNumber = editPhoneNumber.value.trim();

        if (!religion) {
            alert('Please select a religion.');
            return;
        }

        if (window.Auth && typeof window.Auth.updateCurrentUserProfile === 'function') {
            const result = window.Auth.updateCurrentUserProfile({
                religion: religion,
                phoneNumber: phoneNumber
            });

            if (result.ok) {
                disableEditMode();
                populatePersonalInfoView();
            } else {
                alert('Failed to save changes. Please try again.');
            }
        }
    }

    // Event listeners
    document.getElementById('editPersonalInfoBtn').addEventListener('click', enableEditMode);
    document.getElementById('savPersonalInfoBtn').addEventListener('click', savePersonalInfo);
    document.getElementById('cancelPersonalInfoBtn').addEventListener('click', disableEditMode);

    // Initialize on page load
    if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', function () {
            populateHeroCard();
            populateAccountInfo();
            populatePersonalInfoView();
        });
    } else {
        populateHeroCard();
        populateAccountInfo();
        populatePersonalInfoView();
    }
})();
