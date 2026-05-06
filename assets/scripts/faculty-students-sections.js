 // Set year/sem in header
        if (window.Auth && window.Auth.getAcademicYear) {
            document.getElementById('orgYearSem').textContent =
                window.Auth.getAcademicYear();
        }

        // Student data stored in memory
        let myStudents = [
            {
                id: '2025-1101',
                name: 'Maria Santos',
                email: 'ty20251101@wmsu.edu.ph',
                course: 'BS Computer Science',
                year: '1st Year',
                section: 'CS 1-A',
                password: '123456'
            },
            {
                id: '2025-1102',
                name: 'John Dela Cruz',
                email: 'ty20251102@wmsu.edu.ph',
                course: 'BS Computer Science',
                year: '1st Year',
                section: 'CS 1-A',
                password: '123456'
            },
            {
                id: '2025-1103',
                name: 'Ana Reyes',
                email: 'ty20251103@wmsu.edu.ph',
                course: 'BS Computer Science',
                year: '1st Year',
                section: 'CS 1-B',
                password: '123456'
            },
            {
                id: '2025-1104',
                name: 'Carlos Mendoza',
                email: 'ty20251104@wmsu.edu.ph',
                course: 'BS Computer Science',
                year: '1st Year',
                section: 'CS 1-B',
                password: '123456'
            }
        ];

        let activeSection = 'all';
        let searchTerm = '';
        let activeYearFilter = '';
        let activeCourseFilter = '';
        let activeSectionFilter = '';
        let deleteConfirmId = null;

        function getInitials(name) {
            return name.split(' ')
                .map(n => n[0]).join('')
                .slice(0, 2).toUpperCase();
        }

        function generateEmail(studentId) {
            const cleaned = studentId.replace(/-/g, '');
            return 'ty' + cleaned + '@wmsu.edu.ph';
        }

        document.getElementById('nsStudentNo')
            .addEventListener('input', function() {
            if (this.value.trim()) {
                document.getElementById('nsEmail').value = 
                    generateEmail(this.value.trim());
            } else {
                document.getElementById('nsEmail').value = '';
            }
        });

        function renderStudents() {
            const list = document.getElementById('studentList');

            document.getElementById('countTotal')
                .textContent = myStudents.length;
            document.getElementById('countCS1A')
                .textContent = myStudents.filter(
                    s => s.section === 'CS 1-A').length;
            document.getElementById('countCS1B')
                .textContent = myStudents.filter(
                    s => s.section === 'CS 1-B').length;

            document.getElementById('tabAll')
                .textContent = 'All (' + myStudents.length + ')';
            document.getElementById('tabCS1A')
                .textContent = 'CS 1-A (' + myStudents.filter(
                    s => s.section === 'CS 1-A').length + ')';
            document.getElementById('tabCS1B')
                .textContent = 'CS 1-B (' + myStudents.filter(
                    s => s.section === 'CS 1-B').length + ')';

            let filtered = myStudents.filter(s => {
                const matchSection = activeSection === 'all' || 
                    s.section === activeSection;
                const matchSearch = 
                    s.name.toLowerCase()
                        .includes(searchTerm.toLowerCase()) ||
                    s.id.includes(searchTerm);
                const matchYear = !activeYearFilter ||
                    s.year === activeYearFilter;
                const matchCourse = !activeCourseFilter ||
                    s.course === activeCourseFilter;
                const matchFilterSection = !activeSectionFilter ||
                    s.section === activeSectionFilter;
                return matchSection && matchSearch &&
                    matchYear && matchCourse &&
                    matchFilterSection;
            });

            if (filtered.length === 0) {
                list.innerHTML = `
                    <div class="empty-state">
                        No students found. 
                        Click + Add Student to get started.
                    </div>`;
                return;
            }

            list.innerHTML = filtered.map(s => `
                <div class="member-card" 
                     data-id="${s.id}">
                    <div class="member-row">
                        <div class="member-avatar">
                            ${getInitials(s.name)}
                        </div>
                        <div class="member-info">
                            <div class="member-name">
                                ${s.name}
                                <span class="status-badge 
                                    badge-pending-clearance"
                                    style="margin-left:6px;">
                                    #${s.id}
                                </span>
                            </div>
                            <div class="member-meta">
                                <span>
                                    <i class='bx bx-book'></i>
                                    ${s.course}
                                </span>
                                <span>
                                    <i class='bx bx-buildings'></i>
                                    ${s.year} — ${s.section}
                                </span>
                                <span>
                                    <i class='bx bx-envelope'></i>
                                    ${s.email}
                                </span>
                            </div>
                        </div>
                        <div class="member-actions">
                            <button class="icon-btn remove-btn" 
                                    data-id="${s.id}" 
                                    title="Remove">
                                <i class='bx bx-trash'></i>
                            </button>
                        </div>
                    </div>
                    ${deleteConfirmId === s.id ? `
                    <div class="confirm-box">
                        <span>
                            Remove <strong>${s.name}</strong> 
                            from your class roster?
                        </span>
                        <div class="confirm-box-actions">
                            <button class="reset-btn 
                                cancel-delete" 
                                data-id="${s.id}">
                                Cancel
                            </button>
                            <button class="btn btn-reject 
                                confirm-delete" 
                                data-id="${s.id}">
                                Remove
                            </button>
                        </div>
                    </div>` : ''}
                </div>
            `).join('');

            // Remove button listeners
            document.querySelectorAll('.remove-btn')
                .forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteConfirmId = btn.dataset.id;
                    renderStudents();
                });
            });

            document.querySelectorAll('.cancel-delete')
                .forEach(btn => {
                btn.addEventListener('click', () => {
                    deleteConfirmId = null;
                    renderStudents();
                });
            });

            document.querySelectorAll('.confirm-delete')
                .forEach(btn => {
                btn.addEventListener('click', () => {
                    myStudents = myStudents.filter(
                        s => s.id !== btn.dataset.id
                    );
                    deleteConfirmId = null;
                    renderStudents();
                });
            });
        }

        // Show/hide add form
        document.getElementById('showAddStudentBtn')
            .addEventListener('click', () => {
            document.getElementById('addStudentForm')
                .style.display = 'block';
        });

        document.getElementById('closeAddStudentForm')
            .addEventListener('click', () => {
            document.getElementById('addStudentForm')
                .style.display = 'none';
        });

        document.getElementById('cancelAddStudent')
            .addEventListener('click', () => {
            document.getElementById('addStudentForm')
                .style.display = 'none';
        });

        // Save student
        document.getElementById('saveAddStudent')
            .addEventListener('click', () => {
            const studentNo = document.getElementById('nsStudentNo')
                .value.trim();
            const surname = document.getElementById('nsSurname')
                .value.trim();
            const firstName = document.getElementById('nsFirstName')
                .value.trim();
            const middleName = document.getElementById('nsMiddleName')
                .value.trim();
            const suffix = document.getElementById('nsSuffix')
                .value.trim();
            const email = document.getElementById('nsEmail')
                .value.trim();
            const course = document.getElementById('nsCourse')
                .value.trim();
            const year = document.getElementById('nsYear')
                .value.trim();
            const section = document.getElementById('nsSection')
                .value.trim();

            if (!studentNo || !surname || !firstName || !email || !course || !year || !section) {
                alert('Student Number, Surname, First Name, Email, Course, Year, and Section are required.');
                return;
            }

            // Build full name
            const nameParts = [surname + ',', firstName];
            if (middleName) nameParts.push(middleName);
            if (suffix) nameParts.push(suffix);
            const fullName = nameParts.join(' ').trim();

            const exists = myStudents.find(s => s.id === studentNo);
            if (exists) {
                alert('Student number already exists.');
                return;
            }

            const emailExists = myStudents.find(s => s.email === email);
            if (emailExists) {
                alert('Email already exists.');
                return;
            }

            myStudents.push({
                id: studentNo,
                name: fullName,
                email: email,
                course: course,
                year: year,
                section: section,
                password: '123456'
            });

            // Reset form
            document.getElementById('nsStudentNo').value = '';
            document.getElementById('nsSurname').value = '';
            document.getElementById('nsFirstName').value = '';
            document.getElementById('nsMiddleName').value = '';
            document.getElementById('nsSuffix').value = '';
            document.getElementById('nsEmail').value = '';
            document.getElementById('nsCourse').value = '';
            document.getElementById('nsYear').value = '';
            document.getElementById('nsSection').value = '';
            document.getElementById('addStudentForm')
                .style.display = 'none';
            renderStudents();
        });

        // Search
        document.getElementById('studentSearchInput')
            .addEventListener('input', function() {
            searchTerm = this.value;
            renderStudents();
        });

        document.getElementById('studentSearchBtn')
            .addEventListener('click', function() {
            searchTerm = document.getElementById(
                'studentSearchInput'
            ).value;
            renderStudents();
        });

        const studentFiltersBtn = document.getElementById(
            'studentFiltersBtn'
        );
        const studentFiltersPopover = document.getElementById(
            'studentFiltersPopover'
        );

        studentFiltersBtn.addEventListener('click', function(e) {
            e.stopPropagation();
            studentFiltersPopover.classList.toggle('show');
        });

        document.addEventListener('click', function(e) {
            if (!studentFiltersBtn.contains(e.target) &&
                !studentFiltersPopover.contains(e.target)) {
                studentFiltersPopover.classList.remove('show');
            }
        });

        document.getElementById('studentApplyFilters')
            .addEventListener('click', function() {
            activeYearFilter = document.getElementById(
                'studentFilterYear'
            ).value;
            activeCourseFilter = document.getElementById(
                'studentFilterCourse'
            ).value;
            activeSectionFilter = document.getElementById(
                'studentFilterSection'
            ).value;
            studentFiltersPopover.classList.remove('show');
            renderStudents();
        });

        document.getElementById('studentResetFilters')
            .addEventListener('click', function() {
            activeYearFilter = '';
            activeCourseFilter = '';
            activeSectionFilter = '';
            document.getElementById('studentFilterYear').value = '';
            document.getElementById('studentFilterCourse').value = '';
            document.getElementById('studentFilterSection').value = '';
            studentFiltersPopover.classList.remove('show');
            renderStudents();
        });

        // Section filter tabs
        document.querySelectorAll('.section-tab')
            .forEach(tab => {
            tab.addEventListener('click', () => {
                document.querySelectorAll('.section-tab')
                    .forEach(t => t.classList.remove('active'));
                tab.classList.add('active');
                activeSection = tab.dataset.section;
                renderStudents();
            });
        });

        // Initial render
        renderStudents();
