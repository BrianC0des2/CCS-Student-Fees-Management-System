'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');
    let modalStyleInjected = false;

    function injectModalStyles() {
        if (modalStyleInjected) return;
        modalStyleInjected = true;

        const style = document.createElement('style');
        style.textContent = `
            @keyframes semesterModalSlideUp {
                from { opacity: 0; transform: translateY(24px); }
                to   { opacity: 1; transform: translateY(0); }
            }
        `;
        document.head.appendChild(style);
    }

    function formatPaymentWindow(startDate, endDate) {
        if (!startDate || !endDate) return '—';
        const start = new Date(startDate + 'T00:00:00');
        const end   = new Date(endDate   + 'T00:00:00');
        const fmt = d => d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
        return `${fmt(start)} → ${fmt(end)}`;
    }

    function normalizeDateMidnight(value) {
        const date = new Date(value);
        date.setHours(0, 0, 0, 0);
        return date;
    }

    function isExpiredSemester(semester) {
        if (!semester || !semester.endDate) return false;
        return normalizeDateMidnight(semester.endDate + 'T00:00:00') < normalizeDateMidnight(new Date());
    }

    function getStatusMeta(semester) {
        const expired   = isExpiredSemester(semester);
        const completed = semester.status === 'completed';
        const active    = semester.status === 'active';

        if (expired && !active && !completed) {
            return { statusBadge: '<span class="badge badge-gray">Expired</span>', action: '—' };
        }
        if (completed) {
            return { statusBadge: '<span class="badge badge-gray">Completed</span>', action: '—' };
        }
        if (active) {
            return {
                statusBadge: '<span class="badge badge-green">Active</span>',
                action: `<button class="btn btn-amber semester-complete-btn" data-id="${semester.id}" style="font-size:12px;padding:6px 12px;">${bxi('check-double')} Complete</button>`
            };
        }
        return {
            statusBadge: '<span class="badge badge-amber">Inactive</span>',
            action: `<button class="btn btn-green semester-activate-btn" data-id="${semester.id}" style="font-size:12px;padding:6px 12px;">${bxi('check')} Activate</button>`
        };
    }

    function openConfirmModal(options) {
        injectModalStyles();

        const existing = document.getElementById('semester-confirm-modal-root');
        if (existing) existing.remove();

        const root = document.createElement('div');
        root.id = 'semester-confirm-modal-root';
        root.innerHTML = `
            <div class="semester-confirm-overlay" style="position:fixed;inset:0;background:rgba(17,24,39,0.65);display:flex;align-items:center;justify-content:center;z-index:9999;padding:20px;">
                <div class="semester-confirm-card" style="background:#ffffff;border-radius:12px;width:min(560px,100%);box-shadow:0 24px 60px rgba(0,0,0,0.18);animation:semesterModalSlideUp 0.18s ease-out;overflow:hidden;font-family:Poppins,sans-serif;">
                    <div style="padding:24px;">
                        <div style="font-size:20px;font-weight:600;color:#111827;margin-bottom:16px;">${options.title}</div>
                        <div style="font-size:14px;line-height:1.7;color:#374151;white-space:normal;">${options.body}</div>
                    </div>
                    <div style="padding:0 24px 24px;display:flex;gap:12px;justify-content:flex-end;">
                        <button type="button" class="btn btn-gray semester-confirm-cancel" style="font-size:14px;padding:8px 16px;">Cancel</button>
                        <button type="button" class="btn btn-${options.confirmColor} semester-confirm-ok" style="font-size:14px;padding:8px 16px;">${options.confirmText}</button>
                    </div>
                </div>
            </div>
        `;

        document.body.appendChild(root);

        const overlay   = root.querySelector('.semester-confirm-overlay');
        const cancelBtn = root.querySelector('.semester-confirm-cancel');
        const okBtn     = root.querySelector('.semester-confirm-ok');
        const close     = () => root.remove();

        cancelBtn.addEventListener('click', close);
        okBtn.addEventListener('click', () => { options.onConfirm(); close(); });
        overlay.addEventListener('click', e => { if (e.target === overlay) close(); });
    }

    // ─── Validation helpers ───────────────────────────────────────────────────

    function parseLocalDate(str) {
        // Avoid timezone shift by treating as local midnight
        return str ? new Date(str + 'T00:00:00') : null;
    }

    function validateSemesterDates(paymentStart, paymentDeadline, semStart, semEnd) {
        const ps  = parseLocalDate(paymentStart);
        const pd  = parseLocalDate(paymentDeadline);
        const ss  = parseLocalDate(semStart);
        const se  = parseLocalDate(semEnd);

        if (!ps || !pd || !ss || !se) {
            return 'Please fill in all required date fields.';
        }

        // Payment window must be before semester starts
        if (ps >= ss) {
            return 'Payment Window Start Date must be before the Semester Start Date.';
        }
        if (pd > ss) {
            return 'Payment Deadline must be on or before the Semester Start Date.';
        }
        // Payment window internal order
        if (ps >= pd) {
            return 'Payment Window Start Date must be before the Payment Deadline.';
        }
        // Semester dates
        if (ss >= se) {
            return 'Semester Start Date must be before the Semester End Date.';
        }

        return null; // no error
    }

    // ─── Render ───────────────────────────────────────────────────────────────

    function renderSemester() {
        if (!pageContent) return;

        const semesters = window.SemesterManager.getAllSemesters();
        const current   = window.SemesterManager.getCurrentSemester();
        const years     = ['2023-2024','2024-2025','2025-2026','2026-2027','2027-2028','2028-2029'];

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Semester Management</div>
                    <div class="section-sub">Manage academic semesters and schedule transitions</div>
                </div>
            </div>

            <!-- Active Semester Card -->
            <div class="card" style="margin-bottom:24px;">
                <div class="card-title">Active Semester</div>
                ${current ? `
                    <div style="padding:16px;background:#f0fdf4;border-radius:8px;border-left:4px solid #16a34a;">
                        <div style="display:grid;grid-template-columns:1fr 1fr;gap:16px;">
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">School Year</div>
                                <div style="font-size:16px;font-weight:600;color:#111827;margin-top:4px;">${current.schoolYear}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Semester</div>
                                <div style="font-size:16px;font-weight:600;color:#111827;margin-top:4px;">${current.name}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Payment Window Opens</div>
                                <div style="font-size:14px;color:#111827;margin-top:4px;">${window.SemesterManager.formatDate(current.paymentStartDate)}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Payment Deadline</div>
                                <div style="font-size:14px;color:#111827;margin-top:4px;">${window.SemesterManager.formatDate(current.paymentDeadline)}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Semester Start Date</div>
                                <div style="font-size:14px;color:#111827;margin-top:4px;">${window.SemesterManager.formatDate(current.startDate)}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Semester End Date</div>
                                <div style="font-size:14px;color:#111827;margin-top:4px;">${window.SemesterManager.formatDate(current.endDate)}</div>
                            </div>
                            <div>
                                <div style="font-size:12px;color:#6b7280;text-transform:uppercase;letter-spacing:0.3px;">Days Until Payment Deadline</div>
                                <div style="font-size:14px;font-weight:600;color:${window.SemesterManager.daysUntilDeadline(current) <= 7 ? '#dc2626' : '#16a34a'};margin-top:4px;">${window.SemesterManager.daysUntilDeadline(current)} days</div>
                            </div>
                        </div>
                    </div>
                ` : `
                    <div style="padding:16px;text-align:center;color:#6b7280;background:#f3f4f6;border-radius:8px;">
                        No semester is currently active. The navbar badge will not appear on any page until you activate a semester below.
                    </div>
                `}
            </div>

            <!-- All Semesters Table -->
            <div class="card">
                <div class="card-title">All Semesters</div>
                <div style="overflow-x:auto;">
                    ${semesters.length === 0 ? `
                        <div style="padding:32px;text-align:center;color:#6b7280;">
                            No semesters created yet. Use the form below to create one.
                        </div>
                    ` : `
                    <table style="width:100%;border-collapse:collapse;">
                        <thead>
                            <tr style="border-bottom:2px solid #e5e7eb;background:#f9fafb;">
                                <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">School Year</th>
                                <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Semester</th>
                                <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Status</th>
                                <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Payment Window</th>
                                <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Sem Start</th>
                                <th style="padding:12px;text-align:left;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Sem End</th>
                                <th style="padding:12px;text-align:center;font-size:12px;font-weight:600;text-transform:uppercase;letter-spacing:0.3px;color:#6b7280;">Actions</th>
                            </tr>
                        </thead>
                        <tbody>
                            ${semesters.map(sem => {
                                const meta = getStatusMeta(sem);
                                const paymentWindow = formatPaymentWindow(sem.paymentStartDate, sem.paymentDeadline);
                                return `
                                <tr style="border-bottom:1px solid #e5e7eb;${sem.status === 'active' ? 'background:#f0fdf4;' : ''}">
                                    <td style="padding:12px;font-size:13px;color:#111827;">${sem.schoolYear}</td>
                                    <td style="padding:12px;font-size:13px;color:#111827;font-weight:500;">${sem.name}</td>
                                    <td style="padding:12px;text-align:center;">${meta.statusBadge}</td>
                                    <td style="padding:12px;font-size:13px;color:#6b7280;">${paymentWindow}</td>
                                    <td style="padding:12px;font-size:13px;color:#6b7280;">${window.SemesterManager.formatDate(sem.startDate)}</td>
                                    <td style="padding:12px;font-size:13px;color:#6b7280;">${window.SemesterManager.formatDate(sem.endDate)}</td>
                                    <td style="padding:12px;text-align:center;">${meta.action}</td>
                                </tr>
                                `;
                            }).join('')}
                        </tbody>
                    </table>
                    `}
                </div>
            </div>

            <!-- Create New Semester Form -->
            <div class="card" style="margin-top:24px;">
                <div class="card-title">Create New Semester</div>
                <div style="background:#fef9c3;border:1px solid #fde047;border-radius:8px;padding:12px 16px;margin-bottom:20px;font-size:13px;color:#854d0e;line-height:1.6;">
                    <strong>Date rules:</strong> The payment window (clearance week) must happen <em>before</em> the semester starts.
                    Set the payment window open and deadline dates first, then the semester start and end dates.
                </div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>School Year *</label>
                        <select id="ns-year">
                            <option value="">Select school year</option>
                            ${years.map(y => `<option value="${y}">${y}</option>`).join('')}
                        </select>
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
                        <label>Payment Window Start Date *</label>
                        <input id="ns-payment-start" type="date">
                        <small style="color:#6b7280;font-size:11px;">When students can start paying (clearance week begins)</small>
                    </div>
                    <div class="form-group">
                        <label>Payment Deadline *</label>
                        <input id="ns-payment" type="date">
                        <small style="color:#6b7280;font-size:11px;">Last day students can pay (clearance week ends)</small>
                    </div>
                    <div class="form-group">
                        <label>Semester Start Date *</label>
                        <input id="ns-start" type="date">
                        <small style="color:#6b7280;font-size:11px;">When the semester officially begins (must be after payment deadline)</small>
                    </div>
                    <div class="form-group">
                        <label>Semester End Date *</label>
                        <input id="ns-end" type="date">
                        <small style="color:#6b7280;font-size:11px;">When the semester officially ends</small>
                    </div>
                    <div class="form-group" style="grid-column:1 / -1;">
                        <label>Description</label>
                        <input id="ns-desc" placeholder="e.g. First semester of AY 2026-2027">
                    </div>
                    <div class="form-group" style="grid-column:1 / -1;">
                        <label style="display:flex;align-items:center;gap:8px;font-weight:normal;">
                            <input type="checkbox" id="ns-auto" style="width:18px;height:18px;cursor:pointer;">
                            Enable auto-start on specific date
                        </label>
                    </div>
                    <div class="form-group" id="ns-auto-date-group" style="display:none;">
                        <label>Auto-Start Date</label>
                        <input id="ns-auto-date" type="date">
                    </div>
                </div>
                <div id="semester-form-error" style="display:none;margin-top:12px;padding:10px 14px;background:#fee2e2;border:1px solid #fca5a5;border-radius:8px;color:#991b1b;font-size:13px;"></div>
                <div class="form-actions">
                    <button class="btn btn-green" id="save-new-semester">${bxi('plus')} Create Semester</button>
                </div>
            </div>
        `;

        // ── Activate buttons ──────────────────────────────────────────────────
        pageContent.querySelectorAll('.semester-activate-btn').forEach(button => {
            button.addEventListener('click', () => {
                const semesterId = button.dataset.id;
                const semester   = window.SemesterManager.getSemesterById(semesterId);
                const current    = window.SemesterManager.getCurrentSemester();

                let body = `
                    <div><strong>Semester:</strong> ${semester.name}</div>
                    <div><strong>School Year:</strong> ${semester.schoolYear}</div>
                    <div><strong>Payment Window:</strong> ${window.SemesterManager.formatDate(semester.paymentStartDate)} → ${window.SemesterManager.formatDate(semester.paymentDeadline)}</div>
                    <div><strong>Semester Period:</strong> ${window.SemesterManager.formatDate(semester.startDate)} → ${window.SemesterManager.formatDate(semester.endDate)}</div>
                    <div style="margin-top:12px;color:#dc2626;font-weight:500;">This will update the navbar badge across all pages and open the student payment window on the set date.</div>
                `;

                if (current && current.id !== semesterId) {
                    body += `<div style="margin-top:8px;color:#374151;">This will also mark <strong>${current.name} (S.Y. ${current.schoolYear})</strong> as Completed.</div>`;
                }

                openConfirmModal({
                    title: 'Activate Semester?',
                    body,
                    confirmText: 'Activate',
                    confirmColor: 'green',
                    onConfirm: () => {
                        window.SemesterManager.setActiveSemester(semesterId);
                        setSchoolYear();
                        showToast(`Activated: ${semester.name} (S.Y. ${semester.schoolYear})`);
                        renderSemester();
                    }
                });
            });
        });

        // ── Complete buttons ──────────────────────────────────────────────────
        pageContent.querySelectorAll('.semester-complete-btn').forEach(button => {
            button.addEventListener('click', () => {
                const semesterId = button.dataset.id;
                const semester   = window.SemesterManager.getSemesterById(semesterId);

                openConfirmModal({
                    title: 'Mark as Completed?',
                    body: `
                        <div><strong>Semester:</strong> ${semester.name}</div>
                        <div><strong>School Year:</strong> ${semester.schoolYear}</div>
                        <div style="margin-top:12px;color:#dc2626;font-weight:500;">This cannot be undone. The navbar badge will disappear and no students will be able to pay under this semester.</div>
                    `,
                    confirmText: 'Complete',
                    confirmColor: 'amber',
                    onConfirm: () => {
                        window.SemesterManager.completeSemester(semesterId);
                        setSchoolYear();
                        showToast(`Completed: ${semester.name}`);
                        renderSemester();
                    }
                });
            });
        });

        // ── Auto-start toggle ─────────────────────────────────────────────────
        document.getElementById('ns-auto')?.addEventListener('change', e => {
            document.getElementById('ns-auto-date-group').style.display = e.target.checked ? 'block' : 'none';
        });

        // ── Create Semester ───────────────────────────────────────────────────
        document.getElementById('save-new-semester')?.addEventListener('click', () => {
            const year         = document.getElementById('ns-year').value.trim();
            const name         = document.getElementById('ns-name').value.trim();
            const paymentStart = document.getElementById('ns-payment-start').value;
            const payment      = document.getElementById('ns-payment').value;
            const start        = document.getElementById('ns-start').value;
            const end          = document.getElementById('ns-end').value;
            const autoEnabled  = document.getElementById('ns-auto').checked;
            const autoDate     = document.getElementById('ns-auto-date').value;
            const desc         = document.getElementById('ns-desc').value.trim();
            const errorEl      = document.getElementById('semester-form-error');

            function showError(msg) {
                errorEl.textContent = msg;
                errorEl.style.display = 'block';
                errorEl.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
            }

            errorEl.style.display = 'none';

            if (!year || !name || !paymentStart || !payment || !start || !end) {
                showError('Please fill in all required fields.');
                return;
            }

            if (autoEnabled && !autoDate) {
                showError('Please specify auto-start date.');
                return;
            }

            const validationError = validateSemesterDates(paymentStart, payment, start, end);
            if (validationError) {
                showError(validationError);
                return;
            }

            // Confirmation modal before creating
            openConfirmModal({
                title: 'Create Semester?',
                body: `
                    <div><strong>School Year:</strong> ${year}</div>
                    <div><strong>Semester:</strong> ${name}</div>
                    <div><strong>Payment Window:</strong> ${window.SemesterManager.formatDate(paymentStart)} → ${window.SemesterManager.formatDate(payment)}</div>
                    <div><strong>Semester Period:</strong> ${window.SemesterManager.formatDate(start)} → ${window.SemesterManager.formatDate(end)}</div>
                    ${desc ? `<div><strong>Description:</strong> ${desc}</div>` : ''}
                    <div style="margin-top:12px;color:#6b7280;font-size:13px;">The semester will be created as Inactive. Activate it when you are ready to open the payment window.</div>
                `,
                confirmText: 'Create Semester',
                confirmColor: 'green',
                onConfirm: () => {
                    const result = window.SemesterManager.createSemester({
                        schoolYear: year,
                        name,
                        startDate: start,
                        endDate: end,
                        paymentStartDate: paymentStart,
                        paymentDeadline: payment,
                        autoStartEnabled: autoEnabled,
                        autoStartDate: autoEnabled ? autoDate : null,
                        description: desc
                    });

                    if (result) {
                        showToast(`Created: ${year} ${name}`);
                        // Reset form
                        ['ns-year','ns-name','ns-payment-start','ns-payment','ns-start','ns-end','ns-desc','ns-auto-date'].forEach(id => {
                            const el = document.getElementById(id);
                            if (el) el.value = '';
                        });
                        document.getElementById('ns-auto').checked = false;
                        document.getElementById('ns-auto-date-group').style.display = 'none';
                        renderSemester();
                    } else {
                        showError('A semester with this school year and name already exists.');
                    }
                }
            });
        });
    }

    renderSemester();
});