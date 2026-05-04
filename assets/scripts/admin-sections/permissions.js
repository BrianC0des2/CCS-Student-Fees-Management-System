'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    let expandedFacultyPermId = null;
    const studentMgmtPerms = ALL_PERMISSIONS.filter(p => p.category === 'Student Management');
    const otherPerms       = ALL_PERMISSIONS.filter(p => p.category !== 'Student Management');
    const otherCategories  = [...new Set(otherPerms.map(p => p.category))];

    function toggleFacultyPerm(facultyId, permId) {
        facultyList = facultyList.map(f => {
            if (f.id !== facultyId) return f;
            const perms = f.permissions.includes(permId)
                ? f.permissions.filter(p => p !== permId)
                : [...f.permissions, permId];
            return { ...f, permissions: perms };
        });
        renderPermissions();
    }

    function renderPermissions() {
        if (!pageContent) return;

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Role Permissions</div>
                    <div class="section-sub">Configure what each role can access and do in the system</div>
                </div>
            </div>

            <div class="info-banner info-banner--amber">
                <span class="info-banner-icon">${bxi('error')}</span>
                <p>Changing permissions affects all users with the corresponding role immediately. Changes are logged in the Audit trail.</p>
            </div>

            <div class="card" id="perm-matrix-card">
                <div class="perm-section-head">
                    <span class="perm-section-head-icon">${bxi('graduation')}</span>
                    <div>
                        <div class="perm-section-head-title">Student Management Permissions</div>
                        <div class="perm-section-head-sub">Control who can add, edit, or remove students</div>
                    </div>
                </div>
                <div class="perm-legend-row">
                    ${studentMgmtPerms.map(p => {
                        const d = STUDENT_PERM_DETAILS[p.id];
                        return `<div class="perm-legend-item">
                            <span class="perm-legend-icon">${bxi(d.icon)}</span>
                            <span class="perm-legend-item-label">${p.label}</span>
                            <span class="badge ${riskBadgeClass(d.risk)}">${d.risk}</span>
                        </div>`;
                    }).join('')}
                </div>
                <div class="perm-table-overflow">
                    <table class="perm-table">
                        <thead>
                            <tr>
                                <th>Faculty / Role</th>
                                ${studentMgmtPerms.map(p => {
                                    const d = STUDENT_PERM_DETAILS[p.id];
                                    return `<th class="th-center">
                                        <div class="perm-th-cell">
                                            ${bxi(d.icon)}
                                            <span>${p.label}</span>
                                            <span class="badge ${riskBadgeClass(d.risk)}">${d.risk}</span>
                                        </div>
                                    </th>`;
                                }).join('')}
                            </tr>
                        </thead>
                        <tbody>
                            ${facultyList.map(f => `
                            <tr>
                                <td>
                                    <div class="perm-table-faculty-cell">
                                        <div class="member-avatar mem-av--active perm-table-avatar">${getInitials(f.name)}</div>
                                        <div>
                                            <div class="perm-table-fname">${f.name.split(',')[0]}</div>
                                            <span class="badge ${ROLE_BADGE_CLASS[f.role]}">${ROLE_LABELS[f.role]}</span>
                                        </div>
                                    </div>
                                </td>
                                ${studentMgmtPerms.map(p => {
                                    const has = f.permissions.includes(p.id);
                                    const d   = STUDENT_PERM_DETAILS[p.id];
                                    return `<td class="th-center">
                                        <button class="perm-checkbox ${has ? riskCheckClass(d.risk) : ''} matrix-perm-toggle"
                                            data-fid="${f.id}" data-pid="${p.id}" title="${d.desc}">
                                            ${has ? bxi('check') : ''}
                                        </button>
                                    </td>`;
                                }).join('')}
                            </tr>`).join('')}
                        </tbody>
                    </table>
                </div>
                <div class="perm-desc-footer">
                    <div class="perm-desc-footer-title">Permission Descriptions</div>
                    <div class="perm-desc-grid">
                        ${studentMgmtPerms.map(p => {
                            const d = STUDENT_PERM_DETAILS[p.id];
                            return `<div class="perm-desc-item ${d.risk === 'high' ? 'perm-desc-item--red' : 'perm-desc-item--blue'}">
                                <span class="perm-desc-item-icon">${bxi(d.icon)}</span>
                                <div>
                                    <div class="perm-desc-item-name">${p.label}</div>
                                    <div class="perm-desc-item-text">${d.desc}</div>
                                </div>
                            </div>`;
                        }).join('')}
                    </div>
                </div>
            </div>

            <div class="perm-save-row">
                <button class="btn btn-blue" id="save-student-perms">
                    Save Student Permissions
                </button>
            </div>

            <div>
                <div class="perm-other-title">Other Role Permissions</div>
                <div class="perm-other-sub">Configure clearance, finance, report, and system access per faculty member</div>
            </div>

            ${facultyList.map(f => {
                const isExp = expandedFacultyPermId === f.id;
                const studentPermCount = f.permissions.filter(p =>
                    ['add_students','edit_students','remove_students','manage_students'].includes(p)
                ).length;
                const otherPermCount = f.permissions.filter(p =>
                    !['view_students','add_students','edit_students','remove_students','manage_students'].includes(p)
                ).length;
                return `
                <div class="accordion-card">
                    <button class="accordion-btn accordion-perm-btn" data-fid="${f.id}">
                        <div class="accordion-btn-left">
                            <div class="member-avatar mem-av--active">${getInitials(f.name)}</div>
                            <div class="accordion-btn-info">
                                <div class="accordion-btn-name">${f.name}</div>
                                <div class="accordion-btn-sub">
                                    ${ROLE_LABELS[f.role]} –
                                    <span class="accordion-btn-sub-blue">${studentPermCount} student perm(s)</span>,
                                    ${otherPermCount} other
                                </div>
                            </div>
                        </div>
                        <div class="accordion-btn-right">
                            <span class="badge ${ROLE_BADGE_CLASS[f.role]}">${ROLE_LABELS[f.role]}</span>
                            <span class="accordion-chevron ${isExp ? 'open' : ''}">${bxi('chevron-down')}</span>
                        </div>
                    </button>
                    <div class="accordion-body ${isExp ? 'accordion-body--expanded' : ''}" id="perm-body-${f.id}">
                        ${otherCategories.map(cat => `
                        <div class="accordion-category">
                            <div class="accordion-category-title">${cat}</div>
                            <div class="accordion-category-pills">
                                ${otherPerms.filter(p => p.category === cat).map(p => {
                                    const has = f.permissions.includes(p.id);
                                    return `<button class="perm-pill ${has ? 'perm-pill--on' : 'perm-pill--off'} other-perm-toggle"
                                        data-fid="${f.id}" data-pid="${p.id}">
                                        <span class="perm-pill-check">${has ? bxi('check') : ''}</span>
                                        <span>${p.label}</span>
                                    </button>`;
                                }).join('')}
                            </div>
                        </div>`).join('')}
                        <div class="accordion-save-row">
                            <button class="btn btn-green save-other-perms" data-fid="${f.id}">
                                ${bxi('save')} Save Permissions
                            </button>
                        </div>
                    </div>
                </div>`;
            }).join('')}
        `;

        document.getElementById('save-student-perms')?.addEventListener('click', () =>
            showToast('Student management permissions saved.')
        );
        pageContent.querySelectorAll('.matrix-perm-toggle').forEach(b => b.addEventListener('click', () => {
            toggleFacultyPerm(b.dataset.fid, b.dataset.pid);
        }));
        pageContent.querySelectorAll('.accordion-perm-btn').forEach(b => b.addEventListener('click', () => {
            expandedFacultyPermId = expandedFacultyPermId === b.dataset.fid ? null : b.dataset.fid;
            renderPermissions();
        }));
        pageContent.querySelectorAll('.other-perm-toggle').forEach(b => b.addEventListener('click', () => {
            toggleFacultyPerm(b.dataset.fid, b.dataset.pid);
        }));
        pageContent.querySelectorAll('.save-other-perms').forEach(b => b.addEventListener('click', () => {
            const f = facultyList.find(x => x.id === b.dataset.fid);
            showToast('Permissions saved for ' + (f?.name || '') + '.');
            expandedFacultyPermId = null;
            renderPermissions();
        }));
    }

    renderPermissions();
});
