'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    let facultySearch = '';
    let facultyRoleFilter = 'all';
    let facultyStatusFilter = 'all';
    let facultyDepartmentFilter = 'all';
    let showAddFacultyForm = false;
    let editingFacultyId = null;
    let deleteConfirmFacultyId = null;
    let showAddDepartmentForm = false;
    let editingDepartmentId = null;
    let deleteConfirmDepartmentId = null;
    let newFacultyData = {
        facultyId: '',
        lastName: '',
        firstName: '',
        middleName: '',
        email: '',
        phone: '',
        sex: 'M',
        role: 'professor',
        department: 'BS Computer Science'
    };
    let newDepartmentData = {
        name: '',
        abbreviation: '',
        deanId: '',
        description: ''
    };

    function renderFaculty() {
        if (!pageContent) return;

        const filtered = facultyList.filter(f => {
            const q = facultySearch.toLowerCase();
            return (f.name.toLowerCase().includes(q) || f.email.toLowerCase().includes(q))
                && (facultyRoleFilter === 'all' || f.role === facultyRoleFilter)
                && (facultyStatusFilter === 'all' || f.status === facultyStatusFilter)
                && (facultyDepartmentFilter === 'all' || f.department === facultyDepartmentFilter);
        });

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Faculty Management</div>
                    <div class="section-sub">Add, edit, or remove faculty members and assign their roles</div>
                </div>
            </div>

            <div style="margin-bottom: 24px;">
                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px;">
                    <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Departments</span>
                    <button class="btn btn-outline" id="show-add-dept-btn" style="font-size: 12px; padding: 6px 12px;">
                        ${bxi('plus')} Add Department
                    </button>
                </div>
                <div style="display: grid; grid-template-columns: repeat(auto-fill, minmax(280px, 1fr)); gap: 12px; margin-bottom: 16px;">
                    ${departmentList.map(d => {
                        const deptFaculty = facultyList.filter(f => f.department === d.name);
                        const dean = facultyList.find(f => f.id === d.deanId);
                        const professorCount = deptFaculty.filter(f => f.role === 'professor').length;
                        const headCount = deptFaculty.filter(f => f.role === 'dept_head').length;
                        return `
                        <div class="card" style="padding: 16px; border: 1px solid #e5e7eb; border-radius: 12px; ${deleteConfirmDepartmentId === d.id ? 'background: #fef2f2; border-color: #fca5a5;' : ''}">
                            <div style="display: flex; justify-content: space-between; align-items: start; margin-bottom: 8px;">
                                <div>
                                    <div style="font-weight: 600; font-size: 14px; color: #111827;">${d.name}</div>
                                    <div style="font-size: 11px; color: #9ca3af; text-transform: uppercase; letter-spacing: 0.3px; margin-top: 2px;">
                                        <span class="badge badge-blue">${d.abbreviation}</span>
                                    </div>
                                </div>
                                ${deleteConfirmDepartmentId === d.id ? '' : `
                                <div style="display: flex; gap: 4px;">
                                    <button class="icon-btn icon-btn--blue dept-edit-btn" data-id="${d.id}" title="Edit" style="width: 28px; height: 28px; font-size: 14px;">
                                        ${bxi('edit')}
                                    </button>
                                    <button class="icon-btn icon-btn--red dept-delete-btn" data-id="${d.id}" title="Delete" style="width: 28px; height: 28px; font-size: 14px;">
                                        ${bxi('trash')}
                                    </button>
                                </div>
                                `}
                            </div>
                            <div style="margin: 12px 0; padding: 8px 0; border-top: 1px solid #e5e7eb; border-bottom: 1px solid #e5e7eb;">
                                <div style="font-size: 12px; color: #6b7280; margin-bottom: 4px;">
                                    <strong>Faculty:</strong> ${deptFaculty.length} total
                                </div>
                                ${dean ? `
                                <div style="font-size: 12px; color: #6b7280;">
                                    <strong>Department Head:</strong> ${dean.name.split(',')[0]}
                                </div>
                                ` : ''}
                            </div>
                            ${deleteConfirmDepartmentId === d.id ? `
                            <div style="margin-top: 8px; padding-top: 8px; border-top: 1px solid #fca5a5; display: flex; gap: 8px;">
                                <button class="btn btn-outline dept-cancel-delete" data-id="${d.id}" style="font-size: 12px; padding: 6px 12px;">Cancel</button>
                                <button class="btn btn-red dept-confirm-delete" data-id="${d.id}" style="font-size: 12px; padding: 6px 12px;">Delete</button>
                            </div>
                            ` : ''}
                        </div>
                        `;
                    }).join('')}
                </div>

                ${showAddDepartmentForm ? `
                <div class="form-box form-box--green" id="add-department-form" style="margin-bottom: 24px;">
                    <div class="form-box-header">
                        <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Department</span>
                        <button class="form-close-btn" id="close-add-dept">${bxi('x')}</button>
                    </div>
                    <div class="form-grid">
                        <div class="form-group">
                            <label>Department Name *</label>
                            <input id="nd-name" value="${newDepartmentData.name}" placeholder="e.g. BS Computer Science">
                        </div>
                        <div class="form-group">
                            <label>Abbreviation *</label>
                            <input id="nd-abbr" value="${newDepartmentData.abbreviation}" placeholder="e.g. CS" maxlength="4">
                        </div>
                        <div class="form-group">
                            <label>Department Dean</label>
                            <select id="nd-dean">
                                <option value="">Select a dean...</option>
                                ${facultyList.filter(f => f.role === 'dean' && f.status === 'active').map(f =>
                                    `<option value="${f.id}"${newDepartmentData.deanId === f.id ? ' selected' : ''}>${f.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Description (Optional)</label>
                            <input id="nd-desc" value="${newDepartmentData.description}" placeholder="e.g. Bachelor of Science in Computer Science">
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-outline" id="cancel-add-dept">Cancel</button>
                        <button class="btn btn-green" id="save-add-dept">${bxi('save')} Save Department</button>
                    </div>
                </div>` : ''}

                ${editingDepartmentId ? (() => {
                    const d = departmentList.find(x => x.id === editingDepartmentId);
                    return d ? `
                    <div class="form-box form-box--blue" id="edit-department-form" style="margin-bottom: 24px;">
                        <div class="form-box-header">
                            <span class="form-box-title form-box-title--blue">${bxi('edit')} Edit Department – ${d.name}</span>
                            <button class="form-close-btn" id="close-edit-dept">${bxi('x')}</button>
                        </div>
                        <div class="form-grid">
                            <div class="form-group">
                                <label>Department Name *</label>
                                <input id="ed-name" value="${d.name}" placeholder="Department name">
                            </div>
                            <div class="form-group">
                                <label>Abbreviation *</label>
                                <input id="ed-abbr" value="${d.abbreviation}" placeholder="Abbreviation" maxlength="4">
                            </div>
                            <div class="form-group">
                                <label>Department Dean</label>
                                <select id="ed-dean">
                                    <option value="">Select a dean...</option>
                                    ${facultyList.filter(f => f.role === 'dean' && f.status === 'active').map(f =>
                                        `<option value="${f.id}"${d.deanId === f.id ? ' selected' : ''}>${f.name}</option>`
                                    ).join('')}
                                </select>
                            </div>
                            <div class="form-group">
                                <label>Description (Optional)</label>
                                <input id="ed-desc" value="${d.description || ''}" placeholder="Description">
                            </div>
                        </div>
                        <div class="form-actions">
                            <button class="btn btn-outline" id="cancel-edit-dept">Cancel</button>
                            <button class="btn btn-blue" id="save-edit-dept">${bxi('save')} Save Changes</button>
                        </div>
                    </div>` : '';
                })() : ''}

                <div style="display: flex; align-items: center; justify-content: space-between; margin-bottom: 12px; margin-top: 24px;">
                    <span style="font-size: 13px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Faculty Members</span>
                    <button class="btn btn-green" id="show-add-faculty-btn" style="font-size: 12px; padding: 6px 12px;">
                        ${bxi('plus')} Add Faculty
                    </button>
                </div>
                <div class="search-wrap">
                    <span class="search-icon">${bxi('search')}</span>
                    <input id="faculty-search" value="${facultySearch}" placeholder="Search by name or email…">
                </div>
                <select class="filter-select" id="faculty-department-filter">
                    <option value="all">All Departments</option>
                    ${departmentList.map(d =>
                        `<option value="${d.name}"${facultyDepartmentFilter === d.name ? ' selected' : ''}>${d.name}</option>`
                    ).join('')}
                </select>
                <select class="filter-select" id="faculty-role-filter">
                    <option value="all">All Roles</option>
                    ${Object.entries(ROLE_LABELS).map(([k, v]) =>
                        `<option value="${k}"${facultyRoleFilter === k ? ' selected' : ''}>${v}</option>`
                    ).join('')}
                </select>
                <select class="filter-select" id="faculty-status-filter">
                    <option value="all">All Status</option>
                    <option value="active"${facultyStatusFilter === 'active' ? ' selected' : ''}>Active</option>
                    <option value="inactive"${facultyStatusFilter === 'inactive' ? ' selected' : ''}>Inactive</option>
                    <option value="suspended"${facultyStatusFilter === 'suspended' ? ' selected' : ''}>Suspended</option>
                </select>
            </div>

            ${showAddFacultyForm ? `
            <div class="form-box form-box--green" id="add-faculty-form">
                <div class="form-box-header">
                    <span class="form-box-title form-box-title--green">${bxi('plus')} Add New Faculty Member</span>
                    <button class="form-close-btn" id="close-add-faculty">${bxi('x')}</button>
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>Faculty ID *</label>
                        <input id="nf-id" value="${newFacultyData.facultyId}" placeholder="e.g. FAC-007">
                    </div>
                    <div class="form-group">
                        <label>First Name *</label>
                        <input id="nf-firstName" value="${newFacultyData.firstName}" placeholder="e.g. Juan">
                    </div>
                    <div class="form-group">
                        <label>Middle Name</label>
                        <input id="nf-middleName" value="${newFacultyData.middleName}" placeholder="e.g. Carlos">
                    </div>
                    <div class="form-group">
                        <label>Last Name *</label>
                        <input id="nf-lastName" value="${newFacultyData.lastName}" placeholder="e.g. Dela Cruz">
                    </div>
                    <div class="form-group">
                        <label>Sex *</label>
                        <div style="display: flex; gap: 16px; padding-top: 6px;">
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                <input type="radio" id="nf-sex-m" name="nf-sex" value="M" ${newFacultyData.sex === 'M' ? 'checked' : ''} style="cursor: pointer;">
                                Male
                            </label>
                            <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                <input type="radio" id="nf-sex-f" name="nf-sex" value="F" ${newFacultyData.sex === 'F' ? 'checked' : ''} style="cursor: pointer;">
                                Female
                            </label>
                        </div>
                    </div>
                    <div class="form-group">
                        <label>Suffix (Optional)</label>
                        <input id="nf-suffix" value="${newFacultyData.suffix || ''}" placeholder="e.g. PhD., MIT, Jr.">
                    </div>
                    <div class="form-group">
                        <label>Role *</label>
                        <select id="nf-role">
                            ${Object.entries(ROLE_LABELS).map(([k, v]) =>
                                `<option value="${k}"${newFacultyData.role === k ? ' selected' : ''}>${v}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Department *</label>
                        <select id="nf-dept">
                            ${['BS Computer Science', 'BS Information Technology', 'College of Computer Studies', 'Finance Office'].map(d =>
                                `<option${newFacultyData.department === d ? ' selected' : ''}>${d}</option>`
                            ).join('')}
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Phone Number</label>
                        <input id="nf-phone" type="tel" value="${newFacultyData.phone}" placeholder="+63-912-345-6789">
                    </div>
                    <div class="form-group">
                        <label>School Email *</label>
                        <input id="nf-email" type="email" value="${newFacultyData.email}" placeholder="Auto-generated from Faculty ID" readonly style="background:#f3f4f6; color:#6b7280; cursor:not-allowed;">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-outline" id="cancel-add-faculty">Cancel</button>
                    <button class="btn btn-green" id="save-add-faculty">${bxi('save')} Save Faculty</button>
                </div>
            </div>` : ''}

            ${editingFacultyId ? (() => {
                const f = facultyList.find(x => x.id === editingFacultyId);
                return f ? `
                <div class="form-box form-box--blue" id="edit-faculty-form">
                    <div class="form-box-header">
                        <span class="form-box-title form-box-title--blue">${bxi('edit')} Edit Faculty – ${f.name}</span>
                        <button class="form-close-btn" id="close-edit-faculty">${bxi('x')}</button>
                    </div>
                    <div class="form-grid">
                        <div class="form-group"><label>Last Name *</label><input id="ef-lastname" value="${f.name.split(',')[0] || ''}"></div>
                        <div class="form-group"><label>First Name *</label><input id="ef-firstname" value="${f.name.split(',')[1]?.trim().split(' ')[0] || ''}"></div>
                        <div class="form-group"><label>Middle Initial (Optional)</label><input id="ef-mi" value="${f.name.split(',')[1]?.trim().split(' ')[1] || ''}"></div>
                        <div class="form-group">
                            <label>Sex *</label>
                            <div style="display: flex; gap: 16px; padding-top: 6px;">
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                    <input type="radio" id="ef-sex-m" name="ef-sex" value="M" ${f.sex === 'M' ? 'checked' : ''} style="cursor: pointer;">
                                    Male
                                </label>
                                <label style="display: flex; align-items: center; gap: 6px; cursor: pointer; font-weight: normal;">
                                    <input type="radio" id="ef-sex-f" name="ef-sex" value="F" ${f.sex === 'F' ? 'checked' : ''} style="cursor: pointer;">
                                    Female
                                </label>
                            </div>
                        </div>
                        <div class="form-group"><label>Suffix (Optional)</label><input id="ef-suffix" value="${f.name.split(',')[1]?.trim().split(' ')[2] || ''}"></div>
                        <div class="form-group"><label>Email</label><input id="ef-email" type="email" value="${f.email}"></div>
                        <div class="form-group"><label>Phone</label><input id="ef-phone" value="${f.phone}"></div>
                        <div class="form-group">
                            <label>Role</label>
                            <select id="ef-role">
                                ${Object.entries(ROLE_LABELS).map(([k, v]) =>
                                    `<option value="${k}"${f.role === k ? ' selected' : ''}>${v}</option>`
                                ).join('')}
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Status</label>
                            <select id="ef-status">
                                <option value="active"${f.status === 'active' ? ' selected' : ''}>Active</option>
                                <option value="inactive"${f.status === 'inactive' ? ' selected' : ''}>Inactive</option>
                                <option value="suspended"${f.status === 'suspended' ? ' selected' : ''}>Suspended</option>
                            </select>
                        </div>
                        <div class="form-group">
                            <label>Department</label>
                            <select id="ef-dept">
                                ${departmentList.map(d =>
                                    `<option${f.department === d.name ? ' selected' : ''}>${d.name}</option>`
                                ).join('')}
                            </select>
                        </div>
                    </div>
                    <div class="form-actions">
                        <button class="btn btn-outline" id="cancel-edit-faculty">Cancel</button>
                        <button class="btn btn-blue" id="save-edit-faculty">${bxi('save')} Save Changes</button>
                    </div>
                </div>` : '';
            })() : ''}

            <div id="faculty-list">
                ${filtered.length === 0 ? `
                <div class="card faculty-empty-state">No faculty members found.</div>` :
                filtered.map(f => `
                <div class="member-card" data-faculty-id="${f.id}">
                    <div class="member-row">
                        <div class="member-avatar ${statusAvatarClass(f.status)}">${getInitials(f.name)}</div>
                        <div class="member-info">
                            <div class="member-name">
                                ${f.name}
                                <span class="badge ${ROLE_BADGE_CLASS[f.role]}">${ROLE_LABELS[f.role]}</span>
                                <span class="badge ${f.sex === 'M' ? 'badge-blue' : 'badge-indigo'}">${f.sex === 'M' ? 'Male' : 'Female'}</span>
                                <span class="badge ${f.status === 'active' ? 'badge-green' : f.status === 'inactive' ? 'badge-gray' : 'badge-red'}">
                                    ${f.status.charAt(0).toUpperCase() + f.status.slice(1)}
                                </span>
                            </div>
                            <div class="member-meta">
                                <span>${bxi('envelope')} ${f.email}</span>
                                <span>${bxi('buildings')} ${f.department}</span>
                                <span>${bxi('time-five')} Last login: ${f.lastLogin}</span>
                            </div>
                            <div class="member-perms">
                                ${f.permissions.slice(0, 4).map(p => {
                                    const perm = ALL_PERMISSIONS.find(x => x.id === p);
                                    return perm ? `<span class="badge badge-gray">${perm.label}</span>` : '';
                                }).join('')}
                                ${f.permissions.length > 4 ? `<span class="badge badge-gray">+${f.permissions.length - 4} more</span>` : ''}
                            </div>
                        </div>
                        <div class="member-actions">
                            <button class="icon-btn icon-btn--blue faculty-edit-btn" data-id="${f.id}" title="Edit">
                                ${bxi('edit')}
                            </button>
                            <button class="icon-btn icon-btn--amber faculty-toggle-btn" data-id="${f.id}" title="${f.status === 'active' ? 'Deactivate' : 'Activate'}">
                                ${f.status === 'active' ? bxi('lock') : bxi('lock-open')}
                            </button>
                            <button class="icon-btn icon-btn--red faculty-delete-btn" data-id="${f.id}" title="Remove">
                                ${bxi('trash')}
                            </button>
                        </div>
                    </div>
                    ${deleteConfirmFacultyId === f.id ? `
                    <div class="confirm-box">
                        <span>${bxi('error')} Remove <strong>${f.name}</strong> from the system? This cannot be undone.</span>
                        <div class="confirm-box-actions">
                            <button class="btn btn-outline faculty-cancel-delete" data-id="${f.id}">Cancel</button>
                            <button class="btn btn-red faculty-confirm-delete" data-id="${f.id}">Remove</button>
                        </div>
                    </div>` : ''}
                </div>`).join('')}
            </div>
        `;

        document.getElementById('show-add-faculty-btn')?.addEventListener('click', () => {
            showAddFacultyForm = true; renderFaculty();
        });
        document.getElementById('close-add-faculty')?.addEventListener('click', () => {
            showAddFacultyForm = false; renderFaculty();
        });
        document.getElementById('cancel-add-faculty')?.addEventListener('click', () => {
            showAddFacultyForm = false; renderFaculty();
        });
        document.getElementById('nf-id')?.addEventListener('input', e => {
            const generated = facultyEmailFromId(e.target.value.trim());
            document.getElementById('nf-email').value = e.target.value.trim() ? generated : '';
        });
        document.querySelectorAll('input[name="nf-sex"]').forEach(radio => {
            radio.addEventListener('change', e => {
                newFacultyData.sex = e.target.value;
            });
        });
        document.getElementById('save-add-faculty')?.addEventListener('click', () => {
            const facultyId = document.getElementById('nf-id').value.trim();
            const firstName = document.getElementById('nf-firstName').value.trim();
            const middleName = document.getElementById('nf-middleName').value.trim();
            const lastName = document.getElementById('nf-lastName').value.trim();
            const suffix = document.getElementById('nf-suffix').value.trim();
            const sex = document.querySelector('input[name="nf-sex"]:checked')?.value || '';
            const email = document.getElementById('nf-email').value.trim();
            const role = document.getElementById('nf-role').value.trim();
            const department = document.getElementById('nf-dept').value.trim();
            const phone = document.getElementById('nf-phone').value.trim();

            if (!facultyId || !firstName || !lastName || !email || !role || !department || !sex) {
                showToast('Faculty ID, First Name, Last Name, Email, Role, Department, and Sex are required.', true);
                return;
            }

            const nameParts = [lastName + ',', firstName];
            if (middleName) nameParts.push(middleName);
            if (suffix) nameParts.push(suffix);
            const name = nameParts.join(' ').trim();

            if (facultyList.find(f => f.id === facultyId)) {
                showToast('Faculty ID already exists.', true);
                return;
            }

            facultyList.push({
                id: facultyId,
                name: name,
                email: email,
                phone: phone,
                sex: sex,
                role: role,
                department: department,
                status: 'active',
                permissions: [],
                dateAdded: 'Mar 8, 2026',
                lastLogin: 'Never',
            });

            showAddFacultyForm = false;
            newFacultyData = {
                facultyId: '',
                lastName: '',
                firstName: '',
                middleName: '',
                email: '',
                phone: '',
                sex: 'M',
                role: 'professor',
                department: 'BS Computer Science'
            };
            showToast('Faculty member ' + name + ' added.');
            renderFaculty();
        });

        document.getElementById('close-edit-faculty')?.addEventListener('click', () => {
            editingFacultyId = null; renderFaculty();
        });
        document.getElementById('cancel-edit-faculty')?.addEventListener('click', () => {
            editingFacultyId = null; renderFaculty();
        });
        document.getElementById('save-edit-faculty')?.addEventListener('click', () => {
            facultyList = facultyList.map(f => f.id !== editingFacultyId ? f : {
                ...f,
                name: [
                    document.getElementById('ef-lastname').value.trim() + ',',
                    document.getElementById('ef-firstname').value.trim(),
                    document.getElementById('ef-mi').value.trim() ? document.getElementById('ef-mi').value.trim() + '.' : '',
                    document.getElementById('ef-suffix').value.trim() || ''
                ].filter(Boolean).join(' ').trim(),
                email:      document.getElementById('ef-email').value,
                phone:      document.getElementById('ef-phone').value,
                sex:        document.querySelector('input[name="ef-sex"]:checked')?.value || 'M',
                role:       document.getElementById('ef-role').value,
                status:     document.getElementById('ef-status').value,
                department: document.getElementById('ef-dept').value,
            });
            editingFacultyId = null;
            showToast('Faculty updated.');
            renderFaculty();
        });

        document.getElementById('faculty-search')?.addEventListener('input', e => {
            facultySearch = e.target.value; renderFaculty();
        });
        document.getElementById('faculty-department-filter')?.addEventListener('change', e => {
            facultyDepartmentFilter = e.target.value; renderFaculty();
        });
        document.getElementById('faculty-role-filter')?.addEventListener('change', e => {
            facultyRoleFilter = e.target.value; renderFaculty();
        });
        document.getElementById('faculty-status-filter')?.addEventListener('change', e => {
            facultyStatusFilter = e.target.value; renderFaculty();
        });

        pageContent.querySelectorAll('.faculty-edit-btn').forEach(b => b.addEventListener('click', () => {
            editingFacultyId = b.dataset.id; showAddFacultyForm = false; renderFaculty();
        }));
        pageContent.querySelectorAll('.faculty-toggle-btn').forEach(b => b.addEventListener('click', () => {
            facultyList = facultyList.map(f =>
                f.id === b.dataset.id ? { ...f, status: f.status === 'active' ? 'inactive' : 'active' } : f
            );
            showToast('Faculty status updated.'); renderFaculty();
        }));
        pageContent.querySelectorAll('.faculty-delete-btn').forEach(b => b.addEventListener('click', () => {
            deleteConfirmFacultyId = b.dataset.id; renderFaculty();
        }));
        pageContent.querySelectorAll('.faculty-cancel-delete').forEach(b => b.addEventListener('click', () => {
            deleteConfirmFacultyId = null; renderFaculty();
        }));
        pageContent.querySelectorAll('.faculty-confirm-delete').forEach(b => b.addEventListener('click', () => {
            facultyList = facultyList.filter(f => f.id !== b.dataset.id);
            deleteConfirmFacultyId = null;
            showToast('Faculty removed.'); renderFaculty();
        }));

        document.getElementById('show-add-dept-btn')?.addEventListener('click', () => {
            showAddDepartmentForm = true; renderFaculty();
        });
        document.getElementById('close-add-dept')?.addEventListener('click', () => {
            showAddDepartmentForm = false; renderFaculty();
        });
        document.getElementById('cancel-add-dept')?.addEventListener('click', () => {
            showAddDepartmentForm = false; renderFaculty();
        });
        document.getElementById('save-add-dept')?.addEventListener('click', () => {
            const name = document.getElementById('nd-name').value.trim();
            const abbr = document.getElementById('nd-abbr').value.trim();
            const deanId = document.getElementById('nd-dean').value.trim();

            if (!name || !abbr) {
                showToast('Department Name and Abbreviation are required.', true);
                return;
            }

            if (departmentList.find(d => d.name === name)) {
                showToast('Department with this name already exists.', true);
                return;
            }

            departmentList.push({
                id: 'DEPT-' + String(Date.now()).slice(-6),
                name: name,
                abbreviation: abbr,
                deanId: deanId,
                description: document.getElementById('nd-desc').value.trim(),
                faculty: [],
                status: 'active'
            });

            showAddDepartmentForm = false;
            newDepartmentData = { name: '', abbreviation: '', deanId: '', description: '' };
            showToast('Department added successfully.');
            renderFaculty();
        });

        document.getElementById('close-edit-dept')?.addEventListener('click', () => {
            editingDepartmentId = null; renderFaculty();
        });
        document.getElementById('cancel-edit-dept')?.addEventListener('click', () => {
            editingDepartmentId = null; renderFaculty();
        });
        document.getElementById('save-edit-dept')?.addEventListener('click', () => {
            const name = document.getElementById('ed-name').value.trim();
            const abbr = document.getElementById('ed-abbr').value.trim();
            const deanId = document.getElementById('ed-dean').value.trim();

            if (!name || !abbr) {
                showToast('Department Name and Abbreviation are required.', true);
                return;
            }

            departmentList = departmentList.map(d => d.id !== editingDepartmentId ? d : {
                ...d,
                name: name,
                abbreviation: abbr,
                deanId: deanId,
                description: document.getElementById('ed-desc').value.trim(),
            });
            editingDepartmentId = null;
            showToast('Department updated.');
            renderFaculty();
        });

        pageContent.querySelectorAll('.dept-edit-btn').forEach(b => b.addEventListener('click', () => {
            editingDepartmentId = b.dataset.id; showAddDepartmentForm = false; renderFaculty();
        }));
        pageContent.querySelectorAll('.dept-delete-btn').forEach(b => b.addEventListener('click', () => {
            deleteConfirmDepartmentId = b.dataset.id; renderFaculty();
        }));
        pageContent.querySelectorAll('.dept-cancel-delete').forEach(b => b.addEventListener('click', () => {
            deleteConfirmDepartmentId = null; renderFaculty();
        }));
        pageContent.querySelectorAll('.dept-confirm-delete').forEach(b => b.addEventListener('click', () => {
            departmentList = departmentList.filter(d => d.id !== b.dataset.id);
            deleteConfirmDepartmentId = null;
            showToast('Department removed.');
            renderFaculty();
        }));
    }

    renderFaculty();
});
