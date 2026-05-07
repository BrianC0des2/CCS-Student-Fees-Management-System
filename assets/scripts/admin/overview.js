'use strict';

document.addEventListener('DOMContentLoaded', () => {
    const pageContent = document.getElementById('page-content');

    function renderOverview() {
        if (!pageContent) return;

        const activeFaculty  = facultyList.filter(f => f.status === 'active').length;
        const activeStudents = studentList.filter(s => s.status === 'active').length;
        const cleared        = studentList.filter(s => s.clearanceStatus === 'complete').length;
        const inProgress     = studentList.filter(s => s.clearanceStatus === 'in_progress').length;

        const systemStatuses = [
            { label: 'Database',            icon: 'data',        status: 'Operational' },
            { label: 'Payment Gateway',     icon: 'credit-card', status: 'Operational' },
            { label: 'Email Notifications', icon: 'envelope',    status: 'Operational' },
            { label: 'Clearance Module',    icon: 'clipboard',   status: 'Operational' },
            { label: 'Report Generator',    icon: 'bar-chart-alt-2', status: 'Maintenance' },
        ];

        const stats = [
            { label: 'Total Faculty',     value: activeFaculty,  sub: facultyList.length + ' total registered', cls: 'sib--green',   icon: 'group' },
            { label: 'Total Students',    value: activeStudents, sub: studentList.length + ' total enrolled',   cls: 'sib--blue',    icon: 'user-check' },
            { label: 'Cleared Students',  value: cleared,        sub: 'fully cleared this term',               cls: 'sib--emerald', icon: 'check-circle' },
            { label: 'Pending Clearance', value: inProgress,     sub: 'awaiting completion',                   cls: 'sib--amber',   icon: 'time-five' },
        ];

        pageContent.innerHTML = `
            <div class="section-header">
                <div>
                    <div class="section-title">System Overview</div>
                    <div class="section-sub">Manage all aspects of the WMSU CCS Student Fees Management System</div>
                </div>
            </div>

            <div class="stat-grid">
                ${stats.map(s => `
                <div class="stat-card">
                    <div class="stat-icon-box ${s.cls}">${bxi(s.icon)}</div>
                    <div class="stat-value">${s.value}</div>
                    <div class="stat-label">${s.label}</div>
                    <div class="stat-sub">${s.sub}</div>
                </div>`).join('')}
            </div>

            <div class="card" id="overview-quick-card">
                <div class="card-title">Quick Actions</div>
                <div class="quick-grid">
                    <button class="quick-btn qbtn--green" data-goto="faculty">${bxi('plus')} <span>Add Faculty</span></button>
                    <button class="quick-btn qbtn--blue"  data-goto="permissions">${bxi('key')} <span>Manage Permissions</span></button>
                    <button class="quick-btn qbtn--amber" data-goto="fees">${bxi('dollar-circle')} <span>Update Fees</span></button>
                    <button class="quick-btn qbtn--purple" data-goto="audit">${bxi('bar-chart-alt-2')} <span>View Audit Logs</span></button>
                </div>
            </div>

            <div class="two-col">
                <div class="card">
                    <div class="card-title">System Status</div>
                    ${systemStatuses.map(s => `
                    <div class="toggle-row">
                        <span class="text-dark">${bxi(s.icon)} ${s.label}</span>
                        <span class="badge ${s.status === 'Operational' ? 'badge-green' : 'badge-amber'}">${s.status}</span>
                    </div>`).join('')}
                </div>
                <div class="card">
                    <div class="card-title">Recent Activity</div>
                    ${auditLogs.slice(0, 5).map(log => `
                    <div class="recent-item">
                        <div class="recent-mini-icon ${logRecentClass(log.type)}">${bxi(logTypeIcon(log.type))}</div>
                        <div class="recent-mini-text">
                            <div class="recent-mini-title">${log.action}</div>
                            <div class="recent-mini-detail">${log.details}</div>
                            <div class="recent-mini-time">${log.timestamp}</div>
                        </div>
                    </div>`).join('')}
                </div>
            </div>
        `;
    }

    renderOverview();
});
