'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    function renderAudit() {
        if (!pageContent) return;

        const counts = { success: 0, info: 0, warning: 0, error: 0 };
        auditLogs.forEach(l => counts[l.type]++);

        const countCards = [
            { type: 'success', label: 'Successful Actions', cls: 'badge-green' },
            { type: 'info',    label: 'Info Events',        cls: 'badge-blue'  },
            { type: 'warning', label: 'Warnings',           cls: 'badge-amber' },
            { type: 'error',   label: 'Errors',             cls: 'badge-red'   },
        ];

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">Audit Logs</div>
                    <div class="section-sub">Track all system actions and changes</div>
                </div>
                <button class="btn btn-outline" id="export-log-btn">
                    ${bxi('download')} Export Log
                </button>
            </div>

            <div class="audit-count-grid">
                ${countCards.map(s => `
                <div class="audit-count-card badge ${s.cls}">
                    <div class="audit-count-value">${counts[s.type]}</div>
                    <div class="audit-count-label">${s.label}</div>
                </div>`).join('')}
            </div>

            <div id="audit-list">
                ${auditLogs.map(log => `
                <div class="audit-card">
                    <div class="audit-row">
                        <div class="audit-icon ${logTypeClass(log.type)}">${bxi(logTypeIcon(log.type))}</div>
                        <div class="audit-content">
                            <div class="audit-top-row">
                                <div class="audit-action-row">
                                    <span class="audit-action">${log.action}</span>
                                    <span class="badge ${logBadgeClass(log.type)}">${log.type.charAt(0).toUpperCase() + log.type.slice(1)}</span>
                                </div>
                                <span class="audit-time">${log.timestamp}</span>
                            </div>
                            <div class="audit-detail">${log.details}</div>
                            <div class="audit-meta">
                                <span>${bxi('user')} ${log.user} (${log.role})</span>
                                <span>${bxi('desktop')} ${log.ipAddress}</span>
                            </div>
                        </div>
                    </div>
                </div>`).join('')}
            </div>
        `;

        document.getElementById('export-log-btn')?.addEventListener('click', () =>
            showToast('Audit log exported as CSV.')
        );
    }

    renderAudit();
});
