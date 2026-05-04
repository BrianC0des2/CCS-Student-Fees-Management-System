'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    function renderSystem() {
        if (!pageContent) return;

        const notifToggles = [
            { key: 'emailNotifications', label: 'Email Notifications',  desc: 'Send payment and clearance updates via email' },
            { key: 'smsNotifications',   label: 'SMS Notifications',    desc: 'Send SMS alerts for important deadlines' },
            { key: 'autoReminders',      label: 'Automatic Reminders',  desc: 'Auto-send reminders before payment due dates' },
        ];
        const secToggles = [
            { key: 'requireTwoFactor',      label: 'Two-Factor Authentication', desc: 'Require 2FA for all admin accounts',                    danger: false },
            { key: 'allowNewRegistrations', label: 'Allow New Registrations',   desc: 'Allow new students to self-register',                    danger: false },
            { key: 'maintenanceMode',       label: 'Maintenance Mode',          desc: 'Temporarily disable access for non-admin users',        danger: true },
        ];

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">System Settings</div>
                    <div class="section-sub">Configure global system preferences and behavior</div>
                </div>
            </div>

            <div class="settings-card">
                <div class="settings-card-title">${bxi('cog')} General</div>
                <div class="form-grid">
                    <div class="form-group">
                        <label>System Name</label>
                        <input id="sys-name" value="${systemSettings.systemName}">
                    </div>
                    <div class="form-group">
                        <label>Academic Year</label>
                        <input id="sys-year" value="${systemSettings.academicYear}">
                    </div>
                    <div class="form-group">
                        <label>Current Semester</label>
                        <select id="sys-sem">
                            <option${systemSettings.semester === '1st Semester' ? ' selected' : ''}>1st Semester</option>
                            <option${systemSettings.semester === '2nd Semester' ? ' selected' : ''}>2nd Semester</option>
                            <option${systemSettings.semester === 'Summer'       ? ' selected' : ''}>Summer</option>
                        </select>
                    </div>
                    <div class="form-group">
                        <label>Payment Grace Period (days)</label>
                        <input id="sys-grace" type="number" value="${systemSettings.paymentGracePeriod}">
                    </div>
                </div>
            </div>

            <div class="settings-card">
                <div class="settings-card-title">${bxi('bell')} Notifications</div>
                ${notifToggles.map(item => `
                <div class="toggle-row">
                    <div>
                        <div class="toggle-label">${item.label}</div>
                        <div class="toggle-desc">${item.desc}</div>
                    </div>
                    <button class="toggle-switch ${systemSettings[item.key] ? 'toggle-switch--on' : 'toggle-switch--off'} sys-toggle"
                        data-key="${item.key}">
                        <div class="toggle-knob"></div>
                    </button>
                </div>`).join('')}
            </div>

            <div class="settings-card">
                <div class="settings-card-title">${bxi('shield')} Security &amp; Access</div>
                ${secToggles.map(item => `
                <div class="toggle-row${item.danger && systemSettings[item.key] ? ' toggle-row--maintenance' : ''}">
                    <div>
                        <div class="toggle-label${item.danger && systemSettings[item.key] ? ' toggle-label--danger' : ''}">${item.label}</div>
                        <div class="toggle-desc">${item.desc}</div>
                    </div>
                    <button class="toggle-switch ${systemSettings[item.key] ? (item.danger ? 'toggle-switch--maintenance' : 'toggle-switch--on') : 'toggle-switch--off'} sys-toggle"
                        data-key="${item.key}">
                        <div class="toggle-knob"></div>
                    </button>
                </div>`).join('')}
            </div>

            <div class="danger-zone">
                <div class="danger-zone-title">${bxi('error-circle')} Danger Zone</div>
                <div class="danger-row">
                    <div>
                        <div class="danger-row-title">Reset All Student Clearances</div>
                        <div class="danger-row-sub">Reset all clearance statuses to Not Started for the new term</div>
                    </div>
                    <button class="btn-danger-outline" id="reset-clearance-btn">
                        ${bxi('refresh')} Reset
                    </button>
                </div>
                <div class="danger-row">
                    <div>
                        <div class="danger-row-title">Export All System Data</div>
                        <div class="danger-row-sub">Download a full backup of all students, payments, and clearance records</div>
                    </div>
                    <button class="btn-danger-outline" id="export-all-btn">
                        ${bxi('download')} Export
                    </button>
                </div>
            </div>

            <div class="settings-card">
                <div class="settings-card-title">${bxi('palette')} Appearance</div>
                <div class="toggle-row">
                    <div>
                        <div class="toggle-label">Theme &amp; Font</div>
                        <div class="toggle-desc">Switch between Light and Dark theme, or enable the dyslexia-friendly font</div>
                    </div>
                    <button class="btn btn-outline" id="open-appearance-btn">
                        ${bxi('cog')} Customize
                    </button>
                </div>
            </div>

            <div class="settings-save-row">
                <button class="btn btn-green" id="save-system-btn">
                    ${bxi('save')} Save Settings
                </button>
            </div>
        `;

        pageContent.querySelectorAll('.sys-toggle').forEach(btn => btn.addEventListener('click', () => {
            systemSettings[btn.dataset.key] = !systemSettings[btn.dataset.key];
            renderSystem();
        }));
        document.getElementById('save-system-btn')?.addEventListener('click', () => {
            systemSettings.systemName         = document.getElementById('sys-name').value;
            systemSettings.academicYear       = document.getElementById('sys-year').value;
            systemSettings.semester           = document.getElementById('sys-sem').value;
            systemSettings.paymentGracePeriod = parseInt(document.getElementById('sys-grace').value) || 7;
            showToast('System settings saved successfully.');
        });
        document.getElementById('reset-clearance-btn')?.addEventListener('click', () =>
            showToast('Clearance reset scheduled. This will take effect at midnight.')
        );
        document.getElementById('export-all-btn')?.addEventListener('click', () =>
            showToast("Export queued. You'll receive a download link via email.")
        );
        document.getElementById('open-appearance-btn')?.addEventListener('click', () => {
            if (typeof window.openSettingsPanel === 'function') window.openSettingsPanel();
        });
    }

    renderSystem();
});
