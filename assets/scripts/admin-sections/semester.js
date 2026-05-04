'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    function renderSemester() {
        if (!pageContent) return;

        const semesters = window.SemesterManager.getAllSemesters();
        const current = window.SemesterManager.getCurrentSemester();

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Semester Management</div>
                    <div class="section-sub">Manage academic semesters and schedule transitions</div>
                </div>
            </div>

            <div class="info-banner info-banner--blue">
                <span class="info-banner-icon">${bxi('info-circle')}</span>
                <p><strong>Current Semester:</strong> ${current ? window.SemesterManager.formatSemesterInfo(current) : 'None selected'}</p>
            </div>

            <div class="card" style="margin-bottom: 24px;">
                <div class="card-title">Active Semester</div>
                ${current ? `
                    <div style="padding: 16px; background: #f0fdf4; border-radius: 8px; border-left: 4px solid #16a34a;">
                        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 16px; margin-bottom: 12px;">
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">School Year</div>
                                <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${current.schoolYear}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Semester</div>
                                <div style="font-size: 16px; font-weight: 600; color: #111827; margin-top: 4px;">${current.name}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Start Date</div>
                                <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.startDate)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">End Date</div>
                                <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.endDate)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Payment Deadline</div>
                                <div style="font-size: 14px; color: #111827; margin-top: 4px;">${window.SemesterManager.formatDate(current.paymentDeadline)}</div>
                            </div>
                            <div>
                                <div style="font-size: 12px; color: #6b7280; text-transform: uppercase; letter-spacing: 0.3px;">Days Until Deadline</div>
                                <div style="font-size: 14px; font-weight: 600; color: ${window.SemesterManager.daysUntilDeadline(current) <= 7 ? '#dc2626' : '#16a34a'}; margin-top: 4px;">
                                    ${window.SemesterManager.daysUntilDeadline(current)} days
                                </div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="padding: 16px; text-align: center; color: #6b7280;">
                        No semester is currently active. Select one below to activate.
                    </div>
                `}
            </div>

            <div class="card">
                <div class="card-title">All Semesters</div>
                <div style="overflow-x: auto;">
                    <table style="width: 100%; border-collapse: collapse;">
                        <thead>
                            <tr style="border-bottom: 2px solid #e5e7eb; background: #f9fafb;">
                                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">School Year</th>
                                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Semester</th>
                                <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Status</th>
                                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Start Date</th>
                                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">End Date</th>
                                <th style="padding: 12px; text-align: left; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Auto-Start</th>
                                <th style="padding: 12px; text-align: center; font-size: 12px; font-weight: 600; text-transform: uppercase; letter-spacing: 0.3px; color: #6b7280;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${semesters.map(sem => `
                            <tr style="border-bottom: 1px solid #e5e7eb; ${sem.status === 'active' ? 'background: #f0fdf4;' : ''}">
                                <td style="padding: 12px; font-size: 13px; color: #111827;">${sem.schoolYear}</td>
                                <td style="padding: 12px; font-size: 13px; color: #111827; font-weight: 500;">${sem.name}</td>
                                <td style="padding: 12px; text-align: center;">
                                    <span class="badge ${sem.status === 'active' ? 'badge-green' : sem.status === 'completed' ? 'badge-gray' : 'badge-amber'}">
                                        ${sem.status.charAt(0).toUpperCase() + sem.status.slice(1)}
                                    </span>
                                </td>
                                <td style="padding: 12px; font-size: 13px; color: #6b7280;">${window.SemesterManager.formatDate(sem.startDate)}</td>
                                <td style="padding: 12px; font-size: 13px; color: #6b7280;">${window.SemesterManager.formatDate(sem.endDate)}</td>
                                <td style="padding: 12px; font-size: 13px; color: #6b7280;">
                                    ${sem.autoStartEnabled ? `${window.SemesterManager.formatDate(sem.autoStartDate)} ✓` : '—'}
                                </td>
                                <td style="padding: 12px; text-align: center;">
                                    ${sem.status !== 'active' ? `
                                        <button class="btn btn-green semester-activate-btn" data-id="${sem.id}" style="font-size: 12px; padding: 6px 12px;">
                                            ${bxi('check')} Activate
                                        </button>
                                    ` : `
                                        <button class="btn btn-amber semester-complete-btn" data-id="${sem.id}" style="font-size: 12px; padding: 6px 12px;">
                                            ${bxi('check-double')} Complete
                                        </button>
                                    `}
                                </td>
                            </tr>
                            `).join('')}
                        </tbody>
                    </table>
                </div>
            </div>

            <div class="card" style="margin-top: 24px;">
                <div class="card-title">Create New Semester</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>School Year *</label>
                        <input id="ns-year" placeholder="e.g. 2026-2027">
                    </div>
                    <div class="form-group">
                        <label>Semester Name *</label>
                        <select id="ns-name">
                            <option value="">Select semester</option>
                            <option value="1st Semester">1st Semester</option>
                            <option value="2nd Semester">2nd Semester</option>
                            <option value="Summer">Summer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Start Date *</label>
                        <input id="ns-start" type="date">
                    </div>
                    <div class="form-group">
                        <label>End Date *</label>
                        <input id="ns-end" type="date">
                    </div>
                    <div class="form-group">
                        <label>Payment Deadline *</label>
                        <input id="ns-payment" type="date">
                    </div>
                    <div class="form-group">
                        <label>Description</label>
                        <input id="ns-desc" placeholder="e.g. First semester of AY 2026-2027">
                    </div>
                    <div class="form-group" style="grid-column: 1 / -1;">
                        <label style="display: flex; align-items: center; gap: 8px; font-weight: normal;">
                            <input type="checkbox" id="ns-auto" style="width: 18px; height: 18px; cursor: pointer;">
                            Enable auto-start on specific date
                        </label>
                    </div>
                    <div class="form-group" id="ns-auto-date-group" style="display: none;">
                        <label>Auto-Start Date</label>
                        <input id="ns-auto-date" type="date">
                    </div>
                </div>
                <div class="form-actions">
                    <button class="btn btn-green" id="save-new-semester">${bxi('plus')} Create Semester</button>
                </div>
            </div>
        `;

        pageContent.querySelectorAll('.semester-activate-btn').forEach(b => b.addEventListener('click', () => {
            const semId = b.dataset.id;
            const sem = window.SemesterManager.getSemesterById(semId);
            if (confirm(`Activate "${sem.name} (${sem.schoolYear})"?`)) {
                window.SemesterManager.setActiveSemester(semId);
                showToast(`Activated: ${sem.name}`);
                renderSemester();
            }
        }));

        pageContent.querySelectorAll('.semester-complete-btn').forEach(b => b.addEventListener('click', () => {
            const semId = b.dataset.id;
            const sem = window.SemesterManager.getSemesterById(semId);
            if (confirm(`Mark "${sem.name}" as completed?`)) {
                window.SemesterManager.completeSemester(semId);
                showToast(`Completed: ${sem.name}`);
                renderSemester();
            }
        }));

        document.getElementById('ns-auto')?.addEventListener('change', e => {
            document.getElementById('ns-auto-date-group').style.display = e.target.checked ? 'block' : 'none';
        });

        document.getElementById('save-new-semester')?.addEventListener('click', () => {
            const year = document.getElementById('ns-year').value.trim();
            const name = document.getElementById('ns-name').value.trim();
            const start = document.getElementById('ns-start').value;
            const end = document.getElementById('ns-end').value;
            const payment = document.getElementById('ns-payment').value;
            const autoEnabled = document.getElementById('ns-auto').checked;
            const autoDate = document.getElementById('ns-auto-date').value;
            const desc = document.getElementById('ns-desc').value.trim();

            if (!year || !name || !start || !end || !payment) {
                showToast('Please fill in all required fields.', true);
                return;
            }

            if (autoEnabled && !autoDate) {
                showToast('Please specify auto-start date.', true);
                return;
            }

            const result = window.SemesterManager.createSemester({
                schoolYear: year,
                name: name,
                startDate: start,
                endDate: end,
                paymentDeadline: payment,
                autoStartEnabled: autoEnabled,
                autoStartDate: autoEnabled ? autoDate : null,
                description: desc
            });

            if (result) {
                showToast(`Created: ${year} ${name}`);
                document.getElementById('ns-year').value = '';
                document.getElementById('ns-name').value = '';
                document.getElementById('ns-start').value = '';
                document.getElementById('ns-end').value = '';
                document.getElementById('ns-payment').value = '';
                document.getElementById('ns-desc').value = '';
                document.getElementById('ns-auto').checked = false;
                document.getElementById('ns-auto-date').value = '';
                document.getElementById('ns-auto-date-group').style.display = 'none';
                renderSemester();
            } else {
                showToast('Failed to create semester.', true);
            }
        });
    }

    renderSemester();
});
